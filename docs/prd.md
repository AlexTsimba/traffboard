# Internal Affiliate Dashboard Product Requirements Document (PRD)

## Goals and Background Context

### Goals

*   To develop an internal dashboard application for affiliates to create their own reports.
*   To reduce report generation time for affiliates from 2+ hours to under 5 minutes for ad-hoc reports within 3 months of launch.
*   To increase the number of self-generated reports by affiliates by 50% within the first two months post-launch.
*   To decrease ad-hoc report requests to the analytics team by 40% within six months of launch.
*   To achieve full deployment and accessibility on DigitalOcean with a functional database.
*   To ensure a significant portion of target affiliates actively use the dashboard.

### Background Context

This project addresses the critical need for an internal dashboard application to empower affiliates with self-service reporting capabilities. Currently, affiliates are hindered by poor Tableau reports and a time-consuming dependency on analysts for new report generation, leading to significant delays and inefficiencies. The proposed solution aims to provide a fast, reliable, and custom platform for affiliates to generate their own reports, thereby enhancing operational efficiency, improving decision-making speed, and freeing up valuable analyst resources. This initiative is crucial for enabling greater autonomy and agility within the affiliate team.

### Change Log

| Date       | Version | Description          | Author |
| :--------- | :------ | :------------------- | :----- |
| 2025-07-19 | 1.0     | Initial Draft of PRD | John   |

## Requirements

### Functional

1.  **FR1: User Authentication and Authorization:** The system shall provide a secure authentication mechanism for users, managed by an administrator (no self-registration). It shall implement role-based access control (admin/user roles) to restrict access to specific functionalities and data based on user permissions.
2.  **FR2: Two-Factor Authentication (2FA):** The system shall offer optional two-factor authentication for enhanced security.
3.  **FR3: Protected Routes:** The system shall ensure all sensitive routes and data access points are protected from unauthorized access.
4.  **FR4: Core User Interface (UI):** The system shall provide a fundamental graphical user interface for users to navigate the dashboard, view data, and initiate report generation.
5.  **FR5: CSV Data Upload:** The system shall allow administrators to upload affiliate data via CSV files to the database.
6.  **FR6: Data Deduplication:** The system shall automatically handle deduplication of data during the ingestion process to ensure data accuracy and consistency.
7.  **FR7: Programmatic Cohort Report Generation:** The system shall generate a Cohort Report programmatically based on user-selected parameters.
8.  **FR8: DigitalOcean Deployment:** The application shall be deployed and accessible on DigitalOcean App Platform.
9.  **FR9: DigitalOcean Managed Database Integration:** The application shall utilize DigitalOcean Managed Database for data storage.

### Non Functional

1.  **NFR1: Performance - Report Loading Time:** Reports shall load and display within 3 seconds.
2.  **NFR2: Performance - Concurrent Users:** The system shall support at least 10 concurrent users without degradation in performance.
3.  **NFR3: Browser Compatibility:** The application shall support modern versions of Google Chrome and Apple Safari browsers. Support for older browser versions is explicitly out of scope.
4.  **NFR4: Deployment Environment:** The application shall be deployed on DigitalOcean App Platform and utilize DigitalOcean Managed Database.
5.  **NFR5: Development Timeline:** The MVP shall be delivered within two weeks.
6.  **NFR6: Repository Structure:** The project shall be structured as a monorepo.
7.  **NFR7: Service Architecture:** The application shall be developed as a monolithic service.
8.  **NFR8: Data Ingestion Method (MVP):** Initial data ingestion shall be limited to manual CSV file uploads through an administrative data management page.
9.  **NFR9: Security - Access Control:** The system shall enforce role-based access control (admin/user roles).
10. **NFR10: Security - Route Protection:** All sensitive routes and data endpoints shall be protected.
11. **NFR11: Testing:** Jest and Playwright tests shall be implemented from the first commit.
12. **NFR12: CI/CD:** Continuous Integration/Continuous Deployment shall be implemented via GitHub.
13. **NFR13: Deployment Automation:** Deployment to DigitalOcean shall be automated from the GitHub `main` branch.

## User Interface Design Goals

**Overall UX Vision**
The overall UX vision for the internal dashboard is to provide a **clean, intuitive, and highly efficient interface** that empowers affiliates to quickly and reliably generate their own reports. The design will prioritize **clarity and minimalism, with no distracting elements**, to streamline workflows and present data in an easily digestible format, reducing reliance on external assistance. A consistent and clear feedback mechanism will be provided through centralized toast notifications.

