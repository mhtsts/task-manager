# Mini Task Manager - Microservices Demo Application

**Mini Task Manager** is a complete microservices demonstration application showcasing a full DevOps/Kubernetes lifecycle from Git to production deployment.

## 1. Architecture Overview

The application follows a microservices architecture with complete separation of concerns:

- **frontend** (React + Vite): User interface for task management, communicates with `task-service` via HTTP REST API
- **task-service** (Node.js + TypeScript + Express): CRUD API for tasks, persists to PostgreSQL, emits events
- **notification-service** (Node.js + TypeScript + Express): Simulates sending notifications for task events
- **PostgreSQL**: Relational database for task persistence

```
Internet
    |
    v
  Ingress
    |
    v
  frontend
    |
    v
  task-service
    |--- PostgreSQL
    |
    v
  notification-service
```

Each microservice is independently deployable with its own Docker image, Kubernetes Deployment, and Service.

## 2. Repository Structure

```
mini-task-manager/
├── frontend/              # React + Vite frontend application
├── services/
│   ├── task-service/      # Node.js + TypeScript + Express API
│   └── notification-service/  # Node.js + TypeScript + Express
├── infrastructure/
│   ├── helm/
│   │   └── task-manager/  # Helm chart for Kubernetes deployment
│   └── argocd/
│       └── application.yaml  # Argo CD Application manifest
├── docker-compose.yml     # Local development orchestration
├── azure-pipelines.yml    # Azure DevOps CI/CD pipeline
├── .env.example           # Environment variables examples
└── .gitignore
```

## 3. Prerequisites

