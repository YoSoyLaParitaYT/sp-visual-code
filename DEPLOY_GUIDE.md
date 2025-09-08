# 🚀 Guía de Despliegue - SP Visual Code

## 📋 Archivos Preparados para Netlify

Tu aplicación ya está configurada para desplegar en Netlify con los siguientes archivos:

- ✅ `netlify.toml` - Configuración principal
- ✅ `_redirects` - Redirecciones para SPA
- ✅ `netlify/functions/server.js` - Función serverless
- ✅ `package.json` - Scripts actualizados
- ✅ `.env.example` - Variables de entorno

## 🔧 Pasos para Desplegar en Netlify

### 1. **Subir a GitHub**
```bash
git init
git add .
git commit -m "Preparar para despliegue en Netlify"
git branch -M main
git remote add origin https://github.com/tu-usuario/sp-visual-code.git
git push -u origin main
```

### 2. **Conectar en Netlify**
1. Ve a [netlify.com](https://netlify.com)
2. Haz clic en "Add new site" > "Import an existing project"
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio `sp-visual-code`

### 3. **Configurar Variables de Entorno**
En Netlify Dashboard > Site settings > Environment variables, agrega:

```
DISCORD_CLIENT_ID=1248554188431167489
DISCORD_CLIENT_SECRET=tu_client_secret_real
ADMIN_ACCESS_CODE=010925
SESSION_SECRET=un_secreto_muy_seguro_aqui
NODE_VERSION=18
```

### 4. **Configurar Discord OAuth**
En Discord Developer Portal, agrega estas URLs:

**Redirect URLs:**
```
https://tu-sitio.netlify.app/api/auth/discord/callback
https://sp-visual-code.netlify.app/api/auth/discord/callback
```

## 🎯 Configuración Automática

La aplicación detecta automáticamente el entorno y ajusta las URLs:
- ✅ Desarrollo: `localhost:5000`
- ✅ Replit: `*.replit.dev`
- ✅ Netlify: `*.netlify.app`
- ✅ Producción: Tu dominio personalizado

## ⚡ Funciones Implementadas

- ✅ **Discord OAuth totalmente funcional**
- ✅ **Base de datos persistente** (archivos JSON)
- ✅ **Panel de administración** (código: 010925)
- ✅ **Editor de código** con Monaco Editor
- ✅ **Sistema de usuarios** completo

## 🔍 Solución de Problemas

### Discord OAuth Error:
1. Verifica que `DISCORD_CLIENT_SECRET` esté configurado
2. Confirma que las URLs de redirect coincidan exactamente
3. Verifica que el CLIENT_ID sea: `1248554188431167489`

### Error de Build:
1. Asegúrate de que `NODE_VERSION=18` esté configurado
2. Verifica que todas las dependencias estén en `package.json`

## 📱 Resultado Final

Una vez desplegado tendrás:
- **URL pública**: `https://tu-sitio.netlify.app`
- **Login Discord funcional**
- **Panel admin**: `/admin` (código: 010925)
- **Editor**: `/editor`
- **Base de datos automática**

## 🎉 ¡Tu plataforma estará lista!

Todos los usuarios podrán:
- Registrarse con Discord
- Crear hasta 30 proyectos gratis
- Usar el editor de código completo
- Y tú podrás administrar todo desde el panel admin