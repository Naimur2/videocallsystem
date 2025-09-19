'use client';

import { getTurnConfiguration, testTurnConnectivity } from '@/config/turnConfig';
import { useState } from 'react';

export default function TurnTestPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleTest = async () => {
    setTesting(true);
    setResult('Testing TURN server connectivity...');
    
    try {
      const success = await testTurnConnectivity();
      if (success) {
        setResult('✅ TURN server is working correctly! WebRTC should work on Heroku.');
      } else {
        setResult('⚠️ TURN server test failed. Check console for details.');
      }
    } catch (error) {
      setResult(`❌ TURN test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setTesting(false);
  };

  const turnConfig = getTurnConfiguration();

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">TURN Server Test</h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Current TURN Configuration</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(turnConfig, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mb-8">
            <button
              onClick={handleTest}
              disabled={testing}
              className={`px-6 py-3 rounded-lg font-semibold ${
                testing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              {testing ? 'Testing...' : 'Test TURN Server Connectivity'}
            </button>
          </div>

          {result && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Test Result</h3>
              <div className={`p-4 rounded-lg ${
                result.includes('✅') ? 'bg-green-50 text-green-800' :
                result.includes('⚠️') ? 'bg-yellow-50 text-yellow-800' :
                result.includes('❌') ? 'bg-red-50 text-red-800' :
                'bg-blue-50 text-blue-800'
              }`}>
                {result}
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <h3 className="font-semibold mb-2">About this test:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>This test creates a WebRTC peer connection using the configured TURN servers</li>
              <li>It checks if relay candidates are generated, which indicates TURN is working</li>
              <li>A successful test means video calls should work even behind NAT/firewalls</li>
              <li>Check the browser console for detailed ICE candidate information</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}