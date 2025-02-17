'use client'

import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [previousPath, setPreviousPath] = useState(pathname)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    if (pathname !== previousPath) {
      const isGoingToDetail = pathname.includes('/events/') && !previousPath.includes('/events/')
      setDirection(isGoingToDetail ? 1 : -1)
      setPreviousPath(pathname)
    }
  }, [pathname, previousPath])

  const variants = {
    initial: { x: 300 * direction, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -300 * direction, opacity: 0 },
  }

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  )
} 