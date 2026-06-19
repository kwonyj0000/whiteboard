<!--
SYNC IMPACT REPORT

Version Change: Initial → 1.0.0
Type: MAJOR (initial constitution establishment)

Modified Principles: None (all new)
Added Sections:
  - Principle I: Code Quality First
  - Principle II: Testing Discipline (Non-Negotiable)
  - Principle III: UX Consistency
  - Principle IV: Performance by Design
  - Principle V: Requirements-Centered Development
  - Development Workflow section
  - Governance section

Removed Sections: None (initial version)

Templates Requiring Updates:
  ✅ plan-template.md — Constitution Check section references this file correctly
  ✅ spec-template.md — Requirements and success criteria align with Principle V
  ✅ tasks-template.md — Test-first approach aligns with Principle II

Follow-up TODOs: None
-->

# Whiteboard Constitution

## Core Principles

### I. Code Quality First

Code quality is non-negotiable and MUST precede velocity. Every change MUST:
- Follow established conventions (linting, formatting enforced automatically)
- Be self-documenting through clear naming and structure
- Minimize complexity: prefer simple, explicit code over clever abstractions
- Avoid premature optimization and over-engineering

**Rationale**: Technical debt compounds exponentially. Preventing it costs less than removing it. Quality code is cheaper to maintain, extend, and debug.

**How to apply**:
- Run linters/formatters before every commit (CI blocks non-compliant code)
- Reject PRs that add unexplained complexity
- Refactor when complexity grows, not when features demand it
- Document only non-obvious decisions (WHY, not WHAT)

### II. Testing Discipline (NON-NEGOTIABLE)

All backend modifications MUST include automated tests that verify correctness. Test-first development is MANDATORY:

1. Write tests that express requirements
2. Verify tests FAIL (proving they detect the problem)
3. Implement the minimum code to make tests pass
4. Refactor with tests as safety net

**Test Requirements**:
- **Unit tests**: All service/model logic, edge cases, error handling
- **Integration tests**: User journeys that cross module boundaries
- **Contract tests**: API endpoints match their specifications
- Tests MUST be fast (<2s per suite) and deterministic (no flaky tests)

**Rationale**: Untested code is legacy code on arrival. Tests are executable documentation that proves requirements are met and prevents regressions.

**How to apply**:
- Backend feature = tests MUST pass before PR approval
- When tests are requested in spec, write them BEFORE implementation
- Test failures block merges (no "we'll fix it later")
- Flaky tests get fixed immediately or removed

### III. UX Consistency

User experience MUST be predictable, intuitive, and consistent across all features:

- **Visual consistency**: Shared design tokens (colors, spacing, typography via CSS variables)
- **Interaction patterns**: Similar actions work the same way everywhere
- **Feedback**: Every user action gets immediate, clear feedback (loading states, success/error messages)
- **Accessibility**: Keyboard navigation, screen reader support, ARIA labels where needed
- **Responsive design**: All features work on mobile, tablet, and desktop

**Rationale**: Inconsistent UX creates cognitive load, erodes trust, and reduces adoption. Users should learn patterns once and apply them everywhere.

**How to apply**:
- Use design system/component library (no one-off styles)
- Test UI changes on multiple screen sizes before committing
- Follow WCAG 2.1 Level AA guidelines for accessibility
- Animation/transitions enhance clarity, not decoration

### IV. Performance by Design

Performance is a feature, not an afterthought. System MUST be responsive and efficient:

- **Response time**: User interactions complete in <300ms perceived time
- **Load time**: Initial page/screen load <2s on 3G network
- **Resource efficiency**: No memory leaks, minimize bundle size, lazy load non-critical assets
- **Scalability**: Design for 10x current load from day one

**Performance Budget**:
- Frontend bundle: <200KB gzipped initial load
- API response time: p95 <500ms
- Database queries: N+1 queries prohibited

**Rationale**: Users abandon slow software. Performance problems are exponentially harder to fix after architecture solidifies.

**How to apply**:
- Measure performance metrics in CI (block PRs that regress)
- Profile before optimizing (no premature optimization)
- Cache aggressively, invalidate precisely
- Monitor performance in production with alerting

### V. Requirements-Centered Development

All work MUST trace back to explicit, documented requirements:

- **Requirements are testable**: Every requirement has measurable success criteria
- **No undocumented features**: "The code is the spec" is prohibited
- **Scope discipline**: Implement what's specified, no gold-plating
- **User stories drive design**: Technical decisions serve user needs, not vice versa

**Documentation Requirements**:
- `spec.md`: User stories with acceptance scenarios (GIVEN/WHEN/THEN)
- `plan.md`: Technical approach and trade-offs justified
- `tasks.md`: Executable work items mapped to user stories

**Rationale**: Undocumented requirements become tribal knowledge that blocks onboarding and creates inconsistent implementations. Requirements are the contract between users and developers.

**How to apply**:
- Every feature starts with `/speckit-specify` (no coding before spec approval)
- Changes to requirements update spec.md FIRST
- When requirements are unclear, mark `NEEDS CLARIFICATION` and block implementation
- Success criteria define "done", not personal judgment

## Development Workflow

This workflow ensures compliance with all principles:

### 1. Specification Phase
- Create feature spec with `/speckit-specify`
- User reviews and approves requirements
- Identify ambiguities and resolve before proceeding

### 2. Planning Phase
- Run `/speckit-plan` to produce technical design
- Constitution Check MUST pass (automated gates based on this file)
- Architecture review for performance/quality implications

### 3. Task Generation Phase
- Run `/speckit-tasks` to break work into executable units
- Tasks MUST map to user stories (traceability required)
- Test tasks precede implementation tasks

### 4. Implementation Phase
- Run `/speckit-implement` or execute tasks manually
- **For backend changes**: Write tests first, verify they fail, then implement
- **For frontend changes**: Verify in browser on multiple devices before marking complete
- Linting/formatting enforced on every commit

### 5. Verification Phase
- All tests pass (unit, integration, contract)
- Performance metrics within budget
- UX tested across target platforms
- Code review focuses on constitution compliance

### 6. Deployment
- Only merge to main when all verification gates pass
- Monitor post-deployment metrics
- Document any deviations in commit messages

## Governance

### Amendment Process

Constitution changes require:
1. Documented justification (what problem does this solve?)
2. Impact analysis on existing features
3. Update to dependent templates (plan, spec, tasks)
4. Version increment per semantic versioning rules:
   - **MAJOR**: Principle removal or backward-incompatible governance changes
   - **MINOR**: New principle added or material expansion of existing principle
   - **PATCH**: Clarifications, typos, non-semantic refinements

### Compliance Verification

- All PRs MUST pass automated Constitution Check (defined in plan-template.md)
- Code review MUST verify adherence to principles
- Violations require either fix or documented justification in Complexity Tracking table

### Exceptions

Exceptions to constitutional principles are permitted only when:
- Justified in plan.md Complexity Tracking table
- Simpler alternatives documented and rejected
- Technical debt task created for future resolution
- Approved by project lead

### Versioning Policy

- Track all amendments with version number and date
- Maintain changelog of principle modifications
- Archive superseded versions for historical reference

### Conflict Resolution

When principles conflict (e.g., performance vs. code quality):
1. Default to user impact (Principle V: Requirements-Centered)
2. Consult success criteria in spec.md
3. Document trade-off decision in plan.md
4. Review decision if success criteria change

**Version**: 1.0.0 | **Ratified**: 2026-06-19 | **Last Amended**: 2026-06-19
