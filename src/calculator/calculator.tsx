import { RenderExpr, RenderInteractiveExpr } from "./renderer.tsx";
import { simplify } from "./simplifier.ts";
import React, { useState, useMemo } from "react";
import { lex } from "./lexer.ts";
import { parse } from "./parser.ts";
import "./calculator.css";

export default function Calculator() {
    const [text, setText] = useState("");
    const [caret, setCaret] = useState(0);
    // const [fontSize, setFontSize] = useState(2);
    const fontSize = 2;

    const { expr, errors } = useMemo(() => {
        const sanitizedText = text
            .replace(/\s*(\/|,)\s*/g, "$1") // trim around / or ,
            .replace(/\[\s+/g, "[") // remove whitespace right after [
            .replace(/\s+\]/g, "]"); // remove whitespace right before ]

        const lengthDiff = text.length - sanitizedText.length;
        setCaret(caret - lengthDiff);
        setText(sanitizedText);
        const tokens = lex(sanitizedText);
        return parse(tokens);
    }, [text]);

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
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
            case "[":
            case "]":
            case ",":
            case ";":
                e.preventDefault();
                setText(text.slice(0, caret) + k + text.slice(caret));
                setCaret(caret + 1);
                break;
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
