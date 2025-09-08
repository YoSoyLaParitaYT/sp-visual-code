# SP Visual Code - Web Development Platform

## Overview

SP Visual Code is a web-based code editor and development platform that allows users to create, edit, and deploy web projects directly in the browser. The platform features a Monaco-based code editor, real-time preview capabilities, project management, and user authentication with social login options. It's designed as a comprehensive development environment for HTML, CSS, and JavaScript projects with administrative controls and user management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Client-Side Framework**: Vanilla JavaScript with class-based architecture
- **Editor Integration**: Monaco Editor for syntax highlighting and code editing
- **UI Components**: Custom CSS with CSS variables for theming and responsive design
- **File Management**: In-memory file system simulation with multiple file support (HTML, CSS, JavaScript)
- **Real-time Preview**: Live preview functionality with code execution capabilities

### Backend Architecture
- **Server Framework**: Express.js with comprehensive middleware stack
- **Security Middleware**: Helmet for security headers, CORS for cross-origin requests, rate limiting for API protection
- **Session Management**: Express-session with secure cookie configuration
- **Authentication Strategy**: Passport.js with multiple strategies (local, Discord, Google OAuth)
- **Password Security**: bcrypt for password hashing and JWT for token management
- **Data Storage**: In-memory Maps for temporary data storage (users, projects, admin actions)

### Authentication and Authorization
- **Multi-provider OAuth**: Support for Discord and Google OAuth alongside local authentication
- **Session-based Authentication**: Server-side session management with persistent login states
- **Role-based Access Control**: Special administrative privileges for designated admin email
- **JWT Integration**: Token-based authentication for API endpoints

### Administrative System
- **Admin Dashboard**: Dedicated administrative interface with user and project management
- **Access Control**: Email-based admin access restriction (ivanaristidedejesus01@gmail.com)
- **User Management**: Admin capabilities to view, edit, and manage user accounts
- **Project Oversight**: Administrative tools for monitoring and managing user projects

## External Dependencies

### Core Backend Dependencies
- **express**: Web application framework
- **passport**: Authentication middleware with strategies for local, Discord, and Google OAuth
- **sequelize**: ORM for database operations (configured for future database integration)
- **pg**: PostgreSQL client (prepared for database implementation)
- **bcrypt**: Password hashing and security
- **jsonwebtoken**: JWT token management

### Communication and File Handling
- **socket.io**: Real-time communication capabilities
- **nodemailer**: Email service integration
- **multer**: File upload handling middleware

### Security and Middleware
- **helmet**: Security headers and protection
- **cors**: Cross-origin resource sharing configuration
- **express-rate-limit**: API rate limiting and abuse prevention
- **express-session**: Session management
- **cookie-parser**: Cookie parsing middleware

### Frontend Libraries
- **Monaco Editor**: Browser-based code editor via CDN
- **Font Awesome**: Icon library for UI components

### Development Tools
- **dotenv**: Environment variable management
- **moment**: Date and time manipulation
- **uuid**: Unique identifier generation
- **body-parser**: Request body parsing middleware

The application is structured to support future database integration while currently operating with in-memory data storage for development and testing purposes.