const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Replit environment
app.set('trust proxy', 1);

// Configuración de middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'sp-visual-code-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  trustProxy: true
});
app.use(limiter);

// Base de datos simple en archivos JSON
const fs = require('fs');
const users = new Map();
const projects = new Map();
const warnings = new Map();
const gifts = new Map();
const reports = new Map();
const analytics = new Map();

// Funciones para persistencia
function saveData() {
  try {
    if (!fs.existsSync('database')) {
      fs.mkdirSync('database');
    }
    fs.writeFileSync('database/users.json', JSON.stringify(Array.from(users.entries())));
    fs.writeFileSync('database/projects.json', JSON.stringify(Array.from(projects.entries())));
    fs.writeFileSync('database/warnings.json', JSON.stringify(Array.from(warnings.entries())));
    fs.writeFileSync('database/gifts.json', JSON.stringify(Array.from(gifts.entries())));
    fs.writeFileSync('database/reports.json', JSON.stringify(Array.from(reports.entries())));
    fs.writeFileSync('database/analytics.json', JSON.stringify(Array.from(analytics.entries())));
  } catch (error) {
    console.error('Error guardando datos:', error);
  }
}

function loadData() {
  try {
    if (fs.existsSync('database/users.json')) {
      const usersData = JSON.parse(fs.readFileSync('database/users.json', 'utf8'));
      usersData.forEach(([key, value]) => users.set(key, value));
    }
    if (fs.existsSync('database/projects.json')) {
      const projectsData = JSON.parse(fs.readFileSync('database/projects.json', 'utf8'));
      projectsData.forEach(([key, value]) => projects.set(key, value));
    }
    if (fs.existsSync('database/warnings.json')) {
      const warningsData = JSON.parse(fs.readFileSync('database/warnings.json', 'utf8'));
      warningsData.forEach(([key, value]) => warnings.set(key, value));
    }
    if (fs.existsSync('database/gifts.json')) {
      const giftsData = JSON.parse(fs.readFileSync('database/gifts.json', 'utf8'));
      giftsData.forEach(([key, value]) => gifts.set(key, value));
    }
    if (fs.existsSync('database/reports.json')) {
      const reportsData = JSON.parse(fs.readFileSync('database/reports.json', 'utf8'));
      reportsData.forEach(([key, value]) => reports.set(key, value));
    }
    if (fs.existsSync('database/analytics.json')) {
      const analyticsData = JSON.parse(fs.readFileSync('database/analytics.json', 'utf8'));
      analyticsData.forEach(([key, value]) => analytics.set(key, value));
    }
  } catch (error) {
    console.error('Error cargando datos:', error);
  }
}

// Cargar datos al iniciar
loadData();

// Guardar datos cada 30 segundos
setInterval(saveData, 30000);

// Configuración del administrador
const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE || '010925';
const VIP_ROLE_ID = '1393851031808512111';

// Configuración de Passport
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.get(id);
  done(null, user);
});

