"use client";

import { useMediaSoupSessionQuery } from '@/store/api/mediaSoupApi';
import { useState } from 'react';

export default function DebugRTKPage() {
    const [showDetails, setShowDetails] = useState(false);
    
    // Test RTK query directly
    const {
        data: session,
        isLoading,
        isError,
        error,
    } = useMediaSoupSessionQuery({
        serverUrl: 'https://call.naimur-rahaman.com',
        roomId: 'debug-room',
        userId: 'debug-user',
        userName: 'Debug User'
    });

    return (
        <div className="min-h-screen bg-gray-900 p-8 text-white">
            <h1 className="text-2xl font-bold mb-4">🔧 RTK Debug Console</h1>
            
            <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded">
                    <h2 className="text-lg font-semibold mb-2">RTK Query Status</h2>
                    <div className="space-y-2">
                        <div className={`px-3 py-1 rounded text-sm ${isLoading ? 'bg-yellow-600' : 'bg-green-600'}`}>
                            Loading: {isLoading.toString()}
                        </div>
                        <div className={`px-3 py-1 rounded text-sm ${isError ? 'bg-red-600' : 'bg-green-600'}`}>
                            Error: {isError.toString()}
                        </div>
                        <div className={`px-3 py-1 rounded text-sm ${session?.isReady ? 'bg-green-600' : 'bg-red-600'}`}>
                            Ready: {session?.isReady?.toString() || 'false'}
                        </div>
                        <div className={`px-3 py-1 rounded text-sm ${session?.isConnected ? 'bg-green-600' : 'bg-red-600'}`}>
                            Connected: {session?.isConnected?.toString() || 'false'}
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 p-4 rounded">
                    <h2 className="text-lg font-semibold mb-2">Session Data</h2>
                    <button 
                        onClick={() => setShowDetails(!showDetails)}
                        className="mb-2 px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        {showDetails ? 'Hide' : 'Show'} Details
                    </button>
                    
                    {showDetails && (
                        <pre className="bg-gray-900 p-2 rounded text-xs overflow-auto max-h-60">
                            {JSON.stringify(session, null, 2)}
                        </pre>
                    )}
                </div>

                <div className="bg-gray-800 p-4 rounded">
                    <h2 className="text-lg font-semibold mb-2">Error Details</h2>
                    {error ? (
                        <pre className="bg-red-900 p-2 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(error, null, 2)}
                        </pre>
                    ) : (
                        <p className="text-gray-400">No errors</p>
                    )}
                </div>

                <div className="bg-gray-800 p-4 rounded">
                    <h2 className="text-lg font-semibold mb-2">Participants</h2>
                    <p>Count: {session?.participants?.length || 0}</p>
                    {session?.participants?.length ? (
                        <ul className="mt-2">
                            {session.participants.map((p, i) => (
                                <li key={i} className="text-sm text-gray-300">
                                    {p.id} - {p.name}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400">No participants</p>
                    )}
                </div>
            </div>
        </div>
    );
}