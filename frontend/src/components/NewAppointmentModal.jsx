import React, { useState, useEffect } from 'react';
import axios from 'axios';

function NewAppointmentModal({ isOpen, onClose }) {
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formData, setFormData] = useState({
    doctorId: '',
    date: '',
    time: '',
    reason: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // Cargar lista de doctores cuando se abre el modal
    if (isOpen) {
      loadDoctors();
    }
  }, [isOpen]);

  const loadDoctors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/doctors');
      setDoctors(response.data);
    } catch (err) {
      setError('Error al cargar los doctores');
    }
  };

  const loadAvailableSlots = async (doctorId, date) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/appointments/available?doctorId=${doctorId}&date=${date}`);
      setAvailableSlots(response.data);
    } catch (err) {
      setError('Error al cargar los horarios disponibles');
    }
  };

  const handleDoctorChange = (e) => {
    setFormData({
      ...formData,
      doctorId: e.target.value,
      time: '' // Resetear la hora cuando cambia el doctor
    });
    if (formData.date) {
      loadAvailableSlots(e.target.value, formData.date);
    }
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setFormData({
      ...formData,
      date: selectedDate,
      time: '' // Resetear la hora cuando cambia la fecha
    });
    if (formData.doctorId) {
      loadAvailableSlots(formData.doctorId, selectedDate);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/appointments', formData);
      onClose();
      // Aquí podrías actualizar la lista de citas
    } catch (err) {
      setError('Error al programar la cita');
    }
  };

  if (!isOpen) return null;

  // Obtener la fecha mínima (hoy) en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Programar Nueva Cita</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div>
            <label>Doctor:</label>
            <select 
              value={formData.doctorId} 
              onChange={handleDoctorChange}
              required
            >
              <option value="">Seleccione un doctor</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.name} - {doctor.specialty}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Fecha:</label>
            <input
              type="date"
              value={formData.date}
              onChange={handleDateChange}
              min={today}
              required
            />
          </div>

          <div>
            <label>Hora:</label>
            <select
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
              disabled={!availableSlots.length}
            >
              <option value="">Seleccione un horario</option>
              {availableSlots.map(slot => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Motivo de la consulta:</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              rows="3"
            />
          </div>

          <div className="modal-buttons">
            <button type="submit">Programar Cita</button>
            <button type="button" onClick={onClose} className="cancel-button">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewAppointmentModal; 