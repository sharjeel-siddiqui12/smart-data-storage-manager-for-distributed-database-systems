# Smart Data Storage System

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Application Screenshots](#application-screenshots)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Smart Data Storage Manager** is a comprehensive Smart Data Storage Management System designed to optimize storage utilization, ensure data protection, and provide intelligent drive management capabilities. The system features automated data distribution, real-time monitoring, predictive analytics, and advanced simulation capabilities for testing storage scenarios.

### Key Objectives:
- **Intelligent Storage Management**: Automatic data distribution across multiple drives based on configurable policies
- **Data Protection**: Automated replication and backup strategies with configurable redundancy levels
- **Predictive Analytics**: Real-time monitoring and forecasting of storage trends
- **System Simulation**: Test drive failures and recovery scenarios without affecting production data
- **Performance Optimization**: Minimize data loss, optimize storage utilization, and ensure high availability

---

## ✨ Features

### Core Features

#### 1. **Dashboard & Monitoring**
- Real-time system health overview
- Storage utilization metrics and visualizations
- Drive status monitoring (Healthy, Degraded, Failing, Failed, Maintenance)
- Data protection statistics
- Recent redistribution events tracking
- Alert notifications for critical conditions

#### 2. **Drive Management**
- Add, edit, and delete storage drives
- Configure drive properties (capacity, location, type, backup status)
- Monitor drive health and performance metrics
- View drive-specific statistics
- Support for multiple drive types (HDD, SSD, NVMe)
- Designation of backup drives for redundancy

#### 3. **Data Chunks Management**
- Create and manage data chunks
- Configure chunk priority levels (1-5)
- Enable/disable replication per chunk
- Track chunk locations and replicas
- Monitor chunk status (Active, Corrupted, Migrating)
- Checksum validation for data integrity

#### 4. **Distribution Policies**
- Create custom distribution policies
- Configure minimum replica requirements
- Set rebalance thresholds
- Enable priority-based placement
- Configure locality-aware distribution
- Activate/deactivate policies
- Trigger manual rebalancing operations

#### 5. **Simulation Engine**
- Simulate drive failures (Complete, Degraded, Failing)
- Test data redistribution mechanisms
- Validate failover procedures
- Assess system resilience
- Preview recovery strategies without production impact

#### 6. **Advanced Analytics**
- Historical trend analysis
- Capacity forecasting
- Performance metrics visualization
- Drive health trends
- Replication efficiency analysis
- Storage utilization predictions

#### 7. **Real-time Monitoring**
- Live system metrics dashboard
- Drive performance tracking (Temperature, SMART stats, Error rates, Read/Write speeds)
- Alert system for critical events
- Automated notifications
- Resource utilization graphs

#### 8. **Settings & Configuration**
- Manage alert thresholds
- Configure system preferences
- Set backup schedules
- Customize notification settings
- Define retention policies
- Export/Import configurations

---

## 🛠 Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **React Router** | 6.21.1 | Client-side routing |
| **Vite** | 5.0.8 | Build tool and dev server |
| **Tailwind CSS** | 3.4.0 | Utility-first CSS framework |
| **Recharts** | 2.10.3 | Data visualization and charting |
| **Chart.js** | 4.4.1 | Additional charting capabilities |
| **React Chart.js 2** | 5.2.0 | React wrapper for Chart.js |
| **Axios** | 1.6.3 | HTTP client for API requests |
| **Framer Motion** | 12.15.0 | Animation library |
| **Heroicons** | 2.1.1 | Icon library |
| **Headless UI** | 1.7.17 | Accessible UI components |
| **React Toastify** | 9.1.3 | Notification system |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | LTS | Runtime environment |
| **Express.js** | 4.18.2 | Web application framework |
| **Oracle Database** | XE | Database management system |
| **oracledb** | 6.2.0 | Oracle Database driver for Node.js |
| **CORS** | 2.8.5 | Cross-Origin Resource Sharing |
| **Helmet** | 7.1.0 | Security middleware |
| **Morgan** | 1.10.0 | HTTP request logger |
| **Winston** | 3.11.0 | Logging library |
| **dotenv** | 16.3.2 | Environment variable management |
| **UUID** | 9.0.1 | Unique identifier generation |
| **Nodemon** | 3.0.2 | Development auto-restart tool |

### Database
- **Oracle Database XE (Express Edition)**
  - Connection pooling for optimal performance
  - Stored procedures for complex operations
  - Triggers for automated data management
  - Views for simplified data access

---

## 🏗 System Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  React UI  │  │   Vite     │  │  Tailwind  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                           │
                    HTTP/REST API (Port 5000)
                           │
┌─────────────────────────────────────────────────────────────┐
│                        Backend Layer                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Express   │  │  Middleware│  │ Controllers │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                           │
                   Oracle Database Connection Pool
                           │
┌─────────────────────────────────────────────────────────────┐
│                       Database Layer                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Tables   │  │  Procedures│  │  Triggers   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow
1. User interacts with React frontend
2. Frontend makes API requests via Axios
3. Express backend receives and validates requests
4. Controllers process business logic
5. Database operations executed via connection pool
6. Results returned through the same chain
7. Frontend updates UI with data and notifications

---

## 📁 Project Structure

### Root Directory
```
smart data storage manager for distributed-database-systems/
├── LICENSE                          # Project license
├── readme.md                        # This file
├── backend/                         # Backend application
├── frontend/                        # Frontend application
└── Screenshots/                     # Application screenshots
```

### Backend Structure
```
backend/
├── .env                            # Environment variables (DB config)
├── .gitignore                      # Git ignore rules
├── LICENSE                         # Backend license
├── package.json                    # Dependencies and scripts
├── Readme.md                       # Backend documentation
└── src/
    ├── index.js                    # Application entry point
    ├── config/
    │   └── database.js             # Oracle DB connection pool config
    ├── controllers/
    │   ├── chunkController.js      # Data chunk operations
    │   ├── dashboardController.js  # Dashboard data aggregation
    │   ├── driveController.js      # Drive management operations
    │   ├── metricController.js     # Metrics collection and reporting
    │   ├── policyController.js     # Distribution policy management
    │   └── simulationController.js # Failure simulation logic
    └── routes/
        ├── chunks.js               # Chunk API endpoints
        ├── dashboard.js            # Dashboard API endpoints
        ├── drives.js               # Drive API endpoints
        ├── metrics.js              # Metrics API endpoints
        ├── policies.js             # Policy API endpoints
        └── simulation.js           # Simulation API endpoints
```

#### Backend Components Explanation

**`index.js`** - Main application file that:
- Initializes Express server
- Configures middleware (CORS, Helmet, Morgan)
- Sets up database connection pool
- Registers all API routes
- Implements error handling
- Manages graceful shutdown

**`config/database.js`** - Database configuration that:
- Creates Oracle connection pool
- Manages connection lifecycle
- Provides query execution helpers
- Handles connection errors
- Implements connection pooling strategies

**Controllers** - Business logic handlers:
- `chunkController.js`: CRUD operations for data chunks, replica management
- `dashboardController.js`: Aggregates system metrics, health status, alerts
- `driveController.js`: Drive CRUD, health monitoring, statistics
- `metricController.js`: Collects and reports performance metrics
- `policyController.js`: Manages distribution policies, triggers rebalancing
- `simulationController.js`: Simulates failures, tests recovery procedures

**Routes** - RESTful API endpoints:
- Define HTTP methods (GET, POST, PUT, DELETE)
- Map URLs to controller functions
- Implement route-level middleware
- Handle request validation

### Frontend Structure
```
frontend/
├── .gitignore                      # Git ignore rules
├── eslint.config.js                # ESLint configuration
├── index.html                      # HTML entry point
├── LICENSE                         # Frontend license
├── package.json                    # Dependencies and scripts
├── postcss.config.js               # PostCSS configuration
├── README.md                       # Frontend documentation
├── tailwind.config.js              # Tailwind CSS configuration
├── vite.config.js                  # Vite build configuration
├── public/                         # Static assets
└── src/
    ├── App.css                     # Application styles
    ├── App.jsx                     # Main App component with routing
    ├── index.css                   # Global styles
    ├── main.jsx                    # React entry point
    ├── assets/                     # Images and static files
    ├── components/
    │   ├── Header.jsx              # Top navigation bar
    │   ├── Layout.jsx              # Main layout wrapper
    │   ├── Sidebar.jsx             # Side navigation menu
    │   └── ui/
    │       ├── Button.jsx          # Reusable button component
    │       ├── Card.jsx            # Card container component
    │       ├── EmptyState.jsx      # Empty state placeholder
    │       ├── LoadingState.jsx    # Loading spinner component
    │       ├── Modal.jsx           # Modal dialog component
    │       └── StatusBadge.jsx     # Status indicator badge
    ├── pages/
    │   ├── Analytics.jsx           # Analytics and trends page
    │   ├── Dashboard.jsx           # Main dashboard page
    │   ├── DataChunks.jsx          # Data chunks management page
    │   ├── DriveManagement.jsx     # Drive management page
    │   ├── Monitoring.jsx          # Real-time monitoring page
    │   ├── NotFound.jsx            # 404 error page
    │   ├── Policies.jsx            # Distribution policies page
    │   ├── Settings.jsx            # System settings page
    │   └── Simulation.jsx          # Simulation testing page
    └── services/
        └── api.js                  # Axios API client configuration
```

#### Frontend Components Explanation

**`App.jsx`** - Main application component:
- Defines application routing using React Router
- Wraps pages with Layout component
- Handles route-based navigation

**`Layout.jsx`** - Main layout wrapper:
- Contains Header and Sidebar components
- Provides consistent layout across pages
- Manages responsive design

**`Header.jsx`** - Top navigation:
- Displays application title
- Shows user information
- Contains global actions

**`Sidebar.jsx`** - Side navigation:
- Lists all available pages
- Highlights active route
- Responsive collapsible menu

**UI Components** - Reusable building blocks:
- `Button.jsx`: Styled button with variants (primary, secondary, danger)
- `Card.jsx`: Container for content sections
- `EmptyState.jsx`: Shows when no data is available
- `LoadingState.jsx`: Displays during data loading
- `Modal.jsx`: Overlay dialog for forms and confirmations
- `StatusBadge.jsx`: Color-coded status indicators

**Pages** - Feature-specific views:
- Each page corresponds to a main feature
- Implements data fetching and state management
- Renders UI components with data
- Handles user interactions

**`services/api.js`** - API client:
- Configures Axios instance
- Defines API methods for all endpoints
- Handles request/response transformation
- Centralizes API communication

---

## 📋 Prerequisites

Before installing and running the application, ensure you have the following:

### Required Software
1. **Node.js** (v18.0.0 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (v9.0.0 or higher) or **yarn**
   - Comes with Node.js
   - Verify installation: `npm --version`

3. **Oracle Database XE** (Express Edition)
   - Download from: https://www.oracle.com/database/technologies/xe-downloads.html
   - Required for backend database operations
   - Default connection: `localhost:1521/XE`

4. **Oracle Instant Client** (for Node.js Oracle driver)
   - Download from: https://www.oracle.com/database/technologies/instant-client/downloads.html
   - Required for `oracledb` npm package

### Optional Tools
- **Git** - For version control
- **Postman** - For API testing
- **VS Code** - Recommended code editor

---

## 🚀 Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/sharjeel-siddiqui12/smart-data-storage-manager-for-distributed-database-systems.git
cd smart-data-storage-manager-for-distributed-database-systems
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### Step 4: Database Setup

1. **Connect to Oracle Database** using SQL*Plus or SQL Developer

2. **Create Database User**
```sql
CREATE USER smartdatamanager IDENTIFIED BY smartdatamanager12;
GRANT CONNECT, RESOURCE TO smartdatamanager;
GRANT CREATE VIEW TO smartdatamanager;
GRANT CREATE PROCEDURE TO smartdatamanager;
GRANT CREATE TRIGGER TO smartdatamanager;
ALTER USER smartdatamanager QUOTA UNLIMITED ON USERS;
```

3. **Create Database Tables**
```sql
-- Drives table
CREATE TABLE drives (
    drive_id VARCHAR2(50) PRIMARY KEY,
    drive_name VARCHAR2(100) NOT NULL,
    location VARCHAR2(200),
    capacity NUMBER NOT NULL,
    available_space NUMBER NOT NULL,
    status VARCHAR2(20) DEFAULT 'HEALTHY',
    drive_type VARCHAR2(20) DEFAULT 'HDD',
    is_backup NUMBER(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data chunks table
CREATE TABLE data_chunks (
    chunk_id VARCHAR2(50) PRIMARY KEY,
    chunk_name VARCHAR2(200) NOT NULL,
    size_mb NUMBER NOT NULL,
    drive_id VARCHAR2(50) NOT NULL,
    priority NUMBER DEFAULT 3,
    replicated NUMBER(1) DEFAULT 0,
    status VARCHAR2(20) DEFAULT 'ACTIVE',
    checksum VARCHAR2(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (drive_id) REFERENCES drives(drive_id)
);

-- Chunk replicas table
CREATE TABLE chunk_replicas (
    replica_id VARCHAR2(50) PRIMARY KEY,
    chunk_id VARCHAR2(50) NOT NULL,
    drive_id VARCHAR2(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chunk_id) REFERENCES data_chunks(chunk_id) ON DELETE CASCADE,
    FOREIGN KEY (drive_id) REFERENCES drives(drive_id)
);

-- Distribution policies table
CREATE TABLE distribution_policies (
    policy_id VARCHAR2(50) PRIMARY KEY,
    policy_name VARCHAR2(100) NOT NULL,
    min_replicas NUMBER DEFAULT 2,
    rebalance_threshold NUMBER DEFAULT 80,
    priority_based_placement NUMBER(1) DEFAULT 1,
    locality_aware NUMBER(1) DEFAULT 0,
    active NUMBER(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Redistribution logs table
CREATE TABLE redistribution_logs (
    log_id VARCHAR2(50) PRIMARY KEY,
    chunk_id VARCHAR2(50),
    source_drive_id VARCHAR2(50),
    target_drive_id VARCHAR2(50),
    reason VARCHAR2(500),
    status VARCHAR2(20),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (chunk_id) REFERENCES data_chunks(chunk_id),
    FOREIGN KEY (source_drive_id) REFERENCES drives(drive_id),
    FOREIGN KEY (target_drive_id) REFERENCES drives(drive_id)
);

-- Drive metrics table
CREATE TABLE drive_metrics (
    metric_id VARCHAR2(50) PRIMARY KEY,
    drive_id VARCHAR2(50) NOT NULL,
    temperature NUMBER,
    read_speed NUMBER,
    write_speed NUMBER,
    error_rate NUMBER DEFAULT 0,
    uptime_hours NUMBER,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (drive_id) REFERENCES drives(drive_id)
);
```

4. **Create Stored Procedures** (for automated data redistribution)
```sql
-- Add your stored procedures here based on your specific requirements
-- Example: redistribute_data_from_drive procedure
```

---

## ⚙ Configuration

### Backend Configuration

1. **Create `.env` file** in the `backend` directory:
```env
# Database Configuration
DB_USER=smartdatamanager
DB_PASSWORD=smartdatamanager12
DB_CONNECT_STRING=localhost:1521/XE

# Server Configuration
PORT=5000
NODE_ENV=development

# Logging
LOG_LEVEL=info
```

2. **Environment Variables Explanation**:
- `DB_USER`: Oracle database username
- `DB_PASSWORD`: Oracle database password
- `DB_CONNECT_STRING`: Oracle connection string (host:port/service)
- `PORT`: Backend server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging verbosity (info/debug/error)

### Frontend Configuration

1. **Update API Base URL** in `frontend/src/services/api.js`:
```javascript
const api = axios.create({
  baseURL: "/api",  // Uses proxy in development
  headers: {
    "Content-Type": "application/json",
  },
});
```

2. **Configure Vite Proxy** in `frontend/vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

### Oracle Instant Client Configuration

For Windows:
1. Download Oracle Instant Client
2. Extract to `C:\oracle\instantclient_XX_X`
3. Add to PATH environment variable
4. Restart terminal/IDE

For Linux/Mac:
1. Install via package manager or download
2. Set `LD_LIBRARY_PATH` (Linux) or `DYLD_LIBRARY_PATH` (Mac)
3. Restart terminal

---

## ▶ Running the Application

### Development Mode

#### Start Backend Server
```bash
cd backend
npm run dev
```
Backend will start on `http://localhost:5000`

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend will start on `http://localhost:5173`

### Production Mode

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Start Backend
```bash
cd backend
npm start
```

#### Serve Frontend Build
Configure Express to serve frontend build:
```javascript
// In backend/src/index.js
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
```

### Verify Installation

1. **Backend Health Check**: Visit `http://localhost:5000/`
   - Should return JSON: `{"message": "Welcome to Smart Storage System API", "version": "1.0.0"}`

2. **Frontend Access**: Visit `http://localhost:5173/`
   - Should display the dashboard page

3. **API Test**: Check drives endpoint
```bash
curl http://localhost:5000/api/drives
```

---

## 📸 Application Screenshots

### 1. Dashboard Overview

The main dashboard provides a comprehensive view of the entire storage system's health and performance.

![Dashboard View 1](Screenshots/dashboard1.png)<br>
*Dashboard showing system health, storage utilization, and drive statistics*

![Dashboard View 2](Screenshots/dashboard2.png)<br>
*Dashboard displaying data protection metrics and recent redistribution events*

**Features shown:**
- System health status indicator (Healthy/Warning/Critical)
- Storage utilization percentage with visual gauge
- Total and used capacity metrics
- Drive status breakdown (Healthy, Degraded, Failing, Failed, Maintenance)
- Data protection statistics with percentage protected
- Recent redistribution events log
- Quick action buttons for common tasks
- Real-time alert notifications

---

### 2. Drive Management

Comprehensive drive management interface for adding, monitoring, and maintaining storage drives.

![Drive Management](Screenshots/driveManagement.png)<br>
*Drive management page showing all configured drives with their status and capacity*

![Add New Drive](Screenshots/driveManagementAddDrive.png)<br>
*Modal form for adding a new drive to the system*

**Features shown:**
- List of all drives with key information:
  - Drive name and location
  - Drive type (HDD, SSD, NVMe)
  - Capacity and available space
  - Status indicators
  - Backup drive designation
- Add new drive functionality with form fields:
  - Drive name and location
  - Capacity configuration
  - Drive type selection
  - Status setting
  - Backup drive checkbox
- Edit and delete drive actions
- Color-coded status badges
- Capacity utilization bars

---

### 3. Data Chunks Management

Interface for managing data chunks, their distribution, and replication status.

![Data Chunks Management](Screenshots/dataChunksManagement.png)<br>
*Data chunks listing with status, location, and replication information*

![Add Data Chunk](Screenshots/dataChunksManagementAddDataChunk.png)<br>
*Form for creating a new data chunk with priority and replication settings*

**Features shown:**
- Comprehensive chunk listing:
  - Chunk name and size
  - Storage location (drive)
  - Priority level (1-5)
  - Replication status
  - Status indicators (Active, Corrupted, Migrating)
  - Checksum for data integrity
- Add new chunk functionality:
  - Chunk name and size input
  - Drive selection dropdown
  - Priority level slider
  - Replication toggle
  - Checksum input for verification
- Edit and delete chunk operations
- Replica information display
- Search and filter capabilities

---

### 4. Distribution Policies

Policy management for controlling how data is distributed and replicated across drives.

![Policies List](Screenshots/policies.png)<br>
*Distribution policies overview with configuration details*

![Add New Policy](Screenshots/addNewPolicy.png)<br>
*Create new distribution policy with customizable parameters*

**Features shown:**
- Policy list displaying:
  - Policy name
  - Minimum replicas configuration
  - Rebalance threshold percentage
  - Priority-based placement setting
  - Locality-aware option
  - Active/inactive status
- Create new policy form:
  - Policy name input
  - Minimum replicas selector
  - Rebalance threshold slider
  - Priority-based placement toggle
  - Locality-aware toggle
  - Active status checkbox
- Edit and delete policy actions
- Manual rebalancing trigger button
- Policy activation controls
- Warning indicators for backup drive availability

---

### 5. Monitoring & Metrics

Real-time monitoring dashboard for tracking drive performance and system health.

![Monitoring View 1](Screenshots/monitoring1.png)<br>
*Real-time metrics showing drive performance and health indicators*

![Monitoring View 2](Screenshots/monitoring2.png)<br>
*Detailed drive metrics including temperature, speeds, and error rates*

**Features shown:**
- Live system metrics:
  - CPU and memory utilization
  - Network I/O statistics
  - Active connections count
- Drive-specific metrics:
  - Temperature monitoring
  - Read/Write speeds
  - Error rate tracking
  - SMART status indicators
  - Uptime tracking
- Real-time charts and graphs
- Alert thresholds visualization
- Historical data trends
- Refresh controls for live updates
- Export metrics functionality

---

### 6. Simulation Testing

Safe environment for testing drive failures and recovery procedures.

![Simulation View 1](Screenshots/simulation1.png)<br>
*Simulation interface for testing drive failure scenarios*

![Simulation View 2](Screenshots/simulation2.png)<br>
*Simulation results showing redistribution and recovery actions*

![Simulation View 3](Screenshots/simulation3.png)<br>
*Detailed simulation log with step-by-step recovery process*

**Features shown:**
- Drive failure simulation:
  - Select drive to simulate failure
  - Choose failure type (Complete, Degraded, Failing)
  - Run simulation button
- Simulation results display:
  - Affected chunks list
  - Redistribution plan
  - Recovery status
  - Time estimates
- Step-by-step process visualization
- Undo/Reset simulation controls
- Safety warnings and confirmations
- Simulation history log
- Impact analysis preview

---

### 7. Analytics & Trends

Advanced analytics for capacity planning and performance optimization.

![Analytics View 1](Screenshots/analytics1.png)<br>
*Historical trends and capacity forecasting*

![Analytics View 2](Screenshots/analytics2.png)<br>
*Drive health trends over time*

![Analytics View 3](Screenshots/analytics3.png)<br>
*Replication efficiency and data distribution analysis*

![Analytics View 4](Screenshots/analytics4.png)<br>
*Predictive analytics and recommendations*

**Features shown:**
- Capacity trends:
  - Historical usage patterns
  - Growth rate calculations
  - Capacity forecasting
  - Projected depletion dates
- Performance analytics:
  - Average read/write speeds
  - Response time trends
  - Throughput analysis
- Health analytics:
  - Drive failure predictions
  - SMART status trends
  - Error rate patterns
- Replication efficiency:
  - Protection coverage percentage
  - Replication lag metrics
  - Distribution balance
- Interactive charts:
  - Time range selectors
  - Zoom and pan controls
  - Export to CSV/PDF
- Recommendations engine

---

### 8. System Settings

Configuration interface for system-wide preferences and thresholds.

![Settings View 1](Screenshots/settings1.png)<br>
*General system settings and preferences*

![Settings View 2](Screenshots/settings2.png)<br>
*Alert configuration and threshold settings*

![Settings View 3](Screenshots/settings3.png)<br>
*Backup schedules and retention policies*

**Features shown:**
- General settings:
  - System name and description
  - Default policy selection
  - Auto-rebalancing toggle
  - Maintenance window configuration
- Alert settings:
  - Temperature threshold
  - Capacity warning level
  - Error rate threshold
  - Notification preferences
- Backup configuration:
  - Backup schedule (daily, weekly, monthly)
  - Retention period settings
  - Backup location specification
  - Auto-cleanup options
- Advanced settings:
  - Connection pool size
  - Query timeout values
  - Logging level
  - Performance tuning options
- Import/Export configuration
- Reset to defaults option

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Drives Endpoints

#### Get All Drives
```http
GET /drives
```
**Response:**
```json
[
  {
    "DRIVE_ID": "DRV-001",
    "DRIVE_NAME": "Primary SSD",
    "LOCATION": "Server Rack A1",
    "CAPACITY": 512000,
    "AVAILABLE_SPACE": 300000,
    "STATUS": "HEALTHY",
    "DRIVE_TYPE": "SSD",
    "IS_BACKUP": 0,
    "CREATED_AT": "2025-01-01T10:00:00.000Z",
    "UPDATED_AT": "2025-01-15T08:30:00.000Z"
  }
]
```

#### Get Drive by ID
```http
GET /drives/:id
```

#### Create Drive
```http
POST /drives
Content-Type: application/json

{
  "driveName": "Backup HDD 1",
  "location": "Server Rack B2",
  "capacity": 1024000,
  "availableSpace": 1024000,
  "status": "HEALTHY",
  "driveType": "HDD",
  "isBackup": true
}
```

#### Update Drive
```http
PUT /drives/:id
Content-Type: application/json

{
  "status": "MAINTENANCE"
}
```

#### Delete Drive
```http
DELETE /drives/:id
DELETE /drives/:id?force=true  (Force delete with data)
```

### Data Chunks Endpoints

#### Get All Chunks
```http
GET /chunks
```

#### Get Chunk by ID
```http
GET /chunks/:id
```
**Response includes replicas:**
```json
{
  "CHUNK_ID": "CHUNK-001",
  "CHUNK_NAME": "UserData_2025",
  "SIZE_MB": 150,
  "DRIVE_ID": "DRV-001",
  "PRIORITY": 4,
  "REPLICATED": 1,
  "STATUS": "ACTIVE",
  "CHECKSUM": "abc123...",
  "replicas": [
    {
      "REPLICA_ID": "REP-001",
      "CHUNK_ID": "CHUNK-001",
      "DRIVE_ID": "DRV-002",
      "DRIVE_NAME": "Backup SSD"
    }
  ]
}
```

#### Create Chunk
```http
POST /chunks
Content-Type: application/json

{
  "chunkName": "ImportantData_Jan2025",
  "sizeMb": 250,
  "driveId": "DRV-001",
  "priority": 5,
  "replicated": true,
  "checksum": "sha256hash..."
}
```

#### Update Chunk
```http
PUT /chunks/:id
```

#### Delete Chunk
```http
DELETE /chunks/:id
```

### Policies Endpoints

#### Get All Policies
```http
GET /policies
```

#### Create Policy
```http
POST /policies
Content-Type: application/json

{
  "policyName": "High Availability Policy",
  "minReplicas": 3,
  "rebalanceThreshold": 80,
  "priorityBasedPlacement": true,
  "localityAware": true
}
```

#### Update Policy
```http
PUT /policies/:id
```

#### Delete Policy
```http
DELETE /policies/:id
```

#### Trigger Rebalancing
```http
POST /policies/rebalance
Content-Type: application/json

{
  "policyId": "POLICY-001"
}
```

### Dashboard Endpoints

#### Get Dashboard Summary
```http
GET /dashboard/summary
```
**Response:**
```json
{
  "systemHealth": {
    "OVERALL_HEALTH": "HEALTHY",
    "STORAGE_UTILIZATION": 45.5,
    "TOTAL_CAPACITY_GB": 1024,
    "USED_CAPACITY_GB": 466,
    "HEALTHY_DRIVES": 5,
    "DEGRADED_DRIVES": 0,
    "FAILING_DRIVES": 0,
    "FAILED_DRIVES": 0
  },
  "dataProtection": {
    "TOTAL_CHUNKS": 150,
    "PROTECTED_CHUNKS": 130,
    "PROTECTION_PERCENTAGE": 86.67
  },
  "recentEvents": [...]
}
```

### Metrics Endpoints

#### Get System Metrics
```http
GET /metrics
```

#### Record Drive Metric
```http
POST /metrics
Content-Type: application/json

{
  "driveId": "DRV-001",
  "temperature": 45,
  "readSpeed": 520,
  "writeSpeed": 480,
  "errorRate": 0.001,
  "uptimeHours": 720
}
```

### Simulation Endpoints

#### Simulate Drive Failure
```http
POST /simulation/drive-failure
Content-Type: application/json

{
  "driveId": "DRV-001",
  "failureType": "complete"  // or "degraded", "failing"
}
```

#### Get Simulation Results
```http
GET /simulation/results/:simulationId
```

---

## 🗄 Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│     DRIVES      │         │  DATA_CHUNKS    │
├─────────────────┤         ├─────────────────┤
│ drive_id (PK)   │◄────────│ chunk_id (PK)   │
│ drive_name      │    1:N  │ chunk_name      │
│ location        │         │ size_mb         │
│ capacity        │         │ drive_id (FK)   │
│ available_space │         │ priority        │
│ status          │         │ replicated      │
│ drive_type      │         │ status          │
│ is_backup       │         │ checksum        │
│ created_at      │         │ created_at      │
│ updated_at      │         │ updated_at      │
└─────────────────┘         └─────────────────┘
                                      │
                                     1:N
                                      │
                           ┌─────────────────┐
                           │ CHUNK_REPLICAS  │
                           ├─────────────────┤
                           │ replica_id (PK) │
                           │ chunk_id (FK)   │
                           │ drive_id (FK)   │
                           │ created_at      │
                           └─────────────────┘

┌──────────────────────┐   ┌──────────────────────┐
│ DISTRIBUTION_POLICIES│   │ REDISTRIBUTION_LOGS  │
├──────────────────────┤   ├──────────────────────┤
│ policy_id (PK)       │   │ log_id (PK)          │
│ policy_name          │   │ chunk_id (FK)        │
│ min_replicas         │   │ source_drive_id (FK) │
│ rebalance_threshold  │   │ target_drive_id (FK) │
│ priority_based       │   │ reason               │
│ locality_aware       │   │ status               │
│ active               │   │ started_at           │
│ created_at           │   │ completed_at         │
│ updated_at           │   └──────────────────────┘
└──────────────────────┘

┌─────────────────┐
│  DRIVE_METRICS  │
├─────────────────┤
│ metric_id (PK)  │
│ drive_id (FK)   │
│ temperature     │
│ read_speed      │
│ write_speed     │
│ error_rate      │
│ uptime_hours    │
│ recorded_at     │
└─────────────────┘
```

### Table Descriptions

**DRIVES**: Stores information about all storage drives in the system
- Primary storage and backup drives
- Capacity tracking and utilization
- Health status monitoring

**DATA_CHUNKS**: Represents data units stored across drives
- Flexible size configuration
- Priority-based management
- Checksum validation

**CHUNK_REPLICAS**: Tracks replicated copies of data chunks
- Ensures data redundancy
- Enables disaster recovery
- Supports multiple replica locations

**DISTRIBUTION_POLICIES**: Defines rules for data distribution
- Configurable replication requirements
- Load balancing thresholds
- Placement strategies

**REDISTRIBUTION_LOGS**: Audit trail of data movement
- Tracks chunk migrations
- Records reasons for redistribution
- Monitors operation status

**DRIVE_METRICS**: Performance and health metrics
- Real-time monitoring data
- Historical trend analysis
- Predictive maintenance support

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/YourFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add YourFeature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/YourFeature
   ```
5. **Open a Pull Request**

### Code Style Guidelines
- Follow existing code formatting
- Add comments for complex logic
- Write meaningful commit messages
- Update documentation as needed
- Add tests for new features

---

## 📄 License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

---

## 📞 Support & Contact

For issues, questions, or contributions:
- **GitHub Issues**: Create an issue for bug reports or feature requests
- **Documentation**: Refer to this README and inline code comments
- **Wiki**: Check the project wiki for additional guides

---

## 🎯 Future Enhancements

Planned features for future releases:
- [ ] Cloud storage integration (AWS S3, Azure Blob)
- [ ] Machine learning for predictive failure analysis
- [ ] Multi-tenant support with role-based access control
- [ ] Email/SMS notification system
- [ ] Mobile application for monitoring
- [ ] Automated backup scheduling
- [ ] Data encryption at rest and in transit
- [ ] Integration with monitoring tools (Prometheus, Grafana)
- [ ] Performance benchmarking suite
- [ ] Docker containerization
- [ ] Kubernetes deployment configurations
- [ ] Advanced reporting and export features

---

## 🙏 Acknowledgments

Built with modern web technologies and best practices:
- React ecosystem for powerful UI development
- Express.js for robust backend APIs
- Oracle Database for enterprise-grade data management
- Open-source community for excellent libraries and tools

---

**Version**: 1.0.0  
**Last Updated**: January 15, 2026  
**Status**: Active Development

---

*For detailed technical documentation, API references, and advanced configuration options, please refer to the individual README files in the `backend` and `frontend` directories.*
