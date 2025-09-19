/**
 * Safe localStorage utilities for user data persistence
 */

export interface UserData {
  name: string;
  email: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  selectedAudioDevice: string;
  selectedVideoDevice: string;
  lastUsed: string;
  isAuthenticated?: boolean;
  passwordHash?: string; // For storing hashed passwords
}

export interface StoredUser extends UserData {
  passwordHash: string;
}

const USER_DATA_KEY = "videocall_user_data";

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, "test");
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load user data from localStorage
 */
export function loadUserData(): Partial<UserData> | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error loading user data:", error);
    return null;
  }
}

/**
 * Save user data to localStorage
 */
export function saveUserData(userData: Partial<UserData>): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    const dataToSave = {
      ...userData,
      lastUsed: new Date().toISOString(),
    };
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(dataToSave));
    return true;
  } catch (error) {
    console.error("Error saving user data:", error);
    return false;
  }
}

/**
 * Check if user is authenticated
 */
export function isUserAuthenticated(): boolean {
  const userData = loadUserData();
  return (
    userData?.isAuthenticated === true && !!userData.name && !!userData.email
  );
}

/**
 * Log out user by clearing authentication data
 */
export function logoutUser(): boolean {
  return clearUserData();
}

/**
 * Clear user data from localStorage
 */
export function clearUserData(): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    localStorage.removeItem(USER_DATA_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing user data:", error);
    return false;
  }
}

/**
 * Clear session data and joining state (useful for error recovery)
 */
export function clearSessionData(): void {
  try {
    sessionStorage.removeItem("videocall_joining");
    // Also clear any stale tab data
    const tabId = getTabId();
    console.log(`[Storage] Clearing session data for tab ${tabId}`);
  } catch (error) {
    console.error("Error clearing session data:", error);
  }
}

/**
 * Reset user data with fresh timestamp (useful for reconnection scenarios)
 */
export function refreshUserDataTimestamp(): void {
  const userData = loadUserData();
  if (userData) {
    saveUserData({
      ...userData,
      lastUsed: new Date().toISOString(),
    });
  }
}

/**
 * Check if user should auto-join (disabled for Google Meet-style behavior)
 */
export function shouldAutoJoin(): boolean {
  // Always return false to disable auto-join behavior
  // Users should manually join each time (Google Meet style)
  return false;
}

/**
 * Mark that user is currently joining to prevent multiple attempts
 */
export function setJoiningState(isJoining: boolean): void {
  if (!isLocalStorageAvailable()) return;

  try {
    if (isJoining) {
      sessionStorage.setItem("videocall_joining", "true");
    } else {
      sessionStorage.removeItem("videocall_joining");
    }
  } catch (error) {
    console.error("Error setting joining state:", error);
  }
}

/**
 * Check if user is currently in the joining process
 */
export function isCurrentlyJoining(): boolean {
  try {
    return sessionStorage.getItem("videocall_joining") === "true";
  } catch {
    return false;
  }
}

interface TabData {
  timestamp: number;
  url: string;
}

/**
 * Multi-tab detection system with Google Meet-style behavior
 */

