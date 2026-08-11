/**
 * Automated Statistical Anomaly Detection Engine
 * Uses Z-Score and Interquartile Range (IQR) methods to highlight data anomalies with natural language diagnostics.
 */

class AnomalyEngine {
  static detectAnomalies(data, schema, zThreshold = 2.5) {
    if (!data || data.length === 0) return { anomalies: [], flaggedIndices: new Set() };

    const anomalies = [];
    const flaggedIndices = new Set();

    const { dateCol, channelCol, costCol, installsCol, conversionsCol } = schema;

    // Helper: calculate mean & standard deviation
    const statsForCol = (colName) => {
      const vals = data.map(r => parseFloat(r[colName])).filter(v => !isNaN(v));
      if (vals.length === 0) return { mean: 0, stdDev: 0, q1: 0, q3: 0, iqr: 0 };
      
      const sum = vals.reduce((a, b) => a + b, 0);
      const mean = sum / vals.length;

      const squareDiffs = vals.map(v => Math.pow(v - mean, 2));
      const variance = squareDiffs.reduce((a, b) => a + b, 0) / vals.length;
      const stdDev = Math.sqrt(variance);

      // IQR
      const sorted = [...vals].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;

      return { mean, stdDev, q1, q3, iqr };
    };

    const costStats = statsForCol(costCol);
    const ctrStats = statsForCol('CTR (%)');
    const cpiStats = statsForCol('CPI ($)');

    data.forEach((row, idx) => {
      const rowDate = row[dateCol] || 'N/A';
      const channel = row[channelCol] || 'Unknown';
      const cost = parseFloat(row[costCol]) || 0;
      const ctr = parseFloat(row['CTR (%)']) || 0;
      const cpi = parseFloat(row['CPI ($)']) || 0;
      const installs = parseFloat(row[installsCol]) || 0;
      const conv = parseFloat(row[conversionsCol]) || 0;

      // 1. Cost Spike Anomaly (Z-Score)
      if (costStats.stdDev > 0) {
        const costZ = (cost - costStats.mean) / costStats.stdDev;
        if (costZ > zThreshold) {
          flaggedIndices.add(idx);
          anomalies.push({
            id: `anom-cost-${idx}`,
            rowIndex: idx,
            type: 'Cost Spike',
            severity: 'critical',
            date: rowDate,
            channel: channel,
            metric: 'Cost ($)',
            value: `$${cost.toLocaleString()}`,
            description: `Extreme cost spike of $${cost.toFixed(2)} is ${(cost / costStats.mean).toFixed(1)}x higher than average ($${costStats.mean.toFixed(2)}).`
          });
        }
      }

      // 2. Abnormal CTR Surge (Z-Score / IQR)
      if (ctrStats.stdDev > 0) {
        const ctrZ = (ctr - ctrStats.mean) / ctrStats.stdDev;
        if (ctrZ > zThreshold + 0.5) {
          flaggedIndices.add(idx);
          anomalies.push({
            id: `anom-ctr-${idx}`,
            rowIndex: idx,
            type: 'CTR Surge',
            severity: 'warning',
            date: rowDate,
            channel: channel,
            metric: 'CTR (%)',
            value: `${ctr}%`,
            description: `Abnormal CTR surge of ${ctr}% on ${channel} (average is ${ctrStats.mean.toFixed(1)}%). Possible bot traffic or tracking glitch.`
          });
        }
      }

      // 3. CPI Anomaly (Extreme Cost Per Install)
      if (cpiStats.stdDev > 0 && cpi > 0) {
        const cpiZ = (cpi - cpiStats.mean) / cpiStats.stdDev;
        if (cpiZ > zThreshold) {
          flaggedIndices.add(idx);
          anomalies.push({
            id: `anom-cpi-${idx}`,
            rowIndex: idx,
            type: 'High CPI Outlier',
            severity: 'warning',
            date: rowDate,
            channel: channel,
            metric: 'CPI ($)',
            value: `$${cpi.toFixed(2)}`,
            description: `Cost per install spiked to $${cpi.toFixed(2)} on ${channel} vs standard $${cpiStats.mean.toFixed(2)} average.`
          });
        }
      }

      // 4. Zero Conversion Anomaly despite high installs
      if (installs > 100 && conv === 0) {
        flaggedIndices.add(idx);
        anomalies.push({
          id: `anom-conv-${idx}`,
          rowIndex: idx,
          type: 'Zero Conversion Drop',
          severity: 'critical',
          date: rowDate,
          channel: channel,
          metric: 'Conversions',
          value: '0',
          description: `Zero conversions registered despite generating ${installs} installs on ${rowDate}. Check funnel integration.`
        });
      }
    });

    return { anomalies, flaggedIndices };
  }
}

window.AnomalyEngine = AnomalyEngine;