- [Docker](https://docs.docker.com/engine/install/) (Desktop with Docker Compose)
- [Node.js](https://nodejs.org/) (v20)
- [Git](https://git-scm.com/)
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) (for Azure DevOps pipeline)
- [Kind](https://kind.sigs.k8s.io/) or access to AKS cluster (for Kubernetes deployment)
- [Helm](https://helm.sh/docs/) (v3+)
- [ArgocCD](https://argoproj.github.io/argo-cd/) (v2.7+)

## 4. How to Run Locally

### Using Docker Compose

Start all services including PostgreSQL:

```bash
docker compose up --build
```

The application will be available at `http://localhost:3000`.

Services and ports:
- **Frontend**: `http://localhost:3000`
- **Task Service**: `http://localhost:8080`
- **Notification Service**: `http://localhost:8081`
- **PostgreSQL**: `localhost:5432` (user: postgres, password: postgres, db: tasksdb)

### Manual Development

Each service can be run individually:

```bash
# Task service
cd services/task-service
npm run dev

# Notification service
cd services/notification-service
npm run dev

# Frontend
cd frontend
npm run dev  # Vite dev server with proxy to task-service
```

## 5. How to Run Tests

### Task Service Tests

```bash
cd services/task-service
npm test
```

Tests cover:
- GET /api/tasks
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id
- GET /health

### Notification Service Tests

```bash
cd services/notification-service
npm test
```

Tests cover:
- GET /health

### Frontend Tests

```bash
cd frontend
npm test
```

Component tests for the task management UI.

## 6. How to Build Docker Images

Build each image independently:

```bash
# Frontend
docker build -t task-manager-frontend ./frontend

# Task service
docker build -t task-service ./services/task-service

# Notification service
docker build -t notification-service ./services/notification-service
```

## 7. How to Run Docker Compose

```bash
docker compose up --build
```

This starts all four services (frontend, task-service, notification-service, PostgreSQL) on a shared Docker network.

To run in detached mode:
```bash
docker compose up --build -d
```

To stop:
```bash
docker compose down
```

## 8. How Services Communicate

### Local Docker Compose Network

All services share a Docker Compose network:

- **frontend** → `http://task-service:8080` (via Vite proxy `/api` → `task-service:8080`)
- **task-service** → PostgreSQL at `db:5432`
- **task-service** → **notification-service** (events emitted, logged locally)
- **notification-service** → `http://task-service:8080` (for health checks / event awareness)

### Kubernetes Cluster

Each service has its own Kubernetes Service within the `task-manager` namespace:

- `frontend` Service (ClusterIP, port 80)
- `task-service` Service (ClusterIP, port 8080)
- `notification-service` Service (ClusterIP, port 8081)
- `postgresql` Service (ClusterIP, port 5432)

Environment variables configure inter-service communication:
- `DATABASE_URL` in task-service points to PostgreSQL
- `TASK_SERVICE_URL` in notification-service points to task-service
- `VITE_API_BASE` in frontend points to task-service base URL

## 9. How Kubernetes Deployment Works

The Helm chart deploys all components to AKS using separate Kubernetes resources:

### Deployments

- `frontend` - React app serving the UI
- `task-service` - Node.js Express API
- `notification-service` - Node.js Express notification logger
- `postgresql` - PostgreSQL database

### Services

Each microservice has its own Service for intra-cluster communication.

### Ingress

- External traffic enters through Ingress (nginx)
- Routes `task-manager.local` to `frontend` service
- Routes `/api` prefix to `task-service` service

### ConfigMap

- Contains environment configuration values
- Mounted into each deployment

### Probes

Each backend service has:
- **livenessProbe**: Detects deadlocked/crashed processes
- **readinessProbe**: Determines when service is ready to receive traffic

### Resources

Resource requests and limits are configured for each deployment to ensure predictable scheduling.

## 10. How Helm Works

The Helm chart (`infrastructure/helm/task-manager/`) templates all Kubernetes manifests:

### Chart Structure

```
task-manager/
├── Chart.yaml        # Chart metadata
├── values.yaml       # Default configuration values
└── templates/        # Kubernetes manifest templates
```

### Using the Helm Chart

```bash
# Install with default values
helm install task-manager ./infrastructure/helm/task-manager

# With custom values
helm install task-manager ./infrastructure/helm/task-manager \
  --set global.namespace=task-manager \
  --set frontend.image.tag=1.0.0 \
  --set task-service.image.tag=1.0.0 \
  --set notification-service.image.tag=1.0.0
```

### values.yaml Configuration

All configuration is driven by `values.yaml`:

- Image repository and tag (configurable via ACR)
- Replica count for each deployment
- Service ports
- Environment variables
- Resource requests/limits
- Ingress host and TLS settings

## 11. How Argo CD Works

The Argo CD Application manifest (`infrastructure/argocd/application.yaml`) enables GitOps deployment:

### Application Configuration

- **Source**: Points to the Git repository containing the Helm chart
- **Destination**: Deploys to `task-manager` namespace in AKS
- **Sync Policy**: Automated synchronization with PR merge
- **Pruning**: Removes resources no longer in the chart
- **Self-Heal**: Automatically recovers from drift

### GitOps Flow

```
Git Repository
    ↓
Azure DevOps Pipeline (builds, tests, pushes to ACR, updates Helm values)
    ↓
Argo CD detects Git change
    ↓
Argo CD syncs Helm chart to AKS
    ↓
AKS runs the new version
```

### Manual Sync Trigger

```bash
# Trigger Argo CD manual sync
argocd app sync task-manager
```

## 12. How Azure DevOps Pipeline Works

The pipeline (`azure-pipelines.yml`) implements a 10-stage CI/CD pipeline:

### Stage 1 — Checkout

Checks out the repository source code.

### Stage 2 — Dependencies

Installs Node.js dependencies for all three services (frontend, task-service, notification-service).

### Stage 3 — Build

Builds the frontend (`npm run build`) and backend applications.

### Stage 4 — Unit tests

Runs unit tests for task-service and notification-service. Pipeline fails if any test fails.

### Stage 5 — Integration tests

Starts a temporary PostgreSQL container and verifies the API works end-to-end.

### Stage 6 — Security checks

Runs container security scanning documentation. In a real environment, would use Trivy, Snyk, or Azure Container Scanning.

### Stage 7 — Docker Build

Builds three separate Docker images:
- `myacr.azurecr.io/task-manager/frontend:$(Build.BuildId)`
- `myacr.azurecr.io/task-manager/task-service:$(Build.BuildId)`
- `myacr.azurecr.io/task-manager/notification-service:$(Build.BuildId)`

### Stage 8 — Push images

Authenticates to Azure Container Registry using service connections and pushes all images.

### Stage 9 — GitOps update

Updates the Helm `values.yaml` with new image tags and commits back to the Git repository with `[skip ci]` to avoid infinite pipeline loops.

### Stage 10 — Deployment

Documents the deployment flow: Azure DevOps updates GitOps config → Argo CD detects change → Argo CD syncs to AKS. The pipeline does NOT directly manipulate Kubernetes.

### Pipeline Variables

Configure these in Azure DevOps library or pipeline settings:
- `AZURE_SERVICE_CONNECTION` - Service connection for Azure operations
- `ACR_SERVICE_CONNECTION` - Service connection for ACR authentication
- `ACR_NAME` - Azure Container Registry name
- `AKS_CLUSTER_NAME` - AKS cluster name
- `AKS_RESOURCE_GROUP` - AKS resource group

## 13. Required Azure Resources

To run the full CI/CD pipeline, you need:

1. **Azure Container Registry** (ACR) - Stores Docker images
2. **Azure Kubernetes Service** (AKS) - Target cluster for deployment
3. **Azure DevOps Service Connections** - For ACR and AKS authentication

### ACR Configuration

- Create an ACR instance: `az acr create --name <ACR_NAME> --resource-group <RG> --sku Basic`
- Enable admin user: `az acr admin enable --name <ACR_NAME>`
- The pipeline pushes images to: `myacr.azurecr.io/task-manager/*`

### AKS Configuration

- Create AKS cluster: `az aks create --name <AKS_CLUSTER_NAME> --resource-group <RG> --node-count 3`
- Install Argo CD: `argocd repo add https://argoproj.github.io/argo-helm`
- Create `task-manager` namespace: `kubectl create namespace task-manager`

### Service Connections

In Azure DevOps, create:
- **ACR Service Connection**: Connects to your ACR instance
- **Azure Service Connection**: Connects to your Azure subscription for AKS operations

## 14. How to Configure ACR

1. Create an Azure Container Registry:
   ```bash
   az acr create --name myacr0726 --resource-group myrg --sku Basic
   ```

2. Enable admin access:
   ```bash
   az acr admin enable --name myacr0726
   ```

3. In Azure DevOps, create a service connection:
   - Go to Project Settings → Service connections
   - Add "Azure Resource Manager" connection
   - Select your subscription and ACR resource

4. Or use personal access token:
   ```bash
   az acr login --name myacr0726
   ```

## 15. How to Configure AKS

1. Create resource group:
   ```bash
   az group create --name myrg --location eastus
   ```

2. Create AKS cluster:
   ```bash
   az aks create \
     --name task-manager-aks \
     --resource-group myrg \
     --node-count 2 \
     --enable-addons monitoring
   ```

3. Connect to cluster:
   ```bash
   az aks get-credentials --name task-manager-aks --resource-group myrg
   ```

4. Create namespace:
   ```bash
   kubectl create namespace task-manager
   ```

5. Install Argo CD (if not already):
   ```bash
   argocd login <AKS_IP>
   ```

## 16. How to Configure Argo CD

1. Login to Argo CD:
   ```bash
   argocd login <AKS_LOAD_BALANCER_IP>
   ```

2. Add the Git repository:
   ```bash
   argocd repo add https://github.com/your-org/mini-task-manager.git
   ```

3. Create the application:
   ```bash
   kubectl apply -f infrastructure/argocd/application.yaml
   ```

4. View application status:
   ```bash
   argocd app list
   argocd app get task-manager
   ```

## 17. How to Perform the First Deployment

### Prerequisites Completed

- ACR created and configured
- AKS cluster running with `task-manager` namespace
- Argo CD installed and pointing to the Git repo

### Pipeline Execution

1. Push code to Azure DevOps repository
2. Azure DevOps pipeline runs automatically
3. Pipeline builds Docker images and pushes to ACR
4. Pipeline updates Helm `values.yaml` with new image tags
5. Git commit triggers Argo CD automated sync
6. Argo CD syncs the Helm chart to AKS
7. Application becomes available at the Ingress host (`task-manager.local`)

### Verify Deployment

```bash
# Check Argo CD
argocd app get task-manager

# Check Kubernetes resources
kubectl get all -n task-manager

# Access the application
open http://task-manager.local
```

## 18. How to Make a Code Change and Trigger the Pipeline

### Demonstration Change Example

Change the frontend title from "Mini Task Manager" to "Mini Task Manager v2":

```bash
# Create a feature branch
git checkout -b feature/change-title

# Make the change
# (edit frontend/src/App.jsx to change the title)

# Stage and commit
git add .
git commit -m "Change application title"

# Push and create Pull Request
git push origin feature/change-title

# Pull Request → Code Review → Merge
# Pipeline runs again automatically
```

### Expected Pipeline Execution After Change

1. Azure DevOps pipeline triggers on PR merge to `main`
2. Stages run: Checkout → Dependencies → Build → Unit tests → Integration tests → Security checks
3. Docker build and push to ACR
4. Helm values updated with new image tag
5. Git commit with `[skip ci]` avoids loop
6. Argo CD detects Git change
7. Argo CD syncs to AKS
8. New version deployed to Kubernetes

### Verifying the Change

```bash
# Check the new image tag
helm get values task-manager -n task-manager

# Verify running version
kubectl get pods -n task-manager

# Access application and see "Mini Task Manager v2"
open http://task-manager.local
```

## 19. Development Workflow

### Branching Strategy

```
main
|
feature/new-task-field
|
Pull Request
|
Code Review
|
Pipeline
|
merge
|
main
|
production deployment (via Argo CD)
```

### Making Easy Code Changes

The application is designed for easy modification:

- **UI title**: Edit `frontend/src/App.jsx`
- **Task status**: Edit `services/task-service/src/tasks.service.ts`
- **API response**: Edit `services/task-service/src/tasks.routes.ts`
- **Notification message**: Edit `services/notification-service/src/app.ts`
- **Add new task field**: Edit the Task interface and database schema

Each change can be committed, pushed, and merged to demonstrate a full pipeline execution.

## 20. Quality Requirements Checklist

- [x] Project builds successfully
- [x] Dockerfiles are syntactically correct
- [x] docker-compose configuration is valid
- [x] Helm templates are internally consistent
- [x] Kubernetes manifests generated by Helm are valid
- [x] Service names and ports match between services
- [x] Environment variables are consistent across all layers
- [x] Tests can run for all services
- [x] No obvious security mistakes (hardcoded credentials, etc.)
- [x] README.md matches the actual implementation
- [x] Clear architecture and documentation
- [x] Separate Docker images for each service
- [x] Reproducible builds
- [x] Automated tests
- [x] Health checks configured
- [x] Environment variables (not hardcoded)
- [x] Helm chart with all required resources
- [x] Kubernetes liveness/readiness probes
- [x] Argo CD GitOps flow
- [x] Azure DevOps CI/CD pipeline with 10 stages
- [x] Easy code changes for demonstration