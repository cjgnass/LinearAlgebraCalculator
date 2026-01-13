import { graphToScreen, getVisibleBounds, type Viewport } from "./coordinates";
import type { Expression, MatrixExpression } from "../calculator/ast";

const BACKGROUND_COLOR = "#AAAAAA";

function getGridSpacing(zoom: number): number {
  // We want roughly 50-100 pixels between grid lines.
  let gridSpacing = 1;
  while (gridSpacing * zoom < 50) {
    gridSpacing *= 2;
  }
  while (gridSpacing * zoom > 100) {
    gridSpacing /= 2;
  }
  return gridSpacing;
}

function formatTickValue(value: number, gridSpacing: number): string {
  const clamped = Math.abs(value) < 1e-10 ? 0 : value;

  const decimals =
    gridSpacing >= 1
      ? 0
      : Math.min(6, Math.max(0, Math.ceil(-Math.log10(gridSpacing)) + 1));

  const fixed = clamped.toFixed(decimals);

  // Trim trailing zeros (and an eventual trailing decimal point)
  return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

/**
 * Clear the canvas
 */
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);

  // Fill the visible canvas area (in CSS pixels).
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Render grid lines
 */
export function renderGrid(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  width: number,
  height: number,
): void {
  const bounds = getVisibleBounds(viewport, width, height);

  const gridSpacing = getGridSpacing(viewport.zoom);

  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1;

  // Draw vertical grid lines
  const startX = Math.floor(bounds.minX / gridSpacing) * gridSpacing;
  for (let x = startX; x <= bounds.maxX; x += gridSpacing) {
    const screen = graphToScreen(x, 0, viewport, width, height);
    ctx.beginPath();
    ctx.moveTo(screen.x, 0);
    ctx.lineTo(screen.x, height);
    ctx.stroke();
  }

  // Draw horizontal grid lines
  const startY = Math.floor(bounds.minY / gridSpacing) * gridSpacing;
  for (let y = startY; y <= bounds.maxY; y += gridSpacing) {
    const screen = graphToScreen(0, y, viewport, width, height);
    ctx.beginPath();
    ctx.moveTo(0, screen.y);
    ctx.lineTo(width, screen.y);
    ctx.stroke();
  }
}

/**
 * Render axes (x-axis and y-axis)
 */
export function renderAxes(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  width: number,
  height: number,
): void {
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;

  // Draw y-axis (x = 0)
  const yAxisScreen = graphToScreen(0, 0, viewport, width, height);
  ctx.beginPath();
  ctx.moveTo(yAxisScreen.x, 0);
  ctx.lineTo(yAxisScreen.x, height);
  ctx.stroke();

  // Draw x-axis (y = 0)
  const xAxisScreen = graphToScreen(0, 0, viewport, width, height);
  ctx.beginPath();
  ctx.moveTo(0, xAxisScreen.y);
  ctx.lineTo(width, xAxisScreen.y);
  ctx.stroke();
}

