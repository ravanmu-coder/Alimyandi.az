import { useEffect, useRef, useState } from 'react';

interface WebSocketHook {
  isConnected: boolean;
  subscribe: (channel: string, callback: (data: any) => void) => () => void;
  send: (channel: string, data: any) => void;
}

export function useWebSocket(url: string): WebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const subscriptions = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  useEffect(() => {
    const connect = () => {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected');
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
        
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { channel, data } = message;
          
          const callbacks = subscriptions.current.get(channel);
          if (callbacks) {
            callbacks.forEach(callback => callback(data));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  const subscribe = (channel: string, callback: (data: any) => void) => {
    if (!subscriptions.current.has(channel)) {
      subscriptions.current.set(channel, new Set());
    }
    
    subscriptions.current.get(channel)!.add(callback);

    return () => {
      const callbacks = subscriptions.current.get(channel);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          subscriptions.current.delete(channel);
        }
      }
    };
  };

  const send = (channel: string, data: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ channel, data }));
    }
  };

  return { isConnected, subscribe, send };
}