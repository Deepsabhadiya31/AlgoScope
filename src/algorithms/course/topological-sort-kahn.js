/**
 * Topological Sort using Kahn's Algorithm (BFS In-Degree Removal)
 * Pure Algorithm Module with Cycle Detection, Deterministic Tie-Breaking,
 * and Trace Replay Capabilities.
 *
 * Mathematical Principles:
 *  - A topological sort of a Directed Acyclic Graph (DAG) is a linear ordering of
 *    its vertices such that for every directed edge u -> v, u comes before v.
 *  - Kahn's algorithm operates by iteratively removing vertices with in-degree 0:
 *      1. Compute in-degree for every vertex in the graph.
 *      2. Collect all vertices with in-degree 0 into a processing queue.
 *      3. Repeatedly dequeue vertex u, append u to the topological order, and
 *         decrement in-degree for all neighbors v of u.
 *      4. If a neighbor v reaches in-degree 0, add v to the queue.
 *      5. After queue is empty:
 *         - If processed count === total vertices: graph is a DAG, return valid order.
 *         - If processed count < total vertices: graph contains at least one directed cycle.
 *           Return explicit failure state with order: null and list unprocessed vertices.
 *
 * Separation of Concerns:
 *  - Pure algorithm logic: completely independent of React, DOM, or UI components.
 *  - Deterministic execution: deterministic tie-breaking ensures identical runs produce identical output.
 *  - Replay trace: immutable snapshots of state (queue, in-degrees, order) at every step.
 */

/**
 * Normalizes diverse graph input formats into a canonical representation:
 *  { vertices: string[], adjacency: Map<string, string[]> }
 *
 * Supported input formats:
 *  1. Adjacency Object: { A: ['C'], B: ['C'], C: [] }
 *  2. Edge List: [['A', 'C'], ['B', 'C']] or [{ from: 'A', to: 'C' }, ...]
 *  3. Graph Descriptor: { vertices: ['A', 'B', 'C'], edges: [['A', 'C'], ...] }
 *  4. Adjacency Map: Map<string, string[]>
 *
 * @param {*} input - Graph representation.
 * @returns {{ vertices: string[], adjacency: Map<string, string[]> }}
 * @throws {TypeError} If graph input is null, undefined, or malformed.
 */
export function normalizeGraph(input) {
  if (input === null || input === undefined) {
    throw new TypeError('Graph input cannot be null or undefined')
  }

  const verticesSet = new Set()
  const adjacency = new Map()

  const ensureVertex = (v) => {
    const key = String(v)
    verticesSet.add(key)
    if (!adjacency.has(key)) {
      adjacency.set(key, [])
    }
    return key
  }

  const addEdge = (from, to) => {
    const u = ensureVertex(from)
    const v = ensureVertex(to)
    adjacency.get(u).push(v)
  }

  if (Array.isArray(input)) {
    // Array of edges: [['A', 'B']] or [{ from: 'A', to: 'B' }]
    for (let i = 0; i < input.length; i++) {
      const item = input[i]
      if (Array.isArray(item) && item.length >= 2) {
        addEdge(item[0], item[1])
      } else if (typeof item === 'object' && item !== null && 'from' in item && 'to' in item) {
        addEdge(item.from, item.to)
      } else if (typeof item === 'string' || typeof item === 'number') {
        ensureVertex(item)
      } else {
        throw new TypeError(`Invalid edge descriptor at index ${i}: ${JSON.stringify(item)}`)
      }
    }
  } else if (input instanceof Map) {
    for (const [key, neighbors] of input.entries()) {
      ensureVertex(key)
      if (Array.isArray(neighbors)) {
        for (const n of neighbors) {
          addEdge(key, n)
        }
      }
    }
  } else if (typeof input === 'object') {
    if (Array.isArray(input.vertices) || Array.isArray(input.edges)) {
      // Graph descriptor { vertices, edges }
      if (Array.isArray(input.vertices)) {
        for (const v of input.vertices) {
          ensureVertex(v)
        }
      }
      if (Array.isArray(input.edges)) {
        for (const edge of input.edges) {
          if (Array.isArray(edge) && edge.length >= 2) {
            addEdge(edge[0], edge[1])
          } else if (typeof edge === 'object' && edge !== null && 'from' in edge && 'to' in edge) {
            addEdge(edge.from, edge.to)
          }
        }
      }
    } else {
      // Plain adjacency object { A: ['B', 'C'], B: [] }
      for (const [key, neighbors] of Object.entries(input)) {
        ensureVertex(key)
        if (Array.isArray(neighbors)) {
          for (const n of neighbors) {
            addEdge(key, n)
          }
        } else if (neighbors !== null && neighbors !== undefined) {
          addEdge(key, neighbors)
        }
      }
    }
  } else {
    throw new TypeError(`Unsupported graph input type: ${typeof input}`)
  }

  const vertices = Array.from(verticesSet).sort()
  // Sort adjacency lists for determinism
  for (const [k, list] of adjacency.entries()) {
    adjacency.set(k, [...list].sort())
  }

  return { vertices, adjacency }
}

