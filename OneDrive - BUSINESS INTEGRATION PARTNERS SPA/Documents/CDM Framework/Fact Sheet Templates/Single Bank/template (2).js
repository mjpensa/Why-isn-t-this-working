/**
 * CDM/DRR Bank Fact Sheet Generator
 * Template v7.0 - Updated styling to match regional template
 * 
 * Usage: node template.js <bank_data.json>
 * Output: {BankName}_CDM_Cheatsheet.docx in outputs/
 */

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer,
        AlignmentType, BorderStyle, WidthType, ShadingType, LevelFormat, PageNumber, PageBreak,
        VerticalAlign } = require('docx');
const fs = require('fs');
const path = require('path');

// ============================================================================
// COLOR PALETTE (Aligned with Regional Template)
// ============================================================================
const COLORS = {
  navy: "0C2340",           // Updated to match regional title bars
  navyLight: "1B365D",      // Secondary navy for accents
  amber: "F59E0B",          // Updated amber
  black: "000000",
  darkText: "333333",
  mediumText: "555555",
  lightText: "777777",
  white: "FFFFFF",
  lightGray: "F5F5F5",
  mediumGray: "EAEAEA",     // Updated to match regional table headers
  green: "2E7D32",
  red: "DC2626",            // Updated red
  architectGreen: "10B981",
  pragmatistAmber: "F59E0B",
  observerGray: "6B7280",
  amberTint: "FFFBEB",
  greenTint: "ECFDF5",
  redTint: "FEE2E2",
  blueTint: "EFF6FF",
  grayTint: "F9FAFB"
};

// Font constant for consistency
const FONT = "Work Sans";

// ============================================================================
// BORDER DEFINITIONS (Aligned with Regional Template)
// ============================================================================
const noBorder = { style: BorderStyle.NIL };
const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: COLORS.mediumGray };
const accentBorder = { style: BorderStyle.SINGLE, size: 12, color: COLORS.navy };
const amberLeftBorder = { style: BorderStyle.SINGLE, size: 24, color: COLORS.amber };
const navyLeftBorder = { style: BorderStyle.SINGLE, size: 24, color: COLORS.navy };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function sectionHeader(text, width = 5100) {
  return new Table({
    columnWidths: [width],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            shading: { fill: COLORS.navy, type: ShadingType.CLEAR },
            width: { size: width, type: WidthType.DXA },
            children: [new Paragraph({ 
              spacing: { before: 60, after: 60 },
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: text, bold: true, size: 20, color: COLORS.white, font: FONT })] 
            })]
          })
        ]
      })
    ]
  });
}

function getConfidenceDots(level) {
  const filled = "●".repeat(level);
  const empty = "○".repeat(5 - level);
  return filled + empty;
}

function getStatusColor(status) {
  switch(status) {
    case 'Done': return COLORS.green;
    case 'Upcoming': return COLORS.amber;
    case 'Proposed': return COLORS.amber;
    default: return COLORS.mediumText;
  }
}

function getStatusSymbol(status) {
  switch(status) {
    case 'Done': return '✓';
    case 'Upcoming': return '⟳';
    case 'Proposed': return '⟳';
    default: return '';
  }
}

function getClassificationColor(classification) {
  switch(classification) {
    case 'ARCHITECT': return COLORS.architectGreen;
    case 'PRAGMATIST': return COLORS.pragmatistAmber;
    case 'SKEPTIC': return COLORS.red;
    case 'OBSERVER': return COLORS.observerGray;
    default: return COLORS.navy;
  }
}

