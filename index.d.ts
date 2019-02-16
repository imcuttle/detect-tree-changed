/**
 * Detect tow tree what is updated
 * @author imcuttle
 */
// @ts-ignore
import * as vt from '@moyuyc/visit-tree'

declare namespace detectTreeChanged {
  export type Options = {
    limit?: number
    equal?: (a, b) => boolean
    path?: string
  }

  export type Status = 'child-changed' | 'updated' | 'added' | 'has-removed-child'
}

declare type detectTreeChanged<T> = (
  treeA: T,
  treeB: T,
  options?: detectTreeChanged.Options
) => // @ts-ignore
Map<T, { status: detectTreeChanged.Status; ctx: vt.IContext }>

export = detectTreeChanged
