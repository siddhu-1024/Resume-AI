/**
 * Authentication Views — Candidate Login, Candidate Register, Admin Login
 * Visually engaging split layout with recruitment branding and clear role separation.
 */
const AuthView = {
  renderCandidateLogin(container) {
    container.innerHTML = `
      <div class="auth-layout-wrapper">
        <div class="auth-split-card">
          <!-- Left Visual Brand Panel -->
          <div class="auth-brand-side candidate-theme">
            <div class="auth-brand-content">
              <div class="auth-brand-emblem">
                <img src="/static/assets/icons/02-candidate-user.svg" alt="Candidate Portal" class="auth-emblem-img">
              </div>
              <div class="auth-brand-badge">Candidate Portal</div>
              <h2 class="auth-brand-heading">Advance Your Career with Verified Opportunities.</h2>
              <p class="auth-brand-sub">Access active job openings, submit your resume, and track recruitment progress with complete transparency.</p>
              
              <div class="auth-feature-bullets">
                <div class="bullet-item">
                  <span class="bullet-icon">&#10003;</span>
                  <span>Direct application to verified job positions</span>
                </div>
                <div class="bullet-item">
                  <span class="bullet-icon">&#10003;</span>
                  <span>Objective, grounded requirement matching</span>
                </div>
                <div class="bullet-item">
                  <span class="bullet-icon">&#10003;</span>
                  <span>Real-time status updates at every hiring stage</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Form Panel -->
          <div class="auth-form-side">
            <div class="auth-form-header">
              <div class="auth-form-brand">
                <img src="/static/assets/icons/01-main-logo.svg" alt="Logo" class="auth-form-logo">
                <span class="auth-form-brand-text">Resume Screening Assistant</span>
              </div>
              <h2 class="auth-title">Candidate Sign In</h2>
              <p class="auth-subtitle">Enter your credentials to access your candidate account.</p>
            </div>

            <form id="form-candidate-login" class="auth-form-body">
              <div id="candidate-login-error" class="form-alert form-alert-danger" style="display: none;"></div>

              <div class="form-group">
                <label class="form-label" for="cand-email">Email Address <span class="required">*</span></label>
                <input type="email" id="cand-email" class="form-input" placeholder="you@example.com" required autocomplete="email">
              </div>

              <div class="form-group">
                <div class="form-label-row">
                  <label class="form-label" for="cand-password">Password <span class="required">*</span></label>
                </div>
                <input type="password" id="cand-password" class="form-input" placeholder="Enter your password" required autocomplete="current-password">
              </div>

              <button type="submit" class="btn btn-primary btn-block btn-lg" id="btn-cand-login-submit">
                Sign In
              </button>

              <!-- Quick Demo Helper -->
              <div class="auth-demo-helper">
                <span>Testing? Use demo candidate account:</span>
                <button type="button" class="btn btn-ghost btn-sm" id="btn-fill-demo-cand">
                  Fill Demo Candidate
                </button>
              </div>
            </form>

            <div class="auth-form-footer">
              <span>Don't have a candidate account?</span>
              <a href="#/candidate-register" class="text-primary-link font-semibold">Create an account &rarr;</a>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-fill-demo-cand')?.addEventListener('click', () => {
      document.getElementById('cand-email').value = 'candidate@example.com';
      document.getElementById('cand-password').value = 'CandidatePassword123!';
    });

    const form = document.getElementById('form-candidate-login');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const errBox = document.getElementById('candidate-login-error');
      const submitBtn = document.getElementById('btn-cand-login-submit');
      errBox.style.display = 'none';

      const email = document.getElementById('cand-email').value.trim();
      const password = document.getElementById('cand-password').value;

      if (!email || !password) {
        errBox.textContent = 'Please enter both your email address and password.';
        errBox.style.display = 'block';
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        const res = await API.login({ email, password, expected_role: 'candidate' });
        State.setUser(res.user);
        App.showToast(`Welcome back, ${res.user.full_name}!`, 'success');
        App.navigate('candidate/dashboard');
      } catch (err) {
        errBox.textContent = err.message || 'Invalid email or password.';
        errBox.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    };
  },

  renderCandidateRegister(container) {
    container.innerHTML = `
      <div class="auth-layout-wrapper">
        <div class="auth-split-card">
          <!-- Left Visual Brand Panel -->
          <div class="auth-brand-side candidate-theme">
            <div class="auth-brand-content">
              <div class="auth-brand-emblem">
                <img src="/static/assets/icons/02-candidate-user.svg" alt="Candidate Registration" class="auth-emblem-img">
              </div>
              <div class="auth-brand-badge">Candidate Registration</div>
              <h2 class="auth-brand-heading">Create Your Candidate Profile.</h2>
              <p class="auth-brand-sub">Join our platform to apply for open job positions, upload resumes, and track your recruitment journey.</p>
              
              <div class="auth-feature-bullets">
                <div class="bullet-item">
                  <span class="bullet-icon">&#10003;</span>
                  <span>Fast, single-step account creation</span>
                </div>
                <div class="bullet-item">
                  <span class="bullet-icon">&#10003;</span>
                  <span>Instant job requirement matching</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Form Panel -->
          <div class="auth-form-side">
            <div class="auth-form-header">
              <div class="auth-form-brand">
                <img src="/static/assets/icons/01-main-logo.svg" alt="Logo" class="auth-form-logo">
                <span class="auth-form-brand-text">Resume Screening Assistant</span>
              </div>
              <h2 class="auth-title">Create Candidate Account</h2>
              <p class="auth-subtitle">Fill in your information to get started.</p>
            </div>

            <form id="form-candidate-register" class="auth-form-body">
              <div id="candidate-register-error" class="form-alert form-alert-danger" style="display: none;"></div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="reg-fullname">Full Name <span class="required">*</span></label>
                  <input type="text" id="reg-fullname" class="form-input" placeholder="e.g. Sarah Connor" required autocomplete="name">
                </div>
                <div class="form-group">
                  <label class="form-label" for="reg-email">Email Address <span class="required">*</span></label>
                  <input type="email" id="reg-email" class="form-input" placeholder="you@example.com" required autocomplete="email">
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="reg-phone">Phone Number</label>
                  <input type="tel" id="reg-phone" class="form-input" placeholder="+1 (555) 000-0000" autocomplete="tel">
                </div>
                <div class="form-group">
                  <label class="form-label" for="reg-location">Location / City</label>
                  <input type="text" id="reg-location" class="form-input" placeholder="e.g. Austin, TX" autocomplete="address-level2">
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="reg-password">Password <span class="required">*</span></label>
                  <input type="password" id="reg-password" class="form-input" placeholder="Min. 6 characters" required autocomplete="new-password">
                </div>
                <div class="form-group">
                  <label class="form-label" for="reg-confirm-password">Confirm Password <span class="required">*</span></label>
                  <input type="password" id="reg-confirm-password" class="form-input" placeholder="Re-enter password" required autocomplete="new-password">
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-block btn-lg" id="btn-cand-register-submit">
                Create Account
              </button>
            </form>

            <div class="auth-form-footer">
              <span>Already have an account?</span>
              <a href="#/candidate-login" class="text-primary-link font-semibold">Sign in &rarr;</a>
            </div>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('form-candidate-register');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const errBox = document.getElementById('candidate-register-error');
      const submitBtn = document.getElementById('btn-cand-register-submit');
      errBox.style.display = 'none';

      const full_name = document.getElementById('reg-fullname').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const location = document.getElementById('reg-location').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirm_password = document.getElementById('reg-confirm-password').value;

      if (!full_name) {
        errBox.textContent = 'Please enter your full name.';
        errBox.style.display = 'block';
        return;
      }
      if (!email || !email.includes('@')) {
        errBox.textContent = 'Please enter a valid email address.';
        errBox.style.display = 'block';
        return;
      }
      if (!password || password.length < 6) {
        errBox.textContent = 'Password must be at least 6 characters.';
        errBox.style.display = 'block';
        return;
      }
      if (password !== confirm_password) {
        errBox.textContent = 'Passwords do not match. Please re-enter.';
        errBox.style.display = 'block';
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';

        const res = await API.register({ full_name, email, phone, location, password, confirm_password });
        State.setUser(res.user);
        App.showToast('Account created successfully! Welcome.', 'success');
        App.navigate('candidate/dashboard');
      } catch (err) {
        errBox.textContent = err.message || 'Registration failed.';
        errBox.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    };
  },

  renderAdminLogin(container) {
    container.innerHTML = `
      <div class="auth-layout-wrapper">
        <div class="auth-split-card">
          <!-- Left Visual Brand Panel (Admin Theme) -->
          <div class="auth-brand-side admin-theme">
            <div class="auth-brand-content">
              <div class="auth-brand-emblem admin-emblem">
                <img src="/static/assets/icons/03-admin.svg" alt="Admin Portal" class="auth-emblem-img">
              </div>
              <div class="auth-brand-badge admin-badge">Recruitment & Hiring Team</div>
              <h2 class="auth-brand-heading">Smarter Recruitment & Screening Intelligence.</h2>
              <p class="auth-brand-sub">Manage job openings, review applicant resumes with transparent requirement matching, record internal recruiter notes, and streamline hiring workflows.</p>
              
              <div class="auth-feature-bullets">
                <div class="bullet-item">
                  <span class="bullet-icon">&#10003;</span>
                  <span>Grounded requirement-by-requirement evidence</span>
                </div>
                <div class="bullet-item">
                  <span class="bullet-icon">&#10003;</span>
                  <span>Configurable qualification scoring weights</span>
                </div>
                <div class="bullet-item">
                  <span class="bullet-icon">&#10003;</span>
                  <span>Confidential internal recruiter notes</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Form Panel -->
          <div class="auth-form-side">
            <div class="auth-form-header">
              <div class="auth-form-brand">
                <img src="/static/assets/icons/01-main-logo.svg" alt="Logo" class="auth-form-logo">
                <span class="auth-form-brand-text">Resume Screening Assistant</span>
              </div>
              <h2 class="auth-title">Admin Sign In</h2>
              <p class="auth-subtitle">Access the recruiter dashboard and job management tools.</p>
            </div>

            <form id="form-admin-login" class="auth-form-body">
              <div id="admin-login-error" class="form-alert form-alert-danger" style="display: none;"></div>

              <div class="form-group">
                <label class="form-label" for="admin-email">Admin Email <span class="required">*</span></label>
                <input type="email" id="admin-email" class="form-input" placeholder="admin@resumescreening.com" required autocomplete="email">
              </div>

              <div class="form-group">
                <div class="form-label-row">
                  <label class="form-label" for="admin-password">Password <span class="required">*</span></label>
                </div>
                <input type="password" id="admin-password" class="form-input" placeholder="Enter admin password" required autocomplete="current-password">
              </div>

              <button type="submit" class="btn btn-primary btn-block btn-lg" id="btn-admin-login-submit">
                Sign In to Admin Portal
              </button>

              <!-- Quick Demo Helper -->
              <div class="auth-demo-helper">
                <span>Testing? Fill admin credentials:</span>
                <button type="button" class="btn btn-ghost btn-sm" id="btn-fill-demo-admin">
                  Fill Admin Credentials
                </button>
              </div>
            </form>

            <div class="auth-form-footer">
              <span>Looking for job opportunities?</span>
              <a href="#/candidate-login" class="text-primary-link font-semibold">Candidate Login &rarr;</a>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-fill-demo-admin')?.addEventListener('click', () => {
      document.getElementById('admin-email').value = 'admin@resumescreening.com';
      document.getElementById('admin-password').value = 'AdminPassword123!';
    });

    const form = document.getElementById('form-admin-login');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const errBox = document.getElementById('admin-login-error');
      const submitBtn = document.getElementById('btn-admin-login-submit');
      errBox.style.display = 'none';

      const email = document.getElementById('admin-email').value.trim();
      const password = document.getElementById('admin-password').value;

      if (!email || !password) {
        errBox.textContent = 'Please enter both your admin email address and password.';
        errBox.style.display = 'block';
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Authenticating...';

        const res = await API.login({ email, password, expected_role: 'admin' });
        State.setUser(res.user);
        App.showToast(`Admin signed in: ${res.user.full_name}`, 'success');
        App.navigate('admin/dashboard');
      } catch (err) {
        errBox.textContent = err.message || 'Invalid admin credentials.';
        errBox.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In to Admin Portal';
      }
    };
  }
};
