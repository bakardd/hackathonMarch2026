import { useRef, useEffect, useState } from "react";
import { Camera, ChevronDown } from "lucide-react";

type CameraMode = "face" | "body";

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
  const [cameraMode, setCameraMode] = useState<CameraMode>("face");
  const [hasCamera, setHasCamera] = useState(true);
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [showDevicePicker, setShowDevicePicker] = useState(false);

  // Enumerate video devices
  useEffect(() => {
    if (!isActive) return;

    async function enumerate() {
      try {
        // Need a stream first so labels are populated (browser security)
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        tempStream.getTracks().forEach((t) => t.stop());

        const videoDevices = allDevices
          .filter((d) => d.kind === "videoinput")
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${i + 1}`,
          }));

        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch {
        setDevices([]);
      }
    }

    enumerate();

    // Re-enumerate when devices change (plug/unplug)
    const handler = () => { enumerate(); };
    navigator.mediaDevices.addEventListener("devicechange", handler);
    return () => navigator.mediaDevices.removeEventListener("devicechange", handler);
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start camera stream when device or mode changes
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

        const videoConstraints: MediaTrackConstraints = selectedDeviceId
          ? {
              deviceId: { exact: selectedDeviceId },
              width: { ideal: cameraMode === "face" ? 640 : 1280 },
              height: { ideal: cameraMode === "face" ? 480 : 720 },
            }
          : {
              facingMode: cameraMode === "face" ? "user" : "environment",
              width: { ideal: cameraMode === "face" ? 640 : 1280 },
              height: { ideal: cameraMode === "face" ? 480 : 720 },
            };

        const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
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
  }, [isActive, cameraMode, selectedDeviceId]);

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
      {/* Camera mode toggle + device picker */}
      <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1">
        <div className="flex gap-1">
          <button
            onClick={() => setCameraMode("face")}
            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide transition-colors ${
              cameraMode === "face"
                ? "bg-primary text-primary-fg"
                : "bg-card/80 text-muted-fg hover:text-fg"
            }`}
          >
            FACE
          </button>
          <button
            onClick={() => setCameraMode("body")}
            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide transition-colors ${
              cameraMode === "body"
                ? "bg-primary text-primary-fg"
                : "bg-card/80 text-muted-fg hover:text-fg"
            }`}
          >
            BODY
          </button>
        </div>

        {/* Device source picker */}
        {devices.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowDevicePicker((p) => !p)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-card/90 backdrop-blur text-[10px] text-muted-fg hover:text-fg transition-colors border border-border"
            >
              <Camera className="w-3 h-3" />
              <span className="max-w-[100px] truncate">
                {devices.find((d) => d.deviceId === selectedDeviceId)?.label ?? "Select camera"}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showDevicePicker && (
              <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[180px] max-h-[200px] overflow-y-auto">
                {devices.map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => {
                      setSelectedDeviceId(device.deviceId);
                      setShowDevicePicker(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-white/5 transition-colors truncate ${
                      device.deviceId === selectedDeviceId ? "text-primary font-semibold" : "text-fg"
                    }`}
                  >
                    {device.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* REC indicator */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-400 text-[10px] font-bold tracking-wider">REC</span>
      </div>

      {/* Green corner brackets */}
      <div className="absolute inset-2 z-10 pointer-events-none">
        {/* Top-left */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl" />
        {/* Top-right */}
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr" />
        {/* Bottom-left */}
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl" />
        {/* Bottom-right */}
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
