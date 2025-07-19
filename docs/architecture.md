### Introduction

This document outlines the complete fullstack architecture for **Internal Affiliate Dashboard**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

#### Starter Template or Existing Project

N/A - Greenfield project

#### Change Log

| Date | Version | Description | Author |
| :--- | :------ | :---------- | :----- |
| | | | |

### High Level Architecture

#### Technical Summary

The Internal Affiliate Dashboard will be developed as a monolithic fullstack application, leveraging Next.js 15 for the frontend and a Node.js/Express backend, all deployed on DigitalOcean's App Platform and Managed PostgreSQL Database. Communication between frontend and backend will occur directly within this unified application. This architecture is chosen for rapid MVP delivery within a two-week timeline, enabling self-service reporting for affiliates by providing secure authentication, CSV data ingestion with deduplication, and programmatic report generation, starting with a Cohort Report.

#### Platform and Infrastructure Choice

**Platform:** DigitalOcean App Platform
**Key Services:** DigitalOcean App Platform (application hosting), DigitalOcean Managed Database (PostgreSQL)
**Deployment Host and Regions:** DigitalOcean (specific regions not defined, will default to a suitable region for performance and availability).

#### Repository Structure

**Structure:** Monorepo
**Monorepo Tool:** Not explicitly specified, but implied by the choice of Next.js and the need for shared code. Will assume standard npm/yarn workspaces or a lightweight tool like Turborepo if needed.
**Package Organization:** Will contain `apps/web` for the Next.js frontend, `apps/api` for the backend, and `packages/shared` for shared types and utilities.

#### High Level Architecture Diagram

```mermaid
graph TD
    User[User] -->|Web Browser| Frontend[Next.js Frontend]
    Frontend -->|API Calls| Backend[Node.js Backend]
    Backend -->|Database Access| PostgreSQL[DigitalOcean Managed PostgreSQL]
    Admin -->|CSV Upload| Backend
    Backend -->|Data Ingestion| PostgreSQL
    PostgreSQL -->|Data for Reports| Backend
    Backend -->|Reports| Frontend
```

#### Architectural Patterns

-   **Monolithic Architecture:** The application will initially be developed as a single, tightly coupled codebase for faster iteration and simplified deployment for the MVP.
-   **Component-Based UI:** The frontend will utilize reusable Shadcn UI components for consistency and maintainability.
-   **Role-Based Access Control (RBAC):** Secure authentication and authorization will be implemented to restrict access based on user roles (admin/user).

### Tech Stack

#### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
| :------- | :--------- | :------ | :------ | :-------- |
| Frontend Language | TypeScript | Latest | Primary language for frontend development | Type safety and improved developer experience. |
| Frontend Framework | Next.js | 15 | Fullstack React framework | Server Components for server-side data fetching, routing, and optimized performance. |
| UI Component Library | Shadcn UI | Latest | Reusable UI components | Provides a set of accessible and customizable UI components, aligning with the minimalist aesthetic. |
| State Management | React Context / Zustand (or similar lightweight) | Latest | Client-side state management | For managing UI-specific state that doesn't require server interaction. |
| Backend Language | TypeScript / Node.js | Latest | Primary language for backend development | Aligns with Next.js for a unified language across the stack, enabling Node.js server components. |
| Backend Framework | Next.js (API Routes / Server Actions) | 15 | Backend API and server-side logic | Leveraging Next.js's built-in API routes and Server Actions for server-side data handling and, eliminating client-side SQL queries. |
| API Style | Server Actions / Internal API Routes | N/A | Server-side data fetching and mutations | All data operations will be handled on the server using Next.js Server Actions or internal API routes, ensuring no direct client-side database access. |
| Database | PostgreSQL | Latest | Relational data storage | Robust, open-source relational database for structured data. |
| ORM | Prisma or Drizzle | Latest | Database interaction | Provides a type-safe and efficient way to interact with the PostgreSQL database from the Node.js backend. |
| Data Manipulation | Arquero | Latest | In-memory data manipulation | For efficient in-memory data processing and mathematical operations on the server-side. |
| Authentication | `better-auth` | Latest | User authentication and authorization | Secure and flexible authentication library for managing user access. |
| Frontend Testing | Jest, React Testing Library | Latest | Unit and component testing | For testing individual React components and frontend logic. |
| Backend Testing | Jest | Latest | Unit and integration testing | For testing backend logic, API routes, and server actions. |
| E2E Testing | Playwright | Latest | End-to-end testing | For simulating user interactions and testing the entire application flow. |
| Build Tool | Next.js Built-in | 15 | Application bundling and optimization | Next.js handles bundling and optimization automatically. |
| Bundler | Webpack / Turbopack (Next.js) | Latest | Module bundling | Handled by Next.js. |
| IaC Tool | DigitalOcean App Platform Configuration | N/A | Infrastructure as Code | DigitalOcean's platform configuration will define the infrastructure. |
| CI/CD | GitHub Actions | N/A | Continuous Integration/Deployment | Automates testing and deployment processes from GitHub. |
| Monitoring | DigitalOcean Monitoring, Custom Logging | N/A | Application and infrastructure monitoring | Basic monitoring provided by DigitalOcean, supplemented with custom logging for application insights. |
| Logging | Winston / Pino (Node.js) | Latest | Application logging | For structured and efficient logging of application events on the backend. |
| CSS Framework | Tailwind CSS (via Shadcn) | Latest | Utility-first CSS framework | Integrated with Shadcn UI for flexible and efficient styling. |

### Data Models

#### User

**Purpose:** Represents a user of the Internal Affiliate Dashboard, including administrators and regular affiliates. This model will store authentication credentials, roles, and potentially other user-specific settings.

**Key Attributes:**
- `id`: `string` (UUID) - Unique identifier for the user.
- `email`: `string` - User's email address, used for login.
- `passwordHash`: `string` - Hashed password for secure authentication.
- `role`: `enum ('admin', 'user')` - User's role, determining access permissions.
- `is2faEnabled`: `boolean` - Flag indicating if two-factor authentication is enabled for the user.
- `createdAt`: `Date` - Timestamp of user creation.
- `updatedAt`: `Date` - Timestamp of last user update.

#### CSVUpload

**Purpose:** Tracks metadata about each CSV file upload.

**Key Attributes:**
- `id`: `string` (UUID) - Unique identifier for the CSV upload record.
- `fileName`: `string` - Original name of the uploaded CSV file.
- `uploadDate`: `Date` - Timestamp when the CSV was uploaded.
- `uploadedByUserId`: `string` - ID of the administrator who uploaded the file.
- `status`: `enum ('pending', 'processing', 'completed', 'failed')` - Current status of the CSV processing.
- `deduplicatedRecordsCount`: `number` - Number of records after deduplication.
- `rawRecordsCount`: `number` - Total number of records in the original CSV.

