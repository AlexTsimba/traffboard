# TraffBoard Memory Management Guidelines

## 🧠 Core Principles

### 1. Validation-Only Storage
- **STORE**: Only verified facts, successful implementations, confirmed bugs
- **NEVER STORE**: Assumptions, optimistic claims, unvalidated "completions"
- **VALIDATION REQUIRED**: User confirmation, successful test runs, working demonstrations

### 2. Scalable Knowledge Graph
- **Entities**: Project components, technical issues, architectural decisions
- **Relations**: Dependencies, influences, conflicts between components  
- **Observations**: Factual statements with timestamps and validation status

### 3. Update Triggers
- **IMMEDIATE**: Code structure changes, dependency updates, configuration changes
- **ON VALIDATION**: Task completion confirmed by user or working demonstration
- **ON ERROR**: New bugs discovered, patterns that fail, anti-patterns identified

## 📋 Memory Categories

### Project Structure (Update: When architecture changes)
```json
{
  "name": "TraffBoard-Project-Structure", 
  "entityType": "architecture",
  "observations": ["Current tech stack", "Directory structure", "Key dependencies"]
}
```

### Code Quality (Update: When linting rules change)
```json
{
  "name": "TraffBoard-Linting-Rules",
  "entityType": "code_standards", 
  "observations": ["ESLint rules", "TypeScript config", "Prettier standards"]
}
```

### Current Session (Update: Each session)
```json
{
  "name": "Current-Session-Context",
  "entityType": "session_state",
  "observations": ["Current goals", "Blocking issues", "Next actions"]
}
```

### Anti-Patterns (Update: When discovered)
```json
{
  "name": "TraffBoard-Anti-Patterns",
  "entityType": "code_violations",
  "observations": ["Patterns to avoid", "Common errors", "Failed approaches"]
}
```

## 🔄 Memory Operations

### CREATE New Knowledge
```typescript
// Only for newly discovered information
memory:create_entities([{
  name: "Component-Name-Specific-Issue",
  entityType: "bug_report", 
  observations: ["Specific error", "Reproduction steps", "Impact"]
}])
```

### UPDATE Existing Knowledge  
```typescript
// Add new validated observations
memory:add_observations([{
  entityName: "TraffBoard-Project-Current-State",
  contents: ["New verified fact", "Confirmed behavior"]
}])
```

### REMOVE Invalid Information
```typescript
// Remove outdated or incorrect data
memory:delete_observations([{
  entityName: "Task-Status-Entity",
  observations: ["Incorrect completion claim"]
}])
```

## ⚠️ Prohibited Practices

### ❌ DO NOT STORE
- Optimistic task completion claims
- Unverified feature implementations  
- Assumptions about working code
- Plans without execution validation
- Success claims without user confirmation

### ❌ DO NOT UPDATE  
- Memory based on build success alone
- Status based on code existence without testing
- Completion status without demonstration
- Technical specs without validation

## ✅ Storage Guidelines

### STORE When:
- User confirms feature works
- Tests pass AND functionality verified
- Bug reproduced with specific steps
- Architectural decision validated in practice
- Code pattern successfully resolves issue

### UPDATE When:
- Project structure actually changes
- Dependencies modified in package.json
- Linting rules updated in config
- Session goals change
- New blocking issues discovered

## 📚 Documentation Integration

### File Locations
- **Memory Guidelines**: `/docs/memory-system/memory-management-guidelines.md` 
- **Project Snapshot**: `/docs/memory-system/project-snapshot.json`
- **Linting Reference**: `/docs/memory-system/linting-patterns.md`
- **Architecture Guide**: `/docs/memory-system/architecture-decisions.md`

### Update Schedule
- **Real-time**: Session context, blocking issues
- **On change**: Project structure, dependencies
- **On validation**: Task completion, working features
- **Never**: Speculative information, unconfirmed success

---

*Memory is truth. Store only what is verified.*