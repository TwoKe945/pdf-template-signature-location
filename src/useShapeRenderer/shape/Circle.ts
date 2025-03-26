import { type DragHandler } from './type'
import { DragHandlerType, ShapeType } from './type'
import { Shape } from './Shape'


export class Circle extends Shape {

    constructor(public startX: number,
        public startY: number,
        public color: string,
        public isFilled: boolean,
        protected handleSize: number = 5) {
        super(startX, startY, color, isFilled, ShapeType.CIRCLE, handleSize)
        this.startX = startX - 50;
        this.startY = startY - 50;
        this.endX = startX + 50;
        this.endY = startY + 50;
    }


  protected get handles(): DragHandler[] {
    return [
      { type: DragHandlerType.CORNER, index: 0, x: this.startX, y: this.startY }, // 左上角
      { type: DragHandlerType.CORNER, index: 1, x: this.endX, y: this.startY },   // 右上角
      { type: DragHandlerType.CORNER, index: 2, x: this.startX, y: this.startY - (this.startX - this.endX) },   // 左下角
      { type: DragHandlerType.CORNER, index: 3, x: this.endX, y:  this.startY - (this.startX - this.endX) },     // 右下角
      { type: DragHandlerType.EDGE, index: 4, x: (this.startX + this.endX) / 2, y: this.startY }, // 上边中点
      { type: DragHandlerType.EDGE, index: 5, x: (this.startX + this.endX) / 2, y: this.startY - (this.startX - this.endX) },   // 下边中点
      { type: DragHandlerType.EDGE, index: 6, x: this.startX, y: (this.startY - (this.startX - this.endX) / 2) }, // 左边中点
      { type: DragHandlerType.EDGE, index: 7, x: this.endX, y:  (this.startY - (this.startX - this.endX) / 2) }    // 右边中点
    ]
  }

  protected doDrawBoundingBox(ctx: CanvasRenderingContext2D): void {
    ctx.strokeRect(this.startX, this.startY, Math.abs(this.endX - this.startX), Math.abs(this.endX - this.startX));
  }

  protected doDrawShape(ctx: CanvasRenderingContext2D): void {
    const radius = (this.endX - this.startX) / 2
    ctx.beginPath();
    ctx.arc(this.startX + radius, this.startY + radius, radius, 0, Math.PI * 2);
    if (this.isFilled) {
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    ctx.strokeStyle = this.color;
    ctx.stroke();
  }


  public isInside(x: number, y: number): boolean {
    const radius = (this.endX - this.startX) / 2
    return Math.hypot(x - (this.startX + radius), y - (this.startY + radius)) <= radius;
  }

  public doGetCursorAt(x: number, y: number): string | null {
    for (let handle of this.handles) {
        if (x >= handle.x - this.halfHandle && x <= handle.x + this.halfHandle &&
            y >= handle.y - this.halfHandle && y <= handle.y + this.halfHandle) {
            switch (handle.index) {
                case 0: // 左上角
                case 3: // 右下角
                    return 'nwse-resize';
                case 1: // 右上角
                case 2: // 左下角
                    return 'nesw-resize';
                case 4: // 上边中点
                case 5: // 下边中点
                    return 'ns-resize';
                case 6: // 左边中点
                case 7: // 右边中点
                    return 'ew-resize';
            }
        }
    }
    return null; // 如果没有点击任何拖拽点，则返回null
  }

  public doUpdateByHandle(handle: DragHandler, newX: number, newY: number): void {
    let dx = 0;
    switch (handle.index) {
        case 0: // 左上角
            this.startX = newX;
            dx = this.startX - this.endX;
            this.startY = dx + this.endY;
            break;
        case 1: // 右上角
            this.endX = newX;
            dx = this.endX - this.startX;
            this.startY = this.endY - dx;
            break;
        case 2: // 左下角
            this.startX = newX;
            dx = this.endX - this.startX;
            this.endY = this.startY + dx;
            break;
        case 3: // 右下角
            this.endX = newX;
            dx = this.endX - this.startX;
            this.endY = this.startY + dx;
            break;
        case 4: // 上边中点
            this.startY = newY;
            dx = this.endY - this.startY;
            this.endX = this.startX + dx;
            break;
        case 5: // 下边中点
            this.endY = newY;
            dx = this.endY - this.startY;
            this.endX = this.startX + dx;
            break;
        case 6: // 左边中点
            this.startX = newX;
            dx = this.endX - this.startX;
            this.endY = this.startY + dx;
            break;
        case 7: // 右边中点
            this.endX = newX;
            dx = this.endX - this.startX;
            this.endY = this.startY + dx;
            break;
    }
  }

  public get x(): number {
      return this.startX;
  }

  public set x(x: number) {
      const width = this.endX - this.startX;
      this.startX = x;
      this.endX = x + width;
  }

  public get y(): number {
      return this.startY;
  }

  public set y(y: number) {
      const height = this.endY - this.startY;
      this.startY = y;
      this.endY = y + height;
  }

  public get height(): number {
      return Math.abs(this.endY - this.startY);
  }

  public set height(val: number) {
    if (this.startY < this.endY) {
        this.endY = this.startY + val;
        this.endX = this.startX + val;
    } else {
        this.startY = this.endY - val;
        this.startX = this.endX + val;
    }
  }

  public get width(): number {
      return Math.abs(this.endX - this.startX);
  }

  public set width(val: number) {
    if (this.startX < this.endX) {
        this.endX = this.startX + val;
        this.endY = this.startY + val;
    } else {
        this.startX = this.endX - val;
        this.startY = this.endY - val;
    }
  }


}
