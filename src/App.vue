<script setup lang="ts">
import * as lib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { ref, onMounted } from 'vue'
import { codeToHtml } from 'shiki'
import { useShapeRenderer, ShapeType, Seal, Signature, Shape, convertScreenToPdf } from './useShapeRenderer'
import clipboard from 'clipboard'
// @ts-ignore
lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

const pdfContainerRef = ref<HTMLDivElement>()

let pdfCanvas: HTMLCanvasElement | undefined;
let overlayCanvas: HTMLCanvasElement | undefined;

const [_,  { currentPageNo,  getShapes, renderShapes , selectedShape, createRender, clearCanvas, setShapeTypeOnDraw } ] = useShapeRenderer();

const totalPages = ref<number>(1)
const scale = ref(1)
const pdfName = ref<string | ArrayBuffer>(`test-pdf.pdf`);

let pagesShapes: {
  [page: number]: Shape[]
} = {};

const code = ref('')
const htmlCode = ref('')
async function handleExportData() {
  pagesShapes[currentPageNo.value] = getShapes()
  code.value = JSON.stringify(Object.values(pagesShapes).flatMap((item) => [...item]).map(item => {
    const { pdfX, pdfY } = convertScreenToPdf(item.x, item.y, item.height, {
      width: overlayCanvas?.clientWidth!,
      height: overlayCanvas?.clientHeight!
    }, {
      width: viewport.width,
      height: viewport.height
    })
    return {
      ...item,
      x: item.x,
      y: item.y,
      pdfY,
      pdfX
    }
  }), null, 2)
  htmlCode.value = await codeToHtml(code.value, {
    theme: 'vitesse-dark',
    lang: 'json'
  })
  dialogVisible.value=  true;
}


function handleLoadPdf(pageNo: number) {
  if (currentPageNo.value != pageNo) {
    pagesShapes[currentPageNo.value] = getShapes()
    loadPDFPageByPageNum(pageNo)
  }
};

var viewport:lib.PageViewport;
function renderPdfCanvas(page: lib.PDFPageProxy) {
  viewport = page.getViewport({ scale: scale.value });
  if (!pdfCanvas) {
    pdfCanvas = document.createElement('canvas');
    var context = pdfCanvas.getContext('2d');
    var renderContext = {
        canvasContext: context,
        viewport: viewport
    } as any;
    pdfCanvas!.height = viewport.height;
    pdfCanvas!.width = viewport.width;
    pdfContainerRef.value?.appendChild(pdfCanvas)
    page.render(renderContext)
  } else {
    var context = pdfCanvas.getContext('2d');
    var renderContext = {
        canvasContext: context,
        viewport: viewport
    } as any;
    page.render(renderContext)
  }
}

function renderOverlayCanvas() {
  if (!overlayCanvas) {
    overlayCanvas  = document.createElement('canvas');
    overlayCanvas.width = pdfCanvas!.width;
    overlayCanvas.height = pdfCanvas!.height;
    overlayCanvas.style.position = 'absolute';
    overlayCanvas.style.left = pdfCanvas!.offsetLeft + 'px';
    overlayCanvas.style.top = pdfCanvas!.offsetTop + 'px';
    pdfContainerRef.value?.appendChild(overlayCanvas)
    createRender(overlayCanvas);
  } else {
    clearCanvas()
    if (pagesShapes[currentPageNo.value]) {
      renderShapes(pagesShapes[currentPageNo.value])
    }
  }
}


let pdfDocument:lib.PDFDocumentProxy|null = null;

async function loadPDFPageByPageNum(pageNo: number) {
  currentPageNo.value = pageNo
  if (pdfDocument) {
    const page = await pdfDocument.getPage(pageNo);
    renderPdfCanvas(page)
    renderOverlayCanvas()
    return
  }
  const args = typeof pdfName.value === 'string' ? {
    url: pdfName.value,
  } : {
    data: pdfName.value,
  }
  const loadingTask =  lib.getDocument(args);
  console.log(loadingTask)
  pdfDocument = await loadingTask.promise;
  totalPages.value = pdfDocument.numPages
  const page = await pdfDocument.getPage(pageNo);
  renderPdfCanvas(page)
  renderOverlayCanvas()
}



