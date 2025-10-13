import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { apiClient } from '../lib/api';
import { AuthResponseDto, LoginDto, RegisterDto } from '../types/api';

interface AuthContextType {
  user: AuthResponseDto | null;
  login: (credentials: LoginDto) => Promise<void>;
  register: (userData: RegisterDto) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        // Set token in apiClient
        apiClient.setToken(token);
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginDto) => {
    try {
      const response = await apiClient.login(credentials);
      
      // Set token in localStorage and apiClient
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        apiClient.setToken(response.token);
      }
      
      setUser(response);
      localStorage.setItem('user_data', JSON.stringify(response));
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: RegisterDto) => {
    try {
      console.log('useAuth - Register data:', userData);
      const response = await apiClient.register(userData);
      console.log('useAuth - Register response:', response);
      
      // Set token in localStorage and apiClient
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        apiClient.setToken(response.token);
      }
      
      setUser(response);
      localStorage.setItem('user_data', JSON.stringify(response));
      console.log('useAuth - User set to:', response);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logoutApi();
    } catch (_) {
      // ignore network errors on logout
    } finally {
      setUser(null);
      apiClient.clearToken();
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


