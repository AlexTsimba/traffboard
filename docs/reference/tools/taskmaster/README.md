---
title: "Taskmaster Development Workflow"
description: "Complete guide to using Taskmaster for project management and AI-assisted development"
type: "reference"
audience: ["ai-engineer", "frontend-dev", "architect"]
tags: ["taskmaster", "workflow", "project-management", "ai-tools"]
---

# Taskmaster Development Workflow

Comprehensive documentation for using Taskmaster to manage software development projects with AI assistance.

## 📋 Quick Reference

| Topic | Description | Link |
|-------|-------------|------|
| **Basic Workflow** | Standard development cycle | [Basic Loop](#the-basic-loop) |
| **Multi-Context** | Advanced tag-based workflows | [Tagged Workflows](#multi-context-workflows) |
| **Team Collaboration** | Working with multiple developers | [Team Patterns](#team-collaboration-patterns) |
| **PRD Integration** | Product Requirements Document workflow | [PRD-Driven Development](#prd-driven-development) |

---

## Agent Guidelines

- **Your Default Stance**: For most projects, the user can work directly within the `master` task context. Your initial actions should operate on this default context unless a clear pattern for multi-context work emerges.
- **Your Goal**: Your role is to elevate the user's workflow by intelligently introducing advanced features like **Tagged Task Lists** when you detect the appropriate context. Do not force tags on the user; suggest them as a helpful solution to a specific need.

## The Basic Loop

The fundamental development cycle you will facilitate is:

1. **`list`**: Show the user what needs to be done.
2. **`next`**: Help the user decide what to work on.
3. **`show <id>`**: Provide details for a specific task.
4. **`expand <id>`**: Break down a complex task into smaller, manageable subtasks.
5. **Implement**: The user writes the code and tests.
6. **`update-subtask`**: Log progress and findings on behalf of the user.
7. **`set-status`**: Mark tasks and subtasks as `done` as work is completed.
8. **Repeat**.

All your standard command executions should operate on the user's current task context, which defaults to `master`.

---

## Standard Development Workflow

### Simple Workflow (Default Starting Point)

For new projects or when users are getting started, operate within the `master` tag context:

- Start new projects by running `initialize_project` tool / `task-master init` or `parse_prd` / `task-master parse-prd --input='<prd-file.txt>'`
- Configure rule sets during initialization with `--rules` flag (e.g., `task-master init --rules cursor,windsurf`) or manage them later with `task-master rules add/remove` commands
- Begin coding sessions with `get_tasks` / `task-master list` to see current tasks, status, and IDs
- Determine the next task to work on using `next_task` / `task-master next`
- Analyze task complexity with `analyze_project_complexity` / `task-master analyze-complexity --research` before breaking down tasks
- Review complexity report using `complexity_report` / `task-master complexity-report`
- Select tasks based on dependencies (all marked 'done'), priority level, and ID order
- View specific task details using `get_task` / `task-master show <id>` to understand implementation requirements
- Break down complex tasks using `expand_task` / `task-master expand --id=<id> --force --research` with appropriate flags like `--force` (to replace existing subtasks) and `--research`
- Implement code following task details, dependencies, and project standards
- Mark completed tasks with `set_task_status` / `task-master set-status --id=<id> --status=done`
- Update dependent tasks when implementation differs from original plan using `update` / `task-master update --from=<id> --prompt="..."` or `update_task` / `task-master update-task --id=<id> --prompt="..."`

---

## Multi-Context Workflows

### When to Introduce Tags: Decision Patterns

#### Pattern 1: Simple Git Feature Branching

- **Trigger**: The user creates a new git branch (e.g., `git checkout -b feature/user-auth`).
- **Your Action**: Propose creating a new tag that mirrors the branch name to isolate the feature's tasks from `master`.
- **Your Suggested Prompt**: *"I see you've created a new branch named 'feature/user-auth'. To keep all related tasks neatly organized and separate from your main list, I can create a corresponding task tag for you. This helps prevent merge conflicts in your `tasks.json` file later. Shall I create the 'feature-user-auth' tag?"*
- **Tool to Use**: `task-master add-tag --from-branch`

#### Pattern 2: Team Collaboration Patterns

- **Trigger**: The user mentions working with teammates (e.g., "My teammate Alice is handling the database schema," or "I need to review Bob's work on the API.").
- **Your Action**: Suggest creating a separate tag for the user's work to prevent conflicts with shared master context.
- **Your Suggested Prompt**: *"Since you're working with Alice, I can create a separate task context for your work to avoid conflicts. This way, Alice can continue working with the master list while you have your own isolated context. When you're ready to merge your work, we can coordinate the tasks back to master. Shall I create a tag for your current work?"*
- **Tool to Use**: `task-master add-tag my-work --copy-from-current --description="My tasks while collaborating with Alice"`

#### Pattern 3: Experiments or Risky Refactors

- **Trigger**: The user wants to try something that might not be kept (e.g., "I want to experiment with switching our state management library," or "Let's refactor the old API module, but I want to keep the current tasks as a reference.").
- **Your Action**: Propose creating a sandboxed tag for the experimental work.
- **Your Suggested Prompt**: *"This sounds like a great experiment. To keep these new tasks separate from our main plan, I can create a temporary 'experiment-zustand' tag for this work. If we decide not to proceed, we can simply delete the tag without affecting the main task list. Sound good?"*
- **Tool to Use**: `task-master add-tag experiment-zustand --description="Exploring Zustand migration"`

#### Pattern 4: Large Feature Initiatives (PRD-Driven)

- **Trigger**: The user describes a large, multi-step feature that would benefit from a formal plan.
- **Your Action**: Propose a comprehensive, PRD-driven workflow.
- **Your Suggested Prompt**: *"This sounds like a significant new feature. To manage this effectively, I suggest we create a dedicated task context for it. Here's the plan: I'll create a new tag called 'feature-xyz', then we can draft a Product Requirements Document (PRD) together to scope the work. Once the PRD is ready, I'll automatically generate all the necessary tasks within that new tag. How does that sound?"*

#### Pattern 5: Version-Based Development

Tailor your approach based on the project maturity indicated by tag names.

**Prototype/MVP Tags** (`prototype`, `mvp`, `poc`, `v0.x`):
- **Your Approach**: Focus on speed and functionality over perfection
- **Task Generation**: Create tasks that emphasize "get it working" over "get it perfect"
- **Complexity Level**: Lower complexity, fewer subtasks, more direct implementation paths

**Production/Mature Tags** (`v1.0+`, `production`, `stable`):
- **Your Approach**: Emphasize robustness, testing, and maintainability
- **Task Generation**: Include comprehensive error handling, testing, documentation, and optimization
- **Complexity Level**: Higher complexity, more detailed subtasks, thorough implementation paths

---

## PRD-Driven Development

### Master List Strategy (High-Value Focus)

Once you transition to tag-based workflows, the `master` tag should ideally contain only:

- **High-level deliverables** that provide significant business value
- **Major milestones** and epic-level features
- **Critical infrastructure** work that affects the entire project
- **Release-blocking** items

**What NOT to put in master**:
- Detailed implementation subtasks (these go in feature-specific tags' parent tasks)
- Refactoring work (create dedicated tags like `refactor-auth`)
- Experimental features (use `experiment-*` tags)
- Team member-specific tasks (use person-specific tags)

### For New Major Features

1. **Identify the Initiative**: When user describes a significant feature
2. **Create Dedicated Tag**: `add_tag feature-[name] --description="[Feature description]"`
3. **Collaborative PRD Creation**: Work with user to create comprehensive PRD in `.taskmaster/docs/feature-[name]-prd.txt`
4. **Parse & Prepare**: 
   - `parse_prd .taskmaster/docs/feature-[name]-prd.txt --tag=feature-[name]`
   - `analyze_project_complexity --tag=feature-[name] --research`
   - `expand_all --tag=feature-[name] --research`
5. **Add Master Reference**: Create a high-level task in `master` that references the feature tag

### For Existing Codebase Analysis

When users initialize Taskmaster on existing projects:

1. **Codebase Discovery**: Use your native tools for producing deep context about the code base. You may use `research` tool with `--tree` and `--files` to collect up to date information using the existing architecture as context.
2. **Collaborative Assessment**: Work with user to identify improvement areas, technical debt, or new features
3. **Strategic PRD Creation**: Co-author PRDs that include:
   - Current state analysis (based on your codebase research)
   - Proposed improvements or new features
   - Implementation strategy considering existing code
4. **Tag-Based Organization**: Parse PRDs into appropriate tags (`refactor-api`, `feature-dashboard`, `tech-debt`, etc.)
5. **Master List Curation**: Keep only the most valuable initiatives in master

---

## Workflow Transition Examples

### Example 1: Simple → Team-Based
```
User: "Alice is going to help with the API work"
Your Response: "Great! To avoid conflicts, I'll create a separate task context for your work. Alice can continue with the master list while you work in your own context. When you're ready to merge, we can coordinate the tasks back together."
Action: add_tag my-api-work --copy-from-current --description="My API tasks while collaborating with Alice"
```

### Example 2: Simple → PRD-Driven
```
User: "I want to add a complete user dashboard with analytics, user management, and reporting"
Your Response: "This sounds like a major feature that would benefit from detailed planning. Let me create a dedicated context for this work and we can draft a PRD together to ensure we capture all requirements."
Actions: 
1. add_tag feature-dashboard --description="User dashboard with analytics and management"
2. Collaborate on PRD creation
3. parse_prd dashboard-prd.txt --tag=feature-dashboard
4. Add high-level "User Dashboard" task to master
```

### Example 3: Existing Project → Strategic Planning
```
User: "I just initialized Taskmaster on my existing React app. It's getting messy and I want to improve it."
Your Response: "Let me research your codebase to understand the current architecture, then we can create a strategic plan for improvements."
Actions:
1. research "Current React app architecture and improvement opportunities" --tree --files=src/
2. Collaborate on improvement PRD based on findings
3. Create tags for different improvement areas (refactor-components, improve-state-management, etc.)
4. Keep only major improvement initiatives in master
```

---

## Related Documentation

- **[Agent Configuration](../agents/README.md)** - AI agent setup and best practices
- **[Development Setup](../../how-to/development/)** - Local development environment
- **[MCP Integration](../../how-to/ai-integration/)** - Model Context Protocol setup

---

**Navigation:** [← Agent Tools](../agents/README.md) | [Tools Overview](../README.md) | [Reference Home](../../README.md) 