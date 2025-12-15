import React, { useRef, useLayoutEffect, useState } from "react";
import { renderToString } from "katex";
import type {
    Expression,
    NumberLiteral,
    BinaryExpression,
    ExpExpression,
    ParenExpression,
} from "./ast";

export function RenderExpr({ expr }: { expr: Expression }): React.ReactNode {
    const latex = expr.value.toString();
    const html = renderToString(latex, { throwOnError: false });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function RenderInteractiveExpr({
    expr,
    text,
    caret,
}: {
    expr: Expression;
    text: string;
    caret: number;
}): React.ReactNode {
    const parts: React.ReactNode[] = [];
    for (let i = 0; i < expr.start; i++) {
        if (i === caret) parts.push(<Caret key={`c-${i}`} />);
        const html = renderToString(text[i] == " " ? "~" : text[i], {
            throwOnError: false,
        });
        parts.push(
            <span key={`s-${i}`} dangerouslySetInnerHTML={{ __html: html }} />,
        );
    }
    parts.push(
        <Expression key={"expr"} expr={expr} text={text} caret={caret} />,
    );

    for (let i = expr.end; i <= text.length; i++) {
        if (i === caret && i > expr.end) parts.push(<Caret key={`c-${i}`} />);
        if (i < text.length && text[i] !== "(") {
            const html = renderToString(text[i] == " " ? "~" : text[i], {
                throwOnError: false,
            });
            parts.push(
                <span
                    key={`s-${i}`}
                    dangerouslySetInnerHTML={{ __html: html }}
                />,
            );
        }
    }
    return <span className="interactive-expr">{parts}</span>;
}

function Caret({ className }: { className?: string }): React.ReactNode {
    const cls = className ? `caret ${className}` : "caret";
    return <span className={cls} aria-hidden="true" />;
}

function toLatex(expr: Expression): string {
    switch (expr.kind) {
        case "NumberLiteral":
            return expr.value.toString();
        case "BinaryExpression":
            return "";
        case "ParenExpression":
            return "";
        default:
            return "";
    }
}

function NumberLiteral({
    expr,
    text,
    caret,
}: {
    expr: NumberLiteral;
    text: string;
    caret: number;
}): React.ReactNode {
    const exprText = text.slice(expr.start, expr.end);
    const parts: React.ReactNode[] = [];
    for (let exprTextIdx = 0; exprTextIdx <= exprText.length; exprTextIdx++) {
        const i = expr.start + exprTextIdx;
        if (i === caret) parts.push(<Caret key={`c-${i}`} />);

        if (exprTextIdx < exprText.length) {
            const html = renderToString(
                exprText[exprTextIdx] === " " ? "~" : exprText[exprTextIdx],
                {
                    throwOnError: false,
                },
            );
            parts.push(
                <span
                    key={`s-${i}`}
                    dangerouslySetInnerHTML={{ __html: html }}
                />,
            );
        }
    }
    return <span className="number-literal">{parts}</span>;
}

function DivExpression({
    expr,
    text,
    caret,
}: {
    expr: BinaryExpression;
    text: string;
    caret: number;
}): React.ReactNode {
    const numerator = <Expression expr={expr.left} text={text} caret={caret} />;
    const denominator = (
        <Expression expr={expr.right} text={text} caret={caret} />
    );
    return (
        <span className="fraction">
            <span className="numerator">{numerator}</span>
            <span className="denominator">{denominator}</span>
        </span>
    );
}

function BinaryExpression({
    expr,
    text,
    caret,
}: {
    expr: BinaryExpression;
    text: string;
    caret: number;
}): React.ReactNode {
    if (expr.op === "/") {
        return DivExpression({
            expr,
            text,
            caret,
        });
    }
    const left = expr.left;
    const right = expr.right;
    const middleStart = left.end;
    const middleEnd = right.end == 0 ? expr.end : right.start;
    const middleLength = middleEnd - middleStart;
    const parts: React.ReactNode[] = [];
    parts.push(
        <Expression key={"left"} expr={left} text={text} caret={caret} />,
    );

    for (let middleIdx = 0; middleIdx < middleLength; middleIdx++) {
        const i = middleStart + middleIdx;
        if (i === caret && i > left.end) parts.push(<Caret key={`c-${i}`} />);
        if (i < expr.end) {
            const html = renderToString(text[i] == " " ? "~" : text[i], {
                throwOnError: false,
            });
            parts.push(
                <span
                    key={`s-${i}`}
                    dangerouslySetInnerHTML={{ __html: html }}
                />,
            );
        }
    }

    parts.push(
        <Expression key={"right"} expr={right} text={text} caret={caret} />,
    );
    return <span className="interactive-expr">{parts}</span>;
}

function ExpExpression({
    expr,
    text,
    caret,
}: {
    expr: ExpExpression;
    text: string;
    caret: number;
}): React.ReactNode {
    const baseRef = useRef<HTMLSpanElement>(null);
    const [offset, setOffset] = useState(0);

    useLayoutEffect(() => {
        if (baseRef.current) {
            const height = baseRef.current.getBoundingClientRect().height;
            const baselineHeight = 20; // single-line height
            // Offset is half the base height, so exponent sits at top of base
            const newOffset = Math.max(0, (height - baselineHeight) / 2 + baselineHeight * 0.4);
            setOffset(newOffset);
        }
    }, [expr, text]);

    const base = <Expression expr={expr.left} text={text} caret={caret} />;
    const exponent = <Expression expr={expr.right} text={text} caret={caret} />;
    const expStyle = { "--exp-offset": `${-offset}px` } as React.CSSProperties;

    return (
        <span className="exp">
            <span ref={baseRef} className="exp-base">{base}</span>
            <span className="exp-exponent" style={expStyle}>{exponent}</span>
        </span>
    );
}

function ParenExpression({
    expr,
    text,
    caret,
}: {
    expr: ParenExpression;
    text: string;
    caret: number;
}): React.ReactNode {
    const innerRef = useRef<HTMLSpanElement>(null);
    const [scale, setScale] = useState(1);
    useLayoutEffect(() => {
        if (innerRef.current) {
            const height = innerRef.current.getBoundingClientRect().height;
            const baseHeight = 25;
            const newScale = Math.max(1, height / baseHeight);
            setScale(newScale);
        }
    }, [expr, text]);
    const leftParenHtml = renderToString("(", { throwOnError: false });
    const rightParenHtml = renderToString(")", { throwOnError: false });
    const start = expr.start;
    const end = expr.end;
    const innerExpr = expr.expr;
    const innerStart = innerExpr.start;
    const innerEnd = innerExpr.end;
    const innerParts: React.ReactNode[] = [];
    for (let i = start + 1; i < innerStart; i++) {
        if (i === caret) {
            innerParts.push(<Caret key={`c-${i}`} />);
        }
        const html = renderToString(text[i] == " " ? "~" : text[i], {
            throwOnError: false,
        });
        innerParts.push(
            <span key={`s-${i}`} dangerouslySetInnerHTML={{ __html: html }} />,
        );
    }
    innerParts.push(
        <Expression key={"expr"} expr={expr.expr} text={text} caret={caret} />,
    );
    for (let i = innerEnd + 1; i < end; i++) {
        if (i === caret) {
            innerParts.push(<Caret key={`c-${i}`} />);
        }
        if (i < end - 1) {
            const html = renderToString(text[i] == " " ? "~" : text[i], {
                throwOnError: false,
            });
            innerParts.push(
                <span
                    key={`s-${i}`}
                    dangerouslySetInnerHTML={{ __html: html }}
                />,
            );
        }
    }
    const parenStyle = { "--paren-scale": scale } as React.CSSProperties;
    return (
        <span className="paren-expr">
            {start === caret && <Caret key={`c-${start}`} />}
            <span
                key={`s-${start}`}
                className="paren"
                style={parenStyle}
                dangerouslySetInnerHTML={{ __html: leftParenHtml }}
            />
            <span ref={innerRef} className="paren-inner">
                {innerParts}
            </span>
            {expr.end != innerExpr.end && (
                <span
                    key={`s-${end}`}
                    className="paren"
                    style={parenStyle}
                    dangerouslySetInnerHTML={{ __html: rightParenHtml }}
                />
            )}
            {end === caret && end != innerExpr.end && (
                <Caret key={`c-${end}`} />
            )}
        </span>
    );
}

function Expression({
    expr,
    text,
    caret,
}: {
    expr: Expression;
    text: string;
    caret: number;
}): React.ReactNode {
    switch (expr.kind) {
        case "NumberLiteral":
            return (
                <NumberLiteral
                    key={"expr"}
                    expr={expr}
                    text={text}
                    caret={caret}
                />
            );
        case "BinaryExpression":
            return (
                <BinaryExpression
                    key={"expr"}
                    expr={expr}
                    text={text}
                    caret={caret}
                />
            );
        case "ExpExpression":
            return (
                <ExpExpression
                    key={"expr"}
                    expr={expr}
                    text={text}
                    caret={caret}
                />
            );
        case "ParenExpression":
            return (
                <ParenExpression
                    key={"expr"}
                    expr={expr}
                    text={text}
                    caret={caret}
                />
            );
        default:
            return;
    }
}
