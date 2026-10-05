/**
 * Candidate Detail Profile & Deep Screening Analysis Drawer
 */
const CandidateDetailView = {
  currentCandidateId: null,

  async open(candidateId) {
    this.currentCandidateId = candidateId;
    const modal = document.getElementById('modal-candidate-detail');
    const body = document.getElementById('candidate-detail-modal-body');

    body.innerHTML = `
      <div style="padding: 48px; text-align: center; color: var(--text-muted);">
        <div class="spinner spinner-primary" style="margin: 0 auto 12px auto; width: 28px; height: 28px;"></div>
        Loading comprehensive candidate screening analysis...
      </div>
    `;

    modal.classList.add('active');

    try {
      const candidate = await API.getCandidate(candidateId);
      State.activeCandidateDetails = candidate;
      this.renderProfile(body, candidate);
    } catch (e) {
      body.innerHTML = `
        <div style="padding: 36px; text-align: center; color: var(--danger);">
          Failed to load candidate details: ${e.message}
        </div>
      `;
    }
  },

  renderProfile(container, cand) {
    const screening = cand.screening || {};
    const scores = screening.scores || {};
    const overallScore = screening.overall_match_score;
    const scoreClass = overallScore !== undefined && overallScore !== null ? (overallScore >= 80 ? 'high' : (overallScore >= 60 ? 'medium' : 'low')) : 'unscreened';
    const matrix = screening.matrix || [];

    // Setup download resume button
    const downloadBtn = document.getElementById('btn-detail-download-resume');
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        window.open(`/api/candidates/${cand.id}/resume/download`, '_blank');
      };
    }

    container.innerHTML = `
      <!-- Candidate Profile Header -->
      <div class="candidate-detail-header">
        <div class="candidate-detail-identity">
          <div class="candidate-large-avatar">${cand.full_name.slice(0, 2).toUpperCase()}</div>
          <div class="candidate-title-block">
            <h2>${cand.full_name}</h2>
            <div style="font-size: 13px; font-weight: 600; color: var(--primary); margin-top: 2px;">
              ${cand.job_title}
            </div>
            <div class="candidate-contact-links">
              <span><b>Email:</b> ${cand.email}</span>
              <span><b>Phone:</b> ${cand.phone}</span>
              <span><b>Location:</b> ${cand.location}</span>
              ${cand.linkedin_url ? `<a href="${cand.linkedin_url}" target="_blank" rel="noopener">LinkedIn</a>` : ''}
              ${cand.github_url ? `<a href="${cand.github_url}" target="_blank" rel="noopener">GitHub</a>` : ''}
              ${cand.portfolio_url ? `<a href="${cand.portfolio_url}" target="_blank" rel="noopener">Portfolio</a>` : ''}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 16px;">
          <div class="match-score-gauge-box">
            <div class="gauge-score-number" style="color: var(--${scoreClass === 'high' ? 'success' : (scoreClass === 'medium' ? 'warning' : 'danger')});">
              ${overallScore !== undefined && overallScore !== null ? overallScore.toFixed(1) + '%' : 'N/A'}
            </div>
            <div class="gauge-score-label">Job Requirement Match</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 11px; font-weight: 700; color: var(--text-muted);">PIPELINE STAGE</label>
            <select class="form-select" id="detail-status-select" style="font-weight: 700; width: 150px;" onchange="CandidateDetailView.updateStatus(this.value)">
              <option value="New" ${cand.status === 'New' ? 'selected' : ''}>New</option>
              <option value="Screening" ${cand.status === 'Screening' ? 'selected' : ''}>Screening</option>
              <option value="Shortlisted" ${cand.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
              <option value="Review Later" ${cand.status === 'Review Later' ? 'selected' : ''}>Review Later</option>
              <option value="Interview" ${cand.status === 'Interview' ? 'selected' : ''}>Interview</option>
              <option value="Rejected" ${cand.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
              <option value="Hired" ${cand.status === 'Hired' ? 'selected' : ''}>Hired</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div style="padding: 0 24px; background-color: var(--bg-surface); border-bottom: 1px solid var(--border-color);">
        <div class="tabs-nav" style="margin-bottom: 0;">
          <button class="tab-btn active" data-tab="tab-matrix">Requirement Matrix & Match</button>
          <button class="tab-btn" data-tab="tab-ai">AI Insights & Interview Guide</button>
          <button class="tab-btn" data-tab="tab-resume">Parsed Resume Profile</button>
          <button class="tab-btn" data-tab="tab-notes">Recruiter Notes & History (${(cand.notes || []).length})</button>
        </div>
      </div>

      <!-- Tab Contents Container -->
      <div style="padding: 24px; overflow-y: auto; flex: 1;">
        <!-- TAB 1: Requirement-by-Requirement Breakdown Matrix -->
        <div id="tab-matrix" class="tab-pane">
          <!-- Multi-Dimensional Sub-scores Bars -->
          <div class="card" style="margin-bottom: 24px; padding: 20px;">
            <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 16px;">
              Multi-Dimensional Match Evaluation
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="dimension-score-row">
                <div class="dimension-score-header">
                  <span>Required Skills (${screening.weights_used?.required_skills || 30}%)</span>
                  <b>${scores.required_skills ?? 0}%</b>
                </div>
                <div class="dimension-progress-bg">
                  <div class="dimension-progress-fill" style="width: ${scores.required_skills ?? 0}%;"></div>
                </div>
              </div>

              <div class="dimension-score-row">
                <div class="dimension-score-header">
                  <span>Relevant Experience (${screening.weights_used?.experience || 25}%)</span>
                  <b>${scores.experience ?? 0}%</b>
                </div>
                <div class="dimension-progress-bg">
                  <div class="dimension-progress-fill" style="width: ${scores.experience ?? 0}%;"></div>
                </div>
              </div>

              <div class="dimension-score-row">
                <div class="dimension-score-header">
                  <span>Technical Breadth (${screening.weights_used?.technical_skills || 15}%)</span>
                  <b>${scores.technical_skills ?? 0}%</b>
                </div>
                <div class="dimension-progress-bg">
                  <div class="dimension-progress-fill" style="width: ${scores.technical_skills ?? 0}%;"></div>
                </div>
              </div>

              <div class="dimension-score-row">
                <div class="dimension-score-header">
                  <span>Projects Relevance (${screening.weights_used?.projects || 10}%)</span>
                  <b>${scores.projects ?? 0}%</b>
                </div>
                <div class="dimension-progress-bg">
                  <div class="dimension-progress-fill" style="width: ${scores.projects ?? 0}%;"></div>
                </div>
              </div>

              <div class="dimension-score-row">
                <div class="dimension-score-header">
                  <span>Education (${screening.weights_used?.education || 10}%)</span>
                  <b>${scores.education ?? 0}%</b>
                </div>
                <div class="dimension-progress-bg">
                  <div class="dimension-progress-fill" style="width: ${scores.education ?? 0}%;"></div>
                </div>
              </div>

              <div class="dimension-score-row">
                <div class="dimension-score-header">
                  <span>Preferred Skills & Certs (${(screening.weights_used?.preferred_skills || 5) + (screening.weights_used?.certifications || 5)}%)</span>
                  <b>${scores.preferred_skills ?? 0}%</b>
                </div>
                <div class="dimension-progress-bg">
                  <div class="dimension-progress-fill" style="width: ${scores.preferred_skills ?? 0}%;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- REQUIREMENT BY REQUIREMENT MATRIX TABLE -->
          <div class="card" style="margin-bottom: 24px;">
            <div class="card-header">
              <span class="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                Requirement-by-Requirement Evidence Matrix
              </span>
            </div>
            <div style="padding: 0;">
              <table class="req-matrix-table">
                <thead>
                  <tr>
                    <th style="width: 25%;">Job Requirement</th>
                    <th style="width: 55%;">Candidate Evidence Snippet (Extracted from Resume)</th>
                    <th style="width: 20%;">Match Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${matrix.length > 0 ? matrix.map(m => {
                    let statusHtml = '';
                    if (m.match_status === 'Matched') {
                      statusHtml = `<span class="status-cell-matched"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Matched</span>`;
                    } else if (m.match_status === 'Partially Matched' || m.match_status === 'Below Requirement') {
                      statusHtml = `<span class="status-cell-partial"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line></svg> ${m.match_status}</span>`;
                    } else {
                      statusHtml = `<span class="status-cell-missing"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Not Detected</span>`;
                    }

                    return `
                      <tr>
                        <td><b>${m.requirement_title}</b></td>
                        <td>
                          ${m.candidate_evidence !== 'Not detected in resume' && m.candidate_evidence !== 'Not detected' 
                            ? `<span class="evidence-quote">"${m.candidate_evidence}"</span>` 
                            : `<span class="evidence-not-found">Not detected in resume text</span>`}
                        </td>
                        <td>${statusHtml}</td>
                      </tr>
                    `;
                  }).join('') : `
                    <tr>
                      <td colspan="3" style="text-align: center; padding: 24px; color: var(--text-muted);">
                        No requirement matrix generated yet.
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Grounded Factual Match Rationale -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="card" style="padding: 18px; border-left: 4px solid var(--success);">
              <div style="font-size: 13px; font-weight: 700; color: var(--success); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Why this candidate matches the job
              </div>
              <div style="font-size: 13px; color: var(--text-main); line-height: 1.5;">
                ${screening.summary_explanation || "Evaluation based on extracted skills and experience alignment."}
              </div>
            </div>

            <div class="card" style="padding: 18px; border-left: 4px solid var(--warning);">
              <div style="font-size: 13px; font-weight: 700; color: var(--warning); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line></svg>
                What should the recruiter verify?
              </div>
              <div style="font-size: 13px; color: var(--text-main); line-height: 1.5;">
                ${screening.verification_tips || "Confirm practical application depth during technical interview."}
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: AI Insights & Tailored Questions -->
        <div id="tab-ai" class="tab-pane" style="display: none;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <span style="font-size: 13px; color: var(--text-muted);">Grounded NLP analysis & customized interview questions</span>
            <button class="btn btn-outline-primary btn-sm" onclick="CandidateDetailView.generateAIAnalysis(${cand.id})">
              Generate / Refresh AI Insights
            </button>
          </div>

          <div id="ai-insights-content">
            <div class="card" style="margin-bottom: 20px; padding: 20px;">
              <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Executive Candidate Summary</div>
              <p style="font-size: 13px; color: var(--text-main); line-height: 1.5;">
                ${cand.professional_summary !== 'Not detected' ? cand.professional_summary : 'Candidate profile demonstrates relevant software development capabilities.'}
              </p>
            </div>

            <div class="card" style="margin-bottom: 20px; padding: 20px;">
              <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">Suggested Technical Interview Questions</div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${(screening.interview_questions || []).map((q, idx) => `
                  <div style="display: flex; gap: 10px; font-size: 13px; background-color: var(--champagne-light); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--champagne-border); border-left: 3px solid var(--primary);">
                    <b style="color: var(--primary);">${idx + 1}.</b>
                    <span>${q}</span>
                  </div>
                `).join('') || '<div style="color:var(--text-muted); font-size:12px;">No interview questions generated yet. Click Generate AI Insights above.</div>'}
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: Parsed Resume Details -->
        <div id="tab-resume" class="tab-pane" style="display: none;">
          <!-- Skills -->
          <div class="card" style="margin-bottom: 20px; padding: 20px;">
            <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">Extracted Skills Portfolio</div>
            <div style="margin-bottom: 12px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Technical Competencies:</div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${(cand.technical_skills || []).map(s => `<span class="chip chip-tech">${s}</span>`).join('') || '<span style="color:var(--text-light); font-size:12px;">None detected</span>'}
              </div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Soft Skills & Methodologies:</div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${(cand.soft_skills || []).map(s => `<span class="chip chip-soft">${s}</span>`).join('') || '<span style="color:var(--text-light); font-size:12px;">None detected</span>'}
              </div>
            </div>
          </div>

          <!-- Work Experience -->
          <div class="card" style="margin-bottom: 20px; padding: 20px;">
            <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 16px;">Work Experience Timeline</div>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              ${(cand.experiences || []).map(e => `
                <div style="border-left: 2px solid var(--primary); padding-left: 14px;">
                  <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">${e.job_title} &bull; <span style="color: var(--primary); font-weight: 600;">${e.company_name}</span></div>
                  <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">${e.start_date || 'N/A'} - ${e.end_date || 'Present'} ${e.location ? '&bull; ' + e.location : ''}</div>
                  <div style="font-size: 12px; color: var(--text-main); white-space: pre-wrap; line-height: 1.4;">${e.description}</div>
                </div>
              `).join('') || '<div style="color:var(--text-muted); font-size:12px;">No work history parsed.</div>'}
            </div>
          </div>

          <!-- Education & Projects -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="card" style="padding: 20px;">
              <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">Education</div>
              ${(cand.education || []).map(ed => `
                <div style="margin-bottom: 12px;">
                  <div style="font-weight: 700; font-size: 13px;">${ed.degree}</div>
                  <div style="font-size: 12px; color: var(--text-muted);">${ed.institution} ${ed.graduation_year ? '&bull; ' + ed.graduation_year : ''}</div>
                </div>
              `).join('') || '<div style="color:var(--text-muted); font-size:12px;">Not detected</div>'}
            </div>

            <div class="card" style="padding: 20px;">
              <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">Projects & Certifications</div>
              ${(cand.projects || []).map(p => `
                <div style="margin-bottom: 10px;">
                  <div style="font-weight: 700; font-size: 13px;">${p.title}</div>
                  <div style="font-size: 12px; color: var(--text-muted);">${p.description || p.technologies}</div>
                </div>
              `).join('')}
              ${(cand.certifications || []).map(c => `
                <div style="margin-top: 8px; font-size: 12px;">
                  <b>Cert:</b> ${c.name} (${c.issuing_organization})
                </div>
              `).join('')}
              ${(!cand.projects?.length && !cand.certifications?.length) ? '<div style="color:var(--text-muted); font-size:12px;">None detected</div>' : ''}
            </div>
          </div>
        </div>

        <!-- TAB 4: Recruiter Notes & Status Audit History -->
        <div id="tab-notes" class="tab-pane" style="display: none;">
          <div class="card" style="margin-bottom: 20px; padding: 20px;">
            <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">Add Recruiter Note</div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <textarea id="cand-new-note-text" class="form-textarea" placeholder="Enter interview feedback, compensation notes, or hiring thoughts..."></textarea>
              <div style="display: flex; justify-content: flex-end;">
                <button class="btn btn-primary btn-sm" onclick="CandidateDetailView.saveNote(${cand.id})">Save Note</button>
              </div>
            </div>
          </div>

          <!-- Existing Notes -->
          <div style="margin-bottom: 24px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 10px;">Saved Notes (${(cand.notes || []).length})</div>
            <div class="notes-container" id="cand-notes-list">
              ${(cand.notes || []).map(n => `
                <div class="note-item">
                  <div class="note-header">
                    <span>${n.author}</span>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span>${new Date(n.created_at).toLocaleString()}</span>
                      <button class="btn btn-ghost btn-sm" style="color: var(--danger); padding: 0 4px;" onclick="CandidateDetailView.deleteNote(${cand.id}, ${n.id})">&times;</button>
                    </div>
                  </div>
                  <div class="note-body">${n.content}</div>
                </div>
              `).join('') || '<div style="color: var(--text-muted); font-size: 12px;">No recruiter notes added yet.</div>'}
            </div>
          </div>

          <!-- Status Audit History -->
          <div class="card" style="padding: 20px;">
            <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">Status Transition History</div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${(cand.status_history || []).map(sh => `
                <div style="font-size: 12px; padding: 8px 12px; background-color: var(--champagne-light); border-radius: var(--radius-sm); border: 1px solid var(--champagne-border); border-left: 3px solid var(--primary);">
                  <b>${sh.changed_by}</b> changed status to <b>${sh.new_status}</b> ${sh.old_status ? `(from ${sh.old_status})` : ''} on ${new Date(sh.created_at).toLocaleString()}
                  ${sh.note ? `<div style="color: var(--text-muted); margin-top: 2px;">"${sh.note}"</div>` : ''}
                </div>
              `).join('') || '<div style="color: var(--text-muted); font-size: 12px;">No previous status transitions recorded.</div>'}
            </div>
          </div>
        </div>
      </div>
    `;

    // Tab switcher logic
    const tabBtns = container.querySelectorAll('.tab-btn');
    const tabPanes = container.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
      btn.onclick = () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.style.display = 'none');

        btn.classList.add('active');
        const target = btn.getAttribute('data-tab');
        const activePane = container.querySelector(`#${target}`);
        if (activePane) activePane.style.display = 'block';
      };
    });
  },

  async updateStatus(newStatus) {
    if (!this.currentCandidateId) return;
    try {
      const res = await API.updateCandidateStatus(this.currentCandidateId, { status: newStatus });
      App.showToast(res.message, 'success');
      await State.loadCandidates();
    } catch (e) {
      App.showToast(e.message, 'danger');
    }
  },

  async saveNote(candidateId) {
    const textInput = document.getElementById('cand-new-note-text');
    const content = textInput?.value?.trim();
    if (!content) return;

    try {
      await API.addCandidateNote(candidateId, { content, author: 'Recruiter' });
      App.showToast("Note saved successfully.", "success");
      textInput.value = '';
      const updatedCand = await API.getCandidate(candidateId);
      this.renderProfile(document.getElementById('candidate-detail-modal-body'), updatedCand);
      // Switch back to notes tab
      const notesTabBtn = document.querySelector('[data-tab="tab-notes"]');
      if (notesTabBtn) notesTabBtn.click();
    } catch (e) {
      App.showToast(e.message, "danger");
    }
  },

  async deleteNote(candidateId, noteId) {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await API.deleteCandidateNote(candidateId, noteId);
      App.showToast("Note deleted.", "success");
      const updatedCand = await API.getCandidate(candidateId);
      this.renderProfile(document.getElementById('candidate-detail-modal-body'), updatedCand);
      const notesTabBtn = document.querySelector('[data-tab="tab-notes"]');
      if (notesTabBtn) notesTabBtn.click();
    } catch (e) {
      App.showToast(e.message, "danger");
    }
  },

  async generateAIAnalysis(candidateId) {
    const aiContainer = document.getElementById('ai-insights-content');
    if (!aiContainer) return;

    aiContainer.innerHTML = `
      <div style="padding: 32px; text-align: center; color: var(--text-muted);">
        <div class="spinner spinner-primary" style="margin: 0 auto 10px auto;"></div>
        Synthesizing AI evaluation and customized interview questions...
      </div>
    `;

    try {
      const cand = State.activeCandidateDetails;
      const data = await API.getCandidateAIInsights(candidateId, cand.job_id);

      aiContainer.innerHTML = `
        <div class="card" style="margin-bottom: 20px; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">Executive Summary</div>
            <span class="chip chip-tech" style="font-size: 10px;">Powered by ${data.grounded_source || 'NLP Engine'}</span>
          </div>
          <p style="font-size: 13px; color: var(--text-main); line-height: 1.5;">${data.executive_summary}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div class="card" style="padding: 18px; border-left: 3px solid var(--success);">
            <div style="font-size: 13px; font-weight: 700; color: var(--success); margin-bottom: 8px;">Key Strengths</div>
            <ul style="padding-left: 18px; font-size: 13px; line-height: 1.5;">
              ${(data.strengths || []).map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>

          <div class="card" style="padding: 18px; border-left: 3px solid var(--warning);">
            <div style="font-size: 13px; font-weight: 700; color: var(--warning); margin-bottom: 8px;">Growth / Verification Areas</div>
            <ul style="padding-left: 18px; font-size: 13px; line-height: 1.5;">
              ${(data.growth_areas || []).map(g => `<li>${g}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="card" style="padding: 20px;">
          <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">Suggested Tailored Interview Questions</div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${(data.interview_questions || []).map((q, idx) => `
              <div style="display: flex; gap: 10px; font-size: 13px; background-color: var(--champagne-light); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--champagne-border); border-left: 3px solid var(--primary);">
                <b style="color: var(--primary);">${idx + 1}.</b>
                <span>${q}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (e) {
      aiContainer.innerHTML = `<div style="color: var(--danger); padding: 16px;">Failed to generate AI insights: ${e.message}</div>`;
    }
  }
};
