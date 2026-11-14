import assert from 'node:assert/strict'
import {
  topologicalSortKahn,
  verifyTopologicalOrdering,
  replayTopologicalSortTrace,
} from '../../src/algorithms/course/topological-sort-kahn.js'

console.log('--- R62-T046 Topological Sort (Kahn) Verification ---')

// 1. Basic directed graph: A -> C, B -> C
console.log('1. Verifying Basic Directed Graph (A -> C, B -> C)...')
const basicEdges = [
  ['A', 'C'],
  ['B', 'C'],
]
const basicResult = topologicalSortKahn(basicEdges)

assert.strictEqual(basicResult.success, true, 'Result must indicate success')
assert.strictEqual(basicResult.hasCycle, false, 'hasCycle must be false')
assert(Array.isArray(basicResult.order), 'Order must be an array')
assert.strictEqual(basicResult.order.length, 3, 'Order must contain all 3 vertices')

const idxA = basicResult.order.indexOf('A')
const idxB = basicResult.order.indexOf('B')
const idxC = basicResult.order.indexOf('C')

assert(idxA < idxC, 'A must appear before C in topological order')
assert(idxB < idxC, 'B must appear before C in topological order')

const verification1 = verifyTopologicalOrdering(basicEdges, basicResult.order)
assert.strictEqual(verification1.valid, true, `Verification failed: ${verification1.error}`)
console.log(`  PASS: Order [${basicResult.order.join(', ')}] satisfies all edge precedence rules.`)

// 2. Cycle detection: A -> B -> C -> A
console.log('2. Verifying Cycle Detection (A -> B -> C -> A)...')
const cycleEdges = [
  ['A', 'B'],
  ['B', 'C'],
  ['C', 'A'],
]
const cycleResult = topologicalSortKahn(cycleEdges)

assert.strictEqual(cycleResult.success, false, 'Cycle graph must return success: false')
assert.strictEqual(cycleResult.hasCycle, true, 'Cycle graph must return hasCycle: true')
assert.strictEqual(cycleResult.order, null, 'Must NEVER return incomplete order as valid')
assert.strictEqual(cycleResult.unprocessed.length, 3, 'All 3 cycle vertices must be listed as unprocessed')
console.log('  PASS: Cycle correctly identified and returned explicit failure state.')

// 3. Mixed graph: Start -> A -> B -> A
console.log('3. Verifying Mixed Graph with partial cycle...')
const mixedEdges = [
  ['Start', 'A'],
  ['A', 'B'],
  ['B', 'A'],
]
const mixedResult = topologicalSortKahn(mixedEdges)
assert.strictEqual(mixedResult.success, false, 'Must fail on mixed cyclic graph')
assert.strictEqual(mixedResult.hasCycle, true)
assert.strictEqual(mixedResult.order, null, 'Partial order must NOT be claimed as success')
console.log('  PASS: Mixed cyclic graph handled correctly.')

// 4. Trace replay verification
console.log('4. Verifying Trace Replay Engine...')
const replaySuccess = replayTopologicalSortTrace(basicResult.steps)
assert.strictEqual(replaySuccess.valid, true, 'Basic trace replay must be valid')
assert.deepStrictEqual(replaySuccess.finalOrder, basicResult.order, 'Replayed order must match computed order')

const replayCycle = replayTopologicalSortTrace(cycleResult.steps)
assert.strictEqual(replayCycle.valid, true, 'Cycle trace replay must be valid')
assert.strictEqual(replayCycle.hasCycle, true, 'Cycle trace must report hasCycle: true')
assert.strictEqual(replayCycle.finalOrder, null, 'Cycle replay order must be null')
console.log('  PASS: Trace replay verified successfully.')

// 5. Determinism
console.log('5. Verifying Deterministic Execution...')
const run1 = topologicalSortKahn(basicEdges)
const run2 = topologicalSortKahn(basicEdges)
assert.deepStrictEqual(run1.order, run2.order, 'Repeated runs must produce identical order')
assert.strictEqual(JSON.stringify(run1.steps), JSON.stringify(run2.steps), 'Repeated runs must produce identical steps')
console.log('  PASS: Execution is strictly deterministic.')

console.log('ALL VERIFICATIONS PASSED (Exit Code 0).')
