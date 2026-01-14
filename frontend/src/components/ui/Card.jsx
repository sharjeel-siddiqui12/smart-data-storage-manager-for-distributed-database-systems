const Card = ({ title, children, className = '', footer = null, headerAction = null }) => {
  return (
    <div className={`bg-white overflow-hidden shadow-sm border border-slate-200 rounded-xl transition-all duration-200 hover:shadow-md ${className}`}>
      {title && (
        <div className="px-6 py-4 sm:px-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={title ? 'px-6 py-5 sm:p-6' : 'p-6'}>{children}</div>
      {footer && <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">{footer}</div>}
    </div>
  );
};

export default Card;