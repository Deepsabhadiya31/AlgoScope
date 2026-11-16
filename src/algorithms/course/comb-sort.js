/**
 * Comb Sort — Pure Algorithm Module
 *
 * Comb Sort improves upon Bubble Sort by comparing elements separated by a
 * shrinking gap. The gap starts at the array length and is reduced by a
 * shrink factor (~1.3) each pass until it reaches 1, at which point the
 * algorithm performs a standard Bubble Sort pass to finalise ordering.
 *
 * Task ID  : R62-T048
 * Issue    : https://github.com/S-AI-Projects/AlgoScope/issues/48
 *
 * Concrete fixtures:
 *   combSort([3, 1, 2, 2])  => { sorted: [1, 2, 2, 3], success: true, ... }
 *   combSort(null)           => { sorted: null, success: false, error: '...' }
 *
 * @module comb-sort
 */

// ── Shrink factor (Lacey & Box, 1991) ────────────────────────────────
const SHRINK_FACTOR = 1.3

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Compute the next gap value.
 * The gap is floored after division and clamped to a minimum of 1.
 *
 * @param {number} currentGap
 * @returns {number}
 */
function nextGap(currentGap) {
  const g = Math.floor(currentGap / SHRINK_FACTOR)
  return g < 1 ? 1 : g
}

// ── Source strings (displayed to users) ──────────────────────────────

export const combSortSources = {
  javascript: {
    code: `function combSort(arr) {
  const n = arr.length;
  let gap = n;
  let sorted = false;

  while (!sorted) {
    gap = Math.floor(gap / 1.3);
    if (gap < 1) gap = 1;
    sorted = (gap === 1);

    for (let i = 0; i + gap < n; i++) {
      if (arr[i] > arr[i + gap]) {
        [arr[i], arr[i + gap]] = [arr[i + gap], arr[i]];
        sorted = false;
      }
    }
  }
  return arr;
}

// Concrete fixture:
// [3, 1, 2, 2] -> [1, 2, 2, 3]
const arr = [3, 1, 2, 2];
combSort(arr);
console.log(arr);`,
    lineMap: {
      function: 1,
      init_gap: 3,
      init_sorted: 4,
      while_loop: 6,
      shrink_gap: 7,
      clamp_gap: 8,
      check_gap_one: 9,
      inner_loop: 11,
      compare: 12,
      swap: 13,
      mark_unsorted: 14,
      complete: 18,
    },
  },
}

/**
 * Retrieve the source-code string for a given language.
 *
 * @param {string} [language='javascript']
 * @returns {{ code: string, lineMap: Object } | undefined}
 */
export function getCombSortSource(language = 'javascript') {
  return combSortSources[language] ?? combSortSources.javascript
}

/**
 * Map a semantic lineKey to the corresponding source-code line number.
 *
 * @param {string} [language='javascript']
 * @param {string} lineKey
 * @returns {number | undefined}
 */
export function resolveCombSortLine(language = 'javascript', lineKey) {
  if (!lineKey) return undefined
  const src = combSortSources[language] ?? combSortSources.javascript
  if (!src) return undefined
  return src.lineMap[lineKey]
}

// ── Pure algorithm ───────────────────────────────────────────────────

/**
 * Execute Comb Sort on a copy of the input array.
 *
 * @param {Array<number>} inputArray - Array of numbers to sort.
 * @returns {{
 *   sorted: Array<number> | null,
 *   success: boolean,
 *   error: string | null,
 *   gapProgression: number[],
 *   totalComparisons: number,
 *   totalSwaps: number
 * }}
 * @throws Never — errors are captured in the result object.
 */
export function combSort(inputArray) {
  // ── Validate input ──────────────────────────────────────────────
  if (inputArray === null || inputArray === undefined) {
    return {
      sorted: null,
      success: false,
      error: 'Input must be a non-null array',
      gapProgression: [],
      totalComparisons: 0,
      totalSwaps: 0,
    }
  }
  if (!Array.isArray(inputArray)) {
    return {
      sorted: null,
      success: false,
      error: `Expected an array, received ${typeof inputArray}`,
      gapProgression: [],
      totalComparisons: 0,
      totalSwaps: 0,
    }
  }
  for (let i = 0; i < inputArray.length; i++) {
    if (typeof inputArray[i] !== 'number' || Number.isNaN(inputArray[i])) {
      return {
        sorted: null,
        success: false,
        error: `Invalid element at index ${i}: expected a number`,
        gapProgression: [],
        totalComparisons: 0,
        totalSwaps: 0,
      }
    }
  }

  // ── Edge case: 0- or 1-element array ────────────────────────────
  if (inputArray.length <= 1) {
    return {
      sorted: [...inputArray],
      success: true,
      error: null,
      gapProgression: [inputArray.length],
      totalComparisons: 0,
      totalSwaps: 0,
    }
  }

  // ── Core Comb Sort ──────────────────────────────────────────────
  const arr = [...inputArray]
  const n = arr.length
  let gap = n
  let sorted = false
  const gapProgression = [gap]
  let totalComparisons = 0
  let totalSwaps = 0

  while (!sorted) {
    gap = nextGap(gap)
    gapProgression.push(gap)

    if (gap === 1) {
      sorted = true // tentatively sorted; any swap resets this
    }

    for (let i = 0; i + gap < n; i++) {
      totalComparisons++
      if (arr[i] > arr[i + gap]) {
        ;[arr[i], arr[i + gap]] = [arr[i + gap], arr[i]]
        totalSwaps++
        sorted = false
      }
    }
  }

  return {
    sorted: arr,
    success: true,
    error: null,
    gapProgression,
    totalComparisons,
    totalSwaps,
  }
}

