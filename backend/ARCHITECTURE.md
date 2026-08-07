# Architecture

## Overview

The backend follows a modular Express architecture that separates concerns across routes, controllers, services, repositories, models, and middleware.

## Layers

- Router layer: HTTP endpoints
- Controller layer: request parsing and response shaping
- Service layer: business logic and orchestration
- Repository layer: persistence abstraction
- Model layer: schema definitions for MongoDB/Mongoose
- Middleware layer: authentication, authorization, and error handling

## Core Modules

- Authentication service for JWT and RBAC
- Offer upload and document extraction pipeline
- Onboarding coordinator agent for workflow orchestration
- Role access calculator skill for policy-driven provisioning
- Workflow engine for task generation and dependency planning
- Approval engine for human approval flows
- Provisioning engine for simulated resource provisioning
- Audit service for immutable event logging
- Dashboard service for operational visibility
