# Unified Analytics & Data Cleaning Framework 📊✨

An enterprise-grade, high-performance Data Analytics & Data Cleaning Studio built with HTML5, CSS3 (Glassmorphism design system), Vanilla ES6 JavaScript, PapaParse, Chart.js, and Web Workers.

![Dashboard Preview](https://raw.githubusercontent.com/gayathri-sir/Unified-Analytics-Cleaning-Framework/main/index.html)

---

## 🌟 Key Features

1. **Multi-Format Dataset Upload**:
   - Drag & drop CSV, TSV, JSON, and Excel (`.xlsx`) datasets.
   - Built-in high-volume benchmarks (**10,000**, **25,000**, and **50,000** rows).
   - Dynamic schema detection auto-mapping metrics and dimensions.

2. **Automated & Manual Data Cleaning**:
   - **Deduplication**: One-click row duplicate elimination.
   - **Blank Handling**: Detects and strips empty/null values.
   - **Missing Value Imputation**: Mean, Median, and Zero imputation strategies.
   - **Real-Time Health Audit**: Cleanliness gauge score (0–100%).

3. **Campaign KPI Engine**:
   - Automated calculations for **CTR (Click-Through Rate)**, **Conversion Rate (CR)**, **CPI (Cost Per Install)**, Total Spend, Installs, and Conversions.

4. **Interactive Visualizations**:
   - Performance trend graphs with dual Y-axes.
   - Cost vs. CPI dual-axis bar/line combo chart.
   - Channel breakdown doughnut charts (Meta, Google Ads, TikTok, Apple Search Ads, LinkedIn).

5. **Statistical Anomaly Detection Engine**:
   - Algorithmic anomaly highlighting using **Z-Score** ($Z > 2.5$) and **IQR** methods.
   - Live **Automated Anomaly Feed** sidebar and red row tagging in data grid table.

6. **Natural Language Macro Command Bar**:
   - Type single instructions like `"Clean data, calculate CTR, show installs trend"` to execute compound multi-step data pipelines automatically with visual step stepper.

7. **Large Dataset High-Performance Grid**:
   - Virtualized pagination, column sorting, live search filtering, and off-main-thread Web Worker background computations.

---

## 🚀 Live Demo / GitHub Pages Deployment

To view the live dashboard hosted directly on GitHub Pages:

1. Go to repository **Settings** $\rightarrow$ **Pages**.
2. Under **Build and deployment** $\rightarrow$ **Branch**, select `main` and `/ (root)`.
3. Click **Save**.
4. Access your live web application at:
   👉 **https://gayathri-sir.github.io/Unified-Analytics-Cleaning-Framework/**

---

## 💻 Local Development

Run locally via Python HTTP server:

```bash
# Clone repository
git clone https://github.com/gayathri-sir/Unified-Analytics-Cleaning-Framework.git

# Navigate into folder
cd Unified-Analytics-Cleaning-Framework

# Start web server
python -m http.server 8000
```

Open `http://localhost:8000/` in your web browser.
