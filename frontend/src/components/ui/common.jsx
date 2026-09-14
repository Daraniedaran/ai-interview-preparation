export const Button = ({ variant = 'primary', size = 'md', className = '', ...props }) => {
  const base = variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : 'btn-secondary'
  return <button className={`${base} ${size === 'sm' ? 'btn-sm' : ''} ${className}`} {...props} />
}

export const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="card max-w-lg w-full space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-dark-700">
        <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
        <button onClick={onClose} className="btn-icon">✕</button>
      </div>
      {children}
    </div>
  </div>
)

export const EmptyState = ({ icon, title = 'Nothing here yet', subtitle = '' }) => (
  <div className="card text-center py-12 text-gray-400">
    {icon && <div className="text-5xl mx-auto mb-2 opacity-30">{icon}</div>}
    <p className="font-semibold text-gray-600 dark:text-gray-300">{title}</p>
    {subtitle && <p className="text-xs mt-1">{subtitle}</p>}
  </div>
)

export const Spinner = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    <p className="text-xs">{label}</p>
  </div>
)
