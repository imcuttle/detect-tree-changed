/**
 * @file createCachedChildGetter
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 03/02/2019
 *
 */

const castArray = require('./castArray')

const SEP = '.'

function createCachedChildGetter(ast = {}, dp, { path = 'children' } = {}) {
  return function(paths = [], visit) {
    function get(ref = {}, paths, prefix = '') {
      let key = prefix
      for (let i = 0; i < paths.length; i++) {
        const index = paths[i]

        const refChildren = ref[path] ? castArray(ref[path]) : ref[path]
        if (refChildren && refChildren[index]) {
          visit && visit(ref, index)

          ref = refChildren[index]
          let isFirst = key === ''
          key += (!isFirst ? SEP : '') + index

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
      let newPaths = paths.slice()
      let ref = ast
      let tmpKey = ''
      let tmp
      for (let i = 0; i < paths.length; i++) {
        tmp = tmpKey + paths[i]
        if (!dp.hasOwnProperty(tmp)) {
          tmp = tmpKey
          break
        }
        newPaths.splice(0, 1)
        ref = dp[tmp]
        tmpKey = tmp + '.'
      }
      return get(ref, newPaths, tmp)
    }

    return get(ast, paths)
  }
}

module.exports = createCachedChildGetter