// Generate a unique tab ID for this browser tab
export function getTabId(): string {
  try {
    let tabId = sessionStorage.getItem("videocall_tab_id");
    if (!tabId) {
      tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("videocall_tab_id", tabId);
    }
    return tabId;
  } catch {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Check if the same user is already in this room from another tab
 */
export function checkForSameUserInRoom(
  roomId: string,
  userName: string,
  userEmail: string
): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    const activeSessionsKey = `videocall_user_sessions_${roomId}`;
    const activeSessions: Record<
      string,
      {
        name: string;
        email: string;
        timestamp: number;
        tabId: string;
      }
    > = JSON.parse(localStorage.getItem(activeSessionsKey) || "{}");

    const currentTabId = getTabId();

    // Check if any other tab has the same user credentials
    for (const sessionId in activeSessions) {
      const session = activeSessions[sessionId];
      if (
        session.tabId !== currentTabId &&
        session.name === userName &&
        session.email === userEmail
      ) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking for same user in room:", error);
    return false;
  }
}

/**
 * Notify other tabs that meeting has been switched to a new tab
 */
export function notifyOtherTabsOfMeetingSwitch(
  roomId: string,
  userName: string,
  userEmail: string
): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const currentTabId = getTabId();

    console.log(
      "[CrossTab] Notifying other tabs of meeting switch for user:",
      userName,
      "in room:",
      roomId,
      "from tab:",
      currentTabId
    );

    // Use BroadcastChannel for direct cross-tab communication
    const channel = new BroadcastChannel(CROSS_TAB_CHANNEL);

    const action = {
      type: "MEETING_SWITCHED_TO_NEW_TAB",
      meetingId: roomId,
      senderTabId: currentTabId,
      targetUser: { name: userName, email: userEmail },
      timestamp: Date.now(),
    };

    channel.postMessage(action);

    // Close the channel after sending
    setTimeout(() => {
      channel.close();
    }, 100);

    // Also use localStorage fallback approach
    const switchTabKey = `videocall_switch_tab_${roomId}`;
    const switchSignal = {
      targetUser: { name: userName, email: userEmail },
      fromTabId: currentTabId,
      timestamp: Date.now(),
      action: "MEETING_SWITCHED_TO_NEW_TAB",
    };

    localStorage.setItem(switchTabKey, JSON.stringify(switchSignal));

    // Clean up the signal after a short delay
    setTimeout(() => {
      try {
        const currentSignal = localStorage.getItem(switchTabKey);
        if (currentSignal) {
          const signal = JSON.parse(currentSignal);
          if (signal.fromTabId === currentTabId) {
            localStorage.removeItem(switchTabKey);
          }
        }
      } catch (e) {
        console.error("Error cleaning up switch signal:", e);
      }
    }, 1000);
  } catch (error) {
    console.error("Error notifying other tabs of meeting switch:", error);
  }
}

/**
 * Register user session for this tab
 */
export function registerUserSession(
  roomId: string,
  userName: string,
  userEmail: string
): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const tabId = getTabId();
    const activeSessionsKey = `videocall_user_sessions_${roomId}`;
    const activeSessions: Record<
      string,
      {
        name: string;
        email: string;
        timestamp: number;
        tabId: string;
      }
    > = JSON.parse(localStorage.getItem(activeSessionsKey) || "{}");

    // Register this session
    activeSessions[tabId] = {
      name: userName,
      email: userEmail,
      timestamp: Date.now(),
      tabId: tabId,
    };

    localStorage.setItem(activeSessionsKey, JSON.stringify(activeSessions));
  } catch (error) {
    console.error("Error registering user session:", error);
  }
}

/**
 * Unregister user session for this tab
 */
export function unregisterUserSession(roomId: string): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const tabId = getTabId();
    const activeSessionsKey = `videocall_user_sessions_${roomId}`;
    const activeSessions: Record<
      string,
      {
        name: string;
        email: string;
        timestamp: number;
        tabId: string;
      }
    > = JSON.parse(localStorage.getItem(activeSessionsKey) || "{}");

    delete activeSessions[tabId];

    if (Object.keys(activeSessions).length === 0) {
      localStorage.removeItem(activeSessionsKey);
    } else {
      localStorage.setItem(activeSessionsKey, JSON.stringify(activeSessions));
    }
  } catch (error) {
    console.error("Error unregistering user session:", error);
  }
}

/**
 * Listen for close tab signals (to be called in useEffect)
 */
export function setupTabCloseListener(
  roomId: string,
  userName: string,
  userEmail: string,
  onShouldClose: () => void
): () => void {
  if (!isLocalStorageAvailable()) return () => {};

  const currentTabId = getTabId();
  const closeTabKey = `videocall_close_tab_${roomId}`;

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === closeTabKey && event.newValue) {
      try {
        const signal = JSON.parse(event.newValue);
        if (
          signal.action === "CLOSE_OTHER_TABS" &&
          signal.fromTabId !== currentTabId &&
          signal.targetUser.name === userName &&
          signal.targetUser.email === userEmail
        ) {
          console.log("[TabListener] Received signal to close this tab");
          onShouldClose();
        }
      } catch (error) {
        console.error("Error processing tab close signal:", error);
      }
    }
  };

  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
  };
}

/**
 * Register this tab as active for a specific room
 */
export function registerActiveTab(roomId: string): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const tabId = getTabId();
    const activeTabsKey = `videocall_active_tabs_${roomId}`;
    const activeTabs: Record<string, TabData> = JSON.parse(
      localStorage.getItem(activeTabsKey) || "{}"
    );

    // Add this tab with current timestamp
    activeTabs[tabId] = {
      timestamp: Date.now(),
      url: window.location.href,
    };

    localStorage.setItem(activeTabsKey, JSON.stringify(activeTabs));

    // Clean up old tabs (older than 30 seconds)
    cleanupOldTabs(roomId);
  } catch (error) {
    console.error("Error registering active tab:", error);
  }
}

