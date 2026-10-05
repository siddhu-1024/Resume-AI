/**
 * Dashboard View
 */
const DashboardView = {
  pipelineChart: null,
  distributionChart: null,

  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Recruitment Dashboard</h1>
          <p>Real-time candidate pipeline metrics, screening analysis, and hiring intelligence.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-outline-primary btn-sm" id="btn-dash-seed-demo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            Load Demo Data
          </button>
          <button class="btn btn-primary btn-sm" onclick="App.openUploadModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Upload Resumes
          </button>
        </div>
      </div>

      <!-- Overview Metric Cards -->
      <div class="metrics-grid" id="dashboard-metrics-grid">
        <div class="metric-card">
          <div class="metric-card-header">
            <span class="metric-label">Total Candidates</span>
            <div class="metric-icon-wrap" style="background-color: var(--info-bg); color: var(--info);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
            </div>
          </div>
          <div class="metric-value" id="stat-total-cands">-</div>
          <div class="metric-subtext">Across all job openings</div>
        </div>

        <div class="metric-card">
          <div class="metric-card-header">
            <span class="metric-label">Screened</span>
            <div class="metric-icon-wrap" style="background-color: var(--accent-light); color: var(--accent);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            </div>
          </div>
          <div class="metric-value" id="stat-screened">-</div>
          <div class="metric-subtext">Requirement matches analyzed</div>
        </div>

        <div class="metric-card">
          <div class="metric-card-header">
            <span class="metric-label">Shortlisted</span>
            <div class="metric-icon-wrap" style="background-color: var(--success-bg); color: var(--success);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
          </div>
          <div class="metric-value" id="stat-shortlisted" style="color: var(--success);">-</div>
          <div class="metric-subtext">Qualified for interview</div>
        </div>

        <div class="metric-card">
          <div class="metric-card-header">
            <span class="metric-label">Needs Review</span>
            <div class="metric-icon-wrap" style="background-color: var(--warning-bg); color: var(--warning);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            </div>
          </div>
          <div class="metric-value" id="stat-review">-</div>
          <div class="metric-subtext">Potential fit / pending review</div>
        </div>

        <div class="metric-card">
          <div class="metric-card-header">
            <span class="metric-label">Rejected</span>
            <div class="metric-icon-wrap" style="background-color: var(--danger-bg); color: var(--danger);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            </div>
          </div>
          <div class="metric-value" id="stat-rejected">-</div>
          <div class="metric-subtext">Does not meet core requirements</div>
        </div>

        <div class="metric-card">
          <div class="metric-card-header">
            <span class="metric-label">Average Match</span>
            <div class="metric-icon-wrap" style="background-color: var(--champagne-subtle); color: var(--primary); border: 1px solid var(--champagne-border);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
            </div>
          </div>
          <div class="metric-value" id="stat-avg-match">-</div>
          <div class="metric-subtext">Job requirement alignment</div>
        </div>
      </div>

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Left Column: Pipeline & Analytics -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- Pipeline Stages Card -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                Candidate Hiring Pipeline
              </span>
              <span style="font-size: 11px; color: var(--text-muted);">Stages Breakdown</span>
            </div>
            <div class="card-body">
              <div class="pipeline-bar-wrapper" id="pipeline-bar-container">
                <div class="pipeline-segment" style="width: 100%; background: #e2e8f0;"></div>
              </div>
              <div class="pipeline-legend" id="pipeline-legend-container">
                <!-- Injected via JS -->
              </div>
              <div style="height: 220px; margin-top: 20px;">
                <canvas id="pipeline-chart"></canvas>
              </div>
            </div>
          </div>

          <!-- Top Matching Candidates -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
                Top Matching Candidates
              </span>
              <a href="#/screening" style="font-size: 12px; font-weight: 600;">View All Screened &rarr;</a>
            </div>
            <div class="card-body" style="padding: 0;" id="top-candidates-list">
              <div style="padding: 24px; text-align: center; color: var(--text-muted);">Loading candidates...</div>
            </div>
          </div>
        </div>

        <!-- Right Column: Quick Actions & Skill Demand -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- Quick Actions -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                Quick Actions
              </span>
            </div>
            <div class="card-body">
              <div class="quick-actions-grid">
                <div class="quick-action-btn" onclick="App.openCreateJobModal()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
                  Create Job
                </div>
                <div class="quick-action-btn" onclick="App.openUploadModal()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  Upload Resumes
                </div>
                <div class="quick-action-btn" onclick="App.navigate('screening')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                  Screen Resumes
                </div>
                <div class="quick-action-btn" onclick="App.navigate('reports')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                  Export Report
                </div>
              </div>
            </div>
          </div>

          <!-- Skill Demand & Gap Overview -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                Candidate Skill Presence
              </span>
            </div>
            <div class="card-body">
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">Most common skills found in candidate pool:</div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;" id="dashboard-skill-chips">
                <!-- Skill chips -->
              </div>
            </div>
          </div>

          <!-- Activity Feed -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                Recent Screening Activity
              </span>
            </div>
            <div class="card-body">
              <div class="activity-stream" id="dashboard-activity-stream">
                <div style="font-size: 12px; color: var(--text-muted); text-align: center;">Loading activity...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-dash-seed-demo').addEventListener('click', async () => {
      try {
        const res = await API.seedDemoData();
        App.showToast(res.message, 'success');
        await State.loadJobs();
        await DashboardView.loadDashboardData();
      } catch (e) {
        App.showToast(e.message, 'danger');
      }
    });

    await this.loadDashboardData();
  },

  async loadDashboardData() {
    try {
      const analytics = await API.getAnalytics(State.currentJobId);
      const summary = analytics.summary || {};
      
      // Update statistics cards
      document.getElementById('stat-total-cands').textContent = summary.total_candidates ?? 0;
      document.getElementById('stat-screened').textContent = summary.screened_count ?? 0;
      document.getElementById('stat-shortlisted').textContent = summary.shortlisted_count ?? 0;
      document.getElementById('stat-review').textContent = summary.review_count ?? 0;
      document.getElementById('stat-rejected').textContent = summary.rejected_count ?? 0;
      document.getElementById('stat-avg-match').textContent = `${(summary.avg_match ?? 0).toFixed(1)}%`;

      // Render Pipeline visualizer
      const pipeline = analytics.pipeline || {};
      const total = summary.total_candidates || 1;
      const stages = [
        { label: 'Shortlisted', count: pipeline.Shortlisted || 0, color: '#064e3b' },
        { label: 'Interview', count: pipeline.Interview || 0, color: '#0d9488' },
        { label: 'Review Later', count: pipeline['Review Later'] || 0, color: '#d97706' },
        { label: 'Screening', count: pipeline.Screening || 0, color: '#e5cca0' },
        { label: 'New', count: pipeline.New || 0, color: '#022c22' },
        { label: 'Rejected', count: pipeline.Rejected || 0, color: '#991b1b' }
      ];

      const barContainer = document.getElementById('pipeline-bar-container');
      const legendContainer = document.getElementById('pipeline-legend-container');
      
      barContainer.innerHTML = stages.map(s => `
        <div class="pipeline-segment" style="width: ${(s.count / total) * 100}%; background-color: ${s.color};" title="${s.label}: ${s.count}"></div>
      `).join('');

      legendContainer.innerHTML = stages.map(s => `
        <div class="legend-item">
          <span class="legend-dot" style="background-color: ${s.color};"></span>
          <span>${s.label}: <b>${s.count}</b></span>
        </div>
      `).join('');

      // Render Pipeline Chart
      const chartCtx = document.getElementById('pipeline-chart');
      if (chartCtx) {
        if (this.pipelineChart) {
          this.pipelineChart.destroy();
        }
        this.pipelineChart = new Chart(chartCtx, {
          type: 'bar',
          data: {
            labels: stages.map(s => s.label),
            datasets: [{
              label: 'Candidates in Stage',
              data: stages.map(s => s.count),
              backgroundColor: stages.map(s => s.color),
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, ticks: { precision: 0 } },
              x: { grid: { display: false } }
            }
          }
        });
      }

      // Render Top Matching Candidates
      const topList = document.getElementById('top-candidates-list');
      const topCands = analytics.top_candidates || [];
      if (topCands.length === 0) {
        topList.innerHTML = `
          <div class="empty-state" style="padding: 28px;">
            <div class="empty-state-title">No screened candidates yet</div>
            <div class="empty-state-desc">Upload candidate resumes to calculate Job Requirement Match scores.</div>
            <button class="btn btn-primary btn-sm" onclick="App.openUploadModal()">Upload Resumes</button>
          </div>
        `;
      } else {
        topList.innerHTML = topCands.map(c => {
          const score = c.latest_match_score ?? 0;
          const scoreClass = score >= 80 ? 'high' : (score >= 60 ? 'medium' : 'low');
          return `
            <div class="candidate-mini-item">
              <div class="candidate-mini-left">
                <div class="candidate-avatar-circle">${c.full_name.slice(0, 2).toUpperCase()}</div>
                <div class="candidate-mini-info">
                  <h4>${c.full_name}</h4>
                  <p>${c.job_title} &bull; ${c.total_experience_years} yrs exp &bull; ${c.highest_education}</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="score-pill ${scoreClass}">${score.toFixed(1)}% Match</span>
                <button class="btn btn-secondary btn-sm" onclick="CandidateDetailView.open(${c.id})">View Profile</button>
              </div>
            </div>
          `;
        }).join('');
      }

      // Render Skill Chips
      const skillChipsContainer = document.getElementById('dashboard-skill-chips');
      const skills = analytics.top_candidate_skills || [];
      if (skills.length === 0) {
        skillChipsContainer.innerHTML = '<span style="font-size: 11px; color: var(--text-light);">No skills parsed yet</span>';
      } else {
        skillChipsContainer.innerHTML = skills.map(s => `
          <span class="chip chip-tech">${s.name} <b style="margin-left: 4px; color: var(--primary);">${s.count}</b></span>
        `).join('');
      }

      // Render Activity Stream
      const activityContainer = document.getElementById('dashboard-activity-stream');
      const actData = await API.getActivity(6);
      const activities = actData.activities || [];
      if (activities.length === 0) {
        activityContainer.innerHTML = '<div style="font-size: 11px; color: var(--text-light); text-align: center; padding: 12px;">No activity logged yet</div>';
      } else {
        activityContainer.innerHTML = activities.map(a => `
          <div class="activity-item">
            <div class="activity-icon-bullet">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="activity-content">
              <div class="activity-desc">${a.description}</div>
              <div class="activity-time">${new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; ${new Date(a.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        `).join('');
      }

    } catch (e) {
      console.error("Dashboard load failed:", e);
    }
  }
};
