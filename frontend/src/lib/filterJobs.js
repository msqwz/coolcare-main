import { JOB_TYPE_LIST } from '../constants'

/**
 * Фильтрует заявки по поиску, статусу и типу
 * @param {Array} jobs - список заявок
 * @param {{ search?: string, status?: string, jobType?: string }} filters
 */
export function filterJobs(jobs, { search = '', status = '', jobType = '' }) {
  return jobs.filter((job) => {
    if (status && job.status !== status) return false
    if (jobType && job.job_type !== jobType) return false
    if (!search || !search.trim()) return true
    const q = search.trim().toLowerCase()
    const customer = (job.customer_name || '').toLowerCase()
    const address = (job.address || '').toLowerCase()
    const typeLabel = JOB_TYPE_LIST.find((t) => t.key === job.job_type)?.label?.toLowerCase() || ''
    const description = (job.description || '').toLowerCase()
    const notes = (job.notes || '').toLowerCase()
    return (
      customer.includes(q) ||
      address.includes(q) ||
      typeLabel.includes(q) ||
      description.includes(q) ||
      notes.includes(q)
    )
  })
}