export function renderAxisLabels(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  width: number,
  height: number,
): void {
  const bounds = getVisibleBounds(viewport, width, height);
  const gridSpacing = getGridSpacing(viewport.zoom);

  const axis = graphToScreen(0, 0, viewport, width, height);

  ctx.save();
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "#000000";

  const paddingX = 4;
  const paddingY = 2;
  const axisLabelGap = 6;

  // X-axis labels (numbers along x) drawn near y=0
  if (axis.y >= 0 && axis.y <= height) {
    const placeBelow = axis.y + 18 + paddingY <= height;
    const labelY = placeBelow ? axis.y + axisLabelGap : axis.y - axisLabelGap;

    ctx.textAlign = "center";
    ctx.textBaseline = placeBelow ? "top" : "bottom";

    const startX = Math.floor(bounds.minX / gridSpacing) * gridSpacing;
    for (let x = startX; x <= bounds.maxX; x += gridSpacing) {
      // Avoid drawing -0
      const label = formatTickValue(x, gridSpacing);

      const screen = graphToScreen(x, 0, viewport, width, height);
      if (screen.x < 0 || screen.x > width) continue;

      // Skip if too close to canvas edges
      if (screen.x < 8 || screen.x > width - 8) continue;

      const metrics = ctx.measureText(label);
      const textW = metrics.width;
      const textH = 12; // approximate

      const rectX = screen.x - textW / 2 - paddingX;
      const rectY = placeBelow ? labelY - paddingY : labelY - textH - paddingY;
      const rectW = textW + paddingX * 2;
      const rectH = textH + paddingY * 2;

      // Mask gridline segments behind label.
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.fillRect(rectX, rectY, rectW, rectH);

      // Draw text.
      ctx.fillStyle = "#000000";
      ctx.fillText(label, screen.x, labelY);
    }
  }

  // Y-axis labels (numbers along y) drawn near x=0
  if (axis.x >= 0 && axis.x <= width) {
    const placeLeft = axis.x - 30 - paddingX >= 0;
    const labelX = placeLeft ? axis.x - axisLabelGap : axis.x + axisLabelGap;

    ctx.textAlign = placeLeft ? "right" : "left";
    ctx.textBaseline = "middle";

    const startY = Math.floor(bounds.minY / gridSpacing) * gridSpacing;
    for (let y = startY; y <= bounds.maxY; y += gridSpacing) {
      if (Math.abs(y) < 1e-10) continue; // avoid origin label overlap

      const label = formatTickValue(y, gridSpacing);
      const screen = graphToScreen(0, y, viewport, width, height);
      if (screen.y < 0 || screen.y > height) continue;

      if (screen.y < 8 || screen.y > height - 8) continue;

      const metrics = ctx.measureText(label);
      const textW = metrics.width;
      const textH = 12; // approximate

      const rectX = placeLeft ? labelX - textW - paddingX : labelX - paddingX;
      const rectY = screen.y - textH / 2 - paddingY;
      const rectW = textW + paddingX * 2;
      const rectH = textH + paddingY * 2;

      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.fillRect(rectX, rectY, rectW, rectH);

      ctx.fillStyle = "#000000";
      ctx.fillText(label, labelX, screen.y);
    }
  }

  ctx.restore();
}

export function renderExpressions(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  width: number,
  height: number,
  exprs: Map<number, Expression> | undefined,
): void {
  if (exprs) {
    for (const [, expr] of exprs) {
      switch (expr.kind) {
        case "MatrixExpression":
          renderMatrix(ctx, viewport, width, height, expr);
          break;
        default:
          break;
      }
    }
  }
}

function renderMatrix(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  width: number,
  height: number,
  expr: MatrixExpression,
) {
  const matrix = expr.matrix;
  const rows = matrix.length;
  if (rows === 0) return;
  const cols = matrix[0].length;

  for (let c = 0; c < cols; c++) {
    const xExpr = matrix[0][c];

    let yVal = 0;
    if (rows > 1) {
      const yExpr = matrix[1][c];
      if (!yExpr || !xExpr) return;

      if (yExpr.kind !== "NumberLiteral") continue;
      yVal = yExpr.value;
    }

    if (xExpr.kind !== "NumberLiteral") continue;
    const xVal = xExpr.value;

    drawVector(ctx, viewport, width, height, xVal, yVal);
  }
}

function drawVector(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  width: number,
  height: number,
  x: number,
  y: number,
) {
  const origin = graphToScreen(0, 0, viewport, width, height);
  const target = graphToScreen(x, y, viewport, width, height);

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(target.x, target.y);
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 3;
  ctx.stroke();

  if (x === 0 && y === 0) return;

  const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
  const headLength = 15;

  ctx.beginPath();
  ctx.moveTo(target.x, target.y);
  ctx.lineTo(
    target.x - headLength * Math.cos(angle - Math.PI / 6),
    target.y - headLength * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    target.x - headLength * Math.cos(angle + Math.PI / 6),
    target.y - headLength * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fillStyle = "#FF0000";
  ctx.fill();
}
