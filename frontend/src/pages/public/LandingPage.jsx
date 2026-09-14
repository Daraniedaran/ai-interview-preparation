import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import {
  RiRocketLine, RiBrainLine, RiCodeLine, RiMicLine, RiBuildingLine,
  RiTrophyLine, RiBarChartLine, RiFileTextLine, RiArrowRightLine,
  RiStarFill, RiCheckLine, RiGithubLine, RiLinkedinLine,
  RiSunLine, RiMoonLine, RiUserLine, RiTimeLine
} from 'react-icons/ri'

const features = [
  { icon: RiBrainLine, title: 'Aptitude Training', desc: '500+ questions across 5 categories with AI difficulty adjustment', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  { icon: RiCodeLine, title: 'Coding Challenges', desc: 'Real-time code execution with Judge0. Python, Java, C++, JS, SQL', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  { icon: RiMicLine, title: 'AI Mock Interviews', desc: 'GPT-4 powered interviews with detailed feedback and scoring', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  { icon: RiFileTextLine, title: 'AI Resume Review', desc: 'Get ATS score, grammar fixes, and skill gap analysis instantly', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  { icon: RiBuildingLine, title: 'Company Prep', desc: 'Interview processes, previous questions for Google, Amazon, TCS & more', color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
  { icon: RiTrophyLine, title: 'Leaderboard', desc: 'Compete globally and within your college. Earn badges & rewards', color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { icon: RiBarChartLine, title: 'Progress Analytics', desc: 'Visual tracking of your improvement over time with insights', color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
  { icon: RiTimeLine, title: 'Study Planner', desc: 'Pomodoro timer, calendar, flashcards, and daily goals', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
]

const stats = [
  { value: '50,000+', label: 'Students Trained' },
  { value: '500+', label: 'Practice Questions' },
  { value: '18+', label: 'Top Companies' },
  { value: '95%', label: 'Success Rate' },
]

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'SDE at Google',
    college: 'IIT Bombay',
    text: 'The AI mock interviews were incredible. After 2 weeks of practice, I felt completely confident in my Google interview. The feedback was so detailed!',
    avatar: 'PS',
    stars: 5,
  },
  {
    name: 'Rahul Kumar',
    role: 'Software Engineer at Microsoft',
    college: 'NIT Trichy',
    text: 'This platform helped me crack Microsoft after 3 failed attempts. The company-specific preparation and aptitude tests are world-class.',
    avatar: 'RK',
    stars: 5,
  },
  {
    name: 'Ananya Patel',
    role: 'Backend Dev at Amazon',
    college: 'BITS Pilani',
    text: 'The resume review gave my CV a score of 48 and told me exactly what to fix. After implementing the suggestions, I got 3x more interview calls!',
    avatar: 'AP',
    stars: 5,
  },
]

const companies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'TCS', 'Infosys', 'Wipro', 'Zoho', 'Freshworks', 'Adobe']

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
}

const LandingPage = () => {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900">
      {/* ===== Navbar ===== */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 dark:bg-dark-900/90 backdrop-blur-md border-b border-gray-100 dark:border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold">AI</div>
            <span className="font-bold text-gray-900 dark:text-white hidden sm:block">Interview Portal</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="btn-icon text-gray-600 dark:text-gray-400">
              {isDark ? <RiSunLine className="text-xl" /> : <RiMoonLine className="text-xl" />}
            </button>
            <Link to="/login" className="btn-secondary btn-sm hidden sm:flex">Login</Link>
            <Link to="/register" className="btn-primary btn-sm">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* ===== Hero Section ===== */}
      <section className="pt-24 pb-20 hero-bg overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-400 text-sm font-medium mb-6"
            >
              <RiRocketLine />
              AI-Powered Interview Preparation Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6"
            >
              Ace Every Interview with{' '}
              <span className="gradient-text">AI-Powered</span>{' '}
              Preparation
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-500 dark:text-gray-400 mb-8 leading-relaxed"
            >
              Practice aptitude tests, solve coding challenges, attend AI mock interviews,
              get your resume reviewed — all in one platform built for campus placements.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/register" className="btn-primary btn-lg group">
                Start Preparing Free
                <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="btn-secondary btn-lg">
                Sign In
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 text-sm text-gray-400"
            >
              No credit card required • Free forever for students
            </motion.p>
          </div>

          {/* Hero Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-2xl bg-white/70 dark:bg-dark-800/70 backdrop-blur border border-gray-100 dark:border-dark-700">
                <div className="text-2xl sm:text-3xl font-extrabold gradient-text">{stat.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== Features Section ===== */}
      <section className="section bg-gray-50 dark:bg-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to <span className="gradient-text">crack placements</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              A complete ecosystem of tools powered by AI to help you land your dream job.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={i}
                  {...fadeUp}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="card-hover group"
                >
                  <div className={`w-12 h-12 rounded-2xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="text-2xl" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== Companies Section ===== */}
      <section className="py-16 bg-white dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Prepare for Top Companies
            </h2>
            <p className="text-gray-500 dark:text-gray-400">Company-specific interview questions and processes</p>
          </motion.div>
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="flex flex-wrap justify-center gap-3">
            {companies.map((company, i) => (
              <span key={i} className="px-5 py-2.5 rounded-full bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 transition-colors cursor-pointer text-sm">
                {company}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== How It Works ===== */}
      <section className="section bg-gray-50 dark:bg-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Get started in <span className="gradient-text">3 simple steps</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: RiUserLine, title: 'Create Your Account', desc: 'Sign up for free and set up your profile with your target companies and role preferences.' },
              { step: '02', icon: RiBrainLine, title: 'Practice & Learn', desc: 'Take aptitude tests, solve coding problems, and attend AI mock interviews tailored to your goals.' },
              { step: '03', icon: RiTrophyLine, title: 'Track & Improve', desc: 'See your progress on the leaderboard, earn badges, and follow personalized AI recommendations.' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }} className="text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary text-white text-2xl mb-4 shadow-glow-primary">
                    <Icon />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-warning-500 text-white text-xs font-bold flex items-center justify-center">
                      {item.step.slice(1)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section className="section bg-white dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Students love us 💙
            </h2>
            <p className="text-gray-500 dark:text-gray-400">Join thousands who landed their dream jobs</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }} className="card">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.stars)].map((_, j) => (
                    <RiStarFill key={j} className="text-warning-500 text-sm" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="avatar w-10 h-10 text-sm">{t.avatar}</div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role} • {t.college}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA Section ===== */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to ace your interviews?
            </h2>
            <p className="text-blue-100 mb-8 text-lg">
              Join 50,000+ students already preparing with AI-powered tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-lg bg-white text-primary-600 hover:bg-gray-50 font-bold rounded-2xl inline-flex items-center gap-2 px-8 py-3 shadow-lg">
                Get Started Free <RiArrowRightLine />
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-blue-100 text-sm">
              {['No credit card', 'Free forever', 'All features included'].map((item, i) => (
                <div key={i} className="flex items-center gap-1">
                  <RiCheckLine className="text-green-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-dark-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">AI</div>
                <span className="font-bold text-white text-sm">Interview Portal</span>
              </div>
              <p className="text-xs leading-relaxed">AI-powered interview preparation for campus placements and software engineering roles.</p>
            </div>
            {[
              { title: 'Practice', links: ['Aptitude', 'Coding', 'Mock Interview', 'Question Bank'] },
              { title: 'Resources', links: ['Companies', 'Resume Review', 'Leaderboard', 'Achievements'] },
              { title: 'Account', links: ['Register', 'Login', 'Dashboard', 'Progress'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold text-white text-sm mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <Link to="/register" className="text-xs hover:text-primary-400 transition-colors">{link}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-dark-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs">© 2026 AI Interview Portal. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-primary-400 transition-colors"><RiGithubLine className="text-lg" /></a>
              <a href="#" className="hover:text-primary-400 transition-colors"><RiLinkedinLine className="text-lg" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
