export type MatrixExpression = {
    kind: "MatrixExpression";
    matrix: Expression[][];
    start: number;
    end: number;
};

export type BinaryExpression = {
    kind: "BinaryExpression";
    op: "+" | "-" | "*" | "/";
    opStart: number;
    opEnd: number;
    left: Expression;
    right: Expression;
    start: number;
    end: number;
};

export type ExpExpression = {
    kind: "ExpExpression";
    left: Expression;
    right: Expression;
    start: number;
    end: number;
};

export type ParenExpression = {
    kind: "ParenExpression";
    expr: Expression;
    start: number;
    end: number;
};

export type NumberLiteral = {
    kind: "NumberLiteral";
    value: number;
    start: number;
    end: number;
};

export type StringLiteral = {
    kind: "StringLiteral";
    value: string;
    start: number;
    end: number;
};

export type Placeholder = {
    kind: "Placeholder";
    pos: number;
};

export type Expression =
    | {
          expr: Expression;
      }
    | NumberLiteral
    | BinaryExpression
    | ExpExpression
    | ParenExpression
    | MatrixExpression
    | Placeholder;
