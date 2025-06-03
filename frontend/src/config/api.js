import axios from 'axios';

// Usar la variable de entorno o un valor por defecto
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configurar interceptor global para el token
axios.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Helper function to build API endpoints
export const endpoints = {
    auth: {
        login: `${API_URL}/auth/login`,
        register: `${API_URL}/auth/register`,
        me: `${API_URL}/auth/me`
    },
    appointments: {
        list: `${API_URL}/appointments`,
        create: `${API_URL}/appointments`,
        available: (doctorId, date) => `${API_URL}/appointments/available-slots?doctorId=${doctorId}&date=${date}`,
        updateStatus: (id) => `${API_URL}/appointments/${id}/status`
    },
    doctors: {
        list: `${API_URL}/doctors`,
        get: (id) => `${API_URL}/doctors/${id}`
    }
}; 