import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Appointments from './pages/Appointments';
import DoctorDashboard from './pages/DoctorDashboard';

// Componente para proteger rutas
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
}

function App() {
  return (
    <div className="App">
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
          path="/doctor/dashboard" 
          element={
            <PrivateRoute>
              <DoctorDashboard />
            </PrivateRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/appointments" />} />
      </Routes>
    </div>
  );
}

export default App; 