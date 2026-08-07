# Aegis Backend

This backend powers the Intelligent Employee Onboarding & Cross-Departmental Provisioning System for the Deploy or Die hackathon track.

## Features

- JWT authentication and role-based access control
- Offer letter upload and document extraction
- Workflow generation with dependency-aware tasks
- Approval requests and audit logging
- Dashboard statistics
- Simulated provisioning adapters

## Quick Start

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`
3. Start the server: `npm start`
4. Run tests: `npm test`

## API Base URL

- `http://localhost:4000/api`

## Health Check

- `GET /health`
