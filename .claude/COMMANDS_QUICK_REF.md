# Claude Code Commands Quick Reference

## 🚀 Quick Start

Type `/` in Claude Code chat to see available commands.

## 📋 Available Commands

### `/cleanup-files` - File Cleanup
```
/cleanup-files              # Clean all
/cleanup-files docs         # Docs only
/cleanup-files scripts      # Scripts only
/cleanup-files logs         # Logs only
```

### `/diagnose-electron` - Electron Diagnostics
```
/diagnose-electron                  # Full diagnostics
/diagnose-electron quick            # Quick check
/diagnose-electron --fix-all        # Auto-fix all
/diagnose-electron --fix-ports      # Fix ports only
```

## 🔧 Common Workflows

### Before Starting Development
```
1. /diagnose-electron quick
2. If issues found → /diagnose-electron --fix-all
3. Run: start-electron-simple.bat
```

### After Feature Complete
```
1. /cleanup-files logs
2. Test feature
3. Git commit
```

### Before Release
```
1. /cleanup-files all
2. /diagnose-electron full
3. Full testing
4. Git tag & release
```

## 💡 Tips

- Commands are **safe by default** (read-only)
- Use `--fix-*` flags for auto-repair
- All actions are logged
- Files are archived, not deleted

## 📚 Full Documentation

- Commands: `.claude/commands/README.md`
- Setup Guide: `CUSTOM_COMMANDS_SETUP.md`
- Project Docs: `DOCS_INDEX.md`
