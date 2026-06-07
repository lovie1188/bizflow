# BizFlow Local Startup Guide

## Prerequisites
- Docker Desktop installed and running
  (https://www.docker.com/products/docker-desktop)

## Steps to Start the Application

1. Start the databases (PostgreSQL and Redis):
   docker-compose up -d

2. Start the backend server:
   cd backend
   npm start

3. Start the frontend server:
   cd ../frontend
   npm start

4. Open your browser to http://localhost:3000

## Environment Variables
The backend uses the following environment variables (already set in backend/.env):
- DATABASE_URL=postgresql://postgres:password@localhost:5432/bizflow_dev
- REDIS_URL=redis://localhost:6379
- JWT_SECRET=your_secret_key_min_32_chars_long_here_12345
- PORT=5000
- etc.

The frontend uses:
- REACT_APP_API_BASE=http://localhost:5000/api

## To Stop the Application
- Press Ctrl+C in the terminal windows where npm start is running
- To stop the databases: docker-compose down
