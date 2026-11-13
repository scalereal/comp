# Comp AI - Automated Production Kubernetes Deployment Guide

This directory contains the production-grade, declarative Kubernetes manifests and GitOps automation configurations for deploying the full Comp AI platform onto a Kubernetes cluster.

---

## 1. High-Level Architecture

The deployment is managed in namespace `comp`. Ingress terminates TLS with automated certificates managed by Cert-Manager. Persistent volume claims provide persistent state for PostgreSQL, Redis, and MinIO.

```
                              [ Internet User ]
                                     |
               +---------------------+---------------------+
               |                     |                     |
     https://app.<DOMAIN>   https://api.<DOMAIN>   https://portal.<DOMAIN>
               |                     |                     |
      [ Ingress Controller + Cert-Manager Let's Encrypt TLS ]
               |                     |                     |
        +------+------+       +------+------+       +------+------+
        |  comp-app   |       |  comp-api   |       | comp-portal |
        |  (Next.js)  |       |  (NestJS)   |       |  (Next.js)  |
        |  Port 3000  |       |  Port 3333  |       |  Port 3000  |
        +------+------+       +------+------+       +------+------+
               |                     |                     |
               +---------------------+---------------------+
                                     |
    +--------------------------------+--------------------------------+
    |                                |                                |
+---+--------------------+ +---------+----------+ +-------------------+---+
| comp-postgres          | | comp-redis-http    | | comp-minio            |
| PostgreSQL 17 (20Gi)   | | SRH + Redis 7 (2Gi)| | MinIO S3 (20Gi)       |
+------------------------+ +--------------------+ +-----------------------+
                                     |
                           +---------+----------+
                           | comp-trigger-worker|
                           | Trigger.dev Cloud  |
                           +--------------------+
```

---

## 2. Centralized Configuration (`deploy/values.env`)

All domains, URLs, and image tags are completely centralized. Changing `BASE_DOMAIN` in `deploy/values.env` (or passing `BASE_DOMAIN` as a GitHub repository variable) automatically configures all manifests, ingress rules, and builds without hardcoding:

```ini
BASE_DOMAIN=comp.scalereal.tech
APP_HOST=app.comp.scalereal.tech
API_HOST=api.comp.scalereal.tech
PORTAL_HOST=portal.comp.scalereal.tech
```

### DNS Records to Create
Point three DNS `A` records to your cluster's Ingress Public IP:

| Record Type | Host | Target | Description |
| :--- | :--- | :--- | :--- |
| `A` | `app.<BASE_DOMAIN>` | `<CLUSTER_INGRESS_IP>` | Main Web Application & Better Auth |
| `A` | `api.<BASE_DOMAIN>` | `<CLUSTER_INGRESS_IP>` | Core NestJS Backend REST API |
| `A` | `portal.<BASE_DOMAIN>` | `<CLUSTER_INGRESS_IP>` | Trust Portal & Vendor Hub |

---

## 3. Resource Allocation & Hard Limits

To ensure Comp AI runs reliably while strictly preventing any pod from starving other workloads on the shared cluster, every pod has explicitly defined resource requests and hard limits:

| Component | CPU Request | CPU Limit | Memory Request | Memory Limit | Storage PVC |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **comp-postgres** | 100m | 1000m (1 core) | 256Mi | 1024Mi (1Gi) | 20Gi (`openebs-hostpath`) |
| **comp-redis** | 50m | 250m | 64Mi | 256Mi | 2Gi (`openebs-hostpath`) |
| **comp-redis-http** | 25m | 150m | 32Mi | 128Mi | N/A |
| **comp-minio** | 50m | 500m | 128Mi | 512Mi | 20Gi (`openebs-hostpath`) |
| **comp-api** | 100m | 800m | 256Mi | 768Mi | N/A |
| **comp-app** | 100m | 800m | 256Mi | 768Mi | N/A |
| **comp-portal** | 100m | 500m | 128Mi | 512Mi | N/A |
| **comp-trigger-worker**| 100m | 2000m (2 cores)| 512Mi | 4096Mi (4Gi)   | N/A |
| **comp-migrator** (Job)| 50m | 500m | 128Mi | 512Mi | N/A |
| **TOTAL PEAK LIMIT** | **~575m** | **~5.5 cores** | **~1.6 GiB** | **~5.5 GiB** | **42 GiB Total** |

---

## 4. GitHub Secrets Setup

Configure the following secrets in your GitHub repository (**Settings > Secrets and variables > Actions > New repository secret**):

