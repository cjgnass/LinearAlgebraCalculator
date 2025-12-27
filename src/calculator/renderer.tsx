import React, { useRef, useLayoutEffect, useState } from "react";
import { renderToString } from "katex";
import type {
    Expression,
    NumberLiteral,
    BinaryExpression,
    ParenExpression,
    MatrixExpression,
} from "./ast";

type Props = {
    expr: Expression;
    text: string;
    caret: number;
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
    let html;
    switch (expr.kind) {
        case "NumberLiteral":
            html = renderToString(expr.value.toString(), {
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
            return <MatrixOutput expr={expr} fontSize={fontSize} />;
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
            style={{ "--font-size": `${fontSize}rem` } as React.CSSProperties}
        >
            {caret === 0 && <Caret key={`caret-${caret}`} />}
            {parts}
        </span>
    );
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
        </span>
    );
}

function DivExpression({ expr, text, caret, ref }: Props): React.ReactNode {
    return (
        <span ref={ref} className="div-expression">
            <span className="numerator">
                <Expression
                    expr={(expr as BinaryExpression).left}
                    text={text}
                    caret={caret}
                />
            </span>
            <span className="denominator">
                {caret === (expr as BinaryExpression).right.start && <Caret />}
                <Expression
                    expr={(expr as BinaryExpression).right}
                    text={text}
                    caret={caret}
                />
            </span>
        </span>
    );
}

function CrossExpression({ expr, text, caret, ref }: Props): React.ReactNode {
    const parts = [];
    const left = (expr as BinaryExpression).left;
    const right = (expr as BinaryExpression).right;
    parts.push(
        <Expression
            key={"left"}
            expr={left}
            text={text}
            caret={caret}
            ref={ref}
        />,
    );
    const exprRightStart =
        (expr as BinaryExpression).right.start === 0
            ? text.length
            : (expr as BinaryExpression).right.start;
    for (let i = left.end; i <= exprRightStart; i++) {
        if (i > left.end && i === caret) {
            parts.push(<Caret key={`caret-${i}`} />);
        }
        if (i < exprRightStart) {
            let html;
            if (text[i] === "x")
                html = renderToString("\\times", { throwOnError: false });
            else if (text[i] === " ")
                html = renderToString("~", { throwOnError: false });
            else html = renderToString(text[i], { throwOnError: false });
            parts.push(
                <span
                    key={`span-${i}`}
                    dangerouslySetInnerHTML={{ __html: html }}
                />,
            );
        }
    }
    parts.push(
        <Expression
            key={"right"}
            expr={right}
            text={text}
            caret={caret}
            ref={ref}
        />,
    );
    return <span ref={ref}>{parts}</span>;
}

function BinaryExpression({ expr, text, caret, ref }: Props): React.ReactNode {
    if ((expr as BinaryExpression).op === "/") {
        return (
            <DivExpression expr={expr} text={text} caret={caret} ref={ref} />
        );
    }
    if ((expr as BinaryExpression).op === "^") {
        return (
            <ExpExpression expr={expr} text={text} caret={caret} ref={ref} />
        );
    }
    if ((expr as BinaryExpression).op === "x") {
        return (
            <CrossExpression expr={expr} text={text} caret={caret} ref={ref} />
        );
    }
    const parts = [];
    parts.push(
        <Expression
            key={"left"}
            expr={(expr as BinaryExpression).left}
            text={text}
            caret={caret}
        />,
    );
    const exprRightStart =
        (expr as BinaryExpression).right.start === 0
            ? text.length
            : (expr as BinaryExpression).right.start;
    parts.push(
        ...getParts(
            text,
            caret,
            (expr as BinaryExpression).left.end,
            exprRightStart,
        ),
    );
    parts.push(
        <Expression
            key={"right"}
            expr={(expr as BinaryExpression).right}
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
                    expr={(expr as ExpExpression).left}
                    text={text}
                    caret={caret}
                />
            </span>
            <span className="exp-exponent">
                <Expression
                    key={"exp"}
                    expr={(expr as ExpExpression).right}
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
            <span
                ref={parenRef}
                className="paren"
                style={{ "--scale": scale } as React.CSSProperties}
                dangerouslySetInnerHTML={{ __html: leftParenHtml }}
            />
            {caret === expr.start + 1 && <Caret />}
            {getParts(
                text,
                caret,
                expr.start + 1,
                (expr as ParenExpression).expr.start,
            )}
            <Expression
                key={"expr"}
                expr={(expr as ParenExpression).expr}
                text={text}
                caret={caret}
                ref={innerRef}
            />
            {getParts(
                text,
                caret,
                (expr as ParenExpression).expr.end,
                expr.end - 1,
            )}
            {expr.end !== (expr as ParenExpression).expr.end && (
                <span
                    className="paren"
                    style={{ "--scale": scale } as React.CSSProperties}
                    dangerouslySetInnerHTML={{ __html: rightParenHtml }}
                />
            )}
            {(expr as ParenExpression).expr.end !== expr.end &&
                caret == expr.end && <Caret />}
        </span>
    );
}

function MatrixOutput({
    expr,
    fontSize,
}: {
    expr: Expression;
    fontSize: number;
}) {
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
    const leftBracketHtml = renderToString("[", { throwOnError: false });
    const rightBracketHtml = renderToString("]", { throwOnError: false });
    useLayoutEffect(() => {
        if (innerRef.current && bracketRef.current) {
            const innerHeight = innerRef.current.getBoundingClientRect().height;
            if (innerHeight > 0) setScale(innerHeight / bracketHeight);
        }
    }, [expr, bracketHeight]);

    const maxCols = Math.max(
        ...(expr as MatrixExpression).matrix.map((row) => row.length),
    );
    return (
        <span className="matrix-expression">
            <span
                ref={bracketRef}
                className="bracket"
                style={{ "--scale": scale } as React.CSSProperties}
                dangerouslySetInnerHTML={{ __html: leftBracketHtml }}
            />
            <span
                ref={innerRef}
                className="matrix-inner"
                style={{ "--matrix-cols": maxCols } as React.CSSProperties}
            >
                {(expr as MatrixExpression).matrix.map((row, rowIndex) => {
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
                            <span key={`empty-${rowIndex}-${row.length + i}`} />
                        ),
                    );
                    return [...elements, ...emptySpans];
                })}
            </span>
            <span
                ref={bracketRef}
                className="bracket"
                style={{ "--scale": scale } as React.CSSProperties}
                dangerouslySetInnerHTML={{ __html: rightBracketHtml }}
            />
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
    const leftBracketHtml = renderToString("[", { throwOnError: false });
    const rightBracketHtml = renderToString("]", { throwOnError: false });
    useLayoutEffect(() => {
        if (innerRef.current && bracketRef.current) {
            const innerHeight = innerRef.current.getBoundingClientRect().height;
            if (innerHeight > 0) setScale(innerHeight / bracketHeight);
        }
    }, [expr, text, bracketHeight]);

    if (text == null || caret == null) {
        const maxCols = Math.max(
            ...(expr as MatrixExpression).matrix.map((row) => row.length),
        );
        return (
            <span ref={ref} className="matrix-expression">
                <span
                    ref={bracketRef}
                    className="bracket"
                    style={{ "--scale": scale } as React.CSSProperties}
                    dangerouslySetInnerHTML={{ __html: leftBracketHtml }}
                />
                <span
                    ref={innerRef}
                    className="matrix-inner"
                    style={{ "--matrix-cols": maxCols } as React.CSSProperties}
                >
                    {(expr as MatrixExpression).matrix.map((row, rowIndex) => {
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
                    style={{ "--scale": scale } as React.CSSProperties}
                    dangerouslySetInnerHTML={{ __html: rightBracketHtml }}
                />
            </span>
        );
    }
    const maxCols = Math.max(
        ...(expr as MatrixExpression).matrix.map((row) => row.length),
    );
    return (
        <span ref={ref} className="matrix-expression">
            <span
                ref={bracketRef}
                className="bracket"
                style={{ "--scale": scale } as React.CSSProperties}
                dangerouslySetInnerHTML={{ __html: leftBracketHtml }}
            />
            {(expr as MatrixExpression).matrix[0].length === 0 &&
                caret === expr.start + 1 && <Caret />}
            <span
                ref={innerRef}
                className="matrix-inner"
                style={{ "--matrix-cols": maxCols } as React.CSSProperties}
            >
                {(expr as MatrixExpression).matrix.map((row, rowIndex) => {
                    const elements = row.map((element, colIndex) => (
                        <span
                            key={`cell-${rowIndex}-${colIndex}`}
                            className="matrix-element"
                        >
                            {element.kind !== "Placeholder" &&
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
                    style={{ "--scale": scale } as React.CSSProperties}
                    dangerouslySetInnerHTML={{ __html: rightBracketHtml }}
                />
            )}
            {text[expr.end - 1] === "]" && caret === expr.end && <Caret />}
        </span>
    );
}

function Placeholder({ expr, caret, ref }: Props): React.ReactNode {
    return (
        <span ref={ref} className="placeholder">
            {caret === expr.start && <Caret />}
        </span>
    );
}

function CharLiteral({ expr, text, caret, ref }: Props): React.ReactNode {
    const parts = getParts(text, caret, expr.start, expr.end);
    return (
        <span ref={ref} className="char-literal">
            {caret === expr.start && <Caret />}
            {parts}
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
        case "CharLiteral":
            return (
                <CharLiteral expr={expr} text={text} caret={caret} ref={ref} />
            );
        default:
            return <></>;
    }
}
