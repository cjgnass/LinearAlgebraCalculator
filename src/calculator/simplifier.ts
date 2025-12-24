import type {
  Expression,
  NumberLiteral,
  BinaryExpression,
  MatrixExpression,
} from "./ast.ts";
// function validateMatrices(
//   left: MatrixExpression,
//   right: MatrixExpression,
// ): boolean {
//   const leftMatrix = left.matrix;
//   const rightMatrix = right.matrix;
//   if (leftMatrix.length !== rightMatrix.length) {
//     return false;
//   }
//   for (let i = 0; i < leftMatrix.length; i++) {
//     if (leftMatrix[i].length !== rightMatrix[i].length) {
//       return false;
//     }
//   }
//   return true;
// }

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
  if (!isValidMatrix(left) || !isValidMatrix(right))
    return { kind: "MatrixExpression", matrix: [[]], start: 0, end: 0 };
  const leftMatrixExpr = left as MatrixExpression;
  const rightMatrixExpr = right as MatrixExpression;
  const leftDimensions = getMatrixDimensions(leftMatrixExpr);
  const rightDimensions = getMatrixDimensions(rightMatrixExpr);

  if (leftDimensions[0] !== rightDimensions[0])
    return { kind: "MatrixExpression", matrix: [[]], start: 0, end: 0 };
  if (leftDimensions[1] !== rightDimensions[1])
    return { kind: "MatrixExpression", matrix: [[]], start: 0, end: 0 };

  const rows = leftDimensions[0];
  const cols = leftDimensions[1];
  const outputMatrix: Expression[][] = [];
  for (let row = 0; row < rows; row++) {
    const outputMatrixRow: Expression[] = [];
    for (let col = 0; col < cols; col++) {
      const outputLeftElement = simplify(leftMatrixExpr.matrix[row][col]);
      const outputRightElement = simplify(rightMatrixExpr.matrix[row][col]);
      if (
        outputLeftElement.kind !== "NumberLiteral" ||
        outputRightElement.kind !== "NumberLiteral"
      ) {
        return {
          kind: "MatrixExpression",
          matrix: [[]],
          start: 0,
          end: 0,
        };
      }
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
  if (!isValidMatrix(left) || !isValidMatrix(right))
    return { kind: "MatrixExpression", matrix: [[]], start: 0, end: 0 };
  const leftMatrixExpr = left as MatrixExpression;
  const rightMatrixExpr = right as MatrixExpression;
  const leftDimensions = getMatrixDimensions(leftMatrixExpr);
  const rightDimensions = getMatrixDimensions(rightMatrixExpr);

  if (leftDimensions[0] !== rightDimensions[0])
    return { kind: "MatrixExpression", matrix: [[]], start: 0, end: 0 };
  if (leftDimensions[1] !== rightDimensions[1])
    return { kind: "MatrixExpression", matrix: [[]], start: 0, end: 0 };

  const rows = leftDimensions[0];
  const cols = leftDimensions[1];
  const outputMatrix: Expression[][] = [];
  for (let row = 0; row < rows; row++) {
    const outputMatrixRow: Expression[] = [];
    for (let col = 0; col < cols; col++) {
      const outputLeftElement = simplify(leftMatrixExpr.matrix[row][col]);
      const outputRightElement = simplify(rightMatrixExpr.matrix[row][col]);
      if (
        outputLeftElement.kind !== "NumberLiteral" ||
        outputRightElement.kind !== "NumberLiteral"
      ) {
        return {
          kind: "MatrixExpression",
          matrix: [[]],
          start: 0,
          end: 0,
        };
      }
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

// function simplifyMultiplication(
//   expr: BinaryExpression,
// ): NumberLiteral | MatrixExpression {
//   const left = simplify(expr.left);
//   const right = simplify(expr.right);
//   if (left.kind === "NumberLiteral" && right.kind === "NumberLiteral") {
//     return {
//       kind: "NumberLiteral",
//       value: left.value + right.value,
//       start: 0,
//       end: 0,
//     };
//   }
//   if (!isValidMatrix(left) || !isValidMatrix(right))
//     return { kind: "MatrixExpression", matrix: [[]], start: 0, end: 0 };
//   const leftMatrixExpr = left as MatrixExpression;
//   const rightMatrixExpr = right as MatrixExpression;
//   const leftDimensions = getMatrixDimensions(leftMatrixExpr);
//   const rightDimensions = getMatrixDimensions(rightMatrixExpr);

//   if (leftDimensions[0] !== rightDimensions[0])
//     return { kind: "MatrixExpression", matrix: [[]], start: 0, end: 0 };
//   if (leftDimensions[1] !== rightDimensions[1])
//     return { kind: "MatrixExpression", matrix: [[]], start: 0, end: 0 };

//   const rows = leftDimensions[0];
//   const cols = leftDimensions[1];
//   const outputMatrix: Expression[][] = [];
//   for (let row = 0; row < rows; row++) {
//     const outputMatrixRow: Expression[] = [];
//     for (let col = 0; col < cols; col++) {
//       const outputLeftElement = simplify(leftMatrixExpr.matrix[row][col]);
//       const outputRightElement = simplify(rightMatrixExpr.matrix[row][col]);
//       if (
//         outputLeftElement.kind !== "NumberLiteral" ||
//         outputRightElement.kind !== "NumberLiteral"
//       ) {
//         return {
//           kind: "MatrixExpression",
//           matrix: [[]],
//           start: 0,
//           end: 0,
//         };
//       }
//       const simplifiedValue =
//         (outputLeftElement as NumberLiteral).value +
//         (outputRightElement as NumberLiteral).value;
//       outputMatrixRow.push({
//         kind: "NumberLiteral",
//         value: simplifiedValue,
//         start: 0,
//         end: 0,
//       });
//     }
//     outputMatrix.push(outputMatrixRow);
//   }
//   return {
//     kind: "MatrixExpression",
//     matrix: outputMatrix,
//     start: 0,
//     end: 0,
//   };
// }

function simplifyTranspose(expr: MatrixExpression): MatrixExpression {
  const matrix = expr.matrix;
  const transposedMatrix = matrix[0].map((_, colIndex) =>
    matrix.map((row) => row[colIndex]),
  );
  return {
    kind: "MatrixExpression",
    matrix: transposedMatrix,
    start: 0,
    end: 0,
  };
}

function simplyDotProduct(
  v1: MatrixExpression,
  v2: MatrixExpression,
): NumberLiteral {
  const matrix1 = v1.matrix;
  const matrix2 = v2.matrix;
  let value = 0;
  if (
    matrix1.length !== matrix2.length ||
    matrix1[0].length !== matrix2[0].length
  ) {
    return {
      kind: "NumberLiteral",
      value: 0,
      start: 0,
      end: 0,
    };
  }
  for (let i = 0; i < matrix1.length; i++) {
    if (matrix1[i].length !== matrix2[i].length) {
      return {
        kind: "NumberLiteral",
        value: 0,
        start: 0,
        end: 0,
      };
    }
    value +=
      (matrix1[i][0] as NumberLiteral).value *
      (matrix2[i][0] as NumberLiteral).value;
  }
  return {
    kind: "NumberLiteral",
    value,
    start: 0,
    end: 0,
  };
}

function simplifyMultiplication(
  expr: BinaryExpression,
): NumberLiteral | MatrixExpression {
  const left = simplify(expr.left);
  const right = simplify(expr.right);
  if (left.kind === "NumberLiteral" && right.kind === "NumberLiteral") {
    return {
      kind: "NumberLiteral",
      value: left.value * right.value,
      start: 0,
      end: 0,
    };
  }
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

    if (!isValidMatrix(matrixExpr))
      return {
        kind: "MatrixExpression",
        matrix: [[]],
        start: 0,
        end: 0,
      };
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
        if (element.kind !== "NumberLiteral") {
          return {
            kind: "MatrixExpression",
            matrix: outputMatrix,
            start: 0,
            end: 0,
          };
        }

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

  if (
    !(left.kind === "MatrixExpression" && right.kind === "MatrixExpression")
  ) {
    return { kind: "NumberLiteral", value: 0, start: 0, end: 0 };
  }

  const leftMatrix = left.matrix;
  const rightMatrix = right.matrix;

  // Check if matrices are valid (not empty)
  if (leftMatrix.length === 0 || rightMatrix.length === 0) {
    return { kind: "MatrixExpression", matrix: [[]], start: 0, end: 0 };
  }

  const rows1 = leftMatrix.length;
  const cols1 = leftMatrix[0].length;
  const rows2 = rightMatrix.length;
  const cols2 = rightMatrix[0].length;

  // Check if multiplication is valid: cols of matrix1 must equal rows of matrix2
  if (cols1 !== rows2) {
    return { kind: "MatrixExpression", matrix: [[]], start: 0, end: 0 };
  }

  // Initialize result matrix
  const result: Expression[][] = [];

  // Perform matrix multiplication
  for (let i = 0; i < rows1; i++) {
    result[i] = [];
    for (let j = 0; j < cols2; j++) {
      let sum = 0;
      // Calculate dot product of row i and column j
      for (let k = 0; k < cols1; k++) {
        const val1 = simplify(leftMatrix[i][k]);
        const val2 = simplify(rightMatrix[k][j]);

        // Only multiply if both are NumberLiterals
        if (val1.kind === "NumberLiteral" && val2.kind === "NumberLiteral") {
          sum += val1.value * val2.value;
        } else {
          // If non-numeric elements found, return empty matrix
          return {
            kind: "MatrixExpression",
            matrix: [[]],
            start: 0,
            end: 0,
          };
        }
      }

      result[i][j] = {
        kind: "NumberLiteral",
        value: sum,
        start: 0,
        end: 0,
      };
    }
  }

  return {
    kind: "MatrixExpression",
    matrix: result,
    start: 0,
    end: 0,
  };
}

export function simplify(expr: Expression): NumberLiteral | MatrixExpression {
  switch (expr.kind) {
    case "BinaryExpression":
      if (expr.op === "+") return simplifyAddition(expr);
      if (expr.op === "-") return simplifySubtraction(expr);
      if (expr.op === "*") return simplifyMultiplication(expr);
      if (expr.op === "/")
        return {
          kind: "NumberLiteral",
          value: simplify(expr.left).value / simplify(expr.right).value,
        };
      if (expr.op === "^")
        return {
          kind: "NumberLiteral",
          value: simplify(expr.left).value ** simplify(expr.right).value,
        };
      break;
    case "NumberLiteral":
      return expr;
    case "ParenExpression":
      return simplify(expr.expr);
    case "MatrixExpression":
      return expr;
    default:
      return expr;
  }
}
