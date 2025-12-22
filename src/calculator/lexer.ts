import type { Token } from "./tokens";
import { TokenType } from "./tokens";

const isDigit = (c: string) => c >= "0" && c <= "9";

export function lex(input: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < input.length) {
        const start = i;

        switch (input[i]) {
            case " ":
                i++;
                continue;
            case "(":
                tokens.push({
                    type: TokenType.LParen,
                    value: "(",
                    start,
                    end: start + 1,
                });
                i++;
                continue;
            case ")":
                tokens.push({
                    type: TokenType.RParen,
                    value: ")",
                    start,
                    end: start + 1,
                });
                i++;
                continue;
            case "+":
                tokens.push({
                    type: TokenType.Add,
                    value: "+",
                    start,
                    end: start + 1,
                });
                i++;
                continue;
            case "-":
                tokens.push({
                    type: TokenType.Sub,
                    value: "-",
                    start,
                    end: start + 1,
                });
                i++;
                continue;
            case "*":
                tokens.push({
                    type: TokenType.Mult,
                    value: "*",
                    start,
                    end: start + 1,
                });
                i++;
                continue;
            case "/":
                tokens.push({
                    type: TokenType.Div,
                    value: "/",
                    start,
                    end: start + 1,
                });
                i++;
                continue;
            case "^":
                tokens.push({
                    type: TokenType.Exp,
                    value: "^",
                    start,
                    end: start + 1,
                });
                i++;
                continue;
            case "[":
                tokens.push({
                    type: TokenType.LBracket,
                    value: "[",
                    start,
                    end: start + 1,
                });
                i++;
                continue;

            case "]":
                tokens.push({
                    type: TokenType.RBracket,
                    value: "]",
                    start,
                    end: start + 1,
                });
                i++;
                continue;
            case ",":
                tokens.push({
                    type: TokenType.Comma,
                    value: ",",
                    start,
                    end: start + 1,
                });
                i++;
                continue;
            case ";":
                tokens.push({
                    type: TokenType.Semicolon,
                    value: ";",
                    start,
                    end: start + 1,
                });
                i++;
                continue;
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
                let numStr = input[i];
                i++;
                while (isDigit(input[i])) numStr += input[i++];
                if (input[i] == ".") numStr += input[i++];
                while (isDigit(input[i])) numStr += input[i++];
                tokens.push({
                    type: TokenType.Number,
                    value: numStr,
                    start,
                    end: i,
                });
                continue;
            case ".":
                let decStr = ".";
                while (isDigit(input[++i])) decStr += input[i];
                tokens.push({
                    type: TokenType.Number,
                    value: decStr,
                    start,
                    end: i,
                });
                continue;
            default:
                i++;
        }
    }
    const tNums = [];
    tokens.forEach((token) => {
        token.value;
    });

    return tokens;
}
