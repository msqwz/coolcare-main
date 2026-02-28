const API_URL =
    import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost')
        ? import.meta.env.VITE_API_URL
        : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : window.location.origin

export const api = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('access_token')
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        }
        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers })
        if (response.status === 401) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            window.location.href = '/admin/login'
            throw new Error('Unauthorized')
        }
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Request failed' }))
            throw new Error(error.detail || 'Request failed')
        }
        return response.json()
    },

    // Auth
    async sendCode(phone) {
        return this.request('/auth/send-code', { method: 'POST', body: JSON.stringify({ phone }) })
    },
    async verifyCode(phone, code) {
        return this.request('/auth/verify-code', {
            method: 'POST',
            body: JSON.stringify({ phone, code }),
        })
    },
    async getCurrentUser() {
        return this.request('/auth/me')
    },

    // Admin Specific
    async getAllJobs() {
        return this.request('/admin/jobs')
    },
    async getAdminStats() {
        return this.request('/admin/stats')
    },

    // Shared Job Actions
    async updateJob(id, job) {
        return this.request(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(job) })
    },
    async deleteJob(id) {
        return this.request(`/jobs/${id}`, { method: 'DELETE' })
    },

    // Admin Job Actions
    async adminUpdateJob(id, job) {
        return this.request(`/admin/jobs/${id}`, { method: 'PUT', body: JSON.stringify(job) })
    },
    async adminDeleteJob(id) {
        return this.request(`/admin/jobs/${id}`, { method: 'DELETE' })
    },
    async adminCreateJob(job) {
        return this.request('/admin/jobs', { method: 'POST', body: JSON.stringify(job) })
    },

    // Workers Management
    async getWorkers() {
        return this.request('/admin/users')
    },
    async updateWorker(id, data) {
        return this.request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    }
}
