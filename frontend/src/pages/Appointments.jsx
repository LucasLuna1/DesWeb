import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NewAppointmentModal from '../components/NewAppointmentModal';
import '../styles/Appointments.css';

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Obtener el rol del usuario del localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role);
      
      // Si es doctor, redirigir al dashboard
      if (user.role === 'doctor') {
        navigate('/doctor/dashboard');
        return;
      }
    } else {
      // Si no hay usuario, redirigir al login
      navigate('/login');
    }
  }, [navigate]);

  const loadAppointments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/appointments');
      // Ordenar citas por fecha, las más recientes primero
      const sortedAppointments = response.data.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setAppointments(sortedAppointments);
    } catch (err) {
      setError('Error al cargar las citas');
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/appointments/${appointmentId}/status`, {
        status: newStatus,
      });
      loadAppointments();
    } catch (err) {
      setError('Error al actualizar el estado de la cita');
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('¿Está seguro de cancelar esta cita?')) return;
    handleStatusChange(id, 'cancelled');
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmada';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h2>Mis Citas Médicas</h2>
        <div className="nav-buttons">
          <button onClick={() => setIsModalOpen(true)}>
            + Nueva Cita
          </button>
          <button onClick={() => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            navigate('/login');
          }}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="appointments-list">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {appointments.length === 0 ? (
          <div className="no-appointments">
            <p>No tienes citas programadas</p>
            <p>¡Programa tu primera cita haciendo click en "Nueva Cita"!</p>
          </div>
        ) : (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Doctor</th>
                <th>Especialidad</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td>{formatDate(appointment.date)}</td>
                  <td>{appointment.time}</td>
                  <td>
                    Dr. {appointment.doctor?.user?.name || 'No asignado'}
                  </td>
                  <td>{appointment.doctor?.speciality || 'No especificada'}</td>
                  <td>{appointment.symptoms}</td>
                  <td>
                    <span className={`status-badge ${appointment.status}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </td>
                  <td>
                    {appointment.status !== 'cancelled' && 
                     appointment.status !== 'completed' && (
                      <div className="appointment-status-controls">
                        <button 
                          className="status-button cancel"
                          onClick={() => handleCancelAppointment(appointment._id)}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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