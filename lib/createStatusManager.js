/**
 * @file createStatusManager
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 03/02/2019
 *
 */

module.exports = ({ limit = Infinity } = {}) => {
  const map = new Map()

  return {
    get map() {
      return map
    },
    get(node) {
      return this.map.get(node)
    },
    status(node) {
      let gift = this.get(node)
      return gift ? gift.status : gift
    },
    set(node, status, ctx) {
      this.map.set(node, { status, ctx })
      if (this.map.size >= limit) {
        return false
      }
      return this
    },
    hasRemovedChild(node, ctx) {
      return this.set(node, 'has-removed-child', ctx)
    },
    updated(node, ctx) {
      return this.set(node, 'updated', ctx)
    },
    added(node, ctx) {
      return this.set(node, 'added', ctx)
    },
    childChanged(node, ctx) {
      return this.set(node, 'child-changed', ctx)
    },
    isChildChanged(node) {
      return this.status(node) === 'child-changed'
    },
    isChanged(node) {
      return ['updated', 'added', 'has-removed-child'].includes(this.status(node))
    },
    hasChanged(node) {
      return this.isChildChanged(node) || this.isChanged(node)
    },
    clear() {
      this.map.clear()
    }
  }
}
