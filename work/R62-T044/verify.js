import assert from 'node:assert/strict'
import {
  QueueUsingTwoStacks,
  validateQueueInvariant,
  traceQueueOperations,
  verifySnapshotsImmutability,
} from '../../src/algorithms/course/queue-using-two-stacks.js'

console.log('--- R62-T044 Queue Using Two Stacks: Invariant/Property Checks Verification ---')

// 1. Primary Fixture: Enqueue A,B; dequeue gives A; enqueue C; remaining dequeues give B,C
console.log('1. Verifying Primary Fixture: Enqueue A,B -> dequeue gives A -> enqueue C -> dequeues give B, C...')
const queue = new QueueUsingTwoStacks()

assert.strictEqual(queue.enqueue('A'), 1, 'Enqueue A size must be 1')
assert.strictEqual(queue.enqueue('B'), 2, 'Enqueue B size must be 2')

const d1 = queue.dequeue()
assert.strictEqual(d1, 'A', 'First dequeue must return A')

assert.strictEqual(queue.enqueue('C'), 2, 'Enqueue C size must be 2')

const d2 = queue.dequeue()
assert.strictEqual(d2, 'B', 'Second dequeue must return B')

const d3 = queue.dequeue()
assert.strictEqual(d3, 'C', 'Third dequeue must return C')

assert.strictEqual(queue.size, 0, 'Queue size must be 0 after all dequeues')
assert.strictEqual(queue.isEmpty(), true, 'Queue must be empty')
assert.strictEqual(queue.dequeue(), undefined, 'Dequeue on empty queue must return undefined')
console.log('  PASS: Primary fixture verified successfully.')

// 2. Validate Invariant after each step
console.log('2. Verifying Queue Invariant at every step...')
const ops = [
  { type: 'enqueue', value: 'A' },
  { type: 'enqueue', value: 'B' },
  { type: 'dequeue' },
  { type: 'enqueue', value: 'C' },
  { type: 'dequeue' },
  { type: 'dequeue' },
]

const trace = traceQueueOperations(ops)
assert.strictEqual(trace.allInvariantsValid, true, 'All recorded steps must satisfy invariants')
assert.strictEqual(trace.invariantErrors.length, 0, 'Must have 0 invariant errors')

for (const step of trace.steps) {
  const check = validateQueueInvariant(step)
  assert.strictEqual(check.valid, true, `Step ${step.stepIndex} (${step.action}) invariant failed: ${check.error}`)
  assert.strictEqual(step.size, step.inStack.length + step.outStack.length, 'Size must equal inStack + outStack length')
  assert.deepStrictEqual(
    step.logicalQueue,
    [...step.outStack].reverse().concat(step.inStack),
    'logicalQueue must equal [...outStack].reverse().concat(inStack)'
  )
}
console.log(`  PASS: Invariant held across all ${trace.steps.length} trace steps.`)

// 3. Snapshot Immutability (Earlier snapshots are not mutated by later steps)
console.log('3. Verifying Snapshot Immutability...')
const immutabilityQueue = new QueueUsingTwoStacks()
const recordedSnapshots = []

recordedSnapshots.push(JSON.parse(JSON.stringify(immutabilityQueue.getSteps()[0]))) // init

immutabilityQueue.enqueue('A')
recordedSnapshots.push(JSON.parse(JSON.stringify(immutabilityQueue.getSteps()[1])))

immutabilityQueue.enqueue('B')
recordedSnapshots.push(JSON.parse(JSON.stringify(immutabilityQueue.getSteps()[2])))

immutabilityQueue.dequeue()
const currentStepsAfterD1 = immutabilityQueue.getSteps()
for (let i = recordedSnapshots.length; i < currentStepsAfterD1.length; i++) {
  recordedSnapshots.push(JSON.parse(JSON.stringify(currentStepsAfterD1[i])))
}

immutabilityQueue.enqueue('C')
const currentStepsAfterEnC = immutabilityQueue.getSteps()
for (let i = recordedSnapshots.length; i < currentStepsAfterEnC.length; i++) {
  recordedSnapshots.push(JSON.parse(JSON.stringify(currentStepsAfterEnC[i])))
}

