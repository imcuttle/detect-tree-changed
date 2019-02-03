/**
 * @file createCachedChildGetter
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 03/02/2019
 *
 */

const castArray = require('./castArray')

function createCachedChildGetter(ast = {}, dp) {
  return function(paths = [], visit) {
    function get(ref = {}, paths, prefix = '') {
      let key = prefix
      for (let i = 0; i < paths.length; i++) {
        const index = paths[i]

        const refChildren = ref.children ? castArray(ref.children) : ref.children
        if (refChildren && refChildren[index]) {
          visit && visit(ref, index)

          ref = refChildren[index]
          key += index
          // istanbul ignore next if
          dp && (dp[key] = ref)
          continue
        }
        return { index, ref, broken: true }
      }

      return { ref }
    }

    // istanbul ignore next if
    if (dp) {
      const pathKey = paths.join('')
      let newPaths = paths.slice()
      let ref = ast
      let tmpKey = ''
      for (let i = 0; i < pathKey.length; i++) {
        let tmp = tmpKey + pathKey[i]
        if (!dp.hasOwnProperty(tmp)) {
          break
        }
        tmpKey = tmp
        newPaths.splice(0, 1)
        ref = dp[tmpKey]
      }
      return get(ref, newPaths, tmpKey)
    }

    return get(ast, paths)
  }
}

module.exports = createCachedChildGetter
