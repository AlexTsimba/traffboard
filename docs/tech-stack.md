# Technology Stack

## Frontend
- **Framework**: Next.js 15 with React Server Components
- **Language**: TypeScript
- **UI Library**: Shadcn UI
- **Charting**: Shadcn Charts
- **Styling**: Tailwind CSS (via Shadcn)
- **State Management**: React Context/Zustand (lightweight)
- **Typography**: Geist font
- **Notifications**: Sonner toast system

## Backend
- **Framework**: Next.js 15 (API Routes & Server Actions)
- **Language**: TypeScript/Node.js
- **Database**: PostgreSQL (DigitalOcean Managed)
- **ORM**: Prisma or Drizzle
- **Authentication**: better-auth
- **Data Processing**: Arquero (in-memory operations)

## Architecture
- **Structure**: Monorepo
- **Service Type**: Monolithic
- **API Style**: Server Actions + Internal API Routes
- **Authentication**: OAuth + Email/Password with 2FA

## Development Tools
- **Package Manager**: npm
- **Testing**: Jest + React Testing Library + Playwright
- **Type Checking**: TypeScript
- **Version Control**: Git
- **Theme System**: tweakcn for dynamic styling

## Deployment
- **Platform**: DigitalOcean App Platform
- **Database**: DigitalOcean Managed PostgreSQL
- **CI/CD**: GitHub Actions
- **Deployment**: Automated from main branch
- **Environment**: .env configuration

## Code Quality
- **Testing**: Jest/Playwright from first commit
- **Error Handling**: Centralized with standard API format
- **Logging**: Winston/Pino for backend
- **Monitoring**: DigitalOcean + Custom logging