/**
 * Unregister this tab when leaving the room
 */
export function unregisterActiveTab(roomId: string): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const tabId = getTabId();
    const activeTabsKey = `videocall_active_tabs_${roomId}`;
    const activeTabs: Record<string, TabData> = JSON.parse(
      localStorage.getItem(activeTabsKey) || "{}"
    );

    delete activeTabs[tabId];

    if (Object.keys(activeTabs).length === 0) {
      localStorage.removeItem(activeTabsKey);
    } else {
      localStorage.setItem(activeTabsKey, JSON.stringify(activeTabs));
    }
  } catch (error) {
    console.error("Error unregistering active tab:", error);
  }
}

/**
 * Check if there are other active tabs for this room
 */
export function getOtherActiveTabs(
  roomId: string
): Array<{ tabId: string; timestamp: number; url: string }> {
  if (!isLocalStorageAvailable()) return [];

  try {
    const currentTabId = getTabId();
    const activeTabsKey = `videocall_active_tabs_${roomId}`;

    // Clean up old tabs first
    cleanupOldTabs(roomId);

    // Get updated tabs after cleanup
    const updatedTabs: Record<string, TabData> = JSON.parse(
      localStorage.getItem(activeTabsKey) || "{}"
    );

    // Return other tabs (excluding current tab)
    return Object.entries(updatedTabs)
      .filter(([tabId]) => tabId !== currentTabId)
      .map(([tabId, data]: [string, TabData]) => ({
        tabId,
        timestamp: data.timestamp,
        url: data.url,
      }));
  } catch (error) {
    console.error("Error getting other active tabs:", error);
    return [];
  }
}

/**
 * Clean up tabs that haven't been updated recently (older than 30 seconds)
 */
function cleanupOldTabs(roomId: string): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const activeTabsKey = `videocall_active_tabs_${roomId}`;
    const activeTabs: Record<string, TabData> = JSON.parse(
      localStorage.getItem(activeTabsKey) || "{}"
    );
    const now = Date.now();
    const CLEANUP_THRESHOLD = 30 * 1000; // 30 seconds

    let hasChanges = false;
    Object.keys(activeTabs).forEach((tabId) => {
      if (now - activeTabs[tabId].timestamp > CLEANUP_THRESHOLD) {
        delete activeTabs[tabId];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      if (Object.keys(activeTabs).length === 0) {
        localStorage.removeItem(activeTabsKey);
      } else {
        localStorage.setItem(activeTabsKey, JSON.stringify(activeTabs));
      }
    }
  } catch (error) {
    console.error("Error cleaning up old tabs:", error);
  }
}

/**
 * Start heartbeat to keep this tab marked as active
 */
export function startTabHeartbeat(roomId: string): () => void {
  const interval = setInterval(() => {
    registerActiveTab(roomId);
  }, 5000); // Update every 5 seconds

  // Return cleanup function
  return () => {
    clearInterval(interval);
    unregisterActiveTab(roomId);
  };
}

/**
 * User database functions for multiple user support
 */
const USERS_DB_KEY = "videocall_users_db";

/**
 * Get all stored users from database
 */
export function getStoredUsers(): StoredUser[] {
  if (!isLocalStorageAvailable()) return [];

  try {
    const users = localStorage.getItem(USERS_DB_KEY);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error("Error loading users database:", error);
    return [];
  }
}

/**
 * Save user to database
 */
export function saveUserToDatabase(user: StoredUser): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    const existingUsers = getStoredUsers();

    // Check if user already exists
    const existingIndex = existingUsers.findIndex(
      (u) => u.email.toLowerCase() === user.email.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Update existing user
      existingUsers[existingIndex] = user;
    } else {
      // Add new user
      existingUsers.push(user);
    }

    localStorage.setItem(USERS_DB_KEY, JSON.stringify(existingUsers));
    return true;
  } catch (error) {
    console.error("Error saving user to database:", error);
    return false;
  }
}

/**
 * Find user by email
 */
export function findUserByEmail(email: string): StoredUser | null {
  const users = getStoredUsers();
  return (
    users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
  );
}

/**
 * Validate user credentials for login
 */
export function validateUserCredentials(
  email: string,
  name: string,
  password: string
): StoredUser | null {
  const user = findUserByEmail(email);

  if (!user) return null;

  // Check name match
  if (user.name !== name) return null;

  // Check password (in real app, would use proper hashing)
  if (user.passwordHash !== btoa(password)) return null;

  return user;
}

