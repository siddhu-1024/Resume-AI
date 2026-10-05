/**
 * Settings & Scoring Weights Configurator
 */
const SettingsView = {
  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Platform Settings & Matching Configuration</h1>
          <p>Configure multi-dimensional match weights, AI models, and recruitment test data.</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
        <!-- Left Column: Scoring Weights & AI Config -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- 1. Scoring Weights Configurator -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20v-6M6 20V10M18 20V4"></path></svg>
                Configurable Job Requirement Match Weights
              </span>
              <button class="btn btn-ghost btn-sm" id="btn-reset-weights" style="color: var(--text-muted);">
                Reset to Default
              </button>
            </div>
            <div class="card-body">
              <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
                Adjust the relative importance of each dimension when screening candidates against job requirements.
                <b>Total weights must sum exactly to 100%.</b>
              </p>

              <div id="weights-sliders-container" style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Weights items injected via JS -->
              </div>

              <!-- Live Total Sum Gauge -->
              <div style="margin-top: 24px; padding: 14px 18px; background-color: var(--champagne-light); border: 1.5px solid var(--champagne-border); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-size: 12px; font-weight: 700; color: var(--text-heading);">Total Weights Allocation</div>
                  <div id="weights-sum-status" style="font-size: 11px; color: var(--text-muted);">Must equal 100%</div>
                </div>
                <div style="font-size: 20px; font-weight: 900; color: var(--primary);" id="weights-total-display">100%</div>
              </div>

              <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
                <button class="btn btn-primary" id="btn-save-weights">
                  Save Scoring Weights
                </button>
              </div>
            </div>
          </div>

          <!-- 2. AI Intelligence Engine Config -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                AI Model & API Integration
              </span>
            </div>
            <div class="card-body">
              <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
                The platform runs completely out-of-the-box using built-in deterministic NLP.
                You can optionally connect Google Gemini or OpenAI for generative interview synthesis.
              </p>

              <div class="form-group">
                <label class="form-label">AI Engine Mode</label>
                <select id="ai-provider-select" class="form-select">
                  <option value="gemini">Google Gemini (Recommended)</option>
                  <option value="openai">OpenAI GPT-4o-mini</option>
                  <option value="none">Deterministic Local NLP Only (No API Keys)</option>
                </select>
              </div>

              <div class="form-group" id="gemini-key-group">
                <label class="form-label">Google Gemini API Key</label>
                <input type="password" id="gemini-api-key" class="form-input" placeholder="AIzaSy...">
                <div class="form-hint" id="gemini-key-status">Key not set (using local NLP fallback)</div>
              </div>

              <div class="form-group" id="openai-key-group">
                <label class="form-label">OpenAI API Key</label>
                <input type="password" id="openai-api-key" class="form-input" placeholder="sk-...">
                <div class="form-hint" id="openai-key-status">Key not set</div>
              </div>

              <div style="display: flex; justify-content: flex-end;">
                <button class="btn btn-secondary btn-sm" id="btn-save-ai">Save AI Settings</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Demo Data & System Info -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- Demo Data Management -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">Demo Data Sandbox</span>
            </div>
            <div class="card-body">
              <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
                Populate realistic sample jobs and screened candidates with detailed resumes for instant demonstration.
              </p>

              <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="btn btn-primary" id="btn-settings-seed-demo">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                  Populate Demo Jobs & Resumes
                </button>

                <button class="btn btn-secondary" style="color: var(--danger);" id="btn-settings-clear-demo">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  Clear All Demo Data
                </button>
              </div>
            </div>
          </div>

          <!-- Platform Spec & System Info -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">System & Security Specifications</span>
            </div>
            <div class="card-body" style="font-size: 12px; display: flex; flex-direction: column; gap: 8px;">
              <div><b>Supported File Types:</b> PDF, DOCX</div>
              <div><b>Max Resume Size:</b> 16 MB</div>
              <div><b>Database Backend:</b> Relational SQLite (PostgreSQL Ready)</div>
              <div><b>Duplicate Check:</b> SHA-256 Checksum Hashing</div>
              <div><b>Version:</b> 1.0.0 Production SaaS</div>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.loadSettingsData();
  },

  async loadSettingsData() {
    try {
      const data = await API.getSettings();
      const weights = data.scoring_weights || {};
      const aiConfig = data.ai_config || {};

      // Render sliders
      const labels = {
        'required_skills': 'Required Skills Match',
        'experience': 'Relevant Work Experience',
        'technical_skills': 'Technical Skill Breadth',
        'projects': 'Projects Relevance',
        'education': 'Education Relevance',
        'preferred_skills': 'Preferred Skills Match',
        'certifications': 'Certifications & Credentials'
      };

      const container = document.getElementById('weights-sliders-container');
      container.innerHTML = Object.keys(weights).map(key => `
        <div style="display: grid; grid-template-columns: 200px 1fr 60px; align-items: center; gap: 16px;">
          <span style="font-size: 13px; font-weight: 600; color: var(--text-main);">${labels[key] || key}</span>
          <input type="range" class="weight-slider" data-key="${key}" min="0" max="60" step="1" value="${weights[key]}" style="accent-color: var(--primary); cursor: pointer;">
          <input type="number" class="weight-input form-input" data-key="${key}" min="0" max="100" value="${weights[key]}" style="padding: 4px 6px; font-size: 12px; font-weight: 700; text-align: center;">
        </div>
      `).join('');

      this.bindWeightEvents();
      this.updateTotalSumDisplay();

      // AI Form
      const provSelect = document.getElementById('ai-provider-select');
      if (provSelect) provSelect.value = aiConfig.provider || 'gemini';

      const geminiStatus = document.getElementById('gemini-key-status');
      if (geminiStatus && aiConfig.has_gemini_key) {
        geminiStatus.innerHTML = `<span style="color: var(--success);">Key active (${aiConfig.gemini_key_masked})</span>`;
      }
      const openaiStatus = document.getElementById('openai-key-status');
      if (openaiStatus && aiConfig.has_openai_key) {
        openaiStatus.innerHTML = `<span style="color: var(--success);">Key active (${aiConfig.openai_key_masked})</span>`;
      }

      // Buttons
      document.getElementById('btn-reset-weights').onclick = async () => {
        const res = await API.resetWeights();
        App.showToast(res.message, "success");
        await SettingsView.render(document.getElementById('app-view-container'));
      };

      document.getElementById('btn-save-weights').onclick = async () => {
        const weightsObj = {};
        document.querySelectorAll('.weight-input').forEach(inp => {
          weightsObj[inp.getAttribute('data-key')] = parseFloat(inp.value) || 0;
        });
        try {
          const res = await API.updateWeights(weightsObj);
          App.showToast(res.message, "success");
        } catch (e) {
          App.showToast(e.message, "danger");
        }
      };

      document.getElementById('btn-save-ai').onclick = async () => {
        const provider = document.getElementById('ai-provider-select')?.value;
        const geminiKey = document.getElementById('gemini-api-key')?.value;
        const openaiKey = document.getElementById('openai-api-key')?.value;
        try {
          const payload = { provider };
          if (geminiKey) payload.gemini_api_key = geminiKey;
          if (openaiKey) payload.openai_api_key = openaiKey;
          const res = await API.updateAIConfig(payload);
          App.showToast(res.message, "success");
        } catch (e) {
          App.showToast(e.message, "danger");
        }
      };

      document.getElementById('btn-settings-seed-demo').onclick = async () => {
        try {
          const res = await API.seedDemoData();
          App.showToast(res.message, "success");
          await State.loadJobs();
          App.navigate('dashboard');
        } catch (e) {
          App.showToast(e.message, "danger");
        }
      };

      document.getElementById('btn-settings-clear-demo').onclick = async () => {
        if (!confirm("Are you sure you want to clear all sample demo data?")) return;
        try {
          const res = await API.clearDemoData();
          App.showToast(res.message, "success");
          await State.loadJobs();
          App.navigate('dashboard');
        } catch (e) {
          App.showToast(e.message, "danger");
        }
      };

    } catch (e) {
      console.error("Settings load failed:", e);
    }
  },

  bindWeightEvents() {
    const sliders = document.querySelectorAll('.weight-slider');
    const inputs = document.querySelectorAll('.weight-input');

    sliders.forEach(slider => {
      slider.oninput = (e) => {
        const key = e.target.getAttribute('data-key');
        const matchInput = document.querySelector(`.weight-input[data-key="${key}"]`);
        if (matchInput) matchInput.value = e.target.value;
        SettingsView.updateTotalSumDisplay();
      };
    });

    inputs.forEach(input => {
      input.oninput = (e) => {
        const key = e.target.getAttribute('data-key');
        const matchSlider = document.querySelector(`.weight-slider[data-key="${key}"]`);
        if (matchSlider) matchSlider.value = e.target.value;
        SettingsView.updateTotalSumDisplay();
      };
    });
  },

  updateTotalSumDisplay() {
    const inputs = document.querySelectorAll('.weight-input');
    let sum = 0;
    inputs.forEach(inp => {
      sum += parseFloat(inp.value) || 0;
    });

    const display = document.getElementById('weights-total-display');
    const status = document.getElementById('weights-sum-status');
    const saveBtn = document.getElementById('btn-save-weights');

    if (!display) return;

    display.textContent = `${sum.toFixed(0)}%`;

    if (sum === 100) {
      display.style.color = 'var(--success)';
      status.textContent = 'Valid allocation (equals 100%)';
      status.style.color = 'var(--success)';
      if (saveBtn) saveBtn.disabled = false;
    } else {
      display.style.color = 'var(--danger)';
      status.textContent = `Invalid total allocation (difference: ${(100 - sum).toFixed(0)}%)`;
      status.style.color = 'var(--danger)';
      if (saveBtn) saveBtn.disabled = true;
    }
  }
};
