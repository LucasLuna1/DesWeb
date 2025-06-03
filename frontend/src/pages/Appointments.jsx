import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NewAppointmentModal from '../components/NewAppointmentModal';

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
    } else {
      // Si no hay usuario, redirigir al login
      navigate('/login');
    }
  }, [navigate]);

  const loadAppointments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/appointments');
      setAppointments(response.data);
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

  const handleCompleteAppointment = async (id) => {
    if (!window.confirm('¿Confirmar que la cita fue completada?')) return;
    handleStatusChange(id, 'completed');
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Programada';
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
      <h2>{userRole === 'doctor' ? 'Mis Consultas' : 'Mis Citas'}</h2>
      <div className="appointments-list">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {appointments.length === 0 ? (
          <p>No hay citas programadas</p>
        ) : (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>{userRole === 'doctor' ? 'Paciente' : 'Doctor'}</th>
                {userRole === 'patient' && <th>Especialidad</th>}
                <th>Motivo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{formatDate(appointment.date)}</td>
                  <td>{appointment.time}</td>
                  <td>
                    {userRole === 'doctor' 
                      ? appointment.patient.name 
                      : `Dr. ${appointment.doctor.name}`}
                  </td>
                  {userRole === 'patient' && (
                    <td>{appointment.doctor.specialty}</td>
                  )}
                  <td>{appointment.reason}</td>
                  <td>
                    <span className={`status-badge ${appointment.status}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </td>
                  <td>
                    {appointment.status === 'scheduled' && (
                      <div className="appointment-status-controls">
                        {userRole === 'doctor' && (
                          <button 
                            className="status-button complete"
                            onClick={() => handleCompleteAppointment(appointment.id)}
                          >
                            Completar
                          </button>
                        )}
                        <button 
                          className="status-button cancel"
                          onClick={() => handleCancelAppointment(appointment.id)}
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
      <div className="nav-buttons">
        {userRole === 'patient' && (
          <button onClick={() => setIsModalOpen(true)}>
            Nueva Cita
          </button>
        )}
        <button onClick={() => {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          navigate('/login');
        }}>
          Cerrar Sesión
        </button>
      </div>

      {userRole === 'patient' && (
        <NewAppointmentModal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            loadAppointments();
          }}
        />
      )}
    </div>
  );
}

export default Appointments; 