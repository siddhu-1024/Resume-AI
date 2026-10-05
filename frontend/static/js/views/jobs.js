/**
 * Jobs Management View
 */
const JobsView = {
  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Job Openings & Requirements</h1>
          <p>Create and manage job specifications with automated NLP skill & requirement extraction.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="App.openCreateJobModal()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create Job Opening
          </button>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="card" style="margin-bottom: 20px; padding: 14px 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <input type="text" id="jobs-search-input" class="form-input" placeholder="Filter jobs by title, department, or location..." style="max-width: 340px;">
            <select id="jobs-status-filter" class="form-select" style="max-width: 160px;">
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div style="font-size: 13px; color: var(--text-muted); font-weight: 600;" id="jobs-count-text">
            Showing 0 job opening(s)
          </div>
        </div>
      </div>

      <!-- Jobs Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Job Position</th>
              <th>Department</th>
              <th>Location</th>
              <th>Experience</th>
              <th>Required Skills</th>
              <th>Candidates</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="jobs-table-body">
            <tr>
              <td colspan="8" style="text-align: center; padding: 32px; color: var(--text-muted);">
                Loading jobs...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('jobs-search-input').addEventListener('input', () => this.loadJobsTable());
    document.getElementById('jobs-status-filter').addEventListener('change', () => this.loadJobsTable());

    await this.loadJobsTable();
  },

  async loadJobsTable() {
    const search = document.getElementById('jobs-search-input')?.value || '';
    const status = document.getElementById('jobs-status-filter')?.value || 'all';

    try {
      const data = await API.getJobs({ search, status });
      const jobs = data.jobs || [];
      const tbody = document.getElementById('jobs-table-body');
      const countText = document.getElementById('jobs-count-text');

      if (countText) countText.textContent = `Showing ${jobs.length} job opening(s)`;

      if (jobs.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8">
              <div class="empty-state">
                <div class="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><line x1="12" y1="11" x2="12" y2="17"></line></svg>
                </div>
                <div class="empty-state-title">No job openings found</div>
                <div class="empty-state-desc">Create your first job specification to start uploading and screening resumes.</div>
                <button class="btn btn-primary btn-sm" onclick="App.openCreateJobModal()">Create Job Opening</button>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = jobs.map(j => {
        const reqSkills = j.required_skills || [];
        const skillsSnippet = reqSkills.slice(0, 3).map(s => `<span class="chip chip-tech">${s}</span>`).join(' ');
        const moreSkills = reqSkills.length > 3 ? `<span class="chip">+${reqSkills.length - 3}</span>` : '';
        const statusBadgeClass = j.status === 'Active' ? 'badge-shortlisted' : (j.status === 'Draft' ? 'badge-review-later' : 'badge-rejected');

        return `
          <tr>
            <td>
              <div style="font-weight: 700; color: var(--text-main); font-size: 14px;">${j.title}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${j.employment_type} ${j.salary_range ? '&bull; ' + j.salary_range : ''}</div>
            </td>
            <td>${j.department}</td>
            <td>${j.location}</td>
            <td><b>${j.min_experience_years > 0 ? j.min_experience_years + '+ yrs' : 'Any'}</b></td>
            <td>
              <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                ${skillsSnippet || '<span style="color:var(--text-light); font-size:11px;">Not specified</span>'}
                ${moreSkills}
              </div>
            </td>
            <td>
              <div style="font-weight: 700;">${j.candidates_count || 0} candidate(s)</div>
              <div style="font-size: 11px; color: var(--text-muted);">${j.screened_count || 0} screened</div>
            </td>
            <td>
              <span class="badge ${statusBadgeClass}">${j.status}</span>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 6px;">
                <button class="btn btn-secondary btn-sm" onclick="JobsView.viewJobDetails(${j.id})">Details</button>
                <button class="btn btn-primary btn-sm" onclick="JobsView.screenJob(${j.id})">Screen</button>
                <button class="btn btn-ghost btn-sm" style="color: var(--danger);" onclick="JobsView.deleteJob(${j.id}, '${j.title.replace(/'/g, "\\'")}')" title="Delete Job">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

    } catch (e) {
      console.error("Failed to load jobs table:", e);
    }
  },

  screenJob(jobId) {
    State.setJob(jobId);
    App.navigate('screening');
  },

  async viewJobDetails(jobId) {
    try {
      const job = await API.getJob(jobId);
      const reqs = job.requirements || [];
      const reqSkills = job.required_skills || [];
      const prefSkills = job.preferred_skills || [];

      const modalHtml = `
        <div style="display: flex; flex-direction: column; gap: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h2 style="font-size: 20px; font-weight: 800; color: var(--text-main);">${job.title}</h2>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                ${job.department} &bull; ${job.location} &bull; ${job.employment_type} &bull; ${job.salary_range || 'Salary unspecified'}
              </div>
            </div>
            <span class="badge ${job.status === 'Active' ? 'badge-shortlisted' : 'badge-review-later'}">${job.status}</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background-color: var(--champagne-light); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--champagne-border);">
            <div>
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Experience Target</div>
              <div style="font-size: 14px; font-weight: 700; color: var(--text-heading);">${job.min_experience_years > 0 ? job.min_experience_years + '+ Years' : 'Open / Entry Level'}</div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Education Target</div>
              <div style="font-size: 14px; font-weight: 700; color: var(--text-heading);">${job.education_level || "Bachelor's Degree"}</div>
            </div>
          </div>

          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Required Core Skills</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${reqSkills.map(s => `<span class="skill-pill-highlight required">${s}</span>`).join('') || '<span style="color: var(--text-muted); font-size: 12px;">None specified</span>'}
            </div>
          </div>

          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Preferred / Nice-to-Have Skills</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${prefSkills.map(s => `<span class="skill-pill-highlight preferred">${s}</span>`).join('') || '<span style="color: var(--text-muted); font-size: 12px;">None specified</span>'}
            </div>
          </div>

          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Job Description</div>
            <div style="font-size: 13px; color: var(--text-main); background-color: var(--bg-surface-subtle); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); white-space: pre-wrap; max-height: 200px; overflow-y: auto;">
              ${job.raw_description}
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button class="btn btn-secondary" onclick="App.closeAllModals()">Close</button>
            <button class="btn btn-primary" onclick="JobsView.screenJob(${job.id}); App.closeAllModals();">Screen Candidates for this Job</button>
          </div>
        </div>
      `;

      App.openGenericModal(`Job Details: ${job.title}`, modalHtml);
    } catch (e) {
      App.showToast(e.message, 'danger');
    }
  },

  async deleteJob(jobId, jobTitle) {
    if (!confirm(`Are you sure you want to delete job '${jobTitle}' and all associated screening data?`)) {
      return;
    }
    try {
      const res = await API.deleteJob(jobId);
      App.showToast(res.message, 'success');
      await State.loadJobs();
      await this.loadJobsTable();
    } catch (e) {
      App.showToast(e.message, 'danger');
    }
  }
};
