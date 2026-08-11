/**
 * Core Data Processing Engine
 * Handles schema mapping, metric computation (CTR, CR, CPI), cleaning algorithms, and health score audit.
 */

class DataEngine {
  constructor() {
    this.rawData = [];
    this.cleanedData = [];
    this.schema = {
      dateCol: null,
      channelCol: null,
      impressionsCol: null,
      clicksCol: null,
      installsCol: null,
      conversionsCol: null,
      costCol: null
    };
    this.cleaningAudit = {
      initialRows: 0,
      duplicatesRemoved: 0,
      blanksRemoved: 0,
      missingValuesFilled: 0,
      healthScore: 100
    };
  }

  loadData(dataset) {
    this.rawData = dataset;
    this.cleanedData = JSON.parse(JSON.stringify(dataset)); // Deep clone
    this.cleaningAudit.initialRows = dataset.length;
    this.detectSchema();
    this.calculateMetrics();
    this.updateHealthScore();
    return this.cleanedData;
  }

  detectSchema() {
    if (!this.rawData || this.rawData.length === 0) return;
    const sample = this.rawData[0];
    const keys = Object.keys(sample);

    // Schema column mapping matching helper
    const findCol = (regexList) => {
      return keys.find(k => regexList.some(r => r.test(k.toLowerCase()))) || null;
    };

    this.schema.dateCol = findCol([/date/, /time/, /day/, /timestamp/]);
    this.schema.channelCol = findCol([/channel/, /platform/, /source/, /medium/, /network/]);
    this.schema.impressionsCol = findCol([/impression/, /impr/, /views/]);
    this.schema.clicksCol = findCol([/click/, /taps/]);
    this.schema.installsCol = findCol([/install/, /download/, /app_install/]);
    this.schema.conversionsCol = findCol([/conversion/, /conv/, /goal/, /action/, /purchase/]);
    this.schema.costCol = findCol([/cost/, /spend/, /spend_usd/, /price/, /amount/]);

    console.log("Auto-detected Schema:", this.schema);
  }

  calculateMetrics(dataList = this.cleanedData) {
    const { impressionsCol, clicksCol, installsCol, conversionsCol, costCol } = this.schema;

    dataList.forEach(row => {
      const impr = parseFloat(row[impressionsCol]) || 0;
      const clicks = parseFloat(row[clicksCol]) || 0;
      const installs = parseFloat(row[installsCol]) || 0;
      const conv = parseFloat(row[conversionsCol]) || 0;
      const cost = parseFloat(row[costCol]) || 0;

      // CTR (%)
      row['CTR (%)'] = impr > 0 ? parseFloat(((clicks / impr) * 100).toFixed(2)) : 0;

      // Conversion Rate (%) -> Conversions / Clicks (or Installs if Clicks is 0)
      row['Conversion_Rate (%)'] = clicks > 0 ? parseFloat(((conv / clicks) * 100).toFixed(2)) : 0;

      // CPI ($) -> Cost / Installs
      row['CPI ($)'] = installs > 0 ? parseFloat((cost / installs).toFixed(2)) : 0;

      // CPC ($) -> Cost / Clicks
      row['CPC ($)'] = clicks > 0 ? parseFloat((cost / clicks).toFixed(2)) : 0;
    });
  }

  // --- Data Cleaning Algorithms ---

  removeDuplicates() {
    const beforeCount = this.cleanedData.length;
    const seen = new Set();
    const uniqueRows = [];

    this.cleanedData.forEach(row => {
      // Stringify row values (excluding computed columns)
      const coreRow = { ...row };
      delete coreRow['CTR (%)'];
      delete coreRow['Conversion_Rate (%)'];
      delete coreRow['CPI ($)'];
      delete coreRow['CPC ($)'];

      const key = JSON.stringify(coreRow);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRows.push(row);
      }
    });

    const removed = beforeCount - uniqueRows.length;
    this.cleanedData = uniqueRows;
    this.cleaningAudit.duplicatesRemoved += removed;
    this.updateHealthScore();
    return removed;
  }

  removeBlanks() {
    const beforeCount = this.cleanedData.length;
    const filtered = this.cleanedData.filter(row => {
      return Object.values(row).every(val => val !== null && val !== undefined && val !== '');
    });

    const removed = beforeCount - filtered.length;
    this.cleanedData = filtered;
    this.cleaningAudit.blanksRemoved += removed;
    this.updateHealthScore();
    return removed;
  }

  handleMissingValues(strategy = 'mean') {
    let fillCount = 0;
    const numericCols = Object.keys(this.schema)
      .map(k => this.schema[k])
      .filter(col => col && col !== this.schema.dateCol && col !== this.schema.channelCol);

    numericCols.forEach(col => {
      // Calculate fill value
      let fillVal = 0;
      const validVals = this.cleanedData
        .map(r => parseFloat(r[col]))
        .filter(v => !isNaN(v) && v !== null);

      if (strategy === 'mean' && validVals.length > 0) {
        fillVal = validVals.reduce((a, b) => a + b, 0) / validVals.length;
      } else if (strategy === 'median' && validVals.length > 0) {
        const sorted = [...validVals].sort((a, b) => a - b);
        fillVal = sorted[Math.floor(sorted.length / 2)];
      } else if (strategy === 'zero') {
        fillVal = 0;
      }

      this.cleanedData.forEach(row => {
        if (row[col] === null || row[col] === undefined || row[col] === '' || isNaN(row[col])) {
          row[col] = Math.round(fillVal * 100) / 100;
          fillCount++;
        }
      });
    });

    this.cleaningAudit.missingValuesFilled += fillCount;
    this.calculateMetrics();
    this.updateHealthScore();
    return fillCount;
  }

  updateHealthScore() {
    if (this.cleanedData.length === 0) {
      this.cleaningAudit.healthScore = 0;
      return;
    }

    let incompleteRows = 0;
    this.cleanedData.forEach(row => {
      const hasNull = Object.values(row).some(v => v === null || v === undefined || v === '');
      if (hasNull) incompleteRows++;
    });

    const score = Math.max(0, Math.round(((this.cleanedData.length - incompleteRows) / this.cleanedData.length) * 100));
    this.cleaningAudit.healthScore = score;
  }

  // --- Aggregate KPI Summaries ---

  getKPIAggregates(data = this.cleanedData) {
    if (!data || data.length === 0) {
      return { totalImpressions: 0, totalClicks: 0, totalInstalls: 0, totalConversions: 0, totalSpend: 0, avgCTR: 0, avgCR: 0, avgCPI: 0 };
    }

    const { impressionsCol, clicksCol, installsCol, conversionsCol, costCol } = this.schema;

    let totalImpressions = 0;
    let totalClicks = 0;
    let totalInstalls = 0;
    let totalConversions = 0;
    let totalSpend = 0;

    data.forEach(r => {
      totalImpressions += parseFloat(r[impressionsCol]) || 0;
      totalClicks += parseFloat(r[clicksCol]) || 0;
      totalInstalls += parseFloat(r[installsCol]) || 0;
      totalConversions += parseFloat(r[conversionsCol]) || 0;
      totalSpend += parseFloat(r[costCol]) || 0;
    });

    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCR = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const avgCPI = totalInstalls > 0 ? totalSpend / totalInstalls : 0;

    return {
      totalImpressions,
      totalClicks,
      totalInstalls,
      totalConversions,
      totalSpend,
      avgCTR: parseFloat(avgCTR.toFixed(2)),
      avgCR: parseFloat(avgCR.toFixed(2)),
      avgCPI: parseFloat(avgCPI.toFixed(2))
    };
  }
}

window.DataEngine = DataEngine;
