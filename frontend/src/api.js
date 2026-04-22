import { request, commonApi } from '@shared/api-base'

export const api = {
  ...commonApi,

  // Frontend-specific overrides with offline support
  async createJob(job) {
    if (!navigator.onLine) {
      const { addToSyncQueue } = await import('./offlineStorage')
      await addToSyncQueue({ type: 'CREATE_JOB', data: job })
      return { ...job, id: Date.now(), status: 'scheduled' }
    }
    return request('/jobs', { method: 'POST', body: JSON.stringify(job) })
  },
  async updateJob(id, job) {
    if (!navigator.onLine) {
      const { addToSyncQueue } = await import('./offlineStorage')
      await addToSyncQueue({ type: 'UPDATE_JOB', jobId: id, data: job })
      return { ...job, id }
    }
    return request(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(job) })
  },
  async deleteJob(id) {
    if (!navigator.onLine) {
      const { addToSyncQueue } = await import('./offlineStorage')
      await addToSyncQueue({ type: 'DELETE_JOB', jobId: id })
      return { status: 'queued' }
    }
    return request(`/jobs/${id}`, { method: 'DELETE' })
  },

  // Frontend-only endpoints
  async getDashboardStats() {
    return request('/dashboard/stats')
  },
  async resetDashboardStats() {
    return request('/dashboard/reset-stats', { method: 'POST' })
  },
  async getTodayJobs(offset = 0, limit = 50) {
    return request(`/jobs/today?offset=${offset}&limit=${limit}`)
  },
  async getJobs(status, offset = 0, limit = 50) {
    let url = `/jobs?offset=${offset}&limit=${limit}`
    if (status) url += `&status_filter=${status}`
    return request(url)
  },
  async getJob(id) {
    return request(`/jobs/${id}`)
  },
  async getRouteOptimize(dateStr) {
    return request(`/jobs/route/optimize?date_str=${dateStr}`)
  },
  async getVapidPublic() {
    return request('/push/vapid-public')
  },
  async pushSubscribe(subscription) {
    return request('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      }),
    })
  },
}
