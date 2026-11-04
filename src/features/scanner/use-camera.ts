"use client";

import { useEffect, useRef, useState } from "react";
import { SCANNER } from "@/config/scanner";
import { isValidGtin } from "./gtin";

export type CameraState = "starting" | "on" | "denied" | "unavailable";

type TorchCaps = MediaTrackCapabilities & { torch?: boolean };

/** La page est-elle à l'écran ? (caméra coupée quand l'app passe en arrière-plan) */
function useVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return visible;
}

/**
 * Caméra arrière + lecture des codes-barres.
 * Les images restent dans le téléphone : elles ne servent qu'à lire le code (lecteur ZXing en WebAssembly,
 * servi par l'app, donc aussi hors ligne). Rien n'est enregistré ni envoyé.
 * `onCode` reçoit chaque code valable lu ; la page décide quoi en faire.
 */
export function useBarcodeCamera(onCode: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const onCodeRef = useRef(onCode);
  const [state, setState] = useState<CameraState>("starting");
  const [torch, setTorch] = useState({ supported: false, on: false });
  const visible = useVisible();

  useEffect(() => {
    onCodeRef.current = onCode;
  });

  useEffect(() => {
    if (!visible) return;
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) return setState("unavailable");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: SCANNER.idealWidth } },
        });
      } catch (e) {
        const name = e instanceof DOMException ? e.name : "";
        if (!stopped) setState(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
        return;
      }
      const video = videoRef.current;
      if (stopped || !video) return stream.getTracks().forEach((t) => t.stop());
      video.srcObject = stream;
      await video.play().catch(() => {});
      const track = stream.getVideoTracks()[0];
      trackRef.current = track;
      setTorch({ supported: !!(track.getCapabilities?.() as TorchCaps | undefined)?.torch, on: false });
      setState("on");

      const { BarcodeDetector, prepareZXingModule } = await import("barcode-detector/ponyfill");
      // Le fichier .wasm vient de l'app (public/zxing), pas d'un CDN : la lecture marche sans réseau.
      prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? SCANNER.wasmUrl : prefix + path) } });
      const detector = new BarcodeDetector({ formats: [...SCANNER.formats] });
      const tick = async () => {
        if (stopped) return;
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          try {
            const hit = (await detector.detect(video)).map((c) => c.rawValue).find(isValidGtin);
            if (hit && !stopped) onCodeRef.current(hit);
          } catch {
            // Image illisible : on réessaie au tour suivant.
          }
        }
        timer = setTimeout(tick, SCANNER.intervalMs);
      };
      void tick();
    };
    void start();

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
      trackRef.current = null;
    };
  }, [visible]);

  const toggleTorch = async () => {
    const track = trackRef.current;
    if (!track || !torch.supported) return;
    const on = !torch.on;
    try {
      await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
      setTorch({ supported: true, on });
    } catch {
      setTorch({ supported: false, on: false });
    }
  };

  return { videoRef, state, torch, toggleTorch };
}