// ============================================================================
// MAIN GENERATOR FUNCTION
// ============================================================================
function generateFactSheet(data) {
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const doc = new Document({
    styles: {
      default: { document: { run: { font: FONT, size: 20 } } },
      paragraphStyles: [
        { id: "Title", name: "Title", basedOn: "Normal",
          run: { size: 56, bold: true, color: COLORS.navy, font: FONT },
          paragraph: { spacing: { before: 0, after: 60 } } },
        { id: "Subtitle", name: "Subtitle", basedOn: "Normal",
          run: { size: 24, color: COLORS.mediumText, font: FONT },
          paragraph: { spacing: { before: 0, after: 120 } } },
        { id: "BodyText", name: "Body Text", basedOn: "Normal",
          run: { size: 20, color: COLORS.darkText, font: FONT },
          paragraph: { spacing: { before: 40, after: 40, line: 288 } } },
        { id: "SmallText", name: "Small Text", basedOn: "Normal",
          run: { size: 18, color: COLORS.mediumText, font: FONT },
          paragraph: { spacing: { before: 40, after: 40, line: 288 } } },
        { id: "Caption", name: "Caption", basedOn: "Normal",
          run: { size: 15, color: COLORS.lightText, font: FONT, italics: true },
          paragraph: { spacing: { before: 20, after: 20 } } }
      ]
    },
    numbering: {
      config: [
        { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 200 } } } }] },
        { reference: "arrows", levels: [{ level: 0, format: LevelFormat.BULLET, text: "→", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 200 } } } }] },
        { reference: "checks", levels: [{ level: 0, format: LevelFormat.BULLET, text: "✓", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 200 } } } }] }
      ]
    },
    sections: [{
      properties: {
        page: { margin: { top: 580, right: 580, bottom: 580, left: 580 } }
      },
      headers: {
        default: new Header({ children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 100 },
            children: [new TextRun({ text: "CDM/DRR Client Engagement Handbook", size: 15, color: COLORS.lightText, italics: true, font: FONT })]
          })
        ]})
      },
      footers: {
        default: new Footer({ children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100 },
            children: [
              new TextRun({ text: "CONFIDENTIAL — For Internal Use Only  |  Page ", size: 15, color: COLORS.lightText, font: FONT }),
              new TextRun({ children: [PageNumber.CURRENT], size: 15, color: COLORS.lightText, font: FONT }),
              new TextRun({ text: " of ", size: 15, color: COLORS.lightText, font: FONT }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 15, color: COLORS.lightText, font: FONT })
            ]
          })
        ]})
      },
      children: [
        
        // ==================== PAGE 1: EXECUTIVE INTELLIGENCE BRIEF ====================
        
        // ========== HEADER BLOCK ==========
        new Table({
          columnWidths: [6500, 4200],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  width: { size: 6500, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({ style: "Title", children: [new TextRun(data.bank.name)] }),
                    new Paragraph({ style: "Subtitle", children: [
                      new TextRun("CDM/DRR Engagement Profile"),
                      new TextRun({ text: "   |   ", color: COLORS.mediumGray }),
                      new TextRun({ text: currentDate, italics: true })
                    ]})
                  ]
                }),
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  width: { size: 4200, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Table({
                      columnWidths: [2600, 1500],
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({
                              borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: noBorder },
                              shading: { fill: getClassificationColor(data.bank.classification), type: ShadingType.CLEAR },
                              width: { size: 2600, type: WidthType.DXA },
                              verticalAlign: VerticalAlign.CENTER,
                              children: [new Paragraph({ 
                                alignment: AlignmentType.CENTER, 
                                spacing: { before: 100, after: 100 }, 
                                children: [new TextRun({ text: data.bank.classification, bold: true, size: 28, color: COLORS.white, font: FONT })]
                              })]
                            }),
                            new TableCell({
                              borders: { top: thinBorder, bottom: thinBorder, left: noBorder, right: thinBorder },
                              shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
                              width: { size: 1500, type: WidthType.DXA },
                              verticalAlign: VerticalAlign.CENTER,
                              children: [
                                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 0 }, children: [
                                  new TextRun({ text: getConfidenceDots(data.bank.confidence), size: 32, color: COLORS.navy, font: FONT }),
                                ]}),
                                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 }, children: [
                                  new TextRun({ text: "confidence", size: 14, color: COLORS.lightText, font: FONT }),
                                ]})
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
        }),

        new Paragraph({ 
          spacing: { before: 60, after: 80 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.navy } },
          children: [] 
        }),

        // ========== SECTION 1: POSITION SUMMARY ==========
        new Table({
          columnWidths: [10700],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
                  width: { size: 10700, type: WidthType.DXA },
                  children: [
                    sectionHeader("POSITION SUMMARY", 10620),
                    // KEY IMPLICATION callout - AT TOP
                    new Table({
                      columnWidths: [10540],
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({
                              borders: { top: noBorder, bottom: noBorder, left: amberLeftBorder, right: noBorder },
                              shading: { fill: COLORS.amberTint, type: ShadingType.CLEAR },
                              width: { size: 10540, type: WidthType.DXA },
                              children: [new Paragraph({ spacing: { before: 50, after: 50 }, children: [
                                new TextRun({ text: "  KEY IMPLICATION:  ", bold: true, size: 18, color: COLORS.darkText }),
                                new TextRun({ text: data.positioning.keyImplication, size: 18, color: COLORS.darkText })
                              ]})]
                            })
                          ]
                        })
                      ]
                    }),
                    // Bullet summary of position
                    ...data.positioning.bullets.map((bullet, idx) => 
                      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { before: idx === 0 ? 80 : 0, after: 40 }, children: [
                        new TextRun({ text: bullet, size: 17, color: COLORS.darkText })
                      ]})
                    ),
                    // TIMING WINDOW callout
                    new Table({
                      columnWidths: [10540],
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({
                              borders: { top: noBorder, bottom: noBorder, left: navyLeftBorder, right: noBorder },
                              shading: { fill: COLORS.blueTint, type: ShadingType.CLEAR },
                              width: { size: 10540, type: WidthType.DXA },
                              children: [
                                new Paragraph({ spacing: { before: 50, after: 30 }, children: [
                                  new TextRun({ text: "  🎯 TIMING: ", bold: true, size: 18, color: COLORS.navy }),
                                  new TextRun({ text: data.positioning.timing.urgency, bold: true, size: 18, color: COLORS.red })
                                ]}),
                                new Paragraph({ spacing: { before: 0, after: 50 }, children: [
                                  new TextRun({ text: "       " + data.positioning.timing.rationale, size: 16, color: COLORS.mediumText })
                                ]})
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
        }),

        new Paragraph({ spacing: { before: 90, after: 0 }, children: [] }),

        // ========== ROW 2: Evidence Snapshot + Competitive Position ==========
        new Table({
          columnWidths: [5350, 5350],
          rows: [
            new TableRow({
              children: [
                // SECTION 2: EVIDENCE SNAPSHOT
                new TableCell({
                  borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
                  width: { size: 5350, type: WidthType.DXA },
                  children: [
                    sectionHeader("EVIDENCE SNAPSHOT", 5270),
                    ...data.evidence.map((ev, idx) =>
                      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { before: idx === 0 ? 80 : 0, after: 50 }, children: [
                        new TextRun({ text: `[${ev.year}] `, bold: true, size: 16, color: COLORS.black }),
                        new TextRun({ text: ev.text, size: 16, color: COLORS.darkText })
                      ]})
                    ),
                    // LEAD WITH THIS callout
                    new Table({
                      columnWidths: [5190],
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({
                              borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                              shading: { fill: COLORS.amberTint, type: ShadingType.CLEAR },
                              width: { size: 5190, type: WidthType.DXA },
                              children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [
                                new TextRun({ text: "💡 LEAD WITH: ", bold: true, size: 15, color: COLORS.darkText }),
                                new TextRun({ text: data.leadWith, size: 15, color: COLORS.darkText, italics: true })
                              ]})]
                            })
                          ]
                        })
                      ]
                    }),
                    new Paragraph({ style: "Caption", alignment: AlignmentType.RIGHT, spacing: { before: 40, after: 30 }, children: [
                      new TextRun({ text: "Sources: FINOS, GitHub, ISDA, Linux Foundation", size: 13 })
                    ]})
                  ]
                }),
                // SECTION 3: COMPETITIVE POSITION
                new TableCell({
                  borders: { top: thinBorder, bottom: thinBorder, left: noBorder, right: thinBorder },
                  width: { size: 5350, type: WidthType.DXA },
                  children: [
                    sectionHeader("COMPETITIVE POSITION", 5270),
                    new Paragraph({ spacing: { before: 70, after: 40 }, children: [] }),
                    new Table({
                      columnWidths: [1700, 1400, 1100, 1000],
                      rows: [
                        // Header row
                        new TableRow({
                          children: [
                            new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                              shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
                              children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "G-SIB Peer", bold: true, size: 16, color: COLORS.darkText })] })] }),
                            new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                              shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
                              children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "CDM Status", bold: true, size: 16, color: COLORS.darkText })] })] }),
                            new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                              shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
                              children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "DRR?", bold: true, size: 16, color: COLORS.darkText })] })] }),
                            new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                              shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
                              children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "When?", bold: true, size: 16, color: COLORS.darkText })] })] })
                          ]
                        }),
                        // Data rows
                        ...data.competitivePosition.map(peer =>
                          new TableRow({
                            children: [
                              new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                                shading: peer.highlight ? { fill: COLORS.amberTint, type: ShadingType.CLEAR } : undefined,
                                children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: peer.bank, bold: peer.highlight, size: 16, color: COLORS.darkText })] })] }),
                              new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                                shading: peer.highlight ? { fill: COLORS.amberTint, type: ShadingType.CLEAR } : undefined,
                                children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: peer.cdmStatus, size: 16, color: getClassificationColor(peer.cdmStatus), bold: true })] })] }),
                              new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                                shading: peer.highlight ? { fill: COLORS.amberTint, type: ShadingType.CLEAR } : undefined,
                                children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: peer.drr, size: 16, color: peer.drr === 'Yes' ? COLORS.green : peer.drr === 'No evid.' ? COLORS.red : COLORS.amber })] })] }),
                              new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                                shading: peer.highlight ? { fill: COLORS.amberTint, type: ShadingType.CLEAR } : undefined,
                                children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: peer.when || "—", size: 16, color: COLORS.mediumText })] })] })
                            ]
                          })
                        )
                      ]
                    }),
                    // PEER PRESSURE SCRIPT
                    new Paragraph({ spacing: { before: 50, after: 30 }, children: [
                      new TextRun({ text: "PEER PRESSURE SCRIPT:", bold: true, size: 15, color: COLORS.navy })
                    ]}),
                    new Paragraph({ spacing: { before: 0, after: 30 }, children: [
                      new TextRun({ text: `"${data.peerPressureScript.text}"`, size: 15, color: COLORS.darkText, italics: true })
                    ]}),
                    new Paragraph({ spacing: { before: 0, after: 30 }, children: [
                      new TextRun({ text: "⚠️ " + data.peerPressureScript.warning, size: 14, color: COLORS.amber })
                    ]})
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 90, after: 0 }, children: [] }),

        // ========== ROW 3: Regulatory Urgency + Quick Reference ==========
        new Table({
          columnWidths: [5350, 5350],
          rows: [
            new TableRow({
              children: [
                // SECTION 4: REGULATORY URGENCY
                new TableCell({
                  borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
                  width: { size: 5350, type: WidthType.DXA },
                  children: [
                    sectionHeader("REGULATORY URGENCY", 5270),
                    new Paragraph({ spacing: { before: 70, after: 30 }, children: [] }),
                    new Table({
                      columnWidths: [1100, 1400, 1200, 1500],
                      rows: [
                        // Header row
                        new TableRow({
                          children: [
                            new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                              shading: { fill: COLORS.mediumGray, type: ShadingType.CLEAR },
                              children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Deadline", bold: true, size: 16, font: FONT, color: COLORS.darkText })] })] }),
                            new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                              shading: { fill: COLORS.mediumGray, type: ShadingType.CLEAR },
                              children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Regulation", bold: true, size: 16, font: FONT, color: COLORS.darkText })] })] }),
                            new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                              shading: { fill: COLORS.mediumGray, type: ShadingType.CLEAR },
                              children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Status", bold: true, size: 16, font: FONT, color: COLORS.darkText })] })] }),
                            new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                              shading: { fill: COLORS.mediumGray, type: ShadingType.CLEAR },
                              children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Penalty Risk", bold: true, size: 16, font: FONT, color: COLORS.darkText })] })] })
                          ]
                        }),
                        // Data rows
                        ...data.regulatoryUrgency.map(reg =>
                          new TableRow({
                            children: [
                              new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                                children: [new Paragraph({ spacing: { before: 35, after: 35 }, children: [new TextRun({ text: reg.deadline, size: 16, font: FONT, bold: reg.status === 'Upcoming', color: reg.status === 'Upcoming' ? COLORS.navy : COLORS.darkText })] })] }),
                              new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                                children: [new Paragraph({ spacing: { before: 35, after: 35 }, children: [new TextRun({ text: reg.regulation, size: 16, font: FONT, bold: reg.status === 'Upcoming', color: reg.status === 'Upcoming' ? COLORS.amber : COLORS.darkText })] })] }),
                              new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                                children: [new Paragraph({ spacing: { before: 35, after: 35 }, children: [new TextRun({ text: getStatusSymbol(reg.status) + " " + reg.status, size: 16, font: FONT, color: getStatusColor(reg.status) })] })] }),
                              new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                                children: [new Paragraph({ spacing: { before: 35, after: 35 }, children: [new TextRun({ text: reg.penaltyRisk, size: 15, font: FONT, color: COLORS.red })] })] })
                            ]
                          })
                        )
                      ]
                    }),
                    // Footnote
                    new Paragraph({ style: "Caption", spacing: { before: 40, after: 30 }, children: [
                      new TextRun({ text: data.regulatoryFootnote || "", size: 13, font: FONT })
                    ]}),
                    // Discovery question
                    new Paragraph({ spacing: { before: 30, after: 30 }, children: [
                      new TextRun({ text: "DISCOVERY: ", bold: true, size: 16, font: FONT, color: COLORS.navy }),
                      new TextRun({ text: `"${data.discoveryQuestion}"`, size: 16, font: FONT, color: COLORS.darkText, italics: true })
                    ]})
                  ]
                }),
                // SECTION 5: QUICK REFERENCE
                new TableCell({
                  borders: { top: thinBorder, bottom: thinBorder, left: noBorder, right: thinBorder },
                  width: { size: 5350, type: WidthType.DXA },
                  children: [
                    sectionHeader("QUICK REFERENCE", 5270),
                    new Table({
                      columnWidths: [2200, 3000],
                      rows: [
                        { label: "FINOS Tier", value: data.bank.finosTier },
                        { label: "Derivatives Tier", value: data.bank.derivativesTier },
                        { label: "Deriv. Notional", value: data.bank.derivativesNotional, bold: true },
                        { label: "Revenue (2023)", value: data.bank.revenue2023 },
                        { label: "Headquarters", value: data.bank.headquarters },
                        { label: "Tech Stack", value: data.bank.techStack },
                        { label: "EMIR Vendor", value: data.bank.emirVendor || "Unknown — discovery target", italic: true, color: COLORS.red },
                        { label: "Similar Banks", value: data.bank.similarBanks.join(", ") }
                      ].map(row =>
                        new TableRow({ children: [
                          new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                            shading: row.label === "Similar Banks" ? { fill: COLORS.blueTint, type: ShadingType.CLEAR } : undefined,
                            children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: row.label, bold: true, size: 16, color: COLORS.darkText })] })] }),
                          new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                            shading: row.label === "Similar Banks" ? { fill: COLORS.blueTint, type: ShadingType.CLEAR } : undefined,
                            children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: row.value, size: 16, bold: row.bold, italics: row.italic, color: row.color || (row.bold ? COLORS.navy : COLORS.darkText) })] })] })
                        ]})
                      )
                    })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 90, after: 0 }, children: [] }),

        // ========== SECTION 6: ENGAGEMENT ANGLES ==========
        new Table({
          columnWidths: [10700],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
                  width: { size: 10700, type: WidthType.DXA },
                  children: [
                    sectionHeader("ENGAGEMENT ANGLES", 10620),
                    new Table({
                      columnWidths: [5300, 5300],
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({
                              borders: { top: noBorder, bottom: noBorder, left: noBorder, right: thinBorder },
                              width: { size: 5300, type: WidthType.DXA },
                              children: [
                                new Paragraph({ spacing: { before: 80, after: 50 }, children: [
                                  new TextRun({ text: "RECOMMENDED OPENERS", bold: true, size: 18, color: COLORS.navy })
                                ]}),
                                ...data.engagementAngles.openers.map((opener, idx) =>
                                  new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { before: 0, after: 60 }, children: [
                                    new TextRun({ text: opener.audience + ": ", bold: true, size: 15, color: COLORS.mediumText }),
                                    new TextRun({ text: opener.script, size: 15, color: COLORS.darkText, italics: true })
                                  ]})
                                )
                              ]
                            }),
                            new TableCell({
                              borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                              width: { size: 5300, type: WidthType.DXA },
                              children: [
                                new Paragraph({ spacing: { before: 80, after: 50 }, children: [
                                  new TextRun({ text: "RAPPORT BUILDERS", bold: true, size: 18, color: COLORS.navy })
                                ]}),
                                ...data.engagementAngles.rapportBuilders.map((rb, idx) =>
                                  new Paragraph({ spacing: { before: 0, after: 60 }, children: [
                                    new TextRun({ text: "Reference ", size: 16, color: COLORS.darkText }),
                                    new TextRun({ text: rb.entity, bold: true, size: 16, color: COLORS.darkText }),
                                    new TextRun({ text: ` ${rb.context} `, size: 16, color: COLORS.darkText }),
                                    new TextRun({ text: rb.usage, size: 16, color: COLORS.darkText })
                                  ]})
                                )
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
        }),

        // ==================== PAGE BREAK ====================
        new Paragraph({ children: [new PageBreak()] }),

        // ==================== PAGE 2: CLIENT ENGAGEMENT HANDBOOK ====================
        
        new Paragraph({ style: "Title", spacing: { before: 0, after: 40 }, children: [
          new TextRun({ text: data.bank.name, size: 40 }),
          new TextRun({ text: "  —  Client Engagement Handbook", size: 32, color: COLORS.mediumText, font: FONT })
        ]}),
        
        new Paragraph({ 
          spacing: { before: 40, after: 100 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.navy } },
          children: [] 
        }),

        // ========== SECTION 7: OBJECTION HANDLING ==========
        new Table({
          columnWidths: [10700],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
                  width: { size: 10700, type: WidthType.DXA },
                  children: [
                    sectionHeader("OBJECTION HANDLING", 10620),
                    new Table({
                      columnWidths: [3500, 3500, 3600],
                      rows: [
                        new TableRow({
                          children: data.objectionHandling.map(obj =>
                            new TableCell({
                              borders: { top: noBorder, bottom: noBorder, left: noBorder, right: thinBorder },
                              width: { size: 3500, type: WidthType.DXA },
                              children: [
                                new Paragraph({ spacing: { before: 60, after: 30 }, children: [
                                  new TextRun({ text: "IF THEY SAY:", bold: true, size: 15, color: COLORS.amber })
                                ]}),
                                new Paragraph({ spacing: { before: 0, after: 40 }, children: [
                                  new TextRun({ text: `"${obj.theySay}"`, size: 15, color: COLORS.darkText })
                                ]}),
                                new Paragraph({ spacing: { before: 20, after: 30 }, children: [
                                  new TextRun({ text: "YOU SAY:", bold: true, size: 15, color: COLORS.green })
                                ]}),
                                new Paragraph({ spacing: { before: 0, after: 40 }, children: [
                                  new TextRun({ text: `"${obj.youSay}"`, size: 15, color: COLORS.darkText })
                                ]})
                              ]
                            })
                          )
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 90, after: 0 }, children: [] }),

        // ========== ROW 2: Cost of Inaction + Don't Say ==========
        new Table({
          columnWidths: [5350, 5350],
          rows: [
            new TableRow({
              children: [
                // SECTION 8: COST OF INACTION
                new TableCell({
                  borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
                  width: { size: 5350, type: WidthType.DXA },
                  children: [
                    sectionHeader("COST OF INACTION", 5270),
                    // 5-YEAR CUMULATIVE
                    new Table({
                      columnWidths: [5190],
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({
                              borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                              shading: { fill: COLORS.redTint, type: ShadingType.CLEAR },
                              width: { size: 5190, type: WidthType.DXA },
                              children: [
                                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 50, after: 20 }, children: [
                                  new TextRun({ text: `5-YEAR COST: ${data.costOfInaction.fiveYearCost}`, bold: true, size: 20, color: COLORS.navy })
                                ]}),
                                ...(data.costOfInaction.fiveYearBasis ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 50 }, children: [
                                  new TextRun({ text: `(${data.costOfInaction.fiveYearBasis})`, size: 14, color: COLORS.mediumText })
                                ]})] : [])
                              ]
                            })
                          ]
                        })
                      ]
                    }),
                    new Paragraph({ spacing: { before: 50, after: 30 }, children: [
                      new TextRun({ text: "Annual Exposure (G-SIB benchmarks):", bold: true, size: 16, color: COLORS.darkText })
                    ]}),
                    new Table({
                      columnWidths: [3100, 2000],
                      rows: [
                        ...data.costOfInaction.annualCosts.map((cost, idx) =>
                          new TableRow({ children: [
                            new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                              shading: idx === data.costOfInaction.annualCosts.length - 1 ? { fill: COLORS.greenTint, type: ShadingType.CLEAR } : undefined,
                              children: [new Paragraph({ spacing: { before: 35, after: 35 }, children: [new TextRun({ text: cost.item, size: 15, color: COLORS.darkText })] })] }),
                            new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                              shading: idx === data.costOfInaction.annualCosts.length - 1 ? { fill: COLORS.greenTint, type: ShadingType.CLEAR } : undefined,
                              children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 35, after: 35 }, children: [new TextRun({ text: cost.cost, size: 15, bold: true, color: idx === data.costOfInaction.annualCosts.length - 1 ? COLORS.green : COLORS.darkText })] })] })
                          ]})
                        ),
                        // Redeployable row
                        new TableRow({ children: [
                          new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                            shading: { fill: COLORS.greenTint, type: ShadingType.CLEAR },
                            children: [new Paragraph({ spacing: { before: 35, after: 35 }, children: [new TextRun({ text: "Redeployable to other priorities", size: 15, color: COLORS.darkText })] })] }),
                          new TableCell({ borders: { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder },
                            shading: { fill: COLORS.greenTint, type: ShadingType.CLEAR },
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 35, after: 35 }, children: [new TextRun({ text: data.costOfInaction.redeployable, size: 15, bold: true, color: COLORS.green })] })] })
                        ]})
                      ]
                    }),
                    // BENCHMARK
                    new Paragraph({ spacing: { before: 50, after: 30 }, children: [
                      new TextRun({ text: "BENCHMARK: ", bold: true, size: 15, color: COLORS.navy }),
                      new TextRun({ text: data.costOfInaction.benchmark, size: 15, color: COLORS.darkText })
                    ]})
                  ]
                }),
                // SECTION 9: DON'T SAY
                new TableCell({
                  borders: { top: thinBorder, bottom: thinBorder, left: noBorder, right: thinBorder },
                  shading: { fill: COLORS.redTint, type: ShadingType.CLEAR },
                  width: { size: 5350, type: WidthType.DXA },
                  children: [
                    sectionHeader("DON'T SAY — LANDMINES", 5270),
                    ...data.landmines.map((landmine, idx) => {
                      const elements = [
                        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { before: idx === 0 ? 70 : 0, after: landmine.sayInstead ? 20 : 50 }, children: [
                          new TextRun({ text: landmine.phrase, bold: true, size: 15, color: COLORS.darkText }),
                          ...(landmine.reason ? [new TextRun({ text: ` — ${landmine.reason}`, size: 14, color: COLORS.mediumText, italics: true })] : [])
                        ]})
                      ];
                      if (landmine.sayInstead) {
                        elements.push(
                          new Paragraph({ spacing: { before: 0, after: 50 }, indent: { left: 360 }, children: [
                            new TextRun({ text: "→ SAY INSTEAD: ", bold: true, size: 14, color: COLORS.green }),
                            new TextRun({ text: `"${landmine.sayInstead}"`, size: 14, color: COLORS.darkText, italics: true })
                          ]})
                        );
                      }
                      return elements;
                    }).flat()
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 90, after: 0 }, children: [] }),

        // ========== SECTION 11: RECOMMENDED NEXT ACTIONS ==========
        new Table({
          columnWidths: [10700],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: accentBorder, bottom: accentBorder, left: accentBorder, right: accentBorder },
                  shading: { fill: COLORS.greenTint, type: ShadingType.CLEAR },
                  width: { size: 10700, type: WidthType.DXA },
                  children: [
                    sectionHeader("RECOMMENDED NEXT ACTIONS", 10620),
                    // OUTREACH DEADLINE
                    new Paragraph({ spacing: { before: 50, after: 40 }, children: [
                      new TextRun({ text: "⏰ OUTREACH DEADLINE: ", bold: true, size: 17, color: COLORS.navy }),
                      new TextRun({ text: data.nextActions.outreachDeadline, bold: true, size: 17, color: COLORS.darkText }),
                      new TextRun({ text: `  (${data.nextActions.deadlineRationale})`, size: 15, color: COLORS.mediumText })
                    ]}),
                    // Primary Ask / Fallback
                    new Table({
                      columnWidths: [5300, 5300],
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({
                              borders: { top: noBorder, bottom: noBorder, left: noBorder, right: thinBorder },
                              shading: { fill: COLORS.greenTint, type: ShadingType.CLEAR },
                              width: { size: 5300, type: WidthType.DXA },
                              children: [
                                new Paragraph({ spacing: { before: 30, after: 20 }, children: [
                                  new TextRun({ text: "PRIMARY ASK", bold: true, size: 16, color: COLORS.navy })
                                ]}),
                                new Paragraph({ spacing: { before: 0, after: 30 }, children: [
                                  new TextRun({ text: `${data.nextActions.primaryAsk.action} with `, size: 15, color: COLORS.darkText }),
                                  new TextRun({ text: data.nextActions.primaryAsk.target, bold: true, size: 15, color: COLORS.darkText }),
                                  new TextRun({ text: ` to ${data.nextActions.primaryAsk.objective}.`, size: 15, color: COLORS.darkText })
                                ]})
                              ]
                            }),
                            new TableCell({
                              borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                              shading: { fill: COLORS.greenTint, type: ShadingType.CLEAR },
                              width: { size: 5300, type: WidthType.DXA },
                              children: [
                                new Paragraph({ spacing: { before: 30, after: 20 }, children: [
                                  new TextRun({ text: "FALLBACK", bold: true, size: 16, color: COLORS.navy })
                                ]}),
                                new Paragraph({ spacing: { before: 0, after: 30 }, children: [
                                  new TextRun({ text: data.nextActions.fallback, size: 15, color: COLORS.darkText })
                                ]})
                              ]
                            })
                          ]
                        })
                      ]
                    }),
                    // 30-MIN AGENDA + SUCCESS INDICATORS
                    new Table({
                      columnWidths: [5300, 5300],
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({
                              borders: { top: noBorder, bottom: noBorder, left: noBorder, right: thinBorder },
                              shading: { fill: COLORS.greenTint, type: ShadingType.CLEAR },
                              width: { size: 5300, type: WidthType.DXA },
                              children: [
                                new Paragraph({ spacing: { before: 30, after: 15 }, children: [
                                  new TextRun({ text: "30-MIN CALL AGENDA", bold: true, size: 15, color: COLORS.navy })
                                ]}),
                                ...data.nextActions.callAgenda.map((item, idx) =>
                                  new Paragraph({ spacing: { before: 0, after: 8 }, children: [
                                    new TextRun({ text: `[${item.duration}] `, bold: true, size: 14, color: COLORS.mediumText }),
                                    new TextRun({ text: item.topic, size: 14, color: COLORS.darkText })
                                  ]})
                                )
                              ]
                            }),
                            new TableCell({
                              borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                              shading: { fill: COLORS.greenTint, type: ShadingType.CLEAR },
                              width: { size: 5300, type: WidthType.DXA },
                              children: [
                                new Paragraph({ spacing: { before: 30, after: 15 }, children: [
                                  new TextRun({ text: "SUCCESS INDICATORS", bold: true, size: 15, color: COLORS.navy })
                                ]}),
                                ...data.nextActions.successIndicators.map((ind, idx) =>
                                  new Paragraph({ spacing: { before: 0, after: 8 }, children: [
                                    new TextRun({ text: ind.positive ? "✓ " : "✗ ", size: 14, color: ind.positive ? COLORS.green : COLORS.red }),
                                    new TextRun({ text: `${ind.signal} → `, size: 14, color: COLORS.darkText }),
                                    new TextRun({ text: ind.meaning, bold: true, size: 14, color: ind.positive ? COLORS.green : COLORS.red })
                                  ]})
                                )
                              ]
                            })
                          ]
                        })
                      ]
                    }),
                    // FOLLOW-UP CADENCE + KEY DISCOVERY QUESTIONS
                    new Table({
                      columnWidths: [5300, 5300],
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({
                              borders: { top: noBorder, bottom: noBorder, left: noBorder, right: thinBorder },
                              shading: { fill: COLORS.greenTint, type: ShadingType.CLEAR },
                              width: { size: 5300, type: WidthType.DXA },
                              children: [
                                new Paragraph({ spacing: { before: 20, after: 15 }, children: [
                                  new TextRun({ text: "FOLLOW-UP CADENCE ", bold: true, size: 15, color: COLORS.navy }),
                                  new TextRun({ text: "(if no response)", size: 14, color: COLORS.mediumText })
                                ]}),
                                ...data.nextActions.followUpCadence.map((fu, idx) =>
                                  new Paragraph({ spacing: { before: 0, after: 8 }, children: [
                                    new TextRun({ text: `Day ${fu.day}   `, bold: true, size: 14, color: COLORS.darkText }),
                                    new TextRun({ text: fu.action, size: 14, color: COLORS.darkText })
                                  ]})
                                )
                              ]
                            }),
                            new TableCell({
                              borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                              shading: { fill: COLORS.greenTint, type: ShadingType.CLEAR },
                              width: { size: 5300, type: WidthType.DXA },
                              children: [
                                new Paragraph({ spacing: { before: 20, after: 15 }, children: [
                                  new TextRun({ text: "KEY DISCOVERY QUESTIONS", bold: true, size: 15, color: COLORS.navy })
                                ]}),
                                ...data.nextActions.discoveryQuestions.map((q, idx) =>
                                  new Paragraph({ spacing: { before: 0, after: 8 }, children: [
                                    new TextRun({ text: `${idx + 1}. `, bold: true, size: 14, color: COLORS.navy }),
                                    new TextRun({ text: q, size: 14, color: COLORS.darkText })
                                  ]})
                                )
                              ]
                            })
                          ]
                        })
                      ]
                    }),
                    // EMAIL TEMPLATE
                    new Table({
                      columnWidths: [10600],
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({
                              borders: { top: thinBorder, bottom: thinBorder, left: navyLeftBorder, right: thinBorder },
                              shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
                              width: { size: 10600, type: WidthType.DXA },
                              children: [
                                new Paragraph({ spacing: { before: 40, after: 20 }, children: [
                                  new TextRun({ text: "📧 EMAIL TEMPLATE ", bold: true, size: 15, color: COLORS.navy }),
                                  new TextRun({ text: "(copy/paste ready)", size: 14, color: COLORS.mediumText })
                                ]}),
                                new Paragraph({ spacing: { before: 0, after: 20 }, children: [
                                  new TextRun({ text: "Subject: ", bold: true, size: 14, color: COLORS.darkText }),
                                  new TextRun({ text: data.nextActions.emailTemplate.subject, size: 14, color: COLORS.darkText })
                                ]}),
                                new Paragraph({ spacing: { before: 0, after: 40 }, children: [
                                  new TextRun({ text: data.nextActions.emailTemplate.body, size: 14, color: COLORS.darkText })
                                ]})
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
        }),

        new Paragraph({ spacing: { before: 60, after: 0 }, children: [] }),

        // ========== CONFIDENCE NOTES ==========
        new Table({
          columnWidths: [10700],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.mediumGray }, bottom: noBorder, left: noBorder, right: noBorder },
                  width: { size: 10700, type: WidthType.DXA },
                  children: [
                    new Paragraph({ spacing: { before: 60, after: 60 }, children: [
                      new TextRun({ text: "CONFIDENCE NOTES: ", bold: true, size: 15, color: COLORS.darkText }),
                      new TextRun({ text: data.confidenceNotes + "  ", size: 15, color: COLORS.mediumText }),
                      new TextRun({ text: `Next review: ${data.nextReview}`, bold: true, size: 15, color: COLORS.mediumText })
                    ]})
                  ]
                })
              ]
            })
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
    console.error('Usage: node template.js <bank_data.json>');
    console.error('       node template.js --batch <directory>');
    process.exit(1);
  }

  if (args[0] === '--batch') {
    // Batch processing mode
    const dir = args[1] || './extracted';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    
    console.log(`\n═══════════════════════════════════════════════`);
    console.log(`BATCH PROCESSING: ${files.length} banks`);
    console.log(`═══════════════════════════════════════════════\n`);
    
    // Process files sequentially with proper async handling
    (async () => {
      let success = 0;
      const failed = [];
      
      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];
        try {
          const data = JSON.parse(fs.readFileSync(path.join(dir, file)));
          const doc = generateFactSheet(data);
          const outputName = data.bank.name.replace(/ /g, '_') + '_CDM_Cheatsheet.docx';
          
          const buffer = await Packer.toBuffer(doc);
          fs.writeFileSync(path.join('./outputs', outputName), buffer);
          console.log(`[${idx + 1}/${files.length}] ✓ ${data.bank.name}`);
          success++;
        } catch (err) {
          console.log(`[${idx + 1}/${files.length}] ✗ ${file}: ${err.message}`);
          failed.push({ file, error: err.message });
        }
      }
      
      // Print summary after all files processed
      console.log(`\n═══════════════════════════════════════════════`);
      console.log(`BATCH COMPLETE: ${success}/${files.length} successful`);
      console.log(`═══════════════════════════════════════════════`);
      if (failed.length > 0) {
        console.log(`\n✗ Failed: ${failed.length} banks`);
        failed.forEach(f => console.log(`  - ${f.file}: ${f.error}`));
      }
      console.log(`\nOutput location: ./outputs/`);
      console.log(`═══════════════════════════════════════════════\n`);
    })();
    
  } else {
    // Single file mode
    const inputFile = args[0];
    
    if (!fs.existsSync(inputFile)) {
      console.error(`Error: File not found: ${inputFile}`);
      process.exit(1);
    }
    
    (async () => {
      try {
        const data = JSON.parse(fs.readFileSync(inputFile));
        const doc = generateFactSheet(data);
        const outputName = data.bank.name.replace(/ /g, '_') + '_CDM_Cheatsheet.docx';
        const outputPath = path.join('/mnt/user-data/outputs', outputName);
        
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

module.exports = { generateFactSheet };
