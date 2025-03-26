import { Shape, DragHandlerType, ShapeType, createShape as factoryCreateShape } from './shape'
import type { DragHandler } from './shape'

export class ShapeRenderer {

 
  private shapes: Shape[];
  public onSelectedShape: (shapeId: string | null) => void = () => {}

  protected createShapes(shapes: Shape[] = []): Shape[] {
    const updateShapes = this.onUpdateShapes.bind(this)
    updateShapes(shapes)
    return new Proxy(shapes, {
      set(target, prop, value) {
        if (prop === 'length') {
          updateShapes(target)
        }
        return Reflect.set(target, prop, value);
      },
      get(target, prop) {
        if (prop === 'length') {
          return target.length;
        } else {
          return Reflect.get(target, prop);
        }
      },
    })
  }

  protected createShape(shape: Shape | null): Shape | null {
    if (!shape) return null;
    const updateShape = this.onUpdateShape.bind(this)
    return new Proxy(shape, {
      set(target, prop, value) {
        updateShape(target);
        return Reflect.set(target, prop, value);
      },
      get(target, prop) {
        return Reflect.get(target, prop);
      },
    })
  }

  constructor(public canvas: HTMLCanvasElement,
    private onUpdateShapes: (shapes: Shape[]) => void = () => {},
    private onUpdateShape: (shapes: Shape) => void = () => {},
    private ctx: CanvasRenderingContext2D = canvas.getContext('2d')!,
    private currentShape: Shape|null = null,
    private isDrawing: boolean = false,
    private currentColor: string = '#ff0000',
    private currentFill: boolean = true,
    private currentShapeType: ShapeType = ShapeType.NONE,
    private selectedShape: Shape|null = null,
    private isDragging: boolean = false,
    private dragType: DragHandlerType = DragHandlerType.NONE,
    private offsetX: number = 0,
    private offsetY: number = 0,
    private selectedHandle: DragHandler | null = null,
    private widthOfMovingShape: number = 0,
    private heightOfMovingShape: number = 0
  ) {
    this.shapes = this.createShapes(),
    this.setupEventListeners();
    this.adjustForHighDPI();
  }

