/**
 * CDM/DRR Research Markdown Parser
 * Converts structured research markdown to validated JSON
 * 
 * Usage: node parser.js <research_file.md> [output_dir]
 * Output: JSON file in extracted/ directory
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// PARSING UTILITIES
// ============================================================================

function extractSection(content, sectionName) {
  // Escape special regex characters in section name
  const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`## ${escapedName}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

function extractSubSection(content, sectionName) {
  const regex = new RegExp(`### ${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n### |\\n## |$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

function parseBulletList(text) {
  if (!text) return [];
  const lines = text.split('\n').filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./));
  return lines.map(line => line.replace(/^[\s]*[-\d.]+\s*/, '').trim());
}

function parseBoldValue(text, fieldName) {
  const regex = new RegExp(`\\*\\*${fieldName}\\*\\*:\\s*(.+?)(?=\\n|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function parseMarkdownTable(text) {
  if (!text) return [];
  const lines = text.split('\n').filter(line => line.trim().startsWith('|'));
  if (lines.length < 3) return []; // Need header + separator + at least one row
  
  const headers = lines[0].split('|').filter(h => h.trim()).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  const rows = [];
  
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split('|').filter(c => c.trim() !== '');
    if (cells.length >= headers.length) {
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = cells[idx] ? cells[idx].trim() : '';
      });
      rows.push(row);
    }
  }
  return rows;
}

function extractBlockquote(text) {
  if (!text) return null;
  const match = text.match(/>\s*(?:⚠️\s*)?(.+)/);
  return match ? match[1].trim() : null;
}

function extractFootnote(text) {
  if (!text) return null;
  const match = text.match(/>\s*Footnote:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

function normalizeStatus(status) {
  if (!status) return 'Unknown';
  const cleaned = status.replace(/[✓⟳]/g, '').trim();
  if (cleaned.toLowerCase().includes('done')) return 'Done';
  if (cleaned.toLowerCase().includes('upcoming')) return 'Upcoming';
  if (cleaned.toLowerCase().includes('proposed')) return 'Proposed';
  return cleaned;
}

function inferShortName(bankName) {
  const abbreviations = {
    'Deutsche Bank': 'DB',
    'JPMorgan Chase': 'JPM',
    'JPMorgan': 'JPM',
    'Goldman Sachs': 'GS',
    'Morgan Stanley': 'MS',
    'Citigroup': 'Citi',
    'Bank of America': 'BofA',
    'Wells Fargo': 'WF',
    'BNY Mellon': 'BNY',
    'State Street': 'STT',
    'BNP Paribas': 'BNP',
    'Société Générale': 'SocGen',
    'Societe Generale': 'SocGen',
    'Crédit Agricole': 'CA',
    'Credit Agricole': 'CA',
    'Barclays': 'Barc',
    'HSBC': 'HSBC',
    'Standard Chartered': 'StanChart',
    'UBS': 'UBS',
    'Credit Suisse': 'CS',
    'ING': 'ING',
    'Santander': 'SAN',
    'BBVA': 'BBVA',
    'UniCredit': 'UCG',
    'Intesa Sanpaolo': 'ISP',
    'Nordea': 'NDA',
    'Royal Bank of Canada': 'RBC',
    'TD Bank': 'TD',
    'Scotiabank': 'BNS',
    'Nomura': 'NMR',
    'Mizuho': 'MFG',
    'MUFG': 'MUFG',
    'Sumitomo Mitsui': 'SMFG',
    'Macquarie': 'MQG',
    'DBS': 'DBS'
  };
  return abbreviations[bankName] || bankName.split(' ').map(w => w[0]).join('');
}

// ============================================================================
// MAIN PARSER
// ============================================================================

function parseResearchMarkdown(content, filename) {
  const errors = [];
  const warnings = [];
  
  // Extract bank name from title
  const titleMatch = content.match(/^#\s+(.+?)\s*[-–—]\s*CDM\/DRR Research/m);
  const bankName = titleMatch ? titleMatch[1].trim() : path.basename(filename, '.md').replace(/_/g, ' ');
  
  // ========== CLASSIFICATION ==========
  const classSection = extractSection(content, 'Classification');
  const archetype = parseBoldValue(classSection, 'Archetype');
  const confidenceMatch = classSection?.match(/\*\*Confidence\*\*:\s*(\d)/);
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : null;
  
  if (!archetype) errors.push('Missing: Classification > Archetype');
  if (!confidence) errors.push('Missing: Classification > Confidence');
  
  // ========== BANK PROFILE ==========
  const profileSection = extractSection(content, 'Bank Profile');
  const headquarters = parseBoldValue(profileSection, 'Headquarters');
  const derivativesTier = parseBoldValue(profileSection, 'Derivatives Tier');
  const derivativesNotional = parseBoldValue(profileSection, 'Derivatives Notional');
  const revenue2023 = parseBoldValue(profileSection, 'Revenue \\(2023\\)') || parseBoldValue(profileSection, 'Revenue');
  const finosTier = parseBoldValue(profileSection, 'FINOS Membership') || parseBoldValue(profileSection, 'FINOS Tier');
  const techStack = parseBoldValue(profileSection, 'Tech Stack');
  const emirVendor = parseBoldValue(profileSection, 'EMIR Vendor');
  const similarBanksRaw = parseBoldValue(profileSection, 'Similar Banks');
  const similarBanks = similarBanksRaw ? similarBanksRaw.split(/[,;]/).map(b => b.trim()) : [];
  
  if (!headquarters) errors.push('Missing: Bank Profile > Headquarters');
  if (!derivativesTier) errors.push('Missing: Bank Profile > Derivatives Tier');
  
  // ========== KEY IMPLICATION ==========
  const keyImplicationSection = extractSection(content, 'Key Implication');
  const keyImplication = keyImplicationSection?.replace(/^[>\s]+/gm, '').trim();
  
  if (!keyImplication) errors.push('Missing: Key Implication');
  
  // ========== POSITION SUMMARY BULLETS ==========
  const bulletsSection = extractSection(content, 'Position Summary Bullets');
  const bullets = parseBulletList(bulletsSection);
  
  if (bullets.length < 3) errors.push(`Position Summary Bullets: found ${bullets.length}, need 3`);
  
  // ========== TIMING ==========
  const timingSection = extractSection(content, 'Timing');
  const urgency = parseBoldValue(timingSection, 'Urgency');
  const rationale = parseBoldValue(timingSection, 'Rationale');
  
  if (!urgency) errors.push('Missing: Timing > Urgency');
  if (!rationale) errors.push('Missing: Timing > Rationale');
  
  // ========== EVIDENCE TIMELINE ==========
  const evidenceSection = extractSection(content, 'Evidence Timeline');
  const evidenceTable = parseMarkdownTable(evidenceSection);
  const evidence = evidenceTable.map(row => ({
    year: row.year || row.Year || '',
    text: row.evidence || row.Evidence || ''
  })).filter(e => e.year && e.text);
  
  if (evidence.length < 4) errors.push(`Evidence Timeline: found ${evidence.length}, need 4-6`);
  
  // ========== LEAD WITH ==========
  const leadWithSection = extractSection(content, 'Lead With');
  const leadWith = leadWithSection?.replace(/^[""\s]+|[""\s]+$/g, '').trim();
  
  if (!leadWith) errors.push('Missing: Lead With');
  
  // ========== COMPETITIVE POSITION ==========
  const compSection = extractSection(content, 'Competitive Position');
  const compTable = parseMarkdownTable(compSection);
  const competitivePosition = compTable.map(row => {
    const bankCell = row.bank || row.Bank || '';
    const isHighlight = bankCell.includes('**');
    return {
      bank: bankCell.replace(/\*\*/g, '').trim(),
      cdmStatus: (row.cdmstatus || row.status || '').replace(/\*\*/g, '').trim(),
      drr: (row.drr || row['drr?'] || '').replace(/\*\*/g, '').trim(),
      when: (row.when || row.When || '').replace(/\*\*/g, '').replace(/^—$/, '').trim() || null,
      highlight: isHighlight
    };
  });
  
  if (competitivePosition.length < 4) errors.push(`Competitive Position: found ${competitivePosition.length}, need 4-5`);
  
  // ========== PEER PRESSURE SCRIPT ==========
  const peerSection = extractSection(content, 'Peer Pressure Script');
  const peerScriptMatch = peerSection?.match(/"([^"]+)"/);
  const peerPressureText = peerScriptMatch ? peerScriptMatch[1] : peerSection?.split('\n')[0]?.replace(/^[""\s]+|[""\s]+$/g, '');
  const peerWarning = extractBlockquote(peerSection) || 'Frame as curiosity, not accusation.';
  
  // ========== REGULATORY STATUS ==========
  const regSection = extractSection(content, 'Regulatory Status');
  const regTable = parseMarkdownTable(regSection);
  const regulatoryUrgency = regTable.map(row => ({
    deadline: row.deadline || row.Deadline || '',
    regulation: row.regulation || row.Regulation || '',
    status: normalizeStatus(row.status || row.Status || ''),
    penaltyRisk: row.penaltyrisk || row['penalty risk'] || row.penalty || ''
  }));
  const regulatoryFootnote = extractFootnote(regSection);
  
  if (regulatoryUrgency.length < 4) errors.push(`Regulatory Status: found ${regulatoryUrgency.length}, need 4`);
  
  // ========== DISCOVERY QUESTION ==========
  const discoverySection = extractSection(content, 'Discovery Question');
  const discoveryQuestion = discoverySection?.replace(/^[""\s]+|[""\s]+$/g, '').trim();
  
  // ========== ENGAGEMENT OPENERS ==========
  const openersSection = extractSection(content, 'Engagement Openers');
  const openersTable = parseMarkdownTable(openersSection);
  const openers = openersTable.map(row => ({
    audience: row.audience || row.Audience || '',
    script: (row.script || row.Script || '').replace(/^[""\s]+|[""\s]+$/g, '')
  }));
  
  if (openers.length < 3) errors.push(`Engagement Openers: found ${openers.length}, need 3`);
  
  // ========== RAPPORT BUILDERS ==========
  const rapportSection = extractSection(content, 'Rapport Builders');
  const rapportLines = rapportSection?.split('\n').filter(l => l.trim().startsWith('-')) || [];
  const rapportBuilders = rapportLines.map(line => {
    // Format 1: - **Entity** (Context) — Usage
    let match = line.match(/\*\*([^*]+)\*\*\s*\(([^)]+)\)\s*[-–—]\s*(.+)/);
    if (match) {
      return {
        entity: match[1].trim(),
        context: `(${match[2].trim()})`,
        usage: match[3].trim()
      };
    }
    // Format 2: - **Entity** — Description (no context)
    match = line.match(/\*\*([^*]+)\*\*\s*[-–—]\s*(.+)/);
    if (match) {
      return {
        entity: match[1].trim(),
        context: '',
        usage: match[2].trim()
      };
    }
    return null;
  }).filter(r => r);
  
  if (rapportBuilders.length < 1) warnings.push('Rapport Builders: found 0, recommend 1-3');
  
  // ========== OBJECTION HANDLING ==========
  const objectionSection = extractSection(content, 'Objection Handling');
  const objectionTable = parseMarkdownTable(objectionSection);
  const objectionHandling = objectionTable.map(row => ({
    theySay: (row.iftheysay || row['if they say'] || '').replace(/^[""\s]+|[""\s]+$/g, ''),
    youSay: (row.yousay || row['you say'] || '').replace(/^[""\s]+|[""\s]+$/g, '')
  }));
  
  if (objectionHandling.length < 3) errors.push(`Objection Handling: found ${objectionHandling.length}, need 3`);
  
  // ========== COST OF INACTION ==========
  const costSection = extractSection(content, 'Cost of Inaction');
  const fiveYearMatch = costSection?.match(/\*\*5-Year Cost\*\*:\s*([^(]+)/);
  const fiveYearCost = fiveYearMatch ? fiveYearMatch[1].trim() : '';
  const fiveYearBasisMatch = costSection?.match(/\*\*5-Year Cost\*\*:[^(]*\(([^)]+)\)/);
  const fiveYearBasis = fiveYearBasisMatch ? fiveYearBasisMatch[1].trim() : '';
  
  const annualCosts = [];
  const reconcMatch = costSection?.match(/Reg reporting reconciliation:\s*([^\n]+)/i);
  if (reconcMatch) annualCosts.push({ item: 'Reg reporting reconciliation', cost: reconcMatch[1].trim() });
  const jurisdMatch = costSection?.match(/Per-jurisdiction implementation:\s*([^\n]+)/i);
  if (jurisdMatch) annualCosts.push({ item: 'Per-jurisdiction implementation', cost: jurisdMatch[1].trim() });
  const tradeMatch = costSection?.match(/Est\. cost per reportable trade:\s*([^\n]+)/i);
  if (tradeMatch) annualCosts.push({ item: 'Est. cost per reportable trade', cost: tradeMatch[1].trim() });
  
  const redeployMatch = costSection?.match(/\*\*Redeployable\*\*:\s*([^\n]+)/);
  const redeployable = redeployMatch ? redeployMatch[1].trim() : '';
  
  const benchmarkMatch = costSection?.match(/\*\*Benchmark\*\*:\s*([^\n]+)/);
  const benchmark = benchmarkMatch ? benchmarkMatch[1].trim() : '';
  
  // ========== LANDMINES ==========
  let landminesSection = extractSection(content, "Landmines (Don't Say)");
  if (!landminesSection) landminesSection = extractSection(content, 'Landmines');
  const landminesTable = parseMarkdownTable(landminesSection);
  const landmines = landminesTable.map(row => {
    const phrase = (row.phrase || row.Phrase || '').replace(/^[""\s]+|[""\s]+$/g, '');
    const whyRaw = row.whysayinstead || row['why / say instead'] || row['whysayinstead'] || row.why || '';
    const sayInsteadMatch = whyRaw.match(/→\s*SAY INSTEAD:\s*[""]?([^""]+)[""]?/i);
    return {
      phrase: phrase,
      reason: sayInsteadMatch ? null : whyRaw.trim(),
      sayInstead: sayInsteadMatch ? sayInsteadMatch[1].trim() : null
    };
  });
  
  if (landmines.length < 4) errors.push(`Landmines: found ${landmines.length}, need 4-6`);
  
  // ========== NEXT ACTIONS ==========
  const nextSection = extractSection(content, 'Next Actions');
  const outreachDeadline = parseBoldValue(nextSection, 'Outreach Deadline');
  const deadlineRationale = parseBoldValue(nextSection, 'Rationale');
  const primaryAskRaw = parseBoldValue(nextSection, 'Primary Ask');
  const fallback = parseBoldValue(nextSection, 'Fallback');
  
  // Parse primary ask into components
  let primaryAsk = { action: '', target: '', objective: '' };
  if (primaryAskRaw) {
    const askMatch = primaryAskRaw.match(/(.+?)\s+with\s+(.+?)\s+to\s+(.+)/i);
    if (askMatch) {
      primaryAsk = { action: askMatch[1].trim(), target: askMatch[2].trim(), objective: askMatch[3].trim() };
    } else {
      primaryAsk = { action: primaryAskRaw, target: 'TBD', objective: 'TBD' };
    }
  }
  
  // Email template
  const emailSection = extractSubSection(content, 'Email Template');
  const emailSubject = parseBoldValue(emailSection, 'Subject');
  const emailBodyMatch = emailSection?.match(/\*\*Body\*\*:\s*(.+)/s);
  const emailBody = emailBodyMatch ? emailBodyMatch[1].trim() : '';
  
  // Call agenda
  const agendaSection = extractSubSection(content, '30-Min Call Agenda');
  const agendaTable = parseMarkdownTable(agendaSection);
  const callAgenda = agendaTable.map(row => ({
    duration: row.duration || row.Duration || '',
    topic: row.topic || row.Topic || ''
  }));
  
  // Success indicators
  const successSection = extractSubSection(content, 'Success Indicators');
  const successTable = parseMarkdownTable(successSection);
  const successIndicators = successTable.map(row => {
    const signal = row.signal || row.Signal || '';
    return {
      signal: signal.replace(/^[✓✗]\s*/, '').trim(),
      meaning: row.meaning || row.Meaning || '',
      positive: signal.includes('✓') || !signal.includes('✗')
    };
  });
  
  // Follow-up cadence
  const followSection = extractSubSection(content, 'Follow-Up Cadence');
  const followTable = parseMarkdownTable(followSection);
  const followUpCadence = followTable.map(row => ({
    day: parseInt(row.day || row.Day || '0'),
    action: row.action || row.Action || ''
  }));
  
  // Discovery questions
  const questionsSection = extractSubSection(content, 'Key Discovery Questions');
  const discoveryQuestions = parseBulletList(questionsSection);
  
  // ========== CONFIDENCE NOTES ==========
  const confidenceSection = extractSection(content, 'Confidence Notes');
  const confidenceNotes = confidenceSection?.split('\n')[0]?.replace(/^[>\s]+/, '').trim() || '';
  const nextReviewMatch = confidenceSection?.match(/\*\*Next Review\*\*:\s*(.+)/);
  const nextReview = nextReviewMatch ? nextReviewMatch[1].trim() : 'Q1 2026';
  
  // ========== ADDITIONAL VALIDATIONS ==========
  if (!emailSubject) errors.push('Missing: Next Actions > Email Template > Subject');
  if (!emailBody || emailBody.length < 50) errors.push('Missing or too short: Next Actions > Email Template > Body');
  if (callAgenda.length < 4) warnings.push(`Call Agenda: found ${callAgenda.length}, recommend 4`);
  if (discoveryQuestions.length < 3) warnings.push(`Discovery Questions: found ${discoveryQuestions.length}, recommend 3`);
  
  // ========== BUILD OUTPUT ==========
  const output = {
    bank: {
      name: bankName,
      shortName: inferShortName(bankName),
      classification: archetype,
      confidence: confidence,
      headquarters: headquarters,
      derivativesTier: derivativesTier,
      derivativesNotional: derivativesNotional,
      revenue2023: revenue2023,
      finosTier: finosTier,
      techStack: techStack,
      emirVendor: emirVendor === 'Unknown' ? null : emirVendor,
      similarBanks: similarBanks
    },
    positioning: {
      keyImplication: keyImplication,
      bullets: bullets.slice(0, 3),
      timing: {
        urgency: urgency,
        rationale: rationale
      }
    },
    evidence: evidence,
    leadWith: leadWith,
    competitivePosition: competitivePosition,
    peerPressureScript: {
      text: peerPressureText,
      warning: peerWarning
    },
    regulatoryUrgency: regulatoryUrgency,
    regulatoryFootnote: regulatoryFootnote,
    discoveryQuestion: discoveryQuestion,
    engagementAngles: {
      openers: openers,
      rapportBuilders: rapportBuilders
    },
    objectionHandling: objectionHandling,
    costOfInaction: {
      fiveYearCost: fiveYearCost,
      fiveYearBasis: fiveYearBasis,
      annualCosts: annualCosts,
      redeployable: redeployable,
      benchmark: benchmark
    },
    landmines: landmines,
    nextActions: {
      outreachDeadline: outreachDeadline,
      deadlineRationale: deadlineRationale,
      primaryAsk: primaryAsk,
      fallback: fallback,
      emailTemplate: {
        subject: emailSubject,
        body: emailBody
      },
      callAgenda: callAgenda,
      successIndicators: successIndicators,
      followUpCadence: followUpCadence,
      discoveryQuestions: discoveryQuestions
    },
    confidenceNotes: confidenceNotes,
    nextReview: nextReview
  };
  
  return { data: output, errors: errors, warnings: warnings };
}

// ============================================================================
// EXECUTION
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node parser.js <research_file.md> [output_dir]');
    console.error('       node parser.js --batch <research_dir> [output_dir]');
    process.exit(1);
  }

  if (args[0] === '--batch') {
    const researchDir = args[1] || './research';
    const outputDir = args[2] || './extracted';
    
    const files = fs.readdirSync(researchDir).filter(f => f.endsWith('.md') && f !== 'TEMPLATE.md');
    
    console.log(`\n═══════════════════════════════════════════════`);
    console.log(`PARSING: ${files.length} research files`);
    console.log(`═══════════════════════════════════════════════\n`);
    
    let success = 0;
    const failed = [];
    
    files.forEach((file, idx) => {
      const content = fs.readFileSync(path.join(researchDir, file), 'utf8');
      const result = parseResearchMarkdown(content, file);
      
      if (result.errors.length === 0) {
        const outputFile = path.join(outputDir, file.replace('.md', '.json'));
        fs.writeFileSync(outputFile, JSON.stringify(result.data, null, 2));
        console.log(`[${idx + 1}/${files.length}] ✓ ${result.data.bank.name}`);
        if (result.warnings.length > 0) {
          result.warnings.forEach(w => console.log(`    ⚠️ ${w}`));
        }
        success++;
      } else {
        console.log(`[${idx + 1}/${files.length}] ✗ ${file}`);
        result.errors.forEach(e => console.log(`    ❌ ${e}`));
        failed.push({ file, errors: result.errors });
      }
    });
    
    console.log(`\n═══════════════════════════════════════════════`);
    console.log(`PARSE COMPLETE: ${success}/${files.length} successful`);
    if (failed.length > 0) {
      console.log(`\nFailed files:`);
      failed.forEach(f => console.log(`  - ${f.file}: ${f.errors[0]}`));
    }
    console.log(`═══════════════════════════════════════════════\n`);
    
  } else {
    const inputFile = args[0];
    const outputDir = args[1] || './extracted';
    
    if (!fs.existsSync(inputFile)) {
      console.error(`Error: File not found: ${inputFile}`);
      process.exit(1);
    }
    
    const content = fs.readFileSync(inputFile, 'utf8');
    const result = parseResearchMarkdown(content, inputFile);
    
    if (result.errors.length > 0) {
      console.error('Parsing errors:');
      result.errors.forEach(e => console.error(`  ❌ ${e}`));
      process.exit(1);
    }
    
    const outputFile = path.join(outputDir, path.basename(inputFile).replace('.md', '.json'));
    fs.writeFileSync(outputFile, JSON.stringify(result.data, null, 2));
    console.log(`✓ Parsed: ${inputFile}`);
    console.log(`✓ Output: ${outputFile}`);
    
    if (result.warnings.length > 0) {
      result.warnings.forEach(w => console.log(`  ⚠️ ${w}`));
    }
  }
}

module.exports = { parseResearchMarkdown };
