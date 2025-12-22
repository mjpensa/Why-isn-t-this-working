/**
 * CDM/DRR Regional Synthesis Template Generator (Enhanced Portrait)
 * 
 * Generates portrait one-pager regional analysis fact sheets
 * with P1-P7 enhancements:
 * - P1: Key Insight callout (amber box)
 * - P2: Key Deadlines section
 * - P3: Urgency badges in table
 * - P4: Readiness score in header
 * - P5: 30-Day Priority Actions
 * - P6: DRR indicators in spectrum
 * - P7: Confidence metrics
 * 
 * Usage: node regional_template.js <regional_data.json> [output_dir]
 *        node regional_template.js --batch <regional_dir> [output_dir]
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, PageOrientation,
  VerticalAlign, TableLayoutType
} = require('docx');

// ============================================================================
// DESIGN CONSTANTS
// ============================================================================

const COLORS = {
  navy: '1B365D',
  green: '2E7D32',
  amber: 'F59E0B',
  red: 'DC2626',
  darkText: '333333',
  mediumText: '555555',
  lightText: '777777',
  lightGray: 'F5F5F5',
  white: 'FFFFFF',
  architectGreen: '10B981',
  pragmatistAmber: 'F59E0B',
  observerGray: '6B7280',
  greenTint: 'ECFDF5',
  amberTint: 'FFFBEB',
  grayTint: 'F9FAFB',
  redTint: 'FEE2E2',
  blueTint: 'EFF6FF'
};

const ARCHETYPE_COLORS = {
  ARCHITECT: { bg: COLORS.greenTint, text: COLORS.architectGreen },
  PRAGMATIST: { bg: COLORS.amberTint, text: COLORS.pragmatistAmber },
  OBSERVER: { bg: COLORS.grayTint, text: COLORS.observerGray }
};

const URGENCY_COLORS = {
  HIGH: { bg: COLORS.redTint, text: COLORS.red },
  MED: { bg: COLORS.amberTint, text: COLORS.amber },
  LOW: { bg: COLORS.greenTint, text: COLORS.green }
};

// Border definitions
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' };
const navyBorder = { style: BorderStyle.SINGLE, size: 12, font: 'Work Sans', color: COLORS.navy };
const amberBorder = { style: BorderStyle.SINGLE, size: 8, color: COLORS.amber };
const amberLeftBorder = { style: BorderStyle.SINGLE, size: 24, color: COLORS.amber };
const navyLeftBorder = { style: BorderStyle.SINGLE, size: 24, color: COLORS.navy };

// ============================================================================
// P4: HEADER WITH READINESS SCORE
// ============================================================================

function buildHeader(data) {
  const readiness = data.summary.readinessScore || { display: '—', percentage: 0 };
  const confidence = data.summary.avgConfidence || { display: '●●●○○' };
  
  return new Table({
    width: { size: 10700, type: WidthType.DXA },
    columnWidths: [7000, 3700],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            width: { size: 7000, type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 25 },
                children: [
                  new TextRun({ text: data.meta.displayName, bold: true, size: 34, font: 'Georgia', color: COLORS.navy })
                ]
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: `${data.meta.bankCount} Banks`, size: 17, font: 'Work Sans', color: COLORS.mediumText }),
                  new TextRun({ text: '  |  ', size: 17, font: 'Work Sans', color: COLORS.lightText }),
                  new TextRun({ text: data.summary.totalNotional, size: 17, font: 'Work Sans', color: COLORS.mediumText }),
                  new TextRun({ text: '  |  ', size: 17, font: 'Work Sans', color: COLORS.lightText }),
                  new TextRun({ text: 'Engaged: ', size: 17, font: 'Work Sans', color: COLORS.mediumText }),
                  new TextRun({ 
                    text: readiness.display, 
                    bold: true, 
                    size: 17, font: 'Work Sans', 
                    color: readiness.percentage >= 50 ? COLORS.green : COLORS.amber 
                  }),
                  new TextRun({ text: '  |  ', size: 17, font: 'Work Sans', color: COLORS.lightText }),
                  new TextRun({ text: confidence.display, size: 15, font: 'Work Sans', color: COLORS.mediumText })
                ]
              })
            ]
          }),
          new TableCell({
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            width: { size: 3700, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 15 },
                children: [
                  new TextRun({ text: 'CDM/DRR Regional Analysis', size: 15, font: 'Work Sans', color: COLORS.lightText, italics: true })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), size: 15, font: 'Work Sans', color: COLORS.lightText })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

// ============================================================================
// P1: KEY INSIGHT CALLOUT
// ============================================================================

function buildKeyInsight(data) {
  const insight = data.summary.keyInsight;
  if (!insight) return new Paragraph({ spacing: { before: 0, after: 0 }, children: [] });
  
  return new Table({
    width: { size: 10700, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { 
              top: amberBorder,
              bottom: amberBorder,
              left: amberLeftBorder,
              right: amberBorder
            },
            shading: { fill: COLORS.amberTint },
            children: [
              new Paragraph({
                spacing: { before: 50, after: 20 },
                children: [
                  new TextRun({ text: 'KEY INSIGHT:', bold: true, size: 20, font: 'Work Sans', color: COLORS.amber })
                ]
              }),
              new Paragraph({
                spacing: { before: 0, after: 50 },
                children: [
                  new TextRun({ text: insight, size: 22, font: 'Work Sans', color: COLORS.darkText })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

// ============================================================================
// SECTION HEADER
// ============================================================================

function sectionHeader(text, width = 100) {
  return new Table({
    width: { size: 10700, type: WidthType.DXA },
    
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 10700, type: WidthType.DXA },
            shading: { fill: '0C2340' },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({ text: text, bold: true, size: 20, font: 'Work Sans', color: 'FFFFFF' })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

// ============================================================================
// P6: MATURITY SPECTRUM WITH DRR INDICATORS
// ============================================================================

function buildMaturitySpectrum(data) {
  const spectrum = data.maturitySpectrum;
  const movements = data.maturityMovements || {}; // Track bank movements
  
  const spectrumRows = [];
  
  // Header row with tier labels and sub-labels
  spectrumRows.push(
    new TableRow({
      children: [
        new TableCell({
          borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
          shading: { fill: COLORS.white },
          width: { size: 3560, type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 25, after: 5 },
              children: [
                new TextRun({ text: '🟢 ARCHITECT', bold: true, size: 20, font: 'Work Sans', color: COLORS.architectGreen })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 25 },
              children: [
                new TextRun({ text: 'Reference Customers', size: 14, font: 'Work Sans', color: COLORS.lightText, italics: true })
              ]
            })
          ]
        }),
        new TableCell({
          borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
          shading: { fill: COLORS.white },
          width: { size: 3560, type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 25, after: 5 },
              children: [
                new TextRun({ text: '🟡 PRAGMATIST', bold: true, size: 20, font: 'Work Sans', color: COLORS.pragmatistAmber })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 25 },
              children: [
                new TextRun({ text: 'Active Pipeline', size: 14, font: 'Work Sans', color: COLORS.lightText, italics: true })
              ]
            })
          ]
        }),
        new TableCell({
          borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
          shading: { fill: COLORS.white },
          width: { size: 3560, type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 25, after: 5 },
              children: [
                new TextRun({ text: '🔴 OBSERVER', bold: true, size: 20, font: 'Work Sans', color: COLORS.observerGray })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 25 },
              children: [
                new TextRun({ text: 'Future Pipeline', size: 14, font: 'Work Sans', color: COLORS.lightText, italics: true })
              ]
            })
          ]
        })
      ]
    })
  );
  
  // Helper to build bank display with notional and movement indicator
  const buildBankRuns = (banks, category) => {
    if (banks.length === 0) return [new TextRun({ text: '—', size: 20, font: 'Work Sans', color: COLORS.lightText })];
    
    const runs = [];
    banks.forEach((bank, idx) => {
      if (idx > 0) runs.push(new TextRun({ text: '  ', size: 20 }));
      
      // Check for movement indicator
      const moved = movements[bank.shortName];
      const movementIcon = moved === 'up' ? ' ↑' : moved === 'down' ? ' ↓' : '';
      const movementColor = moved === 'up' ? COLORS.green : moved === 'down' ? COLORS.red : COLORS.darkText;
      
      runs.push(new TextRun({ 
        text: bank.shortName, 
        bold: true, 
        size: 20,
        font: 'Work Sans',
        color: COLORS.darkText 
      }));
      
      if (movementIcon) {
        runs.push(new TextRun({ 
          text: movementIcon, 
          bold: true, 
          size: 18,
          font: 'Work Sans',
          color: movementColor 
        }));
      }
    });
    return runs;
  };
  
  // Helper to build notional display
  const buildNotionalRuns = (banks) => {
    if (banks.length === 0 || !banks.some(b => b.notional)) return [];
    
    return [new TextRun({ 
      text: banks.map(b => b.notional || '').filter(n => n).join('  '), 
      size: 14,
      font: 'Work Sans',
      color: COLORS.lightText 
    })];
  };
  
  // Bank names row with notional and DRR indicators
  spectrumRows.push(
    new TableRow({
      children: [
        // ARCHITECT column
        new TableCell({
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          shading: { fill: COLORS.greenTint },
          width: { size: 3560, type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 30, after: 5 },
              children: buildBankRuns(spectrum.ARCHITECT, 'ARCHITECT')
            }),
            // Notional values
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 8 },
              children: buildNotionalRuns(spectrum.ARCHITECT)
            }),
            // DRR indicators
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 25 },
              children: spectrum.ARCHITECT.length > 0 
                ? [new TextRun({ 
                    text: spectrum.ARCHITECT.map(b => b.drrIndicator || '○').join('  '), 
                    size: 16,
                    font: 'Work Sans',
                    color: COLORS.green 
                  })]
                : []
            })
          ]
        }),
        // PRAGMATIST column
        new TableCell({
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          shading: { fill: COLORS.amberTint },
          width: { size: 3560, type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 30, after: 5 },
              children: buildBankRuns(spectrum.PRAGMATIST, 'PRAGMATIST')
            }),
            // Notional values
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 8 },
              children: buildNotionalRuns(spectrum.PRAGMATIST)
            }),
            // DRR indicators
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 25 },
              children: spectrum.PRAGMATIST.length > 0 
                ? [new TextRun({ 
                    text: spectrum.PRAGMATIST.map(b => b.drrIndicator || '?').join('  '), 
                    size: 16,
                    font: 'Work Sans',
                    color: COLORS.amber 
                  })]
                : []
            })
          ]
        }),
        // OBSERVER column
        new TableCell({
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          shading: { fill: COLORS.grayTint },
          width: { size: 3560, type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 30, after: 5 },
              children: buildBankRuns(spectrum.OBSERVER, 'OBSERVER')
            }),
            // Notional values
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 8 },
              children: buildNotionalRuns(spectrum.OBSERVER)
            }),
            // DRR indicators or "No evidence"
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 25 },
              children: spectrum.OBSERVER.length > 0 
                ? [new TextRun({ 
                    text: spectrum.OBSERVER.map(b => b.drrIndicator || '—').join('  '), 
                    size: 16,
                    font: 'Work Sans',
                    color: COLORS.observerGray 
                  })]
                : [new TextRun({ text: 'No evidence', size: 16, font: 'Work Sans', color: COLORS.lightText, italics: true })]
            })
          ]
        })
      ]
    })
  );
  
  // Arrow row with legend
  spectrumRows.push(
    new TableRow({
      children: [
        new TableCell({
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          columnSpan: 3,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 15, after: 10 },
              children: [
                new TextRun({ text: 'Leading', size: 16, font: 'Work Sans', color: COLORS.architectGreen }),
                new TextRun({ text: '  ◄───────────────────────────────────────────────►  ', size: 16, font: 'Work Sans', color: COLORS.lightText }),
                new TextRun({ text: 'Lagging', size: 16, font: 'Work Sans', color: COLORS.observerGray }),
                new TextRun({ text: '     ', size: 16 }),
                new TextRun({ text: '● Live  ○ Tested  ? Unknown  — None', size: 16, font: 'Work Sans', color: COLORS.lightText })
              ]
            })
          ]
        })
      ]
    })
  );
  
  return new Table({
    width: { size: 10700, type: WidthType.DXA },
    
    columnWidths: [3560, 3560, 3560],
    rows: spectrumRows
  });
}

// ============================================================================
// P3: BANK QUICK REFERENCE WITH URGENCY BADGES
// ============================================================================

function buildBankQuickReference(data) {
  const banks = data.bankQuickReference || [];
  
  const rows = [
    // Title bar row (integrated)
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 5,
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          shading: { fill: '0C2340' },
          width: { size: 10700, type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({ text: 'Bank-by-Bank Quick Reference', bold: true, size: 20, font: 'Work Sans', color: 'FFFFFF' })
              ]
            })
          ]
        })
      ]
    }),
    // Header row - 5 columns
    new TableRow({
      children: ['Bank', 'Posture', 'DRR', 'Urgency', 'Entry Point'].map((header, idx) =>
        new TableCell({
          borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
          shading: { fill: 'EAEAEA' },
          width: { size: [1700, 2100, 1300, 1300, 4300][idx], type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 25, after: 25 },
              children: [new TextRun({ text: header, bold: true, size: 18, font: 'Work Sans', color: COLORS.darkText })]
            })
          ]
        })
      )
    }),
    // Data rows
    ...banks.map(bank => {
      const urgencyStyle = URGENCY_COLORS[bank.urgency] || URGENCY_COLORS['MED'];
      const archetypeStyle = ARCHETYPE_COLORS[bank.archetype] || ARCHETYPE_COLORS['OBSERVER'];
      const notionalText = bank.notional ? `\n${bank.notional}` : '';
      
      return new TableRow({
        children: [
          // Bank name (row label) with notional
          new TableCell({
            borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
            shading: { fill: 'EAEAEA' },
            width: { size: 1700, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 15, after: 5 },
                children: [new TextRun({ text: bank.shortName, bold: true, size: 18, font: 'Work Sans', color: COLORS.darkText })]
              }),
              ...(bank.notional ? [new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 15 },
                children: [new TextRun({ text: bank.notional, size: 14, font: 'Work Sans', color: COLORS.lightText })]
              })] : [])
            ]
          }),
          // Posture
          new TableCell({
            borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
            shading: { fill: archetypeStyle.bg },
            width: { size: 2100, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 22, after: 22 },
                children: [new TextRun({ 
                  text: bank.archetype, 
                  bold: true, 
                  size: 16, 
                  font: 'Work Sans',
                  color: archetypeStyle.text 
                })]
              })
            ]
          }),
          // DRR Status
          new TableCell({
            borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
            shading: { fill: 'F5F5F5' },
            width: { size: 1300, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 22, after: 22 },
                children: [new TextRun({ 
                  text: bank.drrStatus, 
                  size: 16, 
                  font: 'Work Sans',
                  color: bank.drrStatus === 'Yes' ? COLORS.green : bank.drrStatus === 'Tested' ? COLORS.amber : COLORS.mediumText 
                })]
              })
            ]
          }),
          // P3: Urgency badge with rationale
          new TableCell({
            borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
            shading: { fill: urgencyStyle.bg },
            width: { size: 1300, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 15, after: bank.urgencyRationale ? 2 : 15 },
                children: [new TextRun({ 
                  text: bank.urgency, 
                  bold: true, 
                  size: 16, 
                  font: 'Work Sans',
                  color: urgencyStyle.text 
                })]
              }),
              ...(bank.urgencyRationale ? [new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 15 },
                children: [new TextRun({ 
                  text: bank.urgencyRationale.length > 18 ? bank.urgencyRationale.substring(0, 15) + '...' : bank.urgencyRationale, 
                  size: 12, 
                  font: 'Work Sans',
                  color: COLORS.mediumText 
                })]
              })] : [])
            ]
          }),
          // Entry Point with Last Touch and Deal Stage
          new TableCell({
            borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
            shading: { fill: 'F5F5F5' },
            width: { size: 4300, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 15, after: bank.lastTouch || bank.dealStage ? 3 : 15 },
                children: [new TextRun({ text: bank.entryPoint, size: 16, font: 'Work Sans', color: COLORS.navy, bold: true })]
              }),
              ...((bank.lastTouch || bank.dealStage) ? [new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 15 },
                children: [
                  ...(bank.dealStage ? [new TextRun({ text: bank.dealStage, size: 14, font: 'Work Sans', color: COLORS.mediumText })] : []),
                  ...((bank.dealStage && bank.lastTouch) ? [new TextRun({ text: ' · ', size: 14, font: 'Work Sans', color: COLORS.lightText })] : []),
                  ...(bank.lastTouch ? [new TextRun({ text: bank.lastTouch, size: 14, font: 'Work Sans', color: COLORS.lightText })] : [])
                ]
              })] : [])
            ]
          })
        ]
      });
    })
  ];
  
  return new Table({
    width: { size: 10700, type: WidthType.DXA },
    
    columnWidths: [1700, 2100, 1300, 1300, 4300],
    rows: rows
  });
}

// ============================================================================
// P7: CONFIDENCE WARNING
// ============================================================================

function buildConfidenceWarning(data) {
  const lowConfidence = data.summary.avgConfidence?.lowConfidenceBanks || [];
  if (lowConfidence.length === 0) return new Paragraph({ spacing: { before: 0, after: 0 }, children: [] });
  
  return new Paragraph({
    spacing: { before: 25, after: 0 },
    children: [
      new TextRun({ text: '⚠️ Low confidence: ', size: 12, font: 'Work Sans', color: COLORS.amber }),
      new TextRun({ text: lowConfidence.join(', '), size: 12, font: 'Work Sans', color: COLORS.mediumText, italics: true }),
      new TextRun({ text: ' — requires additional research', size: 12, font: 'Work Sans', color: COLORS.mediumText, italics: true })
    ]
  });
}

// ============================================================================
// P2: KEY DEADLINES
// ============================================================================

function buildDeadlines(data) {
  const deadlines = data.deadlines || [];
  
  const contentParagraphs = deadlines.length === 0 
    ? [new Paragraph({
        spacing: { before: 0, after: 120 },
        indent: { left: 200 },
        children: [new TextRun({ text: 'No structured deadlines available', size: 18, font: 'Work Sans', color: '000000', italics: true })]
      })]
    : deadlines.slice(0, 4).map(d => 
        new Paragraph({
          spacing: { before: 0, after: 60 },
          indent: { left: 360, hanging: 200 },
          children: [
            new TextRun({ 
              text: d.status === 'Done' ? '✓  ' : d.isActive ? '⏳  ' : '•  ', 
              size: 18, 
              font: 'Work Sans',
              color: d.status === 'Done' ? COLORS.green : d.isActive ? COLORS.amber : '000000'
            }),
            new TextRun({ 
              text: `${d.name} (${d.date})`, 
              bold: d.isActive, 
              size: 18, 
              font: 'Work Sans',
              color: '000000'
            }),
            ...(d.isActive ? [new TextRun({ text: ' — ACTIVE', bold: true, size: 18, font: 'Work Sans', color: COLORS.red })] : [])
          ]
        })
      );
  
  return new Table({
    width: { size: 5200, type: WidthType.DXA },
    
    rows: [
      // Header row
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5200, type: WidthType.DXA },
            shading: { fill: '0C2340' },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({ text: 'Key Deadlines', bold: true, size: 20, font: 'Work Sans', color: 'FFFFFF' })
                ]
              })
            ]
          })
        ]
      }),
      // Content row
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F5F5F5' },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [
              new Paragraph({ spacing: { before: 10, after: 0 }, children: [] }),
              ...contentParagraphs,
              new Paragraph({ spacing: { before: 10, after: 0 }, children: [] })
            ]
          })
        ]
      })
    ]
  });
}

// Content-only version for aligned layout
function buildDeadlinesContent(data) {
  const deadlines = data.deadlines || [];
  
  if (deadlines.length === 0) {
    return [
      new Paragraph({ spacing: { before: 10, after: 0 }, children: [] }),
      new Paragraph({
        spacing: { before: 10, after: 120 },
        indent: { left: 200 },
        children: [new TextRun({ text: 'No structured deadlines available', size: 18, font: 'Work Sans', color: '000000', italics: true })]
      }),
      new Paragraph({ spacing: { before: 10, after: 10 }, children: [] })
    ];
  }
  
  const contentParagraphs = [];
  
  deadlines.slice(0, 4).forEach(d => {
    const affectedText = d.affectedBanks?.length > 0 ? ` — ${d.affectedBanks.join(', ')}` : '';
    const isUpcoming = d.status === 'Upcoming';
    const hasDetails = d.isActive && (d.countdown || d.impact || d.penaltyExposure);
    
    // Determine icon and color based on status
    let icon, iconColor;
    if (d.status === 'Done') {
      icon = '✓  ';
      iconColor = COLORS.green;
    } else if (d.isActive) {
      icon = '⏳  ';
      iconColor = COLORS.amber;
    } else if (isUpcoming) {
      icon = '◐  ';
      iconColor = COLORS.navy;
    } else {
      icon = '•  ';
      iconColor = '000000';
    }
    
    // Main deadline line
    contentParagraphs.push(
      new Paragraph({
        spacing: { before: 10, after: hasDetails ? 5 : 60 },
        indent: { left: 360, hanging: 200 },
        children: [
          new TextRun({ 
            text: icon, 
            size: 18, 
            font: 'Work Sans',
            color: iconColor
          }),
          new TextRun({ 
            text: `${d.name} (${d.date})`, 
            bold: d.isActive || isUpcoming, 
            size: 18, 
            font: 'Work Sans',
            color: '000000'
          }),
          ...(d.isActive ? [
            new TextRun({ text: ' — ACTIVE', bold: true, size: 18, font: 'Work Sans', color: COLORS.red }),
            ...(affectedText ? [new TextRun({ text: affectedText, size: 18, font: 'Work Sans', color: COLORS.mediumText })] : [])
          ] : []),
          ...(isUpcoming ? [
            new TextRun({ text: ' — ', size: 18, font: 'Work Sans', color: COLORS.mediumText }),
            new TextRun({ text: 'NEXT', bold: true, size: 16, font: 'Work Sans', color: COLORS.navy })
          ] : [])
        ]
      })
    );
    
    // P3: Add countdown, impact, and penalty exposure for active deadlines
    if (hasDetails) {
      const detailRuns = [];
      
      // Countdown
      if (d.countdown) {
        detailRuns.push(new TextRun({ text: `⏱ ${d.countdown}`, size: 14, font: 'Work Sans', color: COLORS.mediumText }));
      }
      
      // Penalty exposure (highlighted)
      if (d.penaltyExposure) {
        if (detailRuns.length > 0) detailRuns.push(new TextRun({ text: '  ·  ', size: 14, font: 'Work Sans', color: COLORS.lightText }));
        detailRuns.push(new TextRun({ text: `💰 ${d.penaltyExposure}`, size: 14, font: 'Work Sans', color: COLORS.red }));
      }
      
      // Impact
      if (d.impact) {
        if (detailRuns.length > 0) detailRuns.push(new TextRun({ text: '  ·  ', size: 14, font: 'Work Sans', color: COLORS.lightText }));
        detailRuns.push(new TextRun({ text: d.impact, size: 14, font: 'Work Sans', color: COLORS.mediumText }));
      }
      
      contentParagraphs.push(
        new Paragraph({
          spacing: { before: 0, after: 60 },
          indent: { left: 500 },
          children: [
            new TextRun({ text: '↳ ', size: 14, font: 'Work Sans', color: COLORS.lightText }),
            ...detailRuns
          ]
        })
      );
    }
  });
  
  return [
    new Paragraph({ spacing: { before: 10, after: 0 }, children: [] }),
    ...contentParagraphs,
    new Paragraph({ spacing: { before: 10, after: 10 }, children: [] })
  ];
}

// ============================================================================
// REGIONAL PATTERNS
// ============================================================================

function buildRegionalPatterns(data) {
  const patterns = [];
  const dist = data.summary.archetypeDistribution;
  patterns.push(`${dist.ARCHITECT} ARCHITECT, ${dist.PRAGMATIST} PRAGMATIST, ${dist.OBSERVER} OBSERVER`);
  
  if (data.patterns?.commonObjections?.length > 0) {
    const top = data.patterns.commonObjections[0];
    const truncated = top.text.length > 40 ? top.text.substring(0, 37) + '...' : top.text;
    patterns.push(`"${truncated}" (${top.count} banks)`);
  }
  
  if (data.summary.regulatoryContext) {
    patterns.push(data.summary.regulatoryContext);
  }
  
  const contentParagraphs = patterns.map(pattern =>
    new Paragraph({
      spacing: { before: 0, after: 60 },
      indent: { left: 360, hanging: 200 },
      children: [
        new TextRun({ text: '•  ', size: 18, font: 'Work Sans', color: '000000' }),
        new TextRun({ text: pattern, size: 18, font: 'Work Sans', color: '000000' })
      ]
    })
  );
  
  return new Table({
    width: { size: 5300, type: WidthType.DXA },
    
    rows: [
      // Header row
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5300, type: WidthType.DXA },
            shading: { fill: '0C2340' },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({ text: 'Regional Patterns', bold: true, size: 20, font: 'Work Sans', color: 'FFFFFF' })
                ]
              })
            ]
          })
        ]
      }),
      // Content row
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F5F5F5' },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [
              new Paragraph({ spacing: { before: 10, after: 0 }, children: [] }),
              ...contentParagraphs,
              new Paragraph({ spacing: { before: 10, after: 0 }, children: [] })
            ]
          })
        ]
      })
    ]
  });
}

// Content-only version for aligned layout
function buildRegionalPatternsContent(data) {
  const contentParagraphs = [];
  const dist = data.summary.archetypeDistribution;
  const priorDist = data.summary.priorArchetypeDistribution;
  
  // Archetype distribution with optional trend
  let distText = `${dist.ARCHITECT}A, ${dist.PRAGMATIST}P, ${dist.OBSERVER}O`;
  if (priorDist) {
    const arcChange = dist.ARCHITECT - priorDist.ARCHITECT;
    const trendIndicator = arcChange > 0 ? ' ↑' : arcChange < 0 ? ' ↓' : '';
    distText += trendIndicator ? ` (${arcChange > 0 ? '+' : ''}${arcChange}A from prior)` : '';
  }
  
  contentParagraphs.push(
    new Paragraph({
      spacing: { before: 10, after: 60 },
      indent: { left: 360, hanging: 200 },
      children: [
        new TextRun({ text: '•  ', size: 18, font: 'Work Sans', color: '000000' }),
        new TextRun({ text: distText, size: 18, font: 'Work Sans', color: '000000' })
      ]
    })
  );
  
  // Top objection with counter
  if (data.patterns?.commonObjections?.length > 0) {
    const top = data.patterns.commonObjections[0];
    const truncated = top.text.length > 40 ? top.text.substring(0, 37) + '...' : top.text;
    contentParagraphs.push(
      new Paragraph({
        spacing: { before: 10, after: 30 },
        indent: { left: 360, hanging: 200 },
        children: [
          new TextRun({ text: '•  ', size: 18, font: 'Work Sans', color: '000000' }),
          new TextRun({ text: `"${truncated}"`, size: 18, font: 'Work Sans', color: '000000', italics: true }),
          new TextRun({ text: ` (${top.count} banks)`, size: 18, font: 'Work Sans', color: COLORS.mediumText })
        ]
      })
    );
    // Add counter-strategy if available
    if (top.counter) {
      const counterTruncated = top.counter.length > 55 ? top.counter.substring(0, 52) + '...' : top.counter;
      contentParagraphs.push(
        new Paragraph({
          spacing: { before: 0, after: 60 },
          indent: { left: 500 },
          children: [
            new TextRun({ text: '→ ', size: 16, font: 'Work Sans', color: COLORS.green }),
            new TextRun({ text: counterTruncated, size: 16, font: 'Work Sans', color: COLORS.mediumText })
          ]
        })
      );
    }
  }
  
  // Competitor activity (P2 enhancement)
  if (data.patterns?.competitorActivity?.length > 0) {
    const topCompetitor = data.patterns.competitorActivity[0];
    const threatColor = topCompetitor.threat === 'HIGH' ? COLORS.red : topCompetitor.threat === 'MEDIUM' ? COLORS.amber : COLORS.mediumText;
    contentParagraphs.push(
      new Paragraph({
        spacing: { before: 10, after: 60 },
        indent: { left: 360, hanging: 200 },
        children: [
          new TextRun({ text: '•  ', size: 18, font: 'Work Sans', color: '000000' }),
          new TextRun({ text: '⚡ ', size: 18, font: 'Work Sans', color: threatColor }),
          new TextRun({ text: `${topCompetitor.competitor} active with ${topCompetitor.bank}`, size: 18, font: 'Work Sans', color: '000000' }),
          new TextRun({ text: ` (${topCompetitor.stage})`, size: 16, font: 'Work Sans', color: COLORS.mediumText })
        ]
      })
    );
  }
  
  // Budget cycle (P2 enhancement)
  if (data.patterns?.budgetCycle) {
    contentParagraphs.push(
      new Paragraph({
        spacing: { before: 10, after: 60 },
        indent: { left: 360, hanging: 200 },
        children: [
          new TextRun({ text: '•  ', size: 18, font: 'Work Sans', color: '000000' }),
          new TextRun({ text: '📅 ', size: 18, font: 'Work Sans', color: COLORS.navy }),
          new TextRun({ text: data.patterns.budgetCycle, size: 18, font: 'Work Sans', color: '000000' })
        ]
      })
    );
  }
  
  return [
    new Paragraph({ spacing: { before: 10, after: 0 }, children: [] }),
    ...contentParagraphs,
    new Paragraph({ spacing: { before: 10, after: 10 }, children: [] })
  ];
}

// ============================================================================
// RECOMMENDED SEQUENCE
// ============================================================================

function buildRecommendedSequence(data) {
  const sequence = data.recommendedSequence?.slice(0, 5) || [];
  
  const contentParagraphs = sequence.map((item, idx) =>
    new Paragraph({
      spacing: { before: 0, after: 60 },
      indent: { left: 400, hanging: 240 },
      children: [
        new TextRun({ text: `${idx + 1}. `, bold: true, size: 18, font: 'Work Sans', color: '000000' }),
        new TextRun({ text: item.shortName, bold: true, size: 18, font: 'Work Sans', color: '000000' }),
        new TextRun({ text: ` — ${item.rationale}`, size: 18, font: 'Work Sans', color: '000000' })
      ]
    })
  );
  
  return new Table({
    width: { size: 5200, type: WidthType.DXA },
    
    rows: [
      // Header row
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5200, type: WidthType.DXA },
            shading: { fill: '0C2340' },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({ text: 'Recommended Sequence', bold: true, size: 20, font: 'Work Sans', color: 'FFFFFF' })
                ]
              })
            ]
          })
        ]
      }),
      // Content row
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F5F5F5' },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [
              new Paragraph({ spacing: { before: 10, after: 0 }, children: [] }),
              ...contentParagraphs,
              new Paragraph({ spacing: { before: 10, after: 0 }, children: [] })
            ]
          })
        ]
      })
    ]
  });
}

// Content-only version for aligned layout
function buildRecommendedSequenceContent(data) {
  const sequence = data.recommendedSequence?.slice(0, 5) || [];
  
  const contentParagraphs = [];
  
  sequence.forEach((item, idx) => {
    const timingText = item.timing ? ` (${item.timing})` : '';
    const hasDependency = item.dependency && idx > 0;
    const hasSuccessMetric = item.successMetric;
    
    // Main sequence item
    contentParagraphs.push(
      new Paragraph({
        spacing: { before: 10, after: (hasDependency || hasSuccessMetric) ? 5 : 60 },
        indent: { left: 400, hanging: 240 },
        children: [
          new TextRun({ text: `${idx + 1}. `, bold: true, size: 18, font: 'Work Sans', color: '000000' }),
          new TextRun({ text: item.shortName, bold: true, size: 18, font: 'Work Sans', color: '000000' }),
          ...(timingText ? [new TextRun({ text: timingText, size: 18, font: 'Work Sans', color: COLORS.navy, bold: true })] : []),
          new TextRun({ text: ` — ${item.rationale}`, size: 18, font: 'Work Sans', color: '000000' })
        ]
      })
    );
    
    // Add dependency and/or success metric on sub-line
    if (hasDependency || hasSuccessMetric) {
      const subRuns = [];
      
      if (hasDependency) {
        subRuns.push(new TextRun({ text: '⤷ Needs: ', size: 14, font: 'Work Sans', color: COLORS.lightText }));
        subRuns.push(new TextRun({ text: item.dependency, size: 14, font: 'Work Sans', color: COLORS.mediumText }));
      }
      
      if (hasSuccessMetric) {
        if (hasDependency) subRuns.push(new TextRun({ text: '  ·  ', size: 14, font: 'Work Sans', color: COLORS.lightText }));
        subRuns.push(new TextRun({ text: '✓ ', size: 14, font: 'Work Sans', color: COLORS.green }));
        subRuns.push(new TextRun({ text: item.successMetric, size: 14, font: 'Work Sans', color: COLORS.mediumText }));
      }
      
      contentParagraphs.push(
        new Paragraph({
          spacing: { before: 0, after: 60 },
          indent: { left: 540 },
          children: subRuns
        })
      );
    }
  });
  
  return [
    new Paragraph({ spacing: { before: 10, after: 0 }, children: [] }),
    ...contentParagraphs,
    new Paragraph({ spacing: { before: 10, after: 10 }, children: [] })
  ];
}

// ============================================================================
// P5: 30-DAY PRIORITY ACTIONS
// ============================================================================

function buildPriorityActions(data) {
  const actions = data.priorityActions || [];
  
  const contentParagraphs = actions.length === 0 
    ? [new Paragraph({
        spacing: { before: 0, after: 120 },
        indent: { left: 200 },
        children: [new TextRun({ text: 'Generate from bank research', size: 18, font: 'Work Sans', color: '000000', italics: true })]
      })]
    : actions.map(action =>
        new Paragraph({
          spacing: { before: 0, after: 60 },
          indent: { left: 360, hanging: 200 },
          children: [
            new TextRun({ text: '•  ', size: 18, font: 'Work Sans', color: '000000' }),
            new TextRun({ text: action.bank, bold: true, size: 18, font: 'Work Sans', color: '000000' }),
            new TextRun({ text: ` — ${action.action}`, size: 18, font: 'Work Sans', color: '000000' }),
            new TextRun({ text: `  (${action.timeframe})`, size: 18, font: 'Work Sans', color: '000000', italics: true })
          ]
        })
      );
  
  return new Table({
    width: { size: 5300, type: WidthType.DXA },
    
    rows: [
      // Header row
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5300, type: WidthType.DXA },
            shading: { fill: '0C2340' },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({ text: '30-Day Priority Actions', bold: true, size: 20, font: 'Work Sans', color: 'FFFFFF' })
                ]
              })
            ]
          })
        ]
      }),
      // Content row
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F5F5F5' },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [
              new Paragraph({ spacing: { before: 10, after: 0 }, children: [] }),
              ...contentParagraphs,
              new Paragraph({ spacing: { before: 10, after: 0 }, children: [] })
            ]
          })
        ]
      })
    ]
  });
}

// Content-only version for aligned layout
function buildPriorityActionsContent(data) {
  const actions = data.priorityActions || [];
  
  const contentParagraphs = actions.length === 0 
    ? [new Paragraph({
        spacing: { before: 10, after: 120 },
        indent: { left: 200 },
        children: [new TextRun({ text: 'Generate from bank research', size: 18, font: 'Work Sans', color: '000000', italics: true })]
      })]
    : actions.map(action => {
        const ownerText = action.owner ? ` [${action.owner}]` : '';
        return new Paragraph({
          spacing: { before: 10, after: 60 },
          indent: { left: 360, hanging: 200 },
          children: [
            new TextRun({ text: '•  ', size: 18, font: 'Work Sans', color: '000000' }),
            new TextRun({ text: action.bank, bold: true, size: 18, font: 'Work Sans', color: '000000' }),
            new TextRun({ text: ` — ${action.action}`, size: 18, font: 'Work Sans', color: '000000' }),
            new TextRun({ text: `  (${action.timeframe})`, size: 18, font: 'Work Sans', color: COLORS.mediumText, italics: true }),
            ...(ownerText ? [new TextRun({ text: ownerText, size: 16, font: 'Work Sans', color: COLORS.lightText })] : [])
          ]
        });
      });
  
  return [
    new Paragraph({ spacing: { before: 10, after: 0 }, children: [] }),
    ...contentParagraphs,
    new Paragraph({ spacing: { before: 10, after: 10 }, children: [] })
  ];
}

// ============================================================================
// REGIONAL SENSITIVITY
// ============================================================================

function buildSensitivity(data) {
  const sensitivity = data.patterns?.regionalSensitivity;
  
  if (!sensitivity) {
    return new Paragraph({ spacing: { before: 0, after: 0 }, children: [] });
  }
  
  // Determine severity indicator
  const severity = sensitivity.severity || 'HIGH';
  const severityIcon = severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : '🟡';
  const severityColor = severity === 'CRITICAL' ? COLORS.red : severity === 'HIGH' ? COLORS.amber : COLORS.mediumText;
  
  const children = [
    new Paragraph({
      spacing: { before: 35, after: (sensitivity.sayInstead || sensitivity.whyItFails) ? 15 : 35 },
      children: [
        new TextRun({ text: `${severityIcon} Regional Sensitivity — Avoid: `, bold: true, size: 19, font: 'Work Sans', color: severityColor }),
        new TextRun({ text: `"${sensitivity.phrase}"`, size: 19, font: 'Work Sans', color: COLORS.darkText, italics: true })
      ]
    })
  ];
  
  // Add reason why it fails (compact)
  if (sensitivity.whyItFails) {
    children.push(
      new Paragraph({
        spacing: { before: 0, after: sensitivity.sayInstead ? 15 : 35 },
        indent: { left: 200 },
        children: [
          new TextRun({ text: '↳ Why: ', size: 15, font: 'Work Sans', color: COLORS.lightText }),
          new TextRun({ text: sensitivity.whyItFails, size: 15, font: 'Work Sans', color: COLORS.mediumText, italics: true })
        ]
      })
    );
  }
  
  if (sensitivity.sayInstead) {
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 35 },
        children: [
          new TextRun({ text: '✓ Instead: ', bold: true, size: 17, font: 'Work Sans', color: COLORS.green }),
          new TextRun({ text: `"${sensitivity.sayInstead}"`, size: 17, font: 'Work Sans', color: COLORS.darkText, italics: true })
        ]
      })
    );
  }
  
  return new Table({
    width: { size: 10700, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: thinBorder, bottom: thinBorder, left: navyLeftBorder, right: thinBorder },
            shading: { fill: 'FEF3C7' },
            children: children
          })
        ]
      })
    ]
  });
}

// ============================================================================
// CROSS-SELLING + BOTTOM LINE
// ============================================================================

function buildCrossSelling(data) {
  const opportunities = data.crossSellingOpportunities?.slice(0, 3) || [];
  
  const contentParagraphs = opportunities.length === 0 
    ? [new Paragraph({
        spacing: { before: 0, after: 120 },
        indent: { left: 200 },
        children: [new TextRun({ text: 'Patterns emerging', size: 18, font: 'Work Sans', color: '000000', italics: true })]
      })]
    : opportunities.map(opp =>
        new Paragraph({
          spacing: { before: 0, after: 60 },
          indent: { left: 360, hanging: 200 },
          children: [
            new TextRun({ text: '•  ', size: 18, font: 'Work Sans', color: '000000' }),
            new TextRun({ text: `${opp.type}: `, bold: true, size: 18, font: 'Work Sans', color: '000000' }),
            new TextRun({ text: opp.banks.join(', '), size: 18, font: 'Work Sans', color: '000000' })
          ]
        })
      );
  
  return new Table({
    width: { size: 10700, type: WidthType.DXA },
    
    rows: [
      // Header row
      new TableRow({
        children: [
          new TableCell({
            width: { size: 10700, type: WidthType.DXA },
            shading: { fill: '0C2340' },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({ text: 'Cross-Selling Opportunities', bold: true, size: 20, font: 'Work Sans', color: 'FFFFFF' })
                ]
              })
            ]
          })
        ]
      }),
      // Content row
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F5F5F5' },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [
              new Paragraph({ spacing: { before: 10, after: 0 }, children: [] }),
              ...contentParagraphs,
              new Paragraph({ spacing: { before: 10, after: 0 }, children: [] })
            ]
          })
        ]
      })
    ]
  });
}

function buildBottomLine(data) {
  const bl = data.bottomLineStructured || {};
  const hasStructured = bl.summary || bl.timeline || bl.risk || bl.resourceAsk || bl.nextReview;
  
  // Build content paragraphs
  const contentChildren = [];
  
  // Header
  contentChildren.push(
    new Paragraph({
      spacing: { before: 60, after: 20 },
      children: [
        new TextRun({ text: 'BOTTOM LINE:', bold: true, size: 20, font: 'Work Sans', color: COLORS.navy })
      ]
    })
  );
  
  if (hasStructured) {
    // Structured format with labeled sections
    if (bl.summary) {
      contentChildren.push(
        new Paragraph({
          spacing: { before: 0, after: 40 },
          children: [
            new TextRun({ text: bl.summary, size: 22, font: 'Work Sans', color: COLORS.darkText })
          ]
        })
      );
    }
    
    // Timeline, Risk, Resource on same line if present
    const metaItems = [];
    if (bl.timeline) metaItems.push({ label: '📅 Timeline:', value: bl.timeline });
    if (bl.risk) metaItems.push({ label: '⚠️ Risk:', value: bl.risk });
    if (bl.resourceAsk) metaItems.push({ label: '👥 Resource:', value: bl.resourceAsk });
    
    if (metaItems.length > 0) {
      const metaRuns = [];
      metaItems.forEach((item, idx) => {
        if (idx > 0) metaRuns.push(new TextRun({ text: '   |   ', size: 18, font: 'Work Sans', color: COLORS.lightText }));
        metaRuns.push(new TextRun({ text: item.label + ' ', bold: true, size: 18, font: 'Work Sans', color: COLORS.mediumText }));
        metaRuns.push(new TextRun({ text: item.value, size: 18, font: 'Work Sans', color: COLORS.darkText }));
      });
      
      contentChildren.push(
        new Paragraph({
          spacing: { before: 0, after: bl.nextReview ? 30 : 60 },
          children: metaRuns
        })
      );
    }
    
    // Next review date
    if (bl.nextReview) {
      contentChildren.push(
        new Paragraph({
          spacing: { before: 0, after: 60 },
          children: [
            new TextRun({ text: '🔄 Next Review: ', bold: true, size: 18, font: 'Work Sans', color: COLORS.mediumText }),
            new TextRun({ text: bl.nextReview, size: 18, font: 'Work Sans', color: COLORS.darkText })
          ]
        })
      );
    }
  } else {
    // Fallback to simple text format
    contentChildren.push(
      new Paragraph({
        spacing: { before: 0, after: 60 },
        children: [
          new TextRun({ text: data.bottomLine || '', size: 22, font: 'Work Sans', color: COLORS.darkText })
        ]
      })
    );
  }
  
  return new Table({
    width: { size: 10700, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: navyBorder, bottom: navyBorder, left: navyBorder, right: navyBorder },
            shading: { fill: COLORS.blueTint },
            children: contentChildren
          })
        ]
      })
    ]
  });
}

function buildCrossSellingAndBottomLine(data) {
  const opportunities = data.crossSellingOpportunities?.slice(0, 2) || [];
  
  return new Table({
    width: { size: 10700, type: WidthType.DXA },
    columnWidths: [5350, 5350],
    rows: [
      new TableRow({
        children: [
          // Left: Cross-Selling
          new TableCell({
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            width: { size: 5350, type: WidthType.DXA },
            children: [
              sectionHeader('Cross-Selling', 5250),
              new Paragraph({ spacing: { before: 20, after: 0 }, children: [] }),
              ...(opportunities.length > 0 
                ? opportunities.map(opp =>
                    new Paragraph({
                      spacing: { before: 12, after: 12 },
                      children: [
                        new TextRun({ text: `${opp.type}: `, bold: true, size: 12, font: 'Work Sans', color: COLORS.navy }),
                        new TextRun({ text: opp.banks.join(', '), size: 12, font: 'Work Sans', color: COLORS.darkText })
                      ]
                    })
                  )
                : [new Paragraph({
                    spacing: { before: 12, after: 12 },
                    children: [new TextRun({ text: 'Patterns emerging', size: 12, font: 'Work Sans', color: COLORS.lightText, italics: true })]
                  })]
              )
            ]
          }),
          // Right: Bottom Line
          new TableCell({
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            width: { size: 5350, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Table({
                width: { size: 5250, type: WidthType.DXA },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: { top: navyBorder, bottom: navyBorder, left: navyBorder, right: navyBorder },
                        shading: { fill: COLORS.blueTint },
                        children: [
                          new Paragraph({
                            spacing: { before: 40, after: 40 },
                            children: [
                              new TextRun({ text: 'BOTTOM LINE: ', bold: true, size: 13, font: 'Work Sans', color: COLORS.navy }),
                              new TextRun({ text: data.bottomLine || '', size: 13, font: 'Work Sans', color: COLORS.darkText })
                            ]
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

function generateRegionalFactSheet(data) {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { orientation: PageOrientation.PORTRAIT },
          margin: { top: 400, bottom: 400, left: 500, right: 500 }
        }
      },
      children: [
        // P4: Header with readiness score
        buildHeader(data),
        
        new Paragraph({ spacing: { before: 50, after: 0 }, children: [] }),
        
        // P1: Key Insight callout
        buildKeyInsight(data),
        
        new Paragraph({ spacing: { before: 50, after: 0 }, children: [] }),
        
        // P6: Maturity Spectrum with DRR indicators
        buildMaturitySpectrum(data),
        
        new Paragraph({ spacing: { before: 50, after: 0 }, children: [] }),
        
        // P3 & P7: Bank Quick Reference with urgency badges + confidence warning (title bar integrated)
        buildBankQuickReference(data),
        buildConfidenceWarning(data),
        
        new Paragraph({ spacing: { before: 50, after: 0 }, children: [] }),
        
        // Key Deadlines + Regional Patterns (side by side with gap and aligned bottoms)
        new Table({
          width: { size: 10700, type: WidthType.DXA },
          columnWidths: [5200, 300, 5200],
          rows: [
            // Header row
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  width: { size: 5200, type: WidthType.DXA },
                  shading: { fill: '0C2340' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 40, after: 40 },
                      children: [
                        new TextRun({ text: 'Key Deadlines', bold: true, size: 20, font: 'Work Sans', color: 'FFFFFF' })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  width: { size: 300, type: WidthType.DXA },
                  shading: { fill: 'FFFFFF' },
                  children: [new Paragraph({ children: [] })]
                }),
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  width: { size: 5200, type: WidthType.DXA },
                  shading: { fill: '0C2340' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 40, after: 40 },
                      children: [
                        new TextRun({ text: 'Regional Patterns', bold: true, size: 20, font: 'Work Sans', color: 'FFFFFF' })
                      ]
                    })
                  ]
                })
              ]
            }),
            // Content row (aligned bottoms)
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  width: { size: 5200, type: WidthType.DXA },
                  shading: { fill: 'F5F5F5' },
                  verticalAlign: VerticalAlign.TOP,
                  children: buildDeadlinesContent(data)
                }),
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  width: { size: 300, type: WidthType.DXA },
                  shading: { fill: 'FFFFFF' },
                  children: [new Paragraph({ children: [] })]
                }),
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  width: { size: 5200, type: WidthType.DXA },
                  shading: { fill: 'F5F5F5' },
                  verticalAlign: VerticalAlign.TOP,
                  children: buildRegionalPatternsContent(data)
                })
              ]
            })
          ]
        }),
        
        new Paragraph({ spacing: { before: 50, after: 0 }, children: [] }),
        
        // Recommended Sequence + Priority Actions (side by side with gap and aligned bottoms)
        new Table({
          width: { size: 10700, type: WidthType.DXA },
          columnWidths: [5200, 300, 5200],
          rows: [
            // Header row
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  width: { size: 5200, type: WidthType.DXA },
                  shading: { fill: '0C2340' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 40, after: 40 },
                      children: [
                        new TextRun({ text: 'Recommended Sequence', bold: true, size: 20, font: 'Work Sans', color: 'FFFFFF' })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  width: { size: 300, type: WidthType.DXA },
                  shading: { fill: 'FFFFFF' },
                  children: [new Paragraph({ children: [] })]
                }),
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  width: { size: 5200, type: WidthType.DXA },
                  shading: { fill: '0C2340' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 40, after: 40 },
                      children: [
                        new TextRun({ text: '30-Day Priority Actions', bold: true, size: 20, font: 'Work Sans', color: 'FFFFFF' })
                      ]
                    })
                  ]
                })
              ]
            }),
            // Content row (aligned bottoms)
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  width: { size: 5200, type: WidthType.DXA },
                  shading: { fill: 'F5F5F5' },
                  verticalAlign: VerticalAlign.TOP,
                  children: buildRecommendedSequenceContent(data)
                }),
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  width: { size: 300, type: WidthType.DXA },
                  shading: { fill: 'FFFFFF' },
                  children: [new Paragraph({ children: [] })]
                }),
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  width: { size: 5200, type: WidthType.DXA },
                  shading: { fill: 'F5F5F5' },
                  verticalAlign: VerticalAlign.TOP,
                  children: buildPriorityActionsContent(data)
                })
              ]
            })
          ]
        }),
        
        new Paragraph({ spacing: { before: 50, after: 0 }, children: [] }),
        
        // Regional Sensitivity
        buildSensitivity(data),
        
        new Paragraph({ spacing: { before: 50, after: 0 }, children: [] }),
        
        // Bottom Line
        buildBottomLine(data),
        
        // Footer
        new Paragraph({ spacing: { before: 50, after: 0 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'CONFIDENTIAL — For Internal Use Only  |  Page 1 of 1', size: 12, font: 'Work Sans', color: COLORS.lightText })
          ]
        })
      ]
    }]
  });
  
  return doc;
}

// ============================================================================
// EXECUTION
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node regional_template.js <regional_data.json> [output_dir]');
    console.error('       node regional_template.js --batch <regional_dir> [output_dir]');
    process.exit(1);
  }
  
  if (args[0] === '--batch') {
    const regionalDir = args[1] || './regional';
    const outputDir = args[2] || '/mnt/user-data/outputs';
    
    const files = fs.readdirSync(regionalDir).filter(f => f.endsWith('.json') && f !== 'all_regions.json');
    
    console.log(`\n═══════════════════════════════════════════════`);
    console.log(`GENERATING: ${files.length} regional fact sheets (Enhanced P1-P7)`);
    console.log(`═══════════════════════════════════════════════\n`);
    
    (async () => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const data = JSON.parse(fs.readFileSync(path.join(regionalDir, file), 'utf8'));
          const doc = generateRegionalFactSheet(data);
          const outputName = `${data.meta.name.replace(/ /g, '_')}_Regional_Analysis.docx`;
          const outputPath = path.join(outputDir, outputName);
          
          const buffer = await Packer.toBuffer(doc);
          fs.writeFileSync(outputPath, buffer);
          console.log(`[${i + 1}/${files.length}] ✓ ${data.meta.name}`);
        } catch (err) {
          console.log(`[${i + 1}/${files.length}] ✗ ${file}: ${err.message}`);
        }
      }
      
      console.log(`\n═══════════════════════════════════════════════`);
      console.log(`✓ Output: ${outputDir}/`);
      console.log(`═══════════════════════════════════════════════\n`);
    })();
    
  } else {
    const inputFile = args[0];
    const outputDir = args[1] || '/mnt/user-data/outputs';
    
    if (!fs.existsSync(inputFile)) {
      console.error(`Error: File not found: ${inputFile}`);
      process.exit(1);
    }
    
    (async () => {
      try {
        const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
        const doc = generateRegionalFactSheet(data);
        const outputName = `${data.meta.name.replace(/ /g, '_')}_Regional_Analysis.docx`;
        const outputPath = path.join(outputDir, outputName);
        
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(outputPath, buffer);
        console.log(`✓ Generated: ${outputPath}`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    })();
  }
}

module.exports = { generateRegionalFactSheet };
