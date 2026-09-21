import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'accent';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#0F766E] text-white hover:bg-[#115E59] active:bg-[#0d4a46] border border-transparent shadow-sm focus-visible:ring-[#0F766E]/40',
  secondary:
    'bg-white text-[#172033] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] border border-[#E2E8F0] shadow-subtle focus-visible:ring-slate-300',
  outline:
    'bg-transparent text-[#0F766E] hover:bg-teal-50 active:bg-teal-100 border border-[#0F766E] focus-visible:ring-[#0F766E]/30',
  ghost:
    'bg-transparent text-[#334155] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] border border-transparent focus-visible:ring-slate-300',
  danger:
    'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] border border-transparent shadow-sm focus-visible:ring-red-500/40',
  accent:
    'bg-[#172033] text-white hover:bg-[#334155] active:bg-[#0F172A] border border-transparent shadow-sm focus-visible:ring-slate-800/40',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 font-medium',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2 font-medium',
  lg: 'text-base px-5 py-3 rounded-xl gap-2.5 font-semibold',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          variantStyles[variant]
        } ${sizeStyles[size]} ${
          fullWidth ? 'w-full' : ''
        } ${
          isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
