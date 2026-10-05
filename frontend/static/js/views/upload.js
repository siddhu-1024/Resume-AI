/**
 * Resume Upload & Batch Ingestion
 */
const UploadView = {
  selectedFiles: [],

  initModal() {
    const dropzone = document.getElementById('resume-dropzone');
    const fileInput = document.getElementById('resume-file-input');
    const startBtn = document.getElementById('btn-start-upload');
    const targetJobSelect = document.getElementById('upload-target-job');

    if (!dropzone || !fileInput) return;

    // Populate Job Openings dropdown
    this.populateJobsDropdown();

    dropzone.onclick = () => fileInput.click();

    dropzone.ondragover = (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    };

    dropzone.ondragleave = () => {
      dropzone.classList.remove('dragover');
    };

    dropzone.ondrop = (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.handleFiles(Array.from(e.dataTransfer.files));
      }
    };

    fileInput.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleFiles(Array.from(e.target.files));
      }
    };

    startBtn.onclick = () => this.performUpload();
  },

  populateJobsDropdown() {
    const select = document.getElementById('upload-target-job');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select Target Job Position --</option>' +
      State.jobs.map(j => `
        <option value="${j.id}" ${State.currentJobId == j.id ? 'selected' : ''}>${j.title} (${j.department})</option>
      `).join('');
  },

  handleFiles(files) {
    const validExtensions = ['.pdf', '.docx'];
    const validFiles = files.filter(f => {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      return validExtensions.includes(ext);
    });

    if (validFiles.length < files.length) {
      App.showToast("Some files were skipped. Only PDF and DOCX documents are accepted.", "warning");
    }

    this.selectedFiles = [...this.selectedFiles, ...validFiles];
    this.renderQueue();
  },

  renderQueue() {
    const container = document.getElementById('upload-queue-container');
    const queueList = document.getElementById('upload-file-queue');
    const countSpan = document.getElementById('queue-count');
    const startBtn = document.getElementById('btn-start-upload');

    if (!container || !queueList) return;

    if (this.selectedFiles.length === 0) {
      container.style.display = 'none';
      startBtn.disabled = true;
      return;
    }

    container.style.display = 'block';
    countSpan.textContent = this.selectedFiles.length;
    startBtn.disabled = false;

    queueList.innerHTML = this.selectedFiles.map((f, i) => `
      <div class="upload-file-item">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          <span style="font-weight: 600; color: var(--text-main);">${f.name}</span>
          <span style="color: var(--text-muted); font-size: 11px;">(${(f.size / 1024).toFixed(1)} KB)</span>
        </div>
        <button class="btn btn-ghost btn-sm" style="color: var(--danger); padding: 2px 6px;" onclick="UploadView.removeFile(${i})">&times;</button>
      </div>
    `).join('');
  },

  removeFile(index) {
    this.selectedFiles.splice(index, 1);
    this.renderQueue();
  },

  async performUpload() {
    const jobId = document.getElementById('upload-target-job')?.value;
    if (!jobId) {
      App.showToast("Please select a target job opening to screen against.", "warning");
      return;
    }

    if (this.selectedFiles.length === 0) {
      App.showToast("Please select at least one resume file to upload.", "warning");
      return;
    }

    const startBtn = document.getElementById('btn-start-upload');
    const progressBox = document.getElementById('upload-progress-box');
    const progressBar = document.getElementById('upload-progress-bar');
    const percentText = document.getElementById('upload-percent');

    startBtn.disabled = true;
    progressBox.style.display = 'block';
    progressBar.style.width = '30%';
    percentText.textContent = '30%';

    try {
      const formData = new FormData();
      formData.append('job_id', jobId);
      this.selectedFiles.forEach(f => {
        formData.append('files[]', f);
      });

      progressBar.style.width = '70%';
      percentText.textContent = '70%';

      const res = await API.uploadResumes(formData);

      progressBar.style.width = '100%';
      percentText.textContent = '100%';

      const successCount = res.results.filter(r => r.status === 'success').length;
      const failedCount = res.results.filter(r => r.status === 'failed').length;

      if (successCount > 0) {
        App.showToast(`Successfully parsed and screened ${successCount} resume(s)!`, "success");
      }
      if (failedCount > 0) {
        App.showToast(`${failedCount} file(s) failed validation.`, "warning");
      }

      // Reset and close modal
      this.selectedFiles = [];
      this.renderQueue();
      progressBox.style.display = 'none';
      App.closeAllModals();

      // Set current job and route to screening view
      State.setJob(jobId);
      await State.loadCandidates();
      App.navigate('screening');

    } catch (e) {
      App.showToast(e.message, "danger");
      progressBox.style.display = 'none';
      startBtn.disabled = false;
    }
  }
};
