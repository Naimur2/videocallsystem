/**
 * Enhanced user cleanup and disconnect handling
 * This module provides improved cleanup when users close tabs or leave meetings
 */

"use client";

import { socketManager } from "@/lib/socketManager";

export class UserCleanupManager {
  private static instance: UserCleanupManager;
  private isSetup = false;
  private currentRoomId: string | null = null;
  private visibilityChangeHandler: (() => void) | null = null;
  private focusHandler: (() => void) | null = null;
  private blurHandler: (() => void) | null = null;

  private constructor() {}

  static getInstance(): UserCleanupManager {
    if (!UserCleanupManager.instance) {
      UserCleanupManager.instance = new UserCleanupManager();
    }
    return UserCleanupManager.instance;
  }

  /**
   * Setup enhanced cleanup handlers
   */
  setup(roomId: string): void {
    if (this.isSetup) {
      this.cleanup();
    }

    this.currentRoomId = roomId;
    this.setupVisibilityHandler();
    this.setupFocusHandlers();
    this.isSetup = true;

    console.log(
      "[UserCleanup] Enhanced cleanup handlers setup for room:",
      roomId
    );
  }

  /**
   * Clean up all handlers
   */
  cleanup(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener(
        "visibilitychange",
        this.visibilityChangeHandler
      );
      this.visibilityChangeHandler = null;
    }

    if (this.focusHandler) {
      window.removeEventListener("focus", this.focusHandler);
      this.focusHandler = null;
    }

    if (this.blurHandler) {
      window.removeEventListener("blur", this.blurHandler);
      this.blurHandler = null;
    }

    this.currentRoomId = null;
    this.isSetup = false;

    console.log("[UserCleanup] Cleanup handlers removed");
  }

  /**
   * Handle page visibility changes (tab switching, minimizing)
   */
  private setupVisibilityHandler(): void {
    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        console.log(
          "[UserCleanup] Tab became hidden - user may have switched tabs"
        );
        this.onTabInactive();
      } else {
        console.log("[UserCleanup] Tab became visible - user returned");
        this.onTabActive();
      }
    };

    document.addEventListener("visibilitychange", this.visibilityChangeHandler);
  }

  /**
   * Handle window focus/blur events
   */
  private setupFocusHandlers(): void {
    this.focusHandler = () => {
      console.log("[UserCleanup] Window gained focus");
      this.onTabActive();
    };

    this.blurHandler = () => {
      console.log("[UserCleanup] Window lost focus");
      this.onTabInactive();
    };

    window.addEventListener("focus", this.focusHandler);
    window.addEventListener("blur", this.blurHandler);
  }

  /**
   * Called when tab becomes active
   */
  private onTabActive(): void {
    // Send a heartbeat to ensure connection is alive
    const socket = socketManager.getSocket();
    if (socket?.connected && this.currentRoomId) {
      socket.emit("ping");
      console.log("[UserCleanup] Sent heartbeat on tab activation");
    }
  }

  /**
   * Called when tab becomes inactive
   */
  private onTabInactive(): void {
    // We don't immediately disconnect, just log for now
    // The heartbeat system will handle cleanup if needed
    console.log(
      "[UserCleanup] Tab inactive, heartbeat will continue in background"
    );
  }

  /**
   * Get current room ID
   */
  getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  /**
   * Force cleanup and disconnect
   */
  forceCleanup(): void {
    if (this.currentRoomId) {
      const socket = socketManager.getSocket();
      if (socket?.connected) {
        console.log("[UserCleanup] Sending force disconnect signal");
        socket.emit("beforeDisconnect", { roomId: this.currentRoomId });
      }
    }
    this.cleanup();
  }
}

export const userCleanupManager = UserCleanupManager.getInstance();
