/**
 * Screening View & Candidate Pipeline
 */
const ScreeningView = {
  viewMode: 'cards', // 'cards' or 'table'
  statusFilter: 'all',

  async render(container, customStatus = null) {
    this.statusFilter = customStatus || 'all';

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Resume Screening & Match Analysis</h1>
          <p>Transparent multi-dimensional candidate evaluation grounded in extracted resume evidence.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" id="btn-screen-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Re-Screen Job Candidates
          </button>
          <button class="btn btn-primary btn-sm" onclick="App.openUploadModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Upload More Resumes
          </button>
        </div>
      </div>

      <!-- Compare Candidates Floating / Top Bar -->
      <div id="compare-cta-bar" style="display: none; background: linear-gradient(135deg, var(--deep-emerald), #011a14); color: white; padding: 12px 20px; border-radius: var(--radius-lg); margin-bottom: 20px; align-items: center; justify-content: space-between; box-shadow: var(--shadow-md); border: 1.5px solid var(--champagne-border);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 13px; font-weight: 700;">Selected <span id="compare-count" style="color: var(--champagne); font-weight: 800;">0</span> candidate(s) for side-by-side comparison</span>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-ghost btn-sm" style="color: var(--champagne-light);" onclick="State.clearCompareSelection()">Clear</button>
          <button class="btn btn-champagne btn-sm" onclick="CompareView.open()">Compare Side-by-Side</button>
        </div>
      </div>

      <!-- Multi-Filter & Search Bar -->
      <div class="card" style="margin-bottom: 24px; padding: 16px 20px;">
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 12px; align-items: center;">
          <div>
            <label class="form-label" style="font-size: 11px;">Search Candidates</label>
            <input type="text" id="screen-search" class="form-input" placeholder="Search by name, email, or skills...">
          </div>
          <div>
            <label class="form-label" style="font-size: 11px;">Pipeline Status</label>
            <select id="screen-status" class="form-select">
              <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="Shortlisted" ${this.statusFilter === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
              <option value="Review Later" ${this.statusFilter === 'Review Later' ? 'selected' : ''}>Review Later</option>
              <option value="Interview" ${this.statusFilter === 'Interview' ? 'selected' : ''}>Interview</option>
              <option value="Screening" ${this.statusFilter === 'Screening' ? 'selected' : ''}>Screening</option>
              <option value="New" ${this.statusFilter === 'New' ? 'selected' : ''}>New</option>
              <option value="Rejected" ${this.statusFilter === 'Rejected' ? 'selected' : ''}>Rejected</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 11px;">Min Match %</label>
            <select id="screen-min-match" class="form-select">
              <option value="0">Any Match</option>
              <option value="80">80%+ (High Match)</option>
              <option value="60">60%+ (Good Match)</option>
              <option value="40">40%+ (Partial)</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 11px;">Sort By</label>
            <select id="screen-sort" class="form-select">
              <option value="match_desc">Match Score (High to Low)</option>
              <option value="match_asc">Match Score (Low to High)</option>
              <option value="exp_desc">Experience (High to Low)</option>
              <option value="name_asc">Candidate Name (A-Z)</option>
              <option value="latest">Latest Screened</option>
            </select>
          </div>
          <div style="display: flex; align-items: flex-end; height: 100%;">
            <div style="display: flex; border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden;">
              <button class="btn btn-ghost btn-sm ${this.viewMode === 'cards' ? 'active' : ''}" id="btn-view-cards" style="border-radius: 0; padding: 7px 10px;" title="Cards View">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </button>
              <button class="btn btn-ghost btn-sm ${this.viewMode === 'table' ? 'active' : ''}" id="btn-view-table" style="border-radius: 0; padding: 7px 10px;" title="Table View">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Responsible Screening Disclaimer -->
      <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-heading); background-color: var(--champagne-light); padding: 9px 16px; border-radius: var(--radius-md); margin-bottom: 20px; border: 1px solid var(--champagne-border);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary);"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <span><b>Fairness & Transparency Notice:</b> Screening results are based strictly on job-relevant skills and experience detected in resumes to support, not replace, human recruitment review.</span>
      </div>

      <!-- Dynamic Candidates Container -->
      <div id="screening-candidates-container">
        <div style="padding: 32px; text-align: center; color: var(--text-muted);">Loading screened candidates...</div>
      </div>
    `;

    // Event listeners
    document.getElementById('screen-search').addEventListener('input', () => this.loadCandidatesList());
    document.getElementById('screen-status').addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.loadCandidatesList();
    });
    document.getElementById('screen-min-match').addEventListener('change', () => this.loadCandidatesList());
    document.getElementById('screen-sort').addEventListener('change', () => this.loadCandidatesList());

    document.getElementById('btn-view-cards').onclick = () => {
      this.viewMode = 'cards';
      this.loadCandidatesList();
    };
    document.getElementById('btn-view-table').onclick = () => {
      this.viewMode = 'table';
      this.loadCandidatesList();
    };

    document.getElementById('btn-screen-all').onclick = async () => {
      if (!State.currentJobId || State.currentJobId === 'all') {
        App.showToast("Please select a specific Job Opening from the topbar to run screening.", "warning");
        return;
      }
      try {
        const res = await API.runScreening({ job_id: State.currentJobId });
        App.showToast(res.message, "success");
        await this.loadCandidatesList();
      } catch (e) {
        App.showToast(e.message, "danger");
      }
    };

    State.subscribe('compareSelectionChanged', (ids) => {
      const bar = document.getElementById('compare-cta-bar');
      const count = document.getElementById('compare-count');
      if (!bar || !count) return;

      if (ids.length >= 2) {
        bar.style.display = 'flex';
        count.textContent = ids.length;
      } else {
        bar.style.display = 'none';
      }
    });

    await this.loadCandidatesList();
  },

  async loadCandidatesList() {
    const search = document.getElementById('screen-search')?.value || '';
    const status = this.statusFilter;
    const min_match = document.getElementById('screen-min-match')?.value || '0';
    const sort_by = document.getElementById('screen-sort')?.value || 'match_desc';

    try {
      const candidates = await State.loadCandidates({
        search,
        status: status === 'all' ? '' : status,
        min_match: min_match !== '0' ? min_match : '',
        sort_by
      });

      const container = document.getElementById('screening-candidates-container');
      if (!container) return;

      if (candidates.length === 0) {
        container.innerHTML = `
          <div class="empty-state card" style="padding: 48px;">
            <div class="empty-state-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
            </div>
            <div class="empty-state-title">No candidates match the selected filters</div>
            <div class="empty-state-desc">Try resetting your search query, status, or match percentage criteria.</div>
            <button class="btn btn-secondary btn-sm" onclick="ScreeningView.resetFilters()">Reset Filters</button>
          </div>
        `;
        return;
      }

      if (this.viewMode === 'cards') {
        this.renderCardsView(container, candidates);
      } else {
        this.renderTableView(container, candidates);
      }

    } catch (e) {
      console.error("Failed to load candidate list:", e);
    }
  },

  resetFilters() {
    const s = document.getElementById('screen-search');
    const st = document.getElementById('screen-status');
    const mm = document.getElementById('screen-min-match');
    if (s) s.value = '';
    if (st) st.value = 'all';
    if (mm) mm.value = '0';
    this.statusFilter = 'all';
    this.loadCandidatesList();
  },

  renderCardsView(container, candidates) {
    container.innerHTML = `
      <div class="candidate-grid">
        ${candidates.map(c => {
          const score = c.latest_match_score;
          const scoreClass = score !== null ? (score >= 80 ? 'high' : (score >= 60 ? 'medium' : 'low')) : 'unscreened';
          const scoreText = score !== null ? `${score.toFixed(1)}% Match` : 'Unscreened';
          const isSelected = State.selectedCandidateIdsForCompare.has(c.id);

          return `
            <div class="candidate-card">
              <div class="candidate-card-top">
                <div class="candidate-card-identity">
                  <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="State.toggleCompareCandidate(${c.id})" title="Select to compare">
                  <div class="candidate-avatar-circle" style="width: 40px; height: 40px;">${c.full_name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <div class="candidate-card-name">${c.full_name}</div>
                    <div class="candidate-card-role">${c.job_title}</div>
                  </div>
                </div>
                <span class="score-pill ${scoreClass}">${scoreText}</span>
              </div>

              <div class="candidate-meta-row">
                <div class="candidate-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                  <span>${c.total_experience_years} yrs exp</span>
                </div>
                <div class="candidate-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <span>${c.location}</span>
                </div>
              </div>

              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">Top Skills:</div>
              <div class="candidate-skills-wrap">
                ${(c.top_skills || []).map(s => `<span class="chip chip-tech">${s}</span>`).join('') || '<span style="font-size:11px; color:var(--text-light);">No skills parsed</span>'}
              </div>

              <div class="candidate-card-actions">
                <select class="form-select form-select-sm" style="font-size: 11px; padding: 4px 8px; width: auto;" onchange="ScreeningView.changeStatus(${c.id}, this.value)">
                  <option value="New" ${c.status === 'New' ? 'selected' : ''}>New</option>
                  <option value="Screening" ${c.status === 'Screening' ? 'selected' : ''}>Screening</option>
                  <option value="Shortlisted" ${c.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
                  <option value="Review Later" ${c.status === 'Review Later' ? 'selected' : ''}>Review Later</option>
                  <option value="Interview" ${c.status === 'Interview' ? 'selected' : ''}>Interview</option>
                  <option value="Rejected" ${c.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                  <option value="Hired" ${c.status === 'Hired' ? 'selected' : ''}>Hired</option>
                </select>

                <button class="btn btn-primary btn-sm" onclick="CandidateDetailView.open(${c.id})">
                  View Match Analysis
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderTableView(container, candidates) {
    container.innerHTML = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 36px;"></th>
              <th>Candidate Name</th>
              <th>Job Position</th>
              <th>Requirement Match</th>
              <th>Experience</th>
              <th>Education</th>
              <th>Top Skills</th>
              <th>Pipeline Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${candidates.map(c => {
              const score = c.latest_match_score;
              const scoreClass = score !== null ? (score >= 80 ? 'high' : (score >= 60 ? 'medium' : 'low')) : 'unscreened';
              const scoreText = score !== null ? `${score.toFixed(1)}%` : 'N/A';
              const isSelected = State.selectedCandidateIdsForCompare.has(c.id);

              return `
                <tr>
                  <td>
                    <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="State.toggleCompareCandidate(${c.id})">
                  </td>
                  <td>
                    <div style="font-weight: 700; color: var(--text-main); font-size: 13px;">${c.full_name}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">${c.email}</div>
                  </td>
                  <td>${c.job_title}</td>
                  <td><span class="score-pill ${scoreClass}">${scoreText}</span></td>
                  <td><b>${c.total_experience_years} yrs</b></td>
                  <td>${c.highest_education}</td>
                  <td>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap; max-width: 240px;">
                      ${(c.top_skills || []).slice(0, 3).map(s => `<span class="chip chip-tech">${s}</span>`).join('')}
                    </div>
                  </td>
                  <td>
                    <select class="form-select" style="font-size: 11px; padding: 3px 6px; width: auto;" onchange="ScreeningView.changeStatus(${c.id}, this.value)">
                      <option value="New" ${c.status === 'New' ? 'selected' : ''}>New</option>
                      <option value="Screening" ${c.status === 'Screening' ? 'selected' : ''}>Screening</option>
                      <option value="Shortlisted" ${c.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
                      <option value="Review Later" ${c.status === 'Review Later' ? 'selected' : ''}>Review Later</option>
                      <option value="Interview" ${c.status === 'Interview' ? 'selected' : ''}>Interview</option>
                      <option value="Rejected" ${c.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                      <option value="Hired" ${c.status === 'Hired' ? 'selected' : ''}>Hired</option>
                    </select>
                  </td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="CandidateDetailView.open(${c.id})">Analysis</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  async changeStatus(candidateId, newStatus) {
    try {
      const res = await API.updateCandidateStatus(candidateId, { status: newStatus });
      App.showToast(res.message, 'success');
      await State.loadCandidates();
      this.loadCandidatesList();
    } catch (e) {
      App.showToast(e.message, 'danger');
    }
  }
};
