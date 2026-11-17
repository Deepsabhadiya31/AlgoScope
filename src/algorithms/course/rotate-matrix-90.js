/**
 * Rotate Matrix 90° Clockwise — Focused Pure Algorithm Module & Complexity Experiment
 *
 * Implements a pure, deterministic algorithm for rotating an N x N square matrix
 * 90 degrees clockwise without mutating the input matrix.
 *
 * Mathematical Transformation:
 *   For an N x N matrix, the element at row r and column c (0 <= r, c < N)
 *   moves to row c and column (N - 1 - r) in the rotated matrix:
 *     rotated[c][N - 1 - r] = matrix[r][c]
 *
 * Four-Rotation Invariant:
 *   Rotating any square matrix 90° clockwise four times consecutively
 *   recovers the original matrix identically:
 *     R^4(M) = M
 *
 * Task ID  : R62-T049
 * Issue    : https://github.com/S-AI-Projects/AlgoScope/issues/49
 *
 * @module rotate-matrix-90
 */

import { createStep } from '../../lib/utils.js'

// ── Validation Helper ────────────────────────────────────────────────────────

/**
 * Validates that an input is a valid 2D square matrix (N x N).
 *
 * @param {any} matrix - Matrix candidate to validate.
 * @throws {TypeError} If matrix is null, undefined, not an array, or rows are not arrays.
 * @throws {Error} If matrix is not square (jagged or rectangular).
 */
export function validateSquareMatrix(matrix) {
  if (matrix === null || matrix === undefined || !Array.isArray(matrix)) {
    throw new TypeError('Input must be a 2D square matrix array')
  }

  const n = matrix.length
  if (n === 0) return

  for (let r = 0; r < n; r++) {
    if (!Array.isArray(matrix[r])) {
      throw new TypeError(`Row at index ${r} must be an array`)
    }
    if (matrix[r].length !== n) {
      throw new Error(
        `Matrix must be square (N x N); row ${r} has length ${matrix[r].length}, expected ${n}`
      )
    }
  }
}

// ── Pure Algorithm ───────────────────────────────────────────────────────────

/**
 * Rotates an N x N square matrix 90 degrees clockwise.
 * Pure function: creates and returns a new matrix without mutating the input.
 *
 * Concrete example:
 *   Input:  [[1, 2], [3, 4]]
 *   Output: [[3, 1], [4, 2]]
 *
 * @param {Array<Array<any>>} matrix - Square matrix to rotate.
 * @returns {Array<Array<any>>} New rotated square matrix.
 * @throws {TypeError|Error} If input is invalid or non-square.
 */
export function rotateMatrix90(matrix) {
  validateSquareMatrix(matrix)

  const n = matrix.length
  if (n === 0) return []

  const rotated = Array.from({ length: n }, () => new Array(n))

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      rotated[c][n - 1 - r] = matrix[r][c]
    }
  }

  return rotated
}

// ── Complexity Experiment & Metrics ──────────────────────────────────────────

/**
 * Executes 90-degree matrix rotation while recording deterministic operation metrics.
 *
 * Operation Count Definition:
 *   - Primary Metric (Element Placements): Every cell (r, c) is mapped to its rotated
 *     coordinates (c, N - 1 - r) and assigned to the destination matrix.
 *     For an N x N matrix, exactly N * N = N^2 element placements occur.
 *   - Coordinate Calculations: Exactly N * N = N^2 index computations (N - 1 - r).
 *   - Total Operations: placements + index calculations = 2 * N^2.
 *
 * @param {Array<Array<any>>} matrix - Square matrix to rotate.
 * @returns {{
 *   rotated: Array<Array<any>>,
 *   metrics: {
 *     dimension: number,
 *     totalElements: number,
 *     elementPlacements: number,
 *     coordinateCalculations: number,
 *     totalOperations: number,
 *     operationDefinition: string
 *   }
 * }}
 */
export function rotateMatrix90WithMetrics(matrix) {
  validateSquareMatrix(matrix)

  const n = matrix.length
  if (n === 0) {
    return {
      rotated: [],
      metrics: {
        dimension: 0,
        totalElements: 0,
        elementPlacements: 0,
        coordinateCalculations: 0,
        totalOperations: 0,
        operationDefinition:
          'Each matrix cell requires 1 coordinate calculation (c, N - 1 - r) and 1 element placement assignment.',
      },
    }
  }

  const rotated = Array.from({ length: n }, () => new Array(n))
  let elementPlacements = 0
  let coordinateCalculations = 0

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const targetCol = n - 1 - r
      coordinateCalculations++

      rotated[c][targetCol] = matrix[r][c]
      elementPlacements++
    }
  }

  return {
    rotated,
    metrics: {
      dimension: n,
      totalElements: n * n,
      elementPlacements,
      coordinateCalculations,
      totalOperations: elementPlacements + coordinateCalculations,
      operationDefinition:
        'Each matrix cell requires 1 coordinate calculation (c, N - 1 - r) and 1 element placement assignment into the rotated grid.',
    },
  }
}

