/**
 * API Client for Resume Screening Assistant
 * Handles Auth, Jobs, Applications, Screening, and Admin endpoints.
 */
const API = {
  async get(endpoint, params = {}) {
    const url = new URL(endpoint, window.location.origin);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error occurred.' }));
      throw new Error(err.error || `HTTP Error ${res.status}`);
    }
    return res.json();
  },

  async post(endpoint, data = {}) {
    const isFormData = data instanceof FormData;
    const options = {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data)
    };
    if (!isFormData) {
      options.headers = { 'Content-Type': 'application/json' };
    }
    const res = await fetch(endpoint, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed.' }));
      throw new Error(err.error || `HTTP Error ${res.status}`);
    }
    return res.json();
  },

  async put(endpoint, data = {}) {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Update failed.' }));
      throw new Error(err.error || `HTTP Error ${res.status}`);
    }
    return res.json();
  },

  async delete(endpoint) {
    const res = await fetch(endpoint, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Delete failed.' }));
      throw new Error(err.error || `HTTP Error ${res.status}`);
    }
    return res.json();
  },

  // Auth Endpoints
  register: (data) => API.post('/api/auth/register', data),
  login: (data) => API.post('/api/auth/login', data),
  getMe: () => API.get('/api/auth/me'),
  logout: () => API.post('/api/auth/logout'),

  // Jobs Endpoints
  getJobs: (params) => API.get('/api/jobs', params),
  getJob: (id) => API.get(`/api/jobs/${id}`),
  createJob: (data) => API.post('/api/jobs', data),
  updateJob: (id, data) => API.put(`/api/jobs/${id}`, data),
  deleteJob: (id) => API.delete(`/api/jobs/${id}`),
  previewJobNLP: (data) => API.post('/api/jobs/analyze-preview', data),

  // Applications & Candidate Pipeline Endpoints
  applyJob: (formData) => API.post('/api/applications/apply', formData),
  getMyApplications: () => API.get('/api/applications/my'),
  getApplication: (id) => API.get(`/api/applications/${id}`),
  getJobApplications: (jobId, params) => API.get(`/api/applications/job/${jobId}`, params),
  getAllApplications: (params) => API.get('/api/applications', params),
  updateApplicationStatus: (id, status, note = '') => API.put(`/api/applications/${id}/status`, { status, note }),
  addApplicationNote: (id, content) => API.post(`/api/applications/${id}/notes`, { content }),
  getResumeDownloadUrl: (appId) => `/api/applications/${appId}/resume/download`,

  // Screening & AI Insights
  runScreening: (data) => API.post('/api/screening/run', data),
  getScreeningMatrix: (candidateId) => API.get(`/api/screening/matrix/${candidateId}`),
  compareCandidates: (data) => API.post('/api/screening/compare', data),

  // Legacy Candidate endpoints (for backwards compatibility)
  getCandidates: (params) => API.get('/api/candidates', params),
  getCandidate: (id) => API.get(`/api/candidates/${id}`),
  updateCandidateStatus: (id, data) => API.put(`/api/candidates/${id}/status`, data),
  addCandidateNote: (id, data) => API.post(`/api/candidates/${id}/notes`, data),
  deleteCandidateNote: (candId, noteId) => API.delete(`/api/candidates/${candId}/notes/${noteId}`),
  deleteCandidate: (id) => API.delete(`/api/candidates/${id}`),

  // Reports
  getAnalytics: (jobId) => API.get('/api/reports/analytics', { job_id: jobId }),

  // Settings & Scoring Weights
  getSettings: () => API.get('/api/settings'),
  updateWeights: (weights) => API.put('/api/settings/weights', { weights }),
  resetWeights: () => API.post('/api/settings/weights/reset'),
  seedDemoData: () => API.post('/api/settings/demo/seed'),
  clearDemoData: () => API.post('/api/settings/demo/clear'),

  // Activity Logs
  getActivity: (limit = 20) => API.get('/api/activity', { limit })
};
