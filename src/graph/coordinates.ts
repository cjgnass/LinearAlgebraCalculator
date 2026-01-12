export type Viewport = {
  centerX: number;
  centerY: number;
  zoom: number; // pixels per graph unit
};

export type Bounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

/**
 * Convert graph coordinates to screen pixel coordinates
 */
export function graphToScreen(
  graphX: number,
  graphY: number,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  const screenX = (graphX - viewport.centerX) * viewport.zoom + canvasWidth / 2;
  const screenY = (viewport.centerY - graphY) * viewport.zoom + canvasHeight / 2;
  return { x: screenX, y: screenY };
}

/**
 * Convert screen pixel coordinates to graph coordinates
 */
export function screenToGraph(
  screenX: number,
  screenY: number,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  const graphX = (screenX - canvasWidth / 2) / viewport.zoom + viewport.centerX;
  const graphY = viewport.centerY - (screenY - canvasHeight / 2) / viewport.zoom;
  return { x: graphX, y: graphY };
}

/**
 * Calculate the visible bounds of the graph in graph coordinates
 */
export function getVisibleBounds(
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number
): Bounds {
  const topLeft = screenToGraph(0, 0, viewport, canvasWidth, canvasHeight);
  const bottomRight = screenToGraph(
    canvasWidth,
    canvasHeight,
    viewport,
    canvasWidth,
    canvasHeight
  );

  return {
    minX: topLeft.x,
    maxX: bottomRight.x,
    minY: bottomRight.y,
    maxY: topLeft.y,
  };
}
