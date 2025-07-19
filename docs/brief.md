# Project Brief: Internal Affiliate Dashboard

## Executive Summary

This project aims to develop an internal dashboard application specifically designed for affiliates. The primary problem it solves is the current lack of a dedicated, in-house tool for generating comprehensive affiliate reports. Our target market is internal affiliates, and the key value proposition is providing them with a custom, efficient, and controlled platform for creating their essential reports.

## Problem Statement

Affiliates currently face significant challenges with their reporting processes, primarily due to the limitations of existing Tableau reports. These reports are often described as "poor," indicating issues with their quality, usability, or relevance. A major pain point is the "long time to create new report with analysts," which highlights a bottleneck in the reporting workflow. This dependency on analysts for every new report leads to considerable delays, reduces agility, and consumes valuable resources. Existing solutions, specifically Tableau, fall short because they do not provide the necessary flexibility or efficiency for affiliates to generate timely and accurate reports independently. Solving this problem now is crucial to empower affiliates with self-service reporting capabilities, improve decision-making speed, and free up analyst resources for more strategic tasks.

## Proposed Solution

Our core concept is to develop a dedicated internal dashboard application that empowers affiliates with **fast** and **reliable** self-service reporting capabilities. This solution will be fundamentally different from existing methods, particularly the current Tableau reports, by enabling affiliates to **quickly create new reports** independently, without the need for constant analyst intervention.

This solution will succeed where others haven't because it is purpose-built to address the specific pain points of our internal affiliates. By focusing on speed and reliability, we will eliminate the bottlenecks and frustrations associated with the current reporting process. The high-level vision for this product is to become the indispensable tool for all internal affiliate reporting, providing immediate, accurate insights and significantly enhancing operational efficiency and decision-making.

## Target Users

### Primary User Segment: Internal Affiliates

Our primary user segment consists of internal affiliates who are responsible for managing and analyzing their performance data. Currently, their workflow heavily relies on a combination of **spreadsheets (Sheets)** for data manipulation and basic analysis, and **Tableau** for more structured reporting. A significant pain point for these users is the **lack of their own dedicated reporting tool**, which makes them **dependent on the analytics team** for generating new reports or making modifications. This dependency creates bottlenecks, delays in accessing critical insights, and limits their ability to react quickly to performance trends. Their specific needs include gaining direct, self-service access to their data, the ability to customize reports without external intervention, and a more efficient way to track their key performance indicators. Ultimately, their goal is to achieve greater autonomy and speed in understanding their affiliate performance, enabling them to make faster, data-driven decisions to optimize their strategies.

## Goals & Success Metrics

### Business Objectives

*   **Reduce report generation time for affiliates from 2+ hours to under 5 minutes for ad-hoc reports within 3 months of launch.** This objective directly addresses the current time waste and the need for immediate data access, aiming for a significant improvement in efficiency.

### User Success Metrics

*   **Increase in the number of self-generated reports by affiliates by 50% within the first two months post-launch.** This metric directly measures the adoption and utilization of the new self-service reporting capabilities.
*   **Decrease in ad-hoc report requests to the analytics team by 40% within six months of launch.** This indicates a successful shift from analyst dependency to affiliate autonomy in reporting.

### Key Performance Indicators (KPIs)

*   None identified at this stage.

## MVP Scope

### Core Features (Must Have)

*   **Authentication & Authorization:**
    *   **Description:** Secure user authentication system with no self-registration; user accounts will be managed by an administrator. Includes role-based access control to define user permissions and optional two-factor authentication (2FA) for enhanced security. All critical routes and data access points will be protected.
    *   **Rationale:** Essential for safeguarding sensitive affiliate data, ensuring only authorized personnel can access the dashboard, and maintaining data integrity. Admin-managed users simplify onboarding and control.

*   **Core User Interface (UI):**
    *   **Description:** The fundamental graphical interface elements necessary for affiliates to navigate the dashboard, view data, and initiate report generation. This includes basic layouts, navigation menus, and interactive components.
    *   **Rationale:** Provides the primary means for users to interact with the application and access its core functionalities, making the system usable from day one.

*   **Data Management & Ingestion:**
    *   **Description:** Functionality to load affiliate data into the system, specifically supporting CSV file uploads to the database. Includes automated processes to handle data quality, such as deduplication, to ensure accuracy and consistency of reporting data.
    *   **Rationale:** Crucial for populating the dashboard with relevant and accurate affiliate performance data, which is the foundation for all reporting capabilities. Deduplication prevents skewed or incorrect reports.

*   **Programmatic Report Generation (Initial Focus: Cohort Report):**
    *   **Description:** The system will enable the programmatic generation of reports, starting with a foundational **Cohort Report**. This means reports will be defined and generated by the application's code, providing consistent and immediate results based on user-selected parameters.
    *   **Rationale:** This is the core value proposition, directly addressing the need for fast, reliable, and self-service reporting without manual intervention from analysts. Starting with a Cohort Report provides a concrete, high-value initial deliverable.

*   **Deployment & Accessibility:**
    *   **Description:** The application will be deployed and made accessible via DigitalOcean, leveraging their App Platform for hosting the application and their managed database services for data storage.
    *   **Rationale:** Ensures the application is operational, scalable, and reliably available to all internal affiliates. DigitalOcean provides a robust and managed infrastructure suitable for a production environment.

### Out of Scope for MVP

*   **Extensive Pre-built Report Library (10+ reports):** The MVP will focus on enabling affiliates to generate specific, programmatically defined reports (starting with Cohort Report). A large pre-built library of 10 or more diverse report types will not be included in the initial release.
*   **API Data Retrieval from Affilka:** Initial data ingestion will be limited to CSV file uploads. Direct API integrations with platforms like Affilka for automated data retrieval are out of scope for the MVP.
*   **AI Analytics & Predictive Features:** Advanced analytical capabilities, such as AI-driven insights, predictive modeling, or automated anomaly detection, will not be part of the MVP.

