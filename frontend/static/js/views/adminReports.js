/**
 * Admin Reports & Data Export View
 * Practical recruitment metrics, pipeline status distribution charts, position breakdown, and CSV export.
 */
const AdminReportsView = {
  async render(container) {
    if (!State.isAuthenticated || State.currentRole !== 'admin') {
      container.innerHTML = `<div class="auth-required-box"><h2>Admin Sign In Required</h2></div>`;
      return;
    }

    container.innerHTML = `
      <div class="loading-state-box">
        <div class="loading-spinner"></div>
        <p>Generating recruitment reports...</p>
      </div>
    `;

    try {
      const [jobs, res] = await Promise.all([
        State.loadJobs(),
        API.getAllApplications()
      ]);

      const applications = res.applications || [];

      // Calculate aggregated metrics
      const totalApps = applications.length;
      const appliedCount = applications.filter(a => a.status === 'Applied').length;
      const reviewCount = applications.filter(a => a.status === 'Under Review').length;
      const shortCount = applications.filter(a => a.status === 'Shortlisted').length;
      const interviewCount = applications.filter(a => a.status === 'Interview').length;
      const selectedCount = applications.filter(a => a.status === 'Selected').length;
      const rejectedCount = applications.filter(a => a.status === 'Rejected').length;

      const avgMatch = totalApps > 0 
        ? Math.round(applications.reduce((acc, a) => acc + (a.match_score || 0), 0) / totalApps) 
        : 0;

      // Status percentages for multi-bar
      const pApplied = totalApps > 0 ? (appliedCount / totalApps) * 100 : 0;
      const pReview = totalApps > 0 ? (reviewCount / totalApps) * 100 : 0;
      const pShort = totalApps > 0 ? (shortCount / totalApps) * 100 : 0;
      const pInt = totalApps > 0 ? (interviewCount / totalApps) * 100 : 0;
      const pSel = totalApps > 0 ? (selectedCount / totalApps) * 100 : 0;
      const pRej = totalApps > 0 ? (rejectedCount / totalApps) * 100 : 0;

      container.innerHTML = `
        <div class="admin-reports-wrapper">
          <!-- Header -->
          <div class="page-header">
            <div class="page-title-group">
              <h1 class="page-heading">Recruitment Reports & Analytics</h1>
              <p class="page-subheading">Review pipeline health, stage conversion rates, and export candidate data.</p>
            </div>
            <div class="page-actions">
              <button class="btn btn-primary" id="btn-export-csv">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Export Applicants CSV
              </button>
            </div>
          </div>

          <!-- 4 Executive KPI Cards -->
          <div class="admin-metrics-row">
            <div class="admin-metric-card card-kpi-blue">
              <div class="admin-metric-label">Total Applications</div>
              <div class="admin-metric-value">${totalApps}</div>
              <div class="admin-metric-sub">Across ${jobs.length} active/closed positions</div>
            </div>

            <div class="admin-metric-card card-kpi-amber">
              <div class="admin-metric-label">Shortlisted & Interviewing</div>
              <div class="admin-metric-value">${shortCount + interviewCount}</div>
              <div class="admin-metric-sub">${shortCount} shortlisted &bull; ${interviewCount} in interview</div>
            </div>

            <div class="admin-metric-card card-kpi-emerald">
              <div class="admin-metric-label">Selected / Hired</div>
              <div class="admin-metric-value">${selectedCount}</div>
              <div class="admin-metric-sub">${rejectedCount} rejected across stages</div>
            </div>

            <div class="admin-metric-card card-kpi-dark">
              <div class="admin-metric-label">Average Match Score</div>
              <div class="admin-metric-value">${avgMatch}%</div>
              <div class="admin-metric-sub">Automated requirement alignment</div>
            </div>
          </div>

          <!-- Visual Status Distribution & Conversion Funnel -->
          <div class="admin-section-card">
            <div class="admin-section-header-row">
              <div>
                <h3 class="admin-section-title">Application Status Distribution</h3>
                <p class="admin-section-sub">Candidate distribution across active recruitment pipeline stages</p>
              </div>
              <span class="badge badge-neutral">${totalApps} Total Candidates</span>
            </div>

            <!-- Multi-Color Segmented Progress Bar -->
            ${totalApps > 0 ? `
              <div class="funnel-multi-bar-wrap">
                <div class="funnel-multi-bar">
                  ${pApplied > 0 ? `<div class="bar-seg seg-applied" style="width: ${pApplied}%;" title="Applied: ${appliedCount} (${Math.round(pApplied)}%)"></div>` : ''}
                  ${pReview > 0 ? `<div class="bar-seg seg-review" style="width: ${pReview}%;" title="Under Review: ${reviewCount} (${Math.round(pReview)}%)"></div>` : ''}
                  ${pShort > 0 ? `<div class="bar-seg seg-shortlisted" style="width: ${pShort}%;" title="Shortlisted: ${shortCount} (${Math.round(pShort)}%)"></div>` : ''}
                  ${pInt > 0 ? `<div class="bar-seg seg-interview" style="width: ${pInt}%;" title="Interview: ${interviewCount} (${Math.round(pInt)}%)"></div>` : ''}
                  ${pSel > 0 ? `<div class="bar-seg seg-selected" style="width: ${pSel}%;" title="Selected: ${selectedCount} (${Math.round(pSel)}%)"></div>` : ''}
                  ${pRej > 0 ? `<div class="bar-seg seg-rejected" style="width: ${pRej}%;" title="Rejected: ${rejectedCount} (${Math.round(pRej)}%)"></div>` : ''}
                </div>
              </div>
            ` : ''}

            <!-- 6 Visual Funnel Stage Cards -->
            <div class="status-funnel-grid">
              <div class="funnel-box box-applied">
                <div class="funnel-top">
                  <span class="funnel-dot dot-applied"></span>
                  <span class="funnel-label">Applied</span>
                </div>
                <div class="funnel-value">${appliedCount}</div>
                <div class="funnel-pct">${Math.round(pApplied)}% of total</div>
              </div>

              <div class="funnel-box box-review">
                <div class="funnel-top">
                  <span class="funnel-dot dot-review"></span>
                  <span class="funnel-label">Under Review</span>
                </div>
                <div class="funnel-value">${reviewCount}</div>
                <div class="funnel-pct">${Math.round(pReview)}% of total</div>
              </div>

              <div class="funnel-box box-shortlisted">
                <div class="funnel-top">
                  <span class="funnel-dot dot-shortlisted"></span>
                  <span class="funnel-label">Shortlisted</span>
                </div>
                <div class="funnel-value">${shortCount}</div>
                <div class="funnel-pct">${Math.round(pShort)}% of total</div>
              </div>

              <div class="funnel-box box-interview">
                <div class="funnel-top">
                  <span class="funnel-dot dot-interview"></span>
                  <span class="funnel-label">Interview</span>
                </div>
                <div class="funnel-value">${interviewCount}</div>
                <div class="funnel-pct">${Math.round(pInt)}% of total</div>
              </div>

              <div class="funnel-box box-selected">
                <div class="funnel-top">
                  <span class="funnel-dot dot-selected"></span>
                  <span class="funnel-label">Selected / Hired</span>
                </div>
                <div class="funnel-value">${selectedCount}</div>
                <div class="funnel-pct">${Math.round(pSel)}% of total</div>
              </div>

              <div class="funnel-box box-rejected">
                <div class="funnel-top">
                  <span class="funnel-dot dot-rejected"></span>
                  <span class="funnel-label">Rejected</span>
                </div>
                <div class="funnel-value">${rejectedCount}</div>
                <div class="funnel-pct">${Math.round(pRej)}% of total</div>
              </div>
            </div>
          </div>

          <!-- Position-by-Position Breakdown Table -->
          <div class="admin-table-card">
            <div class="admin-section-header-row" style="padding: 18px 22px; border-bottom: 1px solid var(--border-color); background: linear-gradient(to right, #f8fafc, #f1f5f9);">
              <div>
                <h3 class="admin-section-title">Applications by Job Position</h3>
                <p class="admin-section-sub">Detailed breakdown of applicant volumes, stages, and quality by vacancy</p>
              </div>
              <span class="badge badge-neutral">${jobs.length} Positions</span>
            </div>
            
            ${jobs.length === 0 ? `
              <div class="empty-state-card" style="margin: 20px; border: none;">
                <div class="empty-icon-wrap">
                  <img src="/static/assets/icons/10-reports-analytics.svg" alt="Reports & Analytics" class="empty-state-icon-img">
                </div>
                <p>No job positions created yet.</p>
              </div>
            ` : `
              <div class="table-responsive">
                <table class="clean-table">
                  <thead>
                    <tr>
                      <th>Job Position</th>
                      <th>Status</th>
                      <th>Total Applicants</th>
                      <th>Under Review</th>
                      <th>Shortlisted</th>
                      <th>Interview</th>
                      <th>Selected</th>
                      <th>Avg Match</th>
                      <th style="text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${jobs.map(j => {
                      const jApps = applications.filter(a => a.job_id === j.id);
                      const jReview = jApps.filter(a => a.status === 'Under Review' || a.status === 'Applied').length;
                      const jShort = jApps.filter(a => a.status === 'Shortlisted').length;
                      const jInt = jApps.filter(a => a.status === 'Interview').length;
                      const jSel = jApps.filter(a => a.status === 'Selected').length;
                      const jAvg = jApps.length > 0 
                        ? Math.round(jApps.reduce((sum, a) => sum + (a.match_score || 0), 0) / jApps.length) 
                        : 0;

                      let scoreClass = 'score-low';
                      if (jAvg >= 75) scoreClass = 'score-high';
                      else if (jAvg >= 50) scoreClass = 'score-mid';

                      return `
                        <tr>
                          <td>
                            <div class="table-job-title">${escapeHtml(j.title)}</div>
                            <div class="table-job-sub">${escapeHtml(j.department || 'General')} &bull; ${escapeHtml(j.location || 'Remote')}</div>
                          </td>
                          <td>
                            <span class="status-pill status-${j.status === 'Active' ? 'applied' : 'neutral'}">
                              ${escapeHtml(j.status)}
                            </span>
                          </td>
                          <td>
                            <span class="applicant-count-badge">${jApps.length} Applicants</span>
                          </td>
                          <td><span class="stage-num ${jReview > 0 ? 'has-val' : ''}">${jReview}</span></td>
                          <td><span class="stage-num ${jShort > 0 ? 'has-val text-success' : ''}">${jShort}</span></td>
                          <td><span class="stage-num ${jInt > 0 ? 'has-val text-primary' : ''}">${jInt}</span></td>
                          <td><span class="stage-num ${jSel > 0 ? 'has-val text-primary' : ''}">${jSel}</span></td>
                          <td>
                            <span class="match-score-pill ${scoreClass}">
                              ${jAvg}% Match
                            </span>
                          </td>
                          <td style="text-align: right;">
                            <button class="btn btn-secondary btn-sm" onclick="AdminApplicantsView.viewJobApplicants(${j.id})">
                              View Applicants &rarr;
                            </button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>
      `;

      // Export CSV handler
      document.getElementById('btn-export-csv')?.addEventListener('click', () => {
        AdminReportsView.exportApplicantsCSV(applications);
      });

    } catch (err) {
      container.innerHTML = `<div class="error-state-card"><p>${escapeHtml(err.message)}</p></div>`;
    }
  },

  exportApplicantsCSV(applications) {
    if (!applications || applications.length === 0) {
      App.showToast('No applicant data to export.', 'warning');
      return;
    }

    const headers = ['Candidate Name', 'Email', 'Phone', 'Location', 'Job Position', 'Requirement Match %', 'Application Status', 'Applied Date'];
    const rows = applications.map(a => {
      const c = a.candidate || {};
      const job = a.job || {};
      const dateStr = a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Recently';
      return [
        `"${(c.full_name || '').replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.phone || '').replace(/"/g, '""')}"`,
        `"${(c.location || '').replace(/"/g, '""')}"`,
        `"${(job.title || a.job_title || '').replace(/"/g, '""')}"`,
        Math.round(a.match_score || 0),
        `"${(a.status || '').replace(/"/g, '""')}"`,
        `"${dateStr}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Applicants_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    App.showToast('CSV report generated and downloaded.', 'success');
  }
};