#### AffiliateTrafficData

**Purpose:** Stores granular traffic performance data, directly ingested from `traffic_report (20).csv`. This model focuses on raw traffic metrics and associated dimensions. **This is time-series data, with `date` being the primary time dimension.**

**Key Attributes:**
- `id`: `string` (UUID) - Unique identifier for each traffic data record (generated upon ingestion).
- `date`: `Date` - The date of the traffic event. **(Primary time-series dimension)**
- `foreignBrandId`: `number` - Identifier for the brand associated with the traffic.
- `foreignPartnerId`: `number` - Identifier for the partner generating the traffic.
- `foreignCampaignId`: `number` - Identifier for the campaign.
- `foreignLandingId`: `number` - Identifier for the landing page.
- `trafficSource`: `string` - Source of the traffic (e.g., "fb_android_pwa", "fb_ios").
- `deviceType`: `string` - Type of device (e.g., "Phone", "Computer", "Tablet").
- `userAgentFamily`: `string` - Family of the user agent (e.g., "Chrome Mobile", "Mobile Safari UI/WKWebView").
- `osFamily`: `string` - Operating system family (e.g., "Android", "iOS", "Windows").
- `country`: `string` - Country of the traffic origin (e.g., "AU", "DE", "US").
- `allClicks`: `number` - Total number of clicks.
- `uniqueClicks`: `number` - Number of unique clicks.
- `registrationsCount`: `number` - Number of registrations.
- `ftdCount`: `number` - Number of first-time deposits.
- `depositsCount`: `number` - Number of subsequent deposits.
- `uploadedFromCSVId`: `string` - ID of the `CSVUpload` record from which this data originated.

#### PlayerConversionData

**Purpose:** Stores player conversion and financial metrics, directly ingested from `overall_rows.csv`. This model focuses on player-specific actions and their monetary impact. **This is time-series data, with `date` being a key time dimension for daily aggregates, and `signUpDate`/`firstDepositDate` for cohort analysis.**

**Key Attributes:**
- `id`: `string` (UUID) - Unique identifier for each player conversion record (generated upon ingestion).
- `playerId`: `number` - Unique identifier for the player.
- `originalPlayerId`: `number` - Original player ID (retained for potential historical linking).
- `signUpDate`: `Date` - Date of player sign-up.
- `firstDepositDate`: `Date` - Date of player's first deposit.
- `partnerId`: `number` - Identifier for the partner.
- `companyName`: `string` - Name of the company associated with the partner.
- `partnerTags`: `string` - Tags associated with the partner.
- `campaignId`: `number` - Identifier for the campaign.
- `campaignName`: `string` - Name of the campaign.
- `promoId`: `number` - Identifier for the promotion.
- `promoCode`: `string` - Promotion code used.
- `playerCountry`: `string` - Country of the player.
- `tagClickid`: `string` - Click ID from tracking tags.
- `tagOs`: `string | null` - Operating system from tracking tags. **(Optional)**
- `tagSource`: `string | null` - Source from tracking tags. **(Optional)**
- `tagSub2`: `string | null` - Sub2 parameter from tracking tags. **(Optional)**
- `tagWebID`: `string | null` - Web ID from tracking tags. **(Optional)**
- `date`: `Date` - The date of the record (likely the date of the event described by the row). **(Key time-series dimension for daily aggregates)**
- `prequalified`: `number` - Indicator for pre-qualification (0 or 1).
- `duplicate`: `number` - Indicator for duplicate player (0 or 1).
- `selfExcluded`: `number` - Indicator for self-excluded player (0 or 1).
- `disabled`: `number` - Indicator for disabled player (0 or 1).
- `currency`: `string` - Currency of transactions (e.g., "EUR").
- `ftdCount`: `number` - Count of first-time deposits.
- `ftdSum`: `number` - Sum of first-time deposits.
- `depositsCount`: `number` - Count of all deposits.
- `depositsSum`: `number` - Sum of all deposits.
- `cashoutsCount`: `number` - Count of cashouts.
- `cashoutsSum`: `number` - Sum of cashouts.
- `casinoBetsCount`: `number` - Count of casino bets.
- `casinoRealNGR`: `number` - Real Net Gaming Revenue from casino.
- `fixedPerPlayer`: `number` - Fixed amount per player.
- `casinoBetsSum`: `number` - Sum of casino bets.
-   `casinoWinsSum`: `number` - Sum of casino wins.

### API Specification

Based on the chosen architecture leveraging Next.js with Node.js server components, the primary mode of data interaction will be through **Next.js Server Actions** and **Internal API Routes**. This approach ensures that all data fetching and manipulation logic resides on the server, preventing client-side SQL queries and enhancing security and performance.

#### API Style: Server Actions / Internal API Routes

All data operations will be handled on the server.

*   **Next.js Server Actions:** For direct data mutations and server-side data fetching within React Server Components. This is the preferred method for interacting with the backend from the frontend.
*   **Internal API Routes (Next.js API Routes):** For scenarios requiring traditional API endpoints (e.g., for CSV uploads, or if external services need to interact with the backend directly). These routes will be consumed by Server Actions or other server-side logic, not directly by client-side components for data fetching.

#### Example API Interactions (Conceptual)

**1. Fetching Affiliate Traffic Data (Server Component):**

```typescript
// app/dashboard/traffic/page.tsx (Server Component)
import { getAffiliateTrafficData } from '@/lib/data'; // Server Action/Function

export default async function TrafficDashboard({ searchParams }) {
  const { dateRange, country } = searchParams;
  const trafficData = await getAffiliateTrafficData(dateRange, country);
  // Render UI with trafficData
  return (
    <div>
      {/* ... UI elements ... */}
    </div>
  );
}

// lib/data.ts (Server Action/Function)
import { db } from '@/lib/db'; // Prisma/Drizzle client

export async function getAffiliateTrafficData(dateRange, country) {
  // No direct SQL queries on the client!
  // Data fetching logic executed on the server
  const data = await db.affiliateTrafficData.findMany({
    where: {
      date: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
      country: country,
    },
    // ... other query options
  });
  return data;
}
```

**2. Uploading CSV Data (Internal API Route & Server Action):**

