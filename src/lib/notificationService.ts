/**
 * Browser Notification Service
 * Handles requesting permissions and displaying browser notifications
 */
export class BrowserNotificationService {
  /**
   * Request notification permission from the browser
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[NotificationService] Browser does not support notifications');
      return 'denied';
    }
    
    if (Notification.permission === 'granted') {
      console.log('[NotificationService] Permission already granted');
      return 'granted';
    }
    
    if (Notification.permission === 'denied') {
      console.log('[NotificationService] Permission already denied');
      return 'denied';
    }
    
    console.log('[NotificationService] Requesting permission...');
    const result = await Notification.requestPermission();
    console.log('[NotificationService] Permission result:', result);
    return result;
  }
  
  /**
   * Show a browser notification
   */
  static async showNotification(title: string, options: NotificationOptions = {}) {
    const permission = await this.requestPermission();
    
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/icon-512x512.png',
        badge: '/icon-192x192.svg',
        requireInteraction: false,
        ...options
      });
    }
  }
  
  /**
   * Check if browser supports notifications
   */
  static isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }
  
  /**
   * Get current notification permission status
   */
  static getPermission(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }
  
  /**
   * Check if notifications are enabled (permission granted)
   */
  static isEnabled(): boolean {
    return this.getPermission() === 'granted';
  }
}
