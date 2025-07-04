# Effective Prompting Examples for Claude Sonnet 4

## 🎯 How to Get Maximum Quality from Claude

### **Example 1: Database Feature Request**

❌ **Bad Request:**

```
"Add user authentication"
```

✅ **Good Request:**

```
"I need to add user authentication to TraffBoard. Please:

1. First, check the current database schema in src/db/schema/
2. Add a users table with: id, email, password hash, name, createdAt
3. Create API routes for signup/login in src/app/api/auth/
4. Add a simple login form component

Use the existing Drizzle patterns from other tables. Focus on getting basic functionality working first - we can add features like email verification later."
```

### **Example 2: Bug Fix Request**

❌ **Bad Request:**

```
"Fix the TypeScript errors"
```

✅ **Good Request:**

```
"I'm getting TypeScript errors in src/components/Dashboard.tsx. The error says 'Property 'users' does not exist on type UserData'. Please:

1. Read the current Dashboard component to understand the structure
2. Check the UserData type definition
3. Fix the type mismatch using edit_block for surgical changes
4. Ensure the fix doesn't break other components using this type"
```

### **Example 3: Feature Implementation**

❌ **Bad Request:**

```
"Make a dashboard page"
```

✅ **Good Request:**

```
"Create a dashboard page for TraffBoard that shows:
- User profile card
- Recent activity list
- Quick stats (total users, active sessions)

Please follow this approach:
1. Create the page at src/app/dashboard/page.tsx as a Server Component
2. Fetch data directly in the component using our existing db connection
3. Use shadcn/ui components (Card, Button) for consistent styling
4. Keep it simple - no complex state management for now
5. Add basic error handling for database queries

Make it functional first, we'll add loading states and optimizations later."
```

## 🧠 Leveraging Claude's Reasoning

### **Complex Problem Solving**

✅ **Effective Approach:**

```
"The app is crashing when users try to login. Here's the error: [paste error].

I suspect it might be related to the database connection or authentication logic. Please:

1. Analyze the error message and trace the likely cause
2. Check the authentication flow in src/app/api/auth/
3. Verify the database connection and schema
4. Identify the root cause and propose the simplest fix
5. Explain your reasoning so I understand the solution"
```

### **Architecture Decisions**

✅ **Structured Request:**

```
"I need to decide between two approaches for handling user sessions:

Option A: NextAuth.js with database sessions
Option B: JWT tokens with localStorage

Context:
- This is an MVP for a traffic management dashboard
- ~100 users expected initially
- Simple authentication needs (email/password)
- Want to ship fast but also be secure

Please analyze both options considering:
1. Development speed for MVP
2. Security implications
3. Scalability for future growth
4. Integration with our current Next.js/Drizzle setup

Recommend the best approach with reasoning."
```

## 🛠 Tool Usage Optimization

### **File Operations**

✅ **Efficient Tool Usage:**

```
"I need to update the user profile component to add an avatar field. The component is in src/components/UserProfile.tsx. Please:

1. Use read_file to see the current component structure
2. Use edit_block to add the avatar field to the existing interface
3. Use edit_block to update the JSX to display the avatar
4. Don't rewrite the entire file - just make surgical changes"
```

### **Database Changes**

✅ **Systematic Approach:**

```
"Add a 'role' field to the users table to support admin/user permissions. Please:

1. Check the current schema in src/db/schema/users.ts
2. Add the role field with appropriate enum type
3. Update the TypeScript types
4. Generate and run the migration with npm run db:push
5. Update any existing queries that need the new field

Use Drizzle best practices from other enum fields in the project."
```

## 🎨 Code Quality Requests

### **Refactoring**

✅ **Clear Guidelines:**

```
"The Dashboard component in src/components/Dashboard.tsx has grown too large. Please refactor it by:

1. Extracting the stats section into a separate DashboardStats component
2. Moving the user list into a UserList component
3. Keeping the main Dashboard as a layout component
4. Ensuring all components maintain the same functionality
5. Using proper TypeScript interfaces for props

Create new files in src/components/ and update imports accordingly."
```

### **Performance Optimization**

✅ **Specific Targets:**