| Secret Name | Description |
| :--- | :--- |
| `KUBECONFIG` | Kubeconfig file content for connecting to the cluster |
| `POSTGRES_PASSWORD` | Password for PostgreSQL database |
| `MINIO_ROOT_PASSWORD` | Admin password for MinIO object storage |
| `REDIS_PASSWORD` | Authentication token for Redis and Serverless Redis HTTP |
| `AUTH_SECRET` | Secret key for Better Auth encryption and session handling |
| `SECRET_KEY` | Application encryption secret |
| `REVALIDATION_SECRET` | Next.js on-demand ISR revalidation token |
| `UNSUBSCRIBE_SECRET` | Email unsubscription verification token |
| `INTERNAL_API_TOKEN` | Service-to-service internal API auth token |
| `SERVICE_TOKEN_TRIGGER` | Authentication token for Trigger background worker |
| `SERVICE_TOKEN_PORTAL` | Authentication token for Trust Portal |
| `TRIGGER_SECRET_KEY` | Trigger.dev secret key |
| `TRIGGER_ACCESS_TOKEN` | Trigger.dev personal access token |
| `RESEND_API_KEY` | Resend API key for transactional emails |

---

## 5. Automated CI/CD Workflow Flow

When code is pushed to `main` or `fix/docker-builds` (or triggered manually via **Run workflow**):

1. **Parallel Multi-Stage Image Builds**:
   - Executes unified matrix build for 5 container images (`migrator`, `api`, `trigger-worker`, `app`, `portal`).
   - Injects dynamic build arguments from `deploy/values.env`.
   - Uses GitHub Actions Layer Cache (`cache-from: type=gha`) for fast incremental builds.
   - Pushes images tagged with commit SHA and `latest` to the container registry.
2. **Cluster Authentication**:
   - Configures `kubectl` using `${{ secrets.KUBECONFIG }}`.
   - Synchronizes `ghcr-secret` image pull secret.
   - Populates production secrets securely from GitHub repository secrets.
3. **Dynamic Manifest Rendering**:
   - Uses `envsubst` to dynamically render `configmap.yaml` and `ingress.yaml` with the configured domain.
4. **Infrastructure & Database Migration Gating**:
   - Applies namespace, PVCs, configmap, and infra manifests.
   - Executes database migration job (`comp-migrator`) and waits for `condition=complete`. If migrations fail, the deployment halts safely before touching live application pods.
5. **Zero-Downtime Rolling Update**:
   - Updates deployment image tags using Kustomize.
   - Triggers rolling update (`maxSurge: 1, maxUnavailable: 0`).
   - Confirms rollout status on all deployments.

---

## 6. Operations Runbook & Cheatsheet

Run these commands when inspecting or managing the deployment:

### Pod & Cluster Status
```bash
# Check all resources in comp namespace
kubectl get all -n comp

# Check Persistent Volumes and Claims
kubectl get pvc -n comp

# Check Ingress and SSL Certificate status
kubectl get ingress,certificates -n comp
```

### Viewing Live Logs
```bash
# Core API logs
kubectl logs -n comp -l app=comp-api -f --tail=100

# Next.js App logs
kubectl logs -n comp -l app=comp-app -f --tail=100

# Portal logs
kubectl logs -n comp -l app=comp-portal -f --tail=100

# Trigger.dev Background Worker logs
kubectl logs -n comp -l app=comp-trigger-worker -f --tail=100

# PostgreSQL logs
kubectl logs -n comp -l app=comp-postgres -f --tail=100
```

### Rollback an Application Deployment
If a release needs to be rolled back immediately:
```bash
kubectl rollout undo deployment/comp-api -n comp
kubectl rollout undo deployment/comp-app -n comp
kubectl rollout undo deployment/comp-portal -n comp
```

### Manual Trigger of Database Migrations
```bash
kubectl delete job comp-migrator -n comp --ignore-not-found
kubectl apply -f deploy/base/migrator-job.yaml
kubectl wait --for=condition=complete job/comp-migrator -n comp --timeout=120s
```

### Seed Database (First-Time Initialization)
To populate baseline frameworks (SOC 2, ISO 27001, HIPAA, GDPR):
```bash
kubectl run comp-seeder --rm -i --restart=Never -n comp \
  --image=ghcr.io/<ORG>/comp-migrator:latest \
  --overrides='{"spec":{"imagePullSecrets":[{"name":"ghcr-secret"}]}}' \
  --env="DATABASE_URL=postgresql://postgres:<POSTGRES_PASSWORD>@comp-postgres:5432/comp?schema=public&sslmode=disable" \
  -- bun packages/db/prisma/seed/seed.js
```
