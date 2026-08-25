#!/bin/bash
set -e

KIND_CLUSTER_NAME="task-manager-local"

# Create KinD cluster
cat <<EOF | kind create cluster --name "${KIND_CLUSTER_NAME}" --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha1
nodes:
- role: control-plane
  kubectlConfigMode: inline
  extraPortMappings:
  - containerPort: 80
    hostPort: 8080
    protocol: TCP
  - containerPort: 443
    hostPort: 8443
    protocol: TCP
- role: worker
EOF

# Load Docker images into KinD
echo "Loading Docker images into KinD..."
docker images --format "{{.Repository}}:{{.Tag}}" | while read image; do
  kind load docker-image "$image"
done

# Create namespace
kubectl create namespace task-manager || true

echo "KinD cluster '${KIND_CLUSTER_NAME}' created successfully!"
echo "Frontend available at: http://localhost:8080"
echo "API available at: http://localhost:8080/api"