/**
 * Creates an immutable frozen step object for visualizer/trace consumption.
 *
 * @param {Object} stepData - Step payload.
 * @returns {Readonly<Object>} Frozen step object.
 */
function createFrozenStep(stepData) {
  const step = {
    ...stepData,
    queue: Object.freeze([...(stepData.queue || [])]),
    order: Object.freeze([...(stepData.order || [])]),
    inDegree: Object.freeze({ ...(stepData.inDegree || {}) }),
    variables: Object.freeze({ ...(stepData.variables || {}) }),
  }
  return Object.freeze(step)
}

/**
 * Executes Kahn's Algorithm on a directed graph.
 *
 * @param {*} graphInput - Graph representation (adjacency object, edge list, or { vertices, edges }).
 * @param {Object} [options={}] - Configuration options.
 * @param {boolean} [options.throwOnCycle=false] - Whether to throw RangeError if a cycle is detected.
 * @param {boolean} [options.recordTrace=true] - Whether to record step snapshots.
 * @param {number} [options.stepDuration=0] - Explicit duration in ms for each step.
 * @param {string|Function} [options.tieBreaker='alphabetical'] - Tie-breaking strategy for queue order.
 * @returns {{
 *   success: boolean,
 *   hasCycle: boolean,
 *   order: Array<string> | null,
 *   unprocessed: Array<string>,
 *   steps: Array<Readonly<Object>>,
 *   inDegree: Object,
 *   message: string
 * }} Topological sort execution result.
 */
