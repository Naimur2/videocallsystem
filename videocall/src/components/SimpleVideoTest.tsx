"use client";
import * as mediasoupClient from "mediasoup-client";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function SimpleVideoTest() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    const init = async () => {
      // Connect to simplified socket events
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3202");
      
      let device: mediasoupClient.Device;
      let sendTransport: mediasoupClient.types.Transport;
      let recvTransport: mediasoupClient.types.Transport;

      try {
        console.log("🚀 Starting simplified MediaSoup test...");

        // Step 1: Get RTP Capabilities (using simplified event)
        console.log("📋 Getting RTP capabilities...");
        const rtpCapabilities = await new Promise<any>((resolve, reject) => {
          socket.emit("getRtpCapabilities", (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          });
        });
        console.log("✅ RTP capabilities received");

        // Step 2: Create Device
        console.log("📱 Creating MediaSoup device...");
        device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities: rtpCapabilities });
        console.log("✅ Device loaded");

        // Step 3: Get local media
        console.log("🎥 Getting local media...");
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        console.log("✅ Local media obtained");

        // Step 4: Create Send Transport (for producing)
        console.log("🚛 Creating send transport...");
        const sendTransportInfo = await new Promise<any>((resolve, reject) => {
          socket.emit("createTransport", { producing: true }, (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          });
        });

        sendTransport = device.createSendTransport(sendTransportInfo);
        
        sendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
          socket.emit("connectTransport", { 
            transportId: sendTransport.id, 
            dtlsParameters 
          }, (result: any) => {
            if (result === "connected") {
              callback();
            } else {
              errback(new Error("Failed to connect"));
            }
          });
        });

        sendTransport.on("produce", (parameters, callback, errback) => {
          socket.emit("produce", {
            transportId: sendTransport.id,
            kind: parameters.kind,
            rtpParameters: parameters.rtpParameters
          }, (response: any) => {
            if (response.error) {
              errback(new Error(response.error));
            } else {
              callback({ id: response.id });
            }
          });
        });

        console.log("✅ Send transport created");

        // Step 5: Create Receive Transport (for consuming)
        console.log("🚛 Creating receive transport...");
        const recvTransportInfo = await new Promise<any>((resolve, reject) => {
          socket.emit("createTransport", { producing: false }, (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          });
        });

        recvTransport = device.createRecvTransport(recvTransportInfo);
        
        recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
          socket.emit("connectTransport", { 
            transportId: recvTransport.id, 
            dtlsParameters 
          }, (result: any) => {
            if (result === "connected") {
              callback();
            } else {
              errback(new Error("Failed to connect"));
            }
          });
        });

        console.log("✅ Receive transport created");

        // Step 6: Produce local media
        console.log("🎬 Producing local media...");
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          await sendTransport.produce({ track: videoTrack });
          console.log("✅ Video producer created");
        }

        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          await sendTransport.produce({ track: audioTrack });
          console.log("✅ Audio producer created");
        }

        // Step 7: Try to consume from any available producer (simplified)
        console.log("🍽️ Attempting to consume remote media...");
        setTimeout(async () => {
          try {
            const consumerParams = await new Promise<any>((resolve, reject) => {
              socket.emit("consumeSimple", { 
                rtpCapabilities: device.rtpCapabilities 
              }, (response: any) => {
                if (response.error) {
                  console.log("ℹ️ No remote producer available yet:", response.error);
                  reject(new Error(response.error));
                } else {
                  resolve(response);
                }
              });
            });

            const consumer = await recvTransport.consume(consumerParams);
            const remoteStream = new MediaStream([consumer.track]);

            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }

            console.log("✅ Remote media consumed and displayed");
          } catch (error) {
            console.log("ℹ️ No remote producer available:", error);
          }
        }, 2000); // Wait 2 seconds for other users to join

        console.log("🎉 Simplified MediaSoup test setup complete!");

      } catch (error) {
        console.error("❌ Error in simplified test:", error);
      }
    };

    init();
  }, []);

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h1 className="text-white text-2xl mb-6">Simplified MediaSoup Test</h1>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-white text-lg mb-2">Local Video</h2>
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            controls 
            className="w-full bg-black rounded"
          />
        </div>
        <div>
          <h2 className="text-white text-lg mb-2">Remote Video</h2>
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            controls 
            className="w-full bg-black rounded"
          />
        </div>
      </div>
      <div className="mt-4 text-gray-400 text-sm">
        <p>1. Allow camera/microphone access</p>
        <p>2. Open this page in another tab/browser to test remote video</p>
        <p>3. Check browser console for detailed logs</p>
      </div>
    </div>
  );
}