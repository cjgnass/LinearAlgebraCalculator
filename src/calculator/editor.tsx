import { RenderExpr, RenderInteractiveExpr } from "./renderer.tsx";
import { useState, useMemo, KeyboardEvent } from "react";
import { lex } from "./lexer";
import { parse } from "./parser";
import "./calculator.css";

export default function Editor() {
    const [text, setText] = useState("");
    const [caret, setCaret] = useState(0);
    const [fontSize, setFontSize] = useState(2);

    const { expr, errors } = useMemo(() => {
        const sanitizedText = text.replace(/\s*(\/)\s*/g, "$1");
        const lengthDiff = text.length - sanitizedText.length;
        setCaret(caret - lengthDiff);
        setText(sanitizedText);
        const tokens = lex(sanitizedText);
        return parse(tokens);
    }, [text]);

    function handleKeyDown(e: KeyboardEvent) {
        const k = e.key;
        switch (k) {
            case "ArrowLeft":
                if (caret > 0) {
                    e.preventDefault();
                    setCaret(caret - 1);
                }
                break;
            case "ArrowRight":
                if (caret < text.length) {
                    e.preventDefault();
                    setCaret(caret + 1);
                }
                break;
            case "Backspace":
                if (caret > 0) {
                    e.preventDefault();
                    setText(text.slice(0, caret - 1) + text.slice(caret));
                    setCaret(caret - 1);
                }
                break;
            case "Delete":
                if (caret < text.length) {
                    e.preventDefault();
                    setText(text.slice(0, caret) + text.slice(caret + 1));
                }
                break;
            case " ":
            case ".":
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
            case "+":
            case "-":
            case "*":
            case "/":
            case "^":
            case "(":
            case ")":
                e.preventDefault();
                setText(text.slice(0, caret) + k + text.slice(caret));
                setCaret(caret + 1);
                break;
        }
    }

    function simplify(expr: Expression): Expression {
        switch (expr.kind) {
            case "BinaryExpression":
                const left = simplify(expr.left);
                const right = simplify(expr.right);
                let value;
                if (expr.op === "+") value = left.value + right.value;
                if (expr.op === "-") value = left.value - right.value;
                if (expr.op === "*") value = left.value * right.value;
                if (expr.op === "/") value = left.value / right.value;
                return { kind: "NumberLiteral", value };
            case "ExpExpression":
                const base = simplify(expr.left);
                const exp = simplify(expr.right);
                return {
                    kind: "NumberLiteral",
                    value: base.value ** exp.value,
                };

            case "NumberLiteral":
                return expr;
            case "ParenExpression":
                return simplify(expr.expr);
        }
    }

    return (
        <>
            <div className="comp-line">
                <div
                    className="input-box"
                    role="textbox"
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                >
                    <RenderInteractiveExpr
                        expr={expr}
                        text={text}
                        caret={caret}
                        fontSize={fontSize}
                    />
                </div>
                <div className="output-box">
                    <RenderExpr expr={simplify(expr)} fontSize={fontSize} />
                </div>
            </div>
        </>
    );
}
