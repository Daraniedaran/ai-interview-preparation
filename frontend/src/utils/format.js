export const formatDate = (iso, opts) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, opts || { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

export const formatScore = (v, suffix = '') => {
  if (typeof v !== 'number' || Number.isNaN(v)) return '—'
  return `${Math.round(v)}${suffix}`
}

export const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