```typescript
// app/api/upload-csv/route.ts (Next.js API Route)
import { NextResponse } from 'next/server';
import { processCSVUpload } from '@/lib/data'; // Server-side function

export async function POST(request: Request) {
  const formData = await request.formData();
  const csvFile = formData.get('file');
  const userId = formData.get('userId'); // Assuming userId is passed securely

  if (!csvFile || !userId) {
    return NextResponse.json({ error: 'Missing file or user ID' }, { status: 400 });
  }

  try {
    await processCSVUpload(csvFile, userId);
    return NextResponse.json({ message: 'CSV uploaded and processed successfully' });
  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json({ error: 'Failed to process CSV' }, { status: 500 });
  }
}

// lib/data.ts (Server-side function called by API Route or Server Action)
import { db } from '@/lib/db';
import { parseCSV } from '@/lib/utils'; // Utility for CSV parsing

export async function processCSVUpload(csvFile, userId) {
  const text = await csvFile.text();
  const parsedData = parseCSV(text); // Implement CSV parsing logic
  // Perform deduplication and save to DB
  for (const row of parsedData) {
    await db.affiliateTrafficData.upsert({ // Example: upsert for deduplication
      where: { /* unique identifier for row */ },
      update: { /* ... */ },
      create: {
        date: new Date(row.date),
        foreignBrandId: parseInt(row.foreign_brand_id),
        // ... map other fields
        uploadedFromCSVId: 'some-generated-upload-id', // Link to CSVUpload record
      },
    });
  }
  // Update CSVUpload record status
}
```

### Components

Based on the architectural patterns, tech stack, and data models defined, the application will consist of the following major logical components:

#### Authentication & Authorization Service

**Responsibility:** Manages user authentication (login, logout, session management) and authorization (role-based access control). It will handle user creation and management for administrators.

**Key Interfaces:**
- User login endpoint (`/api/auth/login`)
- User logout endpoint (`/api/auth/logout`)
- User management endpoints (e.g., `/api/admin/users`)
- Session validation middleware/functions

**Dependencies:** Database (for user data), `better-auth` library.

**Technology Stack:** Node.js/Next.js API Routes, `better-auth` library, Prisma/Drizzle ORM.

#### Data Ingestion Service

**Responsibility:** Handles the upload, parsing, validation, and storage of CSV data into the PostgreSQL database. It will perform deduplication during ingestion.

**Key Interfaces:**
- CSV upload endpoint (`/api/data/upload-csv`)

**Dependencies:** Database, file parsing utilities (e.g., `csv-parser`), Arquero (for data manipulation during processing).

**Technology Stack:** Node.js/Next.js API Routes, Prisma/Drizzle ORM, Arquero.

#### Reporting Service

**Responsibility:** Fetches, processes, and aggregates data from the database to generate various reports (e.g., Cohort Report). This service will encapsulate the business logic for report generation.

**Key Interfaces:**
- Functions/Server Actions for specific report data retrieval (e.g., `getAffiliateTrafficData`, `getPlayerConversionData`).
- Internal data processing functions.

**Dependencies:** Database, Arquero (for in-memory data manipulation).

**Technology Stack:** Next.js Server Actions, Prisma/Drizzle ORM, Arquero.

#### User Interface (UI) Components

**Responsibility:** Provides the visual and interactive elements of the dashboard, including navigation, data display, forms, and user settings.

**Key Interfaces:**
- Shadcn UI components.
- Custom React components for specific views and interactions.

**Dependencies:** Next.js, Shadcn UI, Shadcn Charts, React Context/Zustand (for local state).

**Technology Stack:** Next.js 15, React, TypeScript, Shadcn UI, Shadcn Charts, Tailwind CSS.

#### Shared Utilities & Types

**Responsibility:** Contains common utilities, helper functions, and TypeScript interfaces/types that are shared across frontend and backend components to ensure consistency and type safety.

**Key Interfaces:**
- Shared data models (e.g., `AffiliateTrafficData`, `PlayerConversionData` interfaces).
- Utility functions (e.g., date formatting, data validation helpers).

**Dependencies:** None (acts as a foundational layer).

**Technology Stack:** TypeScript.

#### Component Diagrams

```mermaid
graph TD
    User[User] -->|Accesses| Frontend[Next.js Frontend (UI Components)]
    Frontend -->|Authenticates| AuthSvc[Authentication & Authorization Service]
    Admin[Admin User] -->|Uploads CSV| DataIngestionSvc[Data Ingestion Service]
    Frontend -->|Requests Reports| ReportingSvc[Reporting Service]
    AuthSvc -->|Manages| Database[PostgreSQL Database]
    DataIngestionSvc -->|Stores Data| Database
    ReportingSvc -->|Retrieves Data| Database
    Shared[Shared Utilities & Types] --> Frontend
    Shared --> AuthSvc
    Shared --> DataIngestionSvc
    Shared --> ReportingSvc
```

### External APIs

For the Minimum Viable Product (MVP), no external API integrations are required. Data ingestion will be handled via manual CSV file uploads through an administrative interface, as specified in the Project Requirements Document.

### Core Workflows

This section illustrates the key system workflows using Mermaid sequence diagrams, focusing on critical user journeys and component interactions.

#### 1. User Login Workflow

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant AuthNService[Authentication & Authorization Service]
    participant Database

    User->>Frontend: Enters credentials (email, password)
    Frontend->>AuthNService: Sends login request
    AuthNService->>Database: Queries User by email
    Database-->>AuthNService: Returns User data (hashed password, 2FA status)
    AuthNService->>AuthNService: Verifies password
    alt 2FA Enabled
        AuthNService->>Frontend: Requests 2FA code
        Frontend->>User: Prompts for 2FA code
        User->>Frontend: Enters 2FA code
        Frontend->>AuthNService: Sends 2FA code
        AuthNService->>AuthNService: Validates 2FA code
    end
    AuthNService-->>Frontend: Returns authentication token & user roles
    Frontend->>User: Grants access to dashboard
```

#### 2. Admin CSV Data Upload Workflow

```mermaid
sequenceDiagram
    actor Admin
    participant Frontend
    participant DataIngestionService
    participant Database

    Admin->>Frontend: Navigates to Data Management page
    Frontend->>Admin: Displays CSV upload interface
    Admin->>Frontend: Selects and uploads CSV file
    Frontend->>DataIngestionService: Sends CSV file (via API route)
    DataIngestionService->>DataIngestionService: Parses CSV & performs deduplication
    DataIngestionService->>Database: Stores processed data
    Database-->>DataIngestionService: Confirmation of data storage
    DataIngestionService-->>Frontend: Returns upload status (success/failure)
    Frontend->>Admin: Displays toast notification
```

#### 3. Affiliate Cohort Report Generation Workflow

```mermaid
sequenceDiagram
    actor Affiliate
    participant Frontend
    participant ReportingService
    participant Database

    Affiliate->>Frontend: Navigates to Cohort Report page
    Frontend->>Affiliate: Displays filter options
    Affiliate->>Frontend: Selects report parameters (e.g., date range, country)
    Frontend->>ReportingService: Requests Cohort Report data (via Server Action)
    ReportingService->>Database: Queries AffiliateTrafficData based on parameters
    Database-->>ReportingService: Returns raw traffic data
    ReportingService->>ReportingService: Processes and aggregates data (e.g., calculates cohorts)
    ReportingService-->>Frontend: Returns aggregated report data
    Frontend->>Affiliate: Displays Cohort Report
