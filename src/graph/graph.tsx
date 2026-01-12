import { useCallback, useEffect, useRef, useState } from "react";
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

  const [viewport, setViewport] = useState<Viewport>({
    centerX: 0,
    centerY: 0,
    zoom: 50, // 50 pixels per graph unit
  });

  // Track drag state
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;

      // Convert pixel delta to graph units (divide by zoom)
      // Invert the delta so dragging right moves the view right (center moves left)
      setViewport((prev) => ({
        ...prev,
        centerX: prev.centerX - deltaX / prev.zoom,
        centerY: prev.centerY + deltaY / prev.zoom, // Y is inverted in canvas coordinates
      }));

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    },
    [],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
  }, []);

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
      <canvas
        ref={canvasRef}
        className="graph-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}

export default Graph;
