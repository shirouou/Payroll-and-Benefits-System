# Docker Deployment Guide

This project includes Docker support for containerized local and cloud deployment.

## Quick Start with Docker Compose

Run the entire stack (MongoDB, backend, frontend) with a single command:

```bash
docker-compose up --build
```

This starts:
- **MongoDB** on `localhost:27017`
- **Backend API** on `localhost:5000`
- **Frontend** on `http://localhost` (port 80)

To stop all services:
```bash
docker-compose down
```

To stop and remove volumes (including database):
```bash
docker-compose down -v
```

## Services

### MongoDB (payroll-mongo)
- Image: `mongo:6.0`
- Port: `27017`
- Database: `payroll-benefits`
- Data persisted in `mongo-data` volume

### Backend (payroll-backend)
- Built from `backend/Dockerfile`
- Port: `5000`
- API available at `http://localhost:5000/api`
- Connects to MongoDB automatically

### Frontend (payroll-frontend)
- Built from `frontend/Dockerfile` with Nginx
- Port: `80`
- Serves React app at `http://localhost`
- Proxies `/api/` requests to backend

## Seeding the Database

After starting the stack, seed the database with sample data:

```bash
# Access the backend container
docker-compose exec backend npm run seed
```

## Environment Variables

The `docker-compose.yml` uses environment variables. To customize:

1. Create a `.env` file in the project root:
```env
JWT_SECRET=your_custom_secret_key
```

2. Run docker-compose (it will use the .env file):
```bash
docker-compose up --build
```

## Building Individual Images

### Backend only
```bash
docker build -t payroll-backend:latest ./backend
docker run -p 5000:5000 -e MONGODB_URI=mongodb://localhost:27017/payroll-benefits payroll-backend:latest
```

### Frontend only
```bash
docker build -t payroll-frontend:latest ./frontend
docker run -p 80:80 payroll-frontend:latest
```

## Pushing to Docker Registry

Push images to Docker Hub or a private registry:

```bash
# Login to Docker Hub
docker login

# Tag images
docker tag payroll-backend:latest YOUR_USERNAME/payroll-backend:latest
docker tag payroll-frontend:latest YOUR_USERNAME/payroll-frontend:latest

# Push
docker push YOUR_USERNAME/payroll-backend:latest
docker push YOUR_USERNAME/payroll-frontend:latest
```

Then update `docker-compose.yml` to use your registry images instead of building locally.

## Production Deployment

For production:
1. Change `NODE_ENV` to `production` in `docker-compose.yml`
2. Set strong `JWT_SECRET` via `.env` file or environment variable
3. Use a managed database (MongoDB Atlas) instead of local container
4. Deploy to a container orchestrator (Docker Swarm, Kubernetes) or managed service (ECS, App Engine)

## Troubleshooting

**Check logs:**
```bash
docker-compose logs -f backend    # Backend logs
docker-compose logs -f frontend   # Frontend logs
docker-compose logs -f mongodb    # MongoDB logs
```

**Rebuild a service:**
```bash
docker-compose up --build backend
```

**Remove all containers and volumes (full reset):**
```bash
docker-compose down -v
docker system prune -a
```
