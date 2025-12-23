import type { Token } from "./tokens";
import { TokenType } from "./tokens";

const isDigit = (c: string) => c >= "0" && c <= "9";

export function lex(input: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    let temp = "";

    while (i < input.length) {
        const start = i;

        switch (input[i]) {
            case " ":
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
            case "(":
            case ")":
            case "[":
            case "]":
            case ",":
            case ";":
                tokens.push({
                    type: TokenType.Char,
                    value: input[i],
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
                temp = input[i];
                i++;
                while (isDigit(input[i])) temp += input[i++];
                if (input[i] == ".") temp += input[i++];
                while (isDigit(input[i])) temp += input[i++];
                tokens.push({
                    type: TokenType.Number,
                    value: temp,
                    start,
                    end: i,
                });
                continue;
            case ".":
                temp = input[i];
                while (isDigit(input[++i])) temp += input[i];
                tokens.push({
                    type: TokenType.Number,
                    value: temp,
                    start,
                    end: i,
                });
                continue;
            default:
                i++;
        }
    }
    return tokens;
}
