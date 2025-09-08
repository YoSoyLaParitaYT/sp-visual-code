// SP Visual Code - Editor JavaScript
class SPEditor {
    constructor() {
        this.monaco = null;
        this.currentFile = 'index.html';
        this.files = {
            'index.html': '<!DOCTYPE html>\n<html>\n<head>\n    <title>Mi Proyecto</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>¡Hola Mundo!</h1>\n    <p>Bienvenido a SP Visual Code</p>\n    <script src="script.js"></script>\n</body>\n</html>',
            'style.css': 'body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n    background: #f0f0f0;\n}\n\nh1 {\n    color: #333;\n    text-align: center;\n}\n\np {\n    text-align: center;\n    font-size: 18px;\n    color: #666;\n}',
            'script.js': 'console.log("¡Hola desde SP Visual Code!");\n\n// Tu código JavaScript aquí\ndocument.addEventListener("DOMContentLoaded", function() {\n    console.log("Página cargada exitosamente");\n});'
        };
        this.currentProjectId = null;
        this.user = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.initializeEditor();
        this.setupEventListeners();
        this.updatePreview();
        await this.loadProjects();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (!data.authenticated) {
                window.location.href = '/';
                return;
            }
            
            this.user = data.user;
            document.getElementById('username-editor').textContent = this.user.username;
            
            // El enlace admin siempre está visible - el acceso se controla por código
            document.getElementById('admin-link-editor').style.display = 'block';
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            window.location.href = '/';
        }
    }

    async initializeEditor() {
        require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@latest/min/vs' }});
        
        return new Promise((resolve) => {
            require(['vs/editor/editor.main'], () => {
                this.monaco = monaco.editor.create(document.getElementById('monaco-editor'), {
                    value: this.files[this.currentFile],
                    language: this.getLanguageFromFile(this.currentFile),
                    theme: 'vs-dark',
                    automaticLayout: true,
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on'
                });

                // Event listeners para el editor
                this.monaco.onDidChangeModelContent(() => {
                    this.files[this.currentFile] = this.monaco.getValue();
                    this.updatePreview();
                });

                // Atajos de teclado
                this.monaco.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                    this.saveProject();
                });

                this.monaco.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                    this.runCode();
                });

                resolve();
            });
        });
    }

    setupEventListeners() {
        // Prevenir recarga accidental
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = '';
            return '';
        });

        // Cerrar dropdowns al hacer clic fuera
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.user-menu')) {
                document.getElementById('user-dropdown-editor').style.display = 'none';
            }
        });
    }

    getLanguageFromFile(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const languageMap = {
            'html': 'html',
            'css': 'css',
            'js': 'javascript',
            'json': 'json',
            'py': 'python',
            'php': 'php',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'ts': 'typescript'
        };
        return languageMap[ext] || 'plaintext';
    }

    selectFile(filename) {
        // Guardar archivo actual
        this.files[this.currentFile] = this.monaco.getValue();
        
        // Cambiar archivo activo
        this.currentFile = filename;
        
        // Actualizar UI
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.file-item').classList.add('active');
        
        // Actualizar editor
        const language = this.getLanguageFromFile(filename);
        monaco.editor.setModelLanguage(this.monaco.getModel(), language);
        this.monaco.setValue(this.files[filename] || '');
        
        // Actualizar tab
        this.updateTab(filename);
    }

    updateTab(filename) {
        const tab = document.getElementById('tab-index.html');
        const icon = this.getFileIcon(filename);
        tab.innerHTML = `
            ${icon}
            <span>${filename}</span>
            <button class="tab-close" onclick="closeTab('${filename}')">&times;</button>
        `;
        tab.id = `tab-${filename}`;
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'html': '<i class="fab fa-html5" style="color: #e34c26;"></i>',
            'css': '<i class="fab fa-css3-alt" style="color: #1572b6;"></i>',
            'js': '<i class="fab fa-js-square" style="color: #f7df1e;"></i>',
            'json': '<i class="fas fa-file-code" style="color: #ffd700;"></i>',
            'py': '<i class="fab fa-python" style="color: #3776ab;"></i>',
            'php': '<i class="fab fa-php" style="color: #777bb4;"></i>'
        };
        return iconMap[ext] || '<i class="fas fa-file" style="color: #666;"></i>';
    }

    updatePreview() {
        const iframe = document.getElementById('preview-iframe');
        const htmlContent = this.files['index.html'] || '';
        const cssContent = this.files['style.css'] || '';
        const jsContent = this.files['script.js'] || '';

        const fullContent = htmlContent.replace(
            '</head>',
            `<style>${cssContent}</style>\n</head>`
        ).replace(
            '</body>',
            `<script>${jsContent}</script>\n</body>`
        );

        iframe.srcdoc = fullContent;
    }

    runCode() {
        this.updatePreview();
        this.switchOutputTab('preview');
        this.showMessage('Código ejecutado exitosamente', 'success');
    }

    async saveProject() {
        if (!this.currentProjectId) {
            // Crear nuevo proyecto
            const projectName = prompt('Nombre del proyecto:', 'mi-proyecto');
            if (!projectName) return;
            
            try {
                const project = await this.createProject(projectName);
                if (project) {
                    this.currentProjectId = project.id;
                    document.getElementById('project-name').textContent = project.name;
                    document.getElementById('project-domain').textContent = project.domain;
                }
            } catch (error) {
                this.showMessage('Error al crear proyecto', 'error');
                return;
            }
        }
        
        // Simular guardado
        this.showMessage('Proyecto guardado', 'success');
    }

    async createProject(name, template = 'html') {
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    name, 
                    code: JSON.stringify(this.files)
                })
            });

            const data = await response.json();
            if (response.ok) {
                return data;
            } else {
                this.showMessage(data.error || 'Error al crear proyecto', 'error');
                return null;
            }
        } catch (error) {
            this.showMessage('Error de conexión', 'error');
            return null;
        }
    }

    shareProject() {
        if (!this.currentProjectId) {
            this.showMessage('Debes guardar el proyecto primero', 'warning');
            return;
        }
        
        const domain = document.getElementById('project-domain').textContent;
        document.getElementById('share-url').value = `https://${domain}`;
        this.showModal('share-modal');
    }

    copyShareLink() {
        const shareUrl = document.getElementById('share-url');
        shareUrl.select();
        document.execCommand('copy');
        this.showMessage('Enlace copiado al portapapeles', 'success');
    }

    switchOutputTab(tab) {
        document.querySelectorAll('.output-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.output-panel').forEach(p => p.classList.remove('active'));
        
        document.querySelector(`[onclick="switchOutputTab('${tab}')"]`).classList.add('active');
        document.getElementById(`${tab}-panel`).classList.add('active');
    }

    async loadProjects() {
        try {
            const response = await fetch('/api/projects');
            const projects = await response.json();
            
            if (response.ok) {
                this.renderProjects(projects);
                document.getElementById('projects-count').textContent = projects.length;
            }
        } catch (error) {
            console.error('Error cargando proyectos:', error);
        }
    }

    renderProjects(projects) {
        const grid = document.getElementById('projects-grid');
        grid.innerHTML = '';
        
        if (projects.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-plus" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
                    <h3>No tienes proyectos aún</h3>
                    <p>Crea tu primer proyecto para empezar a programar</p>
                </div>
            `;
            return;
        }

        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            projectCard.onclick = () => this.loadProject(project);
            
            projectCard.innerHTML = `
                <div class="project-header">
                    <div>
                        <div class="project-title">${project.name}</div>
                        <div class="project-domain">${project.domain}</div>
                    </div>
                    <div class="project-actions">
                        <button class="project-action" onclick="event.stopPropagation(); this.shareProject('${project.id}')">
                            <i class="fas fa-share"></i>
                        </button>
                        <button class="project-action" onclick="event.stopPropagation(); this.deleteProject('${project.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="project-info">
                    Creado: ${this.formatDate(project.createdAt)}
                </div>
                <div class="project-tech">
                    <span class="tech-tag">HTML</span>
                    <span class="tech-tag">CSS</span>
                    <span class="tech-tag">JavaScript</span>
                </div>
            `;
            
            grid.appendChild(projectCard);
        });
    }

    loadProject(project) {
        this.currentProjectId = project.id;
        document.getElementById('project-name').textContent = project.name;
        document.getElementById('project-domain').textContent = project.domain;
        
        if (project.code) {
            try {
                this.files = JSON.parse(project.code);
                this.monaco.setValue(this.files[this.currentFile] || '');
                this.updatePreview();
            } catch (error) {
                console.error('Error cargando código del proyecto:', error);
            }
        }
        
        this.closeModal('projects-panel');
        this.showMessage(`Proyecto ${project.name} cargado`, 'success');
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Funciones de UI
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showMessage(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : type === 'warning' ? 'var(--warning-color)' : 'var(--primary-color)'};
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

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Instancia global del editor
let editor;

// Funciones globales
function goHome() {
    window.location.href = '/';
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown-editor');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

function runCode() {
    editor.runCode();
}

function saveProject() {
    editor.saveProject();
}

function shareProject() {
    editor.shareProject();
}

function copyShareLink() {
    editor.copyShareLink();
}

function selectFile(filename) {
    editor.selectFile(filename);
}

function closeTab(filename) {
    // Implementar cierre de tabs si hay múltiples
    console.log('Cerrar tab:', filename);
}

function switchOutputTab(tab) {
    editor.switchOutputTab(tab);
}

function showProjectsPanel() {
    editor.showModal('projects-panel');
    editor.loadProjects();
}

function closeModal(modalId) {
    editor.closeModal(modalId);
}

function showNewProjectModal() {
    editor.showModal('new-project-modal');
}

function createNewProject(event) {
    event.preventDefault();
    const name = document.getElementById('project-name-input').value;
    const template = document.getElementById('project-template').value;
    const isPublic = document.getElementById('project-public').checked;
    
    editor.createProject(name, template).then(project => {
        if (project) {
            editor.loadProject(project);
            editor.closeModal('new-project-modal');
        }
    });
}

function createNewFile() {
    const filename = prompt('Nombre del archivo:', 'nuevo-archivo.js');
    if (filename && !editor.files[filename]) {
        editor.files[filename] = '';
        
        // Agregar al árbol de archivos
        const fileTree = document.getElementById('file-tree');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.onclick = () => selectFile(filename);
        fileItem.innerHTML = `
            ${editor.getFileIcon(filename)}
            <span>${filename}</span>
        `;
        fileTree.appendChild(fileItem);
        
        // Seleccionar el nuevo archivo
        selectFile(filename);
    }
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

// Inicializar editor cuando la página carge
window.addEventListener('load', () => {
    editor = new SPEditor();
});