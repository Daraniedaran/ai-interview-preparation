import { 
  RiFileChartLine, 
  RiDownloadCloudLine, 
  RiPieChartLine, 
  RiLineChartLine,
  RiCheckDoubleLine
} from 'react-icons/ri'
import toast from 'react-hot-toast'

const AdminReportsPage = () => {
  const handleExport = (reportName) => {
    toast.success(`${reportName} downloaded successfully!`)
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <RiFileChartLine className="text-primary-600" /> Platform Reports & Analytics Export
        </h1>
        <p className="page-subtitle">Export student placement readiness stats, test scores, and performance summaries</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center text-2xl">
              <RiPieChartLine />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Overall Student Readiness Report</h3>
            <p className="text-xs text-gray-500">Includes comprehensive score distributions across Aptitude, Coding, and AI Mock Interviews.</p>
          </div>
          <button onClick={() => handleExport('Student Readiness Report (CSV)')} className="btn btn-primary w-full">
            <RiDownloadCloudLine /> Download CSV Report
          </button>
        </div>

        <div className="card space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 text-success-600 flex items-center justify-center text-2xl">
              <RiLineChartLine />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Coding Submissions Analytics</h3>
            <p className="text-xs text-gray-500">Breakdown of problem solve rates, Judge0 API performance metrics, and top student coders.</p>
          </div>
          <button onClick={() => handleExport('Coding Submissions Report (PDF)')} className="btn btn-secondary w-full">
            <RiDownloadCloudLine /> Export PDF Summary
          </button>
        </div>

        <div className="card space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center text-2xl">
              <RiCheckDoubleLine />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Company Wise Interview Summary</h3>
            <p className="text-xs text-gray-500">Detailed stats on mock interview clear rates per target company profile.</p>
          </div>
          <button onClick={() => handleExport('Company Summary Report (CSV)')} className="btn btn-secondary w-full">
            <RiDownloadCloudLine /> Download CSV
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminReportsPage
