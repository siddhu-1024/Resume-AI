/**
 * Landing Page View — Visually Engaging Recruitment Showcase
 * Modern, premium hero with recruitment-focused composition and clear CTAs.
 */
const HomeView = {
  async render(container) {
    const isCandidate = State.isAuthenticated && State.currentRole === 'candidate';
    const isAdmin = State.isAuthenticated && State.currentRole === 'admin';

    // Fetch active jobs for preview
    const jobs = await State.loadJobs({ status: 'Active' });
    const featuredJobs = jobs.slice(0, 4);

    container.innerHTML = `
      <div class="landing-page-container">
        <!-- Hero Section: Premium Recruitment Theme -->
        <section class="landing-hero-showcase">
          <div class="hero-content-left">
            <div class="hero-tag">
              <img src="/static/assets/icons/01-main-logo.svg" alt="Logo" class="hero-tag-logo">
              <span>Recruitment & Screening Platform</span>
            </div>
            
            <h1 class="hero-main-title">
              Find the right opportunity.<br>
              <span class="hero-highlight-text">Build the right team.</span>
            </h1>
            
            <p class="hero-description">
              A streamlined recruitment platform connecting qualified candidates with active job openings through transparent, requirement-grounded resume screening.
            </p>

            <div class="hero-actions-row">
              <a href="#/jobs" class="btn btn-primary btn-lg hero-cta-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                Find Jobs
              </a>
              ${!isAdmin ? `
                <a href="#/admin-login" class="btn btn-secondary btn-lg hero-secondary-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  Admin Login
                </a>
              ` : `
                <a href="#/admin/dashboard" class="btn btn-secondary btn-lg hero-secondary-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                  Admin Dashboard
                </a>
              `}
            </div>

            <div class="hero-stats-strip">
              <div class="hero-stat-item">
                <span class="hero-stat-num">${jobs.length}+</span>
                <span class="hero-stat-label">Active Openings</span>
              </div>
              <div class="hero-stat-divider"></div>
              <div class="hero-stat-item">
                <span class="hero-stat-num">100%</span>
                <span class="hero-stat-label">Grounded Matching</span>
              </div>
              <div class="hero-stat-divider"></div>
              <div class="hero-stat-item">
                <span class="hero-stat-num">Direct</span>
                <span class="hero-stat-label">Application Tracking</span>
              </div>
            </div>
          </div>

          <!-- Hero Graphic: Elegant Abstract Recruitment Card Composition -->
          <div class="hero-graphic-right">
            <div class="recruitment-visual-card main-visual-card">
              <div class="visual-card-header">
                <div class="visual-card-avatar">JD</div>
                <div class="visual-card-meta">
                  <div class="visual-cand-name">Frontend Developer Applicant</div>
                  <div class="visual-cand-role">Applied for Senior React Role</div>
                </div>
                <span class="match-score-badge">88% Match</span>
              </div>
              
              <div class="visual-card-body">
                <div class="visual-skill-tags">
                  <span class="v-tag matched">&#10003; React.js</span>
                  <span class="v-tag matched">&#10003; JavaScript (ES6+)</span>
                  <span class="v-tag matched">&#10003; 4+ Years Exp</span>
                  <span class="v-tag neutral">TypeScript</span>
                </div>
                <div class="visual-progress-bar-wrap">
                  <div class="v-progress-label"><span>Job Requirement Alignment</span><span>88%</span></div>
                  <div class="v-progress-track"><div class="v-progress-fill" style="width: 88%;"></div></div>
                </div>
              </div>
            </div>

            <div class="recruitment-visual-card sub-visual-card">
              <div class="sub-visual-row">
                <div class="sub-visual-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div>
                  <div class="sub-visual-title">Application Shortlisted</div>
                  <div class="sub-visual-sub">Candidate advanced to interview</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Two Dedicated Pathways Section -->
        <section class="landing-portals-section">
          <div class="portal-box portal-candidate">
            <div class="portal-header">
              <div class="portal-icon-pack">
                <img src="/static/assets/icons/02-candidate-user.svg" alt="Candidate Portal" class="portal-pack-icon">
              </div>
              <div>
                <h3 class="portal-title">Candidates</h3>
                <p class="portal-subtitle">Explore careers & apply</p>
              </div>
            </div>
            <p class="portal-description">
              Browse active vacancies, review role requirements, submit your resume, and track your application status in real-time.
            </p>
            <div class="portal-action-group">
              <a href="#/jobs" class="btn btn-primary btn-sm">Browse Job Openings</a>
              ${!State.isAuthenticated ? `
                <a href="#/candidate-login" class="btn btn-secondary btn-sm">Candidate Sign In</a>
              ` : `
                <a href="#/my-applications" class="btn btn-secondary btn-sm">My Applications</a>
              `}
            </div>
          </div>

          <div class="portal-box portal-admin">
            <div class="portal-header">
              <div class="portal-icon-pack">
                <img src="/static/assets/icons/03-admin.svg" alt="Admin Portal" class="portal-pack-icon">
              </div>
              <div>
                <h3 class="portal-title">Hiring Teams (Admin)</h3>
                <p class="portal-subtitle">Manage recruitment & screening</p>
              </div>
            </div>
            <p class="portal-description">
              Publish job vacancies, screen resumes with transparent evidence, add internal recruiter notes, and manage candidate pipelines.
            </p>
            <div class="portal-action-group">
              ${isAdmin ? `
                <a href="#/admin/dashboard" class="btn btn-primary btn-sm">Go to Dashboard</a>
              ` : `
                <a href="#/admin-login" class="btn btn-primary btn-sm">Admin Portal Login</a>
              `}
            </div>
          </div>
        </section>

        <!-- Featured Job Openings Section (Clean & Scannable) -->
        <section class="landing-jobs-section">
          <div class="section-title-row">
            <div>
              <h2 class="section-heading">Featured Openings</h2>
              <p class="section-subheading">Recently posted positions across engineering, product, and operations</p>
            </div>
            <a href="#/jobs" class="text-primary-link font-semibold">View all ${jobs.length} jobs &rarr;</a>
          </div>

          ${featuredJobs.length === 0 ? `
            <div class="empty-state-card">
              <h4>No active job openings right now</h4>
              <p>Check back soon or sign in as Admin to post positions.</p>
            </div>
          ` : `
            <div class="landing-jobs-grid">
              ${featuredJobs.map(job => {
                let reqSkills = [];
                try { reqSkills = JSON.parse(job.required_skills || '[]'); } catch(e){}
                return `
                  <div class="simple-job-card" onclick="App.navigate('jobs/${job.id}')">
                    <div class="simple-job-top">
                      <div>
                        <h3 class="simple-job-title">${escapeHtml(job.title)}</h3>
                        <div class="simple-job-dept">${escapeHtml(job.department || 'General')} &bull; ${escapeHtml(job.location || 'Remote')}</div>
                      </div>
                      <span class="badge badge-success">Active</span>
                    </div>

                    <div class="simple-job-meta">
                      <span>${escapeHtml(job.employment_type || 'Full-time')}</span> &bull; 
                      <span>${job.min_experience_years > 0 ? `${job.min_experience_years}+ yrs exp` : 'Any exp'}</span>
                      ${job.salary_range ? ` &bull; <span class="text-success font-medium">${escapeHtml(job.salary_range)}</span>` : ''}
                    </div>

                    <div class="simple-job-skills">
                      ${reqSkills.slice(0, 4).map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}
                      ${reqSkills.length > 4 ? `<span class="skill-tag-more">+${reqSkills.length - 4}</span>` : ''}
                    </div>

                    <div class="simple-job-footer">
                      <span class="post-date">Posted ${new Date(job.created_at).toLocaleDateString()}</span>
                      <span class="view-job-link">View Details &rarr;</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </section>

        <!-- How It Works Section (Clean 4 Steps with Official Icons) -->
        <section class="landing-workflow-section">
          <h2 class="section-heading text-center">How It Works</h2>
          <p class="section-subheading text-center">Structured recruitment connecting job openings to qualified candidates</p>

          <div class="clean-steps-grid">
            <div class="clean-step-item">
              <div class="step-icon-wrap">
                <img src="/static/assets/icons/04-job-opening.svg" alt="Job Opening" class="step-pack-icon">
                <span class="step-badge">1</span>
              </div>
              <h4 class="step-title">Job Opening</h4>
              <p class="step-desc">Hiring teams post roles with explicit skill, experience, and qualification requirements.</p>
            </div>
            <div class="clean-step-item">
              <div class="step-icon-wrap">
                <img src="/static/assets/icons/05-resume.svg" alt="Candidate Applies" class="step-pack-icon">
                <span class="step-badge">2</span>
              </div>
              <h4 class="step-title">Candidate Applies</h4>
              <p class="step-desc">Candidates submit resumes (PDF or DOCX) directly linked to specific job openings.</p>
            </div>
            <div class="clean-step-item">
              <div class="step-icon-wrap">
                <img src="/static/assets/icons/06-resume-screening.svg" alt="Screening & Review" class="step-pack-icon">
                <span class="step-badge">3</span>
              </div>
              <h4 class="step-title">Screening & Review</h4>
              <p class="step-desc">Applications are screened against requirements with transparent evidence and subscores.</p>
            </div>
            <div class="clean-step-item">
              <div class="step-icon-wrap">
                <img src="/static/assets/icons/09-application-status.svg" alt="Pipeline Decisions" class="step-pack-icon">
                <span class="step-badge">4</span>
              </div>
              <h4 class="step-title">Pipeline Decisions</h4>
              <p class="step-desc">Recruiters shortlist, advance to interview, or record internal notes while candidates track status.</p>
            </div>
          </div>
        </section>
      </div>
    `;
  }
};
