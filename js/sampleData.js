/**
 * Sample Dataset Generator for Analytics Dashboard
 * Produces realistic marketing performance datasets with intentional missing values, duplicates, and anomalies.
 */

class SampleDataGenerator {
  static generateMarketingData(rowCount = 10000) {
    const channels = ['Meta', 'Google Ads', 'TikTok', 'Apple Search Ads', 'LinkedIn'];
    const campaigns = Array.from({ length: 15 }, (_, i) => `CMP-2026-${100 + i}`);
    const rows = [];

    const startDate = new Date('2026-07-01');
    
    for (let i = 0; i < rowCount; i++) {
      // Calculate date
      const dateOffset = Math.floor((i / rowCount) * 40); // 40 days span
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dateOffset);
      const dateStr = currentDate.toISOString().split('T')[0];

      const channel = channels[Math.floor(Math.random() * channels.length)];
      const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];

      // Base numbers
      let impressions = Math.floor(10000 + Math.random() * 80000);
      let ctrBase = 0.02 + Math.random() * 0.04; // 2% - 6%
      let clicks = Math.floor(impressions * ctrBase);
      let crBase = 0.08 + Math.random() * 0.12; // 8% - 20%
      let installs = Math.floor(clicks * crBase);
      let conversions = Math.floor(installs * (0.3 + Math.random() * 0.4));
      let cost = parseFloat((installs * (2.5 + Math.random() * 4.0)).toFixed(2));

      // Inject Anomalies (~2% of rows)
      const isAnomaly = Math.random() < 0.02;
      let anomalyType = null;

      if (isAnomaly) {
        const rand = Math.random();
        if (rand < 0.4) {
          // Cost Spike Anomaly
          cost = parseFloat((cost * (3.5 + Math.random() * 2.5)).toFixed(2));
          anomalyType = 'High Cost Spike';
        } else if (rand < 0.7) {
          // CTR Abnormal Surge
          clicks = Math.floor(impressions * 0.25); // 25% CTR!
          anomalyType = 'CTR Surge Outlier';
        } else {
          // Conversion Drop-off
          conversions = 0;
          anomalyType = 'Zero Conversions Anomaly';
        }
      }

      // Inject Missing / Blank Values (~3% of rows)
      let isBlank = false;
      if (Math.random() < 0.03) {
        isBlank = true;
        const blankChoice = Math.random();
        if (blankChoice < 0.33) clicks = null;
        else if (blankChoice < 0.66) cost = null;
        else installs = null;
      }

      rows.push({
        Date: dateStr,
        Campaign_ID: campaign,
        Channel: channel,
        Impressions: impressions,
        Clicks: clicks,
        Installs: installs,
        Conversions: conversions,
        Cost: cost
      });
    }

    // Inject Duplicates (~1.5% of rows duplicated)
    const duplicateCount = Math.floor(rowCount * 0.015);
    for (let d = 0; d < duplicateCount; d++) {
      const sourceIndex = Math.floor(Math.random() * rows.length);
      rows.push({ ...rows[sourceIndex] });
    }

    return rows;
  }

  static getPresetDatasets() {
    return [
      { id: 'marketing_10k', name: 'App Marketing Campaign (10,000 Rows)', count: 10000 },
      { id: 'marketing_25k', name: 'Multi-Channel Benchmark (25,000 Rows)', count: 25000 },
      { id: 'marketing_50k', name: 'High-Volume Enterprise Performance (50,000 Rows)', count: 50000 }
    ];
  }
}

window.SampleDataGenerator = SampleDataGenerator;
