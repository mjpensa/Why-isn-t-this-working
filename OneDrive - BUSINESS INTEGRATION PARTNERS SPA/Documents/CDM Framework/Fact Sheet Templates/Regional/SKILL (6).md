# CDM/DRR Regional Fact Sheet Generator

## Purpose
Generates executive-level, single-page regional analysis fact sheets for CDM/DRR sales enablement. Transforms regional bank data into professional Word documents with actionable insights.

## When to Use
- User requests a regional fact sheet, regional analysis, or territory summary
- User provides regional bank data in JSON format
- User asks about regional CDM/DRR positioning or sales strategy
- User wants to aggregate individual bank data into regional view

## Quick Start

### Generate a Regional Fact Sheet

```bash
node regional_template.js [input.json] [output_directory]
```

**Example:**
```bash
node regional_template.js examples/eu_gsib_enhanced.json ./outputs/
```

**Output:** `European_G-SIBs_Regional_Analysis.docx`

## Required Data Structure

The input JSON must contain these sections:

### meta (required)
```json
{
  "regionId": "EU_GSIB",
  "name": "European G-SIBs",
  "displayName": "European G-SIBs",
  "bankCount": 3,
  "generatedAt": "2025-12-22T00:00:00.000Z"
}
```

### summary (required)
```json
{
  "totalNotional": "~$85 trillion",
  "dominantArchetype": "PRAGMATIST",
  "archetypeDistribution": { "ARCHITECT": 1, "PRAGMATIST": 2, "OBSERVER": 0 },
  "keyInsight": "HK/Canada deadline is NOW: UBS validates approach for DB...",
  "readinessScore": { "engaged": 1, "total": 3, "display": "1/3" }
}
```

### deadlines (required)
```json
[
  { 
    "name": "HK/Canada", 
    "date": "Dec 2025", 
    "status": "Active",
    "isActive": true,
    "countdown": "NOW",
    "penaltyExposure": "$25M+ annual penalty risk"
  }
]
```

### maturitySpectrum (required)
```json
{
  "ARCHITECT": [{ "shortName": "UBS", "notional": "$28T", "drrIndicator": "○" }],
  "PRAGMATIST": [{ "shortName": "DB", "notional": "$42T", "drrIndicator": "?" }],
  "OBSERVER": []
}
```

### bankQuickReference (required)
```json
[
  { 
    "shortName": "UBS",
    "notional": "$28T",
    "archetype": "ARCHITECT", 
    "drrStatus": "Tested",
    "urgency": "LOW",
    "urgencyRationale": "Expanding CDM use cases",
    "entryPoint": "Co-marketing partner",
    "lastTouch": "Dec 2025",
    "dealStage": "Partnership"
  }
]
```

### patterns (recommended)
```json
{
  "commonObjections": [{ 
    "text": "We're building internally",
    "counter": "Reference Barclays TCO study: 40% cost reduction"
  }],
  "regionalSensitivity": {
    "phrase": "You're behind US banks",
    "severity": "HIGH",
    "whyItFails": "Triggers 'not invented here' response",
    "sayInstead": "European banks navigated unique EMIR complexity..."
  },
  "competitorActivity": [{ "competitor": "Bloomberg", "bank": "DB", "threat": "HIGH" }],
  "budgetCycle": "EU banks: 2026 budgets locked, Q1 execution window"
}
```

### recommendedSequence (recommended)
```json
[
  { 
    "shortName": "UBS",
    "timing": "Now",
    "rationale": "Finalize case study before year-end",
    "successMetric": "Case study by Jan 2026",
    "dependency": null
  }
]
```

### priorityActions (recommended)
```json
[
  { 
    "bank": "UBS",
    "action": "Schedule co-marketing partnership call",
    "timeframe": "Week 1",
    "owner": "Partnership Manager"
  }
]
```

### bottomLineStructured (recommended)
```json
{
  "summary": "European G-SIBs: $85T opportunity. UBS → DB Q1 2026 → SocGen Q2.",
  "timeline": "6-month conversion window (Q1-Q2 2026)",
  "risk": "Bloomberg active with DB",
  "resourceAsk": "Partnership team (UBS), Solutions architect (DB)",
  "nextReview": "Jan 6, 2026"
}
```

## Generated Sections

1. **Header**: Region name, bank count, notional, engagement score, confidence dots
2. **KEY INSIGHT**: Actionable summary with specific banks, dollar values, deadlines
3. **Maturity Spectrum**: Visual ARCHITECT → PRAGMATIST → OBSERVER with movement indicators
4. **Bank Quick Reference**: 5-column table with posture, DRR, urgency badge, entry point
5. **Key Deadlines**: Active/upcoming/done with countdown, penalty exposure
6. **Regional Patterns**: Objection + counter, competitor alerts, budget timing
7. **Recommended Sequence**: Numbered banks with timing, dependencies, success metrics
8. **30-Day Priority Actions**: Week-by-week with owners
9. **Regional Sensitivity**: "Avoid" phrase with severity, reasoning, alternative
10. **Bottom Line**: Summary with timeline, risk, resources, next review date

## Dependencies

```bash
npm install docx
```

## Output Format
- **Orientation**: Portrait
- **Length**: 1 page
- **Fonts**: Work Sans
- **Colors**: Navy (#0C2340) headers, semantic urgency badges

## See Also
- `examples/eu_gsib_enhanced.json` — Complete example with all fields
- `CLAUDE_CODE_SETUP.md` — Full project setup instructions
