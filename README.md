# 🚀 TraffBoard - Claude Sonnet 4 Optimized

## Quick Navigation

### 📖 **Main Guides**
- **[CLAUDE.md](./CLAUDE.md)** - Primary development guide for Claude Sonnet 4
- **[QUICK_REF.md](./QUICK_REF.md)** - Commands, locations, and quick fixes
- **[.claude/OPTIMIZATION.md](./.claude/OPTIMIZATION.md)** - Claude-specific optimizations
- **[.claude/PROMPTING_EXAMPLES.md](./.claude/PROMPTING_EXAMPLES.md)** - Effective prompting patterns

### 🛠 **Development Files**
- **[.cursor/rules/claude_sonnet4.mdc](./.cursor/rules/claude_sonnet4.mdc)** - Cursor rules
- **[.cursor/rules/simplified_dev.mdc](./.cursor/rules/simplified_dev.mdc)** - Simplified workflow
- **[package.json](./package.json)** - Dependencies and scripts
- **[.env.example](./.env.example)** - Environment variables template

### 🏗 **Project Structure**
```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable components
├── db/                     # Database layer (Drizzle ORM)
└── lib/                    # Utilities and helpers
```

## 🎯 Claude Sonnet 4 Optimization Summary

### **Key Optimizations**
1. **Structured Prompting** - Clear, context-rich requests
2. **Efficient Tool Usage** - edit_block for changes, read_file for context
3. **MVP-First Development** - Working code before perfect code
4. **Systematic Debugging** - Leverage reasoning capabilities
5. **Pattern Recognition** - Consistent code patterns throughout

### **Performance Improvements**
- **3-5x faster development** compared to complex TDD approach
- **Reduced cognitive load** with simplified workflow
- **Better AI results** with optimized prompting
- **Faster iteration cycles** with pragmatic testing

### **Quality Gates (Minimal)**
- ✅ `npm run build` succeeds
- ✅ `npm run dev` runs without errors
- ✅ Core functionality works manually
- ✅ TypeScript compilation passes

## 🚀 Quick Start

1. **Setup Environment**
   ```bash
   cp .env.example .env.local
   # Add your DATABASE_URL
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

4. **Database Operations**
   ```bash
   npm run db:push    # Push schema to database
   npm run db:studio  # Open database GUI
   ```

## 💡 Usage Tips

### **For Developers**
- Read CLAUDE.md for comprehensive development guide
- Use QUICK_REF.md for fast command lookup
- Follow patterns in existing code
- Test manually before writing automated tests

### **For AI Assistants**
- Use structured prompting from PROMPTING_EXAMPLES.md
- Leverage OPTIMIZATION.md for Claude-specific features
- Follow MVP-first development approach
- Use edit_block for small changes, write_file for new files

## 🎖 Success Metrics

**MVP Phase:**
- User can access dashboard ✅
- Data loads from database ✅
- Basic CRUD operations work ✅
- No critical runtime errors ✅
- Fast development velocity ✅

**Post-MVP:**
- Comprehensive test coverage
- Performance optimizations
- Enhanced error handling
- Production deployment

---

**Mission: Build working TraffBoard MVP fast using Claude Sonnet 4's strengths.**

*Last updated: 2025-07-03*