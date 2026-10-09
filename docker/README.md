# Docker — ShopKart

Helper scripts for the Docker stack.

## Commands

- `docker compose up -d` — start
- `docker compose ps` — status
- `docker compose logs -f` — logs
- `docker compose down` — stop, keep data
- `docker compose down -v` — stop, wipe data

## Topology

frontend (nginx:80) → backend (node:5000) → postgres (postgres:5432)

- App:      http://localhost:8080
- API:      http://localhost:5000/api
- Metrics:  http://localhost:5000/metrics