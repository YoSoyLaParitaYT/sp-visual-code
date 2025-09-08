// Configuración de Discord OAuth
module.exports = {
  // IDs y secretos
  CLIENT_ID: '1248554188431167489',
  // El CLIENT_SECRET debe ser configurado en las variables de entorno
  
  // URLs de callback para diferentes entornos
  getCallbackURL: (req) => {
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || 'https';
    
    // URLs conocidas de producción
    const productionDomains = [
      'sp-visual-code.netlify.app',
      'spvisualcode.netlify.app'
    ];
    
    // Si es un dominio de producción conocido
    if (productionDomains.some(domain => host && host.includes(domain))) {
      return `${protocol}://${host}/api/auth/discord/callback`;
    }
    
    // Si es Replit
    if (host && host.includes('.replit.dev')) {
      return `https://${host}/api/auth/discord/callback`;
    }
    
    // Si es Netlify
    if (host && host.includes('.netlify.app')) {
      return `https://${host}/api/auth/discord/callback`;
    }
    
    // Desarrollo local
    return 'http://localhost:5000/api/auth/discord/callback';
  },
  
  // Configuración de scopes
  scopes: ['identify', 'email']
};