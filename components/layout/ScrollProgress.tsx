"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mouse } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollProgressProps {
  threshold?: number;
  onSnapTriggered?: (direction: "up" | "down", targetSection: number) => void;
  onSectionChange?: (section: number) => void;
}

export function ScrollProgress({
  threshold = 0.35,
  onSnapTriggered,
  onSectionChange,
}: ScrollProgressProps) {
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [currentSection, setCurrentSection] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const lastSection = useRef(0);
  const isSnapping = useRef(false);

  const handleScroll = useCallback(() => {
    if (isSnapping.current) return;

    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const maxScroll = documentHeight - windowHeight;
    
    // Calculate progress within current section
    const sectionProgress = (scrollY % windowHeight) / windowHeight;
    setProgress(sectionProgress);

    // Determine scroll direction
    const newDirection = scrollY > lastScrollY.current ? "down" : "up";
    setDirection(newDirection);
    lastScrollY.current = scrollY;

    // Calculate current section
    const section = Math.floor(scrollY / windowHeight);
    setCurrentSection(section);
    
    // Notify parent of section change
    if (section !== lastSection.current) {
      lastSection.current = section;
      onSectionChange?.(section);
    }

    // Hide at bottom of page
    setIsVisible(scrollY < maxScroll - 100);

    // Snap scrolling logic
    if (sectionProgress >= threshold && newDirection === "down") {
      const targetSection = section + 1;
      const targetY = targetSection * windowHeight;
      
      if (targetY <= maxScroll) {
        isSnapping.current = true;
        window.scrollTo({ top: targetY, behavior: "smooth" });
        onSnapTriggered?.("down", targetSection);
        
        setTimeout(() => {
          isSnapping.current = false;
        }, 500);
      }
    } else if (sectionProgress <= 1 - threshold && sectionProgress > 0 && newDirection === "up") {
      const targetSection = section;
      const targetY = targetSection * windowHeight;
      
      isSnapping.current = true;
      window.scrollTo({ top: targetY, behavior: "smooth" });
      onSnapTriggered?.("up", targetSection);
      
      setTimeout(() => {
        isSnapping.current = false;
      }, 500);
    }
  }, [threshold, onSnapTriggered, onSectionChange]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3"
        >
          {/* Mouse scroll indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-gray-400"
          >
            <Mouse className="w-6 h-6" />
          </motion.div>

          {/* Progress bar */}
          <div className="relative w-12 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
            {/* Threshold marker */}
            <div
              className="absolute top-0 h-full w-px bg-white/30"
              style={{ left: `${threshold * 100}%` }}
            />
          </div>

          {/* Section indicator dots */}
          <div className="flex items-center gap-2">
            {[0, 1].map((section) => (
              <motion.div
                key={section}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors duration-300",
                  currentSection === section
                    ? "bg-primary-500"
                    : "bg-white/20"
                )}
                animate={{
                  scale: currentSection === section ? 1.2 : 1,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
