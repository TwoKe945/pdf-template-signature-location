import { Circle } from './Circle'
import SealSvg from "../../assets/seal.svg?raw";
import { ShapeType } from './type';
import { uuid } from '../../utils'

const image = new Image();
image.src = 'data:image/svg+xml;base64,' + window.btoa(SealSvg);

export class Seal extends Circle {

  public group: string;
  public page: number;
  public remark: string;

   constructor(public startX: number,
      public startY: number,
      public color: string,
      public isFilled: boolean,
      protected handleSize: number = 5) {
      super(startX, startY, color, isFilled, handleSize)
      this.startX = startX - 75.5;
      this.startY = startY - 75.5;
      this.endX = startX + 75.5;
      this.endY = startY + 75.5;
      this._type = ShapeType.SEAL;
      this.group = uuid() // 默认分组
      this.page = 1; // 默认页码
      this.remark = ''
  }

  protected doDrawShape(ctx: CanvasRenderingContext2D): void {
    const width = this.endX - this.startX
    ctx.beginPath();
    ctx.arc(this.startX + width / 2, this.startY + width / 2, width / 2, 0, Math.PI * 2);
    ctx.drawImage(image, this.startX, this.startY, width, width);
    ctx.strokeStyle = this.color;
    ctx.stroke();
  }


}
