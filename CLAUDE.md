# Project Configuration for Claude Code

## PROJECT CONFIG

```yaml
project_name: "bw-tracker"
dev_server_cmd: "npm run dev"
dev_url: "http://localhost:3000"
tech_stack:
  - React + TypeScript
test_flows:
  - "Homepage load"
  - "Main user flow"
```

## CORE RULES (NON-NEGOTIABLE)

### 1. No Unauthorized Changes
- **ASK BEFORE** modifying any file not directly related to the current task
- **NEVER** refactor "while you're in there"
- **NEVER** update dependencies unless explicitly requested

### 2. Follow Existing Patterns
- Match the codebase's existing style exactly
- If unsure about a pattern, grep for examples first

### 3. Verify Before Claiming Done
- Run the dev server after changes
- Check for TypeScript/lint errors
- Test the actual UI if it's a UI change

## CHROME BROWSER QA

```bash
# Enable Chrome integration:
/chrome

# Run QA:
"Use fullstack-qa-orchestrator to test http://localhost:3000"
```

## AGENT USAGE

### Quick Audit
```
"Run parallel audit on src/"
```

### Browser QA Loop
```
"Use fullstack-qa-orchestrator to find and fix UI issues"
```

### Pre-PR Review
```
"Use architect-reviewer to verify changes are production-ready"
```
