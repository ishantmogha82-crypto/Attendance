import { useEffect, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "/models";
let loadingPromise = null;

/**
 * Loads the tiny face detector + landmark + recognition nets once and
 * shares the promise across every component that needs them.
 */
export function useFaceModels() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!loadingPromise) {
      loadingPromise = Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
    }

    loadingPromise
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            "AI model failed to load. Make sure the model files are placed in client/public/models (see README)."
          );
          console.error(err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error };
}

export { faceapi };
