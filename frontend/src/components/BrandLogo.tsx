import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showBadge = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-2xl',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Soundwave Prism Icon */}
      <div
        className={`${iconSizes[size]} bg-gradient-to-tr from-red-600 via-rose-500 to-orange-400 p-[1px] shadow-lg shadow-red-500/25 flex items-center justify-center`}
      >
        <div className="w-full h-full bg-[#0d0d14] rounded-[inherit] flex items-center justify-center gap-[2.5px] px-1.5">
          <span className="w-[2.5px] h-2 bg-rose-400 rounded-full animate-pulse" />
          <span className="w-[2.5px] h-4 bg-gradient-to-t from-red-500 to-rose-400 rounded-full" />
          <span className="w-[2.5px] h-5 bg-gradient-to-t from-orange-400 to-rose-400 rounded-full" />
          <span className="w-[2.5px] h-3.5 bg-gradient-to-t from-red-500 to-rose-400 rounded-full" />
          <span className="w-[2.5px] h-2 bg-rose-400 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Wordmark */}
      <div className="flex items-center gap-1.5">
        <span
          className={`font-extrabold ${textSizes[size]} tracking-tight text-white leading-none font-['Plus_Jakarta_Sans',sans-serif]`}
        >
          klyd
        </span>
        {showBadge && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-gradient-to-r from-red-500/15 to-rose-500/15 text-rose-400 border border-rose-500/20">
            beta
          </span>
        )}
      </div>
    </div>
  );
};
