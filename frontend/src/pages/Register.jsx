import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { endpoints } from '../config/api';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient', // por defecto es paciente
    specialty: '', // solo para doctores
    licenseNumber: '' // solo para doctores
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const dataToSend = { ...formData };
      if (formData.role === 'patient') {
        // Si es paciente, eliminamos los campos de doctor
        delete dataToSend.specialty;
        delete dataToSend.licenseNumber;
      } else if (!dataToSend.specialty || !dataToSend.licenseNumber) {
        setError('Por favor complete todos los campos requeridos');
        return;
      }

      const response = await axios.post(endpoints.auth.register, dataToSend);
      console.log('Registro exitoso:', response.data);
      
      // Redirigir al login
      navigate('/login');
    } catch (error) {
      console.error('Error en el registro:', error);
      setError(
        error.response?.data?.message || 
        'Error en el registro. Por favor intente nuevamente.'
      );
    }
  };

  return (
    <div className="register-container">
      <h2>Registro</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre completo:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            minLength={3}
            placeholder="Ingrese su nombre completo"
          />
        </div>

        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="ejemplo@correo.com"
          />
        </div>

        <div>
          <label>Contraseña:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div className="role-selector">
          <label>Tipo de usuario:</label>
          <div className="role-buttons">
            <button
              type="button"
              className={`role-button ${formData.role === 'patient' ? 'active' : ''}`}
              onClick={() => handleChange({ target: { name: 'role', value: 'patient' } })}
            >
              Paciente
            </button>
            <button
              type="button"
              className={`role-button ${formData.role === 'doctor' ? 'active' : ''}`}
              onClick={() => handleChange({ target: { name: 'role', value: 'doctor' } })}
            >
              Doctor
            </button>
          </div>
        </div>

        {formData.role === 'doctor' && (
          <>
            <div>
              <label>Especialidad:</label>
              <select
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                required={formData.role === 'doctor'}
              >
                <option value="">Seleccione una especialidad</option>
                <option value="Medicina General">Medicina General</option>
                <option value="Pediatría">Pediatría</option>
                <option value="Cardiología">Cardiología</option>
                <option value="Dermatología">Dermatología</option>
                <option value="Ginecología">Ginecología</option>
                <option value="Traumatología">Traumatología</option>
              </select>
            </div>

            <div>
              <label>Número de Licencia:</label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                required={formData.role === 'doctor'}
                placeholder="Ej: MED-12345"
                pattern="^[A-Z]+-\d{5}$"
                title="Formato: XXX-12345"
              />
            </div>
          </>
        )}

        <button type="submit">Registrarse</button>
      </form>

      <p>
        ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
      </p>
    </div>
  );
}

export default Register; 