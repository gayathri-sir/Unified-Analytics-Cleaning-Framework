/**
 * Main Application Orchestrator for Vantage Analytics Studio
 * Controls state management, table virtualization, event listeners, file upload, and macro pipelines.
 */

class App {
  constructor() {
    this.dataEngine = new DataEngine();
    this.chartManager = new ChartManager();
    this.macroEngine = new MacroEngine(this);

    this.activeDataset = [];
    this.filteredDataset = [];
    this.anomalyResults = { anomalies: [], flaggedIndices: new Set() };

    // Table Pagination State
    this.currentPage = 1;
    this.rowsPerPage = 50;
    this.sortCol = null;
    this.sortAsc = true;
    this.channelFilter = 'ALL';
    this.searchQuery = '';

    this.initElements();
    this.bindEvents();
    this.loadPreset('marketing_10k');
  }

  initElements() {
    // Buttons & Inputs
    this.presetSelect = document.getElementById('presetDatasetSelect');
    this.openUploadBtn = document.getElementById('openUploadBtn');
    this.closeUploadBtn = document.getElementById('closeUploadModalBtn');
    this.uploadModal = document.getElementById('uploadModal');
    this.dropzone = document.getElementById('dropzone');
    this.fileInput = document.getElementById('fileInput');

    this.btnRemoveDuplicates = document.getElementById('btnRemoveDuplicates');
    this.btnRemoveBlanks = document.getElementById('btnRemoveBlanks');
    this.btnHandleMissing = document.getElementById('btnHandleMissing');
    this.btnRunAnomalies = document.getElementById('btnRunAnomalies');
    this.exportCsvBtn = document.getElementById('exportCsvBtn');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');

    // Natural Language Macro Bar
    this.nlInput = document.getElementById('nlCommandInput');
    this.runNlBtn = document.getElementById('runNlCommandBtn');
    this.macroPipeline = document.getElementById('macroPipeline');

    // KPI & Audit Elements
    this.healthScoreVal = document.getElementById('healthScoreVal');
    this.auditTotalRows = document.getElementById('auditTotalRows');
    this.auditDuplicates = document.getElementById('auditDuplicates');
    this.auditBlanks = document.getElementById('auditBlanks');
    this.auditAnomaliesCount = document.getElementById('auditAnomaliesCount');

    this.kpiCtrVal = document.getElementById('kpiCtrVal');
    this.kpiCrVal = document.getElementById('kpiCrVal');
    this.kpiCpiVal = document.getElementById('kpiCpiVal');
    this.kpiInstallsVal = document.getElementById('kpiInstallsVal');
    this.kpiSpendVal = document.getElementById('kpiSpendVal');

    // Table Elements
    this.tableHeadRow = document.getElementById('tableHeadRow');
    this.tableBody = document.getElementById('tableBody');
    this.tableRecordCount = document.getElementById('tableRecordCount');
    this.tableSearchInput = document.getElementById('tableSearchInput');
    this.channelFilterSelect = document.getElementById('channelFilterSelect');

    this.btnPrevPage = document.getElementById('btnPrevPage');
    this.btnNextPage = document.getElementById('btnNextPage');
    this.currentPageNum = document.getElementById('currentPageNum');
    this.paginationInfo = document.getElementById('paginationInfo');

    // Anomaly Feed
    this.anomalyFeedList = document.getElementById('anomalyFeedList');
    this.anomalyCountBadge = document.getElementById('anomalyCountBadge');
  }