// Estrategia Local
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      return done(null, false, { message: 'Usuario no encontrado' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return done(null, false, { message: 'Contraseña incorrecta' });
    }
    
    if (user.suspended) {
      return done(null, false, { message: 'Cuenta suspendida' });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Estrategia Discord
const discordConfig = require('./discord-config');

// Configuración dinámica de callback URL
let dynamicCallbackURL = 'http://localhost:5000/api/auth/discord/callback';

const updateCallbackURL = (req) => {
  if (req) {
    dynamicCallbackURL = discordConfig.getCallbackURL(req);
  }
};

console.log('Discord OAuth Config:', {
  clientID: discordConfig.CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET ? 'Configurado' : 'NO CONFIGURADO',
  callbackURL: dynamicCallbackURL
});

// Verificar que las credenciales estén configuradas
if (!process.env.DISCORD_CLIENT_SECRET) {
  console.warn('ADVERTENCIA: DISCORD_CLIENT_SECRET no configurado');
}

passport.use(new DiscordStrategy({
  clientID: discordConfig.CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
  callbackURL: dynamicCallbackURL,
  scope: discordConfig.scopes,
  passReqToCallback: false
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Buscar usuario existente por Discord ID
    let user = Array.from(users.values()).find(u => u.discordId === profile.id);
    
    if (user) {
      // Actualizar información del usuario
      user.username = profile.username;
      user.avatar = profile.avatar;
      user.lastLogin = new Date();
      users.set(user.id, user);
    } else {
      // Crear nuevo usuario
      const userId = Date.now().toString();
      user = {
        id: userId,
        username: profile.username,
        email: profile.email,
        discordId: profile.id,
        avatar: profile.avatar,
        createdAt: new Date(),
        lastLogin: new Date(),
        suspended: false,
        warnings: [],
        vip: false
      };
      users.set(userId, user);
      saveData(); // Guardar inmediatamente
    }
    
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Rutas principales
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Ruta para verificar código de administrador
app.post('/api/admin/verify-code', (req, res) => {
  const { code } = req.body;
  if (code === ADMIN_ACCESS_CODE) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Código incorrecto' });
  }
});

// Middleware para verificar acceso admin
function requireAdminAccess(req, res, next) {
  if (!req.session.isAdmin) {
    return res.status(403).json({ error: 'Acceso denegado - Código requerido' });
  }
  next();
}

// Authentication routes
app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
  res.json({ 
    success: true, 
    user: { 
      id: req.user.id, 
      username: req.user.username, 
      email: req.user.email,
      avatar: req.user.avatar
    } 
  });
});

// Discord OAuth routes
app.get('/api/auth/discord', (req, res, next) => {
  updateCallbackURL(req);
  passport.authenticate('discord')(req, res, next);
});

app.get('/api/auth/discord/callback', 
  passport.authenticate('discord', { 
    failureRedirect: '/?error=discord_auth_failed',
    failureFlash: false 
  }),
  (req, res) => {
    // Successful authentication, redirect to editor
    console.log('Discord authentication successful for user:', req.user.username);
    res.redirect('/editor');
  }
);

// Ruta de error para Discord
app.get('/api/auth/discord/error', (req, res) => {
  console.log('Discord authentication error');
  res.redirect('/?error=discord_error');
});

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  if (Array.from(users.values()).some(u => u.email === email)) {
    return res.status(400).json({ error: 'El email ya está registrado' });
  }
  
  const userId = Date.now().toString();
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = {
    id: userId,
    username,
    email,
    password: hashedPassword,
    createdAt: new Date(),
    suspended: false,
    warnings: []
  };
  
  users.set(userId, user);
  req.session.userId = userId;
  saveData(); // Guardar inmediatamente
  res.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Middleware de autenticación
app.use((req, res, next) => {
  if (req.session.userId) {
    req.user = users.get(req.session.userId);
  }
  next();
});

// API Routes
app.get('/api/auth/status', (req, res) => {
  res.json({ 
    authenticated: !!req.user,
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar
    } : null
  });
});

app.get('/api/projects', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  const userProjects = Array.from(projects.values())
    .filter(p => p.userId === req.user.id)
    .slice(0, 30); // Límite de 30 proyectos
    
  res.json(userProjects);
});

app.post('/api/projects', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  const userProjectsCount = Array.from(projects.values())
    .filter(p => p.userId === req.user.id).length;
    
  if (userProjectsCount >= 30) {
    return res.status(400).json({ error: 'Límite de 30 proyectos alcanzado' });
  }
  
  const projectId = Date.now().toString();
  const project = {
    id: projectId,
    name: req.body.name,
    userId: req.user.id,
    code: req.body.code || '',
    domain: `${req.body.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${projectId}.spvisualcode.com`,
    createdAt: new Date(),
    isPublic: false
  };
  
  projects.set(projectId, project);
  res.json(project);
});

app.get('/api/admin/users', requireAdminAccess, (req, res) => {
  const allUsers = Array.from(users.values()).map(user => ({
    ...user,
    password: undefined // No mostrar contraseñas
  }));
  
  res.json(allUsers);
});

app.post('/api/admin/suspend', requireAdminAccess, (req, res) => {
  const { userId } = req.body;
  const user = users.get(userId);
  if (user) {
    user.suspended = true;
    users.set(userId, user);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Usuario no encontrado' });
  }
});

app.post('/api/admin/warn', requireAdminAccess, (req, res) => {
  const { userId, reason, message, severity } = req.body;
  const actionId = Date.now().toString();
  adminActions.set(actionId, {
    type: 'warning',
    userId,
    reason,
    message,
    severity,
    timestamp: new Date()
  });
  
  // Add warning to user
  const user = users.get(userId);
  if (user) {
    if (!user.warnings) user.warnings = [];
    user.warnings.push({ reason, message, severity, timestamp: new Date() });
    users.set(userId, user);
  }
  
  res.json({ success: true });
});

// Servidor estático para archivos públicos
app.use(express.static('public'));

// ========== RUTAS DE ADMINISTRACIÓN ==========

