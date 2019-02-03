/**
 * Detect tow tree what is updated
 * @author imcuttle
 */

const walk = require('@moyuyc/visit-tree')
const createCachedChildGetter = require('./lib/createCachedChildGetter')
const createStatusManager = require('./lib/createStatusManager')
const castArray = require('./lib/castArray')

function diff(treeA, treeB, { limit = Infinity, equal = (a, b) => a === b, path = 'children' } = {}) {
  if (treeA === treeB || !treeA || !treeB) {
    return
  }

  const sm = createStatusManager({ limit })
  // const smTmp = createStatusManager({ limit: Infinity })
  const nodeGetter = createCachedChildGetter(treeB, {})

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
      ctx => {
        if (fromCtx !== ctx && ctx.node) {
          if (sm.hasChanged(ctx.node)) {
            return ctx.break()
          }
          sm.childChanged(ctx.node, ctx)
        }
      },
      { order: 'pre', path: 'parentCtx' }
    )
  }

  walk(
    treeA,
    (node, ctx) => {
      const paths = ctx.paths
      let { ref, index, broken } = nodeGetter(paths)
      // Not Found
      if (broken) {
        if (!sm.added(node, ctx)) {
          return ctx.break()
        }
        // smTmp.added(node, ctx)

        backTracking(ctx)
      } else {
        if (!equalMethod(node, ref)) {
          if (!sm.updated(node, ctx)) {
            return ctx.break()
          }
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

module.exports = diff
