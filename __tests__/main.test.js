/**
 * @file main
 * @author imcuttle
 * @date 2018/4/4
 */
const detectTreeChanged = require('../')
const eq = require('shallowequal')

function stripCtx(map) {
  return [...map].map(([key, value]) => [key, value.status])
}

function stripCtxKey(map) {
  return [...map].map(([key, value]) => [key.key, value.status])
}

describe('detectTreeChanged', function() {
  //    A
  //  B  C
  const nodeA = {
    key: 'A',
    children: [
      {
        key: 'B'
      },
      {
        key: 'C'
      }
    ]
  }

  it('should removed', function() {
    const rlt = detectTreeChanged(
      nodeA,
      {},
      {
        equal: eq
      }
    )

    expect(stripCtx(rlt)).toEqual([
      [{ key: 'B' }, 'removed'],
      [{ children: [{ key: 'B' }, { key: 'C' }], key: 'A' }, 'updated'],
      [{ key: 'C' }, 'removed']
    ])
  })

  it('should has-added-child', function() {
    const eqFn = jest.fn((a, b) => {
      return eq(a, b)
    })

    const rlt = detectTreeChanged(
      {
        key: 'A'
      },
      nodeA,
      {
        equal: eqFn
      }
    )

    const cloned = { ...nodeA }
    delete cloned.children
    expect(eqFn).toBeCalledWith({ key: 'A' }, cloned)
    expect(stripCtx(rlt)).toEqual([[{ key: 'A' }, 'has-added-child']])
  })

  it('should updated', function() {
    const rlt = detectTreeChanged(
      {
        key: 'ABC',
        children: [
          {
            key: 'B',
            value: 'update'
          },
          {
            key: 'C'
          }
        ]
      },
      nodeA,
      {
        equal: eq
      }
    )

    expect(stripCtx(rlt)).toEqual([
      [{ key: 'B', value: 'update' }, 'updated'],
      [{ children: [{ key: 'B', value: 'update' }, { key: 'C' }], key: 'ABC' }, 'updated']
    ])
  })

  it('should limit', function() {
    const rlt = detectTreeChanged(
      {
        key: 'ABC',
        children: [
          {
            key: 'B',
            value: 'update'
          },
          {
            key: 'C'
          }
        ]
      },
      nodeA,
      {
        limit: 1,
        equal: eq
      }
    )

    expect(stripCtx(rlt)).toEqual([[{ key: 'B', value: 'update' }, 'updated']])
  })

  //       A
  //  B    C    D
  // E F   G
  const nodeB = {
    key: 'A',
    children: [
      {
        key: 'B',
        children: [
          {
            key: 'E'
          },
          {
            key: 'F'
          }
        ]
      },
      {
        key: 'C',
        children: {
          key: 'G'
        }
      },
      {
        key: 'D'
      }
    ]
  }

  //       A
  //  B    C    D
  // E     H     I

  const nodeC = {
    key: 'A',
    children: [
      {
        key: 'B',
        children: [
          {
            key: 'E'
          }
        ]
      },
      {
        key: 'C',
        children: {
          key: 'H'
        }
      },
      {
        key: 'D',
        children: {
          key: 'I'
        }
      }
    ]
  }
  it('should complex', function() {
    let rlt = detectTreeChanged(nodeB, nodeC, { equal: eq })

    expect(stripCtxKey(rlt)).toMatchInlineSnapshot(`
Array [
  Array [
    "F",
    "removed",
  ],
  Array [
    "B",
    "child-changed",
  ],
  Array [
    "A",
    "child-changed",
  ],
  Array [
    "G",
    "updated",
  ],
  Array [
    "C",
    "child-changed",
  ],
  Array [
    "D",
    "has-added-child",
  ],
]
`)
  })
})
