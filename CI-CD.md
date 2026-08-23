# CI/CD Pipeline Setup

This project includes a GitHub Actions workflow for continuous integration and deployment.

## Workflow Overview

The `.github/workflows/ci-cd.yml` workflow:

1. **Runs on every push** to `main` and `develop` branches and pull requests
2. **Builds & tests backend** — runs npm install and npm test
3. **Builds & tests frontend** — runs npm install and npm run build
4. **Builds Docker images** (main branch only) — if Docker Hub credentials provided
5. **Deploys to Heroku** (main branch only) — if Heroku API key provided

## Setting Up GitHub Actions

### 1. Basic Setup (no deployment)

The workflow runs automatically on every push to `main` and `develop` branches. No secrets required—it will build and test code.

### 2. Docker Hub Integration (Push images)

To enable Docker image builds and pushes:

1. Get your Docker Hub credentials
2. Go to **GitHub Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:
   - `DOCKER_USERNAME` — your Docker Hub username
   - `DOCKER_PASSWORD` — your Docker Hub password (or token)

Then on every push to `main`, images will build and push to:
- `docker.io/YOUR_USERNAME/payroll-backend:main`
- `docker.io/YOUR_USERNAME/payroll-frontend:main`

### 3. Heroku Deployment (optional)

To deploy to Heroku:

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Create apps on Heroku:
   ```bash
   heroku create payroll-backend
   heroku create payroll-frontend
   ```
3. Get your Heroku API key:
   ```bash
   heroku authorizations:create
   ```
4. Go to **GitHub Settings** → **Secrets and variables** → **Actions**
5. Add these secrets:
   - `HEROKU_API_KEY` — your Heroku API key
   - `HEROKU_APP_NAME_BACKEND` — backend app name (e.g., `payroll-backend`)
   - `HEROKU_APP_NAME_FRONTEND` — frontend app name (e.g., `payroll-frontend`)

6. Set environment variables on Heroku:
   ```bash
   heroku config:set MONGODB_URI=<your_mongodb_atlas_uri> --app payroll-backend
   heroku config:set JWT_SECRET=<your_secret> --app payroll-backend
   ```

7. On every push to `main`, the workflow will deploy to Heroku.

## Workflow Jobs

### build-backend
- Checks out code
- Sets up Node.js 18
- Installs dependencies
- Runs tests
- Runs linting (if `.eslintrc` exists)

### build-frontend
- Checks out code
- Sets up Node.js 18
- Installs dependencies
- Builds production bundle (`dist/`)
- Uploads artifact for later use

### docker-build
- Triggers only on `main` branch push (requires secrets)
- Builds Docker images for backend and frontend
- Pushes to Docker Hub (if credentials provided)
- Uses BuildKit for layer caching

### deploy-heroku
- Triggers only on `main` branch push (requires Heroku secrets)
- Deploys both backend and frontend to Heroku apps
- Reads `Procfile` for start commands

## Manual Workflow Triggers

View workflow status and manually trigger at:
```
https://github.com/YOUR_USERNAME/payroll-benefits/actions
```

## Disabling or Modifying

To modify the workflow:
1. Edit `.github/workflows/ci-cd.yml`
2. Push changes to a branch
3. Create pull request or push to `main` to test

To disable:
1. Delete `.github/workflows/ci-cd.yml` or rename to `.yml.bak`

## Example: Production Deployment Steps

1. Push code to `main` branch:
   ```bash
   git add .
   git commit -m "Production release"
   git push origin main
   ```

2. GitHub Actions automatically:
   - Runs tests on backend & frontend
   - Builds Docker images (if Docker Hub secrets set)
   - Pushes to Docker Hub (if secrets set)
   - Deploys to Heroku (if Heroku secrets set)

3. Monitor progress at **Actions** tab in your GitHub repo

## Alternative Deployment Platforms

The workflow can be adapted for:

- **AWS ECS** — use AWS credentials to push to ECR and deploy
- **Google Cloud Run** — build and push to Google Container Registry
- **Azure Container Instances** — push to Azure Container Registry
- **DigitalOcean App Platform** — use DigitalOcean API
- **Render, Railway, Fly.io** — deploy via native GitHub integration

Contact your hosting platform's documentation for integration steps.

## Troubleshooting

**Workflow not running?**
- Check `.github/workflows/ci-cd.yml` exists
- Verify branch name is `main` or `develop`
- Check repository Settings → Actions is enabled

**Tests failing?**
- Check workflow logs at Actions tab
- Run tests locally: `npm test` in backend folder
- Fix issues and push again

**Docker push failing?**
- Verify `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets exist
- Test locally: `docker login` and push manually
- Ensure Docker Hub account has permission to push

**Heroku deploy failing?**
- Check Heroku API key is valid
- Verify app names exist on Heroku
- Check `Procfile` exists in backend and frontend
- Review Heroku logs: `heroku logs --tail --app <app-name>`
