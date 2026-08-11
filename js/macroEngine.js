/**
 * Natural Language Macro Command Parser & Chained Executor
 * Converts natural language user prompts into automated multi-step data pipelines.
 */

class MacroEngine {
  constructor(appController) {
    this.app = appController;
  }

  parseInstruction(inputStr) {
    const text = inputStr.toLowerCase();
    const steps = [];

    // Check for cleaning actions
    if (text.includes('clean') || text.includes('blank') || text.includes('duplicate') || text.includes('missing')) {
      steps.push({
        id: 'step_clean',
        label: 'Clean Data (Drop Duplicates & Blanks)',
        action: 'CLEAN'
      });
    }

    // Check for KPI metric calculations
    if (text.includes('ctr') || text.includes('conversion') || text.includes('cpi') || text.includes('kpi') || text.includes('calculate')) {
      steps.push({
        id: 'step_kpi',
        label: 'Compute KPIs (CTR, CR, CPI)',
        action: 'KPI'
      });
    }

    // Check for channel filters
    if (text.includes('meta')) {
      steps.push({ id: 'step_filter_meta', label: 'Filter Channel: Meta', action: 'FILTER_CHANNEL', channel: 'Meta' });
    } else if (text.includes('google')) {
      steps.push({ id: 'step_filter_google', label: 'Filter Channel: Google Ads', action: 'FILTER_CHANNEL', channel: 'Google Ads' });
    } else if (text.includes('tiktok')) {
      steps.push({ id: 'step_filter_tiktok', label: 'Filter Channel: TikTok', action: 'FILTER_CHANNEL', channel: 'TikTok' });
    }

    // Check for anomaly detection
    if (text.includes('anomaly') || text.includes('anomalies') || text.includes('highlight') || text.includes('outlier')) {
      steps.push({
        id: 'step_anomaly',
        label: 'Detect & Highlight Anomalies',
        action: 'ANOMALY'
      });
    }

    // Check for chart views
    if (text.includes('install') || text.includes('trend') || text.includes('chart') || text.includes('show') || text.includes('plot')) {
      steps.push({
        id: 'step_chart',
        label: 'Generate Installs & Conversions Trend Chart',
        action: 'CHART',
        chartType: 'installs_trend'
      });
    }

    // If no explicit match, construct default full workflow pipeline
    if (steps.length === 0) {
      steps.push(
        { id: 'step_clean', label: 'Clean Data & Fill Missing Values', action: 'CLEAN' },
        { id: 'step_kpi', label: 'Compute CTR, CR, CPI Metrics', action: 'KPI' },
        { id: 'step_anomaly', label: 'Run Anomaly Detection Engine', action: 'ANOMALY' },
        { id: 'step_chart', label: 'Render Analytics Charts', action: 'CHART', chartType: 'installs_trend' }
      );
    }

    return steps;
  }

  async executePipeline(inputStr, onStepChange) {
    const steps = this.parseInstruction(inputStr);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (onStepChange) onStepChange(step, 'running', i, steps.length);
      
      // Artificial slight delay for smooth UI step visualizer
      await new Promise(res => setTimeout(res, 300));

      switch (step.action) {
        case 'CLEAN':
          this.app.dataEngine.removeDuplicates();
          this.app.dataEngine.removeBlanks();
          this.app.dataEngine.handleMissingValues('mean');
          break;
        case 'KPI':
          this.app.dataEngine.calculateMetrics();
          this.app.updateKPIBanner();
          break;
        case 'FILTER_CHANNEL':
          this.app.filterByChannel(step.channel);
          break;
        case 'ANOMALY':
          this.app.runAnomalyDetection();
          break;
        case 'CHART':
          this.app.switchChartTab(step.chartType || 'installs_trend');
          break;
      }

      if (onStepChange) onStepChange(step, 'completed', i, steps.length);
    }

    // Final UI refresh
    this.app.renderAll();
  }
}

window.MacroEngine = MacroEngine;
