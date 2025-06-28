# SkyBook Pro - Drone Booking Mobile App

## Overview

SkyBook Pro is a full-stack mobile web application for booking drone services. The application allows users to register, verify their email, browse available drone services, and make bookings. It features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence and email verification for user authentication.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom theme variables
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Middleware**: Express middleware for request logging and error handling

### Data Storage Solutions
- **Database**: PostgreSQL (configured for Neon Database)
- **ORM**: Drizzle ORM with schema-first approach
- **Schema Management**: Drizzle Kit for migrations
- **In-Memory Fallback**: MemStorage class for development/testing

## Key Components

### Authentication System
- **Email-based Registration**: Users register with full name, email, and phone
- **OTP Verification**: 6-digit email verification codes with 10-minute expiration
- **Session Management**: Client-side auth state with localStorage persistence
- **Email Service**: Nodemailer with SMTP configuration

### Service Management
- **Service Categories**: Videography, Photoshoot, Agriculture, Surveillance, Inspection, Custom
- **Pricing Structure**: Hourly rate-based pricing model
- **Service Attributes**: Name, description, icon, color theming, active status

### Booking System
- **Location Input**: Text-based location entry (GPS integration ready)
- **Date/Time Selection**: Date and time picker components
- **Duration Configuration**: Hour-based duration selection
- **Cost Calculation**: Automatic total calculation (price per hour × duration)
- **Requirements**: Optional additional requirements field

### Admin Dashboard
- **Service Management**: CRUD operations for drone services
- **Booking Overview**: View all bookings with user and service details
- **Analytics**: Basic statistics for users, bookings, and revenue

## Data Flow

1. **User Registration**: User submits registration form → OTP sent via email → Email verification → Authentication established
2. **Service Selection**: Authenticated user browses services → Selects service → Redirected to booking form
3. **Booking Creation**: User fills booking details → Cost calculated → Booking submitted and confirmed
4. **Admin Management**: Admin can manage services and view bookings through dashboard interface

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Database ORM and query builder
- **@tanstack/react-query**: Server state management
- **nodemailer**: Email service for OTP delivery
- **@radix-ui/***: UI component primitives
- **react-hook-form**: Form handling and validation
- **zod**: Schema validation

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Production bundling

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: ESBuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Development**: Uses tsx for hot reloading
- **Production**: Node.js serves bundled application
- **Database**: PostgreSQL connection via `DATABASE_URL`
- **Email**: SMTP configuration via environment variables

### Hosting Requirements
- Node.js runtime environment
- PostgreSQL database (configured for Neon)
- SMTP email service
- Environment variables for configuration

## Changelog

```
Changelog:
- June 28, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```