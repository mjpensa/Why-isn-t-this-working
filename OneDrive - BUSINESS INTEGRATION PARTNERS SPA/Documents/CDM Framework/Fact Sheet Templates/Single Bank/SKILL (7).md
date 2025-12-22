# CDM/DRR Bank Fact Sheet Generator

## Overview

This skill generates professionally formatted two-page client engagement fact sheets for CDM/DRR sales outreach. It processes structured research markdown files and produces consistent, high-quality Word documents with PDF exports.

## Directory Structure

```
/project/
├── SKILL.md                    # This file
├── config/
│   ├── template.js             # Parameterized docx generator (DO NOT MODIFY)
│   ├── parser.js               # Markdown → JSON converter
│   ├── schema.json             # Validation schema
│   └── bank-list.json          # List of all banks
├── research/                   # Input: Bank research markdown files
│   ├── TEMPLATE.md             # Blank template for research
│   ├── deutsche_bank.md
│   ├── jpmorgan.md
│   └── ... (one per bank)
├── extracted/                  # Intermediate: Validated JSON
│   └── ... (auto-generated)
└── outputs/                    # Output: Final deliverables
    └── ... (docx + pdf pairs)
```

## Processing Pipeline

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Research .md   │ ──► │  Validated JSON │ ──► │  .docx + .pdf   │
│  (your input)   │     │  (intermediate) │     │  (deliverable)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
      Step 1                  Step 2                  Step 3
    Parse &amp;               Validate &amp;            Generate &amp;
    Extract                 Transform              Export
```

## Step 1: Parse Research Markdown

Each research file MUST follow the exact structure in `research/TEMPLATE.md`. 

### Parsing Command

```bash
# Single file
node config/parser.js research/deutsche_bank.md

# Batch parse all research
node config/parser.js --batch research/ extracted/
```

### Parser Output

```
[1/31] ✓ Deutsche Bank
[2/31] ✓ JPMorgan Chase
[3/31] ✗ goldman_sachs.md
    ❌ Missing: Classification > Confidence
```

The parser extracts:

### Required Sections (Generation will FAIL if missing)
- `## Classification` — Archetype, confidence score
- `## Bank Profile` — All 9 fields
- `## Key Implication` — Single paragraph
- `## Position Summary Bullets` — Exactly 3 bullets
- `## Evidence Timeline` — 4-6 evidence items with years
- `## Lead With` — Single quoted phrase
- `## Competitive Position` — 4-5 peer banks including subject
- `## Regulatory Status` — 4 regulatory deadlines
- `## Engagement Openers` — 3 audience-specific openers
- `## Objection Handling` — 3 objection/response pairs
- `## Cost of Inaction` — All cost fields
- `## Landmines (Don't Say)` — 4-6 landmines
- `## Next Actions` — All sub-sections

### Parsing Rules

1. **Tables**: Parse markdown tables into arrays of objects
2. **Bold text**: Extract as field names (e.g., `**Headquarters**:` → `headquarters`)
3. **Blockquotes**: Extract warnings/footnotes (lines starting with `>`)
4. **Highlighted rows**: Rows with `**text**` indicate the subject bank

## Step 2: Validate Extracted Data

Before generation, validate each bank's JSON against `config/schema.json`:

### Validation Checks

```javascript
// Required string fields - must be non-empty
REQUIRED_STRINGS: [
  'bank.name',
  'bank.classification',
  'bank.headquarters',
  'positioning.keyImplication',
  'leadWith',
  'nextActions.emailTemplate.subject',
  'nextActions.emailTemplate.body'
]

// Required arrays - must have minimum length
REQUIRED_ARRAYS: {
  'positioning.bullets': 3,
  'evidence': 4,
  'competitivePosition': 4,
  'regulatoryUrgency': 4,
  'engagementAngles.openers': 3,
  'objectionHandling': 3,
  'landmines': 4,
  'nextActions.callAgenda': 4,
  'nextActions.discoveryQuestions': 3
}

// Enum validations
VALID_CLASSIFICATIONS: ['ARCHITECT', 'PRAGMATIST', 'OBSERVER']
VALID_CONFIDENCE: [1, 2, 3, 4, 5]
VALID_REG_STATUS: ['Done', 'Upcoming', 'Proposed']
```

### Validation Output

```
✓ deutsche_bank.json - VALID (all 24 checks passed)
✗ jpmorgan.json - INVALID
  - Missing: positioning.bullets[2]
  - Invalid: bank.confidence (6) - must be 1-5
```

## Step 3: Generate Documents

Use `config/template.js` to generate each fact sheet. **DO NOT MODIFY template.js** — it contains the exact formatting from the approved v6 template.

### Generation Command

```bash
node config/template.js extracted/deutsche_bank.json
```

### Output Files

For each bank, generate:
- `{Bank_Name}_CDM_Cheatsheet.docx`
- `{Bank_Name}_CDM_Cheatsheet.pdf`

## Batch Processing Instructions

When asked to generate all fact sheets:

### Recommended: Use Batch Runner

```bash
# Run the all-in-one batch processor
node config/batch_runner.js research/ /mnt/user-data/outputs/
```

This will:
1. Parse all markdown files in research/
2. Validate and save JSON to extracted/
3. Generate .docx files
4. Convert to PDF
5. Print summary with any failures

### Alternative: Step-by-Step

```bash
# Step 1: Parse all research to JSON
node config/parser.js --batch research/ extracted/

# Step 2: Generate all documents  
node config/template.js --batch extracted/
```

