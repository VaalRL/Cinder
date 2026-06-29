# Claude Code Custom Commands

This directory contains custom slash commands for the Beaver Realty project.

## 📋 Available Commands

### 1. `/release-note` - 版號與 Release Notes 更新

功能完成後自動同步更新版號與 Release Notes。

**Usage:**
```
/release-note "新增物件損益計算機"              # 基本使用（patch 版號）
/release-note --minor "新增租金自動調整功能"   # minor 版號
/release-note --type=fix "修復日期選擇器問題"  # 指定類別
```

**What it does:**
- 更新 `package.json` 版號
- 更新 `RELEASE_NOTE.md` 開發紀錄
- 更新 `src/lib/data/releaseNotes.ts` 前台顯示紀錄

**When to use:**
- 完成一個功能開發後
- 修復 bug 後
- 進行技術重構後

---

### 2. `/pre-release-check` - 發布前檢查

執行上架前全面檢查，確保產品符合發布標準。

**Usage:**
```
/pre-release-check                    # 自動偵測專案類型
/pre-release-check --type=saas        # 指定專案類型
/pre-release-check --skip=todos       # 跳過 todo 檢查
```

---

### 3. `/cleanup-files` - File Cleanup Command

Automatically clean up and organize outdated files in the project.

**Usage:**
```
/cleanup-files           # Clean up all categories
/cleanup-files docs      # Only documentation files
/cleanup-files scripts   # Only batch scripts
/cleanup-files logs      # Only log files
```

**What it does:**
- Moves outdated documentation to `archive/docs/`
- Moves old batch scripts to `archive/batch-scripts/`
- Moves log files to `archive/logs/`
- Updates .gitignore
- Generates cleanup summary report

**When to use:**
- After completing a major feature
- When root directory becomes cluttered
- Before releasing a new version
- Monthly maintenance

---

### 2. `/diagnose-electron` - Electron Diagnostics

Comprehensive diagnostics for Electron startup issues.

**Usage:**
```
/diagnose-electron           # Full diagnostics
/diagnose-electron quick     # Basic checks only
/diagnose-electron ports     # Port analysis
/diagnose-electron health    # Service health check
/diagnose-electron config    # Configuration check
```

**With automated fixes:**
```
/diagnose-electron --fix-all          # Apply all safe fixes
/diagnose-electron --fix-batch-files  # Fix batch file syntax
/diagnose-electron --fix-ports        # Clean occupied ports
/diagnose-electron --fix-deps         # Install dependencies
```

**What it checks:**
- Node.js and npm installation
- Dependencies (frontend/backend)
- Port availability (3000, 3001)
- Service health (backend, frontend)
- Configuration (package.json, scripts)
- Known issues (batch files, health check)

**When to use:**
- Electron won't start
- Port occupation errors
- Module not found errors
- Before starting development
- After updating dependencies

---

## 🚀 How to Use Custom Commands

### In Claude Code Chat

1. Type `/` in the chat to see available commands
2. Select command from the dropdown
3. Press Enter to execute
4. Follow the prompts if any

### Command Syntax

```
/command-name [options] [--flags]
```

Examples:
- `/cleanup-files all`
- `/diagnose-electron --fix-all`
- `/cleanup-files logs`

---

## 📁 Command File Structure

Each command is defined in a Markdown file:

```
.claude/
└── commands/
    ├── README.md                 # This file
    ├── cleanup-files.md          # Cleanup command
    └── diagnose-electron.md      # Diagnostics command
```

### Command File Format

```markdown
# Command Title

Brief description

## What this command does
...

## Usage
...

## Options
...
```

---

## 🔧 Creating New Commands

### 1. Create Command File

Create a new `.md` file in `.claude/commands/`:

```bash
touch .claude/commands/my-command.md
```

### 2. Define Command

```markdown
# My Custom Command

Description of what the command does.

## What this command does

1. Step 1
2. Step 2
3. Step 3

## Usage

/my-command [options]

## Options

- `option1` - Description
- `option2` - Description
```

### 3. Test Command

1. Restart Claude Code (if needed)
2. Type `/my-command` in chat
3. Verify command appears
4. Test execution

---

## 🎯 Best Practices

### Command Design

1. **Clear Purpose** - Each command should do one thing well
2. **Safe Defaults** - Default behavior should be safe
3. **Confirmations** - Ask before destructive operations
4. **Logging** - Log all actions for debugging
5. **Rollback** - Provide way to undo changes

### Documentation

1. **What it does** - Clear description
2. **When to use** - Use cases
3. **How to use** - Examples
4. **Safety notes** - Warnings
5. **Output format** - Expected results

### Testing

1. **Test basic usage** - Default options
2. **Test with options** - All variations
3. **Test error cases** - Invalid input
4. **Test safety** - Confirm no data loss
5. **Test output** - Verify results

---

## 🔍 Command Reference

### `/cleanup-files`

| Option | Description | Default |
|--------|-------------|---------|
| `all` | Clean up everything | ✅ |
| `docs` | Documentation only | ❌ |
| `scripts` | Batch scripts only | ❌ |
| `logs` | Log files only | ❌ |

**Output Files:**
- `CLEANUP_SUMMARY.md` - Cleanup report
- `archive/` - Archived files

### `/diagnose-electron`

| Option | Description | Default |
|--------|-------------|---------|
| `full` | Complete diagnostics | ✅ |
| `quick` | Basic checks only | ❌ |
| `ports` | Port analysis | ❌ |
| `health` | Service health | ❌ |
| `config` | Configuration check | ❌ |

| Flag | Description | Safe |
|------|-------------|------|
| `--fix-all` | Apply all fixes | ⚠️ |
| `--fix-batch-files` | Fix batch syntax | ✅ |
| `--fix-ports` | Clean ports | ✅ |
| `--fix-deps` | Install deps | ✅ |

**Output Files:**
- `startup-diagnostic.log` - Main report
- `port-check.log` - Port details
- `service-health.log` - Service status
- `config-check.log` - Config validation

---

## 📝 Command Ideas (Future)

Potential commands to add:

1. `/fix-electron` - Auto-fix common Electron issues
2. `/test-electron` - Run Electron startup test
3. `/backup-project` - Create project backup
4. `/update-deps` - Update all dependencies
5. `/check-security` - Security audit
6. `/optimize-build` - Optimize build size
7. `/generate-docs` - Generate documentation
8. `/check-types` - TypeScript type check
9. `/run-tests` - Run test suite
10. `/deploy-app` - Deploy application

---

## 🆘 Troubleshooting

### Command Not Found

1. Check file name matches command
2. Ensure file is in `.claude/commands/`
3. Restart Claude Code
4. Check for syntax errors in .md file

### Command Doesn't Execute

1. Check command permissions in settings
2. Verify required tools installed (git, npm, etc.)
3. Check command syntax
4. Review error messages

### Command Produces Errors

1. Check prerequisites
2. Verify file paths
3. Review command logs
4. Test manually first

---

## 📚 Resources

- [Claude Code Documentation](https://docs.claude.com/claude-code)
- [Custom Commands Guide](https://docs.claude.com/claude-code/custom-commands)
- [Project Documentation](../DOCS_INDEX.md)

---

**Last Updated:** 2025-10-05
**Maintained By:** Lab Management Team
