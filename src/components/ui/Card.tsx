import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cardHover } from '@/animations';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  interactive?: boolean;
  padded?: boolean | 'sm' | 'md' | 'lg' | 'none';
  elevation?: 'subtle' | 'lift' | 'flat';
  children?: React.ReactNode;
}

const elevationStyles = {
  subtle: 'shadow-subtle hover:shadow-lift',
  lift: 'shadow-lift hover:shadow-card',
  flat: 'shadow-none',
};

const paddingStyles = {
  none: '',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      interactive = false,
      padded = 'md',
      elevation = 'subtle',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const padClass =
      typeof padded === 'boolean'
        ? padded
          ? paddingStyles.md
          : ''
        : paddingStyles[padded];

    if (interactive) {
      return (
        <motion.div
          ref={ref}
          variants={cardHover}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          className={`bg-white border border-[#E2E8F0] rounded-2xl transition-shadow cursor-pointer ${elevationStyles[elevation]} ${padClass} ${className}`}
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={`bg-white border border-[#E2E8F0] rounded-2xl ${elevationStyles[elevation]} ${padClass} ${className}`}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`flex flex-col space-y-1.5 pb-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <h3
    className={`font-semibold text-base sm:text-lg text-[#172033] tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ className = '', children, ...props }) => (
  <p className={`text-xs sm:text-sm text-[#64748B] ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div
    className={`flex items-center pt-4 border-t border-[#E2E8F0] mt-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default Card;
