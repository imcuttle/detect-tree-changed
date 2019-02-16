/**
 * Detect tow tree what is updated
 * @author imcuttle
 */

const walk = require('@moyuyc/visit-tree')
const createCachedChildGetter = require('./lib/createCachedChildGetter')
const createStatusManager = require('./lib/createStatusManager')
const castArray = require('./lib/castArray')

/**
 *
 * @public
 * @param treeA {T}
 * @param treeB {T}
 * @param opt {{}}
 * @param [opt.limit=Infinity] - The limit of changed node
 * @param [opt.equal=(a, b) => a === b] - The compare strategy of two node
 * @param [opt.path='children']
 *
 * @return {Map}
 */
function detectTreeChanged(treeA, treeB, { limit = Infinity, equal = (a, b) => a === b, path = 'children' } = {}) {
  if (treeA === treeB || !treeA || !treeB) {
    return
  }

  const sm = createStatusManager({ limit })
  // const smTmp = createStatusManager({ limit: Infinity })
  const dp = {}
  const nodeGetter = createCachedChildGetter(treeB, dp, { path })

  const equalMethod = (a, b) => {
    if (a === b) return true
    const clonedA = Object.assign({}, a)
    const clonedB = Object.assign({}, b)
    delete clonedA[path]
    delete clonedB[path]

    return equal(clonedA, clonedB)
  }

  const backTracking = fromCtx => {
    walk(
      fromCtx,
      (ctxNode, ctx) => {
        if (fromCtx !== ctxNode && ctxNode.node) {
          if (sm.hasChanged(ctxNode.node)) {
            return ctx.break()
          }
          sm.childChanged(ctxNode.node, ctxNode)
        }
      },
      { order: 'pre', path: 'parentCtx' }
    )
  }

  walk(
    treeA,
    (node, ctx) => {
      let bNodeGet
      let paths = ctx.paths
      if (ctx.parentCtx && !ctx.parentCtx.bNodeGet) {
        const parentPaths = paths.slice(0, -1)
        let parentBNodeGet = (ctx.parentCtx.bNodeGet = nodeGetter(parentPaths))

        if (!parentBNodeGet.broken && parentBNodeGet.ref) {
          bNodeGet = createCachedChildGetter(parentBNodeGet.ref, {}, { path })([ctx.index])
        } else {
          bNodeGet = { ref: undefined, index: ctx.index, broken: true }
        }
      } else if (ctx.parentCtx && ctx.parentCtx.bNodeGet) {
        bNodeGet = createCachedChildGetter(ctx.parentCtx.bNodeGet.ref, {}, { path })([ctx.index])
      } else {
        bNodeGet = nodeGetter(paths)
      }
      let { ref, index, broken } = bNodeGet
      ctx.bNodeGet = bNodeGet
      dp[paths.join('.')] = bNodeGet.ref
      // Not Found
      if (broken) {
        if (!sm.added(node, ctx)) {
          return ctx.break()
        }

        backTracking(ctx)
      } else {
        if (!equalMethod(node, ref)) {
          if (!sm.updated(node, ctx)) {
            return ctx.break()
          }
          backTracking(ctx)
          // smTmp.updated(node, ctx)
        } else {
          let srcNodeChildren = castArray(node[path])
          if (!node[path]) {
            srcNodeChildren = []
          }
          let destNodeChildren = castArray(ref[path])
          if (!ref[path]) {
            destNodeChildren = []
          }

          if (srcNodeChildren.length < destNodeChildren.length) {
            if (!sm.hasRemovedChild(node, ctx)) {
              return ctx.break()
            }
            backTracking(ctx)
            // smTmp.hasRemovedChild(node, ctx)
          }
        }
      }
    },
    { order: 'post', path }
  )

  // smTmp.clear()

  return sm.map
}

module.exports = detectTreeChanged
