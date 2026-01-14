# Smart Storage System Dashboard (Frontend)

A modern React + Vite dashboard for monitoring, managing, and simulating large-scale distributed storage systems. This frontend provides real-time analytics, drive and data chunk management, policy configuration, system monitoring, and simulation tools for administrators.

## Features

- **Dashboard**: Overview of system health, storage utilization, protection status, and recent events.
- **Drive Management**: Add, edit, and monitor drives; view utilization, performance metrics, and status.
- **Data Chunks**: Manage data chunks, set priorities, replicate for redundancy, and relocate between drives.
- **Policies**: Configure storage policies, set replication and rebalancing rules, enable priority-based and locality-aware placement.
- **Monitoring**: Visualize drive metrics, system health, and redistribution history with interactive charts.
- **Simulation**: Test scenarios such as drive failures, data corruption, and high load conditions.
- **Analytics**: Advanced charts for drive utilization, location distribution, drive types, and optimization recommendations.
- **Settings**: User profile, access control, and system information.

## Tech Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **UI**: [Tailwind CSS](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Heroicons](https://heroicons.com/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Notifications**: [React Toastify](https://fkhadra.github.io/react-toastify/)
- **State Management**: React hooks
- **API Integration**: Custom service layer (`src/services/api.js`)

## Project Structure

```
src/
  components/      # Reusable UI components (Sidebar, Header, Card, Modal, etc.)
  pages/           # Main pages (Dashboard, DriveManagement, DataChunks, Policies, Monitoring, Simulation, Analytics, Settings)
  services/        # API service layer
  index.css        # Global styles (Tailwind)
  App.jsx          # Main app routing
  main.jsx         # App entry point
public/
  storage-icon.svg # App favicon
index.html         # Main HTML file
tailwind.config.js # Tailwind configuration
```

## Usage

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Configuration

- API endpoints are configured in [`src/services/api.js`](src/services/api.js).
- Tailwind theme colors are customized in [`tailwind.config.js`](tailwind.config.js).

## Screenshots

> Add screenshots of dashboard, drive management, analytics, and simulation pages here.

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Create a Pull Request

## License

MIT

## Authors

- Sharjeel Siddiqui (System Administrator)

---

**Smart Storage System** – Efficient, reliable, and scalable storage management for distributed