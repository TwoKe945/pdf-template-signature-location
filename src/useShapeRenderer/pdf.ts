interface ScreenDimensions {
  width: number;
  height: number;
}

interface PdfDimensions {
  width: number;
  height: number;
}

export function convertScreenToPdf(
  screenX: number,
  screenY: number,
  height: number,
  screenDimensions: ScreenDimensions,
  pdfDimensions: PdfDimensions
): { pdfX: number; pdfY: number } {
  // 计算缩放比例
  const scale = Math.min(
      screenDimensions.width / pdfDimensions.width,
      screenDimensions.height / pdfDimensions.height
  );
  // 转换 x 坐标
  const pdfX = Math.floor(screenX / scale) ;

  // 转换 y 坐标并调整坐标系（从屏幕坐标系到 PDF 坐标系）
  const pdfY = Math.floor((screenDimensions.height - height - screenY) / scale);

  return { pdfX, pdfY };
}
