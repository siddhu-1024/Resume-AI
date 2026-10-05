/**
 * Candidate Profile View — Official & Clean Profile Management
 * Allows candidate to view/edit their personal details, contact info, skills, and summary.
 */
const CandidateProfileView = {
  async render(container) {
    if (!State.isAuthenticated || State.currentRole !== 'candidate') {
      AuthView.renderCandidateLogin(container);
      return;
    }

    container.innerHTML = `
      <div class="loading-state-box">
        <div class="loading-spinner"></div>
        <p>Loading candidate profile...</p>
      </div>
    `;

    try {
      const myApps = await State.loadMyApplications();
      const user = State.currentUser || {};

      // Aggregate skills from candidate apps or profile
      let candidateSkills = [];
      if (user.skills && Array.isArray(user.skills)) {
        candidateSkills = user.skills;
      }

      container.innerHTML = `
        <div class="profile-page-wrapper">
          <!-- Page Header -->
          <div class="page-header">
            <div class="page-title-group">
              <h1 class="page-heading">Candidate Profile</h1>
              <p class="page-subheading">Manage your personal information, contact details, and career preferences.</p>
            </div>
            <div class="page-actions">
              <button class="btn btn-primary btn-sm" id="btn-edit-profile-toggle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Edit Information
              </button>
            </div>
          </div>

          <div class="profile-layout-grid">
            <!-- Left Profile Card -->
            <div class="clean-section-card profile-summary-card">
              <div class="profile-avatar-large">
                <img src="/static/assets/icons/02-candidate-user.svg" alt="Candidate Profile" class="profile-avatar-img">
              </div>
              <h2 class="profile-name-heading">${escapeHtml(user.full_name || 'Candidate')}</h2>
              <div class="profile-role-badge">Verified Candidate</div>
              <div class="profile-email-text">${escapeHtml(user.email || '')}</div>

              <div class="profile-quick-stats">
                <div class="p-stat-item">
                  <span class="p-stat-value">${myApps.length}</span>
                  <span class="p-stat-label">Applications</span>
                </div>
                <div class="p-stat-divider"></div>
                <div class="p-stat-item">
                  <span class="p-stat-value">${myApps.filter(a => a.status === 'Shortlisted' || a.status === 'Selected').length}</span>
                  <span class="p-stat-label">Shortlisted</span>
                </div>
              </div>

              <div class="profile-action-links">
                <a href="#/my-applications" class="btn btn-secondary btn-block btn-sm">
                  View My Applications &rarr;
                </a>
              </div>
            </div>

            <!-- Right Profile Information Form / View -->
            <div class="clean-section-card profile-details-card">
              <div class="clean-section-header">
                <h3 class="clean-section-title">Personal & Contact Information</h3>
              </div>

              <form id="form-candidate-profile" class="profile-form-body">
                <div id="profile-update-alert" class="form-alert" style="display: none;"></div>

                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label" for="prof-fullname">Full Name <span class="required">*</span></label>
                    <input type="text" id="prof-fullname" class="form-input" value="${escapeHtml(user.full_name || '')}" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="prof-email">Email Address</label>
                    <input type="email" id="prof-email" class="form-input" value="${escapeHtml(user.email || '')}" disabled>
                    <div class="form-hint">Email address is linked to your authentication login.</div>
                  </div>
                </div>

                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label" for="prof-phone">Phone Number</label>
                    <input type="tel" id="prof-phone" class="form-input" placeholder="+1 (555) 000-0000" value="${escapeHtml(user.phone || '')}">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="prof-location">Current Location / City</label>
                    <input type="text" id="prof-location" class="form-input" placeholder="e.g. Austin, TX" value="${escapeHtml(user.location || '')}">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="prof-headline">Professional Headline / Title</label>
                  <input type="text" id="prof-headline" class="form-input" placeholder="e.g. Full-Stack Software Engineer | React & Python" value="${escapeHtml(user.headline || '')}">
                </div>

                <div class="form-group">
                  <label class="form-label" for="prof-summary">Career Summary / Bio</label>
                  <textarea id="prof-summary" class="form-textarea" rows="3" placeholder="Brief summary of your professional background and core areas of expertise...">${escapeHtml(user.summary || '')}</textarea>
                </div>

                <div class="form-submit-row">
                  <button type="submit" class="btn btn-primary" id="btn-save-profile">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      const form = document.getElementById('form-candidate-profile');
      form.onsubmit = (e) => {
        e.preventDefault();
        const alertBox = document.getElementById('profile-update-alert');
        const fullName = document.getElementById('prof-fullname').value.trim();
        const phone = document.getElementById('prof-phone').value.trim();
        const location = document.getElementById('prof-location').value.trim();
        const headline = document.getElementById('prof-headline').value.trim();
        const summary = document.getElementById('prof-summary').value.trim();

        if (!fullName) {
          alertBox.className = 'form-alert form-alert-danger';
          alertBox.textContent = 'Full Name is required.';
          alertBox.style.display = 'block';
          return;
        }

        // Update current user state
        const updatedUser = {
          ...State.currentUser,
          full_name: fullName,
          phone: phone,
          location: location,
          headline: headline,
          summary: summary
        };
        State.setUser(updatedUser);

        alertBox.className = 'form-alert form-alert-success';
        alertBox.textContent = 'Profile information updated successfully.';
        alertBox.style.display = 'block';
        App.showToast('Profile updated successfully.', 'success');
      };
    } catch (err) {
      container.innerHTML = `<div class="error-state-card"><p>${escapeHtml(err.message)}</p></div>`;
    }
  }
};
