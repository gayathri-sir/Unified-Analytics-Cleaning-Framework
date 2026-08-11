/**
 * Chart Manager for Dashboard Visualizations
 * Powered by Chart.js for responsive trends, dual-axis graphs, and channel breakdowns.
 */

class ChartManager {
  constructor() {
    this.activeChart = null;
    this.currentType = 'installs_trend';
  }

  renderChart(canvasId, dataset, schema, type = 'installs_trend') {
    this.currentType = type;
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.activeChart) {
      this.activeChart.destroy();
    }

    if (!dataset || dataset.length === 0) return;

    // Group dataset by Date or Channel
    const { dateCol, channelCol, installsCol, conversionsCol, costCol } = schema;

    // Group by Date for time series
    const dateMap = new Map();
    dataset.forEach(row => {
      const d = row[dateCol] || 'N/A';
      if (!dateMap.has(d)) {
        dateMap.set(d, { installs: 0, conv: 0, cost: 0, count: 0 });
      }
      const item = dateMap.get(d);
      item.installs += parseFloat(row[installsCol]) || 0;
      item.conv += parseFloat(row[conversionsCol]) || 0;
      item.cost += parseFloat(row[costCol]) || 0;
      item.count++;
    });

    // Sort dates
    const sortedDates = Array.from(dateMap.keys()).sort();
    const installsData = sortedDates.map(d => dateMap.get(d).installs);
    const convData = sortedDates.map(d => dateMap.get(d).conv);
    const costData = sortedDates.map(d => dateMap.get(d).cost);
    const cpiData = sortedDates.map(d => {
      const item = dateMap.get(d);
      return item.installs > 0 ? parseFloat((item.cost / item.installs).toFixed(2)) : 0;
    });

    // Color theme
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

    if (type === 'installs_trend') {
      this.activeChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: sortedDates,
          datasets: [
            {
              label: 'Installs',
              data: installsData,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              yAxisID: 'y'
            },
            {
              label: 'Conversions',
              data: convData,
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { labels: { color: textColor, font: { family: 'Inter', weight: 600 } } },
            tooltip: { cornerRadius: 8, padding: 10 }
          },
          scales: {
            x: { ticks: { color: textColor, font: { family: 'Inter' } }, grid: { color: gridColor } },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: { display: true, text: 'Installs', color: textColor },
              ticks: { color: textColor },
              grid: { color: gridColor }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: { display: true, text: 'Conversions', color: textColor },
              ticks: { color: textColor },
              grid: { drawOnChartArea: false }
            }
          }
        }
      });
    } else if (type === 'cost_cpi') {
      this.activeChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sortedDates,
          datasets: [
            {
              label: 'Total Cost ($)',
              data: costData,
              backgroundColor: 'rgba(236, 72, 153, 0.65)',
              borderRadius: 6,
              yAxisID: 'y'
            },
            {
              type: 'line',
              label: 'CPI ($)',
              data: cpiData,
              borderColor: '#f59e0b',
              borderWidth: 2.5,
              tension: 0.3,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: textColor } } },
          scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: { type: 'linear', position: 'left', title: { display: true, text: 'Cost ($)', color: textColor }, ticks: { color: textColor }, grid: { color: gridColor } },
            y1: { type: 'linear', position: 'right', title: { display: true, text: 'CPI ($)', color: textColor }, ticks: { color: textColor }, grid: { drawOnChartArea: false } }
          }
        }
      });
    } else if (type === 'channel_breakdown') {
      // Aggregate by channel
      const channelMap = new Map();
      dataset.forEach(row => {
        const ch = row[channelCol] || 'Other';
        const inst = parseFloat(row[installsCol]) || 0;
        channelMap.set(ch, (channelMap.get(ch) || 0) + inst);
      });

      this.activeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: Array.from(channelMap.keys()),
          datasets: [{
            data: Array.from(channelMap.values()),
            backgroundColor: ['#6366f1', '#10b981', '#ec4899', '#f59e0b', '#06b6d4', '#8b5cf6'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
        }
      });
    }
  }
}

window.ChartManager = ChartManager;
