import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { endpoints } from '../config/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import '../styles/DoctorDashboard.css';

function AppointmentDetailsModal({ appointment, onClose, onAccept, onReject, isLoading }) {
  if (!appointment) return null;

  const formattedDate = format(new Date(appointment.date), 'PPP', { locale: es });
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="close-button">&times;</button>
        <h2>Detalles de la Cita</h2>
        
        <div className="appointment-details">
          <div className="detail-group">
            <label>Paciente:</label>
            <p>{appointment.patient?.name}</p>
          </div>
          
          <div className="detail-group">
            <label>Fecha:</label>
            <p>{formattedDate}</p>
          </div>
          
          <div className="detail-group">
            <label>Hora:</label>
            <p>{appointment.time}</p>
          </div>
          
          <div className="detail-group">
            <label>Tipo de Consulta:</label>
            <p>{appointment.type === 'emergency' ? 'Urgencia' :
               appointment.type === 'first-visit' ? 'Primera Visita' :
               appointment.type === 'follow-up' ? 'Seguimiento' : 'Consulta General'}</p>
          </div>
          
          <div className="detail-group">
            <label>Motivo/Síntomas:</label>
            <p>{appointment.symptoms}</p>
          </div>
        </div>

        <div className="modal-buttons">
          <button 
            onClick={onAccept}
            disabled={isLoading}
            className="accept-button"
          >
            {isLoading ? 'Procesando...' : 'Aceptar Cita'}
          </button>
          <button 
            onClick={onReject}
            disabled={isLoading}
            className="reject-button"
          >
            {isLoading ? 'Procesando...' : 'Rechazar Cita'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmedAppointmentModal({ appointment, onClose, onComplete, isLoading }) {
  if (!appointment) return null;

  const formattedDate = format(new Date(appointment.date), 'PPP', { locale: es });
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="close-button">&times;</button>
        <h2>Detalles de la Consulta</h2>
        
        <div className="appointment-details">
          <div className="detail-group">
            <label>Paciente:</label>
            <p>{appointment.patient?.name}</p>
          </div>
          
          <div className="detail-group">
            <label>Fecha:</label>
            <p>{formattedDate}</p>
          </div>
          
          <div className="detail-group">
            <label>Hora:</label>
            <p>{appointment.time}</p>
          </div>
          
          <div className="detail-group">
            <label>Tipo de Consulta:</label>
            <p>{appointment.type === 'emergency' ? 'Urgencia' :
               appointment.type === 'first-visit' ? 'Primera Visita' :
               appointment.type === 'follow-up' ? 'Seguimiento' : 'Consulta General'}</p>
          </div>
          
          <div className="detail-group">
            <label>Motivo/Síntomas:</label>
            <p>{appointment.symptoms}</p>
          </div>
        </div>

        <div className="modal-buttons">
          <button 
            onClick={onComplete}
            disabled={isLoading}
            className="complete-button"
          >
            {isLoading ? 'Procesando...' : 'Marcar como Atendida'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppointmentList({ title, appointments, onAppointmentClick }) {
  return (
    <div className="appointments-list">
      <h3>{title}</h3>
      {appointments.length === 0 ? (
        <p className="no-appointments">No hay citas {title.toLowerCase()}</p>
      ) : (
        <div className="appointments-grid">
          {appointments.map(appointment => (
            <div 
              key={appointment._id} 
              className="appointment-card"
              onClick={() => onAppointmentClick(appointment)}
            >
              <div className="patient-name">{appointment.patient?.name}</div>
              <div className="appointment-date">
                {format(new Date(appointment.date), 'PPP', { locale: es })}
              </div>
              <div className="appointment-time">{appointment.time}</div>
              <div className={`appointment-type ${appointment.type}`}>
                {appointment.type === 'emergency' ? '🚨 Urgencia' :
                 appointment.type === 'first-visit' ? '👋 Primera Visita' :
                 appointment.type === 'follow-up' ? '📋 Seguimiento' : '👨‍⚕️ Consulta General'}
              </div>
              {appointment.status === 'confirmed' && (
                <div className="appointment-status">
                  ✅ Confirmada
                </div>
              )}
              {appointment.status === 'completed' && (
                <div className="appointment-status completed">
                  ✨ Atendida
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DoctorDashboard() {
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [confirmedAppointments, setConfirmedAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(endpoints.appointments.list);
      
      // Ordenar por fecha y separar por estado
      const sorted = response.data.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
      
      setPendingAppointments(sorted.filter(apt => apt.status === 'pending'));
      setConfirmedAppointments(sorted.filter(apt => 
        ['confirmed', 'completed'].includes(apt.status)
      ));
    } catch (err) {
      console.error('Error al cargar citas:', err);
      setError('Error al cargar las citas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleAccept = async () => {
    try {
      setIsLoading(true);
      await axios.patch(
        endpoints.appointments.updateStatus(selectedAppointment._id),
        { status: 'confirmed' }
      );
      await loadAppointments();
      setSelectedAppointment(null);
    } catch (err) {
      console.error('Error al aceptar cita:', err);
      setError('Error al aceptar la cita');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsLoading(true);
      await axios.patch(
        endpoints.appointments.updateStatus(selectedAppointment._id),
        { status: 'cancelled' }
      );
      await loadAppointments();
      setSelectedAppointment(null);
    } catch (err) {
      console.error('Error al rechazar cita:', err);
      setError('Error al rechazar la cita');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      await axios.patch(
        endpoints.appointments.updateStatus(selectedAppointment._id),
        { status: 'completed' }
      );
      await loadAppointments();
      setSelectedAppointment(null);
    } catch (err) {
      console.error('Error al marcar cita como completada:', err);
      setError('Error al marcar la cita como completada');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="doctor-dashboard">
      <div className="dashboard-header">
        <h2>Panel del Doctor</h2>
        <button onClick={handleLogout} className="logout-button">
          Cerrar Sesión
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="appointments-container">
        <AppointmentList
          title="Citas Pendientes"
          appointments={pendingAppointments}
          onAppointmentClick={handleAppointmentClick}
        />
        
        <AppointmentList
          title="Citas Confirmadas"
          appointments={confirmedAppointments}
          onAppointmentClick={handleAppointmentClick}
        />
      </div>

      {selectedAppointment && selectedAppointment.status === 'pending' && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onAccept={handleAccept}
          onReject={handleReject}
          isLoading={isLoading}
        />
      )}

      {selectedAppointment && selectedAppointment.status === 'confirmed' && (
        <ConfirmedAppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onComplete={handleComplete}
          isLoading={isLoading}
        />
      )}

      {selectedAppointment && selectedAppointment.status === 'completed' && (
        <ConfirmedAppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export default DoctorDashboard; 