// ── Replay step generator ────────────────────────────────────────────

/**
 * Generate an array of visualiser-compatible step frames for Comb Sort.
 *
 * Each step contains a snapshot of the array, the current gap, highlighted
 * indices, and a human-readable message.
 *
 * Concrete fixtures:
 *   [3, 1, 2, 2] -> [1, 2, 2, 3]  (duplicates handled)
 *   [1, 2, 3]    -> [1, 2, 3]     (already sorted)
 *   [3, 2, 1]    -> [1, 2, 3]     (reversed)
 *   []           -> []            (empty)
 *   [42]         -> [42]          (single element)
 *
 * @param {Array<number>} inputArray
 * @returns {Array<Object>} Replay step frames.
 */
export function generateCombSortSteps(inputArray = []) {
  const steps = []
  const input = Array.isArray(inputArray) ? inputArray : []

  // ── Validation gate ─────────────────────────────────────────────
  if (!Array.isArray(inputArray)) {
    steps.push({
      lineKey: 'function',
      type: 'error',
      array: [],
      indices: [],
      sortedIndices: [],
      message: `Error: expected an array, received ${typeof inputArray}`,
      variables: { error: true },
    })
    return steps
  }

  const arr = [...input]
  const n = arr.length

  // ── Start step ──────────────────────────────────────────────────
  steps.push({
    lineKey: 'function',
    type: 'start',
    array: [...arr],
    indices: [],
    sortedIndices: [],
    message: `Starting Comb Sort on array of length ${n}`,
    variables: { n },
  })

  if (n <= 1) {
    steps.push({
      lineKey: 'complete',
      type: 'complete',
      array: [...arr],
      indices: [],
      sortedIndices: Array.from({ length: n }, (_, i) => i),
      message: n === 0 ? 'Empty array — nothing to sort' : 'Single element — already sorted',
      variables: { n, gap: n, swaps: 0 },
    })
    return steps
  }

  let gap = n
  let sorted = false
  let passNumber = 0

  // ── Init gap step ───────────────────────────────────────────────
  steps.push({
    lineKey: 'init_gap',
    type: 'init',
    array: [...arr],
    indices: [],
    sortedIndices: [],
    message: `Initial gap = ${gap}`,
    variables: { gap, sorted: false },
  })

  while (!sorted) {
    gap = nextGap(gap)
    if (gap === 1) sorted = true
    passNumber++

    // ── Gap shrink step ─────────────────────────────────────────
    steps.push({
      lineKey: 'shrink_gap',
      type: 'gap',
      array: [...arr],
      indices: [],
      sortedIndices: [],
      message: `Pass ${passNumber}: gap shrunk to ${gap}`,
      variables: { gap, pass: passNumber },
    })

    for (let i = 0; i + gap < n; i++) {
      // ── Compare step ────────────────────────────────────────
      steps.push({
        lineKey: 'compare',
        type: 'compare',
        array: [...arr],
        indices: [i, i + gap],
        sortedIndices: [],
        message: `Compare arr[${i}]=${arr[i]} with arr[${i + gap}]=${arr[i + gap]} (gap=${gap})`,
        variables: { i, gap, left: arr[i], right: arr[i + gap] },
      })

      if (arr[i] > arr[i + gap]) {
        ;[arr[i], arr[i + gap]] = [arr[i + gap], arr[i]]
        sorted = false

        // ── Swap step ───────────────────────────────────────
        steps.push({
          lineKey: 'swap',
          type: 'swap',
          array: [...arr],
          indices: [i, i + gap],
          sortedIndices: [],
          message: `Swap arr[${i}] and arr[${i + gap}] → [${arr.join(', ')}]`,
          variables: { i, gap, swapped: true },
        })
      }
    }
  }

  // ── Completion step ─────────────────────────────────────────────
  steps.push({
    lineKey: 'complete',
    type: 'complete',
    array: [...arr],
    indices: [],
    sortedIndices: Array.from({ length: n }, (_, i) => i),
    message: `Comb Sort complete: [${arr.join(', ')}]`,
    variables: { gap, passes: passNumber },
  })

  return steps
}