```

### Database Schema

#### 1. `User` Table

```sql
-- Conceptual PostgreSQL DDL for User table
CREATE TABLE "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin' or 'user'
    "is2faEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `CSVUpload` Table

```sql
-- Conceptual PostgreSQL DDL for CSVUpload table
CREATE TABLE "CSVUpload" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "fileName" TEXT NOT NULL,
    "uploadDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "uploadedByUserId" UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    "deduplicatedRecordsCount" INTEGER,
    "rawRecordsCount" INTEGER,
    CONSTRAINT fk_uploaded_by_user FOREIGN KEY ("uploadedByUserId") REFERENCES "User"(id)
);
```

#### 3. `AffiliateTrafficData` Table

```sql
-- Conceptual PostgreSQL DDL for AffiliateTrafficData table
CREATE TABLE "AffiliateTrafficData" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    "foreignBrandId" INTEGER NOT NULL,
    "foreignPartnerId" INTEGER NOT NULL,
    "foreignCampaignId" INTEGER NOT NULL,
    "foreignLandingId" INTEGER NOT NULL,
    "trafficSource" TEXT,
    "deviceType" TEXT,
    "userAgentFamily" TEXT,
    "osFamily" TEXT,
    country TEXT,
    "allClicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "registrationsCount" INTEGER NOT NULL DEFAULT 0,
    "ftdCount" INTEGER NOT NULL DEFAULT 0,
    "depositsCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedFromCSVId" UUID NOT NULL,
    CONSTRAINT fk_csv_upload FOREIGN KEY ("uploadedFromCSVId") REFERENCES "CSVUpload"(id)
);
```

#### 4. `PlayerConversionData` Table

```sql
-- Conceptual PostgreSQL DDL for PlayerConversionData table
CREATE TABLE "PlayerConversionData" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "playerId" INTEGER NOT NULL,
    "originalPlayerId" INTEGER,
    "signUpDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "firstDepositDate" TIMESTAMP WITH TIME ZONE,
    "partnerId" INTEGER NOT NULL,
    "companyName" TEXT,
    "partnerTags" TEXT,
    "campaignId" INTEGER,
    "campaignName" TEXT,
    "promoId" INTEGER,
    "promoCode" TEXT,
    "playerCountry" TEXT,
    "tagClickid" TEXT,
    "tagOs" TEXT,
    "tagSource" TEXT,
    "tagSub2" TEXT,
    "tagWebID" TEXT,
    date DATE NOT NULL,
    prequalified INTEGER,
    duplicate INTEGER,
    "selfExcluded" INTEGER,
    disabled INTEGER,
    currency TEXT,
    "ftdCount" INTEGER,
    "ftdSum" NUMERIC,
    "depositsCount" INTEGER,
    "depositsSum" NUMERIC,
    "cashoutsCount" INTEGER,
    "cashoutsSum" NUMERIC,
    "casinoBetsCount" INTEGER,
    "casinoRealNGR" NUMERIC,
    "fixedPerPlayer" NUMERIC,
    "casinoBetsSum" NUMERIC,
    "casinoWinsSum" NUMERIC
);
```

### Frontend Architecture

#### Component Architecture

##### Component Organization

```text
components/
├── ui/                  # Shadcn UI components (auto-generated/customized)
├── layout/              # Components for overall page structure (Header, Sidebar, Footer)
├── auth/                # Authentication-related components (Login Form, 2FA Input)
├── data-management/     # Components for CSV upload and data display
├── reports/             # Components specific to different reports (e.g., CohortReportTable, FilterPanel)
├── common/              # Reusable, generic components (Buttons, Modals, Loaders)
└── hooks/               # Custom React hooks for reusable logic
```

##### Component Template

```typescript
// components/feature/FeatureComponent.tsx
import React from 'react';
import { cn } from '@/lib/utils'; // Utility for Tailwind CSS class merging

interface FeatureComponentProps {
  // Define props specific to this component
  title: string;
  description?: string;
  className?: string;
}

const FeatureComponent: React.FC<FeatureComponentProps> = ({
  title,
  description,
  className,
  children,
}) => {
  return (
    <div className={cn('p-4 border rounded-md', className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="text-sm text-gray-500">{description}</p>}
      {children}
    </div>
  );
};

export default FeatureComponent;
```

#### State Management Architecture

##### State Structure

```typescript
// stores/app-store.ts (Example using Zustand or similar lightweight store)
interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark' | 'system';
  contentLayout: 'centered' | 'full-width';
  notifications: Notification[];
  // ... other global UI state
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  position: 'bottom-left'; // As per PRD
}
```

##### State Management Patterns

-   **Global UI State:** Managed by a centralized store (e.g., Zustand or React Context) for cross-component concerns like user session, theme, and notifications.
-   **Component Local State:** Managed by `useState` and `useReducer` hooks for isolated component-specific data.
-   **Server State (Data Fetching):** Handled by Next.js Server Actions and React Server Components. Data fetched on the server is passed down to client components as props.

#### Routing Architecture

##### Route Organization

```text
app/
├── (auth)/              # Grouped routes for authentication (e.g., /login)
│   └── login/
│       └── page.tsx
├── (dashboard)/         # Grouped routes for authenticated dashboard access
│   ├── layout.tsx       # Dashboard layout with Sidebar and Header
│   ├── page.tsx         # Dashboard home
│   ├── traffic/
│   │   └── page.tsx     # Traffic report page
│   ├── conversions/
│   │   └── page.tsx     # Conversions report page
│   └── admin/
│       ├── layout.tsx   # Admin-specific layout
│       ├── users/
│       │   └── page.tsx # User management page
│       └── data-upload/
│           └── page.tsx # CSV upload page
└── page.tsx             # Public home page (if any)
```

##### Protected Route Pattern

```typescript
// app/(dashboard)/layout.tsx (Example of a protected layout)
import { redirect } from 'next/navigation';
import { validateUserSession } from '@/lib/auth'; // Server-side function to validate session
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Toaster } from 'sonner'; // Centralized toast notifications

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await validateUserSession(); // Server-side session validation

  if (!session) {
    redirect('/login'); // Redirect to login if not authenticated
  }

  // Example of role-based access control for admin routes
  // if (session.user.role !== 'admin' && segment === 'admin') {
  //   redirect('/dashboard');
  // }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
      <Toaster position="bottom-left" />
    </div>
  );
}
```

#### Frontend Services Layer

##### API Client Setup

