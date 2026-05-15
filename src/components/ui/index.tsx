import React from 'react';
import { motion } from 'framer-motion';

export const GlassCard = ({ children, className = "", hover = true }: { children: React.ReactNode, className?: string, hover?: boolean }) => (
  <motion.div 
    whileHover={hover ? { y: -4 } : {}}
    className={`glass-card p-8 bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm transition-all duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

export const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  className = "",
  disabled = false,
  loading = false,
  icon
}: { 
  children: React.ReactNode, 
  variant?: 'primary' | 'ghost' | 'danger' | 'ghost-purple' | 'outline' | 'purple', 
  onClick?: () => void,
  className?: string,
  disabled?: boolean,
  loading?: boolean,
  icon?: React.ReactNode
}) => {
  const baseStyles = "relative px-6 py-3 rounded-full font-outfit font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none overflow-hidden group";
  
  const variants = {
    primary: "bg-black text-white hover:bg-black/90 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.1)] hover:-translate-y-[2px]",
    purple: "bg-[#4a2e8c] text-white hover:bg-[#3d2575] shadow-[0_4px_0_0_rgba(74,46,140,0.2)] hover:shadow-[0_6px_0_0_rgba(74,46,140,0.2)] hover:-translate-y-[2px]",
    ghost: "bg-white/60 backdrop-blur-md border border-black/5 text-gray-900 hover:bg-white/90 shadow-sm",
    ghost_purple: "bg-[#cdb4ff]/10 border border-[#cdb4ff]/30 text-[#4a2e8c] hover:bg-[#cdb4ff]/20",
    outline: "bg-transparent border-2 border-black/10 text-black hover:border-black/20 hover:bg-black/5",
    danger: "bg-transparent border border-red-200 text-red-600 hover:bg-red-50"
  };

  const selectedVariant = variant === 'ghost-purple' ? variants.ghost_purple : variants[variant as keyof typeof variants];

  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick} 
      className={`${baseStyles} ${selectedVariant} ${className}`}
      disabled={disabled || loading}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!loading && icon && <span className="transition-transform group-hover:scale-110">{icon}</span>}
      <span className={loading ? 'opacity-50' : ''}>{children}</span>
    </motion.button>
  );
};

export const Input = ({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  className = "",
  error
}: {
  label?: string,
  placeholder?: string,
  value?: string,
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
  type?: string,
  className?: string,
  error?: string
}) => (
  <div className={`space-y-2 ${className}`}>
    {label && (
      <label className="text-[11px] font-jakarta font-bold text-gray-400 uppercase tracking-widest ml-1">
        {label}
      </label>
    )}
    <div className="relative group">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-gray-50/50 backdrop-blur-sm border border-black/5 rounded-[20px] px-6 py-4 font-jakarta font-bold text-sm text-black outline-none focus:border-[#cdb4ff] focus:bg-white shadow-inner transition-all placeholder:text-gray-300 ${error ? 'border-red-300 focus:border-red-400' : ''}`}
      />
      <div className="absolute inset-0 rounded-[20px] border border-[#cdb4ff] opacity-0 group-focus-within:opacity-20 pointer-events-none transition-opacity duration-300" />
    </div>
    {error && <p className="text-[10px] text-red-500 font-bold ml-1">{error}</p>}
  </div>
);

export const Badge = ({ children, color = "purple", className = "" }: { children: React.ReactNode, color?: "purple" | "blue" | "green" | "red" | "gray", className?: string }) => {
  const colors = {
    purple: "bg-[#cdb4ff]/20 text-[#4a2e8c] border-[#cdb4ff]/30",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
    gray: "bg-gray-50 text-gray-500 border-gray-100"
  };

  return (
    <span className={`px-3 py-1 rounded-full border font-jakarta font-bold text-[9px] uppercase tracking-widest ${colors[color]} ${className}`}>
      {children}
    </span>
  );
};

