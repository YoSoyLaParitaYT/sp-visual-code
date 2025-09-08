// SP Visual Code - Frontend JavaScript
class SPVisualCode {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        this.setupEventListeners();
        this.updateUI();
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            this.isAuthenticated = data.authenticated;
            this.user = data.user;
        } catch (error) {
            console.error('Error verificando estado de autenticación:', error);
        }
    }

    updateUI() {
        const loginButtons = document.getElementById('login-buttons');
        const userMenu = document.getElementById('user-menu');
        const username = document.getElementById('username');
        const adminLink = document.getElementById('admin-link');

        if (this.isAuthenticated && this.user) {
            loginButtons.style.display = 'none';
            userMenu.style.display = 'block';
            username.textContent = this.user.username || this.user.email;
            
            // Mostrar enlace admin solo al administrador
            if (this.user.email === 'ivanaristidedejesus01@gmail.com') {
                adminLink.style.display = 'block';
            }
        } else {
            loginButtons.style.display = 'flex';
            userMenu.style.display = 'none';
        }
    }

    setupEventListeners() {
        // Cerrar modales al hacer clic fuera
        window.onclick = (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        };

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.user-menu')) {
                document.getElementById('user-dropdown').style.display = 'none';
            }
        });
    }

    // Funciones de autenticación
    async loginWithEmail(event) {
        event.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (data.success) {
                this.showMessage('¡Inicio de sesión exitoso!', 'success');
                await this.checkAuthStatus();
                this.updateUI();
                this.closeModal('loginModal');
            } else {
                this.showMessage(data.error || 'Error al iniciar sesión', 'error');
            }
        } catch (error) {
            this.showMessage('Error de conexión', 'error');
        }
    }

    async registerWithEmail(event) {
        event.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            if (data.success) {
                this.showMessage('¡Cuenta creada exitosamente!', 'success');
                await this.checkAuthStatus();
                this.updateUI();
                this.closeModal('registerModal');
            } else {
                this.showMessage(data.error || 'Error al crear cuenta', 'error');
            }
        } catch (error) {
            this.showMessage('Error de conexión', 'error');
        }
    }

    loginWithDiscord() {
        window.location.href = '/api/auth/discord';
    }

    async logout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST'
            });

            if (response.ok) {
                this.isAuthenticated = false;
                this.user = null;
                this.updateUI();
                this.showMessage('Sesión cerrada exitosamente', 'success');
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }

    // Funciones de UI
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    toggleUserDropdown() {
        const dropdown = document.getElementById('user-dropdown');
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }

    switchToRegister() {
        this.closeModal('loginModal');
        this.showModal('registerModal');
    }

    switchToLogin() {
        this.closeModal('registerModal');
        this.showModal('loginModal');
    }

    showMessage(message, type = 'info') {
        // Crear y mostrar notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Estilos para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--primary-color)'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            z-index: 3000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    startCoding() {
        if (this.isAuthenticated) {
            window.location.href = '/editor';
        } else {
            this.showModal('loginModal');
        }
    }

    learnMore() {
        // Scroll suave a la sección de características
        document.querySelector('.features').scrollIntoView({
            behavior: 'smooth'
        });
    }

    // Funciones de proyectos
    async loadProjects() {
        if (!this.isAuthenticated) return;

        try {
            const response = await fetch('/api/projects');
            const projects = await response.json();
            return projects;
        } catch (error) {
            console.error('Error cargando proyectos:', error);
            return [];
        }
    }

    async createProject(name, code = '') {
        if (!this.isAuthenticated) {
            this.showMessage('Debes iniciar sesión para crear proyectos', 'error');
            return;
        }

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, code })
            });

            const data = await response.json();
            if (response.ok) {
                this.showMessage('¡Proyecto creado exitosamente!', 'success');
                return data;
            } else {
                this.showMessage(data.error || 'Error al crear proyecto', 'error');
            }
        } catch (error) {
            this.showMessage('Error de conexión', 'error');
        }
    }
}

// Funciones globales para los event handlers del HTML
let spApp;

window.onload = () => {
    spApp = new SPVisualCode();
};

function showLoginModal() {
    spApp.showModal('loginModal');
}

function showRegisterModal() {
    spApp.showModal('registerModal');
}

function closeModal(modalId) {
    spApp.closeModal(modalId);
}

function loginWithEmail(event) {
    return spApp.loginWithEmail(event);
}

function registerWithEmail(event) {
    return spApp.registerWithEmail(event);
}

function loginWithDiscord() {
    spApp.loginWithDiscord();
}


function logout() {
    spApp.logout();
}

function toggleUserDropdown() {
    spApp.toggleUserDropdown();
}

function switchToRegister() {
    spApp.switchToRegister();
}

function switchToLogin() {
    spApp.switchToLogin();
}

function startCoding() {
    spApp.startCoding();
}

function learnMore() {
    spApp.learnMore();
}

// Utilidades globales
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function generateRandomId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function sanitizeString(str) {
    return str.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
}

// Prevenir comportamientos por defecto en formularios
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        if (!form.onsubmit) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
            });
        }
    });
});