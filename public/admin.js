// SP Visual Code - Admin Panel JavaScript
class SPAdmin {
    constructor() {
        this.users = [];
        this.projects = [];
        this.warnings = [];
        this.gifts = [];
        this.reports = [];
        this.analytics = {};
        this.currentSection = 'users';
        this.init();
    }

    async init() {
        await this.checkAdminAccess();
        await this.loadDashboardData();
        this.showSection('users');
        this.setupEventListeners();
    }

    async checkAdminAccess() {
        // Admin access is now controlled by the access code modal
    }

    async loadDashboardData() {
        try {
            await this.loadUsers();
            await this.loadProjects();
            await this.loadWarnings();
            await this.loadGifts();
            await this.loadReports();
            await this.loadAnalytics();
            this.updateStats();
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
        }
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                this.users = await response.json();
                this.renderUsers();
                this.populateUserSelects();
            }
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        }
    }

    async loadProjects() {
        try {
            const response = await fetch('/api/admin/projects');
            if (response.ok) {
                this.projects = await response.json();
                this.renderAdminProjects();
            }
        } catch (error) {
            console.error('Error cargando proyectos:', error);
            this.projects = [];
        }
    }

    async loadWarnings() {
        try {
            const response = await fetch('/api/admin/warnings');
            if (response.ok) {
                this.warnings = await response.json();
                this.renderWarnings();
            }
        } catch (error) {
            console.error('Error cargando advertencias:', error);
        }
    }

    async loadGifts() {
        try {
            const response = await fetch('/api/admin/gifts');
            if (response.ok) {
                this.gifts = await response.json();
                this.renderGifts();
            }
        } catch (error) {
            console.error('Error cargando regalos:', error);
        }
    }

    async loadReports() {
        try {
            const response = await fetch('/api/admin/reports');
            if (response.ok) {
                this.reports = await response.json();
                this.renderReports();
            }
        } catch (error) {
            console.error('Error cargando reportes:', error);
        }
    }

    async loadAnalytics() {
        try {
            const response = await fetch('/api/admin/analytics');
            if (response.ok) {
                this.analytics = await response.json();
                this.renderAnalytics();
            }
        } catch (error) {
            console.error('Error cargando analytics:', error);
        }
    }

    updateStats() {
        document.getElementById('total-users').textContent = this.users.length;
        document.getElementById('total-projects').textContent = this.projects.length;
        document.getElementById('vip-users').textContent = this.users.filter(u => u.vip).length;
        document.getElementById('active-warnings').textContent = this.warnings.length;
    }

    renderUsers() {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';

        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                        No hay usuarios registrados
                    </td>
                </tr>
            `;
            return;
        }

        this.users.forEach(user => {
            const row = document.createElement('tr');
            const joinDate = new Date(user.createdAt).toLocaleDateString('es-ES');
            const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-ES') : 'Nunca';
            
            row.innerHTML = `
                <td>
                    <div class="user-info">
                        ${user.avatar ? `<img src="${user.avatar}" alt="${user.username}" class="user-avatar-small">` : `<div class="user-avatar-small"><i class="fas fa-user"></i></div>`}
                        <div>
                            <div class="user-name">${user.username}</div>
                            <div class="user-email">${user.email || 'Discord'}</div>
                        </div>
                    </div>
                </td>
                <td>${joinDate}</td>
                <td>${lastLogin}</td>
                <td>
                    <span class="status-badge ${user.suspended ? 'suspended' : 'active'}">
                        ${user.suspended ? 'Suspendido' : 'Activo'}
                    </span>
                </td>
                <td>
                    ${user.vip ? '<span class="vip-badge"><i class="fas fa-crown"></i> VIP</span>' : 'Regular'}
                </td>
                <td>${user.warnings?.length || 0}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="showUserActions('${user.id}')">
                            <i class="fas fa-cog"></i>
                            Acciones
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderAdminProjects() {
        const tbody = document.getElementById('admin-projects-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (this.projects.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-folder" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                        No hay proyectos creados
                    </td>
                </tr>
            `;
            return;
        }

        this.projects.forEach(project => {
            const row = document.createElement('tr');
            const createdDate = new Date(project.createdAt).toLocaleDateString('es-ES');
            
            row.innerHTML = `
                <td>${project.name}</td>
                <td>${project.username}</td>
                <td>${project.description || 'Sin descripción'}</td>
                <td>${createdDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="viewProject('${project.id}')">
                            <i class="fas fa-eye"></i>
                            Ver
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProject('${project.id}')">
                            <i class="fas fa-trash"></i>
                            Eliminar
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderWarnings() {
        const tbody = document.getElementById('warnings-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (this.warnings.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                        No hay advertencias registradas
                    </td>
                </tr>
            `;
            return;
        }

        this.warnings.forEach(warning => {
            const row = document.createElement('tr');
            const date = new Date(warning.createdAt).toLocaleDateString('es-ES');
            
            row.innerHTML = `
                <td>${warning.username}</td>
                <td>${warning.reason}</td>
                <td>${date}</td>
                <td>
                    <span class="status-badge ${warning.status}">${warning.status}</span>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderGifts() {
        const tbody = document.getElementById('gifts-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (this.gifts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-gift" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                        No hay regalos otorgados
                    </td>
                </tr>
            `;
            return;
        }

        this.gifts.forEach(gift => {
            const row = document.createElement('tr');
            const date = new Date(gift.createdAt).toLocaleDateString('es-ES');
            
            row.innerHTML = `
                <td>${gift.username}</td>
                <td>${gift.giftType}</td>
                <td>${gift.description || 'Sin descripción'}</td>
                <td>${date}</td>
            `;
            tbody.appendChild(row);
        });
    }

    renderReports() {
        const tbody = document.getElementById('reports-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (this.reports.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-flag" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                        No hay reportes pendientes
                    </td>
                </tr>
            `;
            return;
        }

        this.reports.forEach(report => {
            const row = document.createElement('tr');
            const date = new Date(report.createdAt).toLocaleDateString('es-ES');
            
            row.innerHTML = `
                <td>${report.reporterUsername || 'Usuario anónimo'}</td>
                <td>${report.reportedUsername || 'Usuario eliminado'}</td>
                <td>${report.reason}</td>
                <td>
                    <span class="status-badge ${report.status}">${report.status}</span>
                </td>
                <td>${date}</td>
            `;
            tbody.appendChild(row);
        });
    }

    renderAnalytics() {
        if (!this.analytics) return;

        const elements = {
            'analytics-total-users': this.analytics.totalUsers || 0,
            'analytics-active-users': this.analytics.activeUsers || 0,
            'analytics-suspended-users': this.analytics.suspendedUsers || 0,
            'analytics-total-projects': this.analytics.totalProjects || 0,
            'analytics-total-warnings': this.analytics.totalWarnings || 0,
            'analytics-vip-users': this.analytics.vipUsers || 0
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    async suspendUser(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/suspend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                alert('Usuario suspendido correctamente');
                await this.loadUsers();
            } else {
                alert('Error al suspender usuario');
            }
        } catch (error) {
            console.error('Error suspendiendo usuario:', error);
        }
    }

    async unsuspendUser(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/unsuspend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                alert('Suspensión removida correctamente');
                await this.loadUsers();
            } else {
                alert('Error al remover suspensión');
            }
        } catch (error) {
            console.error('Error removiendo suspensión:', error);
        }
    }

    async warnUser(userId, reason) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/warn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            
            if (response.ok) {
                alert('Advertencia enviada correctamente');
                await this.loadUsers();
                await this.loadWarnings();
            } else {
                alert('Error al enviar advertencia');
            }
        } catch (error) {
            console.error('Error enviando advertencia:', error);
        }
    }

    async giftUser(userId, giftType, description) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/gift`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ giftType, description })
            });
            
            if (response.ok) {
                alert('Regalo otorgado correctamente');
                await this.loadUsers();
                await this.loadGifts();
            } else {
                alert('Error al otorgar regalo');
            }
        } catch (error) {
            console.error('Error otorgando regalo:', error);
        }
    }

    showSection(section) {
        // Remover clase active de todos los nav items
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Agregar clase active al item seleccionado
        document.querySelector(`[onclick="showSection('${section}')"]`).classList.add('active');
        
        // Ocultar todas las secciones
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.style.display = 'none';
        });
        
        // Mostrar sección seleccionada
        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        this.currentSection = section;
    }

    populateUserSelects() {
        // Función para poblar selects de usuarios si es necesario
    }

    setupEventListeners() {
        // Setup event listeners adicionales si es necesario
    }
}

// Funciones globales
async function verifyAdminCode(event) {
    event.preventDefault();
    const code = document.getElementById('admin-code').value;
    
    try {
        const response = await fetch('/api/admin/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        if (response.ok) {
            document.getElementById('admin-access-modal').style.display = 'none';
            document.getElementById('admin-app').style.display = 'block';
        } else {
            alert('Código incorrecto');
        }
    } catch (error) {
        console.error('Error verificando código:', error);
        alert('Error de conexión');
    }
}

function showSection(section) {
    if (window.adminInstance) {
        window.adminInstance.showSection(section);
    }
}

function showUserActions(userId) {
    const modal = document.getElementById('user-actions-modal');
    const user = window.adminInstance.users.find(u => u.id === userId);
    
    if (!user) return;
    
    document.getElementById('selected-user-name').textContent = user.username;
    document.getElementById('selected-user-id').value = userId;
    modal.style.display = 'flex';
}

function closeUserActions() {
    document.getElementById('user-actions-modal').style.display = 'none';
}

function showWarnModal() {
    document.getElementById('warn-modal').style.display = 'flex';
}

function closeWarnModal() {
    document.getElementById('warn-modal').style.display = 'none';
}

function showGiftModal() {
    document.getElementById('gift-modal').style.display = 'flex';
}

function closeGiftModal() {
    document.getElementById('gift-modal').style.display = 'none';
}

function suspendSelectedUser() {
    const userId = document.getElementById('selected-user-id').value;
    window.adminInstance.suspendUser(userId);
    closeUserActions();
}

function unsuspendSelectedUser() {
    const userId = document.getElementById('selected-user-id').value;
    window.adminInstance.unsuspendUser(userId);
    closeUserActions();
}

function submitWarning(event) {
    event.preventDefault();
    const userId = document.getElementById('selected-user-id').value;
    const reason = document.getElementById('warning-reason').value;
    
    window.adminInstance.warnUser(userId, reason);
    closeWarnModal();
    closeUserActions();
    
    document.getElementById('warning-reason').value = '';
}

function submitGift(event) {
    event.preventDefault();
    const userId = document.getElementById('selected-user-id').value;
    const giftType = document.getElementById('gift-type').value;
    const description = document.getElementById('gift-description').value;
    
    window.adminInstance.giftUser(userId, giftType, description);
    closeGiftModal();
    closeUserActions();
    
    document.getElementById('gift-type').value = 'vip';
    document.getElementById('gift-description').value = '';
}

function viewProject(projectId) {
    alert('Ver proyecto: ' + projectId);
}

function deleteProject(projectId) {
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
        alert('Proyecto eliminado: ' + projectId);
    }
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown-admin');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

function goHome() {
    window.location.href = '/';
}

async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST'
        });

        if (response.ok) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Inicializar admin panel
window.addEventListener('load', () => {
    window.adminInstance = new SPAdmin();
});