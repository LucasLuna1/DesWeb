import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { endpoints } from '../config/api';
import NewAppointmentModal from './NewAppointmentModal';
import { useNavigate } from 'react-router-dom';

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('userRole');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadAppointments();
  }, [navigate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Obtener el token actualizado
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Configurar el token en el header
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get(endpoints.appointments.list, config);
      
      if (!response.data) {
        throw new Error('No se recibieron datos del servidor');
      }
      
      setAppointments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error al cargar citas:', err);
      if (err.response) {
        // Error con respuesta del servidor
        if (err.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          navigate('/login');
          return;
        }
        setError(`Error al cargar las citas: ${err.response.data?.message || 'Error del servidor'}`);
      } else if (err.request) {
        // Error de conexión
        setError('No se pudo conectar con el servidor. Por favor, verifica tu conexión.');
      } else {
        // Otros errores
        setError('Error al cargar las citas. Por favor, intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.patch(
        endpoints.appointments.updateStatus(appointmentId), 
        { status: newStatus },
        config
      );
      await loadAppointments();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      if (err.response) {
        setError(`Error al actualizar el estado: ${err.response.data?.message || 'Error del servidor'}`);
      } else {
        setError('Error al actualizar el estado. Por favor, intenta de nuevo.');
      }
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (err) {
      console.error('Error al formatear fecha:', err);
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <div className="appointments-container">
        <h2>Mis Citas</h2>
        <div className="loading-message">Cargando citas...</div>
      </div>
    );
  }

  return (
    <div className="appointments-container">
      <h2>Mis Citas</h2>
      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadAppointments} className="retry-button">
            Intentar de nuevo
          </button>
        </div>
      )}
      
      {userRole === 'patient' && (
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="new-appointment-button"
          disabled={loading}
        >
          Programar Nueva Cita
        </button>
      )}

      <div className="appointments-list">
        {appointments.length === 0 && !error ? (
          <div className="no-appointments-message">
            No hay citas programadas.
          </div>
        ) : (
          appointments.map(appointment => (
            <div key={appointment._id} className="appointment-card">
              <div className="appointment-info">
                <p><strong>Doctor:</strong> Dr. {appointment.doctor?.user?.name || 'No disponible'}</p>
                <p><strong>Especialidad:</strong> {appointment.doctor?.speciality || 'No especificada'}</p>
                <p><strong>Fecha:</strong> {formatDate(appointment.date)}</p>
                <p><strong>Hora:</strong> {appointment.time}</p>
                <p><strong>Tipo:</strong> {appointment.type || 'No especificado'}</p>
                <p><strong>Síntomas:</strong> {appointment.symptoms || 'No especificados'}</p>
                <p><strong>Estado:</strong> {appointment.status || 'Pendiente'}</p>
                <p><strong>Costo:</strong> ${appointment.fee || 0}</p>
              </div>

              {userRole === 'doctor' && appointment.status === 'pending' && (
                <div className="appointment-actions">
                  <button 
                    onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                    className="approve-button"
                    disabled={loading}
                  >
                    Confirmar
                  </button>
                  <button 
                    onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                    className="reject-button"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <NewAppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          loadAppointments();
        }}
      />
    </div>
  );
}

export default Appointments; 