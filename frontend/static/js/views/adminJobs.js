/**
 * Admin Job Management View
 * Manage, create, edit, close, reopen, and delete job openings.
 */
const AdminJobsView = {
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
        <p>Loading job openings...</p>
      </div>
    `;

    try {
      const jobs = await State.loadJobs();
      const allApps = await API.getAllApplications();
      const applications = allApps.applications || [];

      container.innerHTML = `
        <div class="admin-jobs-wrapper">
          <div class="page-header">
            <div class="page-title-group">
              <h1 class="page-heading">Job Openings Management</h1>
              <p class="page-subheading">Create and manage your organization's recruitment vacancies and requirement criteria.</p>
            </div>
            <div class="page-actions">
              <button class="btn btn-primary" onclick="App.openCreateJobModal()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Create New Job
              </button>
            </div>
          </div>

          ${jobs.length === 0 ? `
            <div class="empty-state-card">
              <div class="empty-icon-wrap">
                <img src="/static/assets/icons/04-job-opening.svg" alt="Job Openings" class="empty-state-icon-img">
              </div>
              <h4>No job openings posted yet</h4>
              <p>Create your first job opening to start receiving and automatically screening candidate resumes.</p>
              <div style="margin-top: 14px;">
                <button class="btn btn-primary btn-sm" onclick="App.openCreateJobModal()">+ Create Job</button>
              </div>
            </div>
          ` : `
            <div class="admin-table-card">
              <div class="table-responsive">
                <table class="clean-table">
                  <thead>
                    <tr>
                      <th>Job Title & Position</th>
                      <th>Department</th>
                      <th>Location</th>
                      <th>Applicants</th>
                      <th>Status</th>
                      <th>Date Posted</th>
                      <th style="text-align: right;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${jobs.map(job => {
                      const count = applications.filter(a => a.job_id === job.id).length;
                      const isActive = job.status === 'Active';
                      const postedDate = this.formatDate(job.created_at);

                      return `
                        <tr>
                          <td>
                            <div class="table-job-title">${escapeHtml(job.title)}</div>
                            <div class="table-job-sub">${escapeHtml(job.employment_type || 'Full-time')} &bull; ${job.min_experience_years > 0 ? `${job.min_experience_years}+ yrs exp` : 'Any exp'}</div>
                          </td>
                          <td>
                            <span class="dept-text">${escapeHtml(job.department || 'Engineering')}</span>
                          </td>
                          <td>
                            <span class="location-text">${escapeHtml(job.location || 'Remote')}</span>
                          </td>
                          <td>
                            <button class="btn-applicant-pill" onclick="AdminApplicantsView.viewJobApplicants(${job.id})" title="View all applicants for ${escapeHtml(job.title)}">
                              <b>${count}</b> applicants &rarr;
                            </button>
                          </td>
                          <td>
                            <span class="status-pill status-${isActive ? 'applied' : 'neutral'}">
                              ${escapeHtml(job.status || 'Active')}
                            </span>
                          </td>
                          <td>
                            <span class="date-text">${postedDate}</span>
                          </td>
                          <td style="text-align: right;">
                            <div class="table-action-btn-group">
                              <button class="btn btn-secondary btn-sm" onclick="AdminJobsView.openEditJobModal(${job.id})">
                                Edit
                              </button>
                              <button class="btn btn-ghost btn-sm" onclick="AdminJobsView.toggleJobStatus(${job.id}, '${job.status}')">
                                ${isActive ? 'Close' : 'Reopen'}
                              </button>
                              <button class="btn btn-ghost btn-sm btn-action-delete" onclick="AdminJobsView.deleteJob(${job.id}, '${escapeHtml(job.title)}')">
                                Delete
                              </button>
                            </div>
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
    } catch (err) {
      container.innerHTML = `<div class="error-state-card"><p>${escapeHtml(err.message)}</p></div>`;
    }
  },

  async openEditJobModal(jobId) {
    try {
      const job = await API.getJob(jobId);
      let reqSkills = [];
      let prefSkills = [];
      try { reqSkills = JSON.parse(job.required_skills || '[]'); } catch(e){}
      try { prefSkills = JSON.parse(job.preferred_skills || '[]'); } catch(e){}

      const html = `
        <form id="form-edit-job" class="admin-job-form">
          <div id="edit-job-error" class="form-alert form-alert-danger" style="display: none;"></div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="edit-title">Job Title <span class="required">*</span></label>
              <input type="text" id="edit-title" class="form-input" value="${escapeHtml(job.title)}" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="edit-dept">Department</label>
              <input type="text" id="edit-dept" class="form-input" value="${escapeHtml(job.department || '')}">
            </div>
          </div>

          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label" for="edit-location">Location</label>
              <input type="text" id="edit-location" class="form-input" value="${escapeHtml(job.location || 'Remote')}">
            </div>
            <div class="form-group">
              <label class="form-label" for="edit-type">Employment Type</label>
              <select id="edit-type" class="form-select" title="Employment Type" aria-label="Employment Type">
                <option value="Full-time" ${job.employment_type === 'Full-time' ? 'selected' : ''}>Full-time</option>
                <option value="Part-time" ${job.employment_type === 'Part-time' ? 'selected' : ''}>Part-time</option>
                <option value="Contract" ${job.employment_type === 'Contract' ? 'selected' : ''}>Contract</option>
                <option value="Internship" ${job.employment_type === 'Internship' ? 'selected' : ''}>Internship</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="edit-status">Status</label>
              <select id="edit-status" class="form-select" title="Job Status" aria-label="Job Status">
                <option value="Active" ${job.status === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Closed" ${job.status === 'Closed' ? 'selected' : ''}>Closed</option>
                <option value="Draft" ${job.status === 'Draft' ? 'selected' : ''}>Draft</option>
              </select>
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="edit-min-exp">Min Experience (Years)</label>
              <input type="number" step="0.5" id="edit-min-exp" class="form-input" value="${job.min_experience_years || 0}">
            </div>
            <div class="form-group">
              <label class="form-label" for="edit-salary">Salary Range (Optional)</label>
              <input type="text" id="edit-salary" class="form-input" value="${escapeHtml(job.salary_range || '')}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-desc">Job Description <span class="required">*</span></label>
            <textarea id="edit-desc" class="form-textarea" rows="5" required>${escapeHtml(job.raw_description || '')}</textarea>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="edit-req-skills">Required Skills (Comma-separated)</label>
              <input type="text" id="edit-req-skills" class="form-input" value="${escapeHtml(reqSkills.join(', '))}">
            </div>
            <div class="form-group">
              <label class="form-label" for="edit-pref-skills">Preferred Skills (Comma-separated)</label>
              <input type="text" id="edit-pref-skills" class="form-input" value="${escapeHtml(prefSkills.join(', '))}">
            </div>
          </div>

          <div class="modal-form-actions" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color);">
            <button type="button" class="btn btn-secondary" onclick="App.closeAllModals()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-save-edit-job">Save Changes</button>
          </div>
        </form>
      `;

      App.openGenericModal(`Edit Job: ${job.title}`, html);

      const form = document.getElementById('form-edit-job');
      form.onsubmit = async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('btn-save-edit-job');
        const errBox = document.getElementById('edit-job-error');
        errBox.style.display = 'none';

        const reqSkillsArr = document.getElementById('edit-req-skills').value.split(',').map(s => s.trim()).filter(Boolean);
        const prefSkillsArr = document.getElementById('edit-pref-skills').value.split(',').map(s => s.trim()).filter(Boolean);

        const payload = {
          title: document.getElementById('edit-title').value.trim(),
          department: document.getElementById('edit-dept').value.trim(),
          location: document.getElementById('edit-location').value.trim(),
          employment_type: document.getElementById('edit-type').value,
          status: document.getElementById('edit-status').value,
          min_experience_years: parseFloat(document.getElementById('edit-min-exp').value) || 0,
          salary_range: document.getElementById('edit-salary').value.trim(),
          raw_description: document.getElementById('edit-desc').value.trim(),
          required_skills: reqSkillsArr,
          preferred_skills: prefSkillsArr
        };

        try {
          saveBtn.disabled = true;
          await API.updateJob(jobId, payload);
          App.showToast('Job opening updated successfully.', 'success');
          App.closeAllModals();
          await AdminJobsView.render(document.getElementById('app-view-container'));
        } catch (err) {
          errBox.textContent = err.message || 'Failed to update job.';
          errBox.style.display = 'block';
          saveBtn.disabled = false;
        }
      };

    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  async toggleJobStatus(jobId, currentStatus) {
    const newStatus = currentStatus === 'Active' ? 'Closed' : 'Active';
    try {
      await API.updateJob(jobId, { status: newStatus });
      App.showToast(`Job status updated to '${newStatus}'.`, 'success');
      await AdminJobsView.render(document.getElementById('app-view-container'));
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  async deleteJob(jobId, title) {
    if (!confirm(`Are you sure you want to delete the job position "${title}"? This will also remove its application associations.`)) {
      return;
    }
    try {
      await API.deleteJob(jobId);
      App.showToast('Job opening deleted successfully.', 'success');
      await AdminJobsView.render(document.getElementById('app-view-container'));
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  }
};
