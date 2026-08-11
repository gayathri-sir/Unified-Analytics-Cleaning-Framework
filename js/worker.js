/**
 * Web Worker for Off-Main-Thread Large Dataset Processing
 */

self.onmessage = function (e) {
  const { action, dataset, schema, strategy } = e.data;

  if (action === 'PROCESS_LARGE_DATASET') {
    let data = dataset;

    // Deduplication
    const seen = new Set();
    const unique = [];
    data.forEach(row => {
      const key = `${row.Date}_${row.Campaign_ID}_${row.Channel}_${row.Impressions}_${row.Clicks}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(row);
      }
    });

    // KPI calculation
    unique.forEach(r => {
      const impr = parseFloat(r.Impressions) || 0;
      const clicks = parseFloat(r.Clicks) || 0;
      const installs = parseFloat(r.Installs) || 0;
      const conv = parseFloat(r.Conversions) || 0;
      const cost = parseFloat(r.Cost) || 0;

      r['CTR (%)'] = impr > 0 ? parseFloat(((clicks / impr) * 100).toFixed(2)) : 0;
      r['Conversion_Rate (%)'] = clicks > 0 ? parseFloat(((conv / clicks) * 100).toFixed(2)) : 0;
      r['CPI ($)'] = installs > 0 ? parseFloat((cost / installs).toFixed(2)) : 0;
    });

    self.postMessage({
      status: 'COMPLETE',
      cleanedData: unique,
      count: unique.length
    });
  }
};
