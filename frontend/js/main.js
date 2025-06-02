// Variables globales
const API_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user'));

// Funciones de utilidad para mostrar/ocultar secciones
function showSection(sectionId) {
    document.querySelectorAll('.container > div').forEach(div => div.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
}

function updateNavbar() {
    if (token) {
        document.getElementById('loginNav').classList.add('hidden');
        document.getElementById('userNav').classList.remove('hidden');
    } else {
        document.getElementById('loginNav').classList.remove('hidden');
        document.getElementById('userNav').classList.add('hidden');
    }
}

// Funciones de navegación
function showLoginForm() {
    showSection('loginForm');
}

function showRegisterForm() {
    showSection('registerForm');
    setupRegisterForm();
}

function setupRegisterForm() {
    const doctorCheckbox = document.getElementById('registerAsDoctor');
    const doctorFields = document.getElementById('doctorFields');
    const specialtyInput = document.getElementById('registerSpecialty');
    const licenseInput = document.getElementById('registerLicense');

    doctorCheckbox.addEventListener('change', function() {
        doctorFields.classList.toggle('hidden', !this.checked);
        specialtyInput.required = this.checked;
        licenseInput.required = this.checked;
    });
}

function showAppointments() {
    if (!token) {
        showLoginForm();
        return;
    }
    loadAppointments();
    showSection('appointmentsPanel');
}

function showNewAppointmentForm() {
    loadDoctors();
    showSection('newAppointmentForm');
}

// Funciones de autenticación
async function register(event) {
    event.preventDefault();
    
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }

    const registerData = {
        name: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        password: password,
        role: document.getElementById('registerAsDoctor').checked ? 'doctor' : 'patient'
    };

    // Si es doctor, agregar campos adicionales
    if (registerData.role === 'doctor') {
        registerData.specialty = document.getElementById('registerSpecialty').value;
        registerData.license = document.getElementById('registerLicense').value;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error en el registro');
        }

        const data = await response.json();
        token = data.token;
        user = data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        updateNavbar();
        showAppointments();
        
        // Limpiar el formulario
        event.target.reset();
    } catch (error) {
        alert(error.message);
    }
}

async function login(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) throw new Error('Credenciales inválidas');

        const data = await response.json();
        token = data.token;
        user = data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        updateNavbar();
        showAppointments();
    } catch (error) {
        alert(error.message);
    }
}

function logout() {
    token = null;
    user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateNavbar();
    showLoginForm();
}

// Funciones de citas
async function loadAppointments() {
    try {
        const response = await fetch(`${API_URL}/appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const appointments = await response.json();
        displayAppointments(appointments);
    } catch (error) {
        alert('Error al cargar las citas');
    }
}

function displayAppointments(appointments) {
    const list = document.getElementById('appointmentsList');
    list.innerHTML = '';

    if (appointments.length === 0) {
        list.innerHTML = '<p>No hay citas programadas</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>${user.role === 'patient' ? 'Doctor' : 'Paciente'}</th>
                <th>Estado</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            ${appointments.map(apt => `
                <tr>
                    <td>${new Date(apt.date).toLocaleDateString()}</td>
                    <td>${apt.time}</td>
                    <td>${user.role === 'patient' ? apt.doctor.name : apt.patient.name}</td>
                    <td>${apt.status}</td>
                    <td>
                        ${apt.status === 'scheduled' ? 
                            `<button class="btn btn-sm btn-danger" onclick="cancelAppointment(${apt.id})">
                                Cancelar
                            </button>` : 
                            ''}
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;
    list.appendChild(table);
}

async function loadDoctors() {
    try {
        const response = await fetch(`${API_URL}/doctors`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const doctors = await response.json();
        const select = document.getElementById('doctorSelect');
        select.innerHTML = '<option value="">Seleccione un doctor</option>' +
            doctors.map(doctor => 
                `<option value="${doctor.id}">Dr. ${doctor.name}</option>`
            ).join('');
    } catch (error) {
        alert('Error al cargar los doctores');
    }
}

async function createAppointment(event) {
    event.preventDefault();
    const doctorId = document.getElementById('doctorSelect').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const reason = document.getElementById('appointmentReason').value;

    try {
        const response = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ doctorId, date, time, reason })
        });

        if (!response.ok) throw new Error('Error al crear la cita');

        showAppointments();
    } catch (error) {
        alert(error.message);
    }
}

async function cancelAppointment(appointmentId) {
    if (!confirm('¿Está seguro de cancelar esta cita?')) return;

    try {
        const response = await fetch(`${API_URL}/appointments/${appointmentId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'cancelled' })
        });

        if (!response.ok) throw new Error('Error al cancelar la cita');

        loadAppointments();
    } catch (error) {
        alert(error.message);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    updateNavbar();
    if (token) {
        showAppointments();
    } else {
        showLoginForm();
    }
}); 