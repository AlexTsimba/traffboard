# TraffBoard Internal Tool — README

## Overview
This repository contains the internal codebase and data for the TraffBoard analytics/dashboard tool. It is currently in a minimal, cleaned-up state, with all legacy and broken tests, artifacts, and outdated documentation removed. Only essential demo/test data is preserved for future development and testing.

---

## Current State
- **No active e2e, unit, or integration tests** in the main codebase.
- **All test and Playwright artifacts, old test helpers, and legacy test code have been removed** for repository hygiene.
- **Test data** (CSV files) is preserved in `_test-archive/demo/` for future use:
  - `sample_players.csv` — Player-level casino data (matches current schema)
  - `sample_traffic.csv` — Traffic/conversion data (matches current schema)

---

## Directory Structure
- `src/` — Main application code (Next.js, Prisma, API, UI)
- `_test-archive/` — Archive for all test data (only CSVs remain)
- `docs/` — Documentation (Diátaxis structure, some files may be missing)

---

## Testing & Data
- **No test runners or test scripts are present.**
- **Test data CSVs** are kept for future restoration of test infrastructure or for manual import/testing.
- **If you need to restore tests:**
  - Use the CSVs in `_test-archive/demo/` as seed/demo data.
  - Refer to previous versions in git for test strategies and Playwright/Vitest setup.
  - See `docs/testing/DAL_TESTING_STRATEGY.md` in git history for best practices.

---

## Recommendations
- **Restore or rewrite tests** before any production deployment or major refactoring.
- **Keep test data up to date** with schema changes.
- **Document any new test or data import logic** in this README and in `docs/testing/`.

---

## Contact
For questions or to restore documentation/tests, contact the project maintainer or check git history for previous test and documentation files. 