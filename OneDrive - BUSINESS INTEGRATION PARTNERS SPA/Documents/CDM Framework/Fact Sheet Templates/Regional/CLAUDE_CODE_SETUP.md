# Claude Code Project Setup: CDM/DRR Regional Fact Sheets

## Overview

This guide explains how to set up the Regional Fact Sheet skill in a Claude Code project, mirroring the setup pattern used for individual bank fact sheets.

## Directory Structure

Create this structure in your Claude Code project:

```
your-project/
├── .claude/
│   └── skills/
│       └── cdm-regional-factsheet/
│           ├── SKILL.md                    # Main skill file (Claude reads this)
│           ├── regional_template.js        # Template generator
│           ├── regional_aggregator.js      # Data aggregator (optional)
│           ├── schema/
│           │   └── regional_schema.json    # JSON schema for validation
│           └── examples/
│               └── eu_gsib_enhanced.json   # Example data file
├── data/
│   └── regional/                           # Your regional JSON data files
└── outputs/                                # Generated fact sheets
```

## Step 1: Create the Skill Directory

```bash
mkdir -p .claude/skills/cdm-regional-factsheet/schema
mkdir -p .claude/skills/cdm-regional-factsheet/examples
mkdir -p data/regional
mkdir -p outputs
```

## Step 2: Copy Core Files

Copy these files from the development environment:

| Source | Destination |
|--------|-------------|
| `regional_template.js` | `.claude/skills/cdm-regional-factsheet/` |
| `regional_aggregator.js` | `.claude/skills/cdm-regional-factsheet/` |
| `eu_gsib_enhanced.json` | `.claude/skills/cdm-regional-factsheet/examples/` |

## Step 3: Create the SKILL.md File

Create `.claude/skills/cdm-regional-factsheet/SKILL.md`:

```markdown
# CDM/DRR Regional Fact Sheet Generator

## Purpose
Generates executive-level, one-page regional analysis fact sheets for CDM/DRR sales enablement.

## When to Use
- User requests a regional fact sheet or regional analysis
- User provides regional bank data in JSON format
- User asks about regional CDM/DRR positioning

## Quick Start

### Generate a Regional Fact Sheet

```bash
cd .claude/skills/cdm-regional-factsheet
node regional_template.js ../../data/regional/[region].json ../../outputs/
```

### Required Data Structure

Regional JSON must include:
- `meta`: Region metadata (regionId, name, bankCount)
- `summary`: Aggregated metrics (totalNotional, archetypeDistribution, keyInsight)
- `deadlines`: Regulatory deadlines with status and countdown
- `maturitySpectrum`: Banks grouped by ARCHITECT/PRAGMATIST/OBSERVER
- `bankQuickReference`: Per-bank summary data
- `patterns`: Common objections, competitor activity, regional sensitivity
- `recommendedSequence`: Prioritized approach order
- `priorityActions`: 30-day action items with owners
- `bottomLineStructured`: Executive summary with timeline, risk, resources

### Example Command

```bash
node regional_template.js examples/eu_gsib_enhanced.json ../../outputs/
```

## Output
- Single-page portrait Word document (.docx)
- Professional formatting with navy title bars
- Ready for executive presentation

## Key Sections Generated

1. **Header**: Region name, bank count, notional, engagement score
2. **KEY INSIGHT**: Actionable 3-sentence summary with dollar values
3. **Maturity Spectrum**: Visual ARCHITECT → PRAGMATIST → OBSERVER layout
4. **Bank Quick Reference**: Table with posture, DRR status, urgency, entry point
5. **Key Deadlines**: Active/upcoming/done with countdown and penalty exposure
6. **Regional Patterns**: Objection handling, competitor activity, budget cycles
7. **Recommended Sequence**: Prioritized banks with dependencies and success metrics
8. **30-Day Priority Actions**: Week-by-week actions with owners
9. **Regional Sensitivity**: "Don't say" phrases with reasoning and alternatives
10. **Bottom Line**: Executive summary with timeline, risk, resources, next review

## Dependencies

```bash
npm install docx
```

## See Also
- `examples/eu_gsib_enhanced.json` for complete data structure
- Individual bank fact sheet skill for per-bank analysis
```

