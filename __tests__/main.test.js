/**
 * @file main
 * @author imcuttle
 * @date 2018/4/4
 */
const detectTreeChanged = require('../')
const { readFileSync } = require('./helper')
const eq = require('shallowequal')
const isequalwith = require('lodash.isequalwith')

const rehype = require('rehype')()
  .use({ settings: { position: false, fragment: true } })
  .freeze()

function stripCtx(map) {
  return [...map].map(([key, value]) => [key, value.status])
}

function stripCtxKey(map, { keyName = 'key' } = {}) {
  return [...map].map(([key, value]) => [keyName ? key[keyName] : key, value.status])
}

function isHeadNode(node) {
  return ['h1', 'h2', 'h3', 'h4'].includes(node && node.tagName && node.tagName.toLowerCase())
}

const linkyEqual = (nodeA, nodeB) => {
  nodeA = Object.assign({}, nodeA, {
    position: null,
    children: null
  })
  nodeB = Object.assign({}, nodeB, {
    position: null,
    children: null
  })

  if (isHeadNode(nodeA)) {
    nodeA = Object.assign({}, nodeA, {
      properties: null
    })
  }
  if (isHeadNode(nodeB)) {
    nodeB = Object.assign({}, nodeB, {
      properties: null
    })
  }

  return isequalwith(nodeA, nodeB)
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

  it('should added', function() {
    const rlt = detectTreeChanged(
      nodeA,
      {},
      {
        equal: eq
      }
    )

    expect(stripCtx(rlt)).toEqual([
      [{ key: 'B' }, 'added'],
      [{ children: [{ key: 'B' }, { key: 'C' }], key: 'A' }, 'updated'],
      [{ key: 'C' }, 'added']
    ])
  })

  it('should added with limit', function() {
    const rlt = detectTreeChanged(
      nodeA,
      {},
      {
        equal: eq,
        limit: 1
      }
    )

    expect(stripCtx(rlt)).toEqual([[{ key: 'B' }, 'added']])
  })

  it('should has-removed-child', function() {
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
    expect(stripCtx(rlt)).toEqual([[{ key: 'A' }, 'has-removed-child']])
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
    "added",
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
    "has-removed-child",
  ],
]
`)
  })

  it('should complex - 2', function() {
    //       A
    //  B    C    D
    // E F   G
    let rlt = detectTreeChanged(nodeB, { ...nodeB, children: [] }, { equal: eq })

    expect(stripCtxKey(rlt)).toMatchInlineSnapshot(`
Array [
  Array [
    "E",
    "added",
  ],
  Array [
    "B",
    "added",
  ],
  Array [
    "A",
    "child-changed",
  ],
  Array [
    "F",
    "added",
  ],
  Array [
    "G",
    "added",
  ],
  Array [
    "C",
    "added",
  ],
  Array [
    "D",
    "added",
  ],
]
`)
  })

  it('should used in html', function() {
    let rlt = detectTreeChanged(rehype.parse(readFileSync('html/old')), rehype.parse(readFileSync('html/new')), {
      limit: 1,
      equal: linkyEqual
    })

    expect(stripCtxKey(rlt, { keyName: null })).toMatchInlineSnapshot(`
Array [
  Array [
    Object {
      "type": "text",
      "value": "测试一下lp",
    },
    "updated",
  ],
]
`)
  })

  it('should used in linky-html', function() {
    let rlt = detectTreeChanged(
      rehype.parse(readFileSync('linky-html/old.html')),
      rehype.parse(readFileSync('linky-html/new.html')),
      {
        limit: 1,
        equal: linkyEqual
      }
    )

    expect(stripCtxKey(rlt, { keyName: null })).toMatchInlineSnapshot(`
Array [
  Array [
    Object {
      "type": "text",
      "value": "asdasd",
    },
    "updated",
  ],
]
`)
  })
})
