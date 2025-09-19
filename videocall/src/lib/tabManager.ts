/**
 * Tab Manager - Handles multiple tabs like Google Meet
 * Ensures only one active connection per user per room
 */

export interface TabInfo {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  timestamp: number;
  isActive: boolean;
}

const TAB_STORAGE_KEY = "videocall_active_tabs";
const TAB_HEARTBEAT_INTERVAL = 1000; // 1 second
const TAB_TIMEOUT = 5000; // 5 seconds before considering tab dead

/**
 * Generate a unique tab ID
 */
export function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique user session ID
 */
export function generateUserSessionId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get or create user session ID (persists across tabs)
 */
export function getUserSessionId(): string {
  const existing = localStorage.getItem("videocall_user_session");
  if (existing) return existing;

  const newId = generateUserSessionId();
  localStorage.setItem("videocall_user_session", newId);
  return newId;
}

/**
 * Get all active tabs for current room
 */
export function getActiveTabs(roomId: string): TabInfo[] {
  try {
    const stored = localStorage.getItem(TAB_STORAGE_KEY);
    if (!stored) return [];

    const allTabs: TabInfo[] = JSON.parse(stored);
    const now = Date.now();

    // Filter out expired tabs and tabs for different rooms
    return allTabs.filter(
      (tab) => tab.roomId === roomId && now - tab.timestamp < TAB_TIMEOUT
    );
  } catch {
    return [];
  }
}

/**
 * Register current tab
 */
export function registerTab(roomId: string, userName: string): string {
  const tabId = generateTabId();
  const userId = getUserSessionId();

  try {
    const stored = localStorage.getItem(TAB_STORAGE_KEY);
    const allTabs: TabInfo[] = stored ? JSON.parse(stored) : [];

    // Remove expired tabs
    const now = Date.now();
    const validTabs = allTabs.filter(
      (tab) => now - tab.timestamp < TAB_TIMEOUT
    );

    // Add current tab
    const newTab: TabInfo = {
      id: tabId,
      roomId,
      userId,
      userName,
      timestamp: now,
      isActive: true,
    };

    validTabs.push(newTab);
    localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(validTabs));

    return tabId;
  } catch (error) {
    console.error("Error registering tab:", error);
    return tabId;
  }
}

/**
 * Update tab heartbeat
 */
export function updateTabHeartbeat(tabId: string): void {
  try {
    const stored = localStorage.getItem(TAB_STORAGE_KEY);
    if (!stored) return;

    const allTabs: TabInfo[] = JSON.parse(stored);
    const tabIndex = allTabs.findIndex((tab) => tab.id === tabId);

    if (tabIndex !== -1) {
      allTabs[tabIndex].timestamp = Date.now();
      localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(allTabs));
    }
  } catch (error) {
    console.error("Error updating tab heartbeat:", error);
  }
}

/**
 * Mark tab as inactive (when leaving room or closing)
 */
export function deactivateTab(tabId: string): void {
  try {
    const stored = localStorage.getItem(TAB_STORAGE_KEY);
    if (!stored) return;

    const allTabs: TabInfo[] = JSON.parse(stored);
    const updatedTabs = allTabs.filter((tab) => tab.id !== tabId);

    localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(updatedTabs));
  } catch (error) {
    console.error("Error deactivating tab:", error);
  }
}

/**
 * Get the primary (first) active tab for current user in room
 */
export function getPrimaryTab(roomId: string): TabInfo | null {
  const activeTabs = getActiveTabs(roomId);
  const userId = getUserSessionId();

  // Get tabs for current user, sorted by timestamp (earliest first)
  const userTabs = activeTabs
    .filter((tab) => tab.userId === userId)
    .sort((a, b) => a.timestamp - b.timestamp);

  return userTabs[0] || null;
}

/**
 * Check if current tab is the primary tab
 */
export function isTabPrimary(tabId: string, roomId: string): boolean {
  const primaryTab = getPrimaryTab(roomId);
  return primaryTab?.id === tabId;
}

/**
 * Get tab role (primary or secondary)
 */
export function getTabRole(
  tabId: string,
  roomId: string
): "primary" | "secondary" | "unknown" {
  const activeTabs = getActiveTabs(roomId);
  const userId = getUserSessionId();
  const currentTab = activeTabs.find((tab) => tab.id === tabId);

  if (!currentTab || currentTab.userId !== userId) return "unknown";

  return isTabPrimary(tabId, roomId) ? "primary" : "secondary";
}

/**
 * Start tab heartbeat system
 */
export function startTabHeartbeat(tabId: string): () => void {
  const interval = setInterval(() => {
    updateTabHeartbeat(tabId);
  }, TAB_HEARTBEAT_INTERVAL);

  // Cleanup function
  return () => {
    clearInterval(interval);
    deactivateTab(tabId);
  };
}

/**
 * Listen for storage changes to detect other tabs
 */
export function onTabChange(
  callback: (tabs: TabInfo[]) => void,
  roomId: string
): () => void {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === TAB_STORAGE_KEY) {
      callback(getActiveTabs(roomId));
    }
  };

  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
  };
}