// ── Source Strings & Line Mapping ────────────────────────────────────────────

export const matrixRotationSources = {
  javascript: {
    code: `function rotateMatrix90(matrix) {
  const n = matrix.length;
  const rotated = Array.from({ length: n }, () => new Array(n));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      rotated[c][n - 1 - r] = matrix[r][c];
    }
  }
  return rotated;
}

// Concrete fixture:
// [[1, 2], [3, 4]] -> [[3, 1], [4, 2]]
const matrix = [
  [1, 2],
  [3, 4]
];
const result = rotateMatrix90(matrix);
console.log(result);`,
    lineMap: {
      function: 1,
      setup: 2,
      alloc: 3,
      outerLoop: 4,
      innerLoop: 5,
      place: 6,
      returnResult: 9,
      complete: 9,
    },
  },
}

/**
 * Retrieves the source code string for matrix rotation.
 *
 * @param {string} [language='javascript']
 * @returns {{ code: string, lineMap: Object }}
 */
export function getMatrixRotationSource(language = 'javascript') {
  return matrixRotationSources[language] ?? matrixRotationSources.javascript
}

/**
 * Resolves a semantic action key to the corresponding source line number.
 *
 * @param {string} [language='javascript']
 * @param {string} lineKey
 * @returns {number | undefined}
 */
export function resolveMatrixRotationLine(language = 'javascript', lineKey) {
  if (!lineKey) return undefined
  const src = matrixRotationSources[language] ?? matrixRotationSources.javascript
  if (!src) return undefined
  return src.lineMap[lineKey]
}

// ── Visualizer Step Generator ────────────────────────────────────────────────

/**
 * Generates structured replay step frames for matrix rotation.
 * Follows AlgoScope's visualizer step schema.
 *
 * @param {Array<Array<any>>} matrix - Square matrix to rotate.
 * @returns {Array<Object>} Sequence of visualizer step frames.
 */
export function generateMatrixRotationSteps(matrix) {
  const steps = []

  // Check validation
  try {
    validateSquareMatrix(matrix)
  } catch (err) {
    steps.push(
      createStep({
        lineKey: 'function',
        type: 'error',
        array: [],
        message: `Validation Error: ${err.message}`,
        variables: { error: true, message: err.message },
      })
    )
    return steps
  }

  const n = matrix.length
  if (n === 0) {
    steps.push(
      createStep({
        lineKey: 'complete',
        type: 'complete',
        array: [],
        message: 'Empty matrix (0x0): nothing to rotate',
        variables: { n: 0, stepsCount: 0 },
      })
    )
    return steps
  }

  // 1. Start Step
  steps.push(
    createStep({
      lineKey: 'function',
      type: 'start',
      array: matrix.flat(),
      indices: [],
      message: `Starting 90° clockwise rotation on ${n}x${n} square matrix`,
      variables: { n, currentStep: 'init' },
      matrix: matrix.map((row) => [...row]),
    })
  )

  // 2. Allocation Step
  const inProgress = Array.from({ length: n }, () => new Array(n).fill(null))
  steps.push(
    createStep({
      lineKey: 'alloc',
      type: 'alloc',
      array: inProgress.flat(),
      indices: [],
      message: `Allocated new ${n}x${n} target grid for rotated elements`,
      variables: { n, currentStep: 'alloc' },
      matrix: inProgress.map((row) => [...row]),
    })
  )

  // 3. Element Placement Steps
  let placementCount = 0
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const targetRow = c
      const targetCol = n - 1 - r
      const val = matrix[r][c]
      inProgress[targetRow][targetCol] = val
      placementCount++

      steps.push(
        createStep({
          lineKey: 'place',
          type: 'place',
          array: inProgress.flat(),
          indices: [r * n + c, targetRow * n + targetCol],
          message: `Cell [${r}, ${c}] (${val}) -> rotated to [${targetRow}, ${targetCol}]`,
          variables: {
            sourceRow: r,
            sourceCol: c,
            targetRow,
            targetCol,
            value: val,
            placementCount,
          },
          matrix: inProgress.map((row) => [...row]),
        })
      )
    }
  }

  // 4. Complete Step
  steps.push(
    createStep({
      lineKey: 'complete',
      type: 'complete',
      array: inProgress.flat(),
      indices: Array.from({ length: n * n }, (_, idx) => idx),
      sortedIndices: Array.from({ length: n * n }, (_, idx) => idx),
      message: `Rotation complete: ${n}x${n} matrix successfully rotated 90° clockwise in ${placementCount} element placements`,
      variables: {
        n,
        totalPlacements: placementCount,
        completed: true,
      },
      matrix: inProgress.map((row) => [...row]),
    })
  )

  return steps
}
