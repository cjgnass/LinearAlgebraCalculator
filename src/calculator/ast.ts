export type BinaryExpression = {
  kind: "BinaryExpression";
  op: "+" | "-" | "*" | "/";
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

export type Placeholder = {
  kind: "Placeholder";
};

export type Expression =
  | {
      expr: Expression;
    }
  | NumberLiteral
  | BinaryExpression
  | ExpExpression
  | ParenExpression;
