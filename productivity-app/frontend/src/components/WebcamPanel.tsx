import { useRef, useEffect, useState } from "react";
import { Camera } from "lucide-react";

interface VideoDevice {
  deviceId: string;
  label: string;
}

interface WebcamPanelProps {
  isActive: boolean;
}

export function WebcamPanel({ isActive }: WebcamPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  // Enumerate video devices
  useEffect(() => {
    if (!isActive) return;

    async function enumerate() {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        tempStream.getTracks().forEach((t) => t.stop());

        const videoDevices = allDevices
          .filter((d) => d.kind === "videoinput")
          .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }));

        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch {
        setDevices([]);
      }
    }

    enumerate();
    const handler = () => enumerate();
    navigator.mediaDevices.addEventListener("devicechange", handler);
    return () => navigator.mediaDevices.removeEventListener("devicechange", handler);
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start camera stream when device changes
  useEffect(() => {
    if (!isActive) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }

    let cancelled = false;

    async function startCamera() {
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());

        const constraints: MediaTrackConstraints = selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : {};

        const stream = await navigator.mediaDevices.getUserMedia({ video: constraints });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setHasCamera(true);
      } catch {
        setHasCamera(false);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [isActive, selectedDeviceId]);

  if (!isActive) {
    return (
      <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center min-h-[220px] gap-3">
        <Camera className="w-10 h-10 text-muted-fg" />
        <span className="text-sm text-muted-fg">Start monitoring to activate webcam</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden relative min-h-[220px]">
      {/* Camera dropdown */}
      {devices.length > 1 && (
        <div className="absolute top-2 right-2 z-20">
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 backdrop-blur text-white border border-border cursor-pointer"
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* REC indicator */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-400 text-[10px] font-bold tracking-wider">REC</span>
      </div>

      {/* Corner brackets */}
      <div className="absolute inset-2 z-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br" />
      </div>

      {hasCamera ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full min-h-[220px] object-cover rounded-xl"
        />
      ) : (
        <div className="w-full min-h-[220px] flex flex-col items-center justify-center gap-2">
          <Camera className="w-10 h-10 text-muted-fg" />
          <span className="text-sm text-muted-fg">No camera available</span>
        </div>
      )}
    </div>
  );
}