```
"The dashboard is loading slowly. Please optimize the performance by:

1. Check the current data fetching in src/app/dashboard/page.tsx
2. Identify any N+1 query problems
3. Add database indexes if needed
4. Consider implementing pagination for large lists
5. Measure the improvement with before/after load times

Focus on database optimization first, then UI optimizations."
```

## 🚀 Development Workflow Optimization

### **Starting New Features**

✅ **Comprehensive Planning:**

```
"I want to add a reports feature to TraffBoard. Before implementing, please:

1. Review the current project structure and patterns
2. Identify what database tables/schema changes are needed
3. Plan the API routes required
4. Suggest the component structure
5. Outline the development steps in order

Then we'll implement step by step, testing each part before moving on."
```

### **Debugging Complex Issues**

✅ **Systematic Investigation:**

```
"Users report that data isn't saving properly. The form submits without errors but data doesn't appear in the database. Please investigate:

1. Check the form submission in src/components/UserForm.tsx
2. Trace the API call to src/app/api/users/route.ts
3. Verify the database operation and schema
4. Check for any silent failures or validation issues
5. Test the complete flow and identify where it breaks

Provide step-by-step debugging results and the fix."
```

## 🎯 Context-Aware Requests

### **Understanding Existing Code**

✅ **Comprehensive Analysis:**

```
"I inherited this TraffBoard project and need to understand the current authentication system. Please:

1. Map out the current auth flow by examining relevant files
2. Identify what authentication method is being used
3. Document how user sessions are handled
4. List any security considerations or potential issues
5. Suggest improvements for the MVP phase

Help me understand before we make changes."
```

### **Integration Requests**

✅ **Well-Scoped Integration:**

```
"Add Stripe payment integration to support subscription billing. Please:

1. First check if there are existing payment-related files
2. Add Stripe to package.json and configure it
3. Create a subscription schema in the database
4. Build API routes for webhook handling
5. Add a simple checkout component

Use Stripe's recommended patterns for Next.js. Focus on basic subscription flow first."
```

## 🧪 Testing and Validation

### **Test-Driven Development**

✅ **Strategic Testing:**

```
"Before implementing the user management feature, let's set up tests. Please:

1. Check the current testing setup in the project
2. Create unit tests for the user CRUD operations
3. Add integration tests for the API routes
4. Set up component tests for the user forms
5. Ensure tests fail initially (red), then we'll make them pass

Focus on testing the core business logic and user flows."
```

## 💡 Communication Optimization

### **Progress Updates**

✅ **Transparent Communication:**

```
"As you implement the dashboard feature, please:

1. Explain your reasoning for architectural choices
2. Point out any potential issues or limitations
3. Suggest alternative approaches if relevant
4. Let me know if you need additional context
5. Summarize what was accomplished and next steps

I want to learn from your implementation approach."
```

### **Error Handling**

✅ **Collaborative Problem-Solving:**

```
"If you encounter any errors while implementing this feature:

1. Don't try to fix everything at once
2. Explain what went wrong and why
3. Suggest the simplest fix first
4. Ask for clarification if the requirements are unclear
5. Test the fix before marking it complete

We're building this together - communication is key."
```

## 🎖 Best Practices Summary

### **For Maximum Claude Efficiency:**

1. **Be Specific**: Include file paths, exact error messages, and clear requirements
2. **Provide Context**: Explain the project goals and constraints
3. **Use Structured Requests**: Number steps and provide clear objectives
4. **Leverage Reasoning**: Ask for analysis and explanation of decisions
5. **Request Tool Optimization**: Specify which tools to use for efficiency
6. **Plan Incrementally**: Break large features into small, testable steps
7. **Maintain Quality**: Ask for best practices and code review suggestions

### **Red Flags to Avoid:**

- ❌ Vague requests without context
- ❌ Asking for complete rewrites when small changes suffice
- ❌ Not specifying file locations or tool preferences
- ❌ Requesting complex features without breaking them down
- ❌ Ignoring existing code patterns and project structure

---

**Remember: Claude excels when given clear context, specific instructions, and opportunities to use reasoning. The more thoughtfully you structure your requests, the better results you'll get!**
