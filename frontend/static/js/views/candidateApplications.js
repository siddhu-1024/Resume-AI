/**
 * Candidate Applications View ("My Applications")
 * Allows candidate to track submitted applications and inspect transparent requirement matching.
 */
const CandidateApplicationsView = {
  async render(container) {
    if (!State.isAuthenticated || State.currentRole !== 'candidate') {
      container.innerHTML = `
        <div class="auth-required-box">
          <h2>Candidate Sign In Required</h2>
          <p>Please log in to view your submitted job applications and track recruitment status.</p>
          <div class="auth-btn-row">
            <a href="#/candidate-login" class="btn btn-primary">Sign In</a>
            <a href="#/candidate-register" class="btn btn-secondary">Create Account</a>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="loading-state-box">
        <div class="loading-spinner"></div>
        <p>Loading your applications...</p>
      </div>
    `;

    const apps = await State.loadMyApplications();

    container.innerHTML = `
      <div class="applications-page-wrapper">
        <div class="page-header">
          <div class="page-title-group">
            <h1 class="page-heading">My Applications</h1>
            <p class="page-subheading">Track the real-time status of your submitted job applications.</p>
          </div>
          <div class="page-actions">
            <a href="#/jobs" class="btn btn-primary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Browse More Jobs
            </a>
          </div>
        </div>

        ${apps.length === 0 ? `
          <div class="empty-state-card">
            <div class="empty-icon-wrap">
              <img src="/static/assets/icons/05-resume.svg" alt="Resume Document" class="empty-state-icon-img">
            </div>
            <h3>No applications yet</h3>
            <p>You haven't submitted any job applications yet. Browse active openings to find your next career step.</p>
            <div style="margin-top: 16px;">
              <a href="#/jobs" class="btn btn-primary">Browse Available Jobs</a>
            </div>
          </div>
        ` : `
          <div class="applications-table-card">
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
                  ${apps.map(app => {
                    const matchPercent = Math.round(app.match_score || 0);
                    let scoreClass = 'score-low';
                    if (matchPercent >= 75) scoreClass = 'score-high';
                    else if (matchPercent >= 50) scoreClass = 'score-mid';

                    return `
                      <tr>
                        <td>
                          <div class="table-job-title">${escapeHtml(app.job_title || 'Position')}</div>
                          <div class="table-job-sub">${escapeHtml(app.job_location || 'Remote')} &bull; ${escapeHtml(app.employment_type || 'Full-time')}</div>
                        </td>
                        <td>${escapeHtml(app.job_department || 'General')}</td>
                        <td>${new Date(app.created_at).toLocaleDateString()}</td>
                        <td>
                          <div class="match-score-pill ${scoreClass}">
                            ${matchPercent}% Match
                          </div>
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
          </div>
        `}
      </div>
    `;
  },

  async openDetailsModal(appId) {
    App.openGenericModal('Application Details & Match Summary', '<div class="loading-state-box"><div class="loading-spinner"></div><p>Loading application...</p></div>');

    try {
      const app = await API.getApplication(appId);
      const sr = app.screening_result || {};
      const matchScore = Math.round(app.match_score || sr.overall_match_score || 0);

      let matchedReqs = [];
      let partialReqs = [];
      let missingReqs = [];

      try { matchedReqs = JSON.parse(sr.matched_requirements_json || '[]'); } catch(e){}
      try { partialReqs = JSON.parse(sr.partial_requirements_json || '[]'); } catch(e){}
      try { missingReqs = JSON.parse(sr.missing_requirements_json || '[]'); } catch(e){}

      const bodyHtml = `
        <div class="candidate-app-detail-modal">
          <!-- Top Summary Row -->
          <div class="app-modal-header-banner">
            <div>
              <h2 class="app-modal-job-title">${escapeHtml(app.job?.title || app.job_title || 'Job Opening')}</h2>
              <div class="app-modal-meta">
                <span>Applied on ${new Date(app.created_at).toLocaleDateString()}</span> &bull; 
                <span>Status: <b class="status-pill status-${app.status.toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(app.status)}</b></span>
              </div>
            </div>

            <div class="app-modal-actions">
              <a href="/api/applications/${app.id}/resume/download" class="btn btn-secondary btn-sm" target="_blank" download>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download Submitted Resume
              </a>
            </div>
          </div>

          <!-- Match Score Banner -->
          <div class="match-score-summary-card">
            <div class="modal-match-icon-badge">
              <img src="/static/assets/icons/07-job-requirement-match.svg" alt="Requirement Match" class="modal-match-icon">
            </div>
            <div class="score-circle-wrap">
              <div class="score-large-number">${matchScore}%</div>
              <div class="score-caption">Requirement Match</div>
            </div>
            <div class="score-explanation-wrap">
              <h4>Job Requirement Match Analysis</h4>
              <p class="score-explanation-text">
                This score reflects how closely your resume aligns with the specific technical skills, experience duration, and qualifications required for this job opening.
              </p>
              <div class="modal-match-progress-wrap" style="margin-top: 10px;">
                <div class="progress-bar-track">
                  <div class="progress-bar-fill ${matchScore >= 75 ? 'fill-high' : (matchScore >= 50 ? 'fill-mid' : 'fill-low')}" style="width: ${matchScore}%;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Matched Requirements Breakdown -->
          <div class="screening-section-modal">
            <h4 class="modal-section-title">Requirements Breakdown</h4>
            <div class="requirement-chips-grid">
              ${matchedReqs.length > 0 ? `
                <div class="req-category-block">
                  <div class="req-block-label text-success">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Matched Requirements (${matchedReqs.length})
                  </div>
                  <div class="req-pills-list">
                    ${matchedReqs.map(r => `<span class="req-badge req-matched">${escapeHtml(r)}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              ${partialReqs.length > 0 ? `
                <div class="req-category-block">
                  <div class="req-block-label text-warning">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line></svg>
                    Partially Matched (${partialReqs.length})
                  </div>
                  <div class="req-pills-list">
                    ${partialReqs.map(r => `<span class="req-badge req-partial">${escapeHtml(r)}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              ${missingReqs.length > 0 ? `
                <div class="req-category-block">
                  <div class="req-block-label text-muted">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    Not Detected in Resume (${missingReqs.length})
                  </div>
                  <div class="req-pills-list">
                    ${missingReqs.map(r => `<span class="req-badge req-missing">${escapeHtml(r)}</span>`).join('')}
                  </div>
                  <div class="hint-text">* "Not detected" indicates no explicit mention was identified in the submitted resume text.</div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Submitted Candidate Details -->
          <div class="screening-section-modal">
            <h4 class="modal-section-title">Submitted Profile Information</h4>
            <div class="profile-info-grid">
              <div><b>Full Name:</b> ${escapeHtml(app.candidate?.full_name || 'Candidate')}</div>
              <div><b>Email:</b> ${escapeHtml(app.candidate?.email || 'N/A')}</div>
              <div><b>Phone:</b> ${escapeHtml(app.candidate?.phone || 'N/A')}</div>
              <div><b>Location:</b> ${escapeHtml(app.candidate?.location || 'N/A')}</div>
              <div><b>Experience Detected:</b> ${app.candidate?.total_experience_years ? `${app.candidate.total_experience_years} years` : 'N/A'}</div>
              <div><b>Education:</b> ${escapeHtml(app.candidate?.highest_education || 'N/A')}</div>
            </div>
          </div>
        </div>
      `;

      App.openGenericModal(`Application: ${app.job?.title || 'Job Opening'}`, bodyHtml);
    } catch (err) {
      App.openGenericModal('Error', `<div class="error-state-card"><p>${escapeHtml(err.message)}</p></div>`);
    }
  }
};
