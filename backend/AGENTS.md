# Agent Documentation

## OnboardingCoordinatorAgent

The coordinator agent is the orchestration layer for onboarding. It:

- reviews employee profile data,
- creates workflow tasks,
- selects approval requirements,
- and emits reasoning for the generated plan.

## Design Principles

- keep orchestration logic separate from HTTP handlers,
- generate auditable decisions,
- and make retry and failure handling explicit.