  bindEvents() {
    // Preset Dataset Switch
    this.presetSelect.addEventListener('change', (e) => this.loadPreset(e.target.value));

    // Upload Modal
    this.openUploadBtn.addEventListener('click', () => this.uploadModal.classList.add('open'));
    this.closeUploadBtn.addEventListener('click', () => this.uploadModal.classList.remove('open'));
    this.uploadModal.addEventListener('click', (e) => {
      if (e.target === this.uploadModal) this.uploadModal.classList.remove('open');
    });

    // File Drag & Drop
    this.dropzone.addEventListener('dragover', (e) => { e.preventDefault(); this.dropzone.classList.add('dragover'); });
    this.dropzone.addEventListener('dragleave', () => this.dropzone.classList.remove('dragover'));
    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) this.handleFileUpload(e.dataTransfer.files[0]);
    });
    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) this.handleFileUpload(e.target.files[0]);
    });

    // Data Cleaning Buttons
    this.btnRemoveDuplicates.addEventListener('click', () => {
      const count = this.dataEngine.removeDuplicates();
      this.notifyUser(`Removed ${count} duplicate rows.`);
      this.renderAll();
    });

    this.btnRemoveBlanks.addEventListener('click', () => {
      const count = this.dataEngine.removeBlanks();
      this.notifyUser(`Removed ${count} blank rows.`);
      this.renderAll();
    });

    this.btnHandleMissing.addEventListener('click', () => {
      const count = this.dataEngine.handleMissingValues('mean');
      this.notifyUser(`Filled ${count} missing cell values using Mean imputation.`);
      this.renderAll();
    });

    this.btnRunAnomalies.addEventListener('click', () => {
      this.runAnomalyDetection();
      this.renderAll();
    });

    // NL Command Bar
    this.runNlBtn.addEventListener('click', () => this.executeNlMacro());
    this.nlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.executeNlMacro();
    });

    // Quick Prompt Chips
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        this.nlInput.value = prompt;
        this.executeNlMacro();
      });
    });

    // Chart Tabs
    document.querySelectorAll('.chart-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        const chartType = e.target.getAttribute('data-chart');
        this.switchChartTab(chartType);
      });
    });

    // Table Search & Filters
    this.tableSearchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.currentPage = 1;
      this.applyFiltersAndRenderTable();
    });

    this.channelFilterSelect.addEventListener('change', (e) => {
      this.channelFilter = e.target.value;
      this.currentPage = 1;
      this.applyFiltersAndRenderTable();
    });

    // Pagination Controls
    this.btnPrevPage.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderTableBody();
      }
    });

    this.btnNextPage.addEventListener('click', () => {
      const maxPage = Math.ceil(this.filteredDataset.length / this.rowsPerPage);
      if (this.currentPage < maxPage) {
        this.currentPage++;
        this.renderTableBody();
      }
    });

    // Export & Theme
    this.exportCsvBtn.addEventListener('click', () => this.exportCsv());
    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
  }

  loadPreset(presetId) {
    let rowCount = 10000;
    if (presetId === 'marketing_25k') rowCount = 25000;
    if (presetId === 'marketing_50k') rowCount = 50000;

    const data = SampleDataGenerator.generateMarketingData(rowCount);
    this.activeDataset = this.dataEngine.loadData(data);
    this.anomalyResults = { anomalies: [], flaggedIndices: new Set() };
    this.renderAll();
  }

  handleFileUpload(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (ext === 'csv' || ext === 'tsv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          this.activeDataset = this.dataEngine.loadData(results.data);
          this.uploadModal.classList.remove('open');
          this.notifyUser(`Successfully loaded ${file.name} (${results.data.length} rows)`);
          this.renderAll();
        }
      });
    } else if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          this.activeDataset = this.dataEngine.loadData(Array.isArray(json) ? json : [json]);
          this.uploadModal.classList.remove('open');
          this.notifyUser(`Loaded ${file.name}`);
          this.renderAll();
        } catch (err) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  }

  async executeNlMacro() {
    const input = this.nlInput.value.trim();
    if (!input) return;

    this.macroPipeline.classList.add('active');
    this.macroPipeline.innerHTML = '';

    await this.macroEngine.executePipeline(input, (step, status, index, total) => {
      let stepEl = document.getElementById(step.id);
      if (!stepEl) {
        stepEl = document.createElement('div');
        stepEl.id = step.id;
        stepEl.className = 'pipeline-step pending';
        stepEl.innerHTML = `<i data-lucide="loader" class="spin"></i> ${step.label}`;
        this.macroPipeline.appendChild(stepEl);
        if (window.lucide) lucide.createIcons();
      }

      stepEl.className = `pipeline-step ${status}`;
      if (status === 'running') {
        stepEl.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Running: ${step.label}`;
      } else if (status === 'completed') {
        stepEl.innerHTML = `<i data-lucide="check-circle-2" style="color: var(--accent-emerald);"></i> ${step.label}`;
      }
      if (window.lucide) lucide.createIcons();
    });
  }

  runAnomalyDetection() {
    this.anomalyResults = AnomalyEngine.detectAnomalies(
      this.dataEngine.cleanedData,
      this.dataEngine.schema
    );
    this.renderAnomalyFeed();
    this.auditAnomaliesCount.textContent = this.anomalyResults.anomalies.length;
    this.notifyUser(`Detected ${this.anomalyResults.anomalies.length} statistical anomalies!`);
  }

  renderAnomalyFeed() {
    const { anomalies } = this.anomalyResults;
    this.anomalyCountBadge.textContent = `${anomalies.length} Anomalies`;

    if (anomalies.length === 0) {
      this.anomalyFeedList.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 2rem 0; font-size: 0.85rem;">
          No anomalies detected in current dataset view.
        </div>
      `;
      return;
    }

    this.anomalyFeedList.innerHTML = anomalies.slice(0, 20).map(a => `
      <div class="anomaly-card ${a.severity}">
        <div class="anomaly-card-header">
          <span class="anomaly-metric"><i data-lucide="alert-triangle"></i> ${a.type}</span>
          <span class="anomaly-date">${a.date}</span>
        </div>
        <div class="anomaly-desc">${a.description}</div>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
  }

  updateKPIBanner() {
    const kpis = this.dataEngine.getKPIAggregates();
    this.kpiCtrVal.textContent = `${kpis.avgCTR}%`;
    this.kpiCrVal.textContent = `${kpis.avgCR}%`;
    this.kpiCpiVal.textContent = `$${kpis.avgCPI.toFixed(2)}`;
    this.kpiInstallsVal.textContent = kpis.totalInstalls.toLocaleString();
    this.kpiSpendVal.textContent = `$${Math.round(kpis.totalSpend).toLocaleString()}`;
  }

  updateAuditCard() {
    const audit = this.dataEngine.cleaningAudit;
    this.healthScoreVal.textContent = `${audit.healthScore}%`;
    this.auditTotalRows.textContent = this.dataEngine.cleanedData.length.toLocaleString();
    this.auditDuplicates.textContent = audit.duplicatesRemoved;
    this.auditBlanks.textContent = audit.blanksRemoved;
  }

  switchChartTab(chartType) {
    this.chartManager.renderChart(
      'mainAnalyticsChart',
      this.dataEngine.cleanedData,
      this.dataEngine.schema,
      chartType
    );
  }

  renderAll() {
    this.updateKPIBanner();
    this.updateAuditCard();
    this.switchChartTab(this.chartManager.currentType);
    this.applyFiltersAndRenderTable();
    if (window.lucide) lucide.createIcons();
  }

  applyFiltersAndRenderTable() {
    let list = this.dataEngine.cleanedData;

    // Filter by Channel
    if (this.channelFilter !== 'ALL') {
      const channelCol = this.dataEngine.schema.channelCol;
      list = list.filter(r => r[channelCol] === this.channelFilter);
    }

    // Search query filter
    if (this.searchQuery) {
      list = list.filter(row => {
        return Object.values(row).some(v => String(v).toLowerCase().includes(this.searchQuery));
      });
    }

    // Column Sorting
    if (this.sortCol) {
      list.sort((a, b) => {
        let valA = a[this.sortCol];
        let valB = b[this.sortCol];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return this.sortAsc ? valA - valB : valB - valA;
        }
        return this.sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      });
    }

    this.filteredDataset = list;
    this.tableRecordCount.textContent = `(Showing ${list.length.toLocaleString()} records)`;
    this.renderTableHeader();
    this.renderTableBody();
  }

  renderTableHeader() {
    if (this.dataEngine.cleanedData.length === 0) return;
    const cols = Object.keys(this.dataEngine.cleanedData[0]);

    this.tableHeadRow.innerHTML = cols.map(col => {
      const isSorted = this.sortCol === col;
      const arrow = isSorted ? (this.sortAsc ? '▲' : '▼') : '';
      return `<th data-col="${col}">${col} <span style="font-size: 0.7rem; color: var(--accent-primary);">${arrow}</span></th>`;
    }).join('');

    // Click handler for column sorting
    this.tableHeadRow.querySelectorAll('th').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-col');
        if (this.sortCol === col) {
          this.sortAsc = !this.sortAsc;
        } else {
          this.sortCol = col;
          this.sortAsc = true;
        }
        this.applyFiltersAndRenderTable();
      });
    });
  }

  renderTableBody() {
    if (this.filteredDataset.length === 0) {
      this.tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 2rem; color: var(--text-muted);">No records found.</td></tr>`;
      return;
    }

    const startIdx = (this.currentPage - 1) * this.rowsPerPage;
    const pageRows = this.filteredDataset.slice(startIdx, startIdx + this.rowsPerPage);
    const cols = Object.keys(this.filteredDataset[0]);

    this.tableBody.innerHTML = pageRows.map((row, rowOffset) => {
      const globalIdx = startIdx + rowOffset;
      const isAnomaly = this.anomalyResults.flaggedIndices.has(globalIdx);
      const trClass = isAnomaly ? 'row-anomaly' : '';

      const cells = cols.map(col => {
        let val = row[col];
        if (val === null || val === undefined || val === '') {
          return `<td><span style="color: var(--accent-warning); font-style: italic;">[Blank]</span></td>`;
        }
        if (col === this.dataEngine.schema.channelCol) {
          return `<td><span class="badge-cell badge-channel">${val}</span></td>`;
        }
        if (typeof val === 'number') {
          return `<td>${val.toLocaleString()}</td>`;
        }
        return `<td>${val}</td>`;
      }).join('');

      return `<tr class="${trClass}">${cells}</tr>`;
    }).join('');

    // Pagination info update
    const maxPage = Math.ceil(this.filteredDataset.length / this.rowsPerPage) || 1;
    this.currentPageNum.textContent = this.currentPage;
    this.paginationInfo.textContent = `Page ${this.currentPage} of ${maxPage} (Rows ${startIdx + 1} - ${Math.min(startIdx + this.rowsPerPage, this.filteredDataset.length)})`;

    this.btnPrevPage.disabled = this.currentPage === 1;
    this.btnNextPage.disabled = this.currentPage >= maxPage;
  }

  exportCsv() {
    if (this.dataEngine.cleanedData.length === 0) return;
    const csv = Papa.unparse(this.dataEngine.cleanedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cleaned_dataset_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  }

  toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const target = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', target);
    this.switchChartTab(this.chartManager.currentType);
  }

  notifyUser(msg) {
    console.log('[Dashboard]', msg);
  }
}

// Instantiate Dashboard App
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
