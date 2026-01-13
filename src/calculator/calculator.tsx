import { RenderExpr, RenderInteractiveExpr } from "./renderer.tsx";
import { simplify } from "./simplifier.ts";
import React, { useState, useMemo } from "react";
import { lex } from "./lexer.ts";
import { parse } from "./parser.ts";
import type { Expression, BinaryExpression, MatrixExpression } from "./ast.ts";
import "./calculator.css";

type BinaryNavTarget = {
  kind: "division" | "exponent";
  side: "left" | "right";
  left: Expression;
  right: Expression;
};

type MatrixNavTarget = {
  kind: "matrix";
  row: number;
  col: number;
  element: Expression;
  matrix: Expression[][];
};

// type NavTarget = BinaryNavTarget | MatrixNavTarget;

function caretInExpr(expr: Expression, caret: number) {
  return caret >= expr.start && caret <= expr.end;
}

function clampCaret(target: Expression, offset: number) {
  const desired = target.start + offset;
  if (desired < target.start) return target.start;
  if (desired > target.end) return target.end;
  return desired;
}

function findMatrixNavTarget(
  expr: Expression,
  caret: number,
): MatrixNavTarget | null {
  if (expr.kind === "MatrixExpression") {
    const matrix = (expr as MatrixExpression).matrix;
    for (let row = 0; row < matrix.length; row++) {
      const rowElements = matrix[row];
      for (let col = 0; col < rowElements.length; col++) {
        const element = rowElements[col];
        if (!caretInExpr(element, caret)) continue;
        const nested = findMatrixNavTarget(element, caret);
        if (nested) return nested;
        return { kind: "matrix", row, col, element, matrix };
      }
    }
  }

  if (expr.kind === "BinaryExpression") {
    const binary = expr as BinaryExpression;
    if (caretInExpr(binary.left, caret)) {
      const nested = findMatrixNavTarget(binary.left, caret);
      if (nested) return nested;
    }
    if (caretInExpr(binary.right, caret)) {
      const nested = findMatrixNavTarget(binary.right, caret);
      if (nested) return nested;
    }
  }

  if (expr.kind === "ParenExpression") {
    if (caretInExpr(expr.expr, caret)) {
      return findMatrixNavTarget(expr.expr, caret);
    }
  }

  return null;
}

function findBinaryNavTarget(
  expr: Expression,
  caret: number,
): BinaryNavTarget | null {
  if (expr.kind === "BinaryExpression") {
    const binary = expr as BinaryExpression;
    const inLeft = caretInExpr(binary.left, caret);
    const inRight = caretInExpr(binary.right, caret);
    if (inLeft) {
      const nested = findBinaryNavTarget(binary.left, caret);
      if (nested) return nested;
    }
    if (inRight) {
      const nested = findBinaryNavTarget(binary.right, caret);
      if (nested) return nested;
    }
    if (!inLeft && !inRight) return null;
    if (binary.op === "/") {
      return {
        kind: "division",
        side: inLeft ? "left" : "right",
        left: binary.left,
        right: binary.right,
      };
    }
    if (binary.op === "^") {
      return {
        kind: "exponent",
        side: inLeft ? "left" : "right",
        left: binary.left,
        right: binary.right,
      };
    }
  }

  if (expr.kind === "ParenExpression") {
    if (caretInExpr(expr.expr, caret)) {
      return findBinaryNavTarget(expr.expr, caret);
    }
  }

  if (expr.kind === "MatrixExpression") {
    const matrix = (expr as MatrixExpression).matrix;
    for (const row of matrix) {
      for (const element of row) {
        if (!caretInExpr(element, caret)) continue;
        const nested = findBinaryNavTarget(element, caret);
        if (nested) return nested;
      }
    }
  }

  return null;
}

export default function Calculator() {
  const [text, setText] = useState("");
  const [caret, setCaret] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const fontSize = 1;

  const { expr } = useMemo(() => {
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

  const simplifiedExpr = useMemo(() => {
    return simplify(expr);
  }, [expr]);

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
      case "ArrowUp":
      case "ArrowDown": {
        const direction = k === "ArrowUp" ? "up" : "down";
        const matrixTarget = findMatrixNavTarget(expr, caret);
        if (matrixTarget) {
          const targetRow =
            direction === "up" ? matrixTarget.row - 1 : matrixTarget.row + 1;
          const rowElements = matrixTarget.matrix[targetRow];
          if (rowElements && matrixTarget.col < rowElements.length) {
            e.preventDefault();
            const targetElement = rowElements[matrixTarget.col];
            const offset = caret - matrixTarget.element.start;
            setCaret(clampCaret(targetElement, offset));
          }
          break;
        }
        const binaryTarget = findBinaryNavTarget(expr, caret);
        if (binaryTarget) {
          const movingUp = direction === "up";
          if (movingUp && binaryTarget.side === "right") {
            e.preventDefault();
            const offset = caret - binaryTarget.right.start;
            setCaret(clampCaret(binaryTarget.left, offset));
          } else if (!movingUp && binaryTarget.side === "left") {
            e.preventDefault();
            const offset = caret - binaryTarget.left.start;
            setCaret(clampCaret(binaryTarget.right, offset));
          }
        }
        break;
      }
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
      case "T":
      case "x":
        e.preventDefault();
        setText(text.slice(0, caret) + k + text.slice(caret));
        setCaret(caret + 1);
        break;
    }
  }

  return (
    <div className="comp-line">
      <div
        className="input-box"
        role="textbox"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <RenderInteractiveExpr
          expr={expr}
          text={text}
          caret={isFocused ? caret : -1}
          fontSize={fontSize}
        />
      </div>
      <div className="output-box">
        <RenderExpr expr={simplifiedExpr} fontSize={fontSize} />
      </div>
    </div>
  );
}
