import type { DragHandler, ShapeType } from './type'
import { uuid } from '../../utils'

/**
 * 图形
 */
export abstract class Shape {
  public readonly id: string;
  public endX: number;
  public endY: number;
  protected boundingBox: boolean;
  public boundingBoxColor: string;
  public dragingHandleColor: string;

  constructor(public startX: number,
      public startY: number,
      public color: string,
      public isFilled: boolean,
      protected _type: ShapeType,
      protected handleSize: number = 5
    ) {
      this.boundingBox = false;
      this.boundingBoxColor = '#0000ff'
      this.dragingHandleColor = '#000000'
      this.endX = startX;
      this.endY = startY;
      this.id =  uuid();
    }
  protected get halfHandle(): number {
    return this.handleSize / 2;
  }

  public get type(): ShapeType {
    return this._type;
  }

  public abstract get x(): number;
  public abstract set x(x: number);
  public abstract get y(): number;
  public abstract set y(y: number);
  
  public abstract get height(): number;
  public abstract set height(val: number);
  public abstract get width(): number;
  public abstract set width(val: number);

  update(endX: number, endY: number) {
      this.endX = endX;
      this.endY = endY;
  }

  showBoundingBox() {
    this.boundingBox = true;
  }

  hiddenBoundingBox() {
    this.boundingBox = false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.doDrawShape(ctx);
    // 绘制拖拽点
    if (this.boundingBox) {
        this.drawHandles(ctx);
        this.drawBoundingBox(ctx);
    }
  }
  protected drawHandles(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.dragingHandleColor;
    this.handles.forEach(handle => {
        this.doDrawHandle(ctx, handle);
    });
  }
  protected drawBoundingBox(ctx: CanvasRenderingContext2D): void {
    const dashStyle = [5, 5]; // 虚线样式：5像素实线，5像素空白
    ctx.save(); // 保存当前绘图状态
    ctx.setLineDash(dashStyle); // 设置虚线样式
    ctx.strokeStyle = this.boundingBoxColor; // 边界颜色
    this.doDrawBoundingBox(ctx);
    ctx.restore(); // 恢复绘图状态
  }
  protected doDrawHandle(ctx: CanvasRenderingContext2D, handle: DragHandler): void {
    ctx.fillRect(handle.x - this.halfHandle, handle.y - this.halfHandle, this.handleSize, this.handleSize);
  }

  public getHandleAt(x: number, y: number): DragHandler | null {
    for (let handle of this.handles) {
        if (x >= handle.x - this.halfHandle && x <= handle.x + this.halfHandle &&
            y >= handle.y - this.halfHandle && y <= handle.y + this.halfHandle) {
            return handle;
        }
    }
    return null;
  }

  public updateByHandle(handle: DragHandler, newX: number, newY: number): void {
    if (!this.boundingBox) return
    this.doUpdateByHandle(handle, newX, newY);
  }

  public getCursorAt(x: number, y: number): string | null {
    if (!this.boundingBox) return null
    return this.doGetCursorAt(x, y);
  }

  public abstract isInside(x: number, y: number): boolean;
  protected abstract get handles(): DragHandler[];
  protected abstract doGetCursorAt(x: number, y: number): string | null;
  protected abstract doDrawBoundingBox(ctx: CanvasRenderingContext2D): void;
  protected abstract doDrawShape(ctx: CanvasRenderingContext2D): void;
  protected abstract doUpdateByHandle(handle: DragHandler, newX: number, newY: number): void;
}
