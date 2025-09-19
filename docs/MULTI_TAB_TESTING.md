# Testing Multi-Tab Meeting Switch Functionality

## How to Test

1. **Open the first tab:**

   - Go to http://localhost:3002
   - Enter your name and email
   - Create or join a meeting

2. **Open the second tab:**
   - Open a new tab in the same browser
   - Go to the same meeting URL (or http://localhost:3002 and join the same meeting)
   - Enter the **SAME** name and email as the first tab
   - Click "Join Meeting"

## Expected Behavior

### ✅ What Should Happen:

- **First tab:** Will show a "Meeting Switched" page with:

  - Message: "This meeting has been switched to a new tab"
  - Meeting ID display
  - "Return to Meeting" button
  - "Go to Home" button
  - Time indicator showing when the switch happened

- **Second tab:** Will successfully join the meeting as the active tab

### 🔧 Key Features:

1. **No Tab Closing:** Tabs are not closed, they show a user-friendly message instead
2. **Host Controls:** The new active tab will have all host controls (End Meeting button, etc.)
3. **Seamless Switch:** Users can return to the meeting from the switched tab
4. **Time Tracking:** Shows when the meeting was switched to help users understand

### 🚀 Benefits:

- Better user experience than closing tabs
- Clear indication of what happened
- Easy to return to the meeting
- Maintains host permissions in the active tab

## Troubleshooting

If the functionality doesn't work:

1. Check browser console for cross-tab communication logs
2. Ensure both tabs use the exact same name and email
3. Check that the backend is running on port 3001
4. Verify BroadcastChannel API is supported in your browser
