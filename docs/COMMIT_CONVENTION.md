# 📝 Commit Convention Guide

This project uses [Conventional Commits](https://www.conventionalcommits.org/) standard to ensure consistent and readable commit messages.

## 📋 Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## 🏷️ Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add user authentication` |
| `fix` | Bug fix | `fix: resolve login validation error` |
| `docs` | Documentation changes | `docs: update API documentation` |
| `style` | Code style changes (formatting, missing semicolons, etc.) | `style: fix code formatting` |
| `refactor` | Code refactoring without changing functionality | `refactor: extract user service` |
| `test` | Adding or updating tests | `test: add unit tests for auth` |
| `chore` | Maintenance tasks, tooling | `chore: update dependencies` |
| `perf` | Performance improvements | `perf: optimize database queries` |
| `ci` | CI/CD changes | `ci: update GitHub Actions workflow` |
| `build` | Build system or external dependencies | `build: update webpack config` |
| `revert` | Revert previous commit | `revert: undo user service changes` |

## 📏 Rules

- ✅ **Type**: Required, lowercase
- ✅ **Description**: Required, lowercase, no period at end
- ✅ **Length**: Max 100 characters for header
- ✅ **Scope**: Optional, use parentheses `feat(auth): add login`
- ✅ **Body**: Optional, separated by blank line
- ✅ **Footer**: Optional, separated by blank line

## 🚫 Common Mistakes

```bash
# ❌ Wrong
Fix bug
ADD NEW FEATURE  
feat: Add user login.
fix:resolve issue

# ✅ Correct  
fix: resolve validation bug
feat: add user authentication
feat: add user login functionality
fix: resolve authentication issue
```

## 🔧 Tools

- **commitlint**: Automatically validates commit messages
- **husky**: Runs validation on commit
- **Scripts**: 
  - `pnpm commitlint:last` - Check last commit
  - `pnpm commitlint` - Interactive editor

## 🎯 Examples

### Simple commits
```bash
feat: add dashboard navigation
fix: resolve sidebar rendering issue  
docs: update installation guide
test: add integration tests for API
```

### With scope
```bash
feat(auth): implement JWT token validation
fix(ui): resolve button hover states
docs(api): update endpoint documentation
test(utils): add unit tests for helpers
```

### With body and footer
```bash
feat: add advanced search functionality

Implement fuzzy search with filters for name, date, and status.
Include pagination and sorting capabilities.

Closes #123
```

## 🚀 Benefits

- 📊 **Automated changelogs**: Generate release notes automatically
- 🔍 **Better history**: Easy to understand project evolution  
- 🤖 **CI/CD integration**: Automated versioning and releases
- 👥 **Team consistency**: Standard format across all contributors
- 🔧 **Tooling support**: Integration with various development tools

## 🆘 Help

If commitlint fails:
1. Check the error message for specific rule violations
2. Refer to this guide for correct format
3. Use `pnpm commitlint:last` to test your commit message
4. Ask team members for clarification

Happy committing! 🎉 