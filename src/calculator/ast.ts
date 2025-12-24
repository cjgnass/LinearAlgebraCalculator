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

export type CharLiteral = {
  kind: "CharLiteral";
  value: string;
  start: number;
  end: number;
};

export type Literal = CharLiteral | NumberLiteral;

export type Placeholder = {
  kind: "Placeholder";
  start: number;
  end: number;
};

export type Expression =
  | Literal
  | BinaryExpression
  | ExpExpression
  | ParenExpression
  | MatrixExpression
  | Placeholder;
