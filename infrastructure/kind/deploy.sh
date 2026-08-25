#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CLUSTER_NAME="task-manager"

echo "==> Building Docker images (frontend with VITE_API_BASE=\"\" for Ingress)..."
# Frontend must be built with empty VITE_API_BASE so browser calls /api via Ingress (same origin)
docker build --build-arg VITE_API_BASE="" -t task-manager-frontend:latest "$ROOT_DIR/frontend"
docker build -t task-service:latest "$ROOT_DIR/services/task-service"
docker build -t notification-service:latest "$ROOT_DIR/services/notification-service"

if command -v kind >/dev/null 2>&1; then
  if ! kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "==> Creating kind cluster '${CLUSTER_NAME}'..."
    kind create cluster --name "$CLUSTER_NAME" --config "$SCRIPT_DIR/kind-config.yaml"
  else
    echo "==> kind cluster '${CLUSTER_NAME}' already exists"
  fi
  echo "==> Loading images into kind..."
  kind load docker-image task-manager-frontend:latest --name "$CLUSTER_NAME"
  kind load docker-image task-service:latest --name "$CLUSTER_NAME"
  kind load docker-image notification-service:latest --name "$CLUSTER_NAME"
  echo "==> Installing ingress-nginx..."
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
  echo "==> Waiting for ingress-nginx..."
  kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s
else
  echo "==> kind not found — using current kube context: $(kubectl config current-context)"
  echo "    Make sure your images are available to the cluster (Docker Desktop: no load needed)"
fi

echo "==> Applying manifests..."
kubectl apply -f "$SCRIPT_DIR/namespace.yaml"
kubectl apply -f "$SCRIPT_DIR/postgresql.yaml"
kubectl apply -f "$SCRIPT_DIR/task-service.yaml"
kubectl apply -f "$SCRIPT_DIR/notification-service.yaml"
kubectl apply -f "$SCRIPT_DIR/frontend.yaml"
kubectl apply -f "$SCRIPT_DIR/ingress.yaml"

echo "==> Waiting for pods..."
kubectl wait --namespace task-manager --for=condition=ready pod --selector=app=postgresql --timeout=120s
kubectl wait --namespace task-manager --for=condition=ready pod --selector=app=task-service --timeout=120s
kubectl wait --namespace task-manager --for=condition=ready pod --selector=app=notification-service --timeout=120s
kubectl wait --namespace task-manager --for=condition=ready pod --selector=app=frontend --timeout=120s

echo ""
echo "=== Ready ==="
if command -v kind >/dev/null 2>&1; then
  echo "App: http://localhost:8080  (via kind ingress)"
  echo "API: http://localhost:8080/api/tasks"
else
  echo "Port-forward for Docker Desktop (no ingress):"
  echo "  kubectl port-forward -n task-manager svc/frontend 3000:80 &"
  echo "  kubectl port-forward -n task-manager svc/task-service 8080:8080 &"
  echo "  Then open http://localhost:3000 (frontend will call http://localhost:8080/api via port-forward)"
  echo "  For that mode, rebuild frontend with: docker build --build-arg VITE_API_BASE=http://localhost:8080 -t task-manager-frontend:latest ./frontend && kubectl rollout restart deploy/frontend -n task-manager"
fi
echo ""
echo "Check: kubectl get pods -n task-manager"
echo "Logs:  kubectl logs -n task-manager deploy/task-service -f"
