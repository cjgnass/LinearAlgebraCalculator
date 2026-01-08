import type { Token } from "./tokens";
import { TokenType } from "./tokens";
import type { Expression, Literal } from "./ast.ts";

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
  if (token.type == TokenType.Sub) {
    const next = consumeToken(state);
    if (!next) {
      return {
        kind: "NumberLiteral",
        value: parseFloat(token.value),
        start: token.start,
        end: token.end,
      };
    }

    return {
      kind: "NumberLiteral",
      value: -next.value,
      start: token.start,
      end: next.end,
    }

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
  const matrix: Expression[][] = [[]];
  const exprsEnd =
    (exprs[exprs.length - 1] as Literal).value === "]"
      ? exprs.length - 1
      : exprs.length;
  let expectingExpr = true;
  const markInvalidElement = (end: number) => {
    const row = matrix[matrix.length - 1];
    const last = row[row.length - 1];
    if (!last) return;
    if (last.kind === "CharLiteral") {
      last.end = end;
      return;
    }
    row[row.length - 1] = {
      kind: "CharLiteral",
      value: "",
      start: last.start,
      end,
    };
  };
  for (let i = 1; i < exprsEnd; i++) {
    const currExpr = exprs[i];
    if (currExpr.kind === "CharLiteral") {
      if (currExpr.value === ",") {
        if (expectingExpr) {
          matrix[matrix.length - 1].push({
            kind: "Placeholder",
            start: currExpr.start,
            end: currExpr.start + 1,
          });
        }
        expectingExpr = true;
        continue;
      }
      if (currExpr.value === ";") {
        if (expectingExpr) {
          matrix[matrix.length - 1].push({
            kind: "Placeholder",
            start: currExpr.start,
            end: currExpr.start + 1,
          });
        }
        matrix.push([]);
        expectingExpr = true;
        continue;
      }
      if (expectingExpr) {
        matrix[matrix.length - 1].push(currExpr);
        expectingExpr = false;
      } else {
        markInvalidElement(currExpr.end);
      }
      continue;
    }
    if (expectingExpr) {
      matrix[matrix.length - 1].push(currExpr);
      expectingExpr = false;
    } else {
      markInvalidElement(currExpr.end);
    }
  }
  if (expectingExpr) {
    const pos =
      (exprs[exprs.length - 1] as Literal).value === "]"
        ? exprs[exprs.length - 1].start
        : exprs[exprs.length - 1].end;
    matrix[matrix.length - 1].push({
      kind: "Placeholder",
      start: pos,
      end: pos + 1,
    });
  }

  return {
    kind: "MatrixExpression",
    matrix,
    start: token.start,
    end:
      (exprs[exprs.length - 1] as Literal).value === "]"
        ? exprs[exprs.length - 1].end
        : exprs[exprs.length - 1].end + 1,
  };
}

function parseDotCross(state: State): Expression {
  let left = parseMatrix(state);
  while (true) {
    const token = state.tokens[state.i] ?? null;
    if (!token) break;
    if (token.type != TokenType.Dot && token.type != TokenType.Cross) break;
    consumeToken(state);
    const right = parseMatrix(state);
    if (right.start === 0 && right.end === 0) {
      right.start = token.end;
      right.end = token.end;
    }
    const start = left.start;
    const end = right.end;
    left = {
      kind: "BinaryExpression",
      op: token.type === TokenType.Dot ? "." : "x",
      opStart: token.start,
      opEnd: token.end,
      left,
      right,
      start,
      end,
    };
  }
  return left;
}

function parseExp(state: State): Expression {
  let left = parseDotCross(state);
  while (true) {
    const token = state.tokens[state.i] ?? null;
    if (!token || token.type != TokenType.Exp) break;
    consumeToken(state);
    const right = parseDotCross(state);

    const start = left.start;
    const end = right.end === 0 ? token.end : right.end;

    left = {
      kind: "BinaryExpression",
      op: "^",
      opStart: token.start,
      opEnd: token.end,
      left,
      right:
        right.start === right.end
          ? {
            kind: "Placeholder",
            start: token.end,
            end: token.end + 1,
          }
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
      opStart: token.start,
      opEnd: token.end,
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
} {
  const state: State = { tokens, i: 0, errors: [] };
  const expr = parseExpr(state);
  return { expr };
}