### Pre-Flight Checklist
1. Verify all research files exist in `/research/`
2. List banks to process and confirm count
3. Check for any previously generated outputs

### Processing Loop

```
FOR each bank in research/:
  1. PARSE markdown → JSON
  2. VALIDATE JSON against schema
  3. IF valid:
       - GENERATE docx
       - CONVERT to pdf
       - LOG success
     ELSE:
       - LOG validation errors
       - ADD to retry queue
  4. REPORT progress: "Completed X/31: {bank_name}"
```

### Error Handling

- **Parse errors**: Log missing section, skip bank, continue
- **Validation errors**: Log specific field failures, skip bank, continue
- **Generation errors**: Retry once, then skip and log
- **At end**: Report summary with any failed banks

### Progress Reporting

After each bank:
```
[12/31] ✓ Goldman Sachs — generated successfully
[13/31] ✗ Morgan Stanley — validation failed: missing evidence[4]
```

Final summary:
```
═══════════════════════════════════════════════
BATCH COMPLETE: 29/31 successful
═══════════════════════════════════════════════
✓ Generated: 29 banks
✗ Failed: 2 banks
  - Morgan Stanley: missing evidence[4]
  - Credit Suisse: invalid classification "NEUTRAL"

Output location: /mnt/user-data/outputs/
═══════════════════════════════════════════════
```

## Document Specifications

### Page 1: Executive Intelligence Brief

| Section | Content Source | Layout |
|---------|---------------|--------|
| Header | bank.name, bank.classification, bank.confidence | 2-column with badge |
| Position Summary | positioning.keyImplication, positioning.bullets, positioning.timing | KEY IMPLICATION callout first |
| Evidence Snapshot | evidence[], leadWith | Bulleted list + callout |
| Competitive Position | competitivePosition[] | 4-column table |
| Regulatory Urgency | regulatoryUrgency[] | 4-column table |
| Quick Reference | bank.* fields | 2-column key-value |
| Engagement Angles | engagementAngles.openers[], engagementAngles.rapportBuilders[] | 2-column |

### Page 2: Client Engagement Handbook

| Section | Content Source | Layout |
|---------|---------------|--------|
| Objection Handling | objectionHandling[] | 3-column IF/YOU SAY |
| Cost of Inaction | costOfInaction.* | Cost table + benchmark |
| Don't Say — Landmines | landmines[] | Bulleted list |
| Recommended Next Actions | nextActions.* | Structured grid |
| Email Template | nextActions.emailTemplate | Boxed callout |
| Confidence Notes | confidenceNotes, nextReview | Footer text |

### Typography

| Element | Font | Size | Color |
|---------|------|------|-------|
| Bank name | Georgia | 28pt | Navy #1B365D |
| Section headers | Arial Bold | 10.5pt | White on Navy |
| Body text | Arial | 10pt | Dark #333333 |
| Captions | Arial Italic | 7.5pt | Light #777777 |

### Colors

```json
{
  "navy": "#1B365D",
  "amber": "#D4A017", 
  "green": "#2E7D32",
  "red": "#C62828",
  "darkText": "#333333",
  "mediumText": "#555555",
  "lightText": "#777777",
  "lightGray": "#F5F5F5",
  "amberTint": "#FFF8E1",
  "greenTint": "#E8F5E9",
  "redTint": "#FFEBEE",
  "blueTint": "#E3F2FD"
}
```

### Spacing

- Section gaps: 90 DXA
- Paragraph spacing: 40-50 DXA
- Callout padding: 50 DXA
- Left accent borders: 16px

## Quality Gates

Before marking a bank "complete", verify:

### Automated Checks
- [ ] Document is exactly 2 pages
- [ ] All required sections present
- [ ] No placeholder text remaining ([Name], [date], etc. are intentional)
- [ ] Classification badge matches data
- [ ] Subject bank highlighted in competitive position table

### Visual Checks (spot-check 1 in 5)
- [ ] No text overflow/truncation
- [ ] Tables render correctly
- [ ] Colors display properly
- [ ] PDF matches docx

## Troubleshooting

### "Document exceeds 2 pages"
- Check for overly long evidence items or objection responses
- Reduce positioning.bullets text length
- Ensure landmines has max 6 items

### "Missing required field"
- Cross-reference research markdown against template
- Check for typos in section headers
- Verify table formatting (pipes must align)

### "Invalid classification"
- Must be exactly: ARCHITECT, PRAGMATIST, or OBSERVER
- Case-sensitive

### "Generation fails silently"
- Check Node.js is available: `node --version`
- Verify docx package installed: `npm list docx`
- Check file permissions on output directory

## Usage Examples

### Generate single bank
```
User: Generate the fact sheet for JPMorgan
Claude: [parses research/jpmorgan.md → validates → generates → presents files]
```

### Generate all banks
```
User: Generate all 31 fact sheets from the research folder
Claude: [loops through all .md files, processes sequentially, reports progress]
```

### Regenerate failed banks
```
User: Regenerate the failed banks from the last batch
Claude: [reads error log, retries failed banks only]
```

## Version History

- v6.0 (Dec 2025): Initial production template
  - KEY IMPLICATION moved to top of Position Summary
  - Evidence Snapshot sub-headers removed
  - Don't Say section with bullet formatting
  - Email Template with navy border accent
  - Simplified engagement angle tags
  - 10% increased section spacing
