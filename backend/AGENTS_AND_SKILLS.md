# Agents and Skills

## Agent: OnboardingCoordinatorAgent

Location: `src/agents/onboardingCoordinatorAgent.js`

Responsibilities:
- coordinate onboarding flow
- build task lists
- request approvals
- provide reasoning for decisions

## Skill: RoleAccessCalculator

Location: `src/skills/roleAccessCalculatorSkill.js`

Responsibilities:
- map role, department, location, and clearance to software/hardware/permissions
- return approval requirements from configured policies
