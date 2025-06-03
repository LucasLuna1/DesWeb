import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { endpoints } from '../config/api';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(endpoints.auth.login, formData);
      const { token, role } = response.data;
      
      // Guardar el token y el rol en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
      
      // Configurar el token para futuras peticiones
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Redirigir al usuario a la página principal
      navigate('/appointments');
    } catch (err) {
      console.error('Error de inicio de sesión:', err);
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="auth-container">
      <h2>Iniciar Sesión</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label>Contraseña:</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>

        <button type="submit">Iniciar Sesión</button>
      </form>
    </div>
  );
}

export default Login; 