import { uuid } from '../../utils';
import { Rectangle } from './Rectangle'
import { ShapeType } from './type';


export class Signature extends Rectangle { 
  
  public group: string;
  public page: number;
  public remark: string;

  constructor(public startX: number,
    public startY: number,
    public color: string,
    public isFilled: boolean,
    protected handleSize: number = 5) {
    super(startX, startY, color, isFilled, handleSize)
    this.color = '#0000ff'
    this.startX = startX - 50;
    this.startY = startY - 15;
    this.endX = startX + 50;
    this.endY = startY + 15;
    this._type = ShapeType.SIGNATURE;
    this.group = uuid() // 默认分组
    this.page = 1; // 默认页码
    this.remark = ''
  }

  protected doDrawShape(ctx: CanvasRenderingContext2D): void {
    const width = this.endX - this.startX;
    const height = this.endY - this.startY;
    ctx.beginPath();
    ctx.rect(this.startX, this.startY, width, height);
    ctx.font = `${window.devicePixelRatio * 16}px Microsoft YaHei`;
    /*左右对齐方式 (center left right start end) 基准起始坐标*/
    ctx.textAlign = 'center';
    /*垂直对齐的方式 基线 baseline(top,bottom,middle) 基准起始坐标*/
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.color;
    ctx.fillText('手 写 签 名', this.startX + width / 2, this.startY + height / 2);
    ctx.strokeStyle = this.color;
    ctx.stroke();
    ctx.closePath()
  }
}
