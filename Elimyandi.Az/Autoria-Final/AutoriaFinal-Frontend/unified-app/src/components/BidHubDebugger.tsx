import React, { useState } from 'react';
import { useSignalR } from '../hooks/useSignalR';

interface BidHubDebuggerProps {
  onClose: () => void;
}

export const BidHubDebugger: React.FC<BidHubDebuggerProps> = ({ onClose }) => {
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const { 
    connectionState,
    isConnected,
    isConnecting,
    isFailed,
    lastError,
    retryCount,
    connect, 
    disconnect, 
    reconnect,
    joinAuctionCar,
    leaveAuctionCar,
    placeLiveBid,
    placePreBid,
    placeProxyBid,
    cancelProxyBid
  } = useSignalR({
    baseUrl: 'https://localhost:7249',
    token: localStorage.getItem('authToken') || localStorage.getItem('auth_token') || '',
    autoConnect: false,
    events: {
      onNewLiveBid: (data) => addTestResult(`New live bid: ${JSON.stringify(data)}`),
      onPreBidPlaced: (data) => addTestResult(`Pre-bid placed: ${JSON.stringify(data)}`),
      onHighestBidUpdated: (data) => addTestResult(`Highest bid updated: ${JSON.stringify(data)}`),
      onAuctionTimerReset: (data) => addTestResult(`Timer reset: ${JSON.stringify(data)}`),
      onBidStatsUpdated: (data) => addTestResult(`Stats updated: ${JSON.stringify(data)}`),
      onBidError: (error) => addTestResult(`Bid error: ${error}`),
      onConnectionStateChanged: (state, error) => 
        addTestResult(`Connection state: ${state}${error ? ` - ${error}` : ''}`)
    }
  });

  const runConnectionTest = async () => {
    addTestResult('Starting connection test...');
    
    // Test 1: Check configuration
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    addTestResult(`Token present: ${!!token}`);
    addTestResult(`Token length: ${token ? token.length : 0}`);
    addTestResult(`Base URL: https://localhost:7249`);
    
    // Test 2: Test backend connectivity
    addTestResult('Testing backend connectivity...');
    const backendReachable = await testConnection();
    addTestResult(`Backend reachable: ${backendReachable}`);
    
    // Test 3: Test WebSocket URL directly
    addTestResult('Testing WebSocket URL construction...');
    const wsUrl = 'https://localhost:7249/bidHub';
    addTestResult(`WebSocket URL: ${wsUrl}`);
    
    // Test 4: Attempt WebSocket connection
    if (backendReachable) {
      addTestResult('Attempting WebSocket connection...');
      try {
        await connect();
        // Wait a bit for connection to establish
        setTimeout(() => {
          addTestResult(`WebSocket connection: ${connectionState.isConnected ? 'Success' : 'Failed'}`);
          if (!connectionState.isConnected && connectionState.error) {
            addTestResult(`Connection error: ${connectionState.error}`);
          }
        }, 2000);
      } catch (error) {
        addTestResult(`WebSocket connection error: ${error}`);
      }
    } else {
      addTestResult('Skipping WebSocket test - backend not reachable');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">BidHub Connection Debugger</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Connection Status:</h3>
          <div className="space-y-1 text-sm">
            <div>Connected: <span className={connectionState.isConnected ? 'text-green-600' : 'text-red-600'}>{connectionState.isConnected ? 'Yes' : 'No'}</span></div>
            <div>Connecting: <span className={connectionState.isConnecting ? 'text-yellow-600' : 'text-gray-600'}>{connectionState.isConnecting ? 'Yes' : 'No'}</span></div>
            <div>Error: <span className="text-red-600">{connectionState.error || 'None'}</span></div>
            <div>Reconnect Attempts: {connectionState.reconnectAttempts}</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={runConnectionTest}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Run Connection Test
          </button>
          <button
            onClick={async () => {
              addTestResult('Manual connect attempt...');
              try {
                await connect();
                setTimeout(() => {
                  addTestResult(`Manual connect result: ${connectionState.isConnected ? 'Success' : 'Failed'}`);
                }, 1000);
              } catch (error) {
                addTestResult(`Manual connect error: ${error}`);
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Manual Connect
          </button>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm space-y-1">
            {testResults.length === 0 ? (
              <div className="text-gray-500">No test results yet. Click "Run Connection Test" to start.</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index}>{result}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
