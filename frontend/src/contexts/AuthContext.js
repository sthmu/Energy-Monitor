import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Set auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get user data
        const response = await axios.get('/api/auth/me');
        setUser(response.data);
        setIsAuthenticated(true);
        setLoading(false);
      } catch (err) {
        console.error('Auth check error:', err);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login user
  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      setUser({
        id: res.data.userId,
        name: res.data.name,
        email: res.data.email
      });
      
      setIsAuthenticated(true);
      setError(null);
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return { 
        success: false, 
        message: err.response?.data?.message || 'Login failed',
        userId: err.response?.data?.userId
      };
    }
  };

  // Register user
  const register = async (name, email, password) => {
    try {
      const res = await axios.post('/api/auth/register', { name, email, password });
      setError(null);
      return { 
        success: true, 
        message: res.data.message,
        userId: res.data.userId
      };
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return { 
        success: false, 
        message: err.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Verify OTP
  const verifyOTP = async (userId, otp) => {
    try {
      const res = await axios.post('/api/auth/verify-otp', { userId, otp });
      
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      setUser({
        id: res.data.userId,
        name: res.data.name,
        email: res.data.email
      });
      
      setIsAuthenticated(true);
      setError(null);
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
      return { 
        success: false, 
        message: err.response?.data?.message || 'OTP verification failed'
      };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setError(null);
      return { 
        success: true, 
        message: res.data.message,
        userId: res.data.userId
      };
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset request failed');
      return { 
        success: false, 
        message: err.response?.data?.message || 'Password reset request failed'
      };
    }
  };

  // Reset password
  const resetPassword = async (userId, otp, newPassword) => {
    try {
      const res = await axios.post('/api/auth/reset-password', { userId, otp, newPassword });
      setError(null);
      return { success: true, message: res.data.message };
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
      return { 
        success: false, 
        message: err.response?.data?.message || 'Password reset failed'
      };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        register,
        verifyOTP,
        forgotPassword,
        resetPassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};