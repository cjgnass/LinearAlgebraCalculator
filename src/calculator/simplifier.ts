import type {
  Expression,
  NumberLiteral,
  BinaryExpression,
  MatrixExpression,
} from "./ast.ts";

const nanExpr: NumberLiteral = {
  kind: "NumberLiteral",
  value: NaN,
  start: 0,
  end: 0,
};

function isValidMatrix(expr: Expression): boolean {
  if (expr.kind !== "MatrixExpression") return false;
  const matrix = expr.matrix;
  const rows = matrix.length;
  const cols = matrix[0].length;
  for (let row = 0; row < rows; row++) {
    if (matrix[row].length !== cols) {
      return false;
    }
  }
  return true;
}

function getMatrixDimensions(expr: MatrixExpression): number[] {
  const matrix = expr.matrix;
  const rows = matrix.length;
  const cols = matrix[0].length;
  return [rows, cols];
}

function simplifyAddition(
  expr: BinaryExpression,
): NumberLiteral | MatrixExpression {
  const left = simplify(expr.left);
  const right = simplify(expr.right);
  if (left.kind === "NumberLiteral" && right.kind === "NumberLiteral") {
    return {
      kind: "NumberLiteral",
      value: left.value + right.value,
      start: 0,
      end: 0,
    };
  }
  if (!isValidMatrix(left) || !isValidMatrix(right)) return nanExpr;
  const leftMatrixExpr = left as MatrixExpression;
  const rightMatrixExpr = right as MatrixExpression;
  const leftDimensions = getMatrixDimensions(leftMatrixExpr);
  const rightDimensions = getMatrixDimensions(rightMatrixExpr);
  if (leftDimensions[0] !== rightDimensions[0]) return nanExpr;
  if (leftDimensions[1] !== rightDimensions[1]) return nanExpr;
  const rows = leftDimensions[0];
  const cols = leftDimensions[1];
  const outputMatrix: Expression[][] = [];
  for (let row = 0; row < rows; row++) {
    const outputMatrixRow: Expression[] = [];
    for (let col = 0; col < cols; col++) {
      const outputLeftElement = simplify(leftMatrixExpr.matrix[row][col]);
      const outputRightElement = simplify(rightMatrixExpr.matrix[row][col]);
      if (outputLeftElement.kind !== "NumberLiteral") return nanExpr;
      if (outputRightElement.kind !== "NumberLiteral") return nanExpr;
      const simplifiedValue =
        (outputLeftElement as NumberLiteral).value +
        (outputRightElement as NumberLiteral).value;
      outputMatrixRow.push({
        kind: "NumberLiteral",
        value: simplifiedValue,
        start: 0,
        end: 0,
      });
    }
    outputMatrix.push(outputMatrixRow);
  }
  return {
    kind: "MatrixExpression",
    matrix: outputMatrix,
    start: 0,
    end: 0,
  };
}
function simplifySubtraction(
  expr: BinaryExpression,
): NumberLiteral | MatrixExpression {
  const left = simplify(expr.left);
  const right = simplify(expr.right);
  if (left.kind === "NumberLiteral" && right.kind === "NumberLiteral") {
    return {
      kind: "NumberLiteral",
      value: left.value - right.value,
      start: 0,
      end: 0,
    };
  }
  if (!isValidMatrix(left) || !isValidMatrix(right)) return nanExpr;
  const leftMatrixExpr = left as MatrixExpression;
  const rightMatrixExpr = right as MatrixExpression;
  const leftDimensions = getMatrixDimensions(leftMatrixExpr);
  const rightDimensions = getMatrixDimensions(rightMatrixExpr);
  if (leftDimensions[0] !== rightDimensions[0]) return nanExpr;
  if (leftDimensions[1] !== rightDimensions[1]) return nanExpr;
  const rows = leftDimensions[0];
  const cols = leftDimensions[1];
  const outputMatrix: Expression[][] = [];
  for (let row = 0; row < rows; row++) {
    const outputMatrixRow: Expression[] = [];
    for (let col = 0; col < cols; col++) {
      const outputLeftElement = simplify(leftMatrixExpr.matrix[row][col]);
      const outputRightElement = simplify(rightMatrixExpr.matrix[row][col]);
      if (outputLeftElement.kind !== "NumberLiteral") return nanExpr;
      if (outputRightElement.kind !== "NumberLiteral") return nanExpr;
      const simplifiedValue =
        (outputLeftElement as NumberLiteral).value -
        (outputRightElement as NumberLiteral).value;
      outputMatrixRow.push({
        kind: "NumberLiteral",
        value: simplifiedValue,
        start: 0,
        end: 0,
      });
    }
    outputMatrix.push(outputMatrixRow);
  }
  return {
    kind: "MatrixExpression",
    matrix: outputMatrix,
    start: 0,
    end: 0,
  };
}

