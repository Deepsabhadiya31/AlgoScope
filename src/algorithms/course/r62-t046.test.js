import { describe, it, expect } from 'vitest'
import {
  topologicalSortKahn,
  kahnTopologicalSort,
  verifyTopologicalOrdering,
  replayTopologicalSortTrace,
  normalizeGraph,
} from './topological-sort-kahn'

describe('R62-T046: Topological Sort (Kahn) — Focused Refactoring', () => {
  describe('1. Test Case 1: Basic Directed Graph (Issue Done When)', () => {
    it('processes edges A -> C, B -> C and guarantees A and B appear before C', () => {
      const edges = [
        ['A', 'C'],
        ['B', 'C'],
      ]

      const result = topologicalSortKahn(edges)

      expect(result.success).toBe(true)
      expect(result.hasCycle).toBe(false)
      expect(result.order).not.toBeNull()
      expect(result.order.length).toBe(3)
      expect(result.unprocessed).toEqual([])

      const idxA = result.order.indexOf('A')
      const idxB = result.order.indexOf('B')
      const idxC = result.order.indexOf('C')

      // A must appear before C
      expect(idxA).toBeLessThan(idxC)
      // B must appear before C
      expect(idxB).toBeLessThan(idxC)
      // Both A and B must be present
      expect(idxA).toBeGreaterThanOrEqual(0)
      expect(idxB).toBeGreaterThanOrEqual(0)

      // Verified via independent precedence verifier
      const verification = verifyTopologicalOrdering(edges, result.order)
      expect(verification.valid).toBe(true)
      expect(verification.error).toBeNull()
    })

    it('works across alternative input graph representations (adjacency object, Map, descriptor)', () => {
      // Adjacency object
      const adjObj = { A: ['C'], B: ['C'], C: [] }
      const res1 = topologicalSortKahn(adjObj)
      expect(res1.success).toBe(true)
      expect(res1.order).toEqual(['A', 'B', 'C'])

      // Map representation
      const mapInput = new Map([
        ['A', ['C']],
        ['B', ['C']],
        ['C', []],
      ])
      const res2 = topologicalSortKahn(mapInput)
      expect(res2.success).toBe(true)
      expect(res2.order).toEqual(['A', 'B', 'C'])

      // Descriptor with explicit vertices and edges
      const descriptor = {
        vertices: ['A', 'B', 'C'],
        edges: [
          ['A', 'C'],
          ['B', 'C'],
        ],
      }
      const res3 = topologicalSortKahn(descriptor)
      expect(res3.success).toBe(true)
      expect(res3.order).toEqual(['A', 'B', 'C'])
    })
  })

  describe('2. Test Case 2: Cycle Detection (Issue Done When)', () => {
    it('detects a simple 3-node cycle (A -> B -> C -> A) and yields a clear failure', () => {
      const cycleEdges = [
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'A'],
      ]

      const result = topologicalSortKahn(cycleEdges)

      expect(result.success).toBe(false)
      expect(result.hasCycle).toBe(true)
      // Must NEVER present an incomplete ordering as a successful result
      expect(result.order).toBeNull()
      expect(result.unprocessed.sort()).toEqual(['A', 'B', 'C'])
      expect(result.message).toContain('Graph contains a cycle')
    })

    it('detects a cycle in a graph with both acyclic prefix and cyclic subgraph', () => {
      // Start -> A -> B -> C -> A
      const mixedGraph = [
        ['Start', 'A'],
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'A'],
      ]

      const result = topologicalSortKahn(mixedGraph)

      expect(result.success).toBe(false)
      expect(result.hasCycle).toBe(true)
      expect(result.order).toBeNull() // Crucial: must NOT return ['Start'] as a valid topological sort
      expect(result.unprocessed.sort()).toEqual(['A', 'B', 'C'])
      expect(result.message).toContain('no complete topological ordering exists')
    })

    it('detects a self-loop (1-node cycle: A -> A)', () => {
      const selfLoop = [['A', 'A']]
      const result = topologicalSortKahn(selfLoop)

      expect(result.success).toBe(false)
      expect(result.hasCycle).toBe(true)
      expect(result.order).toBeNull()
      expect(result.unprocessed).toEqual(['A'])
    })

    it('throws RangeError when throwOnCycle is enabled', () => {
      const cycleEdges = [
        ['X', 'Y'],
        ['Y', 'X'],
      ]
      expect(() => topologicalSortKahn(cycleEdges, { throwOnCycle: true })).toThrow(RangeError)
    })
  })

  describe('3. Additional Graph Cases', () => {
    it('handles an empty graph correctly', () => {
      const resEmptyArr = topologicalSortKahn([])
      expect(resEmptyArr.success).toBe(true)
      expect(resEmptyArr.hasCycle).toBe(false)
      expect(resEmptyArr.order).toEqual([])

      const resEmptyObj = topologicalSortKahn({})
      expect(resEmptyObj.success).toBe(true)
      expect(resEmptyObj.order).toEqual([])
    })

    it('handles a single isolated vertex', () => {
      const result = topologicalSortKahn(['Solo'])
      expect(result.success).toBe(true)
      expect(result.order).toEqual(['Solo'])
    })

    it('handles multiple disconnected vertices with no edges', () => {
      const result = topologicalSortKahn(['Z', 'A', 'M'])
      expect(result.success).toBe(true)
      expect(result.order).toEqual(['A', 'M', 'Z'])
    })

    it('handles a linear chain (A -> B -> C -> D -> E)', () => {
      const chain = [
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'D'],
        ['D', 'E'],
      ]
      const result = topologicalSortKahn(chain)
      expect(result.success).toBe(true)
      expect(result.order).toEqual(['A', 'B', 'C', 'D', 'E'])
      expect(verifyTopologicalOrdering(chain, result.order).valid).toBe(true)
    })

    it('handles a complex multi-layer DAG with multiple dependencies', () => {
      // Classic dependency graph:
      // 5 -> 0, 5 -> 2
      // 4 -> 0, 4 -> 1
      // 2 -> 3
      // 3 -> 1
      const dag = [
        ['5', '0'],
        ['5', '2'],
        ['4', '0'],
        ['4', '1'],
        ['2', '3'],
        ['3', '1'],
      ]
      const result = topologicalSortKahn(dag)
      expect(result.success).toBe(true)
      expect(result.hasCycle).toBe(false)
      expect(verifyTopologicalOrdering(dag, result.order).valid).toBe(true)
    })
  })

  describe('4. Determinism & Non-Mutation', () => {
    it('produces identical results and step traces across repeated invocations', () => {
      const graph = [
        ['Task1', 'Task3'],
        ['Task2', 'Task3'],
        ['Task3', 'Task4'],
      ]

      const run1 = topologicalSortKahn(graph)
      const run2 = topologicalSortKahn(graph)
      const run3 = topologicalSortKahn(graph)

      expect(run1.order).toEqual(run2.order)
      expect(run2.order).toEqual(run3.order)
      expect(JSON.stringify(run1.steps)).toBe(JSON.stringify(run2.steps))
      expect(JSON.stringify(run2.steps)).toBe(JSON.stringify(run3.steps))
    })

    it('does not mutate caller input arrays or objects', () => {
      const originalEdges = Object.freeze([
        Object.freeze(['A', 'C']),
        Object.freeze(['B', 'C']),
      ])

      const result = topologicalSortKahn(originalEdges)
      expect(result.success).toBe(true)
      expect(originalEdges.length).toBe(2)
      expect(originalEdges[0]).toEqual(['A', 'C'])
    })

    it('freezes step snapshots to prevent retrospective mutation', () => {
      const result = topologicalSortKahn([['A', 'B']])
      for (const step of result.steps) {
        expect(Object.isFrozen(step)).toBe(true)
        expect(Object.isFrozen(step.queue)).toBe(true)
        expect(Object.isFrozen(step.order)).toBe(true)
        expect(Object.isFrozen(step.inDegree)).toBe(true)
        expect(() => {
          step.currentVertex = 'HACK'
        }).toThrow(TypeError)
      }
    })
  })

  describe('5. Independent Precedence Verifier', () => {
    it('approves valid topological sort orders', () => {
      const graph = [['A', 'C'], ['B', 'C']]
      expect(verifyTopologicalOrdering(graph, ['A', 'B', 'C']).valid).toBe(true)
      expect(verifyTopologicalOrdering(graph, ['B', 'A', 'C']).valid).toBe(true)
    })

    it('rejects an order that violates edge precedence', () => {
      const graph = [['A', 'C'], ['B', 'C']]
      const check = verifyTopologicalOrdering(graph, ['C', 'A', 'B'])
      expect(check.valid).toBe(false)
      expect(check.error).toContain('Edge precedence violated')
    })

    it('rejects an order missing vertices', () => {
      const graph = [['A', 'C'], ['B', 'C']]
      const check = verifyTopologicalOrdering(graph, ['A', 'C'])
      expect(check.valid).toBe(false)
      expect(check.error).toContain('Length mismatch')
    })

    it('rejects an order containing duplicates', () => {
      const graph = [['A', 'B']]
      const check = verifyTopologicalOrdering(graph, ['A', 'A'])
      expect(check.valid).toBe(false)
      expect(check.error).toContain('Duplicate vertex')
    })
  })

  describe('6. Replay Engine Verification', () => {
    it('replays a successful trace and reconstructs the topological ordering', () => {
      const result = topologicalSortKahn([['A', 'C'], ['B', 'C']])
      const replay = replayTopologicalSortTrace(result.steps)

      expect(replay.valid).toBe(true)
      expect(replay.hasCycle).toBe(false)
      expect(replay.finalOrder).toEqual(['A', 'B', 'C'])
      expect(replay.error).toBeNull()
    })

    it('replays a cyclic trace and confirms cycle detection', () => {
      const result = topologicalSortKahn([['A', 'B'], ['B', 'A']])
      const replay = replayTopologicalSortTrace(result.steps)

      expect(replay.valid).toBe(true)
      expect(replay.hasCycle).toBe(true)
      expect(replay.finalOrder).toBeNull()
    })

    it('detects invalid or broken replay traces', () => {
      expect(replayTopologicalSortTrace(null).valid).toBe(false)
      expect(replayTopologicalSortTrace([]).valid).toBe(false)

      const badStart = [{ type: 'not-init', stepIndex: 0 }]
      expect(replayTopologicalSortTrace(badStart).valid).toBe(false)

      const brokenSeq = [
        { type: 'init', stepIndex: 0 },
        { type: 'complete', stepIndex: 5, order: [] },
      ]
      expect(replayTopologicalSortTrace(brokenSeq).valid).toBe(false)
    })
  })

  describe('7. Input Validation & Error Handling', () => {
    it('throws TypeError on null or undefined input', () => {
      expect(() => topologicalSortKahn(null)).toThrow(TypeError)
      expect(() => topologicalSortKahn(undefined)).toThrow(TypeError)
      expect(() => normalizeGraph(null)).toThrow(TypeError)
    })

    it('throws TypeError on malformed edge descriptors', () => {
      expect(() => normalizeGraph([true])).toThrow(TypeError)
    })

    it('exports kahnTopologicalSort alias identical to topologicalSortKahn', () => {
      expect(kahnTopologicalSort).toBe(topologicalSortKahn)
    })
  })
})
