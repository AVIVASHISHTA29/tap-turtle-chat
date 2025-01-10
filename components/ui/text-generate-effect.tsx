"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const TextGenerateEffect = ({
  words,
  className,
}: {
  words: string;
  className?: string;
}) => {
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setComplete(true);
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  const characters = words.split("").map((char, index) => (
    <motion.span
      key={index}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: complete ? 1 : 0,
        y: complete ? 0 : 20,
      }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeInOut",
      }}
      className="inline-block"
    >
      {char}
    </motion.span>
  ));

  return (
    <div className={cn("font-bold", className)}>
      <div className="mt-4">
        <div className="text-2xl leading-snug tracking-wide">{characters}</div>
      </div>
    </div>
  );
};
