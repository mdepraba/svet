# UI/UX Expert Skill Scripts

Automation scripts for UI implementation workflow.

---

## Available Scripts

### 1. **take-baseline-screenshots.sh**
**Purpose**: Capture baseline screenshots before implementation
**When to use**: At the start of Phase 0 (Style Guide study)
**Usage**:
```bash
./scripts/take-baseline-screenshots.sh <feature-url> <output-dir>
```
**What it does**:
- Navigates to feature page
- Captures screenshots at all breakpoints (mobile, tablet, desktop)
- Captures both light and dark modes
- Saves to specified output directory

### 2. **validate-accessibility.sh**
**Purpose**: Run automated accessibility audit
**When to use**: During Phase 4 (Validation)
**Usage**:
```bash
./scripts/validate-accessibility.sh <url>
```
**What it does**:
- Runs Lighthouse accessibility audit
- Checks color contrast ratios
- Validates ARIA labels
- Generates accessibility report

### 3. **check-style-guide-compliance.sh**
**Purpose**: Verify Style Guide compliance
**When to use**: During Phase 4 (Validation)
**Usage**:
```bash
./scripts/check-style-guide-compliance.sh <component-file>
```
**What it does**:
- Scans for arbitrary color values (e.g., `bg-[#4A5FFF]`)
- Checks for arbitrary spacing values (e.g., `p-[17px]`)
- Validates animation durations (must be 200ms, 300ms, or 500ms)
- Verifies typography scale usage

### 4. **run-e2e-tests.sh**
**Purpose**: Execute E2E tests for feature
**When to use**: During Phase 4 (Validation)
**Usage**:
```bash
./scripts/run-e2e-tests.sh <feature-name>
```
**What it does**:
- Runs Playwright E2E tests matching feature name
- Captures test screenshots on failure
- Generates test report

### 5. **capture-final-screenshots.sh**
**Purpose**: Capture final implementation screenshots
**When to use**: Before creating iteration document (Phase 5)
**Usage**:
```bash
./scripts/capture-final-screenshots.sh <feature-url> <output-dir>
```
**What it does**:
- Captures screenshots at all breakpoints
- Both light and dark modes
- Includes interaction states (hover, focus, active) if applicable
- Compares with baseline screenshots

### 6. **generate-component-manifest.sh**
**Purpose**: Generate component inventory for iteration document
**When to use**: During Phase 5 (Documentation)
**Usage**:
```bash
./scripts/generate-component-manifest.sh <feature-path>
```
**What it does**:
- Lists all components created
- Identifies shadcn/ui components used
- Counts lines of code
- Generates component dependency tree

---

## Script Requirements

All scripts require:
- Chrome DevTools MCP available
- Development server running (`npm run dev`)
- E2E tests present in `app/e2e/` directory
- Style Guide at `.claude/STYLE_GUIDE.md`

---

## Integration with Workflow

Scripts are invoked automatically during the 6-phase workflow:

- **Phase 0**: `take-baseline-screenshots.sh` (optional)
- **Phase 4**: `validate-accessibility.sh`, `check-style-guide-compliance.sh`, `run-e2e-tests.sh`
- **Phase 5**: `capture-final-screenshots.sh`, `generate-component-manifest.sh`

---

**Note**: Scripts are helpers, not replacements for manual verification. Always review results.

---

**Last Updated**: 2025-01-26
