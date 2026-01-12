import "./App.css";
import Calculator from "./calculator/calculator";
import Graph from "./graph/graph";
import { useState } from "react";

function App() {
  const [rows, setRows] = useState(new Map([[1, true]]));
  const [rowCount, setRowCount] = useState(1);

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
  };

  const toggleGraphRow = (row: number) => {
    const newRows = new Map(rows);
    newRows.set(row, !newRows.get(row));
    setRows(newRows);
  };

  return (
    <div className="main">
      <div className="head"></div>
      <div className="body">
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
              <Calculator />
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
        <div className="graph-area">
          <Graph />
        </div>
      </div>
    </div>
  );
}

export default App;
