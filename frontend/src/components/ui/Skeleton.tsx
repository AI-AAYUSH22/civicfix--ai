import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rounded';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rounded',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
  };

  return (
    <div
      className={`animate-pulse bg-[#E2E8F0] ${variantStyles[variant]} ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-subtle ${className}`}
    >
      <div className="flex items-center justify-between">
        <Skeleton width="40%" height={18} />
        <Skeleton width="20%" height={22} className="rounded-full" />
      </div>
      <Skeleton width="75%" height={14} />
      <Skeleton width="100%" height={80} className="rounded-xl" />
      <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
        <Skeleton width="30%" height={14} />
        <Skeleton width="24px" height={24} className="rounded-full" />
      </div>
    </div>
  );
};

export const StatsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-subtle space-y-2"
        >
          <div className="flex items-center justify-between">
            <Skeleton width="50%" height={12} />
            <Skeleton width={28} height={28} className="rounded-lg" />
          </div>
          <Skeleton width="40%" height={28} />
          <Skeleton width="65%" height={10} />
        </div>
      ))}
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ count?: number }> = ({
  count = 3,
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3.5 bg-white border border-[#E2E8F0] rounded-xl"
        >
          <div className="flex items-center gap-3">
            <Skeleton width={36} height={36} className="rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton width={120} height={14} />
              <Skeleton width={180} height={12} />
            </div>
          </div>
          <Skeleton width={80} height={24} className="rounded-full" />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
