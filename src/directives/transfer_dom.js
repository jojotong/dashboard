/**
 * @method v-transfer-dom
 * @description 自定义指令 v-transfer-dom，将元素添加至指定父级元素中，实现跨组件添加
 * @version 1.0.0
 * @example <AnyComponent v-transfer-dom="'#el'" /> 默认为添加值body中
 */

/**
 * @method getTarget
 * @description 获取元素节点
 * @param {Node|string|Boolean} node
 * @returns {Node}
 */
function getTarget (node) {
  if (node === void 0) {
    node = document.body
  }
  if (node === true) {
    return document.body
  }
  return node instanceof window.Node ? node : document.querySelector(node)
}

const directive = {
  inserted (el, { value }) {
    el.className = el.className ? el.className + ' v-transfer-dom' : 'v-transfer-dom'
    const parentNode = el.parentNode
    if (!parentNode) return
    const home = document.createComment('')
    let hasMovedOut = false

    if (value !== false) {
      parentNode.replaceChild(home, el)
      getTarget(value).appendChild(el)
      hasMovedOut = true
    }
    if (!el.__transferDomData) {
      el.__transferDomData = {
        parentNode: parentNode,
        home: home,
        target: getTarget(value),
        hasMovedOut: hasMovedOut,
      }
    }
  },
  componentUpdated (el, { value }) {
    const ref$1 = el.__transferDomData
    if (!ref$1) return
    const parentNode = ref$1.parentNode
    const home = ref$1.home
    const hasMovedOut = ref$1.hasMovedOut

    if (!hasMovedOut && value) {
      parentNode.replaceChild(home, el)
      getTarget(value).appendChild(el)
      el.__transferDomData = Object.assign({}, el.__transferDomData, {
        hasMovedOut: true,
        target: getTarget(value),
      })
    } else if (hasMovedOut && value === false) {
      parentNode.replaceChild(el, home)
      el.__transferDomData = Object.assign({}, el.__transferDomData, {
        hasMovedOut: false,
        target: getTarget(value),
      })
    } else if (value) {
      getTarget(value).appendChild(el)
    }
  },
  unbind (el) {
    el.className = el.className.replace('v-transfer-dom', '')
    const ref$1 = el.__transferDomData
    if (!ref$1) return
    if (el.__transferDomData.hasMovedOut === true) {
      el.__transferDomData.parentNode && el.__transferDomData.parentNode.appendChild(el)
    }
    el.__transferDomData = null
  },
}

export default directive
