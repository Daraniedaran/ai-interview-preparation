import { Link } from 'react-router-dom'
import { RiErrorWarningLine, RiHomeLine } from 'react-icons/ri'

const NotFoundPage = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-4 px-6">
    <RiErrorWarningLine className="text-6xl text-gray-300" />
    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">404</h1>
    <p className="text-gray-500 dark:text-gray-400 max-w-md">
      The page you are looking for does not exist or was moved.
    </p>
    <div className="flex gap-3">
      <Link to="/dashboard" className="btn-primary">
        <RiHomeLine /> Go to Dashboard
      </Link>
      <Link to="/" className="btn-secondary">
        Landing Page
      </Link>
    </div>
  </div>
)

export default NotFoundPage