export function topologicalSortKahn(graphInput, options = {}) {
  const {
    throwOnCycle = false,
    recordTrace = true,
    stepDuration = 0,
    tieBreaker = 'alphabetical',
  } = options

  const { vertices, adjacency } = normalizeGraph(graphInput)
  const steps = []
  let stepIndex = 0

  // 1. Calculate in-degree of every vertex
  const inDegree = {}
  for (const v of vertices) {
    inDegree[v] = 0
  }

  for (const [, neighbors] of adjacency.entries()) {
    for (const v of neighbors) {
      inDegree[v] = (inDegree[v] || 0) + 1
    }
  }

  // 2. Identify all vertices with zero in-degree
  const queue = []
  for (const v of vertices) {
    if (inDegree[v] === 0) {
      queue.push(v)
    }
  }

  // Deterministic tie-breaking on initial 0 in-degree vertices
  if (typeof tieBreaker === 'function') {
    queue.sort(tieBreaker)
  } else if (tieBreaker === 'alphabetical') {
    queue.sort()
  }

  const order = []

  if (recordTrace) {
    steps.push(
      createFrozenStep({
        stepIndex: stepIndex++,
        type: 'init',
        lineKey: 'init',
        currentVertex: null,
        queue,
        inDegree,
        order,
        message: `Initialized in-degrees for ${vertices.length} vertices. Found ${queue.length} vertex/vertices with in-degree 0: [${queue.join(', ')}].`,
        variables: { queue: [...queue], inDegree: { ...inDegree }, order: [] },
        duration: stepDuration,
      })
    )
  }

  // 3. Process the queue
  while (queue.length > 0) {
    const u = queue.shift()
    order.push(u)

    if (recordTrace) {
      steps.push(
        createFrozenStep({
          stepIndex: stepIndex++,
          type: 'dequeue',
          lineKey: 'dequeue',
          currentVertex: u,
          queue,
          inDegree,
          order,
          message: `Dequeued vertex "${u}" with in-degree 0. Added to topological ordering. Current order: [${order.join(', ')}].`,
          variables: { currentVertex: u, queue: [...queue], inDegree: { ...inDegree }, order: [...order] },
          duration: stepDuration,
        })
      )
    }

    // Process outgoing edges u -> v
    const outgoing = adjacency.get(u) || []
    const newlyEligible = []

    for (const v of outgoing) {
      inDegree[v] -= 1

      if (recordTrace) {
        steps.push(
          createFrozenStep({
            stepIndex: stepIndex++,
            type: 'decrement',
            lineKey: 'decrement',
            currentVertex: u,
            neighbor: v,
            queue,
            inDegree,
            order,
            message: `Decremented in-degree of neighbor "${v}" to ${inDegree[v]}.`,
            variables: { currentVertex: u, neighbor: v, queue: [...queue], inDegree: { ...inDegree }, order: [...order] },
            duration: stepDuration,
          })
        )
      }

      if (inDegree[v] === 0) {
        newlyEligible.push(v)
      }
    }

    if (newlyEligible.length > 0) {
      if (typeof tieBreaker === 'function') {
        newlyEligible.sort(tieBreaker)
      } else if (tieBreaker === 'alphabetical') {
        newlyEligible.sort()
      }

      for (const v of newlyEligible) {
        queue.push(v)
        if (recordTrace) {
          steps.push(
            createFrozenStep({
              stepIndex: stepIndex++,
              type: 'enqueue',
              lineKey: 'enqueue',
              currentVertex: u,
              neighbor: v,
              queue,
              inDegree,
              order,
              message: `In-degree of "${v}" reached 0. Added "${v}" to queue.`,
              variables: { currentVertex: u, neighbor: v, queue: [...queue], inDegree: { ...inDegree }, order: [...order] },
              duration: stepDuration,
            })
          )
        }
      }
    }
  }

  // 4. Verify whether all vertices were processed (Cycle Detection)
  const hasCycle = order.length < vertices.length

  if (hasCycle) {
    const unprocessed = vertices.filter((v) => !order.includes(v))
    const errorMsg = `Graph contains a cycle; no complete topological ordering exists. Unprocessed vertices: [${unprocessed.join(', ')}].`

    if (recordTrace) {
      steps.push(
        createFrozenStep({
          stepIndex: stepIndex++,
          type: 'cycle_detected',
          lineKey: 'cycle',
          currentVertex: null,
          queue,
          inDegree,
          order,
          unprocessed,
          message: errorMsg,
          variables: { queue: [], inDegree: { ...inDegree }, order: [...order], unprocessed },
          duration: stepDuration,
        })
      )
    }

    if (throwOnCycle) {
      throw new RangeError(errorMsg)
    }

    return {
      success: false,
      hasCycle: true,
      order: null, // Critical requirement: never return an incomplete claimed ordering as success
      unprocessed,
      steps,
      inDegree: { ...inDegree },
      message: errorMsg,
    }
  }

  if (recordTrace) {
    steps.push(
      createFrozenStep({
        stepIndex: stepIndex++,
        type: 'complete',
        lineKey: 'complete',
        currentVertex: null,
        queue,
        inDegree,
        order,
        unprocessed: [],
        message: `Topological ordering successfully found: [${order.join(', ')}].`,
        variables: { queue: [], inDegree: { ...inDegree }, order: [...order], unprocessed: [] },
        duration: stepDuration,
      })
    )
  }

  return {
    success: true,
    hasCycle: false,
    order: [...order],
    unprocessed: [],
    steps,
    inDegree: { ...inDegree },
    message: `Topological ordering: [${order.join(', ')}]`,
  }
}