**Key Interaction Paradigms**
The primary interaction paradigm will be **self-service reporting**, facilitated by a structured layout. This will involve:
*   **Shadcn Sidebar Navigation:** A persistent sidebar, utilizing Shadcn UI components, will serve as the primary navigation for all protected routes, containing direct links to various reports.
*   **Shadcn Header:** A sticky header, also built with Shadcn UI, will be present on all pages. This header will include a user navigation area for settings and admin functions (user management, data management).
*   **Dynamic Filter System:** A robust filter system will be implemented, supporting both global and report-specific filters. This system will be designed for reusability across different reports, allowing for flexible data segmentation. A dedicated filter button will be rendered in the header (via a portal) only when a report is opened, providing contextual access to filtering options. The filter panel, when opened, will contain both global and report-specific filters relevant to the *current* report, and will feature clear apply buttons.
*   **Breadcrumbs for Navigation:** Page headers will be replaced by breadcrumbs to provide clear navigation context within the application.
*   **Streamlined 2FA Authentication:** The authentication flow will integrate two-factor authentication (2FA) directly into the login page, allowing users to enter their credentials and 2FA code on the same screen, similar to GitHub's approach.
*   **User-Configurable Theming:** Users will have the ability to customize the application's theme, including a dark/light/system mode toggle, with the system preference as the default. Theming will leverage `tweakcn` for dynamic styling.
*   **2FA Management in User Settings:** Users will be able to enable or disable 2FA directly from their user settings page.
*   **Centralized Toast Notifications:** A `sonner` toast notification system will be implemented for all important system feedback, such as "Login Successful." These notifications will appear consistently in the **left-bottom corner** of the screen.
*   **Content Layout Preference:** Users will have the option in their settings to choose between **centered content** or **full-width content** to optimize the display on wide screens.

**Core Screens and Views**
From a product perspective, the most critical screens or views necessary to deliver the PRD values and goals include:
*   **Login Screen:** For secure user authentication, incorporating the streamlined 2FA flow.
*   **Dashboard/Home Screen:** A central landing page providing an overview and access to reporting functionalities.
*   **Report View/Generation Interface:** When a user navigates to a report, a filter button will render in the header (via a portal). Clicking this button will open a filter panel containing global and report-specific filters for the current report, along with clear apply buttons. This interface will allow users to select parameters and trigger report creation/refresh.
*   **Report Display:** To present the generated reports in a clear, interactive, and filterable manner.
*   **Admin Data Management Page:** For CSV uploads and user management (accessible only to administrators), integrated within the user navigation.
*   **User Settings Page:** Accessible via the user navigation, providing options for 2FA management, theming preferences (dark/light/system mode), and **content layout preference (centered/full-width)**.

**Accessibility: None**
*(Assumption: No specific accessibility requirements beyond standard web best practices have been identified. If WCAG compliance is needed, please specify.)*

**Branding**
The interface will adhere to a **clear, minimalist aesthetic with no distracting elements**, emphasizing functionality and ease of use. The design will be guided by the aesthetic principles found in **Vercel and Notion's user interfaces**, and will utilize **Geist font** for typography. This aligns with the use of Shadcn UI components, which promote a clean design, and will be enhanced by user-configurable theming.

**Target Device and Platforms: Web Responsive**
The application will be designed for web browsers, with a responsive layout to ensure usability across various screen sizes, though the primary focus is desktop usage.

## Technical Assumptions

**Repository Structure: Monorepo**
*   **Rationale:** Chosen for simplified dependency management, easier code sharing, and streamlined development workflows across different parts of the full-stack application.

**Service Architecture: Monolithic**
*   **Rationale:** Selected for its simplicity in initial development, deployment, and debugging, especially for an MVP, reducing overhead associated with distributed systems and allowing for faster iteration.

**Testing Requirements:**
*   **Jest + Playwright Tests from First Commit:** Unit and end-to-end tests will be implemented from the very beginning of the project.
*   **Rationale:** Ensures code quality, stability, and early detection of bugs, crucial for a rapid two-week MVP timeline.

**Additional Technical Assumptions and Requests:**

*   **Frontend Framework:** Next.js 15
*   **UI Component Library:** Shadcn UI
*   **Charting Library:** Shadcn Charts
*   **Authentication Library:** `better-auth`
*   **Database:** PostgreSQL
*   **ORM:** Prisma or Drizzle (choice to be finalized by Architect/Dev)
*   **Data Manipulation:** Arquero (for in-memory mathematical operations)
*   **Hosting:** DigitalOcean App Platform
*   **Managed Database:** DigitalOcean Managed Database
*   **CI/CD:** Via GitHub Actions
*   **Deployment:** Automated deployment to DigitalOcean from the GitHub `main` branch.

## Epic List

*   **Epic 1: Foundation, Core UI, & Cohort Report (MVP)**
    *   **Goal:** Establish the foundational application infrastructure, implement secure user authentication (including 2FA), build the core UI layout (sidebar, header, user settings with theming and content layout options, centralized toast notifications), integrate data management (CSV upload), deliver the Cohort Report functionality, and ensure the application is deployed and accessible on DigitalOcean.
    *   **Rationale:** This epic encompasses all the critical "must-have" features for the MVP, providing a fully functional and deployed application with the first key report, aligning with the aggressive two-week timeline. It sets up the core user experience and technical foundation for all subsequent development.

*   **Epic 2: Expanded Reporting**
    *   **Goal:** Introduce additional critical affiliate reports, specifically Conversions, Landings, and Quality reports, building upon the established reporting framework.
    *   **Rationale:** This epic directly addresses the next set of high-value reporting needs identified in the Post-MVP Vision, expanding the utility of the dashboard.

