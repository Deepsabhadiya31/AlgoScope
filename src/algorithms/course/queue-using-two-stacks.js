/**
 * Queue using Two Stacks Implementation with Invariant/Property Validation
 * and Immutable Step Tracing.
 *
 * This module implements a FIFO (First-In, First-Out) queue using two LIFO (Last-In,
 * First-Out) stacks:
 *  - inStack: Receives newly enqueued elements.
 *  - outStack: Dispenses elements in FIFO order; populated by popping all elements
 *              from inStack into outStack when outStack is empty (reversing element order).
 *
 * Core Formal Invariants:
 *  1. Logical Queue Representation:
 *     logicalQueue = [...outStack].reverse().concat(inStack)
 *  2. Size Conservation:
 *     size === inStack.length + outStack.length === logicalQueue.length
 *  3. Front Element Consistency:
 *     When size > 0:
 *       front === (outStack.length > 0 ? outStack[outStack.length - 1] : inStack[0])
 *     When size === 0:
 *       front === undefined
 *  4. FIFO Ordering:
 *     Elements are dequeued in the exact temporal order they were enqueued.
 *  5. Snapshot Immutability:
 *     Historical step snapshots are deeply cloned and frozen (Object.freeze),
 *     guaranteeing earlier snapshots are never mutated by subsequent operations.
 */

/**
 * Validates the queue invariant for a given snapshot state.
 *
 * @param {Object} snapshot - State snapshot containing inStack, outStack, logicalQueue, size, front.
 * @returns {{ valid: boolean, error: string | null }} Invariant check result.
 */
export function validateQueueInvariant(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return {
      valid: false,
      error: 'Snapshot must be a non-null object',
    }
  }

  const { inStack, outStack, logicalQueue, size, front } = snapshot

  if (!Array.isArray(inStack) || !Array.isArray(outStack) || !Array.isArray(logicalQueue)) {
    return {
      valid: false,
      error: 'inStack, outStack, and logicalQueue must all be arrays',
    }
  }

  const calculatedSize = inStack.length + outStack.length

  // Invariant 2: Size conservation
  if (typeof size === 'number' && size !== calculatedSize) {
    return {
      valid: false,
      error: `Size mismatch: snapshot.size (${size}) !== inStack.length + outStack.length (${calculatedSize})`,
    }
  }

  if (logicalQueue.length !== calculatedSize) {
    return {
      valid: false,
      error: `Logical queue length mismatch: logicalQueue.length (${logicalQueue.length}) !== calculatedSize (${calculatedSize})`,
    }
  }

  // Invariant 1: Structural composition [...outStack].reverse().concat(inStack)
  const expectedLogical = [...outStack].reverse().concat(inStack)
  for (let i = 0; i < expectedLogical.length; i++) {
    if (expectedLogical[i] !== logicalQueue[i]) {
      return {
        valid: false,
        error: `Logical queue content mismatch at index ${i}: expected ${JSON.stringify(expectedLogical[i])}, received ${JSON.stringify(logicalQueue[i])}`,
      }
    }
  }

  // Invariant 3: Front element consistency
  let expectedFront
  if (calculatedSize > 0) {
    expectedFront = outStack.length > 0 ? outStack[outStack.length - 1] : inStack[0]
  } else {
    expectedFront = undefined
  }

  if (front !== expectedFront) {
    return {
      valid: false,
      error: `Front element mismatch: expected ${JSON.stringify(expectedFront)}, received ${JSON.stringify(front)}`,
    }
  }

  return {
    valid: true,
    error: null,
  }
}

/**
 * Creates an immutable (deeply cloned and frozen) snapshot of the queue state.
 *
 * @param {Object} params - Snapshot parameters.
 * @returns {Readonly<Object>} Frozen snapshot object.
 */
function createFrozenSnapshot({
  stepIndex,
  action,
  value,
  inStack,
  outStack,
  message,
}) {
  const inStackCopy = Object.freeze([...inStack])
  const outStackCopy = Object.freeze([...outStack])
  const logicalQueueCopy = Object.freeze([...outStack].reverse().concat(inStack))
  const size = inStack.length + outStack.length
  const front = outStack.length > 0
    ? outStack[outStack.length - 1]
    : (inStack.length > 0 ? inStack[0] : undefined)

  const snapshot = {
    stepIndex,
    action,
    value,
    inStack: inStackCopy,
    outStack: outStackCopy,
    logicalQueue: logicalQueueCopy,
    size,
    front,
    message,
    invariantValid: true,
  }

  const check = validateQueueInvariant(snapshot)
  if (!check.valid) {
    snapshot.invariantValid = false
    snapshot.invariantError = check.error
  }

  return Object.freeze(snapshot)
}

/**
 * Queue implemented using two LIFO stacks with step-by-step trace generation.
 */
