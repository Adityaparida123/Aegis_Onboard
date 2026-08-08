# Testing Strategy

## Frameworks

- Jest for unit and integration tests
- Supertest for API-level testing

## Coverage Areas

- Authentication
- Workflow generation
- Approval flow
- Audit history
- Provisioning simulation and upload flow
- Employee support agent (intent classification, sensitive-action routing, fallback templates, session persistence)
- Support agent API (chat, history, employee context, self-service requests, RBAC)

## Run Tests

```bash
npm test
```

The support agent tests delete `GEMINI_API_KEY` during the run so they never call the Gemini API.
