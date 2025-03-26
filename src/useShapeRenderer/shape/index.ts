import type {  DragHandler } from './type'
import {  ShapeType, DragHandlerType } from './type'
import { Circle} from './Circle'
import { Rectangle} from './Rectangle'
import { Shape} from './Shape'
import { Seal} from './Seal'
import { Signature } from './Signature'



function createShape(type: ShapeType, startX: number,
  startY: number,
  color: string,
  isFilled: boolean,
  handleSize: number = 5): Shape | null {
  switch (type) {
    case ShapeType.CIRCLE:
      return new Circle(startX, startY, color, isFilled, handleSize)
    case ShapeType.RECTANGLE:
      return new Rectangle(startX, startY, color, isFilled, handleSize)
    case ShapeType.SEAL:
      return new Seal(startX, startY, color, isFilled, handleSize)
    case ShapeType.SIGNATURE:
      return new Signature(startX, startY, color, isFilled, handleSize)
    default:
      return null
  }
}



export {
  DragHandlerType,
  ShapeType,
  Shape,
  Rectangle,
  Circle,
  Seal,
  Signature,
  createShape
}

export type {
  DragHandler
}
