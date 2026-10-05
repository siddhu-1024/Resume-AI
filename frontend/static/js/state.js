/**
 * Central Reactive State Store for Resume Screening Assistant
 */
const State = {
  currentUser: null,
  isAuthenticated: false,
  currentRole: 'guest', // 'guest', 'candidate', 'admin'
  currentView: 'home',
  currentJobId: 'all',
  
  jobs: [],
  myApplications: [],
  adminApplications: [],
  activeJobDetails: null,
  activeApplicationDetails: null,
  
  searchQuery: '',
  filterStatus: 'all',
  
  listeners: {},

  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  notify(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  },

  async checkAuth() {
    try {
      const res = await API.getMe();
      if (res.authenticated && res.user) {
        this.setUser(res.user);
      } else {
        this.setUser(null);
      }
    } catch (e) {
      console.warn("Auth check failed:", e);
      this.setUser(null);
    }
  },

  setUser(user) {
    this.currentUser = user;
    this.isAuthenticated = !!user;
    this.currentRole = user ? user.role : 'guest';
    this.notify('authChanged', {
      user: this.currentUser,
      isAuthenticated: this.isAuthenticated,
      role: this.currentRole
    });
  },

  async logout() {
    try {
      await API.logout();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      this.setUser(null);
      this.myApplications = [];
      this.adminApplications = [];
      this.notify('loggedOut', null);
    }
  },

  setJob(jobId) {
    this.currentJobId = jobId;
    this.notify('jobChanged', jobId);
  },

  async loadJobs(params = {}) {
    try {
      const data = await API.getJobs(params);
      this.jobs = data.jobs || [];
      this.notify('jobsLoaded', this.jobs);
      return this.jobs;
    } catch (e) {
      console.error("Failed to load jobs:", e);
      return [];
    }
  },

  async loadMyApplications() {
    if (!this.isAuthenticated || this.currentRole !== 'candidate') {
      this.myApplications = [];
      return [];
    }
    try {
      const data = await API.getMyApplications();
      this.myApplications = data.applications || [];
      this.notify('myApplicationsLoaded', this.myApplications);
      return this.myApplications;
    } catch (e) {
      console.error("Failed to load candidate applications:", e);
      return [];
    }
  },

  async loadAdminApplications(filters = {}) {
    if (!this.isAuthenticated || this.currentRole !== 'admin') {
      this.adminApplications = [];
      return [];
    }
    try {
      const params = { ...filters };
      if (this.currentJobId && this.currentJobId !== 'all') {
        params.job_id = this.currentJobId;
      }
      if (this.filterStatus && this.filterStatus !== 'all') {
        params.status = this.filterStatus;
      }
      if (this.searchQuery) {
        params.search = this.searchQuery;
      }
      const data = await API.getAllApplications(params);
      this.adminApplications = data.applications || [];
      this.notify('adminApplicationsLoaded', this.adminApplications);
      return this.adminApplications;
    } catch (e) {
      console.error("Failed to load admin applications:", e);
      return [];
    }
  }
};
