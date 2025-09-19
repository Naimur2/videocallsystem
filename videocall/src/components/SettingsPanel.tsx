"use client";

import { Camera, Mic, Settings as SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface SettingsPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

interface DeviceInfo {
  deviceId: string;
  label: string;
}

export function SettingsPanel({ isVisible, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<"audio" | "video" | "general">(
    "audio"
  );
  const [audioDevices, setAudioDevices] = useState<DeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<DeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<DeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedOutputDevice, setSelectedOutputDevice] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState(50);
  const [videoQuality, setVideoQuality] = useState("hd");

  const loadDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();

      const audioInputs = devices.filter(
        (device) => device.kind === "audioinput"
      );
      const videoInputs = devices.filter(
        (device) => device.kind === "videoinput"
      );
      const audioOutputs = devices.filter(
        (device) => device.kind === "audiooutput"
      );

      setAudioDevices(
        audioInputs.map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 5)}`,
        }))
      );
      setVideoDevices(
        videoInputs.map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 5)}`,
        }))
      );
      setOutputDevices(
        audioOutputs.map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${d.deviceId.slice(0, 5)}`,
        }))
      );

      if (audioInputs.length > 0 && !selectedAudioDevice)
        setSelectedAudioDevice(audioInputs[0].deviceId);
      if (videoInputs.length > 0 && !selectedVideoDevice)
        setSelectedVideoDevice(videoInputs[0].deviceId);
      if (audioOutputs.length > 0 && !selectedOutputDevice)
        setSelectedOutputDevice(audioOutputs[0].deviceId);
    } catch (error) {
      console.error("Error loading devices:", error);
    }
  }, [selectedAudioDevice, selectedVideoDevice, selectedOutputDevice]);

  useEffect(() => {
    if (isVisible) {
      loadDevices();
    }
  }, [isVisible, loadDevices]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 w-full max-w-4xl max-h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SettingsIcon className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-semibold text-white">Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors text-xl"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 p-4 border-r border-gray-700">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("audio")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === "audio"
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                  <span>Audio</span>
                </button>
                <button
                  onClick={() => setActiveTab("video")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === "video"
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  <span>Video</span>
                </button>
                <button
                  onClick={() => setActiveTab("general")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === "general"
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <SettingsIcon className="w-5 h-5" />
                  <span>General</span>
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === "audio" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Audio Settings
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Microphone
                        </label>
                        <select
                          value={selectedAudioDevice}
                          onChange={(e) =>
                            setSelectedAudioDevice(e.target.value)
                          }
                          className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                        >
                          {audioDevices.map((device) => (
                            <option
                              key={device.deviceId}
                              value={device.deviceId}
                            >
                              {device.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Speaker
                        </label>
                        <select
                          value={selectedOutputDevice}
                          onChange={(e) =>
                            setSelectedOutputDevice(e.target.value)
                          }
                          className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                        >
                          {outputDevices.map((device) => (
                            <option
                              key={device.deviceId}
                              value={device.deviceId}
                            >
                              {device.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Microphone Volume
                        </label>
                        <div className="flex items-center space-x-4">
                          <Mic className="w-5 h-5 text-gray-400" />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={audioLevel}
                            onChange={(e) =>
                              setAudioLevel(parseInt(e.target.value))
                            }
                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="text-white text-sm w-12">
                            {audioLevel}%
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <h4 className="text-white font-medium mb-2">
                          Test your microphone
                        </h4>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                          Start test
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "video" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Video Settings
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Camera
                        </label>
                        <select
                          value={selectedVideoDevice}
                          onChange={(e) =>
                            setSelectedVideoDevice(e.target.value)
                          }
                          className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                        >
                          {videoDevices.map((device) => (
                            <option
                              key={device.deviceId}
                              value={device.deviceId}
                            >
                              {device.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Video Quality
                        </label>
                        <select
                          value={videoQuality}
                          onChange={(e) => setVideoQuality(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="sd">Standard Definition (480p)</option>
                          <option value="hd">High Definition (720p)</option>
                          <option value="fhd">Full HD (1080p)</option>
                        </select>
                      </div>

                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <h4 className="text-white font-medium mb-2">
                          Camera Preview
                        </h4>
                        <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
                          <Camera className="w-12 h-12 text-gray-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "general" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      General Settings
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <div className="text-white font-medium">
                            Enable noise cancellation
                          </div>
                          <div className="text-gray-400 text-sm">
                            Reduce background noise during calls
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div>
                          <div className="text-white font-medium">
                            Auto-adjust camera brightness
                          </div>
                          <div className="text-gray-400 text-sm">
                            Automatically adjust for lighting conditions
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div>
                          <div className="text-white font-medium">
                            Show bandwidth usage
                          </div>
                          <div className="text-gray-400 text-sm">
                            Display network statistics
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
