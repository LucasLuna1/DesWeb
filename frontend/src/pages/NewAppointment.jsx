import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useFormik } from 'formik';
import * as yup from 'yup';
import axios from 'axios';
import { addDays, format } from 'date-fns';

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

const validationSchema = yup.object({
  doctorId: yup.number().required('Seleccione un doctor'),
  date: yup.date()
    .min(new Date(), 'La fecha debe ser futura')
    .max(addDays(new Date(), 30), 'La fecha no puede ser más de 30 días en el futuro')
    .required('Seleccione una fecha'),
  time: yup.string().required('Seleccione una hora'),
  reason: yup.string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .required('Ingrese el motivo de la consulta'),
});

function NewAppointment() {
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/doctors');
        setDoctors(response.data);
      } catch (err) {
        setError('Error al cargar la lista de doctores');
      }
    };
    loadDoctors();
  }, []);

  const formik = useFormik({
    initialValues: {
      doctorId: '',
      date: null,
      time: '',
      reason: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        const appointmentData = {
          doctorId: values.doctorId,
          date: format(values.date, 'yyyy-MM-dd'),
          time: values.time,
          reason: values.reason,
        };

        await axios.post('http://localhost:5000/api/appointments', appointmentData);
        navigate('/appointments');
      } catch (err) {
        setError(err.response?.data?.message || 'Error al crear la cita');
      }
    },
  });

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 600,
        }}
      >
        <Typography variant="h5" component="h1" align="center" gutterBottom>
          Agendar Nueva Cita
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="doctor-label">Doctor</InputLabel>
                <Select
                  labelId="doctor-label"
                  id="doctorId"
                  name="doctorId"
                  value={formik.values.doctorId}
                  onChange={formik.handleChange}
                  error={formik.touched.doctorId && Boolean(formik.errors.doctorId)}
                  label="Doctor"
                >
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.name} - {doctor.specialty}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha"
                value={formik.values.date}
                onChange={(value) => formik.setFieldValue('date', value)}
                minDate={new Date()}
                maxDate={addDays(new Date(), 30)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.date && Boolean(formik.errors.date),
                    helperText: formik.touched.date && formik.errors.date
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="time-label">Hora</InputLabel>
                <Select
                  labelId="time-label"
                  id="time"
                  name="time"
                  value={formik.values.time}
                  onChange={formik.handleChange}
                  error={formik.touched.time && Boolean(formik.errors.time)}
                  label="Hora"
                >
                  {timeSlots.map((time) => (
                    <MenuItem key={time} value={time}>
                      {time}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="reason"
                name="reason"
                label="Motivo de la consulta"
                multiline
                rows={4}
                value={formik.values.reason}
                onChange={formik.handleChange}
                error={formik.touched.reason && Boolean(formik.errors.reason)}
                helperText={formik.touched.reason && formik.errors.reason}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  onClick={() => navigate('/appointments')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                >
                  Agendar Cita
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}

export default NewAppointment; 