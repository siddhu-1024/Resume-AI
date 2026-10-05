/**
 * Admin Recruitment Dashboard View — Official, Consistent, Clean
 * High-clarity dashboard showing active positions, recent applicants, and 4 key pipeline metrics.
 */
const AdminDashboardView = {
  async render(container) {
    if (!State.isAuthenticated || State.currentRole !== 'admin') {
      container.innerHTML = `
        <div class="auth-required-box">
          <h2>Admin Privileges Required</h2>
          <p>Please sign in with an Admin account to access the recruiter dashboard.</p>
          <div class="auth-btn-row">
            <a href="#/admin-login" class="btn btn-primary">Admin Sign In</a>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="loading-state-box">
        <div class="loading-spinner"></div>
        <p>Loading recruitment dashboard...</p>
      </div>
    `;

    try {
      const [jobs, allApps] = await Promise.all([
        State.loadJobs(),
        API.getAllApplications()
      ]);

      const applications = allApps.applications || [];
      const activeJobs = jobs.filter(j => j.status === 'Active');
      const toReviewCount = applications.filter(a => a.status === 'Applied' || a.status === 'Under Review').length;
      const shortlistedCount = applications.filter(a => a.status === 'Shortlisted' || a.status === 'Selected').length;
      const interviewCount = applications.filter(a => a.status === 'Interview').length;

      const recentApps = applications.slice(0, 6);

      container.innerHTML = `
        <div class="admin-dashboard-clean">
          <!-- Page Header -->
          <div class="page-header">
            <div class="page-title-group">
              <h1 class="page-heading">Recruiter Dashboard</h1>
              <p class="page-subheading">Manage job vacancies, track candidate pipelines, and review applications.</p>
            </div>
            <div class="page-actions">
              <button class="btn btn-primary" onclick="App.openCreateJobModal()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Create Job
              </button>
            </div>
          </div>

          <!-- 4 Useful Metric Cards -->
          <div class="metrics-row-clean">
            <div class="clean-metric-card">
              <div class="metric-clean-label">Active Jobs</div>
              <div class="metric-clean-value text-primary">${activeJobs.length}</div>
              <div class="metric-clean-sub">${jobs.length} total vacancies posted</div>
            </div>

            <div class="clean-metric-card">
              <div class="metric-clean-label">Applications to Review</div>
              <div class="metric-clean-value text-warning">${toReviewCount}</div>
              <div class="metric-clean-sub">Pending screening review</div>
            </div>

            <div class="clean-metric-card">
              <div class="metric-clean-label">Shortlisted</div>
              <div class="metric-clean-value text-success">${shortlistedCount}</div>
              <div class="metric-clean-sub">Qualified candidate pool</div>
            </div>

            <div class="clean-metric-card">
              <div class="metric-clean-label">Interviews</div>
              <div class="metric-clean-value text-primary">${interviewCount}</div>
              <div class="metric-clean-sub">In active interview stages</div>
            </div>
          </div>

          <!-- Job Openings Section -->
          <div class="clean-section-card">
            <div class="clean-section-header">
              <h2 class="clean-section-title">Job Openings</h2>
              <a href="#/admin/jobs" class="text-primary-link font-medium">Manage All Jobs &rarr;</a>
            </div>

            ${jobs.length === 0 ? `
              <div class="empty-state-card">
                <div class="empty-icon-wrap">
                  <img src="/static/assets/icons/04-job-opening.svg" alt="Job Openings" class="empty-state-icon-img">
                </div>
                <h4>No job openings created yet</h4>
                <p>Create your first job vacancy to begin receiving candidate applications.</p>
                <div style="margin-top: 14px;">
                  <button class="btn btn-primary btn-sm" onclick="App.openCreateJobModal()">+ Create Job</button>
                </div>
              </div>
            ` : `
              <div class="table-responsive">
                <table class="clean-table">
                  <thead>
                    <tr>
                      <th>Job Title</th>
                      <th>Department</th>
                      <th>Location</th>
                      <th>Applicants</th>
                      <th>Status</th>
                      <th style="text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${jobs.map(job => {
                      const count = applications.filter(a => a.job_id === job.id).length;
                      return `
                        <tr>
                          <td>
                            <div class="table-job-title">${escapeHtml(job.title)}</div>
                            <div class="table-job-sub">${escapeHtml(job.employment_type || 'Full-time')}</div>
                          </td>
                          <td>${escapeHtml(job.department || 'General')}</td>
                          <td>${escapeHtml(job.location || 'Remote')}</td>
                          <td>
                            <span class="applicant-count-text"><b>${count}</b> Applicants</span>
                          </td>
                          <td>
                            <span class="status-pill status-${job.status === 'Active' ? 'applied' : 'neutral'}">
                              ${escapeHtml(job.status)}
                            </span>
                          </td>
                          <td style="text-align: right;">
                            <button class="btn btn-primary btn-sm" onclick="AdminApplicantsView.viewJobApplicants(${job.id})">
                              View Applicants
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

          <!-- Recent Applications Section -->
          <div class="clean-section-card">
            <div class="clean-section-header">
              <h2 class="clean-section-title">Recent Applications</h2>
              <a href="#/admin/applicants" class="text-primary-link font-medium">View All Applicants &rarr;</a>
            </div>

            ${recentApps.length === 0 ? `
              <div class="empty-state-card">
                <div class="empty-icon-wrap">
                  <img src="/static/assets/icons/08-applicants.svg" alt="Applicants" class="empty-state-icon-img">
                </div>
                <p>No applications received yet.</p>
              </div>
            ` : `
              <div class="table-responsive">
                <table class="clean-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Job Position</th>
                      <th>Applied Date</th>
                      <th>Requirement Match</th>
                      <th>Status</th>
                      <th style="text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recentApps.map(app => {
                      const c = app.candidate || {};
                      const matchPercent = Math.round(app.match_score || 0);
                      let scoreClass = 'score-low';
                      if (matchPercent >= 75) scoreClass = 'score-high';
                      else if (matchPercent >= 50) scoreClass = 'score-mid';

                      const appDate = app.created_at ? new Date(app.created_at) : null;
                      const dateStr = appDate && !isNaN(appDate.getTime()) ? appDate.toLocaleDateString() : 'Recently';

                      return `
                        <tr>
                          <td>
                            <div class="table-job-title">${escapeHtml(c.full_name || 'Candidate')}</div>
                            <div class="table-job-sub">${escapeHtml(c.email || '')}</div>
                          </td>
                          <td>${escapeHtml(app.job?.title || app.job_title || 'Position')}</td>
                          <td>${dateStr}</td>
                          <td>
                            <span class="match-score-pill ${scoreClass}">
                              ${matchPercent}% Match
                            </span>
                          </td>
                          <td>
                            <span class="status-pill status-${app.status.toLowerCase().replace(/\s+/g, '-')}">
                              ${escapeHtml(app.status)}
                            </span>
                          </td>
                          <td style="text-align: right;">
                            <button class="btn btn-secondary btn-sm" onclick="AdminApplicantsView.openReviewModal(${app.id})">
                              Review
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
    } catch (err) {
      container.innerHTML = `<div class="error-state-card"><p>${escapeHtml(err.message)}</p></div>`;
    }
  }
};
