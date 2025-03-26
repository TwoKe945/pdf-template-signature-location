export * from './shape'
import { ShapeRenderer  } from './ShapeRenderer'
import { Seal, Shape, ShapeType, Signature } from './shape'
export { convertScreenToPdf } from './pdf'


export function useShapeRenderer() {
  const shapes = reactive(new Map<string, Shape>())
  const shapeIds: string[] = []
  let renderer: ShapeRenderer|null = null
  const internalInstance = getCurrentInstance();
  const selectedShapeId = ref<string | null>(null)
  const currentPageNo = ref(1)

  const selectedShape = computed(() => {
    if (selectedShapeId.value) {
      return shapes.get(selectedShapeId.value)
    }
    return null
  })

  watch(selectedShape, (newValue, oldValue) => {
    if (newValue && oldValue) {
      renderer?.redraw()
    }
  }, {
    deep: true
  })


  function selectShapeById(id: string) {
    renderer?.selectShapeById(id)
  }
  const onUpdateShapes = (_shapes: Shape[]) => {
    let needAddShapes =  _shapes.filter(item => !shapes.has(item.id))
    let needDeleteShapes =  shapeIds.filter(id => _shapes.findIndex(item => item?.id === id) < 0)
    needAddShapes.forEach(item => {
      shapes.set(item.id, item)
      shapeIds.push(item.id)
    })
    needDeleteShapes.forEach(id => {
      shapes.delete(id)
      shapeIds.splice(shapeIds.findIndex(item => item === id), 1)
    })
  }

  const onUpdateShape = (shape: Shape) => {
    if (shapes.has(shape.id)) {
      if (shape instanceof Signature || shape instanceof Seal) {
        shape.page = currentPageNo.value
      }
      shapes.set(shape.id, shape);
      (internalInstance! as any).ctx?._.update();
    }
  }

  function createRender(el: HTMLCanvasElement) {
    renderer = new ShapeRenderer(el, onUpdateShapes, onUpdateShape)
    renderer.onSelectedShape = (shapeId) => {
      selectedShapeId.value = shapeId
    }
    return renderer
  }

  function deleteById(id: string) {
    renderer?.delete(id)
  }

  function setShapeTypeOnDraw(type: ShapeType) {
    renderer?.setCurrentShapeType(type)
  }

  function clearCanvas() {
    renderer?.clear()
  }

  function getShapes() {
    return renderer?.getShapes() || []
  }
  function renderShapes(shapes: Shape[]) {
    return renderer?.renderShapes(shapes)
  }

  return [shapes, {
    currentPageNo,
    createRender,
    deleteById,
    setShapeTypeOnDraw,
    clearCanvas,
    selectedShape,
    selectShapeById,
    getShapes,
    renderShapes
  }] as const
}

export {
  ShapeRenderer
}
