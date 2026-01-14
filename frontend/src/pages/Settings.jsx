import { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toast } from 'react-toastify';
import {
  CogIcon,
  BellIcon,
  UserCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const Settings = () => {
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'Smart Storage System',
    autoRebalance: true,
    dataProtectionLevel: 'high',
    autoRecovery: true,
    metricCollection: 'detailed'
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    emailAddress: 'admin@example.com',
    driveFailureAlerts: true,
    dataCorruptionAlerts: true,
    capacityWarnings: true,
    capacityThreshold: 80
  });
  
  const [accountSettings, setAccountSettings] = useState({
    username: 'Admin User',
    email: 'admin@example.com',
    role: 'Administrator'
  });

  const handleGeneralSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleNotificationSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value) : value
    });
  };

  const saveSettings = (settingType) => {
    // In a real app, this would call an API to save settings
    toast.success(`${settingType} settings saved successfully`);
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure system preferences, notifications, and account settings.
        </p>
      </div>

      {/* General Settings */}
      <Card 
        title="General Settings" 
        className="mb-5"
        headerAction={<CogIcon className="h-6 w-6 text-gray-500" />}
      >
        <div className="space-y-6">
          <div>
            <label htmlFor="systemName" className="block text-sm font-medium text-gray-700">
              System Name
            </label>
            <input
              type="text"
              name="systemName"
              id="systemName"
              value={generalSettings.systemName}
              onChange={handleGeneralSettingsChange}
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="dataProtectionLevel" className="block text-sm font-medium text-gray-700">
                Data Protection Level
              </label>
              <select
                id="dataProtectionLevel"
                name="dataProtectionLevel"
                value={generalSettings.dataProtectionLevel}
                onChange={handleGeneralSettingsChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="low">Low (1 replica)</option>
                <option value="medium">Medium (2 replicas)</option>
                <option value="high">High (3+ replicas)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Higher protection requires more storage capacity
              </p>
            </div>
            
            <div>
              <label htmlFor="metricCollection" className="block text-sm font-medium text-gray-700">
                Metric Collection
              </label>
              <select
                id="metricCollection"
                name="metricCollection"
                value={generalSettings.metricCollection}
                onChange={handleGeneralSettingsChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="minimal">Minimal</option>
                <option value="standard">Standard</option>
                <option value="detailed">Detailed</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Controls how much performance data is collected
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="autoRebalance"
                  name="autoRebalance"
                  type="checkbox"
                  checked={generalSettings.autoRebalance}
                  onChange={handleGeneralSettingsChange}
                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="autoRebalance" className="font-medium text-gray-700">Enable Automatic Rebalancing</label>
                <p className="text-gray-500">System will automatically rebalance data when drives exceed utilization threshold</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="autoRecovery"
                  name="autoRecovery"
                  type="checkbox"
                  checked={generalSettings.autoRecovery}
                  onChange={handleGeneralSettingsChange}
                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="autoRecovery" className="font-medium text-gray-700">Enable Automatic Recovery</label>
                <p className="text-gray-500">System will automatically recover corrupted chunks from replicas when detected</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            variant="primary"
            onClick={() => saveSettings('General')}
          >
            Save Settings
          </Button>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card 
        title="Notification Settings" 
        className="mb-5"
        headerAction={<BellIcon className="h-6 w-6 text-gray-500" />}
      >
        <div className="space-y-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="emailNotifications"
                name="emailNotifications"
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={handleNotificationSettingsChange}
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="emailNotifications" className="font-medium text-gray-700">Enable Email Notifications</label>
              <p className="text-gray-500">Receive system alerts via email</p>
            </div>
          </div>
          
          {notificationSettings.emailNotifications && (
            <div>
              <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="emailAddress"
                id="emailAddress"
                value={notificationSettings.emailAddress}
                onChange={handleNotificationSettingsChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          )}
          
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Alert Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="driveFailureAlerts"
                    name="driveFailureAlerts"
                    type="checkbox"
                    checked={notificationSettings.driveFailureAlerts}
                    onChange={handleNotificationSettingsChange}
                    className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="driveFailureAlerts" className="font-medium text-gray-700">Drive Failure Alerts</label>
                  <p className="text-gray-500">Get notified when a drive fails or shows signs of failure</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="dataCorruptionAlerts"
                    name="dataCorruptionAlerts"
                    type="checkbox"
                    checked={notificationSettings.dataCorruptionAlerts}
                    onChange={handleNotificationSettingsChange}
                    className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="dataCorruptionAlerts" className="font-medium text-gray-700">Data Corruption Alerts</label>
                  <p className="text-gray-500">Get notified when data corruption is detected</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="capacityWarnings"
                    name="capacityWarnings"
                    type="checkbox"
                    checked={notificationSettings.capacityWarnings}
                    onChange={handleNotificationSettingsChange}
                    className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="capacityWarnings" className="font-medium text-gray-700">Capacity Warnings</label>
                  <p className="text-gray-500">Get notified when storage capacity crosses threshold</p>
                </div>
              </div>
            </div>
            
            {notificationSettings.capacityWarnings && (
              <div className="mt-4">
                <label htmlFor="capacityThreshold" className="block text-sm font-medium text-gray-700">
                  Capacity Threshold (%)
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="range"
                    name="capacityThreshold"
                    id="capacityThreshold"
                    min="50"
                    max="95"
                    value={notificationSettings.capacityThreshold}
                    onChange={handleNotificationSettingsChange}
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    {notificationSettings.capacityThreshold}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            variant="primary"
            onClick={() => saveSettings('Notification')}
          >
            Save Settings
          </Button>
        </div>
      </Card>

      {/* Account Settings */}
      <Card 
        title="Account Settings" 
        className="mb-5"
        headerAction={<UserCircleIcon className="h-6 w-6 text-gray-500" />}
      >
        <div className="space-y-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img
                className="h-16 w-16 rounded-full"
                src="https://cdn3.iconfinder.com/data/icons/avatars-round-flat/33/man5-512.png"
                alt="Profile"
              />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{accountSettings.username}</h3>
              <p className="text-sm text-gray-500">{accountSettings.role}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                name="username"
                id="username"
                value={accountSettings.username}
                readOnly
                className="mt-1 bg-gray-50 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={accountSettings.email}
                readOnly
                className="mt-1 bg-gray-50 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => toast.info('Password change functionality not implemented in this demo')}
            >
              Change Password
            </Button>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Access Control</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-5 w-5 text-primary-500 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Administrator Access</h4>
                  <p className="text-xs text-gray-500">Full system access with all privileges</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            variant="outline"
            onClick={() => toast.info('Account settings functionality not implemented in this demo')}
          >
            Update Account
          </Button>
        </div>
      </Card>

      {/* System Info */}
      <Card title="System Information">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Software Version</h3>
            <p className="text-sm text-gray-500">Smart Storage System v1.0.0</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700">Last Updated</h3>
            <p className="text-sm text-gray-500">2025-05-27 14:42:51 UTC</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700">Deployment Environment</h3>
            <p className="text-sm text-gray-500">Cloud - Production</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700">License</h3>
            <p className="text-sm text-gray-500">Enterprise Edition - Valid until December 31, 2025</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;