export class QueueUsingTwoStacks {
  /**
   * @param {Object} [options={}] - Configuration options.
   * @param {boolean} [options.recordSnapshots=true] - Whether to record step snapshots.
   * @param {boolean} [options.recordTransferSteps=true] - Whether to record transfer steps when shifting inStack to outStack.
   */
  constructor({ recordSnapshots = true, recordTransferSteps = true } = {}) {
    this.inStack = []
    this.outStack = []
    this.steps = []
    this.recordSnapshots = recordSnapshots
    this.recordTransferSteps = recordTransferSteps

    if (this.recordSnapshots) {
      this._recordStep('init', undefined, 'Initialized empty queue with two stacks')
    }
  }

  /**
   * Internal helper to record an immutable step snapshot.
   *
   * @private
   * @param {string} action - Action category ('init', 'enqueue', 'transfer', 'dequeue', 'peek').
   * @param {*} value - Element associated with this action.
   * @param {string} message - Human-readable explanation of this step.
   * @returns {Object|null} The recorded snapshot.
   */
  _recordStep(action, value, message) {
    if (!this.recordSnapshots) return null

    const snapshot = createFrozenSnapshot({
      stepIndex: this.steps.length,
      action,
      value,
      inStack: this.inStack,
      outStack: this.outStack,
      message,
    })

    this.steps.push(snapshot)
    return snapshot
  }

  /**
   * Transfers all elements from inStack to outStack (reversing their order).
   *
   * @private
   */
  _transferInToOut() {
    const count = this.inStack.length
    while (this.inStack.length > 0) {
      this.outStack.push(this.inStack.pop())
    }

    if (this.recordTransferSteps && count > 0) {
      this._recordStep(
        'transfer',
        undefined,
        `Transferred ${count} element${count === 1 ? '' : 's'} from inStack to outStack to maintain FIFO access`
      )
    }
  }

  /**
   * Enqueues an element onto the back of the queue.
   *
   * @param {*} element - Element to enqueue.
   * @returns {number} The new size of the queue.
   * @throws {TypeError} If no element argument is passed.
   */
  enqueue(element) {
    if (arguments.length === 0) {
      throw new TypeError('enqueue requires an element argument')
    }

    this.inStack.push(element)
    this._recordStep('enqueue', element, `Enqueued ${JSON.stringify(element)} onto inStack`)
    return this.size
  }

  /**
   * Dequeues and returns the front element from the queue.
   *
   * @returns {*} The dequeued element, or undefined if the queue is empty.
   */
  dequeue() {
    if (this.isEmpty()) {
      this._recordStep('dequeue_empty', undefined, 'Attempted dequeue on empty queue; returned undefined')
      return undefined
    }

    if (this.outStack.length === 0) {
      this._transferInToOut()
    }

    const value = this.outStack.pop()
    this._recordStep('dequeue', value, `Dequeued ${JSON.stringify(value)} from outStack`)
    return value
  }

  /**
   * Peeks at the front element of the queue without removing it.
   *
   * @returns {*} The front element, or undefined if the queue is empty.
   */
  peek() {
    if (this.isEmpty()) {
      this._recordStep('peek_empty', undefined, 'Attempted peek on empty queue; returned undefined')
      return undefined
    }

    if (this.outStack.length === 0) {
      this._transferInToOut()
    }

    const value = this.outStack[this.outStack.length - 1]
    this._recordStep('peek', value, `Peeked front element: ${JSON.stringify(value)}`)
    return value
  }

  /**
   * Total number of elements currently stored in the queue.
   *
   * @type {number}
   */
  get size() {
    return this.inStack.length + this.outStack.length
  }

  /**
   * Whether the queue contains zero elements.
   *
   * @returns {boolean}
   */
  isEmpty() {
    return this.size === 0
  }

  /**
   * Returns a copy of the elements currently in the logical queue in FIFO order (front to back).
   *
   * @returns {Array} Array of elements in logical FIFO order.
   */
  toLogicalQueue() {
    return [...this.outStack].reverse().concat(this.inStack)
  }

  /**
   * Returns a shallow copy of the recorded step snapshots.
   *
   * @returns {Array<Readonly<Object>>} Array of frozen step snapshots.
   */
  getSteps() {
    return [...this.steps]
  }

  /**
   * Validates the invariant for the current live state of the queue.
   *
   * @returns {{ valid: boolean, error: string | null }}
   */
  checkInvariant() {
    return validateQueueInvariant({
      inStack: this.inStack,
      outStack: this.outStack,
      logicalQueue: this.toLogicalQueue(),
      size: this.size,
      front: this.outStack.length > 0
        ? this.outStack[this.outStack.length - 1]
        : (this.inStack.length > 0 ? this.inStack[0] : undefined),
    })
  }

  /**
   * Clears all elements from the queue and records a clear step.
   * Does not erase prior step history.
   */
  clear() {
    this.inStack = []
    this.outStack = []
    if (this.recordSnapshots) {
      this._recordStep('clear', undefined, 'Cleared all elements from queue')
    }
  }

