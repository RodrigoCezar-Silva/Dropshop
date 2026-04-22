#!/usr/bin/env bash
set -euo pipefail

# Script de exemplo para build & deploy no Google Cloud Run.
# Configure PROJECT_ID, REGION e SERVICE_NAME antes de executar.

PROJECT_ID=${PROJECT_ID:-YOUR_PROJECT_ID}
REGION=${REGION:-us-central1}
SERVICE_NAME=${SERVICE_NAME:-mix-promocao-api}

if [ "$PROJECT_ID" = "YOUR_PROJECT_ID" ]; then
  echo "Edite este script e defina PROJECT_ID ou exporte a variável de ambiente PROJECT_ID"
  exit 1
fi

IMAGE=gcr.io/${PROJECT_ID}/${SERVICE_NAME}

echo "Building image ${IMAGE}..."
gcloud builds submit --tag "${IMAGE}"

echo "Deploying to Cloud Run (${REGION})..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --set-env-vars "SITE_URL=https://REPLACE_WITH_YOUR_API_URL,ALLOWED_ORIGINS=https://seuuser.github.io"

echo "Deployed. Atualize --set-env-vars conforme necessário com suas outras variáveis (JWT_SECRET, DB_*, etc.)"
