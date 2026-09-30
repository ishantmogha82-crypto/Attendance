// Simple euclidean-distance matcher over 128-d face-api.js descriptors.
// distance ~0 = identical face, distance ~1.0+ = very different face.
// We convert distance -> a 0..1 "confidence" for display purposes.

export function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * @param {Float32Array|number[]} queryDescriptor
 * @param {{id:string,name:string,descriptor:number[]}[]} knownStudents
 * @param {number} threshold - max distance to be considered a match (lower = stricter). Typical range 0.4-0.6.
 * @returns {{ student: object|null, distance: number, confidence: number, isMatch: boolean }}
 */
export function findBestMatch(queryDescriptor, knownStudents, threshold = 0.5) {
  let best = null;
  let bestDistance = Infinity;

  for (const student of knownStudents) {
    const distance = euclideanDistance(queryDescriptor, student.descriptor);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = student;
    }
  }

  const isMatch = best !== null && bestDistance <= threshold;
  const confidence = Math.max(0, Math.min(1, 1 - bestDistance / 1.0));

  return {
    student: isMatch ? best : null,
    distance: bestDistance,
    confidence,
    isMatch,
  };
}
