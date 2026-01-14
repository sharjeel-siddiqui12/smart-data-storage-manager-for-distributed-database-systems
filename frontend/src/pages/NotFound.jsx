import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="min-h-full px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
      <div className="max-w-max mx-auto">
        <main className="sm:flex">
          <ExclamationCircleIcon className="h-16 w-16 text-danger-400" />
          <div className="sm:ml-6">
            <div className="sm:border-l sm:border-gray-200 sm:pl-6">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Page not found</h1>
              <p className="mt-1 text-base text-gray-500">Please check the URL or navigate back to the dashboard.</p>
            </div>
            <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
              <Button
                to="/"
                variant="primary"
              >
                Go back home
              </Button>
              <Button
                to="/monitoring"
                variant="outline"
              >
                Monitor System Status
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotFound;