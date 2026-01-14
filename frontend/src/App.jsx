import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DriveManagement from './pages/DriveManagement';
import DataChunks from './pages/DataChunks';
import Policies from './pages/Policies';
import Monitoring from './pages/Monitoring';
import Simulation from './pages/Simulation';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="drives" element={<DriveManagement />} />
        <Route path="chunks" element={<DataChunks />} />
        <Route path="policies" element={<Policies />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="simulation" element={<Simulation />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;