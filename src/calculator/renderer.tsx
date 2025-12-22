import React, { useRef, useLayoutEffect, useState } from "react";
import { renderToString } from "katex";
import type {
    Expression,
    NumberLiteral,
    BinaryExpression,
    ExpExpression,
    ParenExpression,
    MatrixExpression,
} from "./ast";

type Props = {
    expr: Expression;
    text?: string;
    caret?: number;
    fontSize?: number;
    ref?: React.RefObject<HTMLSpanElement | null>;
};

export function RenderExpr({
    expr,
    fontSize,
}: {
    expr: Expression;
    fontSize: number;
}): React.ReactNode {
    switch (expr.kind) {
        case "NumberLiteral":
            const html = renderToString(expr.value.toString(), {
                throwOnError: false,
            });
            return (
                <span
                    style={{
                        fontSize: `${fontSize}rem`,
                    }}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            );
        case "MatrixExpression":
            return <MatrixExpression expr={expr} fontSize={fontSize} />;
        default:
            return <></>;
    }
}

export function RenderInteractiveExpr({
    expr,
    text,
    caret,
    fontSize,
}: {
    expr: Expression;
    text: string;
    caret: number;
    fontSize: number;
}): React.ReactNode {
    const parts: React.ReactNode[] = [];
    parts.push(...getParts(text, caret, 0, expr.start));
    parts.push(<Expression key="expr" expr={expr} text={text} caret={caret} />);
    parts.push(...getParts(text, caret, expr.end, text.length));
    return (
        <span
            className="interactive-expr"
            style={{ "--font-size": `${fontSize}rem` }}
        >
            {caret === 0 && <Caret key={`caret-${caret}`} />}
            {parts}
        </span>
    );
    // return getParts(text, caret, 0, text.length);
}

// not responsible start caret
function getParts(
    text: string,
    caret: number,
    start: number,
    end: number,
): React.ReactNode[] {
    const parts = [];
    for (let i = start; i <= end; i++) {
        if (i > start && i === caret) {
            parts.push(<Caret key={`caret-${i}`} />); // caret 1
        }
        if (i < end) {
            const html = renderToString(text[i] === " " ? "~" : text[i], {
                throwOnError: false,
            });
            parts.push(
                <span
                    key={`span-${i}`}
                    dangerouslySetInnerHTML={{ __html: html }}
                />,
            );
        }
    }
    return parts;
}

function Caret(): React.ReactNode {
    return <span className="caret" />;
}

function NumberLiteral({ expr, text, caret, ref }: Props): React.ReactNode {
    const parts = [];

    parts.push(...getParts(text, caret, expr.start, expr.end));
    return (
        <span ref={ref} className="number-literal">
            {parts}
            {/*{caret === expr.end && <Caret />}*/}
        </span>
    );
}

function DivExpression({ expr, text, caret, ref }: Props): React.ReactNode {
    // console.log("expr.right.end", expr.right.end);
    return (
        <span ref={ref} className="div-expression">
            <span className="numerator">
                <Expression expr={expr.left} text={text} caret={caret} />
            </span>
            <span className="denominator">
                {caret === expr.right.start && <Caret />}
                <Expression expr={expr.right} text={text} caret={caret} />
            </span>
        </span>
    );
}

function BinaryExpression({ expr, text, caret, ref }: Props): React.ReactNode {
    if (expr.op === "/") {
        return (
            <DivExpression expr={expr} text={text} caret={caret} ref={ref} />
        );
    }
    const parts = [];
    parts.push(
        <Expression key={"left"} expr={expr.left} text={text} caret={caret} />,
    );
    const exprRightStart =
        expr.right.start === 0 ? text.length : expr.right.start;
    parts.push(...getParts(text, caret, expr.left.end, exprRightStart));
    parts.push(
        <Expression
            key={"right"}
            expr={expr.right}
            text={text}
            caret={caret}
        />,
    );
    return (
        <span ref={ref} className="binary-expression">
            {parts}
        </span>
    );
}

