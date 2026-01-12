import { useEffect, useRef, useState } from "react";
import type { Viewport } from "./coordinates";
import {
  clearCanvas,
  renderAxes,
  renderAxisLabels,
  renderGrid,
} from "./renderer";
import "./graph.css";

function Graph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [viewport] = useState<Viewport>({
    centerX: 0,
    centerY: 0,
    zoom: 50, // 50 pixels per graph unit
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = (width: number, height: number) => {
      clearCanvas(ctx, width, height);
      renderGrid(ctx, viewport, width, height);
      renderAxes(ctx, viewport, width, height);
      renderAxisLabels(ctx, viewport, width, height);
    };

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Avoid invalid sizes (can happen if element is display:none)
      if (rect.width <= 0 || rect.height <= 0) return;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      // Keep the CSS size in sync with layout size.
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Reset any previous scaling before applying DPR.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      render(rect.width, rect.height);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [viewport]);

  return (
    <div ref={containerRef} className="graph-container">
      <canvas ref={canvasRef} className="graph-canvas" />
    </div>
  );
}

export default Graph;
