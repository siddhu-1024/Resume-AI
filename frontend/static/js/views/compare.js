/**
 * Candidate Comparison View / Modal
 */
const CompareView = {
  async open() {
    const candidateIds = Array.from(State.selectedCandidateIdsForCompare);
    if (candidateIds.length < 2) {
      App.showToast("Please select at least 2 candidates using the checkboxes to compare.", "warning");
      return;
    }

    const modal = document.getElementById('modal-compare-candidates');
    const body = document.getElementById('compare-modal-body');

    body.innerHTML = `
      <div style="padding: 48px; text-align: center; color: var(--text-muted);">
        <div class="spinner spinner-primary" style="margin: 0 auto 10px auto;"></div>
        Building side-by-side qualification comparison matrix...
      </div>
    `;

    modal.classList.add('active');

    try {
      const res = await API.compareCandidates({
        candidate_ids: candidateIds,
        job_id: State.currentJobId !== 'all' ? State.currentJobId : null
      });

      const candidates = res.candidates || [];
      const job = res.job;

      body.innerHTML = `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">
            Comparing ${candidates.length} Candidate(s) for Position: <span style="color: var(--primary);">${job ? job.title : 'General Qualification'}</span>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
            Objective side-by-side dimension evaluation to support recruitment decision-making.
          </div>
        </div>

        <div style="overflow-x: auto; border: 1.5px solid var(--champagne-border); border-radius: var(--radius-lg); background: var(--bg-surface);">
          <table class="data-table" style="font-size: 13px;">
            <thead>
              <tr style="background-color: var(--champagne-light);">
                <th style="width: 160px; font-weight: 700; color: var(--deep-emerald);">Dimension</th>
                ${candidates.map(c => `
                  <th style="min-width: 200px; text-align: left;">
                    <div style="font-size: 14px; font-weight: 800; color: var(--text-heading);">${c.name}</div>
                    <div style="font-size: 11px; color: var(--text-muted); font-weight: 500;">Status: <b>${c.status}</b></div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 700; background: var(--champagne-light); color: var(--deep-emerald);">Job Requirement Match</td>
                ${candidates.map(c => {
                  const score = c.match_score ?? 0;
                  const scoreClass = score >= 80 ? 'high' : (score >= 60 ? 'medium' : 'low');
                  return `<td><span class="score-pill ${scoreClass}">${score.toFixed(1)}% Match</span></td>`;
                }).join('')}
              </tr>

              <tr>
                <td style="font-weight: 700; background: var(--champagne-light); color: var(--deep-emerald);">Relevant Experience</td>
                ${candidates.map(c => `<td><b>${c.experience_years} Years</b> detected</td>`).join('')}
              </tr>

              <tr>
                <td style="font-weight: 700; background: var(--champagne-light); color: var(--deep-emerald);">Education</td>
                ${candidates.map(c => `<td>${c.highest_education}</td>`).join('')}
              </tr>

              <tr>
                <td style="font-weight: 700; background: var(--champagne-light); color: var(--deep-emerald);">Matched Core Requirements</td>
                ${candidates.map(c => `
                  <td>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                      ${(c.matched_requirements || []).map(s => `<span class="chip chip-matched">${s}</span>`).join('') || '<span style="font-size:11px; color:var(--text-light);">None</span>'}
                    </div>
                  </td>
                `).join('')}
              </tr>

              <tr>
                <td style="font-weight: 700; background: var(--champagne-light); color: var(--deep-emerald);">Missing / Not Detected</td>
                ${candidates.map(c => `
                  <td>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                      ${(c.missing_requirements || []).map(s => `<span class="chip chip-missing">${s}</span>`).join('') || '<span style="font-size:11px; color:var(--text-light);">None</span>'}
                    </div>
                  </td>
                `).join('')}
              </tr>

              <tr>
                <td style="font-weight: 700; background: var(--champagne-light); color: var(--deep-emerald);">Top Technical Skills</td>
                ${candidates.map(c => `
                  <td>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                      ${(c.top_skills || []).map(s => `<span class="chip chip-tech">${s}</span>`).join('')}
                    </div>
                  </td>
                `).join('')}
              </tr>

              <tr>
                <td style="font-weight: 700; background: var(--champagne-light); color: var(--deep-emerald);">Projects & Certifications</td>
                ${candidates.map(c => `
                  <td>
                    <div><b>${c.projects_count}</b> project(s)</div>
                    <div><b>${c.certifications_count}</b> certification(s)</div>
                  </td>
                `).join('')}
              </tr>

              <tr>
                <td style="font-weight: 700; background: var(--champagne-light); color: var(--deep-emerald);">Screening Summary</td>
                ${candidates.map(c => `
                  <td style="font-size: 12px; line-height: 1.4; color: var(--text-main);">
                    ${c.summary_explanation}
                  </td>
                `).join('')}
              </tr>

              <tr>
                <td style="font-weight: 700; background: var(--champagne-light); color: var(--deep-emerald);">Actions</td>
                ${candidates.map(c => `
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="App.closeAllModals(); CandidateDetailView.open(${c.id});">View Profile</button>
                  </td>
                `).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      `;

    } catch (e) {
      body.innerHTML = `<div style="color: var(--danger); padding: 24px;">Failed to compare candidates: ${e.message}</div>`;
    }
  }
};
