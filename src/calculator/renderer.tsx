import React, { useRef, useLayoutEffect, useState } from "react";
import { renderToString } from "katex";
import type {
    Expression,
    NumberLiteral,
    BinaryExpression,
    ExpExpression,
    ParenExpression,
} from "./ast";

export function RenderExpr({
    expr,
    fontSize,
}: {
    expr: Expression;
    fontSize: number;
}): React.ReactNode {
    const latex = expr.value.toString();
    const html = renderToString(latex, { throwOnError: false });
    const fontSizeStyle = {
        "--font-size": `${fontSize}rem`,
    } as React.CSSProperties;

    return (
        <span
            className="font-size"
            style={fontSizeStyle}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
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
    if (text === "") {
        return (
            <span
                className="interactive-expr"
                style={{ "--font-size": `${fontSize}rem` }}
            >
                <Caret className={"caret floating-caret"} key={`c-${caret}`} />
            </span>
        );
    }
    const parts: React.ReactNode[] = [];
    for (let i = 0; i < expr.start; i++) {
        if (i === caret) {
            console.log("caret");
            parts.push(
                <Caret className={"caret floating-caret"} key={`c-${i}`} />,
            );
        }
        const html = renderToString(text[i] == " " ? "~" : text[i], {
            throwOnError: false,
        });
        parts.push(
            <span
                className="literal space"
                key={`s-${i}`}
                dangerouslySetInnerHTML={{ __html: html }}
            />,
        );
    }
    parts.push(
        <Expression key={"expr"} expr={expr} text={text} caret={caret} />,
    );

    for (let i = expr.end; i <= text.length; i++) {
        if (i === caret && i > expr.end)
            parts.push(
                <Caret className={"caret floating-caret"} key={`c-${i}`} />,
            );
        if (i < text.length && text[i] !== "(") {
            const html = renderToString(text[i] == " " ? "~" : text[i], {
                throwOnError: false,
            });
            parts.push(
                <span
                    className="literal space"
                    key={`s-${i}`}
                    dangerouslySetInnerHTML={{ __html: html }}
                />,
            );
        }
    }
    return (
        <span
            className="interactive-expr"
            style={{ "font-size": `${fontSize}rem` }}
        >
            {parts}
        </span>
    );
}

function Caret({ className }: { className?: string }): React.ReactNode {
    const cls = className ? `caret ${className}` : "caret";
    return <span className={cls} aria-hidden="true" />;
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
                exprText[exprTextIdx] === " "
                    ? "~"
                    : `${exprText[exprTextIdx]}`,
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
    return <span className="literal space">{parts}</span>;
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
    const leftRef = useRef<HTMLSpanElement>(null);
    const rightRef = useRef<HTMLSpanElement>(null);
    const [height, setHeight] = useState(0);

    useLayoutEffect(() => {
        if (leftRef.current && rightRef.current) {
            console.log("left", leftRef.current.offsetHeight);
            console.log("right", rightRef.current.offsetHeight);
            setHeight(
                Math.max(
                    leftRef.current.offsetHeight,
                    rightRef.current.offsetHeight,
                ),
            );
        }
    }, [expr, text]);

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
        <span ref={leftRef} key={"left"}>
            <Expression key={"left"} expr={left} text={text} caret={caret} />
        </span>,
    );
    // parts.push(
    //     <Expression
    //         ref={leftRef}
    //         key={"left"}
    //         expr={left}
    //         text={text}
    //         caret={caret}
    //     />,
    // );

    for (let middleIdx = 0; middleIdx < middleLength; middleIdx++) {
        const i = middleStart + middleIdx;
        if (i === caret && i > left.end) parts.push(<Caret key={`c-${i}`} />);
        if (i < expr.end) {
            const html = renderToString(text[i] == " " ? "~" : text[i], {
                throwOnError: false,
            });

            parts.push(
                <span
                    className="literal space"
                    key={`s-${i}`}
                    dangerouslySetInnerHTML={{ __html: html }}
                />,
            );
        }
    }

    parts.push(
        <span ref={rightRef} key={"right"}>
            <Expression key={"right"} expr={right} text={text} caret={caret} />
        </span>,
    );
    // parts.push(
    //     <Expression
    //         ref={rightRef}
    //         key={"right"}
    //         expr={right}
    //         text={text}
    //         caret={caret}
    //     />,
    // );
    return (
        <span className="binary-expression" style={{ "--height": height }}>
            {parts}
        </span>
    );
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
    const expRef = useRef<HTMLSpanElement>(null);
    const [paddingTop, setPaddingTop] = useState(0);
    // const exprRef
    // const [height, setHeight] = useState(0);

    useLayoutEffect(() => {
        if (baseRef.current && expRef.current) {
            const baseHeight = baseRef.current.getBoundingClientRect().height;
            const expHeight = expRef.current.getBoundingClientRect().height;
            const expOffset = baseHeight / 2;
            const overflow = expOffset + expHeight - baseHeight;
            setOffset(Math.max(0, expOffset));
            setPaddingTop(Math.max(0, overflow));
        }
    }, [expr, text]);

    const base = <Expression expr={expr.left} text={text} caret={caret} />;
    const exponent = <Expression expr={expr.right} text={text} caret={caret} />;

    return (
        <span className="exp" style={{ "--exp-padding": `${paddingTop}px` }}>
            <span
                ref={baseRef}
                className="exp-base"
                style={{ "--exp-padding": `${offset}px` }}
            >
                {base}
            </span>
            <span
                ref={expRef}
                className="exp-exponent"
                style={{ "--exp-offset": `${offset}px` }}
            >
                {exponent}
            </span>
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
            const baseHeight = 20;
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
    return (
        <span className="paren-expr font-size">
            {start === caret && <Caret key={`c-${start}`} />}
            <span
                key={`s-${start}`}
                className="paren"
                style={{ "--paren-scale": `${scale}` }}
                dangerouslySetInnerHTML={{ __html: leftParenHtml }}
            />
            <span ref={innerRef} className="paren-inner">
                {innerParts}
            </span>
            {expr.end != innerExpr.end && (
                <span
                    key={`s-${end}`}
                    className="paren"
                    style={{ "--paren-scale": `${scale}` }}
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
