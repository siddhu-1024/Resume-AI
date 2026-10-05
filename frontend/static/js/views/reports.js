/**
 * Reports & Analytics View
 */
const ReportsView = {
  scoreChart: null,
  skillsChart: null,

  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Screening Reports & Recruitment Analytics</h1>
          <p>Export comprehensive screening logs, analyze skill supply gaps, and review pipeline velocity.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" id="btn-export-csv">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export to CSV
          </button>
          <button class="btn btn-primary btn-sm" id="btn-export-pdf">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            Download Executive PDF Report
          </button>
        </div>
      </div>

      <!-- Analytics Charts Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
        <!-- Match Score Distribution Chart -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
              Candidate Match Score Distribution
            </span>
          </div>
          <div class="card-body" style="height: 280px;">
            <canvas id="score-distribution-chart"></canvas>
          </div>
        </div>

        <!-- Missing Skills Gap Chart -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              Top Missing Requirements Gap
            </span>
          </div>
          <div class="card-body" style="height: 280px;">
            <canvas id="skills-gap-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Candidate Screening Summary Table -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Detailed Candidate Screening Log</span>
          <span style="font-size: 12px; color: var(--text-muted);" id="reports-cand-count">Total 0 record(s)</span>
        </div>
        <div class="table-container" style="border: none; border-radius: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Job Position</th>
                <th>Overall Match</th>
                <th>Experience</th>
                <th>Status</th>
                <th>Top Matched Skills</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="reports-table-body">
              <tr><td colspan="7" style="text-align: center; padding: 24px;">Loading data...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btn-export-csv').onclick = () => {
      const jobId = State.currentJobId !== 'all' ? State.currentJobId : '';
      window.open(`/api/reports/export/csv?job_id=${jobId}`, '_blank');
      App.showToast("CSV report download started.", "info");
    };

    document.getElementById('btn-export-pdf').onclick = () => {
      const jobId = State.currentJobId !== 'all' ? State.currentJobId : '';
      window.open(`/api/reports/export/pdf?job_id=${jobId}`, '_blank');
      App.showToast("PDF report download started.", "info");
    };

    await this.loadReportsData();
  },

  async loadReportsData() {
    try {
      const analytics = await API.getAnalytics(State.currentJobId);
      const candidates = await State.loadCandidates();

      // Render Distribution Chart
      const dist = analytics.match_distribution || {};
      const scoreCtx = document.getElementById('score-distribution-chart');
      if (scoreCtx) {
        if (this.scoreChart) this.scoreChart.destroy();
        this.scoreChart = new Chart(scoreCtx, {
          type: 'doughnut',
          data: {
            labels: Object.keys(dist),
            datasets: [{
              data: Object.values(dist),
              backgroundColor: ['#064e3b', '#d97706', '#022c22', '#991b1b'],
              borderColor: '#ffffff',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }

      // Render Missing Skills Gap Chart
      const missing = analytics.top_missing_skills || [];
      const skillsCtx = document.getElementById('skills-gap-chart');
      if (skillsCtx) {
        if (this.skillsChart) this.skillsChart.destroy();
        this.skillsChart = new Chart(skillsCtx, {
          type: 'bar',
          data: {
            labels: missing.length ? missing.map(m => m.name) : ['No Missing Skills'],
            datasets: [{
              label: 'Candidates Missing Skill',
              data: missing.length ? missing.map(m => m.count) : [0],
              backgroundColor: '#e5cca0',
              borderColor: '#064e3b',
              borderWidth: 1.5,
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
          }
        });
      }

      // Render Summary Table
      const tbody = document.getElementById('reports-table-body');
      const countSpan = document.getElementById('reports-cand-count');
      if (countSpan) countSpan.textContent = `Total ${candidates.length} record(s)`;

      if (candidates.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">No candidate records available.</td></tr>`;
      } else {
        tbody.innerHTML = candidates.map(c => {
          const score = c.latest_match_score;
          const scoreClass = score !== null ? (score >= 80 ? 'high' : (score >= 60 ? 'medium' : 'low')) : 'unscreened';
          return `
            <tr>
              <td>
                <div style="font-weight: 700; font-size: 13px;">${c.full_name}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${c.email}</div>
              </td>
              <td>${c.job_title}</td>
              <td><span class="score-pill ${scoreClass}">${score !== null ? score.toFixed(1) + '%' : 'N/A'}</span></td>
              <td>${c.total_experience_years} yrs</td>
              <td><span class="badge badge-${c.status.toLowerCase().replace(' ', '-')}">${c.status}</span></td>
              <td>
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                  ${(c.top_skills || []).slice(0, 3).map(s => `<span class="chip chip-tech">${s}</span>`).join('')}
                </div>
              </td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="CandidateDetailView.open(${c.id})">Profile</button>
              </td>
            </tr>
          `;
        }).join('');
      }

    } catch (e) {
      console.error("Reports load error:", e);
    }
  }
};
