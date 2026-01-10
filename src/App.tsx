import "./App.css";
import Calculator from "./calculator/calculator";
import { useState } from "react";

function App() {
  const [rows, setRows] = useState([{ id: 0 }]);
  const [rowCount, setRowCount] = useState(1);

  const addRow = () => {
    setRows((prev) => {
      const nextId = prev.length ? prev[prev.length - 1].id + 1 : 0;
      return [...prev, { id: nextId }];
    });
    setRowCount(rowCount + 1);
  };

  const removeRow = (id: number) => {
    if (rowCount <= 1) return;
    setRows((prev) => prev.filter((row) => row.id !== id));
    setRowCount(rowCount - 1);
  };

  return (
    <>
      <div className="calc-area">
        {rows.map((row) => (
          <div className="calc-row" key={row.id}>
            <button
              className="remove-button"
              onClick={() => removeRow(row.id)}
              aria-label="Remove row"
              type="button"
            >
              x
            </button>
            <Calculator />
          </div>
        ))}
        <button className="add-button" onClick={addRow} type="button">
          Add Row
        </button>
      </div>
      <div className="graph-area"></div>
    </>
  );
}

export default App;
