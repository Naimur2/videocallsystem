// Simple test script to verify BroadcastChannel communication
// Open this in browser console to test

console.log("Testing BroadcastChannel communication...");

// Create a listener (simulates the meeting tab)
const channel1 = new BroadcastChannel("videocall_cross_tab");
channel1.addEventListener("message", (event) => {
  console.log("Channel 1 received:", event.data);
  if (event.data.type === "CLOSE_MEETING_TAB") {
    console.log(
      "Channel 1: Would close tab for meeting:",
      event.data.meetingId
    );
  }
});

// Create a sender (simulates the new tab)
const channel2 = new BroadcastChannel("videocall_cross_tab");

// Test sending a message
setTimeout(() => {
  console.log("Sending test message...");
  channel2.postMessage({
    type: "CLOSE_MEETING_TAB",
    meetingId: "test-room-123",
    timestamp: Date.now(),
  });
}, 1000);

// Cleanup after test
setTimeout(() => {
  channel1.close();
  channel2.close();
  console.log("Test complete - channels closed");
}, 3000);
