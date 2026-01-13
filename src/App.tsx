import "./App.css";
import Calculator from "./calculator/calculator.tsx";
import Graph from "./graph/graph.tsx";
import { useState, useCallback, useEffect } from "react";
import type { Expression } from "./calculator/ast.ts";

interface CalculatorsProps {
  onChange?: (expressionsToGraph: Map<number, Expression>) => void;
}

function App() {
  const [exprToGraph, setExprToGraph] = useState(new Map<number, Expression>());
  const onToGraphChange = useCallback(
    (expressionToGraph: Map<number, Expression>) => {
      setExprToGraph(expressionToGraph);
    },
    [],
  );

  return (
    <div className="main">
      <div className="head"></div>
      <div className="body">
        <Calculators onChange={onToGraphChange} />
        <div className="graph-area">
          <Graph exprs={exprToGraph} />
        </div>
      </div>
    </div>
  );
}

function Calculators({ onChange }: CalculatorsProps): React.ReactNode {
  const [rows, setRows] = useState(new Map([[1, true]]));
  const [rowCount, setRowCount] = useState(1);
  const [expressions, setExpressions] = useState<Map<number, Expression>>(
    new Map(),
  );

  useEffect(() => {
    if (onChange) {
      const exprToGraph = new Map<number, Expression>();
      for (const [id, shouldGraph] of rows) {
        if (shouldGraph) {
          const expr = expressions.get(id);
          if (expr) {
            exprToGraph.set(id, expr);
          }
        }
      }
      onChange(exprToGraph);
    }
  }, [rows, expressions, onChange]);

  const addRow = () => {
    const newRowId = rowCount + 1;
    const newRows = new Map(rows);
    newRows.set(newRowId, true);
    setRows(newRows);
    setRowCount(newRowId);
  };

  const removeRow = (row: number) => {
    if (rows.size <= 1) return;
    const newRows = new Map(rows);
    newRows.delete(row);
    setRows(newRows);
    // Also remove the expression for the deleted row
    const newExpressions = new Map(expressions);
    newExpressions.delete(row);
    setExpressions(newExpressions);
  };

  const toggleGraphRow = (row: number) => {
    const newRows = new Map(rows);
    newRows.set(row, !newRows.get(row));
    setRows(newRows);
  };

  const handleExpressionChange = useCallback(
    (rowId: number, expr: Expression) => {
      setExpressions((prev) => {
        const newExpressions = new Map(prev);
        newExpressions.set(rowId, expr);
        return newExpressions;
      });
    },
    [],
  );

  // Access all simplified expressions here
  // For example, to log them:
  // console.log("All expressions:", expressions);
  // console.log("All rows:", rows);

  return (
    <div className="calc-area">
      {[...rows.keys()].map((row: number) => (
        <div className="calc-row" key={row}>
          <button
            className="remove-button"
            onClick={() => removeRow(row)}
            aria-label="Remove row"
            type="button"
          >
            x
          </button>
          <Calculator rowId={row} onChange={handleExpressionChange} />
          <button
            className="graph-button"
            onClick={() => toggleGraphRow(row)}
            style={{
              background: rows.get(row) ? "#AAAAAA" : "transparent",
            }}
          ></button>
        </div>
      ))}
      <button className="add-button" onClick={addRow} type="button">
        Add Row
      </button>
    </div>
  );
}

export default App;
