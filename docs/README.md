# Federated Learning Based Disease Surveillance System

## Architecture Overview
This is a comprehensive full-stack architecture for a privacy-preserving disease surveillance platform using federated learning.

### Directory Structure
- `/frontend`: React + Vite application (UI).
- `/backend`: Node.js Express server providing REST APIs and PostGIS interaction.
- `/ai-service`: Python FastAPI handling central machine learning processes.
- `/flower-server`: The central FL aggregation server.
- `/flower-clients`: Edge clients (Hospital, Laboratory, Pharmacy) for decentralized training.
- `/database`: Schema and seeding scripts for PostGIS.

## Deployment
Use Docker Compose to launch the development environment:
```bash
docker-compose up -d
```
