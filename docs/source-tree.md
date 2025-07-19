# Source Tree Structure

## Root Directory (Monorepo)
```
traffboard/
├── .bmad-core/                    # BMad framework configuration
├── .bmad-infrastructure-devops/   # Infrastructure and DevOps configs
├── .github/                       # CI/CD workflows (GitHub Actions)
│   └── workflows/
│       ├── ci.yaml
│       └── deploy.yaml
├── apps/                          # Application packages
│   ├── web/                       # Next.js Frontend application
│   └── api/                       # Backend (Next.js API Routes/Server Actions)
├── packages/                      # Shared packages
│   ├── shared/                    # Shared types, constants, utilities
│   └── ui/                        # Shared UI components
├── infrastructure/                # IaC definitions
│   └── digitalocean/
│       └── app-platform.yaml
├── docs/                          # Project documentation
│   ├── architecture/
│   ├── prd.md
│   └── stories/
├── scripts/                       # Build/deploy scripts
├── package.json                   # Root monorepo config
├── tsconfig.json                  # Root TypeScript config
└── README.md
```

## Next.js Application Structure (apps/web/)
```
apps/web/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/               # Auth route group
│   │   │   └── login/
│   │   ├── (dashboard)/          # Protected dashboard routes
│   │   │   ├── layout.tsx        # Dashboard layout (sidebar/header)
│   │   │   ├── page.tsx          # Dashboard home
│   │   │   ├── traffic/          # Traffic reports
│   │   │   ├── conversions/      # Conversion reports  
│   │   │   └── admin/            # Admin routes
│   │   └── api/                  # Next.js API Routes
│   │       ├── data/
│   │       └── auth/
│   ├── components/               # UI Components
│   │   ├── ui/                   # Shadcn UI components
│   │   ├── layout/               # Layout components (Header, Sidebar)
│   │   ├── auth/                 # Auth components
│   │   ├── reports/              # Report-specific components
│   │   └── common/               # Reusable components
│   ├── lib/                      # Server-side libraries
│   │   ├── data.ts               # Server Actions
│   │   ├── auth.ts               # Auth logic
│   │   ├── db.ts                 # Database client
│   │   └── utils.ts              # Utilities
│   └── styles/                   # Global styles
├── public/                       # Static assets
├── tests/                        # Tests (Jest + Playwright)
└── package.json
```

## Shared Packages Structure
```
packages/shared/
├── src/
│   ├── types/                    # TypeScript interfaces (User, etc.)
│   ├── constants/                # Shared constants
│   └── utils/                    # Shared utility functions
└── package.json
```

## File Naming Conventions
- **Next.js Pages**: folder/page.tsx, folder/layout.tsx
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Server Actions**: camelCase (e.g., `getUserData.ts`)
- **API Routes**: kebab-case folders (e.g., `/api/user-profile/`)
- **Database Tables**: snake_case (e.g., `user_profiles`)
- **Types/Interfaces**: PascalCase (e.g., `AffiliateTrafficData`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `API_ENDPOINTS`)