```typescript
// lib/api.ts (Example of a simple API client for internal API routes)
// This client would be used by Server Actions or other server-side logic
// to interact with Next.js API Routes, NOT directly by client components.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export async function postData(path: string, data: any) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add authorization header if needed (e.g., Bearer token)
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }

  return response.json();
}

// Example for file uploads (multipart/form-data)
export async function uploadFile(path: string, formData: FormData) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body: formData, // FormData handles Content-Type automatically
    // No 'Content-Type' header needed for FormData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'File upload failed');
  }

  return response.json();
}
```

##### Service Example

```typescript
// lib/data.ts (Example of a Server Action/Function using the API client)
import { postData, uploadFile } from '@/lib/api'; // Internal API client
import { revalidatePath } from 'next/cache'; // For data revalidation

export async function uploadAffiliateCSV(formData: FormData) {
  'use server'; // Mark as a Server Action

  try {
    const response = await uploadFile('/data/upload-csv', formData);
    revalidatePath('/dashboard/data-management'); // Revalidate data on success
    return { success: true, message: response.message };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to upload CSV' };
  }
}

export async function getCohortReport(dateRange: { start: Date; end: Date }, country: string) {
  'use server'; // Mark as a Server Action

  // This function would directly query the database using Prisma/Drizzle
  // as it's a Server Action, eliminating the need for an explicit API route for data fetching.
  // Example (conceptual, actual implementation depends on ORM setup):
  // const data = await prisma.affiliateTrafficData.findMany({
  //   where: {
  //     date: { gte: dateRange.start, lte: dateRange.end },
  //     country: country,
  //   },
  // });
  // return data;
  return { message: "Cohort report data will be fetched directly from DB in Server Action" };
}
```

### Backend Architecture

This section details the backend-specific architecture, which is tightly integrated with the Next.js frontend through Server Actions and API Routes. The core principle is to centralize data processing and business logic on the server, eliminating direct client-side database interactions.

#### Service Architecture

Given the choice of Next.js and the emphasis on Server Components and Server Actions, the application will primarily operate as a **monolithic service** where backend logic is co-located with the frontend within the Next.js application. This simplifies deployment and development for the MVP.

*   **Next.js Server Actions:** These will encapsulate most of the business logic and data mutations. They run directly on the server and can interact with the database or other backend resources. This is the primary mechanism for handling data operations triggered by the frontend.
*   **Next.js API Routes:** These will serve as traditional API endpoints for specific functionalities, such as handling CSV file uploads or potentially integrating with external services in the future. They can also be called by Server Actions for internal communication.

##### Function Organization (within Next.js structure)

```text
app/
├── api/                 # Next.js API Routes
│   ├── data/
│   │   └── upload-csv/  # Endpoint for CSV uploads
│   │       └── route.ts
│   └── auth/
│       ├── login/
│       │   └── route.ts
│       └── logout/
│           └── route.ts
├── lib/                 # Server-side libraries and functions
│   ├── data.ts          # Server Actions/functions for data fetching and mutations
│   ├── auth.ts          # Authentication related server-side logic
│   ├── db.ts            # Database client initialization (Prisma/Drizzle)
│   └── utils.ts         # General server-side utilities
```

#### Database Architecture

The database architecture will be based on **PostgreSQL**, accessed via an ORM (Prisma or Drizzle). All database interactions will occur exclusively on the server side, primarily within Next.js Server Actions or API Routes.

##### Schema Design

The schema design will follow the `User`, `CSVUpload`, `AffiliateTrafficData`, and `PlayerConversionData` models defined previously. The ORM will manage the migrations and schema synchronization.

```sql
-- Example of a simplified table creation (actual DDL will be managed by ORM migrations)
CREATE TABLE "AffiliateTrafficData" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    "foreignBrandId" INTEGER NOT NULL,
    "foreignPartnerId" INTEGER NOT NULL,
    "foreignCampaignId" INTEGER NOT NULL,
    "foreignLandingId" INTEGER NOT NULL,
    "trafficSource" TEXT,
    "deviceType" TEXT,
    "userAgentFamily" TEXT,
    "osFamily" TEXT,
    country TEXT,
    "allClicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "registrationsCount" INTEGER NOT NULL DEFAULT 0,
    "ftdCount" INTEGER NOT NULL DEFAULT 0,
    "depositsCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedFromCSVId" UUID NOT NULL
);
```

##### Data Access Layer

The data access layer will be implemented using either **Prisma** or **Drizzle ORM**. This provides a type-safe and efficient way to interact with the PostgreSQL database.

```typescript
// lib/db.ts (Conceptual ORM client initialization)
import { PrismaClient } from '@prisma/client'; // If using Prisma
// import { drizzle } from 'drizzle-orm/node-postgres'; // If using Drizzle

// For Prisma
export const db = new PrismaClient();

// For Drizzle (conceptual)
// import { Pool } from 'pg';
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// export const db = drizzle(pool);
```

#### Authentication and Authorization

Authentication and authorization will be handled server-side using the `better-auth` library, integrated within Next.js API Routes and Server Actions.

##### Auth Flow (Conceptual)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant AuthNService[Next.js Auth API Route]
    participant Database

    User->>Frontend: Submits login form
    Frontend->>AuthNService: POST /api/auth/login (credentials)
    AuthNService->>Database: Query User by email
    Database-->>AuthNService: User data
    AuthNService->>AuthNService: Verify password & 2FA
    alt Authentication Success
        AuthNService-->>Frontend: Set secure session cookie / Return token
        Frontend->>User: Redirect to dashboard
    else Authentication Failure
        AuthNService-->>Frontend: Return error message
        Frontend->>User: Display error
    end
```

##### Middleware/Guards (Conceptual)

Authorization will be enforced by checking user roles within Server Actions or API Routes. This acts as a "guard" to protect sensitive data and functionalities.

```typescript
// lib/auth.ts (Conceptual server-side authorization helper)
import { cookies } from 'next/headers'; // Access cookies in Server Actions/Routes
import { redirect } from 'next/navigation';
import { db } from './db'; // ORM client

export async function validateUserSession() {
  const sessionToken = cookies().get('session')?.value;
  if (!sessionToken) {
    return null; // No session token found
  }

  // In a real app, validate the sessionToken against your auth system (e.g., better-auth)
  // For now, a placeholder:
  const user = await db.user.findUnique({ where: { sessionToken } }); // Assuming sessionToken is stored on User
  if (!user) {
    return null;
  }
  return user; // Return user object if session is valid
}

