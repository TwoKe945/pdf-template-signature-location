export enum ShapeType {
  RECTANGLE = "rectangle",
  CIRCLE = "circle",
  NONE = "none",
  SEAL = "seal",
  SIGNATURE = 'signature'
}

export enum DragHandlerType {
  NONE,
  CORNER,
  EDGE
}

export interface DragHandler {
  type: DragHandlerType;
  index: number
  x: number;
  y: number;
}