  adjustForHighDPI() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio;
    this.canvas.width = rect.width * ratio;
    this.canvas.height = rect.height * ratio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(ratio, ratio);
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    // 添加鼠标移动事件以更新光标样式
    this.canvas.addEventListener('mousemove', this.handleMouseMoveForCursor.bind(this));
   window.document.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Delete') {
      if (this.selectedShape) {
        this.delete(this.selectedShape.id)
      }
    }
  }

  selectShapeById(id: string) {
    if (this.selectedShape && this.selectedShape.id === id) return
    const shape = this.shapes.find(item => item.id === id)
    if (!shape) return
    for (let shape of this.shapes) {
      shape.hiddenBoundingBox()
  }
    this.selectedShape = shape;
    this.dragType = DragHandlerType.NONE;
    this.selectedShape.showBoundingBox()
    this.onSelectedShape(shape.id)
    this.redraw()
  }

  setCurrentShapeType(type: ShapeType): void {
    this.currentShapeType = type;
  }

  handleMouseDown(e: MouseEvent) {
    const pos = this.getMousePosition(e);
    if (this.currentShape) {
        // 如果正在绘制新形状，则不处理已有形状的拖拽
        return;
    }
    for (let shape of this.shapes) {
        shape.hiddenBoundingBox()
    }
    this.onSelectedShape(null)
    this.selectedShape = null;
    for(let idx =   this.shapes.length -1; idx >= 0; idx--) {
      const shape =  this.shapes[idx];
      // 优先检测拖拽点
      const handle = shape.getHandleAt(pos.x, pos.y);
      if (handle) {
          this.selectedShape = shape;
          this.selectedHandle = handle;
          this.isDragging = true;
          this.dragType = handle.type;
          this.selectedShape.showBoundingBox()
          this.onSelectedShape(shape.id)
          return;
      }

      // 如果未点击拖拽点，检测是否点击矩形区域
      if (shape.isInside(pos.x, pos.y)) {
          this.selectedShape = shape;
          this.isDragging = true;
          this.dragType = DragHandlerType.NONE;
          this.offsetX = pos.x - shape.startX;
          this.offsetY = pos.y - shape.startY;
          this.widthOfMovingShape = shape.endX - shape.startX;
          this.heightOfMovingShape = shape.endY - shape.startY;
          this.selectedShape.showBoundingBox()
          this.onSelectedShape(shape.id)
          return;
      }
    }

    // 如果没有点击任何已有的形状，则开始绘制新形状
    this.currentShape = this.createShape(factoryCreateShape(this.currentShapeType, pos.x, pos.y, this.currentColor, this.currentFill));
    this.isDrawing = true;
  }
  handleMouseMove(e: MouseEvent) {
    if (!this.isDrawing && !this.isDragging) return;
    const pos = this.getMousePosition(e);
      if (this.isDragging && this.selectedShape) {
          if (this.dragType !== DragHandlerType.NONE && this.selectedHandle) {
              this.selectedShape.updateByHandle(this.selectedHandle, pos.x, pos.y);
          } else {
              this.selectedShape.startX = Math.round(pos.x - this.offsetX);
              this.selectedShape.startY = Math.round(pos.y - this.offsetY);
              this.selectedShape.endX = this.selectedShape.startX + this.widthOfMovingShape;
              this.selectedShape.endY =  this.selectedShape.startY + this.heightOfMovingShape;
          }
      } else if (this.isDrawing && this.currentShape) {
          this.currentShape.update(Math.round(pos.x), Math.round(pos.y));
      }
      this.redraw();
  }
  handleMouseUp(_e: MouseEvent) {
    if (this.isDrawing && this.currentShape) {
      if (Math.abs(this.currentShape.endX - this.currentShape.startX) *
      Math.abs(this.currentShape.endY - this.currentShape.startY) > 20
    ) {
      this.shapes.push(this.currentShape);
      }
      this.currentShape = null;
      this.isDrawing = false;
    }
    this.isDragging = false;
    this.selectedHandle = null;
    this.currentShapeType = ShapeType.NONE;
    this.dragType = DragHandlerType.NONE;
    this.redraw();
  }

  getShapes() {
    return this.shapes;
  }
  renderShapes(_shapes: Shape[]) {
    this.shapes = this.createShapes(_shapes);
    this.redraw();
  }


  handleMouseMoveForCursor(e: MouseEvent) {
    if (this.dragType !== DragHandlerType.NONE  && this.isDragging) return
    const pos = this.getMousePosition(e);
    let cursor = 'default'; // 默认光标样式

    for(let idx =   this.shapes.length -1; idx >= 0; idx--) {
      const shape =  this.shapes[idx];
      const cursorType = shape.getCursorAt(pos.x, pos.y);
      if (cursorType) {
          cursor = cursorType;
          break; // 找到第一个匹配的拖拽点后停止遍历
      } else if (shape.isInside(pos.x, pos.y)) {
          cursor = 'move'; // 如果鼠标在矩形区域内但不在拖拽点上，则显示移动光标
          break;
      }
    }
    this.canvas.style.cursor = cursor; // 动态设置画布的光标样式
  }
  getMousePosition(e: MouseEvent) {
      const rect = this.canvas.getBoundingClientRect();
      return {
          x: (e.clientX - rect.left) * (this.canvas.width / rect.width / window.devicePixelRatio),
          y: (e.clientY - rect.top) * (this.canvas.height / rect.height / window.devicePixelRatio)
      };
  }
  redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制已保存的形状
    this.shapes.forEach(shape => shape.draw(this.ctx));

    // 绘制当前正在绘制的形状
    if (this.currentShape) {
      this.currentShape.draw(this.ctx);
    }
  }

  clear(): void {
    this.shapes = this.createShapes();
    this.redraw();
  }

  delete(id: string): void {
    if(this.shapes.length <= 0) return
    const idx = this.shapes.findIndex(item => item.id == id)
    if (idx < 0) return
    this.shapes.splice(idx, 1)
    if (this.selectedShape && this.selectedShape.id == id) {
      this.selectedShape = null;
      this.dragType = DragHandlerType.NONE;
      this.onSelectedShape(null)
    }
    this.redraw();
  }

}
