/**
 * Candidate Job Openings & Job Details View
 * Clean, scannable list view + Structured, visually strong Job Details page with prominent Apply action.
 */
const CandidateJobsView = {
  activeFilterType: 'all',
  activeFilterExp: 'all',
  activeSearch: '',

  async renderJobList(container) {
    const jobs = await State.loadJobs({ status: 'Active' });
    
    let appliedJobIds = new Set();
    if (State.isAuthenticated && State.currentRole === 'candidate') {
      const myApps = await State.loadMyApplications();
      appliedJobIds = new Set(myApps.map(a => a.job_id));
    }

    container.innerHTML = `
      <div class="jobs-page-wrapper">
        <!-- Page Header: Simple, Clean -->
        <div class="page-header">
          <div class="page-title-group">
            <h1 class="page-heading">Job Openings</h1>
            <p class="page-subheading">Explore available career opportunities and submit your application.</p>
          </div>
        </div>

        <!-- Search & Filter Controls -->
        <div class="jobs-filter-bar">
          <div class="filter-search-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="job-search-input" class="filter-search-input" placeholder="Search by title, department, skill, or location..." value="${escapeHtml(this.activeSearch)}">
          </div>

          <div class="filter-dropdowns-group">
            <select id="filter-employment-type" class="filter-select" title="Filter by Employment Type" aria-label="Employment Type">
              <option value="all">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>

            <select id="filter-experience-level" class="filter-select" title="Filter by Experience Level" aria-label="Experience Level">
              <option value="all">All Experience</option>
              <option value="entry">Entry (0–2 yrs)</option>
              <option value="mid">Mid (3–5 yrs)</option>
              <option value="senior">Senior (5+ yrs)</option>
            </select>
          </div>
        </div>

        <!-- Job Cards Grid (Clean & Scannable) -->
        <div id="jobs-grid-container" class="jobs-list-grid"></div>
      </div>
    `;

    const renderFilteredCards = () => {
      const grid = document.getElementById('jobs-grid-container');
      if (!grid) return;

      const q = this.activeSearch.toLowerCase();
      const type = this.activeFilterType;
      const exp = this.activeFilterExp;

      const filtered = jobs.filter(job => {
        let skillsStr = '';
        try { skillsStr = JSON.parse(job.required_skills || '[]').join(' ').toLowerCase(); } catch(e){}
        const matchSearch = !q || 
          job.title.toLowerCase().includes(q) || 
          (job.department && job.department.toLowerCase().includes(q)) || 
          (job.location && job.location.toLowerCase().includes(q)) || 
          skillsStr.includes(q);

        const matchType = type === 'all' || job.employment_type === type;

        let matchExp = true;
        const years = job.min_experience_years || 0;
        if (exp === 'entry') matchExp = years <= 2;
        else if (exp === 'mid') matchExp = years > 2 && years <= 5;
        else if (exp === 'senior') matchExp = years > 5;

        return matchSearch && matchType && matchExp;
      });

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="empty-state-card full-width">
            <div class="empty-icon-wrap">
              <img src="/static/assets/icons/04-job-opening.svg" alt="Job Openings" class="empty-state-icon-img">
            </div>
            <h3>No matching job openings found</h3>
            <p>Try adjusting your search keywords or clearing filters.</p>
            <div style="margin-top: 14px;">
              <button class="btn btn-secondary btn-sm" id="btn-reset-filters">Reset Filters</button>
            </div>
          </div>
        `;
        document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
          this.activeSearch = '';
          this.activeFilterType = 'all';
          this.activeFilterExp = 'all';
          const sInput = document.getElementById('job-search-input');
          const tSelect = document.getElementById('filter-employment-type');
          const eSelect = document.getElementById('filter-experience-level');
          if (sInput) sInput.value = '';
          if (tSelect) tSelect.value = 'all';
          if (eSelect) eSelect.value = 'all';
          renderFilteredCards();
        });
        return;
      }

      grid.innerHTML = filtered.map(job => {
        const isApplied = appliedJobIds.has(job.id);
        let reqSkills = [];
        try { reqSkills = JSON.parse(job.required_skills || '[]'); } catch(e){}

        return `
          <div class="job-opening-card" onclick="App.navigate('jobs/${job.id}')">
            <div class="job-card-top">
              <div>
                <h3 class="job-title-text">${escapeHtml(job.title)}</h3>
                <div class="job-subtitle-text">${escapeHtml(job.department || 'General')} &bull; ${escapeHtml(job.location || 'Remote')}</div>
              </div>
              ${isApplied ? `
                <span class="badge badge-applied-pill">Applied</span>
              ` : `
                <span class="badge badge-success">Active</span>
              `}
            </div>

            <div class="job-meta-row">
              <span class="meta-pill">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                ${escapeHtml(job.employment_type || 'Full-time')}
              </span>
              <span class="meta-pill">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                ${job.min_experience_years > 0 ? `${job.min_experience_years}+ yrs exp` : 'Any experience'}
              </span>
              ${job.salary_range ? `
                <span class="meta-pill meta-pill-salary">${escapeHtml(job.salary_range)}</span>
              ` : ''}
            </div>

            <p class="job-snippet-text">
              ${escapeHtml(job.raw_description ? job.raw_description.substring(0, 140) + '...' : 'Review role requirements and apply.')}
            </p>

            <div class="job-skills-chips">
              ${reqSkills.slice(0, 4).map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}
              ${reqSkills.length > 4 ? `<span class="skill-tag-more">+${reqSkills.length - 4}</span>` : ''}
            </div>

            <div class="job-card-bottom">
              <span class="job-posted-time">Posted ${new Date(job.created_at).toLocaleDateString()}</span>
              <button class="btn ${isApplied ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="event.stopPropagation(); App.navigate('jobs/${job.id}')">
                ${isApplied ? 'View Application' : 'View Job'}
              </button>
            </div>
          </div>
        `;
      }).join('');
    };

    const searchInput = document.getElementById('job-search-input');
    const typeSelect = document.getElementById('filter-employment-type');
    const expSelect = document.getElementById('filter-experience-level');

    searchInput?.addEventListener('input', (e) => {
      this.activeSearch = e.target.value.trim();
      renderFilteredCards();
    });
    typeSelect?.addEventListener('change', (e) => {
      this.activeFilterType = e.target.value;
      renderFilteredCards();
    });
    expSelect?.addEventListener('change', (e) => {
      this.activeFilterExp = e.target.value;
      renderFilteredCards();
    });

    renderFilteredCards();
  },

  async renderJobDetails(container, jobId) {
    container.innerHTML = `
      <div class="loading-state-box">
        <div class="loading-spinner"></div>
        <p>Loading job details...</p>
      </div>
    `;

    try {
      const job = await API.getJob(jobId);
      
      let reqSkills = [];
      let prefSkills = [];
      try { reqSkills = JSON.parse(job.required_skills || '[]'); } catch(e){}
      try { prefSkills = JSON.parse(job.preferred_skills || '[]'); } catch(e){}

      let existingApp = null;
      if (State.isAuthenticated && State.currentRole === 'candidate') {
        const myApps = await State.loadMyApplications();
        existingApp = myApps.find(a => a.job_id === Number(jobId));
      }

      const isCandidate = State.isAuthenticated && State.currentRole === 'candidate';
      const isAdmin = State.isAuthenticated && State.currentRole === 'admin';

      container.innerHTML = `
        <div class="job-detail-page-wrapper">
          <div class="breadcrumb-bar">
            <a href="#/jobs" class="breadcrumb-link">&larr; Back to Job Openings</a>
          </div>

          <!-- Strong Job Header Card (Visually Prominent) -->
          <div class="job-header-card-featured">
            <div class="job-header-main">
              <div>
                <div class="job-dept-badge">${escapeHtml(job.department || 'Engineering')}</div>
                <h1 class="job-title-hero">${escapeHtml(job.title)}</h1>
                <div class="job-meta-hero-row">
                  <span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    ${escapeHtml(job.location || 'Remote')}
                  </span>
                  <span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                    ${escapeHtml(job.employment_type || 'Full-time')}
                  </span>
                  <span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                    ${job.min_experience_years > 0 ? `${job.min_experience_years}+ Years Experience` : 'Any Experience Level'}
                  </span>
                  ${job.salary_range ? `
                    <span class="hero-salary-tag">
                      ${escapeHtml(job.salary_range)}
                    </span>
                  ` : ''}
                </div>
              </div>

              <div class="job-header-action-side">
                ${existingApp ? `
                  <span class="badge badge-applied-large">
                    &#10003; Applied on ${new Date(existingApp.created_at).toLocaleDateString()}
                  </span>
                ` : `
                  <a href="#apply-section" class="btn btn-primary btn-lg apply-anchor-btn">
                    Apply for this Job &darr;
                  </a>
                `}
              </div>
            </div>
          </div>

          <!-- Structured Clean Role Content -->
          <div class="job-body-card">
            <section class="role-section">
              <h3 class="role-section-heading">About the Role</h3>
              <div class="role-text-content">
                ${escapeHtml(job.raw_description || 'No description provided.').replace(/\n/g, '<br>')}
              </div>
            </section>

            ${job.responsibilities_text ? `
              <section class="role-section">
                <h3 class="role-section-heading">Key Responsibilities</h3>
                <div class="role-text-content">
                  ${escapeHtml(job.responsibilities_text).replace(/\n/g, '<br>')}
                </div>
              </section>
            ` : ''}

            <!-- Required Skills -->
            <section class="role-section">
              <h3 class="role-section-heading">Required Skills</h3>
              ${reqSkills.length > 0 ? `
                <div class="skills-pill-cloud">
                  ${reqSkills.map(s => `<span class="skill-pill-highlight required">${escapeHtml(s)}</span>`).join('')}
                </div>
              ` : `
                <p class="text-muted">General discipline competency.</p>
              `}
            </section>

            <!-- Preferred Skills -->
            ${prefSkills.length > 0 ? `
              <section class="role-section">
                <h3 class="role-section-heading">Preferred Skills</h3>
                <div class="skills-pill-cloud">
                  ${prefSkills.map(s => `<span class="skill-pill-highlight preferred">${escapeHtml(s)}</span>`).join('')}
                </div>
              </section>
            ` : ''}

            ${job.qualifications_text ? `
              <section class="role-section">
                <h3 class="role-section-heading">Qualifications & Education</h3>
                <div class="role-text-content">
                  ${escapeHtml(job.qualifications_text).replace(/\n/g, '<br>')}
                </div>
              </section>
            ` : ''}
          </div>

          <!-- Prominent Apply Section -->
          <div class="job-apply-box" id="apply-section">
            <div class="apply-box-header">
              <h2 class="apply-box-title">Apply for this Job</h2>
              <p class="apply-box-sub">Submit your resume and contact information to be screened for this opening.</p>
            </div>

            ${isAdmin ? `
              <div class="alert-box alert-info">
                <div class="alert-title">Admin Account View</div>
                <p>You are signed in as an Admin. You can review all applicants for this position in the Admin portal.</p>
                <div style="margin-top: 10px;">
                  <button class="btn btn-primary btn-sm" onclick="AdminApplicantsView.viewJobApplicants(${job.id})">
                    View Applicants (${job.applicants_count || 0})
                  </button>
                </div>
              </div>
            ` : existingApp ? `
              <!-- Duplicate Protection Card -->
              <div class="duplicate-application-card">
                <div class="dup-icon">&#10003;</div>
                <div class="dup-content">
                  <h4 class="dup-title">You have already applied for this job</h4>
                  <p class="dup-text">Your application was submitted on <b>${new Date(existingApp.created_at).toLocaleDateString()}</b>. Current status: <span class="status-pill status-${existingApp.status.toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(existingApp.status)}</span>.</p>
                  <a href="#/my-applications" class="btn btn-primary btn-sm">View My Applications</a>
                </div>
              </div>
            ` : !State.isAuthenticated ? `
              <!-- Guest Apply Prompt -->
              <div class="guest-apply-prompt">
                <h4>Sign in to Submit Your Application</h4>
                <p>Please log in as a candidate or create an account to upload your resume and apply.</p>
                <div class="prompt-buttons-row">
                  <a href="#/candidate-login" class="btn btn-primary btn-lg">Candidate Sign In</a>
                  <a href="#/candidate-register" class="btn btn-secondary btn-lg">Create Account</a>
                </div>
              </div>
            ` : `
              <!-- Application Step Progress -->
              <div class="apply-steps-indicator">
                <div class="apply-step active">
                  <span class="step-num">1</span>
                  <span class="step-title">Your Information</span>
                </div>
                <div class="step-connector active"></div>
                <div class="apply-step active">
                  <span class="step-num">2</span>
                  <span class="step-title">Resume Document</span>
                </div>
                <div class="step-connector"></div>
                <div class="apply-step">
                  <span class="step-num">3</span>
                  <span class="step-title">Review & Submit</span>
                </div>
              </div>

              <!-- Application Form for Logged-In Candidate -->
              <form id="form-apply-job" class="candidate-application-form">
                <div id="apply-form-error" class="form-alert form-alert-danger" style="display: none;"></div>

                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label" for="apply-name">Full Name <span class="required">*</span></label>
                    <input type="text" id="apply-name" class="form-input" value="${escapeHtml(State.currentUser.full_name || '')}" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="apply-email">Email Address <span class="required">*</span></label>
                    <input type="email" id="apply-email" class="form-input" value="${escapeHtml(State.currentUser.email || '')}" required>
                  </div>
                </div>

                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label" for="apply-phone">Phone Number</label>
                    <input type="tel" id="apply-phone" class="form-input" placeholder="+1 (555) 000-0000" value="${escapeHtml(State.currentUser.phone || '')}">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="apply-location">Current Location</label>
                    <input type="text" id="apply-location" class="form-input" placeholder="e.g. Austin, TX" value="${escapeHtml(State.currentUser.location || '')}">
                  </div>
                </div>

                <!-- Resume Upload Zone -->
                <div class="form-group">
                  <label class="form-label">Upload Resume <span class="required">*</span></label>
                  <div class="resume-drop-box" id="drop-area-apply">
                    <div class="drop-box-inner">
                      <div class="drop-icon-wrap">
                        <img src="/static/assets/icons/05-resume.svg" alt="Resume Document" class="drop-pack-icon">
                      </div>
                      <div class="drop-text-primary">
                        <span class="browse-link">Choose a file</span> or drag & drop here
                      </div>
                      <div class="drop-text-secondary">PDF or DOCX (Max 16MB)</div>
                      <div id="selected-file-label" class="selected-file-name" style="display: none;"></div>
                    </div>
                    <input type="file" id="apply-resume-file" class="hidden-file-input" accept=".pdf,.docx" required title="Select resume file" aria-label="Select resume file">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="apply-cover-letter">Cover Letter (Optional)</label>
                  <textarea id="apply-cover-letter" class="form-textarea" rows="3" placeholder="Briefly introduce yourself and why you're a great fit..."></textarea>
                </div>

                <div class="form-submit-row">
                  <button type="submit" class="btn btn-primary btn-lg" id="btn-submit-application">
                    Submit Application
                  </button>
                </div>
              </form>
            `}
          </div>
        </div>
      `;

      if (isCandidate && !existingApp) {
        const fileInput = document.getElementById('apply-resume-file');
        const dropArea = document.getElementById('drop-area-apply');
        const fileLabel = document.getElementById('selected-file-label');

        dropArea?.addEventListener('click', () => fileInput?.click());

        fileInput?.addEventListener('change', () => {
          if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            fileLabel.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            fileLabel.style.display = 'inline-block';
          }
        });

        ['dragenter', 'dragover'].forEach(eventName => {
          dropArea?.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropArea.classList.add('dragover');
          }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
          dropArea?.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropArea.classList.remove('dragover');
          }, false);
        });

        dropArea?.addEventListener('drop', (e) => {
          const dt = e.dataTransfer;
          const files = dt.files;
          if (files && files.length > 0) {
            fileInput.files = files;
            fileLabel.textContent = `Selected: ${files[0].name} (${(files[0].size / 1024).toFixed(1)} KB)`;
            fileLabel.style.display = 'inline-block';
          }
        });

        const form = document.getElementById('form-apply-job');
        form.onsubmit = async (e) => {
          e.preventDefault();
          const errBox = document.getElementById('apply-form-error');
          const submitBtn = document.getElementById('btn-submit-application');

          errBox.style.display = 'none';

          if (!fileInput.files || fileInput.files.length === 0) {
            errBox.textContent = 'Please select a resume file (PDF or DOCX) to upload.';
            errBox.style.display = 'block';
            return;
          }

          const formData = new FormData();
          formData.append('job_id', jobId);
          formData.append('full_name', document.getElementById('apply-name').value.trim());
          formData.append('email', document.getElementById('apply-email').value.trim());
          formData.append('phone', document.getElementById('apply-phone').value.trim());
          formData.append('location', document.getElementById('apply-location').value.trim());
          formData.append('cover_letter', document.getElementById('apply-cover-letter').value.trim());
          formData.append('file', fileInput.files[0]);

          try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Screening & Submitting...';

            const res = await API.applyJob(formData);
            App.showToast('Application submitted successfully!', 'success');
            await State.loadMyApplications();
            await CandidateJobsView.renderJobDetails(container, jobId);
          } catch (err) {
            errBox.textContent = err.message || 'Failed to submit application.';
            errBox.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Application';
          }
        };
      }

    } catch (err) {
      container.innerHTML = `
        <div class="error-state-card">
          <h3>Unable to load job details</h3>
          <p>${escapeHtml(err.message)}</p>
          <a href="#/jobs" class="btn btn-secondary btn-sm" style="margin-top: 10px;">Return to Job Openings</a>
        </div>
      `;
    }
  }
};
