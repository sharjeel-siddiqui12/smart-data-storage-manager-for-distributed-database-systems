import Button from './Button';

const EmptyState = ({ 
  title = "No data available", 
  description = "Add some data to get started", 
  icon, 
  actionText = "Add Data",
  actionLink = "#",
  secondaryActionText,
  secondaryActionLink,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="bg-slate-100 rounded-full p-6 mb-4">
        {icon || (
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      
      <div className="flex flex-wrap justify-center space-x-3">
        <Button
          to={actionLink}
          onClick={onAction}
          variant="primary"
          size="sm"
        >
          {actionText}
        </Button>
        
        {secondaryActionText && (
          <Button
            to={secondaryActionLink || "#"}
            variant="outline"
            size="sm"
          >
            {secondaryActionText}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;