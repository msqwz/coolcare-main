export function validatePhone(phone) {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  return /^\+?[0-9]{10,15}$/.test(cleaned)
}

export function formatPhone(phone) {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('8')) return '+7' + cleaned.slice(1)
  if (cleaned.startsWith('7')) return '+' + cleaned
  return cleaned
}

/** Конвертирует ISO/datetime строку в формат для datetime-local input */
export function toLocalDatetime(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}