### MVP Success Criteria

The MVP will be considered successful if the internal dashboard application is **fully deployed and accessible on DigitalOcean with a functional database**, and if **a significant portion of target affiliates actively use it** to generate their reports, thereby reducing their reliance on manual processes or analyst intervention.

## Post-MVP Vision

### Phase 2 Features

*   **Expanded Report Library:** Following the successful implementation of the Cohort Report in the MVP, Phase 2 will focus on programmatically adding other critical affiliate reports. This includes, but is not limited to, **Conversions Reports**, **Landings Reports**, and **Quality Reports**.
    *   **Rationale:** These reports are essential for a comprehensive understanding of affiliate performance and represent the next logical step in providing a full suite of self-service reporting tools beyond the initial Cohort Report.

*   **AI-Powered Affiliate Q&A:** Introduce advanced AI capabilities to allow affiliates to ask natural language questions about their data. The AI will interpret these questions and generate answers based on direct queries to the database.
    *   **Rationale:** This feature will significantly enhance the user experience by providing immediate, conversational access to insights, further reducing the need for manual data analysis or analyst intervention, and moving towards a more intelligent dashboard.

### Long-term Vision

Our one-to-two-year vision for this internal dashboard application is to transform it into the **centralized, indispensable reporting platform for all departments**, effectively replacing the need for Tableau across the organization. We envision a system that offers a comprehensive suite of **50+ diverse reports**, catering to the nuanced analytical needs of various teams. Furthermore, the platform will evolve to include proactive **AI-powered alerts**, notifying users of significant trends, anomalies, or opportunities within their data, enabling real-time, data-driven decision-making. Ultimately, this dashboard will empower every department with immediate, self-service access to critical insights, fostering a culture of data literacy and operational excellence.

### Expansion Opportunities

*   None identified at this stage.

## Technical Considerations

### Platform Requirements

*   **Target Platforms:** Web
*   **Browser/OS Support:** The application will primarily support modern versions of Google Chrome and Apple Safari browsers. Support for older browser versions is explicitly out of scope.
*   **Performance Requirements:** Reports should load and display within 3 seconds. The system should be capable of supporting at least 10 concurrent users without degradation in performance.

### Technology Preferences

*   **Frontend:** Next.js 15 (for the framework), Shadcn UI (for component library), Shadcn Charts (for data visualization), and custom development for specific UI elements.
*   **Authentication:** `better-auth` (for authentication library).
*   **Backend:** (Not specified, will assume a suitable backend will be chosen to complement Next.js, e.g., Node.js with Express or a similar framework, or a Python/Go backend if data processing needs are heavy).
*   **Database:** PostgreSQL (for relational data storage).
*   **ORM:** Prisma or Drizzle (for database interaction).
*   **Data Manipulation:** Arquero (for in-memory data manipulation and mathematical operations).
*   **Hosting/Infrastructure:** DigitalOcean App Platform (for application hosting) and DigitalOcean Managed Database (for PostgreSQL).

### Architecture Considerations

*   **Repository Structure:** The project will be structured as a monorepo, containing all related applications (e.g., frontend, backend, shared libraries) within a single Git repository. This approach is chosen for simplified dependency management, easier code sharing, and streamlined development workflows across different parts of the full-stack application.

*   **Service Architecture:** The application will initially be developed as a monolithic service. This means the frontend, backend logic, and data access layers will reside within a single, tightly coupled codebase and be deployed as a single unit. Communication between the frontend and backend will occur directly within this unified application.

*   **Integration Requirements:** Initially, data will be integrated into the system via manual CSV file uploads through an administrative data management page. Post-MVP, there is a planned integration with the Affilka API for automated data retrieval.

*   **Security/Compliance:** As previously outlined in the MVP Core Features, the application will implement robust role-based access control (admin/user roles) to ensure that only authorized personnel can access specific functionalities and data. All sensitive routes and data endpoints will be protected to prevent unauthorized access, reinforcing data security and integrity.

## Constraints & Assumptions

### Constraints

*   **Timeline:** The project has an aggressive timeline with a strict target of **two weeks for MVP delivery**. This necessitates a highly focused approach, prioritizing only essential features.
*   **Scope:** To meet the tight timeline, all non-critical features and functionalities will be explicitly deferred to post-MVP phases. The focus is solely on delivering a working application that addresses the core problem within the two-week window.
*   **Budget:** A budget is allocated specifically for DigitalOcean App Platform and Managed Database services.

### Key Assumptions

*   None identified at this stage.

## Risks & Open Questions

### Key Risks

*   **Data Modeling and Error Handling Complexity:**
    *   **Description:** While the source data is assumed to be of good quality, the process of constructing the optimal data model within the application and implementing robust error handling mechanisms during data ingestion (e.g., for malformed CSVs, unexpected data types, or deduplication failures) could introduce unforeseen complexities.
    *   **Impact:** Incorrect data representation, system instability, or inaccurate reports if data is not modeled correctly or errors are not gracefully handled.

### Open Questions

*   None identified at this stage.

### Areas Needing Further Research

*   None identified at this stage.

## Appendices

### A. Research Summary

*   Not applicable for this internal tool.

### B. Stakeholder Input

*   Not applicable; the user is the sole shareholder and primary stakeholder for this project.

### C. References

*   None.

## Next Steps

### Immediate Actions

*   None identified at this stage.

### PM Handoff

This Project Brief provides the full context for your internal dashboard application. Please start in 'PRD Generation Mode', review the brief thoroughly to work with the user to create the PRD section by section as the template indicates, asking for any necessary clarification or suggesting improvements.