const CURRENT_MEETING_KEY = "videocall_current_meeting";

/**
 * Store the current meeting ID that this tab is active in
 */
export function setCurrentMeetingId(roomId: string): void {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.setItem(CURRENT_MEETING_KEY, roomId);
  } catch (error) {
    console.error("Error storing current meeting ID:", error);
  }
}

/**
 * Get the current meeting ID that this tab is active in
 */
export function getCurrentMeetingId(): string | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    return localStorage.getItem(CURRENT_MEETING_KEY);
  } catch (error) {
    console.error("Error loading current meeting ID:", error);
    return null;
  }
}

/**
 * Clear the current meeting ID when leaving a meeting
 */
export function clearCurrentMeetingId(): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const currentMeetingId = getCurrentMeetingId();
    const currentTabId = getTabId();

    console.log(
      "[Storage] Clearing meeting ID:",
      currentMeetingId,
      "for tab:",
      currentTabId
    );

    localStorage.removeItem(CURRENT_MEETING_KEY);
  } catch (error) {
    console.error("Error clearing current meeting ID:", error);
  }
}

/**
 * Check if user is already in a different meeting
 */
export function isUserInDifferentMeeting(roomId: string): string | false {
  const currentMeetingId = getCurrentMeetingId();

  if (!currentMeetingId) return false;
  if (currentMeetingId === roomId) return false;

  return currentMeetingId;
}

/**
 * Check if user is already in the same meeting (from localStorage)
 */
export function isUserAlreadyInMeeting(roomId: string): boolean {
  const currentMeetingId = getCurrentMeetingId();
  return currentMeetingId === roomId;
}

/**
 * Check if this tab should handle meeting cleanup
 * Only the tab that actually joined the meeting should clear the meeting ID
 */
export function shouldHandleMeetingCleanup(roomId: string): boolean {
  const currentMeetingId = getCurrentMeetingId();
  return currentMeetingId === roomId;
}

const CROSS_TAB_CHANNEL = "videocall_cross_tab";
const CROSS_TAB_ACTION_KEY = "videocall_cross_tab_action"; // Fallback for localStorage

/**
 * Send a cross-tab message to close other tabs in a specific meeting
 */
export function closePreviousMeetingTabs(previousMeetingId: string): void {
  try {
    const currentTabId = getTabId();
    // Use BroadcastChannel for direct cross-tab communication
    const channel = new BroadcastChannel(CROSS_TAB_CHANNEL);

    const action = {
      type: "CLOSE_MEETING_TAB",
      meetingId: previousMeetingId,
      senderTabId: currentTabId, // Include sender tab ID to prevent self-close
      timestamp: Date.now(),
    };

    console.log(
      "[CrossTab] Broadcasting close command for meeting:",
      previousMeetingId,
      "from tab:",
      currentTabId
    );
    channel.postMessage(action);

    // Close the channel after sending
    setTimeout(() => {
      channel.close();
    }, 100);
  } catch (error) {
    console.error("Error sending cross-tab close message:", error);
    // Fallback to localStorage approach if BroadcastChannel is not supported
    try {
      const currentTabId = getTabId();
      const action = {
        type: "CLOSE_MEETING_TAB",
        meetingId: previousMeetingId,
        senderTabId: currentTabId,
        timestamp: Date.now(),
      };

      localStorage.setItem(CROSS_TAB_ACTION_KEY, JSON.stringify(action));

      setTimeout(() => {
        try {
          localStorage.removeItem(CROSS_TAB_ACTION_KEY);
        } catch (fallbackError) {
          console.error("Error clearing cross-tab action:", fallbackError);
        }
      }, 1000);
    } catch (fallbackError) {
      console.error("Fallback cross-tab messaging also failed:", fallbackError);
    }
  }
}

/**
 * Listen for cross-tab messages and handle them
 */
