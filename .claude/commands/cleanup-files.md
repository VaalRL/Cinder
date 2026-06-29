# Cleanup Outdated Files Command

Clean up outdated files and organize project structure.

## What this command does

This command will:
1. Create archive directories if they don't exist
2. Move outdated documentation files to archive/docs/
3. Move outdated batch scripts to archive/batch-scripts/
4. Move log files to archive/logs/
5. Update .gitignore to exclude log files
6. Generate a cleanup summary report

## File Categories

### Outdated Documentation (→ archive/docs/)
- Files with duplicate content
- Implementation records that are complete
- Obsolete startup guides
- Old diagnostic summaries

### Outdated Scripts (→ archive/batch-scripts/)
- Test scripts no longer in use
- Replaced utility scripts
- Old development scripts

### Log Files (→ archive/logs/)
- *.log files
- diagnostic logs
- temporary output files

## Execution Steps

1. **Create Archive Structure**
   ```bash
   mkdir -p archive/docs archive/batch-scripts archive/logs
   ```

2. **Archive Documentation**
   Move files matching these patterns:
   - `*_GUIDE_*.md` (old guides)
   - `*_SUMMARY.md` (old summaries)
   - `*_IMPLEMENTATION.md` (completed implementations)
   - `*_NOTICE.md` (obsolete notices)

3. **Archive Scripts**
   Move files matching:
   - `test-*.bat`
   - `*-old.bat`
   - `*-backup.bat`
   - `stop-dev.bat` (replaced by force-clean-ports.bat)

4. **Archive Logs**
   Move files matching:
   - `*.log`
   - `*-diagnostic.log`
   - `diagnostic-log.txt`

5. **Update .gitignore**
   Add log file patterns if not present

6. **Generate Reports**
   Create CLEANUP_SUMMARY.md with:
   - Files moved
   - Current structure
   - Next steps

## Safety Measures

- **Never delete files** - only move to archive/
- **Preserve git history** - files are moved, not deleted
- **Create backup** - archive/ directory can be committed
- **Keep essential files** - only move clearly outdated files

## Usage

Type `/cleanup-files` to execute this command.

You can also specify a category:
- `/cleanup-files docs` - Only archive documentation
- `/cleanup-files scripts` - Only archive scripts
- `/cleanup-files logs` - Only archive logs
- `/cleanup-files all` - Archive everything (default)

## Files to Keep

The command will NEVER move these files:
- README.md
- TODO.md
- START_HERE.md
- README_ELECTRON_START.md
- DOCS_INDEX.md
- start-electron-simple.bat
- start-electron-debug.bat
- start-electron.bat
- start-electron-cn.bat
- force-clean-ports.bat
- diagnose-startup.bat

## Post-Cleanup Actions

After cleanup, the command will:
1. List all archived files
2. Show new directory structure
3. Suggest git commit message
4. Update documentation index if needed

## Example Output

```
✅ Cleanup Complete!

Archived Files:
  📄 10 documentation files → archive/docs/
  📜 2 batch scripts → archive/batch-scripts/
  📋 3 log files → archive/logs/

Current Structure:
  6 batch scripts in root
  10 documentation files in root
  55 files in archive/

Next Steps:
  1. Review CLEANUP_SUMMARY.md
  2. Commit changes: git add . && git commit -m "chore: cleanup outdated files"
  3. Test startup: start-electron-simple.bat
```
