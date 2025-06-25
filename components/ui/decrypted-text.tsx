"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: "view" | "hover";
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

export function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  className = "",
  parentClassName = "",
  encryptedClassName = "",
  animateOn = "hover",
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const getRandomChar = (originalChar: string) => {
    if (originalChar === " ") return " ";
    if (useOriginalCharsOnly) {
      const originalChars = Array.from(new Set(text.split("").filter(c => c !== " ")));
      return originalChars[Math.floor(Math.random() * originalChars.length)];
    }
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  };

  const animateText = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const textArray = text.split("");
    let iterations = 0;

    const interval = setInterval(() => {
      if (sequential) {
        // Sequential reveal logic
        const revealCount = Math.floor((iterations / maxIterations) * textArray.length);
        const newText = textArray.map((char, index) => {
          let shouldReveal = false;
          
          if (revealDirection === "start") {
            shouldReveal = index < revealCount;
          } else if (revealDirection === "end") {
            shouldReveal = index >= textArray.length - revealCount;
          } else if (revealDirection === "center") {
            const center = Math.floor(textArray.length / 2);
            const distance = Math.abs(index - center);
            shouldReveal = distance <= Math.floor(revealCount / 2);
          }

          return shouldReveal ? char : getRandomChar(char);
        }).join("");
        
        setDisplayText(newText);
      } else {
        // Random scramble logic
        const newText = textArray.map((char, index) => {
          if (Math.random() < 0.7) {
            return getRandomChar(char);
          }
          return char;
        }).join("");
        
        setDisplayText(newText);
      }

      iterations++;
      
      if (iterations >= maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
        setIsAnimating(false);
      }
    }, speed);
  };

  useEffect(() => {
    if (animateOn === "view" && isInView && !isAnimating) {
      animateText();
    }
  }, [isInView, animateOn]);

  const handleMouseEnter = () => {
    if (animateOn === "hover") {
      animateText();
    }
  };

  if (animateOn === "view") {
    return (
      <motion.span
        className={cn(parentClassName)}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        onViewportEnter={() => setIsInView(true)}
        viewport={{ once: true }}
      >
        <span
          className={cn(
            isAnimating ? encryptedClassName : className,
            "transition-all duration-200"
          )}
        >
          {displayText}
        </span>
      </motion.span>
    );
  }

  return (
    <span
      className={cn(parentClassName, "cursor-pointer")}
      onMouseEnter={handleMouseEnter}
    >
      <span
        className={cn(
          isAnimating ? encryptedClassName : className,
          "transition-all duration-200"
        )}
      >
        {displayText}
      </span>
    </span>
  );
}

export default DecryptedText;