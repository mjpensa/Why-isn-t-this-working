/**
 * CDM/DRR Regional Data Aggregator (Enhanced)
 * 
 * Extracts and synthesizes data from individual bank JSON files
 * into regional summaries for synthesis fact sheets.
 * 
 * Enhancements P1-P7:
 * - P1: Key Insight generation
 * - P2: Structured deadlines
 * - P3: Urgency badge assignment
 * - P4: Readiness score calculation
 * - P5: Priority actions generation
 * - P6: DRR indicators for spectrum
 * - P7: Confidence metrics
 * 
 * Usage: node regional_aggregator.js <extracted_dir> <output_dir>
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// REGIONAL CONFIGURATION
// ============================================================================

const REGIONS = {
  'US_GSIB': {
    name: 'US G-SIBs',
    displayName: 'US Global Systemically Important Banks',
    banks: ['JPMorgan Chase', 'Goldman Sachs', 'Morgan Stanley', 'Citigroup', 'Bank of America', 'Wells Fargo', 'BNY Mellon', 'State Street'],
    regulatoryContext: 'CFTC +40, Dodd-Frank reporting requirements',
    keyDeadlines: ['CFTC +40 (TBD)', 'HK/Canada cross-border (End 2025)']
  },
  'EU_GSIB': {
    name: 'European G-SIBs',
    displayName: 'European Global Systemically Important Banks',
    banks: ['Deutsche Bank', 'BNP Paribas', 'Barclays', 'HSBC', 'Société Générale', 'UBS', 'Credit Suisse'],
    regulatoryContext: 'EMIR Refit, UK EMIR, MiFID II reporting',
    keyDeadlines: ['EMIR Refit (Apr 2024 - Done)', 'UK EMIR (Sep 2024)']
  },
  'EU_TIER2': {
    name: 'European Tier 2',
    displayName: 'European Tier 2 Banks',
    banks: ['Crédit Agricole', 'ING', 'Santander', 'BBVA', 'UniCredit', 'Intesa Sanpaolo', 'Nordea', 'Standard Chartered'],
    regulatoryContext: 'EMIR Refit, national variations',
    keyDeadlines: ['EMIR Refit (Apr 2024 - Done)']
  },
  'JAPAN': {
    name: 'Japanese Banks',
    displayName: 'Japanese Major Banks',
    banks: ['Nomura', 'Mizuho', 'MUFG', 'Sumitomo Mitsui', 'Daiwa'],
    regulatoryContext: 'JFSA reporting, ISDA alignment',
    keyDeadlines: ['JFSA derivatives reporting (ongoing)']
  },
  'CHINA': {
    name: 'Chinese Banks',
    displayName: 'Chinese Major Banks',
    banks: ['ICBC', 'China Construction Bank', 'Bank of China', 'Agricultural Bank of China', 'CITIC'],
    regulatoryContext: 'CBIRC requirements, cross-border considerations',
    keyDeadlines: ['CBIRC derivatives rules (evolving)']
  }
};

// ============================================================================
// CORE AGGREGATION FUNCTIONS
// ============================================================================

function loadBankData(extractedDir) {
  const files = fs.readdirSync(extractedDir).filter(f => f.endsWith('.json'));
  const banks = [];
  
  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(extractedDir, file), 'utf8'));
      banks.push(data);
    } catch (err) {
      console.warn(`Warning: Could not load ${file}: ${err.message}`);
    }
  });
  
  return banks;
}

function matchBankToRegion(bankName, regions) {
  for (const [regionId, config] of Object.entries(regions)) {
    const match = config.banks.find(configBank => 
      bankName.toLowerCase().includes(configBank.toLowerCase()) ||
      configBank.toLowerCase().includes(bankName.toLowerCase())
    );
    if (match) return regionId;
  }
  return null;
}

function getDRRStatus(bank) {
  const selfRow = bank.competitivePosition?.find(p => p.highlight);
  return selfRow?.drr || 'Unknown';
}

// ============================================================================
// P4: READINESS SCORE CALCULATION
// ============================================================================

function calculateReadinessScore(banks) {
  const engaged = banks.filter(b => {
    const drrStatus = getDRRStatus(b);
    return drrStatus === 'Yes' || drrStatus === 'Tested';
  }).length;
  
  const total = banks.length;
  const percentage = total > 0 ? Math.round((engaged / total) * 100) : 0;
  
  return {
    engaged,
    total,
    percentage,
    display: `${engaged}/${total}`
  };
}

// ============================================================================
// P7: CONFIDENCE METRICS
// ============================================================================

function calculateConfidenceMetrics(banks) {
  const scores = banks.map(b => b.bank?.confidence || 3);
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 3;
  
  // Generate visual indicator (5 dots)
  const filled = Math.round(avg);
  const display = '●'.repeat(Math.min(filled, 5)) + '○'.repeat(Math.max(0, 5 - filled));
  
  // Identify low-confidence banks (< 3)
  const lowConfidenceBanks = banks
    .filter(b => (b.bank?.confidence || 3) < 3)
    .map(b => b.bank.shortName);
  
  return {
    score: Math.round(avg * 10) / 10,
    display,
    lowConfidenceBanks
  };
}

// ============================================================================
// P1: KEY INSIGHT GENERATION
// ============================================================================

function generateKeyInsight(banks, config, archetypeDist, readinessScore) {
  const architects = archetypeDist.ARCHITECT.length;
  const pragmatists = archetypeDist.PRAGMATIST.length;
  const observers = archetypeDist.OBSERVER.length;
  
  // Find high-urgency banks
  const highUrgencyBanks = banks.filter(b => {
    const urgency = b.positioning?.timing?.urgency || '';
    return urgency.toLowerCase().includes('high') || 
           urgency.toLowerCase().includes('urgent');
  });
  
  // Generate insight based on composition
  if (architects > 0 && pragmatists > 0) {
    const deadlinePressure = highUrgencyBanks.length > 0 ? ' with regulatory deadline pressure' : '';
    return `${config.name} primed for acceleration — ${architects} ARCHITECT${architects > 1 ? 's' : ''} available as proof point${architects > 1 ? 's' : ''}, ${pragmatists} PRAGMATIST${pragmatists > 1 ? 's' : ''} convertible${deadlinePressure}.`;
  } else if (architects > 0 && observers > 0) {
    return `${config.name} bifurcated — leverage ${architects} ARCHITECT${architects > 1 ? 's' : ''} to educate ${observers} OBSERVER${observers > 1 ? 's' : ''} on peer momentum.`;
  } else if (pragmatists >= banks.length / 2) {
    return `${config.name} at inflection point — ${pragmatists} PRAGMATISTs awaiting peer signal. First mover creates cascade.`;
  } else if (observers >= banks.length / 2) {
    return `${config.name} requires market development — ${observers} OBSERVERs need education before sales engagement.`;
  } else if (architects >= banks.length / 2) {
    return `${config.name} leads CDM/DRR adoption — ${architects} ARCHITECTs available for co-marketing and reference programs.`;
  } else {
    return `${config.name}: Mixed adoption landscape — tailor approach per bank based on individual readiness.`;
  }
}

// ============================================================================
// P2: DEADLINE STRUCTURING
// ============================================================================

function structureDeadlines(banks, config) {
  const deadlineMap = {};
  
  // Extract deadlines from regulatory urgency data
  banks.forEach(bank => {
    const regData = bank.regulatoryUrgency || [];
    regData.forEach(reg => {
      const key = reg.regulation || reg.name;
      if (!key) return;
      
      if (!deadlineMap[key]) {
        deadlineMap[key] = {
          name: key,
          date: reg.deadline || 'TBD',
          status: determineDeadlineStatus(reg),
          affectedBanks: [],
          isActive: false
        };
      }
      if (bank.bank?.shortName) {
        deadlineMap[key].affectedBanks.push(bank.bank.shortName);
      }
    });
  });
  
  // Also parse from config keyDeadlines as fallback
  if (Object.keys(deadlineMap).length === 0 && config.keyDeadlines) {
    config.keyDeadlines.forEach(dl => {
      const match = dl.match(/^(.+?)\s*\((.+?)\)$/);
      if (match) {
        const name = match[1].trim();
        const dateInfo = match[2].trim();
        const isDone = dateInfo.toLowerCase().includes('done');
        deadlineMap[name] = {
          name,
          date: dateInfo.replace(/\s*-?\s*done/i, '').trim(),
          status: isDone ? 'Done' : 'Active',
          affectedBanks: banks.map(b => b.bank?.shortName).filter(Boolean),
          isActive: !isDone
        };
      }
    });
  }
  
  // Mark active deadlines
  const deadlines = Object.values(deadlineMap).map(d => {
    d.isActive = d.status === 'Upcoming' || d.status === 'Active';
    return d;
  });
  
  // Sort: Active first, then by status
  return deadlines.sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return 0;
  });
}

function determineDeadlineStatus(reg) {
  const status = reg.status || reg.bankStatus || '';
  if (status.toLowerCase().includes('done') || status.includes('✓')) return 'Done';
  if (status.toLowerCase().includes('upcoming') || status.includes('⟳')) return 'Upcoming';
  return 'Active';
}

// ============================================================================
// P3: URGENCY BADGE ASSIGNMENT
// ============================================================================

function assignUrgencyBadge(bank) {
  const urgency = bank.positioning?.timing?.urgency || '';
  const rationale = bank.positioning?.timing?.rationale || urgency;
  
  let badge = 'MED';
  if (urgency.toLowerCase().includes('high') || 
      urgency.toLowerCase().includes('urgent') ||
      urgency.toLowerCase().includes('immediate')) {
    badge = 'HIGH';
  } else if (urgency.toLowerCase().includes('low') || 
             urgency.toLowerCase().includes('minimal') ||
             urgency.toLowerCase().includes('reference')) {
    badge = 'LOW';
  }
  
  // Truncate rationale for display
  const shortRationale = rationale.length > 40 
    ? rationale.substring(0, 37) + '...' 
    : rationale;
  
  return {
    badge,
    rationale: shortRationale
  };
}

// ============================================================================
// P5: PRIORITY ACTIONS GENERATION
// ============================================================================

function generatePriorityActions(recommendedSequence, banks) {
  const actionTemplates = {
    'ARCHITECT': {
      'Reference customer': 'Schedule reference program discussion',
      'Co-marketing': 'Schedule co-marketing partnership call',
      'reference': 'Schedule reference program discussion',
      'co-market': 'Schedule co-marketing partnership call',
      'default': 'Schedule expansion use case discussion'
    },
    'PRAGMATIST': {
      'Regulatory deadline': 'Prepare deadline impact assessment deck',
      'Peer pressure': 'Draft introduction citing peer adoption',
      'deadline': 'Prepare regulatory deadline impact deck',
      'peer': 'Draft intro citing peer momentum',
      'default': 'Prepare ROI business case presentation'
    },
    'OBSERVER': {
      'Education': 'Schedule CDM/DRR awareness briefing',
      'default': 'Add to educational nurture campaign'
    }
  };
  
  return recommendedSequence.slice(0, 3).map((item, idx) => {
    const archetype = item.archetype;
    const rationale = (item.rationale || '').toLowerCase();
    const templates = actionTemplates[archetype] || actionTemplates['OBSERVER'];
    
    // Find matching template
    let action = templates['default'];
    for (const [key, value] of Object.entries(templates)) {
      if (key !== 'default' && rationale.includes(key.toLowerCase())) {
        action = value;
        break;
      }
    }
    
    return {
      bank: item.shortName,
      action,
      timeframe: `Week ${idx + 1}`,
      owner: '[Sales Rep]'
    };
  });
}

// ============================================================================
// P6: DRR INDICATOR & NOTIONAL DISPLAY
// ============================================================================

function getDRRIndicator(drrStatus) {
  switch (drrStatus) {
    case 'Yes': return '●';      // Filled circle = Live
    case 'Tested': return '○';   // Open circle = Tested
    case 'Unknown': return '?';  // Question mark = Unknown
    default: return '—';         // Dash = No evidence
  }
}

function getNotionalDisplay(bank) {
  const notional = bank.bank?.derivativesNotional || '';
  const match = notional.match(/\$?([\d.]+)\s*(trillion|billion)/i);
  if (match) {
    const unit = match[2].toLowerCase() === 'trillion' ? 'T' : 'B';
    return `$${match[1]}${unit}`;
  }
  return '—';
}

// ============================================================================
// EXISTING AGGREGATION FUNCTIONS (Enhanced)
// ============================================================================

function calculateArchetypeDistribution(banks) {
  const dist = { ARCHITECT: [], PRAGMATIST: [], OBSERVER: [] };
  banks.forEach(bank => {
    const archetype = bank.bank?.classification;
    if (dist[archetype]) {
      const drrStatus = getDRRStatus(bank);
      dist[archetype].push({
        name: bank.bank.name,
        shortName: bank.bank.shortName,
        confidence: bank.bank.confidence,
        drrStatus: drrStatus,
        drrIndicator: getDRRIndicator(drrStatus),  // P6
        timing: bank.positioning?.timing?.urgency || 'Unknown',
        notional: getNotionalDisplay(bank)  // P6
      });
    }
  });
  return dist;
}

function extractCommonPatterns(banks, field, minOccurrences = 2) {
  const counts = {};
  
  banks.forEach(bank => {
    let items = [];
    
    if (field === 'objections') {
      items = bank.objectionHandling?.map(o => o.theySay) || [];
    } else if (field === 'landmines') {
      items = bank.landmines?.map(l => l.phrase) || [];
    }
    
    items.forEach(item => {
      const normalized = item.toLowerCase().trim();
      counts[normalized] = counts[normalized] || { text: item, count: 0, banks: [] };
      counts[normalized].count++;
      counts[normalized].banks.push(bank.bank.shortName);
    });
  });
  
  return Object.values(counts)
    .filter(c => c.count >= minOccurrences)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function calculateTotalNotional(banks) {
  let total = 0;
  
  banks.forEach(bank => {
    const notional = bank.bank?.derivativesNotional || '';
    const match = notional.match(/\$?([\d.]+)\s*(trillion|billion)/i);
    if (match) {
      let value = parseFloat(match[1]);
      if (match[2].toLowerCase() === 'billion') value /= 1000;
      total += value;
    }
  });
  
  return `~$${total.toFixed(0)} trillion`;
}

function determineRecommendedSequence(banks) {
  const tierOrder = { ARCHITECT: 0, PRAGMATIST: 1, OBSERVER: 2 };
  
  return [...banks].sort((a, b) => {
    const tierDiff = tierOrder[a.bank.classification] - tierOrder[b.bank.classification];
    if (tierDiff !== 0) return tierDiff;
    
    // Within tier, prioritize high urgency
    const aUrgency = (a.positioning?.timing?.urgency || '').toLowerCase();
    const bUrgency = (b.positioning?.timing?.urgency || '').toLowerCase();
    const aHigh = aUrgency.includes('high') || aUrgency.includes('urgent');
    const bHigh = bUrgency.includes('high') || bUrgency.includes('urgent');
    if (aHigh && !bHigh) return -1;
    if (!aHigh && bHigh) return 1;
    
    // Then by confidence
    return (b.bank.confidence || 0) - (a.bank.confidence || 0);
  }).map((bank, idx) => ({
    rank: idx + 1,
    name: bank.bank.name,
    shortName: bank.bank.shortName,
    archetype: bank.bank.classification,
    rationale: getSequenceRationale(bank, idx)
  }));
}

function getSequenceRationale(bank, idx) {
  const archetype = bank.bank.classification;
  const drrStatus = getDRRStatus(bank);
  const urgency = bank.positioning?.timing?.urgency || '';
  
  if (archetype === 'ARCHITECT') {
    if (drrStatus === 'Yes') return 'Reference customer — leverage for peer selling';
    return 'Active contributor — co-marketing opportunity';
  } else if (archetype === 'PRAGMATIST') {
    if (urgency.toLowerCase().includes('high') || urgency.toLowerCase().includes('urgent')) {
      return 'High urgency — regulatory deadline creates opening';
    }
    return 'Will follow if peers move — use ARCHITECT proof points';
  } else {
    return 'Education target — long-term nurture';
  }
}

function identifyCrossSellingOpportunities(banks) {
  const opportunities = [];
  
  // Find shared vendors
  const vendorGroups = {};
  banks.forEach(bank => {
    const vendor = bank.bank?.emirVendor;
    if (vendor && vendor !== 'Unknown' && vendor !== null) {
      vendorGroups[vendor] = vendorGroups[vendor] || [];
      vendorGroups[vendor].push(bank.bank.shortName);
    }
  });
  
  Object.entries(vendorGroups).forEach(([vendor, bankList]) => {
    if (bankList.length >= 2) {
      opportunities.push({
        type: 'Shared Vendor',
        banks: bankList,
        description: `${bankList.join(', ')} share ${vendor} — joint implementation opportunity`
      });
    }
  });
  
  // Find shared tech stack patterns
  const techGroups = {};
  banks.forEach(bank => {
    const tech = bank.bank?.techStack;
    if (tech) {
      const key = tech.toLowerCase().includes('murex') ? 'Murex' :
                  tech.toLowerCase().includes('calypso') ? 'Calypso' :
                  tech.toLowerCase().includes('internal') ? 'Internal Build' : null;
      if (key) {
        techGroups[key] = techGroups[key] || [];
        techGroups[key].push(bank.bank.shortName);
      }
    }
  });
  
  Object.entries(techGroups).forEach(([tech, bankList]) => {
    if (bankList.length >= 2) {
      opportunities.push({
        type: 'Shared Platform',
        banks: bankList,
        description: `${bankList.join(', ')} use ${tech} — shared learnings potential`
      });
    }
  });
  
  // Find FINOS members
  const finosMembers = banks
    .filter(b => b.bank?.finosTier && !b.bank.finosTier.toLowerCase().includes('none'))
    .map(b => b.bank.shortName);
  
  if (finosMembers.length >= 2) {
    opportunities.push({
      type: 'FINOS Consortium',
      banks: finosMembers,
      description: `${finosMembers.join(', ')} are FINOS members — propose working group collaboration`
    });
  }
  
  return opportunities.slice(0, 4);
}

function generateEntryPoint(bank) {
  const archetype = bank.bank.classification;
  const drrStatus = getDRRStatus(bank);
  const urgency = bank.positioning?.timing?.urgency || '';
  
  if (archetype === 'ARCHITECT' && drrStatus === 'Yes') {
    return 'Reference customer';
  } else if (archetype === 'ARCHITECT') {
    return 'Co-marketing';
  } else if (urgency.toLowerCase().includes('high') || 
             urgency.toLowerCase().includes('urgent') ||
             urgency.toLowerCase().includes('hk') || 
             urgency.toLowerCase().includes('canada') ||
             urgency.toLowerCase().includes('deadline')) {
    return 'Regulatory deadline';
  } else if (archetype === 'PRAGMATIST') {
    return 'Peer pressure';
  } else {
    return 'Education';
  }
}

function extractRegionalSensitivity(banks) {
  const commonLandmines = extractCommonPatterns(banks, 'landmines', 1);
  if (commonLandmines.length > 0) {
    return {
      phrase: commonLandmines[0].text,
      frequency: commonLandmines[0].count,
      banks: commonLandmines[0].banks
    };
  }
  return null;
}

function generateBottomLine(banks, config, dominantArchetype) {
  const architectCount = banks.filter(b => b.bank.classification === 'ARCHITECT').length;
  const pragmatistCount = banks.filter(b => b.bank.classification === 'PRAGMATIST').length;
  const observerCount = banks.filter(b => b.bank.classification === 'OBSERVER').length;
  
  if (architectCount >= banks.length / 2) {
    return `${config.name} leads CDM/DRR adoption — focus on co-marketing and reference programs with ${architectCount} ARCHITECTs.`;
  } else if (pragmatistCount >= banks.length / 2) {
    return `${config.name} primed for acceleration — ${pragmatistCount} PRAGMATISTs ready to move once peer proof points emerge.`;
  } else if (observerCount >= banks.length / 2) {
    return `${config.name} requires education investment — ${observerCount} OBSERVERs need awareness before sales engagement.`;
  } else {
    return `${config.name} shows mixed adoption — lead with ${architectCount > 0 ? 'ARCHITECTs as proof points' : 'regulatory urgency'} to accelerate PRAGMATISTs.`;
  }
}

// ============================================================================
// MAIN AGGREGATION (Enhanced with P1-P7)
// ============================================================================

function aggregateRegionalData(extractedDir) {
  const allBanks = loadBankData(extractedDir);
  console.log(`Loaded ${allBanks.length} bank profiles\n`);
  
  const regionalData = {};
  
  // Group banks by region
  const banksByRegion = {};
  allBanks.forEach(bank => {
    const regionId = matchBankToRegion(bank.bank.name, REGIONS);
    if (regionId) {
      banksByRegion[regionId] = banksByRegion[regionId] || [];
      banksByRegion[regionId].push(bank);
    } else {
      console.warn(`Warning: Could not match "${bank.bank.name}" to any region`);
    }
  });
  
  // Aggregate each region
  for (const [regionId, config] of Object.entries(REGIONS)) {
    const banks = banksByRegion[regionId] || [];
    
    if (banks.length === 0) {
      console.log(`⚠️  ${config.name}: No banks found`);
      continue;
    }
    
    console.log(`✓ ${config.name}: ${banks.length} banks`);
    
    // Core calculations
    const archetypeDist = calculateArchetypeDistribution(banks);
    const dominantArchetype = Object.entries(archetypeDist)
      .sort((a, b) => b[1].length - a[1].length)[0][0];
    
    // P4: Readiness Score
    const readinessScore = calculateReadinessScore(banks);
    
    // P7: Confidence Metrics
    const avgConfidence = calculateConfidenceMetrics(banks);
    
    // P2: Structured Deadlines
    const deadlines = structureDeadlines(banks, config);
    
    // Recommended Sequence (needed for P5)
    const recommendedSequence = determineRecommendedSequence(banks);
    
    // P5: Priority Actions
    const priorityActions = generatePriorityActions(recommendedSequence, banks);
    
    // P1: Key Insight
    const keyInsight = generateKeyInsight(banks, config, archetypeDist, readinessScore);
    
    regionalData[regionId] = {
      meta: {
        regionId,
        name: config.name,
        displayName: config.displayName,
        bankCount: banks.length,
        generatedAt: new Date().toISOString()
      },
      summary: {
        totalNotional: calculateTotalNotional(banks),
        dominantArchetype,
        archetypeDistribution: {
          ARCHITECT: archetypeDist.ARCHITECT.length,
          PRAGMATIST: archetypeDist.PRAGMATIST.length,
          OBSERVER: archetypeDist.OBSERVER.length
        },
        regulatoryContext: config.regulatoryContext,
        keyDeadlines: config.keyDeadlines,
        // P4: Readiness Score
        readinessScore,
        // P1: Key Insight
        keyInsight,
        // P7: Confidence
        avgConfidence
      },
      // P2: Structured Deadlines
      deadlines,
      // P6: Enhanced maturity spectrum with DRR indicators
      maturitySpectrum: {
        ARCHITECT: archetypeDist.ARCHITECT,
        PRAGMATIST: archetypeDist.PRAGMATIST,
        OBSERVER: archetypeDist.OBSERVER
      },
      patterns: {
        commonObjections: extractCommonPatterns(banks, 'objections', 2),
        regionalSensitivity: extractRegionalSensitivity(banks)
      },
      // P3: Enhanced bank quick reference with urgency badges
      bankQuickReference: banks.map(bank => {
        const urgencyData = assignUrgencyBadge(bank);
        return {
          name: bank.bank.name,
          shortName: bank.bank.shortName,
          archetype: bank.bank.classification,
          drrStatus: getDRRStatus(bank),
          urgency: urgencyData.badge,
          urgencyRationale: urgencyData.rationale,
          entryPoint: generateEntryPoint(bank),
          confidence: bank.bank.confidence,
          notionalDisplay: getNotionalDisplay(bank)
        };
      }).sort((a, b) => {
        const order = { ARCHITECT: 0, PRAGMATIST: 1, OBSERVER: 2 };
        return order[a.archetype] - order[b.archetype];
      }),
      recommendedSequence,
      // P5: Priority Actions
      priorityActions,
      crossSellingOpportunities: identifyCrossSellingOpportunities(banks),
      bottomLine: generateBottomLine(banks, config, dominantArchetype)
    };
  }
  
  return regionalData;
}

// ============================================================================
// EXECUTION
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const extractedDir = args[0] || './extracted';
  const outputDir = args[1] || './regional';
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('CDM/DRR REGIONAL DATA AGGREGATOR (Enhanced P1-P7)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const regionalData = aggregateRegionalData(extractedDir);
  
  // Write individual region files
  for (const [regionId, data] of Object.entries(regionalData)) {
    const outputFile = path.join(outputDir, `${regionId.toLowerCase()}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
  }
  
  // Write combined file
  const combinedFile = path.join(outputDir, 'all_regions.json');
  fs.writeFileSync(combinedFile, JSON.stringify(regionalData, null, 2));
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`✓ Generated ${Object.keys(regionalData).length} regional profiles`);
  console.log(`✓ Output: ${outputDir}/`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

module.exports = { aggregateRegionalData, REGIONS };