function ExpExpression({ expr, text, caret, ref }: Props): React.ReactNode {
    return (
        <span ref={ref} className="exp-expression">
            <span className="exp-base">
                <Expression
                    key={"base"}
                    expr={expr.left}
                    text={text}
                    caret={caret}
                />
            </span>
            <span className="exp-exponent">
                {caret === expr.right.start && <Caret />}
                <Expression
                    key={"exp"}
                    expr={expr.right}
                    text={text}
                    caret={caret}
                />
            </span>
        </span>
    );
}

function ParenExpression({ expr, text, caret, ref }: Props): React.ReactNode {
    const innerRef = useRef<HTMLSpanElement>(null);
    const parenRef = useRef<HTMLSpanElement>(null);
    const [scale, setScale] = useState(1);
    const [parenHeight, setParenHeight] = useState(1);
    useLayoutEffect(() => {
        if (parenRef.current) {
            const height = parenRef.current.getBoundingClientRect().height;
            setParenHeight(height);
        }
    }, []);
    const leftParenHtml = renderToString("(", { throwOnError: false });
    const rightParenHtml = renderToString(")", { throwOnError: false });
    useLayoutEffect(() => {
        if (innerRef.current && parenRef.current) {
            const innerHeight = innerRef.current.getBoundingClientRect().height;
            if (innerHeight > 0) setScale(innerHeight / parenHeight);
        }
    }, [expr, text, parenHeight]);
    return (
        <span ref={ref} className={"paren-expression"}>
            {/*{caret === expr.start && <Caret />}*/}
            <span
                ref={parenRef}
                className="paren"
                style={{ "--scale": scale }}
                dangerouslySetInnerHTML={{ __html: leftParenHtml }}
            />
            {caret === expr.start + 1 && <Caret />}
            {getParts(text, caret, expr.start + 1, expr.expr.start)}
            <Expression
                key={"expr"}
                expr={expr.expr}
                text={text}
                caret={caret}
                ref={innerRef}
            />
            {getParts(text, caret, expr.expr.end, expr.end - 1)}
            {expr.end !== expr.expr.end && (
                <span
                    className="paren"
                    style={{ "--scale": scale }}
                    dangerouslySetInnerHTML={{ __html: rightParenHtml }}
                />
            )}
            {expr.expr.end !== expr.end && caret == expr.end && <Caret />}
        </span>
    );
}

