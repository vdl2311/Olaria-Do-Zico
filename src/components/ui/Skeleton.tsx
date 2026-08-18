import React from 'react';

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-[#E7D5BE]/60 rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
};
