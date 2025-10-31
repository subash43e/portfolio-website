import './index.css'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Contact from './components/Contact'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <Header />
      <motion.main 
        className="max-w-6xl mx-auto px-6 py-12 space-y-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}><Hero /></motion.div>
        <motion.div variants={itemVariants}><About /></motion.div>
        <motion.div variants={itemVariants}><Skills /></motion.div>
        <motion.div variants={itemVariants}><Projects /></motion.div>
        <motion.div variants={itemVariants}><Contact /></motion.div>
      </motion.main>
    </div>
  )
}
