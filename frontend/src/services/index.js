import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  login: (data) => api.post('/auth/login', data).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }).then(r => r.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, new_password: newPassword }).then(r => r.data),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }).then(r => r.data),
  changePassword: (data) => api.post('/auth/change-password', data).then(r => r.data),
  resendVerification: () => api.post('/auth/resend-verification').then(r => r.data),
}

export const userService = {
  getMe: () => api.get('/users/me').then(r => r.data),
  updateMe: (data) => api.put('/users/me', data).then(r => r.data),
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
  getMyProfile: () => api.get('/users/me/profile').then(r => r.data),
  updateProfile: (data) => api.put('/users/me/profile', data).then(r => r.data),
  addEducation: (data) => api.post('/users/me/education', data).then(r => r.data),
  deleteEducation: (id) => api.delete(`/users/me/education/${id}`).then(r => r.data),
  addExperience: (data) => api.post('/users/me/experience', data).then(r => r.data),
  deleteExperience: (id) => api.delete(`/users/me/experience/${id}`).then(r => r.data),
  addProject: (data) => api.post('/users/me/projects', data).then(r => r.data),
  deleteProject: (id) => api.delete(`/users/me/projects/${id}`).then(r => r.data),
  addSkill: (data) => api.post('/users/me/skills', data).then(r => r.data),
  deleteSkill: (id) => api.delete(`/users/me/skills/${id}`).then(r => r.data),
}

export const resumeService = {
  uploadResume: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/resume/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 minutes for AI processing
    }).then(r => r.data)
  },
  getReviews: () => api.get('/resume/reviews').then(r => r.data),
  getReviewDetail: (id) => api.get(`/resume/reviews/${id}`).then(r => r.data),
  downloadReviewPDF: (id) => api.get(`/resume/reviews/${id}/download`, { responseType: 'blob' }).then(r => r.data),
}

export const questionService = {
  list: (params) => api.get('/questions/', { params }).then(r => r.data),
  getById: (id) => api.get(`/questions/${id}`).then(r => r.data),
  getCategories: () => api.get('/questions/categories').then(r => r.data),
  getRandom: (params) => api.get('/questions/random', { params }).then(r => r.data),
  toggleBookmark: (id) => api.post(`/questions/${id}/bookmark`).then(r => r.data),
  getBookmarks: () => api.get('/questions/bookmarks/me').then(r => r.data),
  create: (data) => api.post('/questions/', data).then(r => r.data),
  update: (id, data) => api.put(`/questions/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/questions/${id}`).then(r => r.data),
}

export const codingService = {
  list: (params) => api.get('/coding/', { params }).then(r => r.data),
  getById: (id) => api.get(`/coding/${id}`).then(r => r.data),
  getCategories: () => api.get('/coding/categories').then(r => r.data),
  run: (data) => api.post('/coding/run', data, { timeout: 30000 }).then(r => r.data),
  submit: (data) => api.post('/coding/submit', data, { timeout: 60000 }).then(r => r.data),
  getHint: (data) => api.post('/coding/hint', data).then(r => r.data),
  getMySubmissions: (questionId) => api.get('/coding/submissions/me', { params: { question_id: questionId } }).then(r => r.data),
  create: (data) => api.post('/coding/', data).then(r => r.data),
  update: (id, data) => api.put(`/coding/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/coding/${id}`).then(r => r.data),
}

export const aptitudeService = {
  getCategories: () => api.get('/aptitude/categories').then(r => r.data),
  listTests: (params) => api.get('/aptitude/tests', { params }).then(r => r.data),
  startTest: (testId) => api.post(`/aptitude/tests/${testId}/start`).then(r => r.data),
  submitTest: (attemptId, answers) => api.post(`/aptitude/attempts/${attemptId}/submit`, answers).then(r => r.data),
  getMyAttempts: () => api.get('/aptitude/attempts/me').then(r => r.data),
}

export const interviewService = {
  start: (data) => api.post('/interviews/start', data).then(r => r.data),
  submitAnswer: (data) => api.post('/interviews/answer', data, { timeout: 60000 }).then(r => r.data),
  getMyInterviews: () => api.get('/interviews/me').then(r => r.data),
  getById: (id) => api.get(`/interviews/${id}`).then(r => r.data),
  downloadReport: (id) => api.get(`/interviews/${id}/download-report`, { responseType: 'blob' }).then(r => r.data),
}

