# ShopKart Helm Chart

Deploys the ShopKart 3-tier stack with ingress and HPA.

## Install

    helm install shopkart ./helm/shopkart -n shopkart --create-namespace

## Upgrade / rollback / uninstall

    helm upgrade shopkart ./helm/shopkart -n shopkart
    helm rollback shopkart 1 -n shopkart
    helm uninstall shopkart -n shopkart

## Lint and template

    helm lint ./helm/shopkart
    helm template shopkart ./helm/shopkart -n shopkart

## Values

See values.yaml for the full set.
