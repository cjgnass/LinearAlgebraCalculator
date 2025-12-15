export enum TokenType {
  Number = "Number",
  Add = "Add",
  Sub = "Sub",
  Mult = "Mult",
  Div = "Div",
  Exp = "Exp",
  LParen = "(",
  RParen = ")",
}

export type Token = {
  type: TokenType;
  value: string;
  start: number;
  end: number;
};
