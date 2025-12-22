import type { Token } from "./tokens";
import { TokenType } from "./tokens";
import type {
    Expression,
    NumberLiteral,
    StringLiteral,
    Placeholder,
} from "./ast.ts";

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

function parseNumber(state: State): NumberLiteral | StringLiteral {
    const token = state.tokens[state.i] ?? null;

    if (
        token &&
        (token.type === TokenType.Comma ||
            token.type === TokenType.Semicolon ||
            token.type === TokenType.RBracket ||
            token.type === TokenType.LBracket)
    ) {
        consumeToken(state);
        return {
            kind: "StringLiteral",
            value: token.value,
            start: token.start,
            end: token.end,
        };
    }

    if (!token || token.type != TokenType.Number) {
        state.errors.push("Expected Number");
        return {
            kind: "NumberLiteral",
            value: 0,
            start: token ? token.start : 0,
            end: token ? token.end : 0,
        };
    }

    consumeToken(state);
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
        return parseNumber(state);
    }
    const start = token.start;
    if (token.type == TokenType.Number) return parseNumber(state);
    if (token.type == TokenType.LParen) {
        consumeToken(state);
        const expr = parseExpr(state);
        if (expr.start == 0 && expr.end == 0) {
            expr.start = token.end;
            expr.end = token.end;
        }
        const next = state.tokens[state.i] ?? null;
        if (!next || next.type != TokenType.RParen) {
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
    return parseNumber(state);
}

function parseExp(state: State): Expression {
    let left = parseParen(state);
    while (true) {
        const token = state.tokens[state.i] ?? null;
        if (!token || token.type != TokenType.Exp) break;
        consumeToken(state);
        const right = parseParen(state);
        const start = left.start;
        const end = right.end === 0 ? token.end : right.end;

        left = {
            kind: "ExpExpression",
            left,
            right,
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
            left.value === "]" ||
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

function parseMatrix(state: State): Expression {
    const token = state.tokens[state.i] ?? null;
    if (!token || token.type != TokenType.LBracket) {
        return parseAddSub(state);
    }

    const exprs: Expression[] = [];
    while (true) {
        const expr = parseAddSub(state);
        exprs.push(expr);
        if (
            state.i >= state.tokens.length ||
            (expr.kind === "StringLiteral" && expr.value === "]")
        )
            break;
    }

    const matrix = [[]];
    const exprsEnd =
        exprs[exprs.length - 1].value === "]" ? exprs.length - 1 : exprs.length;
    let expectingExpr = true;
    for (let i = 1; i < exprsEnd; i++) {
        const currExpr = exprs[i];
        if (currExpr.kind !== "StringLiteral") {
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

function parseExpr(state: State): Expression {
    return parseMatrix(state);
}

export function parse(tokens: Token[]): {
    expr: Expression;
    errors: string[];
} {
    const state: State = { tokens, i: 0, errors: [] };
    const expr = parseExpr(state);
    return { expr, errors: state.errors };
}