/**
 * Validates whether a given sequence constitutes a mathematically correct
 * topological ordering for a graph.
 *
 * Checks:
 *  1. Ordering contains every vertex in the graph exactly once.
 *  2. For every directed edge u -> v, u appears before v in the ordering.
 *
 * @param {*} graphInput - Graph representation.
 * @param {Array<string>} order - Proposed topological ordering.
 * @returns {{ valid: boolean, error: string | null }} Validation result.
 */
export function verifyTopologicalOrdering(graphInput, order) {
  if (!Array.isArray(order)) {
    return { valid: false, error: 'Ordering must be an array' }
  }

  const { vertices, adjacency } = normalizeGraph(graphInput)

  // Check 1: Length and vertex set equivalence
  if (order.length !== vertices.length) {
    return {
      valid: false,
      error: `Length mismatch: order has ${order.length} vertices, graph has ${vertices.length}`,
    }
  }

  const position = new Map()
  for (let i = 0; i < order.length; i++) {
    const v = String(order[i])
    if (position.has(v)) {
      return { valid: false, error: `Duplicate vertex "${v}" found in ordering` }
    }
    position.set(v, i)
  }

  for (const v of vertices) {
    if (!position.has(v)) {
      return { valid: false, error: `Vertex "${v}" is missing from the ordering` }
    }
  }

  // Check 2: Precedence invariant for every directed edge u -> v
  for (const [u, neighbors] of adjacency.entries()) {
    const uPos = position.get(u)
    for (const v of neighbors) {
      const vPos = position.get(v)
      if (uPos >= vPos) {
        return {
          valid: false,
          error: `Edge precedence violated: edge (${u} -> ${v}) requires ${u} (index ${uPos}) to precede ${v} (index ${vPos})`,
        }
      }
    }
  }

  return { valid: true, error: null }
}

/**
 * Replays a recorded Kahn's algorithm execution trace and validates state transitions.
 *
 * @param {Array<Object>} steps - Array of recorded step snapshots.
 * @returns {{ valid: boolean, finalOrder: Array<string>|null, hasCycle: boolean, error: string|null }}
 */
export function replayTopologicalSortTrace(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return {
      valid: false,
      finalOrder: null,
      hasCycle: false,
      error: 'Trace must be a non-empty array of steps',
    }
  }

  const initialStep = steps[0]
  if (initialStep.type !== 'init') {
    return {
      valid: false,
      finalOrder: null,
      hasCycle: false,
      error: 'First step must have type "init"',
    }
  }

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i]
    if (s.stepIndex !== i) {
      return {
        valid: false,
        finalOrder: null,
        hasCycle: false,
        error: `Step sequence broken at index ${i}: stepIndex was ${s.stepIndex}`,
      }
    }
  }

  const finalStep = steps[steps.length - 1]
  if (finalStep.type === 'complete') {
    return {
      valid: true,
      finalOrder: [...finalStep.order],
      hasCycle: false,
      error: null,
    }
  } else if (finalStep.type === 'cycle_detected') {
    return {
      valid: true,
      finalOrder: null,
      hasCycle: true,
      error: null,
    }
  }

  return {
    valid: false,
    finalOrder: null,
    hasCycle: false,
    error: `Final step must be "complete" or "cycle_detected", received: "${finalStep.type}"`,
  }
}

export {
  topologicalSortKahn as default,
  topologicalSortKahn as kahnTopologicalSort,
}
