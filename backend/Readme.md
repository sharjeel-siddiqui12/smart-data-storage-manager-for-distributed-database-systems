# Smart Data Storage for Distributed Database Systems - Backend

This project provides a Node.js backend for a smart data storage mechanism designed for distributed database systems. It features Oracle DB integration, RESTful API endpoints, and advanced management for drives, data chunks, policies, metrics, and simulations.

## Features

- **Oracle Database Integration**: Uses a connection pool for efficient Oracle DB operations.
- **RESTful API**: Endpoints for managing drives, data chunks, distribution policies, system metrics, and simulations.
- **Data Chunk Management**: Create, update, relocate, and replicate data chunks across drives.
- **Drive Management**: Add, update, delete, and monitor drives with health and statistics endpoints.
- **Policy Management**: Define and apply distribution policies for data placement and rebalancing.
- **Metrics & Dashboard**: System health, storage utilization, performance metrics, and optimization recommendations.
- **Simulation Tools**: Simulate drive failures, chunk corruption, high load, and recovery scenarios.
- **Security**: Uses Helmet for HTTP header protection and CORS for cross-origin requests.
- **Logging**: Morgan for request logging and Winston for advanced logging (if configured).

## Project Structure

```
src/
  index.js                # Main server file
  config/database.js      # Oracle DB connection pool and query utilities
  controllers/            # Business logic for each resource
  routes/                 # Express route definitions for API endpoints
```

## Setup & Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/sharjeel-siddiqui12/smart-data-storage-for-distributed-database-systems-backend.git
   cd smart-data-storage-for-distributed-database-systems-backend/backend
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   DB_USER=your_oracle_user
   DB_PASSWORD=your_oracle_password
   DB_CONNECT_STRING=your_oracle_connect_string
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the server**
   ```sh
   npm run dev   # For development (with nodemon)
   npm start     # For production
   ```

## API Endpoints

### Drives
- `GET /api/drives` - List all drives
- `GET /api/drives/:id` - Get drive by ID
- `POST /api/drives` - Create a new drive
- `PUT /api/drives/:id` - Update a drive
- `DELETE /api/drives/:id` - Delete a drive
- `GET /api/drives/health` - Get drives health status
- `GET /api/drives/:id/statistics` - Get drive statistics

### Data Chunks
- `GET /api/chunks` - List all data chunks
- `GET /api/chunks/:id` - Get chunk by ID
- `POST /api/chunks` - Create a new chunk
- `PUT /api/chunks/:id` - Update a chunk
- `DELETE /api/chunks/:id` - Delete a chunk
- `POST /api/chunks/:id/relocate` - Relocate a chunk
- `POST /api/chunks/:id/replicas` - Create limited replicas

### Distribution Policies
- `GET /api/policies` - List all policies
- `GET /api/policies/:id` - Get policy by ID
- `POST /api/policies` - Create a new policy
- `PUT /api/policies/:id` - Update a policy
- `DELETE /api/policies/:id` - Delete a policy
- `GET /api/policies/active` - Get active policy
- `POST /api/policies/rebalance` - Trigger rebalancing

### Metrics & Dashboard
- `GET /api/metrics/system` - System overview metrics
- `GET /api/metrics/health` - System health overview
- `GET /api/metrics/drives` - Drive performance metrics
- `GET /api/metrics/redistributions` - Redistribution history
- `POST /api/metrics/drives` - Record new drive metric
- `GET /api/dashboard/summary` - Dashboard summary
- `GET /api/dashboard/allocation` - Drive allocation analysis
- `GET /api/dashboard/events` - Event timeline
- `GET /api/dashboard/recommendations` - Optimization recommendations

### Simulation
- `POST /api/simulation/drive-failure` - Simulate drive failure
- `POST /api/simulation/chunk-corruption` - Simulate chunk corruption
- `POST /api/simulation/recover-chunk` - Recover corrupted chunk
- `POST /api/simulation/high-load` - Simulate high load
- `POST /api/simulation/generate-chunks` - Generate random chunks
- `POST /api/simulation/reset` - Reset simulation

## Technologies Used

- Node.js
- Express.js
- OracleDB (via `oracledb` package)
- dotenv
- cors
- helmet
- morgan
- winston

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
