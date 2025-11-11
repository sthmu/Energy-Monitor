import React, { useState, useContext } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Link
} from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const { forgotPassword } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Simple validation
    if (!email) {
      setError('Email is required');
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await forgotPassword(email);
      
      if (result.success) {
        setUserId(result.userId);
        setSubmitted(true);
      } else {
        setError(result.message || 'Password reset request failed');
      }
    } catch (err) {
      setError('An error occurred during password reset request');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToReset = () => {
    navigate('/reset-password', { state: { userId, email } });
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 8
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          {!submitted ? (
            <>
              <Typography component="h1" variant="h4" align="center" gutterBottom>
                Forgot Password
              </Typography>
              <Typography variant="body1" align="center" paragraph>
                Enter your email address and we'll send you an OTP to reset your password.
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset OTP'}
                </Button>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Link component={RouterLink} to="/login" variant="body2">
                    Return to Login
                  </Link>
                </Box>
              </Box>
            </>
          ) : (
            <>
              <Typography component="h1" variant="h4" align="center" gutterBottom>
                OTP Sent
              </Typography>
              <Typography variant="body1" align="center" paragraph>
                We've sent a verification code to {email}.
              </Typography>
              <Typography variant="body1" align="center" paragraph>
                Please check your email and continue to the next step to reset your password.
              </Typography>
              
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={handleNavigateToReset}
              >
                Continue to Reset Password
              </Button>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Link component={RouterLink} to="/login" variant="body2">
                  Return to Login
                </Link>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;