function MatrixExpression({
    expr,
    text,
    caret,
    ref,
    fontSize,
}: Props): React.ReactNode {
    const innerRef = useRef<HTMLSpanElement>(null);
    const bracketRef = useRef<HTMLSpanElement>(null);
    const [scale, setScale] = useState(1);
    const [bracketHeight, setBracketHeight] = useState(1);
    useLayoutEffect(() => {
        if (bracketRef.current) {
            const height = bracketRef.current.getBoundingClientRect().height;
            setBracketHeight(height);
        }
    }, []);
    const leftBracketHtml = renderToString("[", { ThrowOnError: false });
    const rightBracketHtml = renderToString("]", { ThrowOnError: false });
    useLayoutEffect(() => {
        if (innerRef.current && bracketRef.current) {
            const innerHeight = innerRef.current.getBoundingClientRect().height;
            if (innerHeight > 0) setScale(innerHeight / bracketHeight);
        }
    }, [expr, text, bracketHeight]);

    if (text == null || caret == null) {
        const maxCols = Math.max(...expr.matrix.map((row) => row.length));
        return (
            <span ref={ref} className="matrix-expression">
                <span
                    ref={bracketRef}
                    className="bracket"
                    style={{ "--scale": scale }}
                    dangerouslySetInnerHTML={{ __html: leftBracketHtml }}
                />
                <span
                    ref={innerRef}
                    className="matrix-inner"
                    style={{ "--matrix-cols": maxCols }}
                >
                    {expr.matrix.map((row, rowIndex) => {
                        const elements = row.map((element, colIndex) => (
                            <span
                                key={`cell-${rowIndex}-${colIndex}`}
                                className="matrix-element"
                            >
                                <RenderExpr
                                    expr={element}
                                    fontSize={fontSize ?? 1}
                                />
                            </span>
                        ));
                        // Add empty spans to fill remaining columns
                        const emptySpans = Array.from(
                            { length: maxCols - row.length },
                            (_, i) => (
                                <span
                                    key={`empty-${rowIndex}-${row.length + i}`}
                                />
                            ),
                        );
                        return [...elements, ...emptySpans];
                    })}
                </span>
                <span
                    ref={bracketRef}
                    className="bracket"
                    style={{ "--scale": scale }}
                    dangerouslySetInnerHTML={{ __html: rightBracketHtml }}
                />
            </span>
        );
    }
    const maxCols = Math.max(...expr.matrix.map((row) => row.length));
    console.log("expr", expr.matrix);
    return (
        <span ref={ref} className="matrix-expression">
            <span
                ref={bracketRef}
                className="bracket"
                style={{ "--scale": scale }}
                dangerouslySetInnerHTML={{ __html: leftBracketHtml }}
            />
            {expr.matrix[0].length === 0 && caret === expr.start + 1 && (
                <Caret />
            )}
            <span
                ref={innerRef}
                className="matrix-inner"
                style={{ "--matrix-cols": maxCols }}
            >
                {expr.matrix.map((row, rowIndex) => {
                    const elements = row.map((element, colIndex) => (
                        <span
                            key={`cell-${rowIndex}-${colIndex}`}
                            className="matrix-element"
                        >
                            {element.kind !== "Placeholer" &&
                                caret === element.start && <Caret />}
                            <Expression
                                expr={element}
                                text={text}
                                caret={caret}
                            />
                        </span>
                    ));
                    // Add empty spans to fill remaining columns
                    const emptySpans = Array.from(
                        { length: maxCols - row.length },
                        (_, i) => (
                            <span key={`empty-${rowIndex}-${row.length + i}`} />
                        ),
                    );
                    return [...elements, ...emptySpans];
                })}
            </span>
            {text[expr.end - 1] === "]" && (
                <span
                    ref={bracketRef}
                    className="bracket"
                    style={{ "--scale": scale }}
                    dangerouslySetInnerHTML={{ __html: rightBracketHtml }}
                />
            )}
            {text[expr.end - 1] === "]" && caret === expr.end && <Caret />}
        </span>
    );
}

function Placeholder({ expr, text, caret, ref }: Props): React.ReactNode {
    return (
        <span ref={ref} className="placeholder">
            {caret === expr.pos && <Caret />}
        </span>
    );
}

function Expression({ expr, text, caret, ref }: Props): React.ReactNode {
    switch (expr.kind) {
        case "NumberLiteral":
            return (
                <NumberLiteral
                    expr={expr}
                    text={text}
                    caret={caret}
                    ref={ref}
                />
            );
        case "BinaryExpression":
            return (
                <BinaryExpression
                    expr={expr}
                    text={text}
                    caret={caret}
                    ref={ref}
                />
            );
        case "ExpExpression":
            return (
                <ExpExpression
                    expr={expr}
                    text={text}
                    caret={caret}
                    ref={ref}
                />
            );
        case "ParenExpression":
            return (
                <ParenExpression
                    expr={expr}
                    text={text}
                    caret={caret}
                    ref={ref}
                />
            );
        case "MatrixExpression":
            return (
                <MatrixExpression
                    expr={expr}
                    text={text}
                    caret={caret}
                    ref={ref}
                />
            );
        case "Placeholder":
            return (
                <Placeholder expr={expr} text={text} caret={caret} ref={ref} />
            );
        default:
            return <></>;
    }
}
