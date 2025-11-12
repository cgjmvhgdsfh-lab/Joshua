import React, { useState, useRef, ReactNode, useId } from 'react';

interface TooltipProps {
  children: React.ReactElement; // Must be a single element to apply props
  title: string;
  description: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, title, description }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const tooltipId = useId();

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const triggerProps = {
    'aria-describedby': isVisible ? tooltipId : undefined,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleMouseEnter, // Show on focus for keyboard nav
    onBlur: handleMouseLeave,  // Hide on blur
  };
  const trigger = React.cloneElement(children, triggerProps);

  return (
    <div className="relative flex items-center">
      {trigger}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-base-300/80 dark:bg-dark-base-300/80 backdrop-blur-sm rounded-lg shadow-lg border border-base-300 dark:border-dark-base-200 z-50 animate-tooltip-in origin-bottom"
        >
          <h4 className="font-bold text-sm text-text-primary dark:text-dark-text-primary">{title}</h4>
          <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">{description}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-base-300/80 dark:border-t-dark-base-300/80" />
        </div>
      )}
    </div>
  );
};