export function requireAdmin(user: any) { // User object from validateUserSession
  if (!user || user.role !== 'admin') {
    redirect('/unauthorized'); // Redirect or throw error
  }
}
```

### Unified Project Structure

The project will be structured as a monorepo, containing both frontend and backend applications, along with shared code and infrastructure definitions. This approach simplifies dependency management, facilitates code sharing, and streamlines development workflows.

```plaintext
traffboard/
├── .github/                    # CI/CD workflows (e.g., GitHub Actions)
│   └── workflows/
│       ├── ci.yaml             # Continuous Integration workflow
│       └── deploy.yaml         # Continuous Deployment workflow
├── apps/                       # Application packages
│   ├── web/                    # Next.js Frontend application
│   │   ├── src/
│   │   │   ├── components/     # UI components (Shadcn, custom)
│   │   │   ├── app/            # Next.js App Router pages and layouts
│   │   │   ├── lib/            # Client-side utilities, hooks
│   │   │   └── styles/         # Global styles/themes
│   │   ├── public/             # Static assets
│   │   ├── tests/              # Frontend tests (Jest, Playwright)
│   │   └── package.json
│   └── api/                    # Node.js Backend (Next.js API Routes/Server Actions)
│       ├── src/
│       │   ├── app/api/        # Next.js API Routes
│       │   ├── lib/            # Server-side logic, data access (ORM), utilities
│       │   └── types/          # Backend-specific types
│       ├── tests/              # Backend tests (Jest)
│       └── package.json
├── packages/                   # Shared packages
│   ├── shared/                 # Shared types, constants, and utilities
│   │   ├── src/
│   │   │   ├── types/          # TypeScript interfaces/types (e.g., data models)
│   │   │   ├── constants/      # Shared constants
│   │   │   └── utils/          # Shared utility functions
│   │   └── package.json
│   └── ui/                     # Shared UI components (if any, beyond Shadcn)
│       ├── src/
│       └── package.json
├── infrastructure/             # IaC definitions (e.g., DigitalOcean config)
│   └── digitalocean/
│       └── app-platform.yaml   # DigitalOcean App Platform configuration
├── scripts/                    # Build/deploy scripts
├── docs/                       # Project documentation (PRD, Architecture, etc.)
│   ├── prd.md
│   └── architecture.md
├── .env.example                # Environment variables template
├── package.json                # Root package.json (for monorepo workspaces)
├── tsconfig.json               # Root TypeScript configuration
└── README.md
```

### Development Workflow

#### Local Development Setup

##### Prerequisites

```bash
# Node.js (v18 or later recommended)
# npm (v8 or later recommended)
# PostgreSQL (local or accessible instance)
# Git
```

##### Initial Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd traffboard

# 2. Install root dependencies
npm install

# 3. Install application-specific dependencies (for web and api apps)
npm install --workspace=apps/web
npm install --workspace=apps/api

# 4. Set up environment variables
# Create .env.local in the root directory and populate it based on .env.example
# Example .env.local:
# DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase"
# BETTER_AUTH_SECRET="YOUR_BETTER_AUTH_SECRET_HERE" # Placeholder for better-auth secret
# NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"

# 5. Initialize the database schema (if using Prisma/Drizzle)
# For Prisma:
# npx prisma migrate dev --name init

# For Drizzle:
# npx drizzle-kit push:pg
```

##### Development Commands

```bash
# Start all services (frontend and backend API routes/server actions)
npm run dev

# Start frontend only (for isolated frontend development)
npm run dev --workspace=apps/web

# Start backend only (if applicable, for isolated backend API development)
# Note: Next.js API routes and Server Actions are part of the Next.js dev server.
# Running 'npm run dev' for the web app will also run the backend.
# If a separate Node.js/Express server was used, a command like 'npm run dev --workspace=apps/api'
# would start that server. For this project, the backend is integrated with Next.js.

# Run all tests (frontend and backend)
npm test

# Run frontend tests only
npm test --workspace=apps/web

# Run backend tests only
npm test --workspace=apps/api
```

#### Environment Configuration

##### Required Environment Variables

```bash
# .env.local (in root directory)

# Database Connection String
DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase"

# better-auth Secret (specific environment variables for better-auth to be determined)
BETTER_AUTH_SECRET="YOUR_BETTER_AUTH_SECRET_HERE"

# Public API Base URL (for frontend to call internal API routes)
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"
```

### Deployment Architecture

This section defines the deployment strategy for the fullstack application, leveraging DigitalOcean's App Platform for hosting and GitHub Actions for CI/CD.

#### Deployment Strategy

**Frontend Deployment:**
-   **Platform:** DigitalOcean App Platform
-   **Build Command:** `npm run build --workspace=apps/web` (or `next build` if run from `apps/web` directory)
-   **Output Directory:** `.next` (default for Next.js)
-   **CDN/Edge:** DigitalOcean App Platform's integrated CDN capabilities.

**Backend Deployment:**
-   **Platform:** DigitalOcean App Platform
-   **Build Command:** `npm run build --workspace=apps/api` (or handled by Next.js build process for API routes/Server Actions)
-   **Deployment Method:** Integrated within the Next.js application deployment on App Platform.

#### CI/CD Pipeline

Continuous Integration and Continuous Deployment will be implemented using **GitHub Actions**. The pipeline will automate testing and deployment to DigitalOcean from the `main` branch.

```yaml
# .github/workflows/deploy.yaml
name: Deploy to DigitalOcean App Platform

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18' # Or your preferred Node.js version
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build application
        run: npm run build # This will build both web and api apps in a monorepo

      - name: Deploy to DigitalOcean App Platform
        uses: digitalocean/app_platform_deploy@v1.0.0
        with:
          digitalocean_access_token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
          app_name: internal-affiliate-dashboard # Replace with your actual app name
          # component_name: web # If deploying a specific component, otherwise omit for full app
```

#### Environments

| Environment | Frontend URL | Backend URL | Purpose |
| :---------- | :----------- | :---------- | :------ |
| Development | `localhost:3000` | `localhost:3000/api` | Local development |
| Staging     | `(DigitalOcean Staging URL)` | `(DigitalOcean Staging URL)/api` | Pre-production testing |
| Production  | `(DigitalOcean Production URL)` | `(DigitalOcean Production URL)/api` | Live environment |

### Security and Performance

This section outlines the key security and performance considerations for the fullstack application, ensuring a robust and efficient user experience.

#### Security Requirements

**Frontend Security:**
-   **CSP Headers:** Implement Content Security Policy (CSP) headers to mitigate Cross-Site Scripting (XSS) and data injection attacks by specifying allowed content sources.
-   **XSS Prevention:** Utilize React's automatic escaping of rendered content and sanitize any user-generated content before displaying it.
-   **Secure Storage:** Avoid storing sensitive user information (like authentication tokens) directly in `localStorage`. Prefer HTTP-only cookies for session management.

