import type { Token } from "./tokens";
import { TokenType } from "./tokens";
import type { Expression, Literal, ParenExpression } from "./ast.ts";

type State = {
    tokens: Token[];
    i: number;
    errors: string[];
};

function consumeToken(state: State): Token | null {
    const token = state.tokens[state.i] ?? null;
    if (token) state.i++;
    return token;
}

function parseLiteral(state: State): Literal {
    const token = consumeToken(state);
    if (!token) {
        state.errors.push("Expected Number");
        return {
            kind: "NumberLiteral",
            value: 0,
            start: 0,
            end: 0,
        };
    }
    if (token.type == TokenType.Char) {
        return {
            kind: "CharLiteral",
            value: token.value,
            start: token.start,
            end: token.end,
        };
    }
    return {
        kind: "NumberLiteral",
        value: parseFloat(token.value),
        start: token.start,
        end: token.end,
    };
}

function parseParen(state: State): Expression {
    const token = state.tokens[state.i] ?? null;
    if (!token) {
        state.errors.push("Expected Input");
        return parseLiteral(state);
    }
    const start = token.start;
    if (token.type == TokenType.Number) return parseLiteral(state);
    if (token.type == TokenType.Char && token.value == "(") {
        consumeToken(state);
        const expr = parseExpr(state);
        if (expr.start == 0 && expr.end == 0) {
            expr.start = token.end;
            expr.end = token.end;
        }
        const next = state.tokens[state.i] ?? null;
        if (!next || next.type != TokenType.Char || next.value != ")") {
            state.errors.push("Expected RParen");
            return {
                kind: "ParenExpression",
                expr,
                start,
                end: expr.end,
            };
        }
        consumeToken(state);
        return {
            kind: "ParenExpression",
            expr,
            start,
            end: next.end ? next.end : expr.end,
        };
    }
    state.errors.push("Expected LParen");
    return parseLiteral(state);
}

function parseMatrix(state: State): Expression {
    const token = state.tokens[state.i] ?? null;
    if (!token || token.type != TokenType.Char || token.value != "[") {
        return parseParen(state);
    }
    const exprs: Expression[] = [];
    while (true) {
        const expr = parseParen(state);
        exprs.push(expr);
        if (
            state.i >= state.tokens.length ||
            (expr.kind === "CharLiteral" && expr.value === "]")
        )
            break;
    }
    const matrix = [[]];
    const exprsEnd =
        exprs[exprs.length - 1].value === "]" ? exprs.length - 1 : exprs.length;
    let expectingExpr = true;
    for (let i = 1; i < exprsEnd; i++) {
        const currExpr = exprs[i];
        if (currExpr.kind !== "CharLiteral") {
            if (expectingExpr) {
                matrix[matrix.length - 1].push(currExpr);
                expectingExpr = false;
            }
            continue;
        }
        if (currExpr.value === ",") {
            if (expectingExpr) {
                matrix[matrix.length - 1].push({
                    kind: "Placeholder",
                    pos: currExpr.start,
                });
            }
            expectingExpr = true;
            continue;
        }
        if (currExpr.value === ";") {
            if (expectingExpr) {
                matrix[matrix.length - 1].push({
                    kind: "Placeholder",
                    pos: currExpr.start,
                });
            }
            matrix.push([]);
            expectingExpr = true;
        }
    }
    if (expectingExpr) {
        matrix[matrix.length - 1].push({
            kind: "Placeholder",
            pos:
                exprs[exprs.length - 1].value === "]"
                    ? exprs[exprs.length - 1].start
                    : exprs[exprs.length - 1].end,
        });
    }

    return {
        kind: "MatrixExpression",
        matrix,
        start: token.start,
        end:
            exprs[exprs.length - 1].value === "]"
                ? exprs[exprs.length - 1].end
                : exprs[exprs.length - 1].end + 1,
    };
}

function parseExp(state: State): Expression {
    let left = parseMatrix(state);
    while (true) {
        const token = state.tokens[state.i] ?? null;
        if (!token || token.type != TokenType.Exp) break;
        consumeToken(state);
        const right = parseMatrix(state);
        console.log("right.end", right.end);
        console.log("right", right);
        console.log("token.end", token.end);

        const start = left.start;
        const end = right.end === 0 ? token.end : right.end;
        console.log("end", end);

        left = {
            kind: "ExpExpression",
            left,
            right:
                right.start === right.end
                    ? { kind: "Placeholder", pos: token.end }
                    : right,
            start,
            end,
        };
    }
    return left;
}

function parseMultDiv(state: State): Expression {
    let left = parseExp(state);

    while (true) {
        const token = state.tokens[state.i] ?? null;
        if (
            !token ||
            left.kind === "CharLiteral" ||
            (token.type != TokenType.Mult && token.type != TokenType.Div)
        )
            break;

        consumeToken(state);
        const right = parseExp(state);
        if (right.start === 0 && right.end === 0) {
            right.start = token.end;
            right.end = token.end;
        }
        const start = left.start;
        const end = right.end === 0 ? token.end : right.end;

        left = {
            kind: "BinaryExpression",
            op: token.type == TokenType.Mult ? "*" : "/",
            left,
            right,
            start,
            end,
        };
    }
    return left;
}

function parseAddSub(state: State): Expression {
    let left = parseMultDiv(state);
    while (true) {
        const token = state.tokens[state.i] ?? null;
        if (
            !token ||
            left.kind === "CharLiteral" ||
            (token.type != TokenType.Add && token.type != TokenType.Sub)
        )
            break;
        const opStart = token.start;
        const opEnd = token.end;
        consumeToken(state);
        const right = parseMultDiv(state);
        if (right.start === 0 && right.end === 0) {
            right.start = token.end;
            right.end = token.end;
        }
        const start = left.start;
        const end = right.end;

        left = {
            kind: "BinaryExpression",
            op: token.type == TokenType.Add ? "+" : "-",
            opStart,
            opEnd,
            left,
            right,
            start,
            end,
        };
    }
    return left;
}

function parseExpr(state: State): Expression {
    return parseAddSub(state);
}

export function parse(tokens: Token[]): {
    expr: Expression;
    errors: string[];
} {
    const state: State = { tokens, i: 0, errors: [] };
    const expr = parseExpr(state);
    return { expr, errors: state.errors };
}
