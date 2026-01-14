const LoadingState = ({ height = 'h-60', type = 'chart', text = 'Loading data...' }) => {
  return (
    <div className={`${height} w-full flex flex-col items-center justify-center`}>
      <div className="relative">
        {type === 'chart' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-primary-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-t-primary-500 border-r-primary-300 border-b-primary-200 border-l-primary-100 animate-spin"></div>
        </div>
      </div>
      <p className="mt-4 text-slate-500 text-sm">{text}</p>
    </div>
  );
};

export default LoadingState;