## Step 4: Install Dependencies

In your project root:

```bash
npm init -y
npm install docx
```

## Step 5: Create a Regional Data Schema (Optional)

Create `.claude/skills/cdm-regional-factsheet/schema/regional_schema.json` for validation:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CDM/DRR Regional Data",
  "type": "object",
  "required": ["meta", "summary", "deadlines", "maturitySpectrum", "bankQuickReference"],
  "properties": {
    "meta": {
      "type": "object",
      "required": ["regionId", "name", "bankCount"],
      "properties": {
        "regionId": { "type": "string" },
        "name": { "type": "string" },
        "displayName": { "type": "string" },
        "bankCount": { "type": "integer" }
      }
    },
    "summary": {
      "type": "object",
      "required": ["totalNotional", "archetypeDistribution", "keyInsight"],
      "properties": {
        "totalNotional": { "type": "string" },
        "keyInsight": { "type": "string" },
        "archetypeDistribution": {
          "type": "object",
          "properties": {
            "ARCHITECT": { "type": "integer" },
            "PRAGMATIST": { "type": "integer" },
            "OBSERVER": { "type": "integer" }
          }
        }
      }
    },
    "deadlines": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "date", "status"],
        "properties": {
          "name": { "type": "string" },
          "date": { "type": "string" },
          "status": { "enum": ["Active", "Upcoming", "Done"] },
          "isActive": { "type": "boolean" },
          "countdown": { "type": ["string", "null"] },
          "penaltyExposure": { "type": ["string", "null"] }
        }
      }
    }
  }
}
```

## Step 6: Usage in Claude Code

Once set up, you can ask Claude:

> "Generate a regional fact sheet for EU G-SIBs using the data in data/regional/eu_gsib.json"

Claude will:
1. Read the SKILL.md to understand the workflow
2. Execute `node regional_template.js` with appropriate paths
3. Return the generated .docx file

## Workflow Options

### Option A: Pre-aggregated Data
If you already have regional JSON files:
```bash
node regional_template.js data/regional/us_gsib.json outputs/
```

### Option B: Aggregate from Individual Bank Files
If you have individual bank JSONs:
```bash
# Step 1: Aggregate
node regional_aggregator.js data/banks/ data/regional/

# Step 2: Generate
node regional_template.js data/regional/us_gsib.json outputs/
```

## Integration with Individual Bank Skill

The regional and individual bank skills work together:

```
┌─────────────────────┐
│  Research Notes     │
│  (Markdown)         │
└─────────┬───────────┘
          │ parser.js (bank skill)
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Individual Bank    │     │  Individual Bank    │
│  JSON               │────►│  Fact Sheet         │
└─────────┬───────────┘     │  (1-page DOCX)      │
          │                 └─────────────────────┘
          │ regional_aggregator.js
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Regional           │     │  Regional           │
│  Aggregated JSON    │────►│  Fact Sheet         │
└─────────────────────┘     │  (1-page DOCX)      │
                            └─────────────────────┘
```

## File Manifest

| File | Size | Purpose |
|------|------|---------|
| `SKILL.md` | ~2KB | Claude instruction file |
| `regional_template.js` | ~68KB | DOCX generator |
| `regional_aggregator.js` | ~27KB | Data aggregation |
| `eu_gsib_enhanced.json` | ~9KB | Example data |
| `regional_schema.json` | ~2KB | JSON validation |

## Troubleshooting

### "Cannot find module 'docx'"
```bash
npm install docx
```

### "File not found" errors
Ensure paths are relative to where you run the command:
```bash
# Run from skill directory
cd .claude/skills/cdm-regional-factsheet
node regional_template.js ../../data/regional/eu_gsib.json ../../outputs/
```

### Template generates but formatting is wrong
- Ensure you're opening in Microsoft Word (not Google Docs or LibreOffice)
- Some emoji may not render in older Word versions

## Updating the Template

To modify the template:
1. Edit `regional_template.js`
2. Test with example data: `node regional_template.js examples/eu_gsib_enhanced.json ./`
3. Verify output in Word
4. Commit changes
