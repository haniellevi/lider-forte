"use client";

import { FC, useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: string;
}

export const AnimatedCounter: FC<AnimatedCounterProps> = ({
  value,
  duration = 1,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
  separator = ','
}) => {
  const [isInView, setIsInView] = useState(false);
  
  // Usar spring animation para números suaves
  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0
  });
  
  const display = useTransform(spring, (latest) => {
    const formatted = latest.toFixed(decimals);
    const [integer, decimal] = formatted.split('.');
    
    // Adicionar separador de milhares
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    
    return decimals > 0 
      ? `${prefix}${formattedInteger}.${decimal}${suffix}`
      : `${prefix}${formattedInteger}${suffix}`;
  });

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [spring, value, isInView]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      onViewportEnter={() => setIsInView(true)}
      transition={{ duration: 0.3 }}
      className={cn("font-bold", className)}
    >
      <motion.span>{display}</motion.span>
    </motion.div>
  );
};

// Componente específico para pontuação com animação de celebração
interface ScoreCounterProps {
  score: number;
  previousScore?: number;
  className?: string;
  showCelebration?: boolean;
}

export const ScoreCounter: FC<ScoreCounterProps> = ({
  score,
  previousScore = 0,
  className,
  showCelebration = true
}) => {
  const [showIncrease, setShowIncrease] = useState(false);
  const increase = score - previousScore;

  useEffect(() => {
    if (increase > 0 && showCelebration) {
      setShowIncrease(true);
      const timer = setTimeout(() => setShowIncrease(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [increase, showCelebration]);

  return (
    <div className="relative">
      <AnimatedCounter
        value={score}
        className={cn("text-3xl font-bold text-primary", className)}
        separator="."
      />
      
      {showIncrease && increase > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={{ opacity: 1, y: -20, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.6 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute -top-6 left-0 text-green-500 font-bold text-sm"
        >
          +{increase}
        </motion.div>
      )}
    </div>
  );
};

// Componente para contadores de estatísticas
interface StatCounterProps {
  label: string;
  value: number;
  icon?: string;
  color?: 'primary' | 'green' | 'blue' | 'purple' | 'orange';
  className?: string;
}

export const StatCounter: FC<StatCounterProps> = ({
  label,
  value,
  icon,
  color = 'primary',
  className
}) => {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    green: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
    blue: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20',
    purple: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20',
    orange: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark",
        "border border-stroke dark:border-dark-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-title-md font-bold text-dark dark:text-white">
            <AnimatedCounter
              value={value}
              className="text-2xl"
              separator="."
            />
          </h4>
          <span className="text-sm font-medium text-body-color dark:text-body-color-dark">
            {label}
          </span>
        </div>
        
        {icon && (
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full text-xl",
            colorClasses[color]
          )}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
};