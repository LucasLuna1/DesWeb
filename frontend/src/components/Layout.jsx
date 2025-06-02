import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function Layout({ children }) {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sistema de Citas Médicas
          </Typography>
          {isAuthenticated ? (
            <Box>
              <Typography component="span" sx={{ mr: 2 }}>
                {user?.name} ({user?.role})
              </Typography>
              <Button color="inherit" onClick={() => navigate('/appointments')}>
                Mis Citas
              </Button>
              {user?.role === 'patient' && (
                <Button color="inherit" onClick={() => navigate('/appointments/new')}>
                  Nueva Cita
                </Button>
              )}
              <Button color="inherit" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </Box>
          ) : (
            <Box>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Iniciar Sesión
              </Button>
              <Button color="inherit" onClick={() => navigate('/register')}>
                Registrarse
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
      <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Sistema de Citas Médicas
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default Layout; 