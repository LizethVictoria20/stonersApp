import React from 'react';

interface UserAvatarProps {
  name: string;
  role?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const getInitials = (name: string): string => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  name, 
  role, 
  className = '', 
  size = 'md' 
}) => {
  const initials = getInitials(name);

  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
    xl: 'h-14 w-14 text-base font-black'
  };

  const getRoleGradient = () => {
    if (role === 'admin' || name.toLowerCase().includes('liz') || name.toLowerCase().includes('santiago')) {
      return 'from-emerald-600 to-teal-800 text-white shadow-emerald-950/30 ring-emerald-500/50';
    }
    if (role === 'vendedor') {
      return 'from-teal-500 to-emerald-700 text-white shadow-teal-950/30 ring-teal-500/50';
    }
    if (role === 'contador') {
      return 'from-blue-600 to-indigo-800 text-white shadow-blue-950/30 ring-blue-500/50';
    }
    return 'from-slate-700 to-slate-900 text-slate-100 ring-slate-600/50';
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${getRoleGradient()} font-extrabold tracking-wider ring-1 shadow-sm select-none shrink-0 ${sizeClasses[size]} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};
