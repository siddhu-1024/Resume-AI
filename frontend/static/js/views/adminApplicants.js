/**
 * Admin Applicants Management & Detailed Screening Review
 * Transparent, grounded candidate review with resume viewer, requirement matching, and recruiter actions.
 */
const AdminApplicantsView = {
  selectedJobId: 'all',
  activeStatusTab: 'all',
  searchQuery: '',
  sortBy: 'match_desc',

  async viewJobApplicants(jobId) {
    this.selectedJobId = jobId;
    this.activeStatusTab = 'all';
    App.navigate('admin/applicants');
  },

  formatDate(dateStr) {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString();
  },

  async render(container) {
    if (!State.isAuthenticated || State.currentRole !== 'admin') {
      container.innerHTML = `<div class="auth-required-box"><h2>Admin Sign In Required</h2></div>`;
      return;
    }

    container.innerHTML = `
      <div class="loading-state-box">
        <div class="loading-spinner"></div>
        <p>Loading applicants...</p>
      </div>
    `;

    try {
      const jobs = await State.loadJobs();
      
      const params = {
        sort_by: this.sortBy
      };
      if (this.selectedJobId && this.selectedJobId !== 'all') {
        params.job_id = this.selectedJobId;
      }
      if (this.activeStatusTab && this.activeStatusTab !== 'all') {
        params.status = this.activeStatusTab;
      }
      if (this.searchQuery) {
        params.search = this.searchQuery;
      }

      const res = await API.getAllApplications(params);
      const applications = res.applications || [];

      const selectedJob = jobs.find(j => j.id === Number(this.selectedJobId));
      const pageTitle = selectedJob ? `${selectedJob.title} — Applicants` : 'All Applicants';

      const statusTabs = [
        { id: 'all', label: 'All Applicants' },
        { id: 'Applied', label: 'Applied' },
        { id: 'Under Review', label: 'Under Review' },
        { id: 'Shortlisted', label: 'Shortlisted' },
        { id: 'Interview', label: 'Interview' },
        { id: 'Selected', label: 'Selected' },
        { id: 'Rejected', label: 'Rejected' }
      ];

      container.innerHTML = `
        <div class="admin-applicants-wrapper">
          <!-- Page Header -->
          <div class="page-header">
            <div class="page-title-group">
              <h1 class="page-heading">${escapeHtml(pageTitle)}</h1>
              <p class="page-subheading">Review applicant qualifications, inspect requirement match evidence, and manage pipeline progression.</p>
            </div>

            <div class="page-actions">
              <div class="job-filter-select-wrap">
                <label for="admin-job-filter" class="form-label-inline">Job Opening:</label>
                <select id="admin-job-filter" class="form-select select-sm filter-job-select" title="Select Job Opening" aria-label="Select Job Opening">
                  <option value="all">All Positions (${jobs.length} Total)</option>
                  ${jobs.map(j => `<option value="${j.id}" ${String(this.selectedJobId) === String(j.id) ? 'selected' : ''}>${escapeHtml(j.title)}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>

          <!-- Status Filter Tabs & Search Bar Card -->
          <div class="applicants-controls-card">
            <!-- Status Tabs -->
            <div class="status-tabs-row">
              ${statusTabs.map(tab => {
                const isActive = this.activeStatusTab.toLowerCase() === tab.id.toLowerCase();
                return `
                  <button class="status-tab-btn ${isActive ? 'active' : ''}" data-status="${tab.id}">
                    ${escapeHtml(tab.label)}
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Search & Sort Row -->
            <div class="applicants-search-sort-row">
              <div class="search-input-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" id="applicants-search-input" class="search-input-field" placeholder="Search applicants by name, email, skills, or location..." value="${escapeHtml(this.searchQuery)}">
              </div>

              <div class="sort-select-wrap">
                <label for="applicants-sort-select" class="form-label-inline">Sort by:</label>
                <select id="applicants-sort-select" class="form-select select-sm sort-dropdown" title="Sort Applicants" aria-label="Sort Applicants">
                  <option value="match_desc" ${this.sortBy === 'match_desc' ? 'selected' : ''}>Highest Requirement Match</option>
                  <option value="match_asc" ${this.sortBy === 'match_asc' ? 'selected' : ''}>Lowest Requirement Match</option>
                  <option value="date_desc" ${this.sortBy === 'date_desc' ? 'selected' : ''}>Most Recently Applied</option>
                  <option value="date_asc" ${this.sortBy === 'date_asc' ? 'selected' : ''}>Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Applicants List / Table Card -->
          ${applications.length === 0 ? `
            <div class="empty-state-card">
              <div class="empty-icon-wrap">
                <img src="/static/assets/icons/08-applicants.svg" alt="Applicants" class="empty-state-icon-img">
              </div>
              <h4>No matching applicants found</h4>
              <p>Applications matching your filter criteria will appear here with automated requirement screening.</p>
              ${(this.searchQuery || this.activeStatusTab !== 'all' || this.selectedJobId !== 'all') ? `
                <div style="margin-top: 14px;">
                  <button class="btn btn-secondary btn-sm" id="btn-clear-applicant-filters">Clear All Filters</button>
                </div>
              ` : ''}
            </div>
          ` : `
            <div class="admin-table-card">
              <div class="table-responsive">
                <table class="clean-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Job Applied For</th>
                      <th>Applied Date</th>
                      <th>Requirement Match</th>
                      <th>Top Skills</th>
                      <th>Status</th>
                      <th style="text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${applications.map(app => {
                      const c = app.candidate || {};
                      const matchPercent = Math.round(app.match_score || 0);
                      let scoreClass = 'score-low';
                      if (matchPercent >= 75) scoreClass = 'score-high';
                      else if (matchPercent >= 50) scoreClass = 'score-mid';

                      const skills = c.skills || [];
                      const appliedDate = this.formatDate(app.created_at);

                      return `
                        <tr>
                          <td>
                            <div class="candidate-name-strong">${escapeHtml(c.full_name || 'Candidate')}</div>
                            <div class="candidate-email-sub">${escapeHtml(c.email || '')} ${c.location ? `&bull; ${escapeHtml(c.location)}` : ''}</div>
                          </td>
                          <td>
                            <div class="table-job-title">${escapeHtml(app.job?.title || app.job_title || 'Position')}</div>
                            <div class="table-job-sub">${escapeHtml(app.job?.department || '')}</div>
                          </td>
                          <td>${appliedDate}</td>
                          <td>
                            <span class="match-score-pill ${scoreClass}">
                              ${matchPercent}% Match
                            </span>
                          </td>
                          <td>
                            <div class="applicant-skills-cell">
                              ${skills.slice(0, 3).map(s => `<span class="skill-chip-micro">${escapeHtml(s.name || s)}</span>`).join('')}
                              ${skills.length > 3 ? `<span class="skill-chip-more">+${skills.length - 3}</span>` : ''}
                            </div>
                          </td>
                          <td>
                            <span class="status-pill status-${(app.status || 'applied').toLowerCase().replace(/\s+/g, '-')}">
                              ${escapeHtml(app.status || 'Applied')}
                            </span>
                          </td>
                          <td style="text-align: right;">
                            <button class="btn btn-primary btn-sm" onclick="AdminApplicantsView.openReviewModal(${app.id})">
                              Review Application
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

      // Event bindings
      document.getElementById('admin-job-filter')?.addEventListener('change', (e) => {
        this.selectedJobId = e.target.value;
        this.render(container);
      });

      document.getElementById('applicants-sort-select')?.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.render(container);
      });

      document.querySelectorAll('.status-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.activeStatusTab = btn.getAttribute('data-status');
          this.render(container);
        });
      });

      document.getElementById('btn-clear-applicant-filters')?.addEventListener('click', () => {
        this.searchQuery = '';
        this.activeStatusTab = 'all';
        this.selectedJobId = 'all';
        this.render(container);
      });

      let searchTimeout;
      document.getElementById('applicants-search-input')?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchQuery = e.target.value.trim();
          this.render(container);
        }, 300);
      });

    } catch (err) {
      container.innerHTML = `<div class="error-state-card"><p>${escapeHtml(err.message)}</p></div>`;
    }
  },

  async openReviewModal(appId) {
    App.openGenericModal('Candidate Application & Screening Review', '<div class="loading-state-box"><div class="loading-spinner"></div><p>Loading application review...</p></div>');

    try {
      const app = await API.getApplication(appId);
      const c = app.candidate || {};
      const job = app.job || {};
      const sr = app.screening_result || {};
      const matchScore = Math.round(app.match_score || sr.overall_match_score || 0);

      let matchedReqs = [];
      let partialReqs = [];
      let missingReqs = [];
      let concerns = [];
      let matrix = sr.matrix || [];

      try { matchedReqs = JSON.parse(sr.matched_requirements_json || '[]'); } catch(e){}
      try { partialReqs = JSON.parse(sr.partial_requirements_json || '[]'); } catch(e){}
      try { missingReqs = JSON.parse(sr.missing_requirements_json || '[]'); } catch(e){}
      try { concerns = JSON.parse(sr.potential_concerns_json || '[]'); } catch(e){}

      const notes = app.notes || [];
      const appliedDate = this.formatDate(app.created_at);

      const modalHtml = `
        <div class="admin-review-modal-body">
          <!-- Candidate Header Profile -->
          <div class="review-candidate-header">
            <div class="cand-header-main">
              <div class="cand-avatar-circle">
                ${escapeHtml(c.full_name ? c.full_name.substring(0, 2).toUpperCase() : 'CA')}
              </div>
              <div>
                <h2 class="cand-name-title">${escapeHtml(c.full_name || 'Candidate')}</h2>
                <div class="cand-contact-meta">
                  <span>${escapeHtml(c.email || '')}</span> &bull; 
                  <span>${escapeHtml(c.phone || 'No phone')}</span> &bull; 
                  <span>${escapeHtml(c.location || 'Remote')}</span>
                </div>
                <div class="cand-application-context">
                  Applied for <b>${escapeHtml(job.title || 'Position')}</b> on ${appliedDate}
                </div>
              </div>
            </div>

            <div class="cand-header-actions">
              <span class="status-pill status-${(app.status || 'applied').toLowerCase().replace(/\s+/g, '-')}" id="review-current-status-pill">
                ${escapeHtml(app.status || 'Applied')}
              </span>
              <a href="/api/applications/${app.id}/resume/download" class="btn btn-secondary btn-sm" target="_blank" download>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download Resume
              </a>
            </div>
          </div>

          <!-- Recruitment Action Pipeline Buttons -->
          <div class="recruiter-action-bar">
            <div class="action-bar-label">Recruiter Pipeline Action:</div>
            <div class="action-buttons-group">
              <button class="btn btn-sm ${app.status === 'Under Review' ? 'btn-primary' : 'btn-secondary'}" onclick="AdminApplicantsView.updateStatus(${app.id}, 'Under Review')">
                Under Review
              </button>
              <button class="btn btn-sm btn-success-action ${app.status === 'Shortlisted' ? 'btn-primary' : ''}" onclick="AdminApplicantsView.updateStatus(${app.id}, 'Shortlisted')">
                Shortlist Candidate
              </button>
              <button class="btn btn-sm btn-info-action ${app.status === 'Interview' ? 'btn-primary' : ''}" onclick="AdminApplicantsView.updateStatus(${app.id}, 'Interview')">
                Move to Interview
              </button>
              <button class="btn btn-sm btn-select-action ${app.status === 'Selected' ? 'btn-primary' : ''}" onclick="AdminApplicantsView.updateStatus(${app.id}, 'Selected')">
                Select / Hire
              </button>
              <button class="btn btn-sm btn-danger ${app.status === 'Rejected' ? 'disabled' : ''}" onclick="AdminApplicantsView.updateStatus(${app.id}, 'Rejected')">
                Reject Application
              </button>
            </div>
          </div>

          <!-- Match Score & Transparent Breakdown -->
          <div class="review-match-overview-card">
            <div class="modal-match-icon-badge">
              <img src="/static/assets/icons/06-resume-screening.svg" alt="Resume Screening" class="modal-match-icon">
            </div>
            <div class="match-score-left">
              <div class="match-score-big-circle">
                <span class="match-number">${matchScore}%</span>
                <span class="match-label">Job Match</span>
              </div>
            </div>

            <div class="match-score-right">
              <h4 class="score-card-title">Job Requirement Match Breakdown</h4>
              <p class="score-sub-desc">
                Screening score represents requirement-by-requirement alignment across core categories (Required Skills: 30%, Experience: 25%, Technical Skills: 15%, Projects: 10%, Education: 10%, Preferred Skills: 5%, Certifications: 5%).
              </p>

              <div class="subscores-progress-grid">
                <div class="subscore-item">
                  <div class="subscore-header"><span class="font-medium">Required Skills</span><span class="font-bold text-primary">${Math.round(sr.required_skills_score || 0)}%</span></div>
                  <div class="progress-bar-track"><div class="progress-bar-fill" style="width: ${sr.required_skills_score || 0}%;"></div></div>
                </div>
                <div class="subscore-item">
                  <div class="subscore-header"><span class="font-medium">Experience</span><span class="font-bold text-primary">${Math.round(sr.experience_score || 0)}%</span></div>
                  <div class="progress-bar-track"><div class="progress-bar-fill" style="width: ${sr.experience_score || 0}%;"></div></div>
                </div>
                <div class="subscore-item">
                  <div class="subscore-header"><span class="font-medium">Technical Skills</span><span class="font-bold text-primary">${Math.round(sr.technical_skills_score || 0)}%</span></div>
                  <div class="progress-bar-track"><div class="progress-bar-fill" style="width: ${sr.technical_skills_score || 0}%;"></div></div>
                </div>
                <div class="subscore-item">
                  <div class="subscore-header"><span class="font-medium">Education</span><span class="font-bold text-primary">${Math.round(sr.education_score || 0)}%</span></div>
                  <div class="progress-bar-track"><div class="progress-bar-fill" style="width: ${sr.education_score || 0}%;"></div></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Requirement Evidence Matrix -->
          <div class="review-section-card">
            <h3 class="review-section-heading">Requirement-by-Requirement Evidence Analysis</h3>
            
            <div class="evidence-matrix-list">
              ${matrix.length > 0 ? matrix.map(m => {
                let badgeClass = 'badge-missing';
                let icon = '&times;';
                if (m.match_status === 'Matched') {
                  badgeClass = 'badge-matched';
                  icon = '&#10003;';
                } else if (m.match_status === 'Partially Matched') {
                  badgeClass = 'badge-partial';
                  icon = '&sim;';
                }

                return `
                  <div class="evidence-row">
                    <div class="evidence-status-col">
                      <span class="evidence-status-pill ${badgeClass}">
                        <i>${icon}</i> ${escapeHtml(m.match_status)}
                      </span>
                    </div>
                    <div class="evidence-content-col">
                      <div class="evidence-req-title">${escapeHtml(m.requirement_title)}</div>
                      <div class="evidence-proof-text">
                        <b>Evidence:</b> ${escapeHtml(m.candidate_evidence || 'No explicit evidence detected in resume.')}
                      </div>
                    </div>
                  </div>
                `;
              }).join('') : `
                <div class="empty-matrix-note">Matrix details generated during screening.</div>
              `}
            </div>
          </div>

          <!-- Extracted Candidate Background Details -->
          <div class="review-section-card">
            <h3 class="review-section-heading">Candidate Background Details</h3>

            <div class="cand-details-grid">
              <div class="detail-block">
                <span class="detail-block-title">Professional Summary</span>
                <p class="detail-block-text">${escapeHtml(c.professional_summary || 'No summary detected.')}</p>
              </div>

              <div class="detail-block">
                <span class="detail-block-title">Detected Skills</span>
                <div class="skills-pill-cloud">
                  ${(c.skills || []).map(s => `<span class="skill-pill-highlight required">${escapeHtml(s.name || s)}</span>`).join('')}
                </div>
              </div>

              ${(c.experiences && c.experiences.length > 0) ? `
                <div class="detail-block full-width">
                  <span class="detail-block-title">Work Experience (${c.total_experience_years || 0} years detected)</span>
                  <div class="experience-timeline">
                    ${c.experiences.map(exp => `
                      <div class="timeline-item">
                        <div class="timeline-role"><b>${escapeHtml(exp.job_title || 'Role')}</b> &bull; ${escapeHtml(exp.company || 'Company')}</div>
                        <div class="timeline-dates">${escapeHtml(exp.start_date || '')} – ${escapeHtml(exp.end_date || 'Present')}</div>
                        ${exp.description ? `<p class="timeline-desc">${escapeHtml(exp.description)}</p>` : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              ${(c.education && c.education.length > 0) ? `
                <div class="detail-block full-width">
                  <span class="detail-block-title">Education</span>
                  <div class="education-list">
                    ${c.education.map(edu => `
                      <div class="edu-item">
                        <b>${escapeHtml(edu.degree || 'Degree')}</b> &bull; ${escapeHtml(edu.institution || 'Institution')} (${escapeHtml(edu.graduation_year || '')})
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Internal Admin Recruiter Notes (Confidential) -->
          <div class="review-section-card notes-section-card">
            <div class="notes-header-row">
              <h3 class="review-section-heading">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                Internal Recruiter Notes
              </h3>
              <span class="confidential-badge">Visible ONLY to Hiring Team (Admin)</span>
            </div>

            <div id="notes-list-container" class="notes-list-wrap">
              ${notes.length === 0 ? `
                <div class="empty-notes-hint">No internal notes added yet. Record interview feedback or observations below.</div>
              ` : notes.map(n => `
                <div class="admin-note-bubble">
                  <div class="note-meta-row">
                    <span class="note-author"><b>${escapeHtml(n.author || 'Recruiter')}</b></span>
                    <span class="note-time">${new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <div class="note-content-text">${escapeHtml(n.content)}</div>
                </div>
              `).join('')}
            </div>

            <form id="form-add-recruiter-note" class="add-note-form">
              <div class="form-group">
                <textarea id="recruiter-note-input" class="form-textarea" rows="2" placeholder="Add an internal recruiter observation or interview feedback note..." required></textarea>
              </div>
              <div class="note-submit-row">
                <button type="submit" class="btn btn-secondary btn-sm" id="btn-submit-note">
                  Add Internal Note
                </button>
              </div>
            </form>
          </div>
        </div>
      `;

      App.openGenericModal(`Review: ${c.full_name || 'Candidate'} — ${job.title || 'Job'}`, modalHtml);

      // Bind note form
      const noteForm = document.getElementById('form-add-recruiter-note');
      if (noteForm) {
        noteForm.onsubmit = async (e) => {
          e.preventDefault();
          const noteInput = document.getElementById('recruiter-note-input');
          const content = noteInput.value.trim();
          if (!content) return;

          try {
            const res = await API.addApplicationNote(app.id, content);
            App.showToast('Internal note saved.', 'success');
            noteInput.value = '';
            
            // Append note to list
            const notesList = document.getElementById('notes-list-container');
            const newNote = res.note;
            const noteDiv = document.createElement('div');
            noteDiv.className = 'admin-note-bubble';
            noteDiv.innerHTML = `
              <div class="note-meta-row">
                <span class="note-author"><b>${escapeHtml(newNote.author || 'Recruiter')}</b></span>
                <span class="note-time">${new Date(newNote.created_at).toLocaleString()}</span>
              </div>
              <div class="note-content-text">${escapeHtml(newNote.content)}</div>
            `;
            const emptyHint = notesList.querySelector('.empty-notes-hint');
            if (emptyHint) emptyHint.remove();
            notesList.appendChild(noteDiv);
          } catch (err) {
            App.showToast(err.message, 'danger');
          }
        };
      }

    } catch (err) {
      App.openGenericModal('Error', `<div class="error-state-card"><p>${escapeHtml(err.message)}</p></div>`);
    }
  },

  async updateStatus(appId, newStatus) {
    try {
      await API.updateApplicationStatus(appId, newStatus);
      App.showToast(`Candidate status updated to '${newStatus}'.`, 'success');

      // Update pill in modal
      const pill = document.getElementById('review-current-status-pill');
      if (pill) {
        pill.textContent = newStatus;
        pill.className = `status-pill status-${newStatus.toLowerCase().replace(/\s+/g, '-')}`;
      }

      // Refresh main table
      const container = document.getElementById('app-view-container');
      if (container && State.currentView.startsWith('admin/applicants')) {
        await AdminApplicantsView.render(container);
      }
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  }
};
