import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Suspense, lazy } from 'react'

// Layout
import MainLayout from './components/layout/MainLayout'
import AdminLayout from './components/layout/AdminLayout'
import AuthLayout from './components/layout/AuthLayout'
import LoadingScreen from './components/ui/LoadingScreen'

// Public Pages (eager loaded)
import LandingPage from './pages/public/LandingPage'
import NotFoundPage from './pages/public/NotFoundPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'

// Student Pages (lazy loaded)
const DashboardPage = lazy(() => import('./pages/student/DashboardPage'))
const ProfilePage = lazy(() => import('./pages/student/ProfilePage'))
const ResumePage = lazy(() => import('./pages/student/ResumePage'))
const AptitudePage = lazy(() => import('./pages/student/AptitudePage'))
const AptitudeTestPage = lazy(() => import('./pages/student/AptitudeTestPage'))
const CodingPage = lazy(() => import('./pages/student/CodingPage'))
const CodeEditorPage = lazy(() => import('./pages/student/CodeEditorPage'))
const InterviewPage = lazy(() => import('./pages/student/InterviewPage'))
const InterviewSessionPage = lazy(() => import('./pages/student/InterviewSessionPage'))
const InterviewReportPage = lazy(() => import('./pages/student/InterviewReportPage'))
const CompaniesPage = lazy(() => import('./pages/student/CompaniesPage'))
const CompanyDetailPage = lazy(() => import('./pages/student/CompanyDetailPage'))
const QuestionsPage = lazy(() => import('./pages/student/QuestionsPage'))
const LeaderboardPage = lazy(() => import('./pages/student/LeaderboardPage'))
const ProgressPage = lazy(() => import('./pages/student/ProgressPage'))
const AchievementsPage = lazy(() => import('./pages/student/AchievementsPage'))
const NotificationsPage = lazy(() => import('./pages/student/NotificationsPage'))
const FlashcardsPage = lazy(() => import('./pages/student/FlashcardsPage'))
const NotesPage = lazy(() => import('./pages/student/NotesPage'))
const DiscussionPage = lazy(() => import('./pages/student/DiscussionPage'))
const StudyPlannerPage = lazy(() => import('./pages/student/StudyPlannerPage'))

// Admin Pages (lazy loaded)
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminQuestionsPage = lazy(() => import('./pages/admin/AdminQuestionsPage'))
const AdminCodingPage = lazy(() => import('./pages/admin/AdminCodingPage'))
const AdminCompaniesPage = lazy(() => import('./pages/admin/AdminCompaniesPage'))
const AdminInterviewsPage = lazy(() => import('./pages/admin/AdminInterviewsPage'))
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'))

// Route Guards
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* ===== Public Routes ===== */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={
            <PublicOnlyRoute><LoginPage /></PublicOnlyRoute>
          } />
          <Route path="/register" element={
            <PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>
          } />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* ===== Student Routes ===== */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/aptitude" element={<AptitudePage />} />
          <Route path="/aptitude/test/:testId" element={<AptitudeTestPage />} />
          <Route path="/coding" element={<CodingPage />} />
          <Route path="/coding/:id" element={<CodeEditorPage />} />
          <Route path="/interview" element={<InterviewPage />} />
          <Route path="/interview/:id" element={<InterviewSessionPage />} />
          <Route path="/interview/:id/report" element={<InterviewReportPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:slug" element={<CompanyDetailPage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/discussion" element={<DiscussionPage />} />
          <Route path="/study-planner" element={<StudyPlannerPage />} />
        </Route>

        {/* ===== Admin Routes ===== */}
        <Route element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/questions" element={<AdminQuestionsPage />} />
          <Route path="/admin/coding" element={<AdminCodingPage />} />
          <Route path="/admin/companies" element={<AdminCompaniesPage />} />
          <Route path="/admin/interviews" element={<AdminInterviewsPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default App
