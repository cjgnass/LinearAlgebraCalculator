export enum TokenType {
    Number = "Number",
    Add = "Add",
    Sub = "Sub",
    Mult = "Mult",
    Div = "Div",
    Exp = "Exp",
    Char = "Char",
    Dot = "Dot",
    Cross = "Cross",
}

export type Token = {
    type: TokenType;
    value: string;
    start: number;
    end: number;
};
