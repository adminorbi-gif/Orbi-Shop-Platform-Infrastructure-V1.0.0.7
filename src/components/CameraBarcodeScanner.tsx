import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, RefreshCw, X, AlertOctagon } from "lucide-react";

interface CameraBarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
  lang?: "en" | "sw";
}

export function CameraBarcodeScanner({ onScanSuccess, onClose, lang = "en" }: CameraBarcodeScannerProps) {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "camera-scanner-viewfinder";

  // Request cameras list and auto-start
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available, otherwise use first
          const backCamera = devices.find((device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("environment") ||
            device.label.toLowerCase().includes("rear")
          );
          const defaultDevId = backCamera ? backCamera.id : devices[0].id;
          setSelectedCameraId(defaultDevId);
          startScanner(defaultDevId);
        } else {
          setError(
            lang === "sw"
              ? "Hakuna kamera iliyopatikana kwenye kifaa hiki."
              : "No camera devices found on this device."
          );
        }
      })
      .catch((err) => {
        console.error("Error getting cameras", err);
        setError(
          lang === "sw"
            ? "Tafadhali ruhusu ufikiaji wa kamera ili kuchanganua bidhaa!"
            : "Please allow camera access permissions to begin scanning physical products!"
        );
      });

    return () => {
      // Clean up scanner on unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async (cameraId: string) => {
    setError("");
    setIsScanning(false);

    try {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } else {
        scannerRef.current = new Html5Qrcode(elementId);
      }

      setIsScanning(true);
      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: (width, height) => {
            // A long wide box for standard 1D barcodes
            const boxWidth = Math.min(width * 0.85, 340);
            const boxHeight = Math.min(height * 0.45, 180);
            return {
              width: boxWidth,
              height: boxHeight,
            };
          },
          aspectRatio: 1.777778, // 16:9 ratio
        },
        (decodedText) => {
          // Play a gentle successful scan beep sound
          try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.connect(gain);
            gain.connect(context.destination);
            osc.frequency.value = 1000;
            gain.gain.setValueAtTime(0.15, context.currentTime);
            osc.start();
            osc.stop(context.currentTime + 0.12);
          } catch (audioErr) {
            // ignore audio error gracefully
          }
          onScanSuccess(decodedText);
        },
        () => {
          // Silent scan failure logging to prevent spam
        }
      );
    } catch (err: any) {
      console.error("Scanner failed to start", err);
      setIsScanning(false);
      setError(
        lang === "sw"
          ? "Imeshindwa kuwasha kamera: " + (err.message || err)
          : "Failed to initialize camera: " + (err.message || err)
      );
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const devId = e.target.value;
    setSelectedCameraId(devId);
    startScanner(devId);
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl border border-slate-700 w-full max-w-md mx-auto">
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-amber-400">
          <Camera size={16} />
          {lang === "sw" ? "Skana ya Kamera Halisi" : "Active Camera Scanner"}
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-455 hover:text-white p-1 hover:bg-slate-700 rounded transition cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-4 space-y-4 text-left">
        {/* Instruction badge for using mobile devices */}
        <div className="bg-amber-950/80 border border-amber-900 rounded-xl p-3 text-[11px] leading-relaxed text-amber-200">
          <span className="font-bold text-amber-300 block mb-1">
            {lang === "sw" ? "💡 MAELEZO YA SKANI:" : "💡 MOBILE DISPATCH TIP:"}
          </span>
          {lang === "sw"
            ? "Kama unatumia kompyuta isiyo na kamera ya nyuma, unaweza kufungua tovuti hii kupitia SIMU yako kwa uzoefu bora zaidi wa kufanya skani ya lebo za barcode kwa autofocus."
            : "If using a laptop with front-only webcam, we highly recommend accessing this Admin panel on your MOBILE PHONE for a superior barcode scan experience using the rear camera with physical labels."}
        </div>

        {/* Viewfinder box container */}
        <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden border border-slate-805 shadow-inner">
          <div id={elementId} className="w-full h-full object-cover"></div>

          {/* Overlay viewfinder lines */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center z-10">
              {/* Laser line effect */}
              <div className="w-[80%] h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse"></div>
              {/* Corner brackets overlay */}
              <div className="absolute w-[85%] h-[50%] border-2 border-dashed border-amber-500/55 rounded-lg flex items-center justify-center">
                <span className="text-[9px] font-bold text-white/60 bg-black/75 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                  {lang === "sw" ? "WEKA BARCODE KWENYE MSTARI" : "ALIGN BARCODE WITHIN BOX"}
                </span>
              </div>
            </div>
          )}

          {!isScanning && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-950/90">
              <RefreshCw className="animate-spin text-amber-500 mb-2" size={24} />
              {lang === "sw" ? "Inapakia kamera..." : "Initializing camera feed..."}
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-xs bg-slate-950/95 gap-3 text-rose-200">
              <AlertOctagon className="text-rose-500" size={28} />
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => cameras.length > 0 ? startScanner(selectedCameraId) : onClose()}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg transition text-[11px]"
              >
                {lang === "sw" ? "Jaribu Tena" : "Retry Connection"}
              </button>
            </div>
          )}
        </div>

        {/* Camera Selector dropdown */}
        {cameras.length > 1 && (
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === "sw" ? "Chagua Kamera" : "Select Camera Source"}
            </label>
            <div className="relative">
              <select
                value={selectedCameraId}
                onChange={handleCameraChange}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500 transition"
              >
                {cameras.map((camera, i) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `${lang === "sw" ? "Camera" : "Camera"} ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
