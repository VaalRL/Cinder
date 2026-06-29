# Diagnose Electron Startup Command

Diagnose and troubleshoot Electron application startup issues.

## What this command does

This command will:
1. Check all prerequisites for Electron startup
2. Verify port availability
3. Test backend and frontend health
4. Analyze common startup failures
5. Provide step-by-step fix recommendations
6. Generate diagnostic report

## Diagnostic Checks

### 1. Environment Check
- ✅ Node.js installation and version
- ✅ npm installation and version
- ✅ Frontend dependencies (node_modules)
- ✅ Backend dependencies (node_modules)
- ✅ Electron installation in frontend

### 2. Port Check
- ✅ Port 3000 availability (Frontend)
- ✅ Port 3001 availability (Backend)
- ✅ Processes occupying ports
- ✅ PID and process details

### 3. Service Health Check
- ✅ Backend API health endpoint
- ✅ Frontend dev server status
- ✅ Database connection status
- ✅ Redis connection (if applicable)

### 4. Configuration Check
- ✅ package.json scripts
- ✅ electron-test configuration
- ✅ wait-on settings
- ✅ Backend health endpoint

### 5. Known Issues Check
- ✅ npm command without 'call' in batch files
- ✅ Health check returning 503
- ✅ wait-on expecting wrong status code
- ✅ Database connection failures

## Execution Flow

1. **Run Basic Checks**
   ```bash
   node --version
   npm --version
   ```

2. **Check Dependencies**
   ```bash
   test -d frontend/node_modules
   test -d backend/node_modules
   cd frontend && npm list electron
   ```

3. **Check Ports**
   ```bash
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   ```

4. **Test Services**
   ```bash
   curl http://localhost:3001/api/health
   curl http://localhost:3000
   ```

5. **Analyze Configuration**
   - Check frontend/package.json scripts
   - Verify wait-on configuration
   - Check batch file syntax

6. **Generate Report**
   Create startup-diagnostic.log with all findings

## Common Issues Detected

### Issue 1: Batch File npm Commands
**Symptom**: Script exits after npm command
**Detection**: Search for npm commands without 'call' prefix
**Fix**: Add 'call' before all npm commands

### Issue 2: Health Check 503
**Symptom**: wait-on never completes
**Detection**: Health endpoint returns 503
**Fix**: Use tcp:3001 instead of http://localhost:3001/api/health

### Issue 3: Port Occupied
**Symptom**: EADDRINUSE error
**Detection**: Port already listening
**Fix**: Run force-clean-ports.bat

### Issue 4: Missing Dependencies
**Symptom**: Module not found errors
**Detection**: node_modules missing
**Fix**: Run npm install in frontend and backend

### Issue 5: Electron Not Installed
**Symptom**: Cannot find module 'electron'
**Detection**: npm list electron fails
**Fix**: npm install electron --save-dev in frontend

## Usage

Type `/diagnose-electron` to run full diagnostics.

Options:
- `/diagnose-electron quick` - Basic checks only
- `/diagnose-electron ports` - Port analysis only
- `/diagnose-electron health` - Service health only
- `/diagnose-electron config` - Configuration check only
- `/diagnose-electron full` - Complete diagnostics (default)

## Output Format

```
========================================
  Electron Startup Diagnostics
========================================

[1/6] Environment Check...
  ✅ Node.js: v20.x.x
  ✅ npm: v10.x.x
  ✅ Frontend dependencies: OK
  ✅ Backend dependencies: OK
  ✅ Electron: v37.5.1

[2/6] Port Check...
  ✅ Port 3000: Free
  ✅ Port 3001: Free

[3/6] Service Health...
  ❌ Backend: Not running
  ❌ Frontend: Not running

[4/6] Configuration Check...
  ⚠️  Found npm command without 'call' in start-electron.bat:58
  ✅ wait-on using tcp:3001 (correct)
  ✅ package.json electron-test script: OK

[5/6] Known Issues Check...
  ⚠️  Issue #2: Health Check 503 - Already fixed
  ✅ No active issues detected

[6/6] Recommendations...
  1. All prerequisites met
  2. Services not running (expected before startup)
  3. Ready to start: run start-electron-simple.bat

Diagnostic log saved to: startup-diagnostic.log
```

## Automated Fixes

The command can optionally apply fixes:

- `--fix-batch-files` - Add 'call' to npm commands
- `--fix-ports` - Clean occupied ports
- `--fix-deps` - Install missing dependencies
- `--fix-all` - Apply all safe fixes

Example:
```
/diagnose-electron --fix-all
```

## Safety Features

- **Read-only by default** - No changes without explicit flags
- **Backup before fix** - Creates backup of modified files
- **Confirmation required** - Asks before applying fixes
- **Detailed logging** - All actions logged to diagnostic.log

## Post-Diagnostic Actions

After running diagnostics:

1. **Review Report**
   - Check startup-diagnostic.log
   - Note any warnings or errors

2. **Apply Fixes**
   - Follow recommendations in order
   - Test after each fix

3. **Test Startup**
   - Run start-electron-simple.bat
   - Monitor output for issues

4. **Report Persistent Issues**
   - Provide diagnostic log
   - Include error screenshots
   - Share batch file output

## Integration with Other Commands

This command works well with:
- `/cleanup-files` - Clean up before diagnosing
- `/fix-electron` - Apply automated fixes
- `/test-electron` - Test after fixes applied

## Files Generated

- `startup-diagnostic.log` - Main diagnostic report
- `port-check.log` - Detailed port analysis
- `service-health.log` - Service status
- `config-check.log` - Configuration validation
