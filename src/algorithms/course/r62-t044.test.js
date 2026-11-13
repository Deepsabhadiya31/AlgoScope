import { describe, it, expect } from 'vitest'
import {
  QueueUsingTwoStacks,
  validateQueueInvariant,
  traceQueueOperations,
  verifySnapshotsImmutability,
} from './queue-using-two-stacks'

/**
 * Independent Reference Queue Implementation.
 * Uses a standard JavaScript array with push() and shift() as an independent baseline.
 */
class ReferenceQueue {
  constructor() {
    this.items = []
  }

  enqueue(val) {
    this.items.push(val)
    return this.items.length
  }

  dequeue() {
    return this.items.shift()
  }

  peek() {
    return this.items[0]
  }

  get size() {
    return this.items.length
  }

  isEmpty() {
    return this.items.length === 0
  }

  toLogicalQueue() {
    return [...this.items]
  }
}

describe('R62-T044: Queue Using Two Stacks — Invariant and Property Checks', () => {
  describe('1. Primary Fixture: Enqueue A,B; dequeue gives A; enqueue C; remaining dequeues give B,C', () => {
    it('executes the primary fixture correctly and matches expected FIFO outputs', () => {
      const queue = new QueueUsingTwoStacks()

      // Enqueue 'A', 'B'
      expect(queue.enqueue('A')).toBe(1)
      expect(queue.enqueue('B')).toBe(2)

      // Dequeue gives 'A'
      const d1 = queue.dequeue()
      expect(d1).toBe('A')

      // Enqueue 'C'
      expect(queue.enqueue('C')).toBe(2)

      // Remaining dequeues give 'B', 'C'
      const d2 = queue.dequeue()
      expect(d2).toBe('B')

      const d3 = queue.dequeue()
      expect(d3).toBe('C')

      // Queue is now empty
      expect(queue.isEmpty()).toBe(true)
      expect(queue.size).toBe(0)
      expect(queue.dequeue()).toBeUndefined()
    })

    it('produces the exact step sequence with valid invariants after each recorded step', () => {
      const ops = [
        { type: 'enqueue', value: 'A' },
        { type: 'enqueue', value: 'B' },
        { type: 'dequeue' },
        { type: 'enqueue', value: 'C' },
        { type: 'dequeue' },
        { type: 'dequeue' },
      ]

      const { results, steps, allInvariantsValid, invariantErrors } = traceQueueOperations(ops)

      expect(allInvariantsValid).toBe(true)
      expect(invariantErrors).toEqual([])

      // Check results of operations
      expect(results).toEqual([
        { op: 'enqueue', value: 'A', result: 1 },
        { op: 'enqueue', value: 'B', result: 2 },
        { op: 'dequeue', result: 'A' },
        { op: 'enqueue', value: 'C', result: 2 },
        { op: 'dequeue', result: 'B' },
        { op: 'dequeue', result: 'C' },
      ])

      // Every recorded step must pass validateQueueInvariant
      for (const step of steps) {
        const inv = validateQueueInvariant(step)
        expect(inv.valid).toBe(true)
        expect(inv.error).toBeNull()
      }
    })

    it('verifies exact step-by-step intermediate state in primary fixture trace', () => {
      const queue = new QueueUsingTwoStacks({ recordTransferSteps: true })
      queue.enqueue('A')
      queue.enqueue('B')
      queue.dequeue()
      queue.enqueue('C')
      queue.dequeue()
      queue.dequeue()

      const steps = queue.getSteps()
      expect(steps.length).toBe(9) // init, enq(A), enq(B), transfer([A,B]), deq(A), enq(C), deq(B), transfer([C]), deq(C)

      // Step 0: Initial state
      expect(steps[0].action).toBe('init')
      expect(steps[0].inStack).toEqual([])
      expect(steps[0].outStack).toEqual([])
      expect(steps[0].logicalQueue).toEqual([])
      expect(steps[0].front).toBeUndefined()
      expect(steps[0].size).toBe(0)

      // Step 1: Enqueue A
      expect(steps[1].action).toBe('enqueue')
      expect(steps[1].value).toBe('A')
      expect(steps[1].inStack).toEqual(['A'])
      expect(steps[1].outStack).toEqual([])
      expect(steps[1].logicalQueue).toEqual(['A'])
      expect(steps[1].front).toBe('A')

      // Step 2: Enqueue B
      expect(steps[2].action).toBe('enqueue')
      expect(steps[2].value).toBe('B')
      expect(steps[2].inStack).toEqual(['A', 'B'])
      expect(steps[2].outStack).toEqual([])
      expect(steps[2].logicalQueue).toEqual(['A', 'B'])
      expect(steps[2].front).toBe('A')

      // Step 3: Transfer to outStack
      expect(steps[3].action).toBe('transfer')
      expect(steps[3].inStack).toEqual([])
      expect(steps[3].outStack).toEqual(['B', 'A'])
      expect(steps[3].logicalQueue).toEqual(['A', 'B'])
      expect(steps[3].front).toBe('A')

      // Step 4: Dequeue A
      expect(steps[4].action).toBe('dequeue')
      expect(steps[4].value).toBe('A')
      expect(steps[4].inStack).toEqual([])
      expect(steps[4].outStack).toEqual(['B'])
      expect(steps[4].logicalQueue).toEqual(['B'])
      expect(steps[4].front).toBe('B')

      // Step 5: Enqueue C
      expect(steps[5].action).toBe('enqueue')
      expect(steps[5].value).toBe('C')
      expect(steps[5].inStack).toEqual(['C'])
      expect(steps[5].outStack).toEqual(['B'])
      expect(steps[5].logicalQueue).toEqual(['B', 'C'])
      expect(steps[5].front).toBe('B')

      // Step 6: Dequeue B
      expect(steps[6].action).toBe('dequeue')
      expect(steps[6].value).toBe('B')
      expect(steps[6].inStack).toEqual(['C'])
      expect(steps[6].outStack).toEqual([])
      expect(steps[6].logicalQueue).toEqual(['C'])
      expect(steps[6].front).toBe('C')

      // Step 7: Transfer C to outStack
      expect(steps[7].action).toBe('transfer')
      expect(steps[7].inStack).toEqual([])
      expect(steps[7].outStack).toEqual(['C'])
      expect(steps[7].logicalQueue).toEqual(['C'])
      expect(steps[7].front).toBe('C')

      // Step 8: Dequeue C
      expect(steps[8].action).toBe('dequeue')
      expect(steps[8].value).toBe('C')
      expect(steps[8].inStack).toEqual([])
      expect(steps[8].outStack).toEqual([])
      expect(steps[8].logicalQueue).toEqual([])
      expect(steps[8].front).toBeUndefined()
    })

    it('supports concise operational trace without intermediate transfer steps when configured', () => {
      const queue = new QueueUsingTwoStacks({ recordTransferSteps: false })
      queue.enqueue('A')
      queue.enqueue('B')
      queue.dequeue()
      queue.enqueue('C')
      queue.dequeue()
      queue.dequeue()

      const actions = queue.getSteps().map(s => s.action)
      expect(actions).toEqual(['init', 'enqueue', 'enqueue', 'dequeue', 'enqueue', 'dequeue', 'dequeue'])
    })
  })

  describe('2. Invariant Validation at Every Step', () => {
    it('preserves all core invariants throughout complex operations', () => {
      const queue = new QueueUsingTwoStacks()

      // Initial step invariant check
      expect(queue.checkInvariant().valid).toBe(true)

      // Step 1: Enqueue 10
      queue.enqueue(10)
      expect(queue.checkInvariant().valid).toBe(true)
      expect(queue.toLogicalQueue()).toEqual([10])

      // Step 2: Enqueue 20
      queue.enqueue(20)
      expect(queue.checkInvariant().valid).toBe(true)
      expect(queue.toLogicalQueue()).toEqual([10, 20])

      // Step 3: Enqueue 30
      queue.enqueue(30)
      expect(queue.checkInvariant().valid).toBe(true)
      expect(queue.toLogicalQueue()).toEqual([10, 20, 30])

      // Step 4: Dequeue 10 (triggers transfer of [10, 20, 30] from inStack to outStack)
      expect(queue.dequeue()).toBe(10)
      expect(queue.checkInvariant().valid).toBe(true)
      expect(queue.toLogicalQueue()).toEqual([20, 30])

      // Step 5: Enqueue 40 while outStack is non-empty
      queue.enqueue(40)
      expect(queue.checkInvariant().valid).toBe(true)
      expect(queue.toLogicalQueue()).toEqual([20, 30, 40])
      expect(queue.inStack).toEqual([40])
      expect(queue.outStack).toEqual([30, 20])

      // Step 6: Dequeue 20 from outStack
      expect(queue.dequeue()).toBe(20)
      expect(queue.checkInvariant().valid).toBe(true)
      expect(queue.toLogicalQueue()).toEqual([30, 40])

      // Step 7: Dequeue 30 from outStack
      expect(queue.dequeue()).toBe(30)
      expect(queue.checkInvariant().valid).toBe(true)
      expect(queue.toLogicalQueue()).toEqual([40])

      // Step 8: Dequeue 40 (triggers transfer of [40] from inStack to outStack)
      expect(queue.dequeue()).toBe(40)
      expect(queue.checkInvariant().valid).toBe(true)
      expect(queue.toLogicalQueue()).toEqual([])
      expect(queue.isEmpty()).toBe(true)

      // Verify all recorded steps in history satisfy the invariant
      const steps = queue.getSteps()
      for (const step of steps) {
        expect(validateQueueInvariant(step).valid).toBe(true)
        expect(step.size).toBe(step.inStack.length + step.outStack.length)
        expect(step.logicalQueue).toEqual(
          [...step.outStack].reverse().concat(step.inStack)
        )
      }
    })

    it('preserves invariant across peek operations without dequeuing', () => {
      const queue = new QueueUsingTwoStacks()
      queue.enqueue('X')
      queue.enqueue('Y')

      // Peek triggers transfer if outStack is empty
      const p1 = queue.peek()
      expect(p1).toBe('X')
      expect(queue.size).toBe(2)
      expect(queue.toLogicalQueue()).toEqual(['X', 'Y'])
      expect(queue.checkInvariant().valid).toBe(true)

      // Repeated peek returns same element
      expect(queue.peek()).toBe('X')
      expect(queue.size).toBe(2)

      // Dequeue confirms 'X' is still the front
      expect(queue.dequeue()).toBe('X')
      expect(queue.peek()).toBe('Y')
      expect(queue.size).toBe(1)
    })
  })

  describe('3. Snapshot Immutability (Earlier snapshots are not mutated by later steps)', () => {
    it('ensures historical step snapshots remain identical even after subsequent enqueues and dequeues', () => {
      const queue = new QueueUsingTwoStacks()

      // Capture snapshots at each stage by cloning their current representation
      const capturedSnapshots = []

      capturedSnapshots.push(JSON.parse(JSON.stringify(queue.getSteps()[0]))) // init

      queue.enqueue('A')
      capturedSnapshots.push(JSON.parse(JSON.stringify(queue.getSteps()[1])))

      queue.enqueue('B')
      capturedSnapshots.push(JSON.parse(JSON.stringify(queue.getSteps()[2])))

      queue.dequeue()
      const currentStepsAfterD1 = queue.getSteps()
      for (let i = capturedSnapshots.length; i < currentStepsAfterD1.length; i++) {
        capturedSnapshots.push(JSON.parse(JSON.stringify(currentStepsAfterD1[i])))
      }

      queue.enqueue('C')
      const currentStepsAfterEnC = queue.getSteps()
      for (let i = capturedSnapshots.length; i < currentStepsAfterEnC.length; i++) {
        capturedSnapshots.push(JSON.parse(JSON.stringify(currentStepsAfterEnC[i])))
      }

      queue.dequeue()
      queue.dequeue()
      const currentStepsAfterFinal = queue.getSteps()
      for (let i = capturedSnapshots.length; i < currentStepsAfterFinal.length; i++) {
        capturedSnapshots.push(JSON.parse(JSON.stringify(currentStepsAfterFinal[i])))
      }

      // Perform extra aggressive operations on the live queue
      queue.enqueue('D')
      queue.enqueue('E')
      queue.clear()
      queue.enqueue('Z')

      // Verify that all original captured snapshots up to the end of the primary fixture
      // are 100% identical in the live step history!
      const stepsNow = queue.getSteps().slice(0, capturedSnapshots.length)
      const immutabilityCheck = verifySnapshotsImmutability(stepsNow, capturedSnapshots)

      expect(immutabilityCheck.immutable).toBe(true)
      expect(immutabilityCheck.error).toBeNull()
    })

    it('freezes snapshot objects and arrays so in-place mutations throw in strict mode', () => {
      const queue = new QueueUsingTwoStacks()
      queue.enqueue('test-val')

      const step = queue.getSteps()[1]
      expect(Object.isFrozen(step)).toBe(true)
      expect(Object.isFrozen(step.inStack)).toBe(true)
      expect(Object.isFrozen(step.outStack)).toBe(true)
      expect(Object.isFrozen(step.logicalQueue)).toBe(true)

      // Attempting to push or mutate frozen arrays throws a TypeError
      expect(() => {
        step.inStack.push('illegal-mutation')
      }).toThrow(TypeError)

      expect(() => {
        step.outStack.push('illegal-mutation')
      }).toThrow(TypeError)

      expect(() => {
        step.logicalQueue.push('illegal-mutation')
      }).toThrow(TypeError)
    })
  })

  describe('4. Independent Reference Model Comparison (Fuzz / Property-Based Testing)', () => {
    it('matches an independent reference queue across randomized operation streams', () => {
      const refQueue = new ReferenceQueue()
      const twoStackQueue = new QueueUsingTwoStacks()

      const values = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 42, -99, 0, null, { key: 'val' }]
      let lcg = 123456789
      const pseudoRandom = () => {
        lcg = (1103515245 * lcg + 12345) % 2147483648
        return lcg / 2147483648
      }

      for (let i = 0; i < 200; i++) {
        const rand = pseudoRandom()
        if (rand < 0.55 || refQueue.isEmpty()) {
          // Enqueue
          const val = values[Math.floor(pseudoRandom() * values.length)]
          const refSize = refQueue.enqueue(val)
          const tsSize = twoStackQueue.enqueue(val)
          expect(tsSize).toBe(refSize)
        } else if (rand < 0.85) {
          // Dequeue
          const refDeq = refQueue.dequeue()
          const tsDeq = twoStackQueue.dequeue()
          expect(tsDeq).toEqual(refDeq)
        } else {
          // Peek
          const refPeek = refQueue.peek()
          const tsPeek = twoStackQueue.peek()
          expect(tsPeek).toEqual(refPeek)
        }

        // Check equivalence of size, isEmpty, front, and logical queue
        expect(twoStackQueue.size).toBe(refQueue.size)
        expect(twoStackQueue.isEmpty()).toBe(refQueue.isEmpty())
        expect(twoStackQueue.toLogicalQueue()).toEqual(refQueue.toLogicalQueue())

        // Invariant must strictly hold after every operation
        const inv = twoStackQueue.checkInvariant()
        expect(inv.valid).toBe(true)
      }
    })

    it('handles a large batch of 1000 sequential operations without state degradation', () => {
      const refQueue = new ReferenceQueue()
      const queue = new QueueUsingTwoStacks({ recordSnapshots: false }) // test high-volume execution

      for (let i = 0; i < 500; i++) {
        refQueue.enqueue(i)
        queue.enqueue(i)
      }

      for (let i = 0; i < 250; i++) {
        expect(queue.dequeue()).toBe(refQueue.dequeue())
      }

      for (let i = 500; i < 750; i++) {
        refQueue.enqueue(i)
        queue.enqueue(i)
      }

      while (!refQueue.isEmpty()) {
        expect(queue.dequeue()).toBe(refQueue.dequeue())
      }

      expect(queue.isEmpty()).toBe(true)
    })
  })

  describe('5. Boundary Cases & Error Handling', () => {
    it('handles empty queue behavior gracefully', () => {
      const queue = new QueueUsingTwoStacks()
      expect(queue.size).toBe(0)
      expect(queue.isEmpty()).toBe(true)
      expect(queue.peek()).toBeUndefined()
      expect(queue.dequeue()).toBeUndefined()
      expect(queue.toLogicalQueue()).toEqual([])
    })

    it('throws TypeError when enqueue is called with no arguments', () => {
      const queue = new QueueUsingTwoStacks()
      expect(() => queue.enqueue()).toThrow(TypeError)
    })

    it('handles duplicate values and preserves distinct FIFO slots', () => {
      const queue = new QueueUsingTwoStacks()
      queue.enqueue('dup')
      queue.enqueue('dup')
      queue.enqueue('other')
      queue.enqueue('dup')

      expect(queue.dequeue()).toBe('dup')
      expect(queue.dequeue()).toBe('dup')
      expect(queue.dequeue()).toBe('other')
      expect(queue.dequeue()).toBe('dup')
      expect(queue.dequeue()).toBeUndefined()
    })

    it('allows clearing the queue and reusing it cleanly', () => {
      const queue = new QueueUsingTwoStacks()
      queue.enqueue(1)
      queue.enqueue(2)
      expect(queue.size).toBe(2)

      queue.clear()
      expect(queue.size).toBe(0)
      expect(queue.isEmpty()).toBe(true)
      expect(queue.toLogicalQueue()).toEqual([])

      queue.enqueue('fresh')
      expect(queue.dequeue()).toBe('fresh')
    })

    it('allows full instance reset via reset()', () => {
      const queue = new QueueUsingTwoStacks()
      queue.enqueue('X')
      queue.reset()
      expect(queue.size).toBe(0)
      expect(queue.getSteps().length).toBe(1)
      expect(queue.getSteps()[0].action).toBe('init')
    })

    it('handles diverse data types correctly', () => {
      const queue = new QueueUsingTwoStacks()
      const obj = { id: 1 }
      const arr = [1, 2]

      queue.enqueue(0)
      queue.enqueue(false)
      queue.enqueue(null)
      queue.enqueue('')
      queue.enqueue(obj)
      queue.enqueue(arr)

      expect(queue.dequeue()).toBe(0)
      expect(queue.dequeue()).toBe(false)
      expect(queue.dequeue()).toBeNull()
      expect(queue.dequeue()).toBe('')
      expect(queue.dequeue()).toBe(obj)
      expect(queue.dequeue()).toBe(arr)
    })

    it('validates operation descriptor inputs in traceQueueOperations', () => {
      expect(() => traceQueueOperations('not-an-array')).toThrow(TypeError)
      expect(() => traceQueueOperations([123])).toThrow(TypeError)
      expect(() => traceQueueOperations([{ type: 'unsupported_op' }])).toThrow(RangeError)
    })
  })

  describe('6. Invariant Sensitivity Checks (Negative Testing)', () => {
    it('rejects snapshots with non-object input', () => {
      expect(validateQueueInvariant(null).valid).toBe(false)
      expect(validateQueueInvariant('not-object').valid).toBe(false)
    })

    it('rejects snapshots with non-array stack fields', () => {
      expect(validateQueueInvariant({ inStack: 'bad', outStack: [], logicalQueue: [] }).valid).toBe(false)
    })

    it('rejects snapshots with size mismatch', () => {
      const malformedSnapshot = {
        inStack: ['A'],
        outStack: ['B'],
        logicalQueue: ['B', 'A'],
        size: 99, // deliberate bug
        front: 'B',
      }
      const check = validateQueueInvariant(malformedSnapshot)
      expect(check.valid).toBe(false)
      expect(check.error).toContain('Size mismatch')
    })

    it('rejects snapshots with corrupted logical queue length', () => {
      const malformedSnapshot = {
        inStack: ['A'],
        outStack: ['B'],
        logicalQueue: ['B'], // length mismatch (1 instead of 2)
        size: 2,
        front: 'B',
      }
      const check = validateQueueInvariant(malformedSnapshot)
      expect(check.valid).toBe(false)
      expect(check.error).toContain('Logical queue length mismatch')
    })

    it('rejects snapshots with corrupted logical queue ordering', () => {
      const malformedSnapshot = {
        inStack: ['A', 'B'],
        outStack: ['C'],
        logicalQueue: ['A', 'B', 'C'], // deliberate order corruption (should be ['C', 'A', 'B'])
        size: 3,
        front: 'C',
      }
      const check = validateQueueInvariant(malformedSnapshot)
      expect(check.valid).toBe(false)
      expect(check.error).toContain('Logical queue content mismatch')
    })

    it('rejects snapshots with incorrect front element reference', () => {
      const malformedSnapshot = {
        inStack: ['A', 'B'],
        outStack: [],
        logicalQueue: ['A', 'B'],
        size: 2,
        front: 'B', // deliberate bug: front of ['A', 'B'] is 'A', not 'B'
      }
      const check = validateQueueInvariant(malformedSnapshot)
      expect(check.valid).toBe(false)
      expect(check.error).toContain('Front element mismatch')
    })

    it('detects snapshot mutation via verifySnapshotsImmutability', () => {
      const baseline = [
        {
          inStack: ['A'],
          outStack: [],
          logicalQueue: ['A'],
          size: 1,
          front: 'A',
        },
      ]
      const mutated = [
        {
          inStack: ['A', 'MUTATED'],
          outStack: [],
          logicalQueue: ['A'],
          size: 1,
          front: 'A',
        },
      ]
      const result = verifySnapshotsImmutability(mutated, baseline)
      expect(result.immutable).toBe(false)
      expect(result.error).toContain('inStack at step 0 was mutated')
    })

    it('validates verifySnapshotsImmutability argument types and length checks', () => {
      expect(() => verifySnapshotsImmutability('bad', [])).toThrow(TypeError)
      expect(() => verifySnapshotsImmutability([], 'bad')).toThrow(TypeError)

      const lengthMismatch = verifySnapshotsImmutability([{ inStack: [] }], [])
      expect(lengthMismatch.immutable).toBe(false)
      expect(lengthMismatch.error).toContain('Length mismatch')
    })
  })
})
