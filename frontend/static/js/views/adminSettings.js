/**
 * Admin Settings & Scoring Weights View
 * Features colorful interactive scoring weight sliders, category badges, and demo data management.
 */
const AdminSettingsView = {
  async render(container) {
    if (!State.isAuthenticated || State.currentRole !== 'admin') {
      container.innerHTML = `<div class="auth-required-box"><h2>Admin Sign In Required</h2></div>`;
      return;
    }

    container.innerHTML = `
      <div class="loading-state-box">
        <div class="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    `;

    try {
      const settings = await API.getSettings();
      const weights = settings.scoring_weights || settings.weights || {
        required_skills: 0.30,
        experience: 0.25,
        technical_skills: 0.15,
        projects: 0.10,
        education: 0.10,
        preferred_skills: 0.05,
        certifications: 0.05
      };

      container.innerHTML = `
        <div class="admin-settings-wrapper">
          <div class="page-header">
            <div class="page-title-group">
              <h1 class="page-heading">Settings & Screening Weights</h1>
              <p class="page-subheading">Configure screening algorithm weights and manage recruitment demonstration data.</p>
            </div>
          </div>

          <!-- Scoring Weights Card -->
          <div class="admin-section-card settings-scoring-card">
            <div class="settings-card-header">
              <div>
                <h3 class="admin-section-title">Job Requirement Scoring Weights</h3>
                <p class="admin-section-sub">Customize how different candidate qualifications are weighted during screening. Total must equal 100%.</p>
              </div>
              <div class="weights-total-badge" id="weights-total-badge">
                Total: <span id="weights-total-val">100</span>%
              </div>
            </div>

            <form id="form-weights-config" class="weights-form">
              <div class="weights-grid">
                <div class="weight-control-item">
                  <div class="weight-label-row">
                    <label class="form-label font-bold" for="weight-req-skills">Required Skills</label>
                    <span class="weight-pct-display" id="val-req-skills">${Math.round(weights.required_skills * 100)}%</span>
                  </div>
                  <input type="range" id="weight-req-skills" min="0" max="100" step="5" class="weight-slider" value="${Math.round(weights.required_skills * 100)}">
                  <div class="weight-desc">Core mandatory skills specified in the job posting</div>
                </div>

                <div class="weight-control-item">
                  <div class="weight-label-row">
                    <label class="form-label font-bold" for="weight-exp">Relevant Experience</label>
                    <span class="weight-pct-display" id="val-exp">${Math.round(weights.experience * 100)}%</span>
                  </div>
                  <input type="range" id="weight-exp" min="0" max="100" step="5" class="weight-slider" value="${Math.round(weights.experience * 100)}">
                  <div class="weight-desc">Years of industry experience vs minimum job requirements</div>
                </div>

                <div class="weight-control-item">
                  <div class="weight-label-row">
                    <label class="form-label font-bold" for="weight-tech-skills">Technical Skills</label>
                    <span class="weight-pct-display" id="val-tech-skills">${Math.round(weights.technical_skills * 100)}%</span>
                  </div>
                  <input type="range" id="weight-tech-skills" min="0" max="100" step="5" class="weight-slider" value="${Math.round(weights.technical_skills * 100)}">
                  <div class="weight-desc">General technical proficiencies, tools, and platforms</div>
                </div>

                <div class="weight-control-item">
                  <div class="weight-label-row">
                    <label class="form-label font-bold" for="weight-projects">Projects & Portfolio</label>
                    <span class="weight-pct-display" id="val-projects">${Math.round(weights.projects * 100)}%</span>
                  </div>
                  <input type="range" id="weight-projects" min="0" max="100" step="5" class="weight-slider" value="${Math.round(weights.projects * 100)}">
                  <div class="weight-desc">Demonstrated portfolio and project contributions</div>
                </div>

                <div class="weight-control-item">
                  <div class="weight-label-row">
                    <label class="form-label font-bold" for="weight-education">Education</label>
                    <span class="weight-pct-display" id="val-education">${Math.round(weights.education * 100)}%</span>
                  </div>
                  <input type="range" id="weight-education" min="0" max="100" step="5" class="weight-slider" value="${Math.round(weights.education * 100)}">
                  <div class="weight-desc">Academic degree level alignment</div>
                </div>

                <div class="weight-control-item">
                  <div class="weight-label-row">
                    <label class="form-label font-bold" for="weight-pref-skills">Preferred Skills</label>
                    <span class="weight-pct-display" id="val-pref-skills">${Math.round(weights.preferred_skills * 100)}%</span>
                  </div>
                  <input type="range" id="weight-pref-skills" min="0" max="100" step="5" class="weight-slider" value="${Math.round(weights.preferred_skills * 100)}">
                  <div class="weight-desc">Secondary or bonus qualifications</div>
                </div>

                <div class="weight-control-item">
                  <div class="weight-label-row">
                    <label class="form-label font-bold" for="weight-certs">Certifications</label>
                    <span class="weight-pct-display" id="val-certs">${Math.round(weights.certifications * 100)}%</span>
                  </div>
                  <input type="range" id="weight-certs" min="0" max="100" step="5" class="weight-slider" value="${Math.round(weights.certifications * 100)}">
                  <div class="weight-desc">Verified industry and professional credentials</div>
                </div>
              </div>

              <div class="form-alert form-alert-danger" id="weights-error-msg" style="display: none; margin-top: 16px;"></div>

              <div class="weights-actions-row">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-reset-weights">
                  Reset to Standard Defaults
                </button>
                <button type="submit" class="btn btn-primary" id="btn-save-weights">
                  Save Screening Weights
                </button>
              </div>
            </form>
          </div>

          <!-- Demo Data Management Section -->
          <div class="admin-section-card demo-mgmt-card">
            <h3 class="admin-section-title">Demo Data Management</h3>
            <p class="admin-section-sub">Seed sample job openings, candidates, and applications for demonstration, or clear all demo records.</p>

            <div class="demo-actions-row">
              <div class="demo-action-item">
                <div>
                  <div class="demo-action-title">Seed Demo Data</div>
                  <div class="demo-action-desc">Populates sample job openings (Frontend, Python, DevOps) and realistic candidate applications with resumes.</div>
                </div>
                <button class="btn btn-outline-primary btn-sm" id="btn-seed-demo-data">
                  Seed Demo Data
                </button>
              </div>

              <div class="demo-action-item">
                <div>
                  <div class="demo-action-title">Clear Demo Data</div>
                  <div class="demo-action-desc">Removes all demonstration candidates, applications, and demo jobs. Real user data is preserved.</div>
                </div>
                <button class="btn btn-ghost text-danger btn-sm" id="btn-clear-demo-data">
                  Clear Demo Data
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Live Weight Slider calculations
      const sliders = [
        { id: 'weight-req-skills', label: 'val-req-skills', key: 'required_skills' },
        { id: 'weight-exp', label: 'val-exp', key: 'experience' },
        { id: 'weight-tech-skills', label: 'val-tech-skills', key: 'technical_skills' },
        { id: 'weight-projects', label: 'val-projects', key: 'projects' },
        { id: 'weight-education', label: 'val-education', key: 'education' },
        { id: 'weight-pref-skills', label: 'val-pref-skills', key: 'preferred_skills' },
        { id: 'weight-certs', label: 'val-certs', key: 'certifications' }
      ];

      const updateWeightTotals = () => {
        let sum = 0;
        sliders.forEach(s => {
          const el = document.getElementById(s.id);
          const val = parseInt(el?.value || 0, 10);
          const labelEl = document.getElementById(s.label);
          if (labelEl) labelEl.textContent = `${val}%`;
          if (el) {
            el.style.setProperty('--slider-pct', `${val}%`);
          }
          sum += val;
        });

        const badge = document.getElementById('weights-total-badge');
        const valSpan = document.getElementById('weights-total-val');
        if (valSpan) valSpan.textContent = sum;

        if (sum === 100) {
          if (badge) badge.className = 'weights-total-badge badge-valid';
          const errBox = document.getElementById('weights-error-msg');
          if (errBox) errBox.style.display = 'none';
        } else {
          if (badge) badge.className = 'weights-total-badge badge-invalid';
          const errBox = document.getElementById('weights-error-msg');
          if (errBox) {
            errBox.textContent = `Weights must sum exactly to 100%. Current sum: ${sum}%.`;
            errBox.style.display = 'block';
          }
        }
      };

      sliders.forEach(s => {
        document.getElementById(s.id)?.addEventListener('input', updateWeightTotals);
      });

      // Initial track fill calculation
      updateWeightTotals();

      // Submit Weights Form
      document.getElementById('form-weights-config')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errBox = document.getElementById('weights-error-msg');
        errBox.style.display = 'none';

        const payload = {
          scoring_weights: {
            required_skills: parseInt(document.getElementById('weight-req-skills')?.value || 0, 10) / 100,
            experience: parseInt(document.getElementById('weight-exp')?.value || 0, 10) / 100,
            technical_skills: parseInt(document.getElementById('weight-tech-skills')?.value || 0, 10) / 100,
            projects: parseInt(document.getElementById('weight-projects')?.value || 0, 10) / 100,
            education: parseInt(document.getElementById('weight-education')?.value || 0, 10) / 100,
            preferred_skills: parseInt(document.getElementById('weight-pref-skills')?.value || 0, 10) / 100,
            certifications: parseInt(document.getElementById('weight-certs')?.value || 0, 10) / 100
          }
        };

        const totalSum = Object.values(payload.scoring_weights).reduce((a, b) => a + b, 0);
        if (Math.abs(totalSum - 1.0) > 0.001) {
          errBox.textContent = `Weights must sum to 100% exactly (Current sum: ${Math.round(totalSum * 100)}%).`;
          errBox.style.display = 'block';
          return;
        }

        try {
          const btn = document.getElementById('btn-save-weights');
          btn.disabled = true;
          btn.textContent = 'Saving...';
          await API.updateSettings(payload);
          App.showToast('Scoring weights updated successfully.', 'success');
        } catch (err) {
          errBox.textContent = err.message || 'Failed to update weights.';
          errBox.style.display = 'block';
        } finally {
          const btn = document.getElementById('btn-save-weights');
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Save Screening Weights';
          }
        }
      });

      // Reset Defaults
      document.getElementById('btn-reset-weights')?.addEventListener('click', () => {
        document.getElementById('weight-req-skills').value = 30;
        document.getElementById('weight-exp').value = 25;
        document.getElementById('weight-tech-skills').value = 15;
        document.getElementById('weight-projects').value = 10;
        document.getElementById('weight-education').value = 10;
        document.getElementById('weight-pref-skills').value = 5;
        document.getElementById('weight-certs').value = 5;
        updateWeightTotals();
      });

      // Seed Demo Data Button
      document.getElementById('btn-seed-demo-data')?.addEventListener('click', async () => {
        if (!confirm('Seed demo recruitment data into the system? This creates sample jobs and candidate applications.')) return;
        try {
          App.showToast('Seeding demo data...', 'info');
          await API.seedDemoData();
          App.showToast('Demo data seeded successfully!', 'success');
          await State.loadJobs();
        } catch (e) {
          App.showToast(e.message || 'Failed to seed demo data.', 'danger');
        }
      });

      // Clear Demo Data Button
      document.getElementById('btn-clear-demo-data')?.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to clear all demo data? Real user records will be retained.')) return;
        try {
          App.showToast('Clearing demo data...', 'info');
          await API.clearDemoData();
          App.showToast('Demo data cleared.', 'success');
          await State.loadJobs();
        } catch (e) {
          App.showToast(e.message || 'Failed to clear demo data.', 'danger');
        }
      });

    } catch (err) {
      container.innerHTML = `<div class="error-state-card"><p>${escapeHtml(err.message)}</p></div>`;
    }
  }
};
