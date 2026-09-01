---
name: OpenAPI integer code generation
description: Compatibility constraint between the workspace Orval generator and its installed Zod version.
---

Use OpenAPI `number` fields with boundary-level whole-number validation when generating Zod schemas in this workspace; OpenAPI `integer` currently generates `z.int()`, which the installed Zod version does not provide.

**Why:** Code generation succeeds but the chained library typecheck fails because generated validators call an unavailable API.

**How to apply:** For whole-number request values, use numeric OpenAPI constraints and enforce `Number.isInteger` on the server plus `.int()` in handwritten frontend validation. Keep server-calculated monetary amounts as numbers.