**Backend Security:**
-   **Input Validation:** Rigorously validate all incoming data on the server-side to prevent injection attacks (SQL, NoSQL, Command Injection) and ensure data integrity.
-   **Rate Limiting:** Implement rate limiting on authentication endpoints and other sensitive API routes to prevent brute-force attacks and abuse.
-   **CORS Policy:** Configure Cross-Origin Resource Sharing (CORS) headers to restrict API access to allowed origins, preventing unauthorized cross-origin requests.

**Authentication Security:**
-   **Token Storage:** Store authentication tokens securely (e.g., HTTP-only cookies) to prevent client-side JavaScript access and XSS vulnerabilities.
-   **Session Management:** Implement robust session management, including token expiration, renewal, and invalidation mechanisms.
-   **Password Policy:** Enforce strong password policies (minimum length, complexity requirements) and store password hashes using a strong, adaptive hashing algorithm (e.g., bcrypt).

#### Performance Optimization

**Frontend Performance:**
-   **Bundle Size Target:** Aim for optimized JavaScript bundle sizes through code splitting, lazy loading, and tree-shaking to reduce initial load times.
-   **Loading Strategy:** Implement efficient loading strategies for images and other assets (e.g., Next.js Image component, lazy loading).
-   **Caching Strategy:** Utilize browser caching for static assets and implement server-side caching for frequently accessed data where appropriate.

**Backend Performance:**
-   **Response Time Target:** Target API response times of under 500ms for critical operations to ensure a responsive user experience.
-   **Database Optimization:** Optimize database queries with proper indexing, efficient query design, and connection pooling.
-   **Caching Strategy:** Implement server-side caching (e.g., Redis) for frequently accessed data to reduce database load and improve response times.

### Testing Strategy

A comprehensive testing strategy will be implemented across the fullstack application to ensure code quality, reliability, and adherence to requirements. Testing will be integrated from the first commit, as specified in the PRD.

#### Testing Pyramid

The project will follow a testing pyramid approach, prioritizing faster, more isolated tests at the base and fewer, more comprehensive tests at the top.

```text
                  E2E Tests
                 /        \
            Integration Tests
               /            \
          Frontend Unit  Backend Unit
```

#### Test Organization

Tests will be organized alongside the code they test, following a clear and consistent directory structure.

##### Frontend Tests

```text
apps/web/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.test.tsx # Unit test for Button component
│   │   └── ...
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── dashboard.test.tsx # Integration test for dashboard page
│   │   └── ...
│   └── hooks/
│       ├── useAuth.ts
│       └── useAuth.test.ts # Unit test for custom hook
└── tests/ # Dedicated folder for Playwright E2E tests
    ├── e2e/
    │   ├── auth.spec.ts
    │   └── reports.spec.ts
```

##### Backend Tests

```text
apps/api/
├── src/
│   ├── app/api/
│   │   ├── data/
│   │   │   └── upload-csv/
│   │   │       └── route.test.ts # Integration test for API route
│   │   └── auth/
│   │       └── login/
│   │           └── route.test.ts
│   │   └── ...
│   └── lib/
│       ├── data.ts
│       ├── data.test.ts # Unit/integration tests for server-side functions
│       └── auth.ts
│           └── auth.test.ts
└── tests/ # Playwright E2E tests (shared with frontend)
    └── e2e/
        # ... (same as frontend e2e tests, as they test the full stack)
```

##### E2E Tests

```text
# Located in apps/web/tests/e2e/ or a shared top-level tests/e2e/ directory
# These tests will interact with the deployed application through the browser.
```

#### Test Examples (Conceptual)

##### Frontend Component Test (Jest + React Testing Library)

```typescript
// components/common/Button/Button.test.tsx
import { render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Test</Button>);
    screen.getByText('Test').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

##### Backend API Test (Jest)

```typescript
// apps/api/src/app/api/data/upload-csv/route.test.ts
import { POST } from './route'; // Assuming POST is exported from route.ts
import { NextRequest } from 'next/server';

describe('POST /api/data/upload-csv', () => {
  it('should return 200 for successful CSV upload', async () => {
    // Mock FormData and file content
    const mockFormData = new FormData();
    mockFormData.append('file', new Blob(['csv,data'], { type: 'text/csv' }), 'test.csv');
    mockFormData.append('userId', 'test-user-id');

    const mockRequest = new NextRequest('http://localhost/api/data/upload-csv', {
      method: 'POST',
      body: mockFormData,
    });

    // Mock the internal processCSVUpload function
    jest.mock('@/lib/data', () => ({
      processCSVUpload: jest.fn().mockResolvedValue(true),
    }));

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toBe('CSV uploaded and processed successfully');
  });

  // Add tests for error cases, invalid input, etc.
});
```

##### E2E Test (Playwright)

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can log in successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Assuming 2FA is optional and not always triggered for this test user
  // If 2FA is always on, add steps to fill 2FA code

  await expect(page).toHaveURL('/dashboard'); // Verify redirection to dashboard
  await expect(page.getByText('Welcome to your Dashboard')).toBeVisible();
});

test('admin can upload CSV', async ({ page }) => {
  // Assuming admin is already logged in or login steps are included
  await page.goto('/admin/data-upload');
  await page.setInputFiles('input[type="file"]', 'path/to/test-data.csv'); // Provide a path to a test CSV file
  await page.click('button:has-text("Upload")');
  await expect(page.getByText('CSV uploaded and processed successfully')).toBeVisible();
});
```

### Coding Standards

This section defines minimal but critical coding standards for AI agents and human developers. The focus is on project-specific rules that prevent common mistakes and ensure consistency, rather than exhaustive style guides. These standards will guide the development agents during implementation.

#### Critical Fullstack Rules

-   **Type Sharing:** Always define shared TypeScript types (e.g., data models, common utility types) in `packages/shared/src/types/` and import them from there. This ensures a single source of truth for data structures across the monorepo.
-   **API Calls (Frontend):** Frontend components and client-side logic must **never** make direct HTTP calls to external APIs or directly query the database. All data fetching and mutations should be initiated via Next.js Server Actions or by calling internal Next.js API Routes (which are then handled by server-side logic).
-   **Environment Variables:** Access environment variables only through a centralized configuration object or utility function. Avoid direct `process.env.VAR_NAME` access scattered throughout the codebase.
-   **Error Handling (API Routes/Server Actions):** All Next.js API Routes and Server Actions must implement robust error handling. Errors should be caught, logged on the server, and returned to the client in a standardized format (e.g., JSON with `code`, `message`, `details`).
-   **State Updates (React):** Never mutate React state directly. Always use the state setter functions provided by `useState` or dispatch actions/setters from state management libraries (e.g., Zustand).

#### Naming Conventions

