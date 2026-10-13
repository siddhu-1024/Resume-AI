/**
 * Resume Screening Assistant — Master Coordinator, Sidebar Navigation & Client Router
 * Theme: Emerald (#064E3B) + Champagne (#F8E7C9)
 */

// Global HTML sanitization helper
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const App = {
  async init() {
    console.log("Starting Resume Screening Assistant Platform...");

    // Check initial auth state from backend session
    await State.checkAuth();

    // Bind navigation & global UI events
    this.bindGlobalEvents();
    this.bindCreateJobForm();

    // Re-render navbar when auth state changes
    State.subscribe('authChanged', () => {
      this.updateNavbar();
      this.handleRoute();
    });

    State.subscribe('loggedOut', () => {
      this.updateNavbar();
      this.showToast('You have been logged out.', 'info');
      this.navigate('home');
    });

    // Handle hash routing
    window.addEventListener('hashchange', () => this.handleRoute());
    this.updateNavbar();
    this.handleRoute();
  },

  updateNavbar() {
    const rootLayout = document.getElementById('app-root-layout');
    const sidebarNav = document.getElementById('sidebar-nav-links');
    const sidebarRoleIndicator = document.getElementById('sidebar-role-indicator');
    const sidebarUserCard = document.getElementById('sidebar-user-card');
    const topbarRight = document.getElementById('topbar-right-actions');
    const guestNavLinks = document.getElementById('guest-nav-links');
    const guestNavActions = document.getElementById('guest-nav-actions');

    const role = State.currentRole; // 'guest', 'candidate', 'admin'
    const user = State.currentUser;
    const hash = window.location.hash || '#/home';
    const isPublicAuthPage = hash.includes('login') || hash.includes('register') || (hash === '#/home' && role === 'guest') || (hash === '' && role === 'guest');

    const guestNavbar = document.getElementById('guest-navbar');
    const appTopbar = document.getElementById('app-topbar');

    if (role === 'guest' || isPublicAuthPage) {
      if (rootLayout) rootLayout.classList.add('guest-mode');
      if (guestNavbar) guestNavbar.style.setProperty('display', 'block', 'important');
      if (appTopbar) appTopbar.style.setProperty('display', 'none', 'important');
    } else {
      if (rootLayout) rootLayout.classList.remove('guest-mode');
      if (guestNavbar) guestNavbar.style.setProperty('display', 'none', 'important');
      if (appTopbar) appTopbar.style.setProperty('display', 'flex', 'important');
    }

    // 1. ADMIN SIDEBAR & TOPBAR
    if (role === 'admin') {
      if (sidebarRoleIndicator) {
        sidebarRoleIndicator.innerHTML = `
          <div class="role-badge-strip">
            <span class="role-badge-dot"></span>
            <span>Recruitment Admin</span>
          </div>
        `;
      }

      if (sidebarNav) {
        sidebarNav.innerHTML = `
          <div class="sidebar-nav-section-title">Recruitment Hub</div>
          <a href="#/admin/dashboard" class="sidebar-nav-item" data-route="admin/dashboard">
            <div class="nav-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </div>
            <span class="nav-item-text">Dashboard</span>
          </a>

          <a href="#/admin/jobs" class="sidebar-nav-item" data-route="admin/jobs">
            <div class="nav-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            </div>
            <span class="nav-item-text">Job Openings</span>
          </a>

          <a href="#/admin/applicants" class="sidebar-nav-item" data-route="admin/applicants">
            <div class="nav-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <span class="nav-item-text">Applicants</span>
          </a>

          <div class="sidebar-nav-section-title" style="margin-top: 10px;">Analytics & System</div>

          <a href="#/admin/reports" class="sidebar-nav-item" data-route="admin/reports">
            <div class="nav-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
            </div>
            <span class="nav-item-text">Reports & Analytics</span>
          </a>

          <a href="#/admin/settings" class="sidebar-nav-item" data-route="admin/settings">
            <div class="nav-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </div>
            <span class="nav-item-text">Profile / Settings</span>
          </a>
        `;
      }

      if (sidebarUserCard) {
        sidebarUserCard.innerHTML = `
          <div class="sidebar-user-avatar">
            <img src="/static/assets/icons/03-admin.svg" alt="Admin" style="width: 20px; height: 20px; object-fit: contain;">
          </div>
          <div class="sidebar-user-meta">
            <div class="sidebar-user-name">${escapeHtml(user?.full_name || 'Admin')}</div>
            <div class="sidebar-user-role">Recruiter Admin</div>
          </div>
        `;
      }

      if (topbarRight) {
        topbarRight.innerHTML = `
          <button class="btn btn-primary btn-sm" onclick="App.openCreateJobModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create Job
          </button>
          <div class="user-badge-pill admin-badge-pill">
            <span class="role-pill-dot"></span>
            <span>Admin</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="State.logout()" title="Sign Out">
            Logout
          </button>
        `;
      }
    }
    // 2. CANDIDATE SIDEBAR & TOPBAR
    else if (role === 'candidate') {
      if (sidebarRoleIndicator) {
        sidebarRoleIndicator.innerHTML = `
          <div class="role-badge-strip">
            <span class="role-badge-dot"></span>
            <span>Candidate Portal</span>
          </div>
        `;
      }

      if (sidebarNav) {
        sidebarNav.innerHTML = `
          <div class="sidebar-nav-section-title">Candidate Space</div>
          <a href="#/candidate/dashboard" class="sidebar-nav-item" data-route="candidate/dashboard">
            <div class="nav-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </div>
            <span class="nav-item-text">Dashboard</span>
          </a>

          <a href="#/jobs" class="sidebar-nav-item" data-route="jobs">
            <div class="nav-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <span class="nav-item-text">Browse Jobs</span>
          </a>

          <a href="#/my-applications" class="sidebar-nav-item" data-route="my-applications">
            <div class="nav-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            </div>
            <span class="nav-item-text">My Applications</span>
          </a>

          <a href="#/profile" class="sidebar-nav-item" data-route="profile">
            <div class="nav-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <span class="nav-item-text">Profile</span>
          </a>
        `;
      }

      if (sidebarUserCard) {
        const initials = user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'CA';
        sidebarUserCard.innerHTML = `
          <div class="sidebar-user-avatar">
            ${escapeHtml(initials)}
          </div>
          <div class="sidebar-user-meta">
            <div class="sidebar-user-name">${escapeHtml(user?.full_name || 'Candidate')}</div>
            <div class="sidebar-user-role">Candidate</div>
          </div>
        `;
      }

      if (topbarRight) {
        topbarRight.innerHTML = `
          <a href="#/jobs" class="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            Browse Openings
          </a>
          <div class="user-profile-summary">
            <span>Hi, <b>${escapeHtml(user?.full_name?.split(' ')[0] || 'Candidate')}</b></span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="State.logout()">
            Sign Out
          </button>
        `;
      }
    }
    // 3. GUEST MODE
    else {
      if (guestNavLinks) {
        guestNavLinks.innerHTML = `
          <a href="#/home" class="top-nav-link" data-route="home">Home</a>
          <a href="#/jobs" class="top-nav-link" data-route="jobs">Job Openings</a>
        `;
      }

      if (guestNavActions) {
        guestNavActions.innerHTML = `
          <a href="#/candidate-login" class="btn btn-ghost btn-sm">Candidate Sign In</a>
          <a href="#/candidate-register" class="btn btn-primary btn-sm">Create Account</a>
          <a href="#/admin-login" class="btn btn-outline-primary btn-sm admin-entry-btn">Admin Portal</a>
        `;
      }
    }

    this.highlightActiveNavLink();
  },

  highlightActiveNavLink() {
    const hash = window.location.hash || '#/home';
    const cleanRoute = hash.replace(/^#\/?/, '').split('?')[0];

    // Highlight sidebar items
    document.querySelectorAll('.sidebar-nav-item').forEach(link => {
      const linkRoute = link.getAttribute('data-route') || '';
      if (linkRoute && (cleanRoute === linkRoute || cleanRoute.startsWith(linkRoute) || hash.includes(linkRoute))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Highlight guest top nav items
    document.querySelectorAll('.guest-nav-links .top-nav-link').forEach(link => {
      const linkRoute = link.getAttribute('data-route') || '';
      if (linkRoute && (cleanRoute === linkRoute || cleanRoute.startsWith(linkRoute))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Topbar Breadcrumb Title
    const breadcrumbTitle = document.getElementById('topbar-breadcrumb-title');
    if (breadcrumbTitle) {
      const titleMap = {
        'admin/dashboard': 'Recruiter Dashboard',
        'admin/jobs': 'Job Openings Management',
        'admin/applicants': 'Applicant Screening & Pipeline',
        'admin/reports': 'Recruitment Reports & Analytics',
        'admin/settings': 'Settings & Screening Weights',
        'candidate/dashboard': 'Candidate Dashboard',
        'candidate-dashboard': 'Candidate Dashboard',
        'dashboard': State.currentRole === 'admin' ? 'Recruiter Dashboard' : 'Candidate Dashboard',
        'jobs': 'Job Openings',
        'my-applications': 'My Applications',
        'profile': 'Candidate Profile',
        'candidate/profile': 'Candidate Profile',
        'home': 'Home'
      };

      if (cleanRoute.startsWith('jobs/')) {
        breadcrumbTitle.textContent = 'Job Position Details';
      } else {
        breadcrumbTitle.textContent = titleMap[cleanRoute] || 'Dashboard';
      }
    }
  },

  handleRoute() {
    const hash = window.location.hash || '#/home';
    const path = hash.replace(/^#\/?/, '');
    State.currentView = path || 'home';

    this.updateNavbar();
    this.highlightActiveNavLink();
    this.renderRoute(path);

    // Close mobile sidebar on navigation
    this.closeMobileSidebar();
  },

  navigate(viewName) {
    window.location.hash = `#/${viewName}`;
  },

  async renderRoute(path) {
    const container = document.getElementById('app-view-container');
    if (!container) return;

    // RBAC Protection Checks
    if (path.startsWith('admin')) {
      if (!State.isAuthenticated || State.currentRole !== 'admin') {
        App.showToast('Please sign in with an Admin account to access this section.', 'warning');
        AuthView.renderAdminLogin(container);
        return;
      }
    }

    if (path === 'my-applications' || path === 'candidate/dashboard' || path === 'candidate-dashboard') {
      if (!State.isAuthenticated || State.currentRole !== 'candidate') {
        App.showToast('Please sign in as a candidate to access your portal.', 'info');
        AuthView.renderCandidateLogin(container);
        return;
      }
    }

    // Route matching
    if (!path || path === 'home') {
      await HomeView.render(container);
    } else if (path === 'jobs') {
      await CandidateJobsView.renderJobList(container);
    } else if (path.startsWith('jobs/')) {
      const jobId = path.split('/')[1];
      await CandidateJobsView.renderJobDetails(container, jobId);
    } else if (path === 'candidate/dashboard' || path === 'candidate-dashboard') {
      await CandidateDashboardView.render(container);
    } else if (path === 'dashboard') {
      if (State.isAuthenticated && State.currentRole === 'admin') {
        await AdminDashboardView.render(container);
      } else if (State.isAuthenticated && State.currentRole === 'candidate') {
        await CandidateDashboardView.render(container);
      } else {
        await HomeView.render(container);
      }
    } else if (path === 'my-applications') {
      await CandidateApplicationsView.render(container);
    } else if (path === 'profile' || path === 'candidate/profile') {
      if (!State.isAuthenticated || State.currentRole !== 'candidate') {
        App.showToast('Please sign in as a candidate to view your profile.', 'info');
        AuthView.renderCandidateLogin(container);
        return;
      }
      await CandidateProfileView.render(container);
    } else if (path === 'candidate-login') {
      AuthView.renderCandidateLogin(container);
    } else if (path === 'candidate-register') {
      AuthView.renderCandidateRegister(container);
    } else if (path === 'admin-login') {
      AuthView.renderAdminLogin(container);
    } else if (path === 'admin/dashboard') {
      await AdminDashboardView.render(container);
    } else if (path === 'admin/jobs') {
      await AdminJobsView.render(container);
    } else if (path === 'admin/applicants') {
      await AdminApplicantsView.render(container);
    } else if (path === 'admin/reports') {
      await AdminReportsView.render(container);
    } else if (path === 'admin/settings') {
      await AdminSettingsView.render(container);
    } else {
      // Default fallback
      await HomeView.render(container);
    }

    // Scroll to top on navigation
    window.scrollTo(0, 0);
  },

  bindGlobalEvents() {
    // Mobile hamburger sidebar toggle
    const hamburgerBtn = document.getElementById('topbar-hamburger-btn');
    const closeSidebarBtn = document.getElementById('sidebar-close-btn');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const sidebar = document.getElementById('app-sidebar');

    if (hamburgerBtn) {
      hamburgerBtn.onclick = () => {
        if (sidebar) sidebar.classList.toggle('sidebar-open');
        if (sidebarBackdrop) sidebarBackdrop.classList.toggle('active');
      };
    }

    if (closeSidebarBtn) {
      closeSidebarBtn.onclick = () => this.closeMobileSidebar();
    }

    if (sidebarBackdrop) {
      sidebarBackdrop.onclick = () => this.closeMobileSidebar();
    }

    // Generic Modal Close handler (data-close-modal or clicking backdrop)
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.onclick = () => this.closeAllModals();
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.onclick = (e) => {
        if (e.target === backdrop) {
          this.closeAllModals();
        }
      };
    });
  },

  closeMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('sidebar-open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
  },

  bindCreateJobForm() {
    // NLP Preview Button in Create Job Modal
    const previewBtn = document.getElementById('btn-preview-nlp');
    if (previewBtn) {
      previewBtn.onclick = async () => {
        const title = document.getElementById('job-title')?.value || '';
        const raw_description = document.getElementById('job-description')?.value || '';
        if (!title && !raw_description) {
          this.showToast("Please enter a job title or description to analyze.", "warning");
          return;
        }

        try {
          const preview = await API.previewJobNLP({ title, raw_description });
          const previewBox = document.getElementById('job-nlp-preview-box');
          if (previewBox) {
            previewBox.style.display = 'block';
            document.getElementById('nlp-req-skills').textContent = (preview.required_skills || []).join(', ') || 'None detected';
            document.getElementById('nlp-pref-skills').textContent = (preview.preferred_skills || []).join(', ') || 'None detected';
            document.getElementById('nlp-exp').textContent = `${preview.min_experience_years || 0}+ yrs`;
            document.getElementById('nlp-edu').textContent = preview.education_requirement || "Bachelor's Degree";
          }
        } catch (e) {
          this.showToast(e.message, "danger");
        }
      };
    }

    // Submit Job Creation Form
    const submitBtn = document.getElementById('btn-submit-job');
    if (submitBtn) {
      submitBtn.onclick = async (e) => {
        e.preventDefault();
        const title = document.getElementById('job-title')?.value?.trim();
        const raw_description = document.getElementById('job-description')?.value?.trim();

        if (!title || !raw_description) {
          this.showToast("Please provide both Job Title and Job Description.", "warning");
          return;
        }

        const payload = {
          title,
          department: document.getElementById('job-dept')?.value?.trim() || 'General',
          location: document.getElementById('job-location')?.value?.trim() || 'Remote',
          employment_type: document.getElementById('job-type')?.value || 'Full-time',
          min_experience_years: parseFloat(document.getElementById('job-min-exp')?.value) || 0,
          salary_range: document.getElementById('job-salary')?.value?.trim() || '',
          status: document.getElementById('job-status')?.value || 'Active',
          raw_description
        };

        try {
          submitBtn.disabled = true;
          const res = await API.createJob(payload);
          this.showToast(res.message, "success");
          this.closeAllModals();
          document.getElementById('form-create-job')?.reset();
          document.getElementById('job-nlp-preview-box').style.display = 'none';

          await State.loadJobs();
          this.navigate('admin/jobs');
        } catch (err) {
          this.showToast(err.message, "danger");
        } finally {
          submitBtn.disabled = false;
        }
      };
    }
  },

  openCreateJobModal() {
    document.getElementById('modal-create-job')?.classList.add('active');
  },

  openGenericModal(title, htmlContent) {
    let modal = document.getElementById('modal-generic-info');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.id = 'modal-generic-info';
      modal.innerHTML = `
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3 class="modal-title" id="generic-modal-title">Info</h3>
            <button class="modal-close-btn" data-close-modal>&times;</button>
          </div>
          <div class="modal-body" id="generic-modal-body"></div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('[data-close-modal]').onclick = () => this.closeAllModals();
      modal.onclick = (e) => { if (e.target === modal) this.closeAllModals(); };
    }

    document.getElementById('generic-modal-title').textContent = title;
    document.getElementById('generic-modal-body').innerHTML = htmlContent;
    modal.classList.add('active');
  },

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div style="flex: 1;">${escapeHtml(message)}</div>
      <button style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">&times;</button>
    `;

    toast.querySelector('button').onclick = () => toast.remove();
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
};

// Initialize Application on Window Load
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