export function setupCrossTabListener(
  currentMeetingId: string | null,
  onCloseTab: () => void,
  userName?: string,
  userEmail?: string,
  onMeetingSwitched?: (switchTimestamp: number) => void
): () => void {
  try {
    const currentTabId = getTabId();
    // Use BroadcastChannel for direct cross-tab communication
    const channel = new BroadcastChannel(CROSS_TAB_CHANNEL);

    const handleMessage = (event: MessageEvent) => {
      try {
        const action = event.data;

        if (
          action.type === "CLOSE_MEETING_TAB" &&
          action.meetingId === currentMeetingId &&
          action.senderTabId !== currentTabId && // Don't close self
          currentMeetingId
        ) {
          // Check if this message targets specific user credentials
          if (action.targetUser && userName && userEmail) {
            // Only close if this tab has the same user credentials
            if (
              action.targetUser.name === userName &&
              action.targetUser.email === userEmail
            ) {
              console.log(
                "[CrossTab] Received close command for same user:",
                userName,
                "in meeting:",
                currentMeetingId,
                "from tab:",
                action.senderTabId,
                "my tab:",
                currentTabId
              );
              onCloseTab();
            }
          } else {
            // General meeting close command (for backward compatibility)
            console.log(
              "[CrossTab] Received close command for meeting:",
              currentMeetingId,
              "from tab:",
              action.senderTabId,
              "my tab:",
              currentTabId
            );
            onCloseTab();
          }
        } else if (
          action.type === "MEETING_SWITCHED_TO_NEW_TAB" &&
          action.meetingId === currentMeetingId &&
          action.senderTabId !== currentTabId && // Don't affect self
          currentMeetingId
        ) {
          // Check if this message targets specific user credentials
          if (action.targetUser && userName && userEmail) {
            // Only show switch page if this tab has the same user credentials
            if (
              action.targetUser.name === userName &&
              action.targetUser.email === userEmail
            ) {
              console.log(
                "[CrossTab] Meeting switched to new tab for same user:",
                userName,
                "in meeting:",
                currentMeetingId,
                "from tab:",
                action.senderTabId,
                "my tab:",
                currentTabId
              );
              onMeetingSwitched?.(action.timestamp);
            }
          }
        }
      } catch (error) {
        console.error("Error handling cross-tab message:", error);
      }
    };

    channel.addEventListener("message", handleMessage);
    console.log(
      "[CrossTab] BroadcastChannel listener setup for meeting:",
      currentMeetingId,
      "user:",
      userName,
      "tab:",
      currentTabId
    );

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
      console.log(
        "[CrossTab] BroadcastChannel listener cleaned up for tab:",
        currentTabId
      );
    };
  } catch (error) {
    console.error(
      "BroadcastChannel not supported, falling back to localStorage:",
      error
    );

    // Fallback to localStorage approach
    if (!isLocalStorageAvailable()) return () => {};

    const currentTabId = getTabId();
    const handleStorageChange = (event: StorageEvent) => {
      if (!event.newValue) return;

      // Handle both the old close key and new switch key
      const isCloseEvent = event.key === CROSS_TAB_ACTION_KEY;
      const isSwitchEvent = event.key?.startsWith("videocall_switch_tab_");

      if (!isCloseEvent && !isSwitchEvent) return;

      try {
        const action = JSON.parse(event.newValue);

        if (
          action.type === "CLOSE_MEETING_TAB" &&
          action.meetingId === currentMeetingId &&
          action.senderTabId !== currentTabId && // Don't close self
          currentMeetingId
        ) {
          // Check if this message targets specific user credentials
          if (action.targetUser && userName && userEmail) {
            // Only close if this tab has the same user credentials
            if (
              action.targetUser.name === userName &&
              action.targetUser.email === userEmail
            ) {
              console.log(
                "[CrossTab] Received localStorage close command for same user:",
                userName,
                "in meeting:",
                currentMeetingId,
                "from tab:",
                action.senderTabId,
                "my tab:",
                currentTabId
              );
              onCloseTab();
            }
          } else {
            // General meeting close command (for backward compatibility)
            console.log(
              "[CrossTab] Received localStorage close command for meeting:",
              currentMeetingId,
              "from tab:",
              action.senderTabId,
              "my tab:",
              currentTabId
            );
            onCloseTab();
          }
        } else if (
          action.action === "MEETING_SWITCHED_TO_NEW_TAB" &&
          action.fromTabId !== currentTabId && // Don't affect self
          currentMeetingId
        ) {
          // Check if this message targets specific user credentials
          if (action.targetUser && userName && userEmail) {
            // Only show switch page if this tab has the same user credentials
            if (
              action.targetUser.name === userName &&
              action.targetUser.email === userEmail
            ) {
              console.log(
                "[CrossTab] Meeting switched to new tab for same user:",
                userName,
                "in meeting:",
                currentMeetingId,
                "from tab:",
                action.fromTabId,
                "my tab:",
                currentTabId
              );
              onMeetingSwitched?.(action.timestamp);
            }
          }
        }
      } catch (error) {
        console.error("Error handling cross-tab storage message:", error);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }
}