function simplifyMultiplication(
  expr: BinaryExpression,
): NumberLiteral | MatrixExpression {
  const left = simplify(expr.left);
  const right = simplify(expr.right);
  if (left.kind === "NumberLiteral" && right.kind === "NumberLiteral")
    return nanExpr;

  if (
    (left.kind === "NumberLiteral" && right.kind === "MatrixExpression") ||
    (left.kind === "MatrixExpression" && right.kind === "NumberLiteral")
  ) {
    const matrixExpr: MatrixExpression =
      left.kind === "MatrixExpression"
        ? (left as MatrixExpression)
        : (right as MatrixExpression);
    const scalarExpr: NumberLiteral =
      left.kind === "NumberLiteral"
        ? (left as NumberLiteral)
        : (right as NumberLiteral);

    if (!isValidMatrix(matrixExpr)) return nanExpr;
    const matrix: Expression[][] = matrixExpr.matrix;
    const scalar: number = scalarExpr.value;
    const matrixDimensions = getMatrixDimensions(matrixExpr);
    const rows = matrixDimensions[0];
    const cols = matrixDimensions[1];
    const outputMatrix: Expression[][] = [[]];

    for (let row = 0; row < rows; row++) {
      const outputMatrixRow: Expression[] = [];
      for (let col = 0; col < cols; col++) {
        const element = simplify(matrix[row][col]);
        if (element.kind !== "NumberLiteral") return nanExpr;
        outputMatrixRow.push({
          kind: "NumberLiteral",
          value: element.value * scalar,
          start: 0,
          end: 0,
        });
      }
      outputMatrix.push(outputMatrixRow);
    }
    return { kind: "MatrixExpression", matrix: outputMatrix, start: 0, end: 0 };
  }
  if (left.kind !== "MatrixExpression")
    return { kind: "MatrixExpression", matrix: [[]], start: 0, end: 0 };
  if (right.kind !== "MatrixExpression")
    return { kind: "MatrixExpression", matrix: [[]], start: 0, end: 0 };

  const leftMatrix = left.matrix;
  const rightMatrix = right.matrix;

  if (!isValidMatrix(left) || !isValidMatrix(right))
    return {
      kind: "MatrixExpression",
      matrix: [[]],
      start: 0,
      end: 0,
    };
  const leftMatrixDimensions = getMatrixDimensions(left);
  const rightMatrixDimensions = getMatrixDimensions(right);
  const leftRows = leftMatrixDimensions[0];
  const leftCols = leftMatrixDimensions[1];
  const rightRows = rightMatrixDimensions[0];
  const rightCols = rightMatrixDimensions[1];
  if (leftCols !== rightRows) return nanExpr;
  const outputMatrix: Expression[][] = [];
  for (let i = 0; i < leftRows; i++) {
    const outputMatrixRow: Expression[] = [];
    for (let j = 0; j < rightCols; j++) {
      let sum = 0;
      for (let k = 0; k < leftCols; k++) {
        const leftElement = simplify(leftMatrix[i][k]);
        const rightElement = simplify(rightMatrix[k][j]);
        if (leftElement.kind !== "NumberLiteral") return nanExpr;
        if (rightElement.kind !== "NumberLiteral") return nanExpr;
        sum += leftElement.value * rightElement.value;
      }
      outputMatrixRow.push({
        kind: "NumberLiteral",
        value: sum,
        start: 0,
        end: 0,
      });
    }
    outputMatrix.push(outputMatrixRow);
  }
  return {
    kind: "MatrixExpression",
    matrix: outputMatrix,
    start: 0,
    end: 0,
  };
}

function simplifyDivision(
  expr: BinaryExpression,
): NumberLiteral | MatrixExpression {
  const left = simplify(expr.left);
  const right = simplify(expr.right);
  if (right.kind !== "NumberLiteral") return nanExpr;
  if (right.value === 0) return nanExpr;
  if (left.kind === "NumberLiteral") {
    return {
      kind: "NumberLiteral",
      value: left.value / right.value,
      start: 0,
      end: 0,
    };
  }
  if (left.kind === "MatrixExpression") {
    if (!isValidMatrix(left)) return nanExpr;
    const matrix: Expression[][] = left.matrix;
    const scalar: number = right.value;
    const matrixDimensions = getMatrixDimensions(left);
    const rows = matrixDimensions[0];
    const cols = matrixDimensions[1];
    const outputMatrix: Expression[][] = [[]];
    for (let row = 0; row < rows; row++) {
      const outputMatrixRow: Expression[] = [];
      for (let col = 0; col < cols; col++) {
        const element = simplify(matrix[row][col]);
        if (element.kind !== "NumberLiteral") return nanExpr;
        outputMatrixRow.push({
          kind: "NumberLiteral",
          value: element.value / scalar,
          start: 0,
          end: 0,
        });
      }
      outputMatrix.push(outputMatrixRow);
    }
    return { kind: "MatrixExpression", matrix: outputMatrix, start: 0, end: 0 };
  }
  return nanExpr;
}
function simplifyExponent(
  expr: BinaryExpression,
): NumberLiteral | MatrixExpression {
  const left = simplify(expr.left);
  const right = simplify(expr.right);
  if (left.kind === "NumberLiteral" && right.kind === "NumberLiteral") {
    return {
      kind: "NumberLiteral",
      value: left.value ** right.value,
      start: 0,
      end: 0,
    };
  }

  // need to finish matrix exponentiation, transpose, and inverse
  return nanExpr;
}

export function simplify(expr: Expression): NumberLiteral | MatrixExpression {
  switch (expr.kind) {
    case "BinaryExpression":
      if (expr.op === "+") return simplifyAddition(expr);
      if (expr.op === "-") return simplifySubtraction(expr);
      if (expr.op === "*") return simplifyMultiplication(expr);
      if (expr.op === "/") return simplifyDivision(expr);
      if (expr.op === "^") return simplifyExponent(expr);
      break;
    case "NumberLiteral":
      return expr as NumberLiteral;
    case "ParenExpression":
      return simplify(expr.expr);
    case "MatrixExpression":
      return expr as MatrixExpression;
    default:
      return {
        kind: "NumberLiteral",
        value: NaN,
        start: 0,
        end: 0,
      };
  }
  return {
    kind: "NumberLiteral",
    value: NaN,
    start: 0,
    end: 0,
  };
}
