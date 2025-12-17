import { motion } from 'framer-motion'
import Hero from "./LandingPage/Hero"
import About from './LandingPage/About'
import Skills from './LandingPage/Skills'
import Projects from './LandingPage/Projects'
import Contact from './LandingPage/Contact'

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

const Home = () => {
  return (
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
  );
};

export default Home;