export const companyService = {
  list: (params) => api.get('/companies/', { params }).then(r => r.data),
  getBySlug: (slug) => api.get(`/companies/${slug}`).then(r => r.data),
  create: (data) => api.post('/companies/', data).then(r => r.data),
  update: (id, data) => api.put(`/companies/${id}`, data).then(r => r.data),
}

export const leaderboardService = {
  global: (params) => api.get('/leaderboard/global', { params }).then(r => r.data),
  weekly: (params) => api.get('/leaderboard/weekly', { params }).then(r => r.data),
  monthly: (params) => api.get('/leaderboard/monthly', { params }).then(r => r.data),
  college: (college) => api.get('/leaderboard/college', { params: { college } }).then(r => r.data),
}

export const notificationService = {
  list: (params) => api.get('/notifications/', { params }).then(r => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then(r => r.data),
  delete: (id) => api.delete(`/notifications/${id}`).then(r => r.data),
}

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats').then(r => r.data),
  getActivity: (days) => api.get('/dashboard/activity', { params: { days } }).then(r => r.data),
  getPerformanceCharts: () => api.get('/dashboard/performance-charts').then(r => r.data),
  getRecentActivity: (limit) => api.get('/dashboard/recent-activity', { params: { limit } }).then(r => r.data),
}

export const adminService = {
  getStats: () => api.get('/admin/stats').then(r => r.data),
  listUsers: (params) => api.get('/admin/users', { params }).then(r => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then(r => r.data),
  getQuestionStats: () => api.get('/admin/questions/stats').then(r => r.data),
  getRecentSubmissions: (limit) => api.get('/admin/submissions/recent', { params: { limit } }).then(r => r.data),
  getInterviewStats: () => api.get('/admin/interviews/stats').then(r => r.data),
  listInterviews: (params) => api.get('/admin/interviews', { params }).then(r => r.data),
  toggleUserActive: (id) => api.patch(`/users/${id}/toggle-active`).then(r => r.data),
}

export const flashcardService = {
  list: (params) => api.get('/flashcards', { params }).then(r => r.data),
  getTopics: () => api.get('/flashcards/topics').then(r => r.data),
  create: (data) => api.post('/flashcards', data).then(r => r.data),
  update: (id, data) => api.put(`/flashcards/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/flashcards/${id}`).then(r => r.data),
  review: (id) => api.patch(`/flashcards/${id}/review`).then(r => r.data),
  toggleMastered: (id) => api.patch(`/flashcards/${id}/master`).then(r => r.data),
}

export const noteService = {
  list: (params) => api.get('/notes', { params }).then(r => r.data),
  getTopics: () => api.get('/notes/topics').then(r => r.data),
  getById: (id) => api.get(`/notes/${id}`).then(r => r.data),
  create: (data) => api.post('/notes', data).then(r => r.data),
  update: (id, data) => api.put(`/notes/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/notes/${id}`).then(r => r.data),
  togglePin: (id) => api.patch(`/notes/${id}/pin`).then(r => r.data),
}

export const discussionService = {
  listPosts: (params) => api.get('/discussion/posts', { params }).then(r => r.data),
  getPost: (id) => api.get(`/discussion/posts/${id}`).then(r => r.data),
  createPost: (data) => api.post('/discussion/posts', data).then(r => r.data),
  deletePost: (id) => api.delete(`/discussion/posts/${id}`).then(r => r.data),
  likePost: (id) => api.post(`/discussion/posts/${id}/like`).then(r => r.data),
  toggleSolved: (id) => api.patch(`/discussion/posts/${id}/solve`).then(r => r.data),
  addComment: (postId, data) => api.post(`/discussion/posts/${postId}/comments`, data).then(r => r.data),
  deleteComment: (id) => api.delete(`/discussion/comments/${id}`).then(r => r.data),
}

export const studyPlannerService = {
  listTasks: (params) => api.get('/study-planner/tasks', { params }).then(r => r.data),
  createTask: (data) => api.post('/study-planner/tasks', data).then(r => r.data),
  updateTask: (id, data) => api.put(`/study-planner/tasks/${id}`, data).then(r => r.data),
  toggleTask: (id) => api.patch(`/study-planner/tasks/${id}/toggle`).then(r => r.data),
  deleteTask: (id) => api.delete(`/study-planner/tasks/${id}`).then(r => r.data),
  getStats: () => api.get('/study-planner/stats').then(r => r.data),
}
