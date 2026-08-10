import { motion } from 'framer-motion'

const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
        <span className="text-white font-bold text-xl">AI</span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary-600"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  </div>
)

export default LoadingScreen