*   **Epic 3: Advanced Analytics & Platform Expansion**
    *   **Goal:** Implement AI-powered Q&A and alerts, and prepare the platform for broader organizational adoption beyond affiliates, including potential API integrations.
    *   **Rationale:** This epic aligns with the long-term vision of the product, introducing advanced capabilities and expanding its reach across the organization and data sources.

## Epic 1: Foundation, Core UI, & Cohort Report (MVP)

**Goal:** This epic aims to establish the complete technical foundation for the internal dashboard application, including the monorepo setup, secure authentication with 2FA, and the core user interface layout. It will also deliver the initial high-value Cohort Report functionality and ensure the entire application is successfully deployed and accessible on DigitalOcean, providing a fully functional Minimum Viable Product within the aggressive two-week timeline.

### Story 1.1: Project Setup & Basic Deployment

As a **developer**,
I want to **set up the monorepo with Next.js 15, Shadcn UI, and PostgreSQL, and deploy a basic application to DigitalOcean**,
so that **I have a foundational project structure and can continuously deploy a working application.**

**Acceptance Criteria:**

1.  Monorepo initialized with Next.js 15.
2.  Shadcn UI configured and integrated into the project.
3.  PostgreSQL database connected (local development setup).
4.  A basic "Hello World" page is successfully deployed to DigitalOcean App Platform.
5.  CI/CD pipeline configured via GitHub for automated deployment from the `main` branch to DigitalOcean.
6.  Jest and Playwright test frameworks are integrated and a basic test runs successfully.

### Story 1.2: Core Application Shell & UI Integration

As a **user**,
I want to **experience a consistent and customizable application layout with integrated UI components and navigation**,
so that **every page and component is developed within the correct visual framework from the start.**

**Acceptance Criteria:**

1.  The application displays a persistent Shadcn sidebar on all protected routes, containing navigation links to reports and a `NavUser` component that includes links for user settings and additional links for admin functions.
2.  The application displays a sticky Shadcn header on all protected routes.
3.  The header displays breadcrumbs for navigation context.
4.  The header dynamically renders a filter button (via a portal) when a report page is active.
5.  Theming (dark/light/system mode) is implemented and functional, with system as default.
6.  Content layout preference (centered/full-width) is implemented and functional.
7.  A centralized `sonner` toast notification system is integrated and displays a test message in the left-bottom corner.
8.  The UI adheres to the aesthetic guidelines of Vercel and Notion, and uses Geist font.
9.  All core layout components (sidebar, header, main content area) are responsive and functional across supported browsers.

### Story 1.3: Secure Authentication & User Management

As an **administrator**,
I want to **securely manage user accounts and their roles, and enable/disable 2FA for users, supporting email/password and OAuth authentication methods**,
so that **only authorized personnel can access the dashboard and sensitive data is protected.**

**Acceptance Criteria:**

1.  Authenticated users with the 'admin' role can access a **properly designed user management page with a table view**.
2.  From the user management page, admin users can:
    *   **Add new user accounts** with assigned roles (e.g., **'admin', 'user'**).
    *   **Delete existing user accounts**.
    *   **Disable 2FA for any user**.
    *   Perform other relevant administrative user management functions (e.g., edit user roles, reset passwords).
3.  User login page integrates `better-auth` and presents users with a choice between:
    *   **Email/password authentication.**
    *   **OAuth authentication (e.g., Google, Microsoft, etc. - specific providers to be defined).**
4.  User login flow allows for 2FA verification on the same page as login credentials.
5.  For OAuth authentication, admin must provision or link user accounts; self-registration is not permitted.
6.  Protected routes are inaccessible without proper authentication and authorization.
7.  User sessions are securely managed.

### Story 1.4: Data Management & CSV Ingestion

As an **administrator**,
I want to **upload affiliate data via CSV files and ensure data quality through deduplication**,
so that **the dashboard has accurate and consistent information for reporting.**

**Acceptance Criteria:**

1.  Admin users can access a dedicated UI for data management.
2.  The data management UI provides a mechanism to upload CSV files.
3.  Upon CSV upload, the system processes the data and stores it in the PostgreSQL database.
4.  The system automatically performs deduplication of records during the data ingestion process.
5.  The system provides feedback (e.g., via toast notification) on the success or failure of the CSV upload and deduplication process.
6.  Uploaded and deduplicated data is accessible for programmatic report generation.

### Story 1.5: Programmatic Cohort Report

As an **affiliate**,
I want to **generate a Cohort Report based on selected parameters**,
so that **I can quickly analyze affiliate performance trends.**

**Acceptance Criteria:**

1.  Users can navigate to the Cohort Report page via the sidebar.
2.  The Cohort Report page displays a filter button in the header (via portal).
3.  Clicking the filter button opens a filter panel with global and report-specific parameters for the Cohort Report.
4.  Users can select parameters (e.g., date ranges, cohorts) within the filter panel.
5.  Applying filters generates and displays the Cohort Report based on the selected parameters.
6.  The Cohort Report displays accurate data from the ingested CSVs.
7.  The report loads and displays within 3 seconds.