  /**
   * Resets the entire queue instance, clearing elements and resetting step history.
   */
  reset() {
    this.inStack = []
    this.outStack = []
    this.steps = []
    if (this.recordSnapshots) {
      this._recordStep('init', undefined, 'Initialized empty queue with two stacks')
    }
  }
}

/**
 * Traces a sequence of queue operations and verifies invariant compliance at every step.
 *
 * @param {Array<Object|Array|string>} operations - Array of operations to execute.
 * @param {Object} [options={}] - Options passed to QueueUsingTwoStacks.
 * @returns {{
 *   queue: QueueUsingTwoStacks,
 *   results: Array<Object>,
 *   steps: Array<Object>,
 *   allInvariantsValid: boolean,
 *   invariantErrors: Array<Object>,
 *   finalState: Object
 * }} Execution summary.
 */
export function traceQueueOperations(operations, options = {}) {
  if (!Array.isArray(operations)) {
    throw new TypeError('operations must be an array')
  }

  const queue = new QueueUsingTwoStacks(options)
  const results = []

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i]
    let type
    let value

    if (typeof op === 'string') {
      type = op
    } else if (Array.isArray(op)) {
      type = op[0]
      value = op[1]
    } else if (typeof op === 'object' && op !== null) {
      type = op.type ?? op.op ?? op.action
      value = op.value ?? op.val ?? op.element
    } else {
      throw new TypeError(`Invalid operation descriptor at index ${i}: ${JSON.stringify(op)}`)
    }

    const normalizedType = String(type).toLowerCase()

    if (normalizedType === 'enqueue' || normalizedType === 'push') {
      const newSize = queue.enqueue(value)
      results.push({ op: 'enqueue', value, result: newSize })
    } else if (normalizedType === 'dequeue' || normalizedType === 'pop') {
      const dequeued = queue.dequeue()
      results.push({ op: 'dequeue', result: dequeued })
    } else if (normalizedType === 'peek' || normalizedType === 'front') {
      const peeked = queue.peek()
      results.push({ op: 'peek', result: peeked })
    } else {
      throw new RangeError(`Unknown operation type at index ${i}: ${type}`)
    }
  }

  const steps = queue.getSteps()
  let allInvariantsValid = true
  const invariantErrors = []

  for (const step of steps) {
    const invCheck = validateQueueInvariant(step)
    if (!invCheck.valid) {
      allInvariantsValid = false
      invariantErrors.push({ stepIndex: step.stepIndex, error: invCheck.error })
    }
  }

  return {
    queue,
    results,
    steps,
    allInvariantsValid,
    invariantErrors,
    finalState: {
      inStack: [...queue.inStack],
      outStack: [...queue.outStack],
      logicalQueue: queue.toLogicalQueue(),
      size: queue.size,
      isEmpty: queue.isEmpty(),
    },
  }
}

/**
 * Verifies that a list of step snapshots has remained completely identical to an
 * independently captured baseline snapshot array (verifying snapshot immutability).
 *
 * @param {Array<Object>} steps - Current step snapshots to verify.
 * @param {Array<Object>} referenceSnapshots - Deeply copied baseline snapshots.
 * @returns {{ immutable: boolean, error: string | null }}
 */
export function verifySnapshotsImmutability(steps, referenceSnapshots) {
  if (!Array.isArray(steps) || !Array.isArray(referenceSnapshots)) {
    throw new TypeError('Both steps and referenceSnapshots must be arrays')
  }

  if (steps.length !== referenceSnapshots.length) {
    return {
      immutable: false,
      error: `Length mismatch: steps has ${steps.length}, reference has ${referenceSnapshots.length}`,
    }
  }

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i]
    const ref = referenceSnapshots[i]

    if (JSON.stringify(s.inStack) !== JSON.stringify(ref.inStack)) {
      return {
        immutable: false,
        error: `inStack at step ${i} was mutated! Expected ${JSON.stringify(ref.inStack)}, got ${JSON.stringify(s.inStack)}`,
      }
    }

    if (JSON.stringify(s.outStack) !== JSON.stringify(ref.outStack)) {
      return {
        immutable: false,
        error: `outStack at step ${i} was mutated! Expected ${JSON.stringify(ref.outStack)}, got ${JSON.stringify(s.outStack)}`,
      }
    }

    if (JSON.stringify(s.logicalQueue) !== JSON.stringify(ref.logicalQueue)) {
      return {
        immutable: false,
        error: `logicalQueue at step ${i} was mutated! Expected ${JSON.stringify(ref.logicalQueue)}, got ${JSON.stringify(s.logicalQueue)}`,
      }
    }

    if (s.size !== ref.size) {
      return {
        immutable: false,
        error: `size at step ${i} was mutated! Expected ${ref.size}, got ${s.size}`,
      }
    }

    if (s.front !== ref.front) {
      return {
        immutable: false,
        error: `front at step ${i} was mutated! Expected ${JSON.stringify(ref.front)}, got ${JSON.stringify(s.front)}`,
      }
    }
  }

  return {
    immutable: true,
    error: null,
  }
}

export default QueueUsingTwoStacks
