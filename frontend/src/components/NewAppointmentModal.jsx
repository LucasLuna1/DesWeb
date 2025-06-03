import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { endpoints } from '../config/api';

function NewAppointmentModal({ isOpen, onClose }) {
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formData, setFormData] = useState({
    doctorId: '',
    date: '',
    time: '',
    type: 'consultation',
    symptoms: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDoctors();
      // Resetear el formulario cuando se abre el modal
      setFormData({
        doctorId: '',
        date: '',
        time: '',
        type: 'consultation',
        symptoms: ''
      });
      setError('');
    }
  }, [isOpen]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(endpoints.doctors.list);
      console.log('Doctores cargados:', response.data);
      setDoctors(response.data);
    } catch (err) {
      console.error('Error al cargar doctores:', err);
      setError('Error al cargar los doctores');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    
    try {
      setLoading(true);
      // Validar que la fecha sea válida
      const selectedDate = new Date(date);
      if (isNaN(selectedDate.getTime())) {
        throw new Error('Fecha inválida');
      }

      // Asegurarse de que la fecha esté en el formato correcto YYYY-MM-DD
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      const response = await axios.get(endpoints.appointments.available(doctorId, formattedDate));
      setAvailableSlots(response.data || []);
    } catch (err) {
      console.error('Error al cargar horarios:', err);
      setError('Error al cargar los horarios disponibles');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorChange = (e) => {
    const newDoctorId = e.target.value;
    setFormData({
      ...formData,
      doctorId: newDoctorId,
      time: '' // Resetear la hora cuando cambia el doctor
    });
    
    if (formData.date && newDoctorId) {
      loadAvailableSlots(newDoctorId, formData.date);
    }
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setFormData({
      ...formData,
      date: selectedDate,
      time: '' // Resetear la hora cuando cambia la fecha
    });
    if (formData.doctorId && selectedDate) {
      loadAvailableSlots(formData.doctorId, selectedDate);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (!formData.doctorId || !formData.date || !formData.time || !formData.symptoms) {
        setError('Por favor, complete todos los campos requeridos');
        return;
      }

      // Validar que la fecha y hora sean válidas
      const [year, month, day] = formData.date.split('-').map(Number);
      const [hours, minutes] = formData.time.split(':').map(Number);
      
      const appointmentDate = new Date(year, month - 1, day, hours, minutes);
      
      // Validar que la fecha sea válida
      if (isNaN(appointmentDate.getTime())) {
        setError('Fecha u hora inválida');
        return;
      }

      const appointmentData = {
        doctorId: formData.doctorId,
        date: appointmentDate.toISOString(),
        time: formData.time,
        type: formData.type,
        symptoms: formData.symptoms
      };

      await axios.post(endpoints.appointments.create, appointmentData);
      onClose();
    } catch (err) {
      console.error('Error al crear cita:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al programar la cita. Por favor, verifica los datos.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Obtener la fecha mínima (hoy) y máxima (6 meses desde hoy)
  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);

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
              disabled={loading}
            >
              <option value="">Seleccione un doctor</option>
              {doctors.map(doctor => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.user?.name} - {doctor.speciality}
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
              min={today.toISOString().split('T')[0]}
              max={maxDate.toISOString().split('T')[0]}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label>Hora:</label>
            <select
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
              disabled={!availableSlots.length || loading}
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
            <label>Tipo de Consulta:</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
              disabled={loading}
            >
              <option value="consultation">Consulta General</option>
              <option value="first-visit">Primera Visita</option>
              <option value="follow-up">Seguimiento</option>
              <option value="emergency">Emergencia</option>
            </select>
          </div>

          <div>
            <label>Síntomas o Motivo:</label>
            <textarea
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              required
              rows="3"
              disabled={loading}
              placeholder="Describe tus síntomas o el motivo de la consulta"
            />
          </div>

          <div className="modal-buttons">
            <button type="submit" disabled={loading}>
              {loading ? 'Programando...' : 'Programar Cita'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="cancel-button"
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewAppointmentModal; 