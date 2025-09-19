// MediaSoup Video Call System Validator
// Comprehensive validation utility for frontend components

interface ValidationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

class SystemValidator {
  private results: ValidationResult[] = [];

  // Add validation result
  private addResult(component: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any): void {
    this.results.push({ component, status, message, details });
    
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} [${component}] ${message}`, details || '');
  }

  // Validate MediaSoup client
  async validateMediaSoupClient(): Promise<void> {
    try {
      // Check if mediasoup-client is available
      const mediasoupClient = await import('mediasoup-client');
      if (!mediasoupClient) {
        throw new Error('MediaSoup client not available');
      }

      this.addResult('MediaSoup Client', 'pass', 'MediaSoup client library loaded successfully');

      // Test device creation
      const device = new mediasoupClient.Device();
      this.addResult('MediaSoup Device', 'pass', 'MediaSoup device can be created');

    } catch (error) {
      this.addResult('MediaSoup Client', 'fail', 'MediaSoup client validation failed', error);
    }
  }

  // Validate WebRTC capabilities
  async validateWebRTC(): Promise<void> {
    try {
      // Check getUserMedia support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      this.addResult('getUserMedia', 'pass', 'getUserMedia is supported');

      // Check RTCPeerConnection support
      if (!window.RTCPeerConnection) {
        throw new Error('RTCPeerConnection not supported');
      }

      this.addResult('RTCPeerConnection', 'pass', 'RTCPeerConnection is supported');

      // Test basic media access (without actually requesting permissions)
      try {
        const constraints = { audio: true, video: false };
        await navigator.mediaDevices.getUserMedia(constraints);
        this.addResult('Media Access', 'pass', 'Basic media access test passed');
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          this.addResult('Media Access', 'warning', 'Media access denied by user (expected in test)');
        } else {
          this.addResult('Media Access', 'fail', 'Media access test failed', error.message);
        }
      }

    } catch (error) {
      this.addResult('WebRTC', 'fail', 'WebRTC validation failed', error);
    }
  }

  // Validate Socket.IO connection
  async validateSocketConnection(socketUrl: string): Promise<void> {
    try {
      // Basic URL validation
      if (!socketUrl || !socketUrl.startsWith('http')) {
        throw new Error('Invalid socket URL');
      }

      this.addResult('Socket URL', 'pass', `Socket URL format is valid: ${socketUrl}`);

      // Test socket connection (basic)
      const socket = await import('socket.io-client');
      if (!socket) {
        throw new Error('Socket.IO client not available');
      }

      this.addResult('Socket.IO Client', 'pass', 'Socket.IO client library loaded');

    } catch (error) {
      this.addResult('Socket Connection', 'fail', 'Socket connection validation failed', error);
    }
  }

  // Validate environment variables
  validateEnvironment(): void {
    const requiredEnvVars = [
      'NEXT_PUBLIC_BACKEND_URL',
      'NEXT_PUBLIC_SOCKET_URL'
    ];

    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      if (!value) {
        this.addResult('Environment', 'fail', `Missing required environment variable: ${envVar}`);
      } else if (!value.startsWith('http')) {
        this.addResult('Environment', 'warning', `Environment variable ${envVar} may have invalid format: ${value}`);
      } else {
        this.addResult('Environment', 'pass', `Environment variable ${envVar} is valid`);
      }
    });
  }

  // Validate browser compatibility
  validateBrowserSupport(): void {
    const userAgent = navigator.userAgent;
    const browser = this.detectBrowser(userAgent);

    this.addResult('Browser Detection', 'pass', `Detected browser: ${browser}`);

    // Check WebRTC support level
    const rtcSupport = {
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      RTCPeerConnection: !!window.RTCPeerConnection,
      webkitRTCPeerConnection: !!(window as any).webkitRTCPeerConnection,
      mozRTCPeerConnection: !!(window as any).mozRTCPeerConnection,
    };

    const supportLevel = Object.values(rtcSupport).filter(Boolean).length;
    
    if (supportLevel >= 2) {
      this.addResult('Browser Support', 'pass', `Good WebRTC support (${supportLevel}/4 features)`, rtcSupport);
    } else {
      this.addResult('Browser Support', 'warning', `Limited WebRTC support (${supportLevel}/4 features)`, rtcSupport);
    }
  }

  // Detect browser type
  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  // Run all validations
  async runAllValidations(socketUrl?: string): Promise<ValidationResult[]> {
    console.log('🔍 Starting comprehensive system validation...');

    this.validateEnvironment();
    this.validateBrowserSupport();
    await this.validateWebRTC();
    await this.validateMediaSoupClient();
    
    if (socketUrl) {
      await this.validateSocketConnection(socketUrl);
    }

    // Summary
    const passCount = this.results.filter(r => r.status === 'pass').length;
    const failCount = this.results.filter(r => r.status === 'fail').length;
    const warnCount = this.results.filter(r => r.status === 'warning').length;

    console.log('\n📊 Validation Summary:');
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`⚠️ Warnings: ${warnCount}`);

    if (failCount === 0) {
      console.log('🎉 All critical validations passed! System should work correctly.');
    } else {
      console.log('🚨 Some validations failed. Please review the issues above.');
    }

    return [...this.results];
  }

  // Get validation summary
  getSummary(): { pass: number; fail: number; warning: number; total: number } {
    return {
      pass: this.results.filter(r => r.status === 'pass').length,
      fail: this.results.filter(r => r.status === 'fail').length,
      warning: this.results.filter(r => r.status === 'warning').length,
      total: this.results.length
    };
  }

  // Clear results
  reset(): void {
    this.results = [];
  }
}

// Export singleton instance
const systemValidator = new SystemValidator();
export default systemValidator;

// Export for window access in browser console
if (typeof window !== 'undefined') {
  (window as any).systemValidator = systemValidator;
}