import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from '@mui/material';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Appointments from './pages/Appointments';
import NewAppointment from './pages/NewAppointment';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/appointments"
              element={
                <PrivateRoute>
                  <Appointments />
                </PrivateRoute>
              }
            />
            <Route
              path="/appointments/new"
              element={
                <PrivateRoute>
                  <NewAppointment />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/appointments" replace />} />
          </Routes>
        </Container>
      </Layout>
    </AuthProvider>
  );
}

export default App; 