// Obtener todos los usuarios
app.get('/api/admin/users', requireAdminAccess, (req, res) => {
  const allUsers = Array.from(users.values()).map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    discordId: user.discordId,
    avatar: user.avatar,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    suspended: user.suspended || false,
    warnings: user.warnings || [],
    vip: user.vip || false
  }));
  res.json(allUsers);
});

// Suspender usuario
app.post('/api/admin/users/:id/suspend', requireAdminAccess, (req, res) => {
  const userId = req.params.id;
  const user = users.get(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  user.suspended = true;
  users.set(userId, user);
  saveData();
  
  res.json({ success: true, message: 'Usuario suspendido correctamente' });
});

// Quitar suspensión
app.post('/api/admin/users/:id/unsuspend', requireAdminAccess, (req, res) => {
  const userId = req.params.id;
  const user = users.get(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  user.suspended = false;
  users.set(userId, user);
  saveData();
  
  res.json({ success: true, message: 'Suspensión removida correctamente' });
});

// Añadir advertencia
app.post('/api/admin/users/:id/warn', requireAdminAccess, (req, res) => {
  const userId = req.params.id;
  const { reason } = req.body;
  const user = users.get(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  const warningId = Date.now().toString();
  const warning = {
    id: warningId,
    userId: userId,
    reason: reason,
    createdAt: new Date(),
    status: 'active'
  };
  
  warnings.set(warningId, warning);
  
  if (!user.warnings) user.warnings = [];
  user.warnings.push(warningId);
  users.set(userId, user);
  saveData();
  
  res.json({ success: true, message: 'Advertencia añadida correctamente' });
});

// Otorgar regalo/VIP
app.post('/api/admin/users/:id/gift', requireAdminAccess, (req, res) => {
  const userId = req.params.id;
  const { giftType, description } = req.body;
  const user = users.get(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  const giftId = Date.now().toString();
  const gift = {
    id: giftId,
    userId: userId,
    giftType: giftType,
    description: description,
    createdAt: new Date()
  };
  
  gifts.set(giftId, gift);
  
  if (giftType === 'vip') {
    user.vip = true;
    users.set(userId, user);
  }
  
  saveData();
  
  res.json({ success: true, message: 'Regalo otorgado correctamente' });
});

// Obtener advertencias
app.get('/api/admin/warnings', requireAdminAccess, (req, res) => {
  const allWarnings = Array.from(warnings.values()).map(warning => {
    const user = users.get(warning.userId);
    return {
      ...warning,
      username: user ? user.username : 'Usuario desconocido'
    };
  });
  res.json(allWarnings);
});

// Obtener regalos
app.get('/api/admin/gifts', requireAdminAccess, (req, res) => {
  const allGifts = Array.from(gifts.values()).map(gift => {
    const user = users.get(gift.userId);
    return {
      ...gift,
      username: user ? user.username : 'Usuario desconocido'
    };
  });
  res.json(allGifts);
});

// Obtener todos los proyectos
app.get('/api/admin/projects', requireAdminAccess, (req, res) => {
  const allProjects = Array.from(projects.values()).map(project => {
    const user = users.get(project.userId);
    return {
      ...project,
      username: user ? user.username : 'Usuario desconocido'
    };
  });
  res.json(allProjects);
});

// Obtener reportes
app.get('/api/admin/reports', requireAdminAccess, (req, res) => {
  const allReports = Array.from(reports.values());
  res.json(allReports);
});

// Obtener analytics
app.get('/api/admin/analytics', requireAdminAccess, (req, res) => {
  const stats = {
    totalUsers: users.size,
    totalProjects: projects.size,
    totalWarnings: warnings.size,
    totalGifts: gifts.size,
    activeUsers: Array.from(users.values()).filter(u => !u.suspended).length,
    suspendedUsers: Array.from(users.values()).filter(u => u.suspended).length,
    vipUsers: Array.from(users.values()).filter(u => u.vip).length
  };
  res.json(stats);
});

// Configuración del sistema
app.get('/api/admin/config', requireAdminAccess, (req, res) => {
  const config = {
    maxProjectsPerUser: 30,
    adminAccessCode: '010925',
    discordAuth: true,
    registrationOpen: true
  };
  res.json(config);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SP Visual Code servidor ejecutándose en puerto ${PORT}`);
  console.log(`Accede a: http://localhost:${PORT}`);
  const replit_domain = process.env.REPLIT_DEV_DOMAIN;
  if (replit_domain) {
    console.log(`Acceso público: https://${replit_domain}`);
    console.log(`Discord callback configurado para: https://${replit_domain}/api/auth/discord/callback`);
  }
});

module.exports = app;