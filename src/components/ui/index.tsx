import React from 'react';

export const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`glass-card p-8 ${className}`}>
    {children}
  </div>
);

export const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  className = "",
  disabled = false
}: { 
  children: React.ReactNode, 
  variant?: 'primary' | 'ghost' | 'danger' | 'ghost-purple', 
  onClick?: () => void,
  className?: string,
  disabled?: boolean
}) => {
  const baseStyles = "px-6 py-3 rounded-full font-outfit font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-black text-white hover:bg-black/80 shadow-lg hover:shadow-xl",
    ghost: "bg-white/95 backdrop-blur-xl border border-black/5 text-gray-900 hover:bg-gray-50 shadow-sm",
    ghost_purple: "bg-[#cdb4ff]/10 border border-[#cdb4ff]/30 text-[#4a2e8c] hover:bg-[#cdb4ff]/20",
    danger: "bg-transparent border border-red-200 text-red-600 hover:bg-red-50"
  };

  const selectedVariant = variant === 'ghost-purple' ? variants.ghost_purple : variants[variant as keyof typeof variants];

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${selectedVariant} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