onMounted(async () =>{
  loadPDFPageByPageNum(1)
})
const dialogVisible = ref(false)
function handleCopy() {
  clipboard.copy(code.value)
  ElMessage({
    message: '复制成功',
    type: 'success',
  })
}
// 将文件读取为 ArrayBuffer
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
      fileReader.onerror = () => reject(fileReader.error);
      fileReader.readAsArrayBuffer(file);
  });
}

async function handleLoadPDF(file: any) {
  const arrayBuffer = await readFileAsArrayBuffer(file)
  pdfName.value = arrayBuffer;
  pdfDocument = null;
  pagesShapes = {};
  loadPDFPageByPageNum(1)
  return Promise.reject()
}
</script>

<template>
  <div class="main-container">
    <div class="operation">
      <el-select
            style="width: 100px; margin-right: 10px;"
            @update:model-value="handleLoadPdf"
            v-model="currentPageNo"
          >
            <el-option
              v-for="pageNo in totalPages"
              :key="pageNo"
              :label="`第${ pageNo }页`"
              :value="pageNo"
            />
          </el-select>
          
          <el-button @click="setShapeTypeOnDraw(ShapeType.SEAL)">公章</el-button>
          <el-button @click="setShapeTypeOnDraw(ShapeType.SIGNATURE)">签名</el-button>
            <el-upload style="margin: 0px 10px;" accept=".pdf" :show-file-list="false" :before-upload="handleLoadPDF" :limit="1">
          <el-button type="success">加载PDF</el-button>
        </el-upload>
          <el-button type="primary" @click="handleExportData">导出</el-button>
          <el-button type="danger" @click="clearCanvas">清除</el-button>
    </div>
    <div class="shapes">
        <div class="shape-title">
          图形样式
        </div>
        <div class="shape-properties">
          <div class="shape-properties__inner">
            <template v-if="selectedShape">
              <div class="properties-group">
                <div class="properties-group__title">基础信息</div>
                <div class="properties-group__content">
                  <div class="row">
                      <div style="display: flex; align-items: center; width: 100%;">
                      <span style="margin-right: 10px;">ID</span>
                      <label style="width: 100%;" class="item">
                          {{ selectedShape.id }}
                        </label>
                      </div>
                    </div>
                  <div></div>
                </div>
              </div>
              <div class="properties-group">
                <div class="properties-group__title">布局</div>
                <div class="properties-group__content">
                  <div class="col">
                    <div  class="row">
                      <label for="prop_w" class="item">
                        <input id="prop_w" type="number" v-model="selectedShape.width" /> W
                      </label>
                      <label for="prop_h" class="item">
                        <input id="prop_h" type="number"  v-model="selectedShape.height" /> H
                      </label>
                    </div>
                    <div class="row">
                      <label for="prop_x" class="item">
                        <input id="prop_x" type="number" v-model="selectedShape.x" /> X
                      </label>
                      <label for="prop_y"  class="item">
                        <input id="prop_y" type="number"  v-model="selectedShape.y" /> Y
                      </label>
                    </div>
                  </div>
                  <div></div>
                </div>
              </div>
              <div class="properties-group">
                <div class="properties-group__title">填充</div>
                <div class="properties-group__content">
                  <div class="row">
                    <div style="flex:1; display: flex; align-items: center;">
                      <span style="margin-right: 10px;">颜色</span>
                      <label>
                        <input type="color" v-model="selectedShape.color">
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <template v-if="selectedShape.type === ShapeType.SEAL" >
                <div class="properties-group">
                  <div class="properties-group__title">组件信息</div>
                  <div class="properties-group__content">
                    <div class="row">
                      <div style="flex: 1; display: flex; align-items: center;">
                        <span style="margin-right: 10px;">页码</span>
                        <label style="width: 80%;">
                          <select disabled style="width: 100%;" v-model="(selectedShape as Seal).page">
                            <option v-for="pageNo in totalPages" :key="pageNo" :value="pageNo" >第{{ pageNo }}页</option>
                          </select>
                        </label>
                      </div>
                    </div>
                    <div class="row">
                      <div style="flex: 1; display: flex; align-items: center;">
                        <span style="margin-right: 10px;">分组</span>
                        <label style="width: 80%;">
                          <input style="width: 100%"  type="text" v-model="(selectedShape as Seal).group" />
                        </label>
                      </div>
                    </div>
                    <div class="row">
                      <div style="flex: 1; display: flex; align-items: center;">
                        <span style="margin-right: 10px;">备注</span>
                        <label style="width: 80%;">
                          <textarea  type="text" v-model="(selectedShape as Seal).remark" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <template v-if="selectedShape.type === ShapeType.SIGNATURE">
                <div class="properties-group">
                  <div class="properties-group__title">组件信息</div>
                  <div class="properties-group__content">
                    <div class="row">
                      <div style="flex: 1; display: flex; align-items: center;">
                        <span style="margin-right: 10px;">页码</span>
                        <label style="width: 80%;">
                          <select style="width: 100%;" disabled v-model="(selectedShape as Signature).page">
                            <option v-for="pageNo in totalPages" :key="pageNo" :value="pageNo" >第{{ pageNo }}页</option>
                          </select>
                        </label>
                      </div>
                    </div>
                    <div class="row">
                      <div style="flex: 1; display: flex; align-items: center;">
                        <span style="margin-right: 10px;">分组</span>
                        <label style="width: 80%;">
                          <input style="width: 100%"  type="text" v-model="(selectedShape as Signature).group" />
                        </label>
                      </div>
                    </div>
                    <div class="row">
                      <div style="flex: 1; display: flex; align-items: center;">
                        <span style="margin-right: 10px;">备注</span>
                        <label style="width: 80%;">
                          <textarea  type="text" v-model="(selectedShape as Signature).remark" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </template>
            <template v-else>
              <div class="not-selected">
                未选中图形
              </div>
            </template>
          </div>
        </div>
      </div>
    <div class="pdf-sign-editor" ref="pdfContainerRef">
    </div>
  </div>
  <el-dialog
    v-model="dialogVisible"
    title="导出"
    width="500"
  >
    <div>
      <el-scrollbar height="500px">
        <div style="width: 100%;height: 100%;" v-html="htmlCode"></div>
      </el-scrollbar>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleCopy()">复制</el-button>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.main-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  .operation {
    position: fixed;
    bottom: 0px;
    right: 0px;
    padding: 10px;
    display: flex;
    box-shadow: var(--el-box-shadow-light);
    z-index: 10;
    background-color: #fff;
  }
  .shapes {
    position: fixed;
    top: 0px;
    right: 0px;
    width: 250px;
    display: flex;
    flex-direction: column;
    background: #F6F7F8;
    z-index: 9;
    .shape-title {
      display: flex;
      justify-content: center;
      padding: 10px;
      font-size: 12px;
      font-weight: bold;
      align-content: center;
    }
    .shape-properties {
      border-top: 1px solid #E9EDF2;
      flex: 1;
    }
    .shape-properties {
      font-size: 12px;
      .shape-properties__inner {
        .not-selected {
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 14px;
          color: #aaa;
          padding: 50px;
        }
        .properties-group {
          padding: 20px 20px 10px 20px;
          border-bottom: 1px solid #E9EDF2;
          .properties-group__title {
            display: flex;
            justify-content: flex-start;
            font-size: 12px;
            font-weight: bold;
            align-content: center;
            margin-bottom: 10px;
          }
          .properties-group__content {
            label {
              display: flex;
              background-color: #fff;
              padding: 3px;
              display: inline-block;
              width: 100px;
              font-size: 13px;
              border: 1px solid #eee;
              border-radius: 4px;
              input {
                outline: none;
                border: none;
                width: 80%;
              }
              textarea {
                outline: none;
                border: none;
                width: 100%;
                resize: vertical;
              }
              select {
                outline: none;
                border: none;
                width: 100%;
              }
            }
            .col {
              display: flex;
              flex-direction: column;
            }
          .row {
              display: flex;
              flex-direction: row;
              justify-content: space-around;
              margin-bottom: 10px;
            }
          }
        }
      }
    }
    height: 100vh;
  }
}
.pdf-sign-editor {
  position: relative;
  display: inline-block;
  box-shadow: var(--el-box-shadow);
}
</style>
