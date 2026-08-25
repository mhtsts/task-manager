#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLUSTER_NAME="task-manager"
echo "==> Deleting namespace task-manager..."
kubectl delete namespace task-manager --ignore-not-found
if command -v kind >/dev/null 2>&1 && kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
  read -p "Delete kind cluster '${CLUSTER_NAME}'? [y/N] " ans
  if [[ "$ans" == "y" || "$ans" == "Y" ]]; then
    kind delete cluster --name "$CLUSTER_NAME"
  fi
fi
echo "Done."