immutabilityQueue.dequeue()
immutabilityQueue.dequeue()
const currentStepsAfterD3 = immutabilityQueue.getSteps()
for (let i = recordedSnapshots.length; i < currentStepsAfterD3.length; i++) {
  recordedSnapshots.push(JSON.parse(JSON.stringify(currentStepsAfterD3[i])))
}

// Further modifications to queue
immutabilityQueue.enqueue('MUTATE_1')
immutabilityQueue.enqueue('MUTATE_2')
immutabilityQueue.clear()
immutabilityQueue.enqueue('MUTATE_3')

const stepsAtCheck = immutabilityQueue.getSteps().slice(0, recordedSnapshots.length)
const immutabilityResult = verifySnapshotsImmutability(stepsAtCheck, recordedSnapshots)
assert.strictEqual(immutabilityResult.immutable, true, `Snapshot immutability check failed: ${immutabilityResult.error}`)

// Frozen object assertion
const sampleStep = immutabilityQueue.getSteps()[1]
assert.strictEqual(Object.isFrozen(sampleStep), true, 'Step snapshot must be frozen')
assert.strictEqual(Object.isFrozen(sampleStep.inStack), true, 'Step inStack must be frozen')
assert.strictEqual(Object.isFrozen(sampleStep.outStack), true, 'Step outStack must be frozen')
assert.strictEqual(Object.isFrozen(sampleStep.logicalQueue), true, 'Step logicalQueue must be frozen')
assert.throws(() => { sampleStep.inStack.push('illegal') }, TypeError)
console.log('  PASS: Historical snapshots are strictly immutable and frozen.')

// 4. Boundary and Edge Cases
console.log('4. Verifying Edge Cases and Invariant Sensitivity...')
const emptyQueue = new QueueUsingTwoStacks()
assert.strictEqual(emptyQueue.size, 0)
assert.strictEqual(emptyQueue.isEmpty(), true)
assert.strictEqual(emptyQueue.peek(), undefined)
assert.strictEqual(emptyQueue.dequeue(), undefined)
assert.throws(() => emptyQueue.enqueue(), TypeError)

// Invariant sensitivity check: deliberate bad snapshot
const badSnapshot = {
  inStack: ['X'],
  outStack: [],
  logicalQueue: ['X'],
  size: 99, // deliberate mismatch
  front: 'X',
}
const badCheck = validateQueueInvariant(badSnapshot)
assert.strictEqual(badCheck.valid, false, 'Validator must detect size mismatch')

console.log('  PASS: Edge cases and sensitivity checks passed.')

// 5. Independent Reference Queue Model Comparison
console.log('5. Verifying against Independent Reference Queue...')
class SimpleRefQueue {
  constructor() { this.data = [] }
  enqueue(v) { this.data.push(v); return this.data.length }
  dequeue() { return this.data.shift() }
  peek() { return this.data[0] }
  get size() { return this.data.length }
  isEmpty() { return this.data.length === 0 }
}

const ref = new SimpleRefQueue()
const target = new QueueUsingTwoStacks()

const testOps = [
  ['enqueue', 10],
  ['enqueue', 20],
  ['peek'],
  ['dequeue'],
  ['enqueue', 30],
  ['enqueue', 40],
  ['dequeue'],
  ['dequeue'],
  ['dequeue'],
  ['dequeue'], // empty
]

for (const [action, val] of testOps) {
  if (action === 'enqueue') {
    assert.strictEqual(target.enqueue(val), ref.enqueue(val))
  } else if (action === 'dequeue') {
    assert.strictEqual(target.dequeue(), ref.dequeue())
  } else if (action === 'peek') {
    assert.strictEqual(target.peek(), ref.peek())
  }
  assert.strictEqual(target.size, ref.size)
  assert.strictEqual(target.isEmpty(), ref.isEmpty())
  assert.strictEqual(target.checkInvariant().valid, true)
}
console.log('  PASS: Independent reference queue equivalence verified.')

console.log('ALL CHECKS PASSED SUCCESSFULLY (Exit Code 0).')
