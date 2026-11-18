const clamp = (value) => Math.max(0, Math.min(1, value));

/** @param {number} progress @param {{anchor: number[], offset: number[], window: number[]}} part */
export function anchorAt(progress, { anchor, offset, window: [start, end] }) {
  const local = clamp((progress - start) / (end - start));
  return anchor.map((position, index) => position + local * offset[index]);
}

/** @param {number} from @param {number} to @param {number} ratio */
export function interpolatedProgress(from, to, ratio) {
  const elapsed = clamp(ratio);
  const eased = elapsed * elapsed * (3 - 2 * elapsed);
  return from + (to - from) * eased;
}

/** @param {number} progress @param {string | null} selection @param {number | null} goal */
export function assemblyMode(progress, selection, goal) {
  if (goal !== null) return goal > progress ? 'exploding' : 'reassembling';
  if (selection) return 'focusing';
  return progress === 0 ? 'assembled' : 'exploded';
}

/** @param {number[]} center @param {number[]} size @param {number} aspect */
export function frameAssembly(center, size, aspect) {
  // Include the depth rotated into the screen's horizontal axis.
  const width = Math.hypot(size[0], size[2]);
  const fov = 38;
  const radius = Math.max(size[1], width / Math.max(aspect, .5)) /
    (2 * Math.tan(fov * Math.PI / 360)) * 1.41 + size[2] / 2;
  return { center, fov, radius };
}
