import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  ServerIcon, 
  CubeIcon, 
  Cog6ToothIcon, 
  ChartBarIcon, 
  ShieldExclamationIcon,
  DocumentTextIcon, 
  BeakerIcon 
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Drive Management', href: '/drives', icon: ServerIcon },
  { name: 'Data Chunks', href: '/chunks', icon: CubeIcon },
  { name: 'Policies', href: '/policies', icon: DocumentTextIcon },
  { name: 'Monitoring', href: '/monitoring', icon: ShieldExclamationIcon },
  { name: 'Simulation', href: '/simulation', icon: BeakerIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  
  // Handler to navigate to settings page
  const goToSettings = () => {
    navigate('/settings');
  };

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 flex z-40 lg:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-slate-600 bg-opacity-75" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-primary-900 to-primary-700">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-6">
                  <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600 h-6 w-6">
                      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                      <line x1="6" y1="6" x2="6" y2="6"></line>
                      <line x1="6" y1="18" x2="6" y2="18"></line>
                    </svg>
                  </div>
                  <span className="ml-3 text-xl font-bold text-white">
                    Smart Storage
                  </span>
                </div>
                <nav className="mt-8 px-4 space-y-1">
                  {navigation.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) => 
                        `${isActive 
                          ? 'bg-primary-800 text-white'
                          : 'text-primary-100 hover:bg-primary-800 hover:bg-opacity-60'
                        } group flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200`
                      }
                      onClick={() => setSidebarOpen(false)} // Close sidebar on mobile when navigating
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={`${isActive 
                              ? 'text-white'
                              : 'text-primary-300 group-hover:text-primary-100'
                            } mr-4 flex-shrink-0 h-6 w-6 transition-colors duration-200`}
                            aria-hidden="true"
                          />
                          {item.name}
                        </>
                      )}
                    </NavLink>
                  ))}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-primary-800 p-4">
                <div className="flex items-center">
                  <div>
                    <img
                      className="inline-block h-10 w-10 rounded-full border border-primary-600 shadow-inner"
                      src="https://cdn3.iconfinder.com/data/icons/avatars-round-flat/33/man5-512.png"
                      alt=""
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-white">Sharjeel Siddiqui</p>
                    <p className="text-sm font-medium text-primary-300">System Administrator</p>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar - fixed position with exact width that matches the margin in the Layout */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-50">
        <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-primary-900 to-primary-700 shadow-xl">
          <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6">
              <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600 h-6 w-6">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                  <line x1="6" y1="6" x2="6" y2="6"></line>
                  <line x1="6" y1="18" x2="6" y2="18"></line>
                </svg>
              </div>
              <span className="ml-3 text-xl font-bold text-white">
                Smart Storage
              </span>
            </div>
            <nav className="mt-8 flex-1 px-4 space-y-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => 
                    `${isActive 
                      ? 'relative bg-primary-800 text-white before:absolute before:top-1/2 before:-left-4 before:transform before:-translate-y-1/2 before:h-8 before:w-1.5 before:bg-white before:rounded-r'
                      : 'text-primary-100 hover:bg-primary-800 hover:bg-opacity-60'
                    } group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`${isActive 
                          ? 'text-white'
                          : 'text-primary-300 group-hover:text-primary-100'
                        } mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-primary-800 p-4">
            <div className="flex items-center w-full">
              <div>
                <img
                  className="inline-block h-9 w-9 rounded-full border border-primary-600 shadow-inner"
                  src="https://cdn3.iconfinder.com/data/icons/avatars-round-flat/33/man5-512.png"
                  alt=""
                />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Sharjeel Siddiqui</p>
                <p className="text-xs font-medium text-primary-300 truncate">System Administrator</p>
              </div>
              <div>
                {/* Updated button with onClick handler to navigate to settings */}
                <button 
                  className="p-1 rounded-full text-primary-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white transition-all duration-200"
                  onClick={goToSettings}
                  title="Settings"
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;