/**
 * Candidate Dashboard View — Welcoming, Official, Clean
 * Shows "Welcome back, [Name]", 4 summary status cards, My Applications, and Available Jobs.
 */
const CandidateDashboardView = {
  async render(container) {
    if (!State.isAuthenticated || State.currentRole !== 'candidate') {
      AuthView.renderCandidateLogin(container);
      return;
    }

    container.innerHTML = `
      <div class="loading-state-box">
        <div class="loading-spinner"></div>
        <p>Loading candidate dashboard...</p>
      </div>
    `;

    try {
      const [jobs, myApps] = await Promise.all([
        State.loadJobs({ status: 'Active' }),
        State.loadMyApplications()
      ]);

      const candidateName = State.currentUser?.full_name || 'Candidate';
      const appliedJobIds = new Set(myApps.map(a => a.job_id));

      const totalApps = myApps.length;
      const underReviewCount = myApps.filter(a => a.status === 'Under Review' || a.status === 'Applied').length;
      const shortlistedCount = myApps.filter(a => a.status === 'Shortlisted' || a.status === 'Selected').length;
      const interviewCount = myApps.filter(a => a.status === 'Interview').length;

      container.innerHTML = `
        <div class="candidate-dashboard-clean">
          <!-- Welcoming Header -->
          <div class="page-header">
            <div class="page-title-group">
              <h1 class="page-heading">Welcome back, ${escapeHtml(candidateName)}</h1>
              <p class="page-subheading">Track your job applications and discover active job openings.</p>
            </div>
            <div class="page-actions">
              <a href="#/jobs" class="btn btn-primary btn-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                Browse All Jobs
              </a>
            </div>
          </div>

          <!-- 4 Useful Summary Cards -->
          <div class="metrics-row-clean">
            <div class="clean-metric-card">
              <div class="metric-clean-label">Applications</div>
              <div class="metric-clean-value text-primary">${totalApps}</div>
              <div class="metric-clean-sub">Submitted to open positions</div>
            </div>

            <div class="clean-metric-card">
              <div class="metric-clean-label">Under Review</div>
              <div class="metric-clean-value text-warning">${underReviewCount}</div>
              <div class="metric-clean-sub">Being screened by recruiters</div>
            </div>

            <div class="clean-metric-card">
              <div class="metric-clean-label">Shortlisted</div>
              <div class="metric-clean-value text-success">${shortlistedCount}</div>
              <div class="metric-clean-sub">Qualified applications</div>
            </div>

            <div class="clean-metric-card">
              <div class="metric-clean-label">Interviews</div>
              <div class="metric-clean-value text-primary">${interviewCount}</div>
              <div class="metric-clean-sub">Invited for interview stage</div>
            </div>
          </div>

          <!-- My Applications Section -->
          <div class="clean-section-card">
            <div class="clean-section-header">
              <h2 class="clean-section-title">My Applications (${myApps.length})</h2>
              <a href="#/my-applications" class="text-primary-link font-medium">View All &rarr;</a>
            </div>

            ${myApps.length === 0 ? `
              <div class="empty-state-card">
                <div class="empty-icon-wrap">
                  <img src="/static/assets/icons/05-resume.svg" alt="Resume Document" class="empty-state-icon-img">
                </div>
                <h4>No applications submitted yet</h4>
                <p>Browse active job openings below and submit your resume to start applying.</p>
                <div style="margin-top: 12px;">
                  <a href="#/jobs" class="btn btn-primary btn-sm">Browse Available Jobs</a>
                </div>
              </div>
            ` : `
              <div class="table-responsive">
                <table class="clean-table">
                  <thead>
                    <tr>
                      <th>Job Position</th>
                      <th>Department</th>
                      <th>Applied Date</th>
                      <th>Requirement Match</th>
                      <th>Status</th>
                      <th style="text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${myApps.slice(0, 4).map(app => {
                      const matchPercent = Math.round(app.match_score || 0);
                      let scoreClass = 'score-low';
                      if (matchPercent >= 75) scoreClass = 'score-high';
                      else if (matchPercent >= 50) scoreClass = 'score-mid';

                      const appDate = app.created_at ? new Date(app.created_at) : null;
                      const dateStr = appDate && !isNaN(appDate.getTime()) ? appDate.toLocaleDateString() : 'Recently';

                      return `
                        <tr>
                          <td>
                            <div class="table-job-title">${escapeHtml(app.job_title || 'Position')}</div>
                            <div class="table-job-sub">${escapeHtml(app.job_location || 'Remote')}</div>
                          </td>
                          <td>${escapeHtml(app.job_department || 'General')}</td>
                          <td>${dateStr}</td>
                          <td>
                            <span class="match-score-pill ${scoreClass}">${matchPercent}% Match</span>
                          </td>
                          <td>
                            <span class="status-pill status-${app.status.toLowerCase().replace(/\s+/g, '-')}">
                              ${escapeHtml(app.status)}
                            </span>
                          </td>
                          <td style="text-align: right;">
                            <button class="btn btn-secondary btn-sm" onclick="CandidateApplicationsView.openDetailsModal(${app.id})">
                              View Details
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

          <!-- Available Jobs Section -->
          <div class="clean-section-card">
            <div class="clean-section-header">
              <h2 class="clean-section-title">Available Job Openings</h2>
              <a href="#/jobs" class="text-primary-link font-medium">Search & Filter Jobs &rarr;</a>
            </div>

            <div class="landing-jobs-grid">
              ${jobs.slice(0, 4).map(job => {
                const isApplied = appliedJobIds.has(job.id);
                let reqSkills = [];
                try { reqSkills = JSON.parse(job.required_skills || '[]'); } catch(e){}

                    const jobDate = job.created_at ? new Date(job.created_at) : null;
                    const jobDateStr = jobDate && !isNaN(jobDate.getTime()) ? jobDate.toLocaleDateString() : 'Recently';

                    return `
                  <div class="simple-job-card" onclick="App.navigate('jobs/${job.id}')">
                    <div class="simple-job-top">
                      <div>
                        <h3 class="simple-job-title">${escapeHtml(job.title)}</h3>
                        <div class="simple-job-dept">${escapeHtml(job.department || 'General')} &bull; ${escapeHtml(job.location || 'Remote')}</div>
                      </div>
                      ${isApplied ? `
                        <span class="badge badge-applied-pill">Applied</span>
                      ` : `
                        <span class="badge badge-success">Active</span>
                      `}
                    </div>

                    <div class="simple-job-meta">
                      <span>${escapeHtml(job.employment_type || 'Full-time')}</span> &bull; 
                      <span>${job.min_experience_years > 0 ? `${job.min_experience_years}+ yrs exp` : 'Any exp'}</span>
                    </div>

                    <div class="simple-job-skills">
                      ${reqSkills.slice(0, 4).map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}
                      ${reqSkills.length > 4 ? `<span class="skill-tag-more">+${reqSkills.length - 4}</span>` : ''}
                    </div>

                    <div class="simple-job-footer">
                      <span class="post-date">Posted ${jobDateStr}</span>
                      <span class="view-job-link">${isApplied ? 'View Application &rarr;' : 'View Job &rarr;'}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state-card"><p>${escapeHtml(err.message)}</p></div>`;
    }
  }
};
