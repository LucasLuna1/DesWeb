export const API_URL = 'http://localhost:3000/api';

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
        available: (doctorId, date) => `${API_URL}/appointments/available?doctorId=${doctorId}&date=${date}`,
        updateStatus: (id) => `${API_URL}/appointments/${id}/status`
    },
    doctors: {
        list: `${API_URL}/doctors`,
        get: (id) => `${API_URL}/doctors/${id}`
    }
}; 