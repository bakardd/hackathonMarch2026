import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";

const STREAM_URL = "http://localhost:8765/stream";
const HEALTH_URL = "http://localhost:8765/health";

interface WebcamPanelProps {
  isActive: boolean;
}

export function WebcamPanel({ isActive }: WebcamPanelProps) {
  const [source, setSource] = useState<"service" | "browser" | "none">("none");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Decide source: prefer camera service MJPEG, fall back to browser webcam
  useEffect(() => {
    if (!isActive) { setSource("none"); return; }
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(1000) });
        if (!cancelled) setSource(res.ok ? "service" : "browser");
      } catch {
        if (!cancelled) setSource("browser");
      }
    }

    check();
    const interval = setInterval(check, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isActive]);

  // Start/stop browser webcam
  useEffect(() => {
    if (source !== "browser") {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setSource("none"));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [source]);

  if (!isActive || source === "none") {
    return (
      <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center min-h-[280px] gap-3">
        <Camera className="w-10 h-10 text-muted-fg" />
        <span className="text-sm text-muted-fg">
          {isActive ? "No camera available" : "Start a session to activate camera"}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden relative min-h-[280px] bg-black">
      {source === "service" ? (
        <img src={STREAM_URL} alt="Camera feed" className="w-full h-full min-h-[280px] object-cover" />
      ) : (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full min-h-[280px] object-cover" />
      )}

      {/* REC dot */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-400 text-[10px] font-bold tracking-wider">REC</span>
      </div>
    </div>
  );
}
