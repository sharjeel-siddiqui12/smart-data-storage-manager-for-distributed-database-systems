import { Fragment } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';

const userNavigation = [
  { name: 'Your Profile', href: '#' },
  { name: 'Settings', href: '/settings' },
  { name: 'Sign out', href: '#' },
];

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  // Get current page title based on route
  const getCurrentPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    return path.charAt(1).toUpperCase() + path.slice(2);
  };

  return (
    <Disclosure as="header" className="bg-white shadow-sm border-b border-slate-200 z-10 sticky top-0">
      {({ open }) => (
        <>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <button
                    type="button"
                    className="lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <span className="sr-only">Open sidebar</span>
                    <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                  </button>
                  <div className="hidden lg:block">
                    <h1 className="text-xl font-semibold text-slate-800">{getCurrentPageTitle()}</h1>
                    <p className="text-sm text-slate-500">Smart Storage System</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                {/* Search Bar */}
                <div className="hidden lg:block mr-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      className="block w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-3 text-sm placeholder-slate-500 focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      placeholder="Search"
                      type="search"
                    />
                  </div>
                </div>

                {/* Notifications */}
                <button
                  type="button"
                  className="p-2 rounded-full text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 relative"
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-primary-500 ring-2 ring-white"></span>
                </button>

                {/* Profile dropdown */}
                <Menu as="div" className="ml-4 relative flex-shrink-0">
                  <div>
                    <Menu.Button className="bg-white rounded-full flex focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                      <span className="sr-only">Open user menu</span>
                      <img
                        className="h-9 w-9 rounded-full border-2 border-slate-200 shadow-sm"
                        src="https://cdn3.iconfinder.com/data/icons/avatars-round-flat/33/man5-512.png"
                        alt="User Profile"
                      />
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-700">Sharjeel Siddiqui</p>
                        <p className="text-xs text-slate-500 truncate">System Administrator</p>
                      </div>
                      {userNavigation.map((item) => (
                        <Menu.Item key={item.name}>
                          {({ active }) => (
                            <a
                              href={item.href}
                              className={`${
                                active ? 'bg-slate-100' : ''
                              } block px-4 py-2 text-sm text-slate-700`}
                            >
                              {item.name}
                            </a>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>
        </>
      )}
    </Disclosure>
  );
};

export default Header;