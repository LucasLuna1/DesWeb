import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
} from '@mui/material';
import { Cancel as CancelIcon, Add as AddIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('¿Está seguro de cancelar esta cita?')) return;

    try {
      await axios.patch(`http://localhost:5000/api/appointments/${id}/status`, {
        status: 'cancelled',
      });
      loadAppointments();
    } catch (err) {
      setError('Error al cancelar la cita');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Mis Citas
        </Typography>
        {user?.role === 'patient' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/appointments/new')}
          >
            Nueva Cita
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Hora</TableCell>
              <TableCell>{user?.role === 'patient' ? 'Doctor' : 'Paciente'}</TableCell>
              {user?.role === 'patient' && <TableCell>Especialidad</TableCell>}
              <TableCell>Motivo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No hay citas programadas
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    {format(new Date(appointment.date), 'PPP', { locale: es })}
                  </TableCell>
                  <TableCell>{appointment.time}</TableCell>
                  <TableCell>
                    {user?.role === 'patient'
                      ? appointment.doctor.name
                      : appointment.patient.name}
                  </TableCell>
                  {user?.role === 'patient' && (
                    <TableCell>{appointment.doctor.specialty}</TableCell>
                  )}
                  <TableCell>{appointment.reason}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(appointment.status)}
                      color={getStatusColor(appointment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {appointment.status === 'scheduled' && (
                      <IconButton
                        color="error"
                        onClick={() => handleCancelAppointment(appointment.id)}
                        size="small"
                      >
                        <CancelIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Appointments; 