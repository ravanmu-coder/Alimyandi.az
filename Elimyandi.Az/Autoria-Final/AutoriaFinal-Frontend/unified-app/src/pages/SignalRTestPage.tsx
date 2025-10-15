import React, { useState, useEffect } from 'react';
import { useSignalR } from '../hooks/useSignalR';

const SignalRTestPage: React.FC = () => {
  const [testUsers, setTestUsers] = useState<Array<{
    id: string;
    token: string;
    isConnected: boolean;
    connectionState: string;
    lastError?: string;
  }>>([]);

  const [newUserToken, setNewUserToken] = useState('');

  // Create a test user connection
  const createTestUser = () => {
    if (!newUserToken.trim()) return;
    
    const userId = `user_${Date.now()}`;
    setTestUsers(prev => [...prev, {
      id: userId,
      token: newUserToken.trim(),
      isConnected: false,
      connectionState: 'Disconnected'
    }]);
    setNewUserToken('');
  };

  const removeTestUser = (userId: string) => {
    setTestUsers(prev => prev.filter(user => user.id !== userId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">SignalR Multi-User Connection Test</h1>
        
        {/* Add New User */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Add Test User</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={newUserToken}
              onChange={(e) => setNewUserToken(e.target.value)}
              placeholder="Enter user token (or leave empty for anonymous)"
              className="flex-1 px-4 py-2 bg-slate-700/50 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={createTestUser}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200"
            >
              Add User
            </button>
          </div>
        </div>

        {/* Test Users */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testUsers.map((user) => (
            <TestUserCard
              key={user.id}
              user={user}
              onRemove={() => removeTestUser(user.id)}
              onUpdate={(updates) => {
                setTestUsers(prev => prev.map(u => 
                  u.id === user.id ? { ...u, ...updates } : u
                ));
              }}
            />
          ))}
        </div>

        {testUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No test users created yet</p>
            <p className="text-slate-500 text-sm mt-2">Add some users above to test multi-user SignalR connections</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface TestUserCardProps {
  user: {
    id: string;
    token: string;
    isConnected: boolean;
    connectionState: string;
    lastError?: string;
  };
  onRemove: () => void;
  onUpdate: (updates: Partial<TestUserCardProps['user']>) => void;
}

const TestUserCard: React.FC<TestUserCardProps> = ({ user, onRemove, onUpdate }) => {
  const {
    isConnected,
    isConnecting,
    connectionState,
    lastError,
    connect,
    disconnect
  } = useSignalR({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7249',
    token: user.token || `anonymous_${user.id}`,
    autoConnect: false,
    events: {
      onConnectionStateChanged: (state, error) => {
        onUpdate({
          isConnected: state === 'Connected',
          connectionState: state,
          lastError: error
        });
      }
    }
  });

  useEffect(() => {
    onUpdate({
      isConnected,
      connectionState,
      lastError
    });
  }, [isConnected, connectionState, lastError, onUpdate]);

  const getStatusColor = () => {
    if (isConnected) return 'text-green-400';
    if (isConnecting) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusIcon = () => {
    if (isConnected) return '✅';
    if (isConnecting) return '🔄';
    return '❌';
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">
          User {user.id.split('_')[1]}
        </h3>
        <button
          onClick={onRemove}
          className="text-red-400 hover:text-red-300 text-sm"
        >
          Remove
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-xs text-slate-400">Token:</span>
          <div className="text-sm text-white font-mono bg-slate-700/30 rounded px-2 py-1 mt-1">
            {user.token || 'anonymous'}
          </div>
        </div>

        <div>
          <span className="text-xs text-slate-400">Status:</span>
          <div className={`text-sm font-semibold ${getStatusColor()} mt-1`}>
            {getStatusIcon()} {connectionState}
          </div>
        </div>

        {lastError && (
          <div>
            <span className="text-xs text-slate-400">Last Error:</span>
            <div className="text-xs text-red-400 mt-1 break-words">
              {lastError}
            </div>
          </div>
        )}

        <div className="flex space-x-2 mt-4">
          <button
            onClick={connect}
            disabled={isConnected || isConnecting}
            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all duration-200"
          >
            Connect
          </button>
          <button
            onClick={disconnect}
            disabled={!isConnected && !isConnecting}
            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all duration-200"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignalRTestPage;
