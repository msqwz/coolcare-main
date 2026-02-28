import { request, commonApi } from '@shared/api-base'

export const api = {
  async request(endpoint, options = {}) {
    return request(endpoint, options)
  },
  ...commonApi,
  async getDashboardStats() {
    return this.request('/dashboard/stats')
  },
  async resetDashboardStats() {
    return this.request('/dashboard/reset-stats', { method: 'POST' })
  },
  async getTodayJobs() {
    return this.request('/jobs/today')
  },
  async getJobs(status) {
    return this.request(`/jobs${status ? '?status=' + status : ''}`)
  },
  async getJob(id) {
    return this.request(`/jobs/${id}`)
  },
  async createJob(job) {
    if (!navigator.onLine) {
      const { addToSyncQueue } = await import('./offlineStorage')
      await addToSyncQueue({ type: 'CREATE_JOB', data: job })
      return { ...job, id: Date.now(), status: 'scheduled' } // fake id for UI
    }
    return this.request('/jobs', { method: 'POST', body: JSON.stringify(job) })
  },
  async updateJob(id, job) {
    if (!navigator.onLine) {
      const { addToSyncQueue } = await import('./offlineStorage')
      await addToSyncQueue({ type: 'UPDATE_JOB', jobId: id, data: job })
      return { ...job, id }
    }
    return this.request(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(job) })
  },
  async deleteJob(id) {
    if (!navigator.onLine) {
      const { addToSyncQueue } = await import('./offlineStorage')
      await addToSyncQueue({ type: 'DELETE_JOB', jobId: id })
      return { status: 'queued' }
    }
    return this.request(`/jobs/${id}`, { method: 'DELETE' })
  },
  async getRouteOptimize(date) {
    return this.request(`/jobs/route/optimize?date=${date}`)
  },
  async getVapidPublic() {
    return this.request('/push/vapid-public')
  },
  async pushSubscribe(subscription) {
    return this.request('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      }),
    })
  },
}