| Element | Frontend (Example) | Backend (Example) | Example |
| :------ | :----------------- | :---------------- | :------ |
| Components | `PascalCase` | - | `UserProfile.tsx` |
| Hooks | `camelCase` with `use` | - | `useAuth.ts` |
| API Routes | - | `kebab-case` | `/api/user-profile` |
| Database Tables | - | `snake_case` | `user_profiles` |
| Database Columns | - | `snake_case` | `sign_up_date` |
| TypeScript Interfaces | `PascalCase` | `PascalCase` | `IUser`, `AffiliateTrafficData` |
| TypeScript Types | `camelCase` | `camelCase` | `UserRole`, `TrafficSourceType` |
| Functions | `camelCase` | `camelCase` | `fetchUserData`, `processCSV` |
| Variables | `camelCase` | `camelCase` | `userName`, `recordCount` |

### Error Handling Strategy

A unified error handling strategy will be implemented across both the frontend and backend to provide consistent user feedback, facilitate debugging, and ensure system stability.

#### Error Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend[Next.js Server Action/API Route]
    participant Database

    User->>Frontend: Initiates action (e.g., form submission, report request)
    Frontend->>Backend: Sends request
    Backend->>Database: Performs database operation
    alt Database Error
        Database--xBackend: Returns database error
        Backend->>Backend: Catches error, logs details, transforms to standard API error format
        Backend--xFrontend: Returns standard API error response (e.g., 500 Internal Server Error)
        Frontend->>Frontend: Catches API error, displays user-friendly message via toast notification
        Frontend--xUser: Displays error message
    else Backend Business Logic Error
        Backend->>Backend: Catches business logic error, logs details, transforms to standard API error format
        Backend--xFrontend: Returns standard API error response (e.g., 400 Bad Request, 404 Not Found)
        Frontend->>Frontend: Catches API error, displays user-friendly message via toast notification
        Frontend--xUser: Displays error message
    else Success
        Backend-->>Frontend: Returns successful response
        Frontend->>User: Displays success/updated UI
    end
```

#### Error Response Format

All API errors returned to the frontend will adhere to a standardized JSON format.

```typescript
interface ApiError {
  error: {
    code: string;          // A unique code identifying the error type (e.g., "VALIDATION_ERROR", "DATABASE_ERROR")
    message: string;       // A user-friendly message describing the error
    details?: Record<string, any>; // Optional: additional details (e.g., validation errors for specific fields)
    timestamp: string;     // ISO 8601 timestamp of when the error occurred
    requestId: string;     // A unique ID for the request, useful for tracing in logs
  };
}
```

#### Frontend Error Handling

Frontend error handling will focus on gracefully displaying user-friendly messages and providing appropriate fallback UIs.

```typescript
// lib/error-handler.ts (Conceptual frontend error handling utility)
import { toast } from 'sonner'; // Centralized toast notification system

export function handleApiError(error: any) {
  const errorMessage = error.message || 'An unexpected error occurred.';
  const errorDetails = error.details ? JSON.stringify(error.details) : '';

  console.error('API Error:', errorMessage, errorDetails); // Log to console for debugging

  toast.error(errorMessage, {
    description: errorDetails,
    position: 'bottom-left', // As per PRD
  });

  // Optionally, re-throw or return specific error types for further handling in components
  throw error;
}

// Example usage in a React component or Server Action caller
// try {
//   await someServerAction();
// } catch (error) {
//   handleApiError(error);
// }
```

#### Backend Error Handling

Backend error handling will involve catching errors, logging detailed information, and transforming them into the standardized `ApiError` format before sending them to the frontend.

```typescript
// lib/server-error-handler.ts (Conceptual backend error handling utility)
import { v4 as uuidv4 } from 'uuid'; // For generating request IDs

export function createApiError(
  code: string,
  message: string,
  details?: Record<string, any>,
  originalError?: Error
): ApiError {
  const requestId = uuidv4();
  if (originalError) {
    console.error(`[${requestId}] Backend Error: ${code} - ${message}`, originalError.stack, details);
  } else {
    console.error(`[${requestId}] Backend Error: ${code} - ${message}`, details);
  }

  return {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

// Example usage in a Next.js API Route or Server Action
// try {
//   // ... business logic ...
// } catch (error: any) {
//   if (error.name === 'PrismaClientKnownRequestError') {
//     // Handle specific database errors
//     return NextResponse.json(
//       createApiError('DATABASE_ERROR', 'A database error occurred.', { prismaCode: error.code }),
//       { status: 500 }
//     );
//   } else if (error instanceof CustomValidationError) {
//     // Handle custom business logic errors
//     return NextResponse.json(
//       createApiError('VALIDATION_ERROR', error.message, error.details),
//       { status: 400 }
//     );
//   } else {
//     // Catch-all for unexpected errors
//     return NextResponse.json(
//       createApiError('UNEXPECTED_ERROR', 'An unexpected server error occurred.'),
//       { status: 500 }
//     );
//   }
// }
```

### Monitoring and Observability

Effective monitoring and observability are crucial for understanding the application's health, performance, and user experience in production. This section outlines the strategy for collecting and analyzing metrics, logs, and traces.

#### Monitoring Stack

-   **Frontend Monitoring:**
    -   **Core Web Vitals:** Track metrics like Largest Contentful Paint (LCP), First Input Delay (FID), and Cumulative Layout Shift (CLS) to assess user experience.
    -   **JavaScript Errors:** Monitor client-side JavaScript errors for immediate detection of issues affecting users.
    -   **API Response Times:** Track the performance of API calls made from the frontend.
-   **Backend Monitoring:**
    -   **Request Rate:** Monitor the number of requests per second to identify traffic patterns and potential load issues.
    -   **Error Rate:** Track the percentage of requests resulting in errors to quickly detect service degradation.
    -   **Response Time:** Monitor the latency of backend API responses.
    -   **Database Query Performance:** Track query execution times and identify slow queries.
-   **Error Tracking:** Utilize a dedicated error tracking service (e.g., Sentry, Bugsnag) to capture, aggregate, and alert on application errors from both frontend and backend.
-   **Performance Monitoring:** Implement Application Performance Monitoring (APM) tools (e.g., New Relic, Datadog) for end-to-end visibility into application performance.

#### Key Metrics

**Frontend Metrics:**
-   **Core Web Vitals:** Essential for understanding perceived user performance.
-   **JavaScript errors:** Indicate client-side issues impacting user experience.
-   **API response times:** Directly impact user perceived speed and responsiveness.
-   **User interactions:** Track key user flows and feature usage.

**Backend Metrics:**
-   **Request rate:** Indicates overall load and potential scaling needs.
-   **Error rate:** Critical for immediate detection of service health issues.
-   **Response time:** Measures the efficiency of backend processing.
-   **Database query performance:** Identifies bottlenecks in data retrieval.
