import { Link } from 'react-router-dom';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  className = '',
  onClick,
  to = null,
  icon = null,
}) => {
  // Define base classes
  let baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg shadow-sm focus:outline-none transition-all duration-200';
  
  // Size classes
  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
    xl: 'px-6 py-3 text-base',
  };
  
  // Variant classes
  const variantClasses = {
    primary: `bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${disabled ? 'opacity-50 cursor-not-allowed from-primary-400 to-primary-500' : ''}`,
    
    secondary: `bg-gradient-to-r from-secondary-500 to-secondary-600 text-white hover:from-secondary-600 hover:to-secondary-700 focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 ${disabled ? 'opacity-50 cursor-not-allowed from-secondary-400 to-secondary-500' : ''}`,
    
    success: `bg-gradient-to-r from-success-500 to-success-600 text-white hover:from-success-600 hover:to-success-700 focus:ring-2 focus:ring-offset-2 focus:ring-success-500 ${disabled ? 'opacity-50 cursor-not-allowed from-success-400 to-success-500' : ''}`,
    
    danger: `bg-gradient-to-r from-danger-500 to-danger-600 text-white hover:from-danger-600 hover:to-danger-700 focus:ring-2 focus:ring-offset-2 focus:ring-danger-500 ${disabled ? 'opacity-50 cursor-not-allowed from-danger-400 to-danger-500' : ''}`,
    
    warning: `bg-gradient-to-r from-warning-500 to-warning-600 text-white hover:from-warning-600 hover:to-warning-700 focus:ring-2 focus:ring-offset-2 focus:ring-warning-500 ${disabled ? 'opacity-50 cursor-not-allowed from-warning-400 to-warning-500' : ''}`,
    
    outline: `border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400' : ''}`,
    
    ghost: `bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-2 focus:ring-slate-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
  };
  
  const allClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  
  // Render as Link if 'to' prop is provided
  if (to) {
    return (
      <Link to={to} className={allClasses} onClick={onClick}>
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </Link>
    );
  }
  
  // Render as button
  return (
    <button
      type={type}
      className={allClasses}
      disabled={disabled}
      onClick={onClick}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;