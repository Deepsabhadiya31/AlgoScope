import assert from 'node:assert/strict'
import {
  pancakeSort,
  flip,
  replayOperations,
  replayTrace,
} from '../../src/algorithms/course/pancake-sort.js'

function getFrequencyMap(arr) {
  const map = new Map()
  for (const item of arr) {
    map.set(item, (map.get(item) ?? 0) + 1)
  }
  return map
}

function mapsEqual(a, b) {
  if (a.size !== b.size) return false
  for (const [key, val] of a.entries()) {
    if (b.get(key) !== val) return false
  }
  return true
}

console.log('--- R62-T041 Pancake Sort Verification ---')

// 1. Primary Fixture: [3, 1, 2] -> [1, 2, 3]
console.log('1. Verifying Primary Fixture: [3, 1, 2]...')
const fixtureInput = [3, 1, 2]
const fixtureResult = pancakeSort(fixtureInput)

assert.deepStrictEqual(fixtureResult.sorted, [1, 2, 3], 'Sorted output must be [1, 2, 3]')
assert.strictEqual(fixtureResult.operations.length, 2, 'Should have exactly 2 operations')
assert.deepStrictEqual(
  fixtureResult.operations[0],
  {
    type: 'flip',
    k: 3,
    index: 2,
    array: [2, 1, 3],
    message: 'Flipped prefix of length 3 to place max value 3 at index 2',
  },
  'First operation must flip prefix of length 3'
)
assert.deepStrictEqual(
  fixtureResult.operations[1],
  {
    type: 'flip',
    k: 2,
    index: 1,
    array: [1, 2, 3],
    message: 'Flipped prefix of length 2 to place max value 2 at index 1',
  },
  'Second operation must flip prefix of length 2'
)

// Replay trace verification
const replayedFixture = replayOperations(fixtureInput, fixtureResult.operations)
assert.deepStrictEqual(replayedFixture, [1, 2, 3], 'Replaying operations must reproduce [1, 2, 3]')

const traceFixture = replayTrace(fixtureInput, fixtureResult.operations)
assert.deepStrictEqual(
  traceFixture,
  [[3, 1, 2], [2, 1, 3], [1, 2, 3]],
  'Intermediate replay trace must match expected sequence'
)
console.log('  PASS: Primary fixture verified successfully.')

// 2. Original input preservation (non-mutation)
console.log('2. Verifying Non-Mutation Contract...')
const frozen = Object.freeze([3, 1, 2])
assert.doesNotThrow(() => pancakeSort(frozen), 'Must not mutate frozen array')
assert.deepStrictEqual(fixtureInput, [3, 1, 2], 'Original input array must remain unchanged')
console.log('  PASS: Input non-mutation verified.')

// 3. Multiplicity and element preservation
console.log('3. Verifying Multiplicity Preservation...')
const multiInputs = [
  [3, 1, 2],
  [4, 2, 4, 3, 2, 1, 4],
  [5, 5, 5],
  [1, 2, 1, 2, 1, 2],
  [-1, 0, -1, 2, 0, -1],
]
for (const input of multiInputs) {
  const res = pancakeSort(input)
  const inMap = getFrequencyMap(input)
  const outMap = getFrequencyMap(res.sorted)
  assert.strictEqual(res.sorted.length, input.length, 'Length must be preserved')
  assert.ok(mapsEqual(inMap, outMap), 'Element frequencies must be preserved exactly')
  for (const op of res.operations) {
    assert.ok(mapsEqual(getFrequencyMap(op.array), inMap), 'Intermediate states must preserve frequencies')
  }
}
console.log('  PASS: Multiplicity preservation verified.')

// 4. Operation validity: prefix reversal within bounds
console.log('4. Verifying Operation Bounds and Prefix Invariants...')
const testSets = [
  [3, 1, 2],
  [9, 4, 7, 2, 8, 1, 5],
  [1, 2, 3, 4],
  [4, 3, 2, 1],
  [2, 3, 2, 1, 3],
]
for (const arr of testSets) {
  const res = pancakeSort(arr)
  let cur = [...arr]
  for (const op of res.operations) {
    assert.strictEqual(op.type, 'flip', 'Op type must be flip')
    assert.ok(Number.isInteger(op.k), 'k must be integer')
    assert.ok(op.k >= 2 && op.k <= arr.length, `k must be between 2 and ${arr.length}`)
    assert.strictEqual(op.index, op.k - 1, 'index must be k - 1')
    cur = flip(cur, op.k)
    assert.deepStrictEqual(cur, op.array, 'Operation array snapshot must match flip result')
  }
  assert.deepStrictEqual(cur, res.sorted, 'Cumulative flips must match sorted result')
  assert.deepStrictEqual(replayOperations(arr, res.operations), res.sorted, 'replayOperations must match sorted result')
}
console.log('  PASS: Operation validity and bounds verified.')

// 5. Edge cases
console.log('5. Verifying Edge Cases...')
// Empty
const emptyRes = pancakeSort([])
assert.deepStrictEqual(emptyRes.sorted, [])
assert.strictEqual(emptyRes.operations.length, 0)

// Single element
const singleRes = pancakeSort([99])
assert.deepStrictEqual(singleRes.sorted, [99])
assert.strictEqual(singleRes.operations.length, 0)

// Already sorted
const sortedRes = pancakeSort([1, 2, 3, 4])
assert.deepStrictEqual(sortedRes.sorted, [1, 2, 3, 4])
assert.strictEqual(sortedRes.operations.length, 0)

// Reverse sorted
const reverseRes = pancakeSort([5, 4, 3, 2, 1])
assert.deepStrictEqual(reverseRes.sorted, [1, 2, 3, 4, 5])
assert.deepStrictEqual(replayOperations([5, 4, 3, 2, 1], reverseRes.operations), [1, 2, 3, 4, 5])

// Duplicates
const dupRes = pancakeSort([3, 1, 3, 2, 1, 2])
assert.deepStrictEqual(dupRes.sorted, [1, 1, 2, 2, 3, 3])
assert.deepStrictEqual(replayOperations([3, 1, 3, 2, 1, 2], dupRes.operations), [1, 1, 2, 2, 3, 3])

// All identical
const identRes = pancakeSort([8, 8, 8])
assert.deepStrictEqual(identRes.sorted, [8, 8, 8])
assert.strictEqual(identRes.operations.length, 0)

console.log('  PASS: All edge cases verified.')
console.log('ALL VERIFICATIONS PASSED.')

