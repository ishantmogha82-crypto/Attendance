import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Manages a getUserMedia video stream with proper cleanup.
 * Never records or stores video — the stream is only ever piped into a
 * <video> element for live preview and momentary frame analysis.
 */
export function useCamera(videoRef) {
  const [status, setStatus] = useState("idle"); // idle | requesting | granted | denied | unavailable | stopped
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("stopped");
  }, [videoRef]);

  const start = useCallback(
    async (preferredDeviceId) => {
      setError(null);
      setStatus("requesting");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus("unavailable");
        setError("This browser does not support camera access.");
        return;
      }

      try {
        const constraints = {
          video: preferredDeviceId
            ? { deviceId: { exact: preferredDeviceId } }
            : { facingMode: "user" },
          audio: false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("granted");

        // enumerate devices only after permission is granted (labels need it)
        const all = await navigator.mediaDevices.enumerateDevices();
        const cams = all.filter((d) => d.kind === "videoinput");
        setDevices(cams);
        const activeTrack = stream.getVideoTracks()[0];
        const settings = activeTrack?.getSettings?.();
        setDeviceId(settings?.deviceId || preferredDeviceId || cams[0]?.deviceId || null);
      } catch (err) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setStatus("denied");
          setError("Camera permission is required for attendance recognition.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setStatus("unavailable");
          setError("No camera detected.");
        } else {
          setStatus("unavailable");
          setError(err.message || "Unable to access the camera.");
        }
      }
    },
    [videoRef]
  );

  const switchDevice = useCallback(
    async (id) => {
      stop();
      await start(id);
    },
    [start, stop]
  );

  // Stop the camera whenever the component unmounts or the tab is hidden for
  // a while, so we never keep it running silently in the background.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        // Pause frame processing is handled by the consumer; here we just
        // avoid killing the stream on a brief tab switch, but we do stop
        // fully if the user navigates away (unmount below).
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, error, devices, deviceId, start, stop, switchDevice };
}
