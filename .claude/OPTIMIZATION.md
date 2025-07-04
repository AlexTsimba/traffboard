# Claude Sonnet 4 Optimization Features

## 🧠 Leveraging Claude's Strengths

### **Large Context Window (200k+ tokens)**

- ✅ Read multiple related files at once
- ✅ Keep entire project structure in mind
- ✅ Understand complex dependencies
- ✅ Plan changes across multiple files

### **Advanced Reasoning**

- ✅ Trace error causes systematically
- ✅ Understand code architecture patterns
- ✅ Plan implementation strategies
- ✅ Debug complex issues step-by-step

### **Tool Proficiency**

- ✅ Choose optimal tools for each task
- ✅ Batch operations efficiently
- ✅ Use file operations strategically
- ✅ Execute commands with understanding

### **Code Pattern Recognition**

- ✅ Identify anti-patterns quickly
- ✅ Suggest optimal implementations
- ✅ Maintain consistency across codebase
- ✅ Apply best practices automatically

## 🎯 Optimized Prompting Techniques

### **Structured Requests**

```
❌ "Fix the database connection"
✅ "The database connection in src/db/connection.ts is throwing 'connection refused' errors.
    Please: 1) Check the current config, 2) Identify the issue, 3) Implement the simplest fix"
```

### **Context-Rich Instructions**

```
❌ "Add a user table"
✅ "Add a users table to support authentication. Need: id, email, name, createdAt.
    Should integrate with existing schema in src/db/schema/. Use Drizzle ORM patterns
    from other tables in the project."
```

### **Tool-Specific Guidance**

```
❌ "Update the component"
✅ "Use edit_block to update the UserProfile component in src/components/UserProfile.tsx
    to add error handling. Change only the specific error handling section."
```

## 🚀 Performance Optimizations

### **Efficient File Operations**

- Use `edit_block` for small changes (faster than `write_file`)
- Read related files together to understand context
- Use `search_code` to find patterns across codebase
- Batch directory listings when exploring structure

### **Strategic Planning**

- Plan 2-3 steps ahead based on large context
- Identify dependencies before making changes
- Consider impact across multiple files
- Anticipate potential issues and edge cases

### **Error Recovery**

- Use reasoning to trace error chains
- Check obvious causes first (imports, typos, env vars)
- Apply systematic debugging approach
- Fix root causes, not just symptoms

## 🛠 Tool Usage Matrix

| Task Type     | Primary Tool          | Secondary Tool     | Context Needed    |
| ------------- | --------------------- | ------------------ | ----------------- |
| Small edits   | `edit_block`          | `read_file`        | Specific location |
| New files     | `write_file`          | `create_directory` | Project structure |
| Understanding | `read_file`           | `list_directory`   | Full context      |
| Debugging     | `execute_command`     | `search_code`      | Error messages    |
| Planning      | `read_multiple_files` | `search_code`      | Architecture      |

## 🎨 Code Quality Patterns

### **TypeScript Best Practices**

```typescript
// ✅ Use strict types
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// ✅ Proper error handling
type Result<T> = { success: true; data: T } | { success: false; error: string };
```

### **React/Next.js Patterns**

```typescript
// ✅ Server Components for data fetching
export default async function UserList() {
  const users = await db.select().from(usersTable);
  return <UserListClient users={users} />;
}

// ✅ Client Components for interactivity
'use client';
export function UserListClient({ users }: { users: User[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  // ...
}
```

### **Database Patterns**

```typescript
// ✅ Simple, direct queries
const user = await db.select().from(users).where(eq(users.id, id));

// ✅ Proper error handling
try {
  const result = await db.insert(users).values(userData).returning();
  return { success: true, data: result[0] };
} catch (error) {
  console.error("DB Error:", error);
  return { success: false, error: "Failed to create user" };
}
```

## 🧪 Testing Strategy (Post-MVP)

### **What to Test First**

1. Critical business logic
2. Authentication flows
3. Data validation
4. API endpoints

### **Testing Tools**

- Vitest for unit tests
- Testing Library for React components
- Playwright for E2E (later)

## 🎯 Success Indicators

### **You're Using Claude Optimally When:**

- ✅ Planning multi-step changes before executing
- ✅ Reading context files before making changes
- ✅ Using `edit_block` for surgical modifications
- ✅ Debugging systematically with reasoning
- ✅ Maintaining project patterns and consistency
- ✅ Building features incrementally and testing frequently

### **Red Flags (Sub-optimal Usage):**

- ❌ Making changes without understanding current state
- ❌ Using `write_file` for small edits
- ❌ Not reading error messages completely
- ❌ Ignoring existing code patterns
- ❌ Rushing without planning
- ❌ Creating over-complex solutions for simple problems

---

**Remember: Claude Sonnet 4 excels at understanding, reasoning, and systematic problem-solving. Use these strengths!**
