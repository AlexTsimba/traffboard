# Claude Sonnet 4 Development Guide for TraffBoard

> Optimized for Claude Sonnet 4's capabilities: reasoning, tool usage, and context understanding

## 🎯 Core Mission

Build TraffBoard MVP **fast and functional**. Quality comes after working features.

## 🧠 How to Think

### 1. **Analyze Before Acting**

- Read the request completely
- Identify the core goal
- Plan 2-3 steps maximum
- Execute with tools

### 2. **Use Your Reasoning**

You're excellent at understanding context. When you see:

- Database errors → Check connection and schema
- TypeScript errors → Look at types and imports
- React errors → Check component structure and props
- Build errors → Examine dependencies and config

### 3. **Be Pragmatic**

- Choose simple solutions over complex ones
- Fix immediate problems before optimizing
- Get it working, then make it better
- Don't overthink architecture for MVP

## 🛠 Tool Usage Strategy

### **Primary Development Flow**

1. **Start with understanding**

   ```
   read_file package.json          # Understand project setup
   list_directory src/             # See current structure
   read_file src/app/page.tsx      # Check current state
   ```

2. **Make changes incrementally**

   ```
   edit_block                      # For small changes
   write_file                      # For new files
   create_directory               # For new structure
   ```

3. **Test and verify**
   ```
   execute_command "npm run build" # Check build
   execute_command "npm run dev"   # Test locally
   ```

### **When to Use Each Tool**

**File Operations:**

- `read_file` - Understanding existing code
- `edit_block` - Small, surgical changes (prefer this)
- `write_file` - New files or complete rewrites
- `search_code` - Finding patterns across codebase

**Development:**

- `execute_command` - Running build, test, dev server
- `list_directory` - Understanding project structure
- `create_directory` - New feature folders

**Never:**

- Don't use `write_file` for small edits (use `edit_block`)
- Don't read entire files if you only need a section
- Don't execute commands without checking if they exist in package.json

## 💻 Code Patterns & Examples

### **Database Operations (Drizzle + PostgreSQL)**

**✅ Good - Simple and Direct**

```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// Usage
import { db } from "@/db";
import { users } from "@/db/schema";

const user = await db.select().from(users).where(eq(users.id, id));
```

**❌ Avoid - Over-engineered**

```typescript
// Don't create complex connection pools, retry logic, health checks for MVP
// Keep it simple until you need the complexity
```

### **Next.js App Router Patterns**

**✅ API Routes**

```typescript
// src/app/api/users/route.ts
import { db } from "@/db";
import { users } from "@/db/schema";

export async function GET() {
  const data = await db.select().from(users);
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await db.insert(users).values(body).returning();
  return Response.json(user[0]);
}
```

**✅ Server Components**

```typescript
// src/app/dashboard/page.tsx
import { db } from "@/db";
import { users } from "@/db/schema";

export default async function Dashboard() {
  const userList = await db.select().from(users);

  return (
    <div>
      <h1>Dashboard</h1>
      {userList.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### **Error Handling Strategy**

**✅ MVP Approach**

```typescript
// Simple try-catch for critical operations
try {
  const result = await db.insert(users).values(data);
  return { success: true, data: result };
} catch (error) {
  console.error("Database error:", error);
  return { success: false, error: "Failed to create user" };
}
```

**❌ Don't Do This Yet**

```typescript
// Complex error handling, custom error classes, retry logic
// Save this for after MVP is working
```

## 🚀 Development Workflow

### **Starting a New Feature**

1. **Understand the request**

   - What's the core functionality?
   - What pages/components are needed?
   - What data needs to be stored?

2. **Check current state**

   ```bash
   # Read relevant files to understand current structure
   read_file src/app/layout.tsx
   list_directory src/app/
   read_file package.json
   ```

3. **Plan the minimal implementation**

   - Database schema (if needed)
   - API routes (if needed)
   - UI components
   - Routing

4. **Implement step by step**
   - Start with data layer (schema)
   - Add API routes
   - Create UI components
   - Test each step

### **Debugging Process**

1. **Read the error message completely**
2. **Check obvious causes first:**

   - Missing imports
   - Typos in file names
   - Wrong file paths
   - Missing environment variables

3. **Use your reasoning to trace the problem:**

   - TypeScript errors → Check types
   - Runtime errors → Check data flow
   - Build errors → Check dependencies

4. **Make minimal fixes:**
   - Fix one thing at a time
   - Test after each fix
   - Don't refactor while debugging

## 📁 Project Structure Understanding

```
TraffBoard/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Dashboard pages
│   │   └── page.tsx        # Home page
│   ├── components/         # Reusable UI components
│   ├── db/                 # Database setup and schema
│   │   ├── schema/         # Drizzle schema files
│   │   └── index.ts        # Database connection
│   └── lib/                # Utility functions
├── .env.local              # Environment variables
├── drizzle.config.ts       # Drizzle configuration
└── package.json            # Dependencies and scripts
```

## 🎨 UI Development with shadcn/ui

**✅ Use existing components**

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Dashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Action</Button>
      </CardContent>
    </Card>
  );
}
```

**✅ Add new shadcn components when needed**

```bash
npx shadcn@latest add table
npx shadcn@latest add form
```

## 🐛 Common Issues & Solutions

### **Database Connection Issues**

```typescript
// Check if DATABASE_URL is set
console.log("DB URL:", process.env.DATABASE_URL ? "Set" : "Missing");

// Verify connection with simple query
const test = await db.select().from(users).limit(1);
```

### **TypeScript Errors**

```typescript
// Check imports
import { eq } from "drizzle-orm"; // Common missing import

// Check schema imports
import { users } from "@/db/schema"; // Make sure path is correct
```

### **Build Errors**

```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

## ⚡ Performance Tips

### **Use Claude's Strengths**

1. **Read multiple files efficiently** - You have large context, use it
2. **Plan changes across files** - Think about dependencies
3. **Spot patterns** - Recognize similar code patterns
4. **Error recovery** - Debug systematically

### **Work Efficiently**

1. **Batch file reads** - Read related files together
2. **Use edit_block for small changes** - More efficient than rewriting
3. **Test frequently** - Run build/dev after major changes
4. **Keep changes focused** - One feature at a time

## 🎯 Success Metrics

### **MVP Phase Goals**

- ✅ User can see the main dashboard
- ✅ Data loads from database
- ✅ Basic CRUD operations work
- ✅ No critical runtime errors
- ✅ Fast development velocity (features per day)

### **Quality Gates (Minimal)**

- ✅ `npm run build` succeeds
- ✅ `npm run dev` runs without errors
- ✅ Core user flows work manually
- ✅ Database operations complete successfully

## 💡 Remember

- **You're great at reasoning** - Use it to understand problems deeply
- **You have large context** - Keep the whole project in mind
- **You're tool-savvy** - Use the right tool for each task
- **You're efficient** - Don't overthink simple problems
- **MVP first** - Working > Perfect

---

**Your mission: Build working software fast. Everything else is secondary.**
