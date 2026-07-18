// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, Paper } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', username);
        onLoginSuccess();
      } else {
        setError(data.detail || 'Giriş başarısız!');
      }
    } catch (err) {
      setError('Sistem Hatası: Backend API sunucusuna erişilemedi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="flex h-screen w-screen items-center justify-center bg-slate-900 select-none">
      <Paper elevation={12} className="w-full max-w-md p-8 rounded-2xl border border-slate-700 bg-slate-800 text-slate-100 shadow-2xl">
        <Box className="flex flex-col items-center mb-6">
          <Box className="p-3 bg-blue-600 rounded-full mb-3 text-white shadow-lg shadow-blue-500/30">
            <LockOutlinedIcon fontSize="medium" />
          </Box>
          <Typography variant="h5" className="font-bold text-white tracking-wide">
            F5 NetOps AI Platform
          </Typography>
          <Typography variant="body2" className="text-slate-400 mt-1">
            Lütfen kurumsal kimlik bilgilerinizle giriş yapın.
          </Typography>
        </Box>

        {error && <Alert severity="error" className="mb-4 rounded-lg bg-red-950/40 text-red-200 border border-red-800/50">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            fullWidth
            label="Kullanıcı Adı"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            InputProps={{ className: 'text-slate-100' }}
            InputLabelProps={{ className: 'text-slate-400' }}
            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#475569' }, '&:hover fieldset': { borderColor: '#3b82f6' } } }}
          />
          <TextField
            fullWidth
            label="Şifre"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            InputProps={{ className: 'text-slate-100' }}
            InputLabelProps={{ className: 'text-slate-400' }}
            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#475569' }, '&:hover fieldset': { borderColor: '#3b82f6' } } }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            className="py-3 mt-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg"
          >
            {loading ? 'Doğrulanıyor...' : 'Sisteme Giriş Yap'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
