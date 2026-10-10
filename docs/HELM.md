# Helm — ShopKart

The `helm/shopkart/` chart deploys the whole stack.

## Structure

    helm/shopkart/
      Chart.yaml
      values.yaml
      values-dev.yaml
      values-prod.yaml
      templates/
        _helpers.tpl
        namespace.yaml
        configmap.yaml
        secret.yaml
        serviceaccount.yaml
        frontend-deployment.yaml
        frontend-service.yaml
        backend-deployment.yaml
        backend-service.yaml
        postgres-statefulset.yaml
        postgres-service.yaml
        pvc.yaml
        ingress.yaml
        hpa.yaml
        NOTES.txt
        tests/
          test-connection.yaml

## Lint and Render

    helm lint ./helm/shopkart
    helm template shopkart ./helm/shopkart -n shopkart

## Install

    helm install shopkart ./helm/shopkart \
      -n shopkart --create-namespace

## Install with an overlay

    helm install shopkart ./helm/shopkart -n shopkart --create-namespace \
      -f ./helm/shopkart/values-dev.yaml

## Upgrade

    helm upgrade shopkart ./helm/shopkart -n shopkart

## Rollback

    helm history shopkart -n shopkart
    helm rollback shopkart 1 -n shopkart

## Test

    helm test shopkart -n shopkart

## Uninstall

    helm uninstall shopkart -n shopkart

## Overriding Values

Any value in values.yaml can be overridden on the command line:

    --set backend.image.tag=v2
    --set ingress.host=shopkart.example.com
    --set hpa.minReplicas=3

Or via a custom values file:

    helm upgrade shopkart ./helm/shopkart -n shopkart -f my-values.yaml

## What the Chart Creates

- Namespace (optional, controlled by namespace.create)
- ServiceAccount
- ConfigMap + Secret
- Frontend Deployment + Service
- Backend Deployment + Service
- Postgres StatefulSet + headless Service + PVC
- Ingress
- HPA
