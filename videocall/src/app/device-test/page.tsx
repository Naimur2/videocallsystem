"use client";

import { useEffect, useState } from "react";

export default function DeviceTest() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get available devices
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        console.log("Available devices:", devices);
        setDevices(devices);
      })
      .catch(err => setError(err.message));
  }, []);

  const testCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error("Camera test failed:", err);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Device Test</h1>
      
      <div className="mb-6">
        <button 
          onClick={testCamera}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Test Camera & Microphone
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {stream && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Camera Preview</h2>
          <video 
            ref={(video) => {
              if (video && stream) {
                video.srcObject = stream;
                video.play();
              }
            }}
            autoPlay 
            muted 
            className="border rounded w-96 h-72"
          />
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-2">Available Devices</h2>
        <div className="space-y-2">
          {devices.map((device, index) => (
            <div key={index} className="p-3 border rounded">
              <div><strong>Type:</strong> {device.kind}</div>
              <div><strong>Label:</strong> {device.label || "Unknown"}</div>
              <div><strong>ID:</strong> {device.deviceId.slice(0, 20)}...</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
