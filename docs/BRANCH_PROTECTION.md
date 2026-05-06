# Branch Protection Rules

This document records the recommended GitHub branch-protection configuration for the GachaFi repository. These rules prevent accidental force-pushes, require peer review, and enforce CI gates before code reaches `main`.

> **Note:** Branch protection is configured in the GitHub web UI (`Settings → Branches`) and cannot be version-controlled. This file serves as documentation and an audit checklist.

---

## `main` Branch

| Rule | Value | Rationale |
|------|-------|-----------|
| **Require a pull request before merging** | ✅ Enabled | All changes must be reviewed. |
| **Require approvals** | `1` | At least one reviewer must approve. |
| **Dismiss stale PR approvals when new commits are pushed** | ✅ Enabled | Prevents "review + immediate push" attacks. |
| **Require status checks to pass before merging** | ✅ Enabled | CI must be green. |
| **Required status checks** | `build`, `audit`, `secrets` | All three CI jobs must pass. |
| **Require branches to be up to date before merging** | ✅ Enabled | Prevents merge-skew issues. |
| **Require conversation resolution before merging** | ✅ Enabled | Ensures all review threads are addressed. |
| **Require signed commits** | ⚠️ Optional | Enable if the team has GPG/SSH signing set up. |
| **Include administrators** | ✅ Enabled | Even repo admins must follow the rules. |
| **Restrict pushes that create files larger than 100 MiB** | ✅ Enabled | Prevents accidental large-file commits. |
| **Do not allow bypassing the above settings** | ✅ Enabled | Prevents “admin override” merges. |

## `develop` Branch

Same rules as `main`, but approvals can optionally be reduced to `0` for rapid iteration if the team is small. **Recommended:** keep `1` approval on `develop` as well and use feature branches for rapid work.

---

## Required Status Checks (GitHub Actions)

The following CI jobs defined in `.github/workflows/ci.yml` should be marked as required:

1. **`build`** — Lint, type-check, test, build, bundle-size check.
2. **`audit`** — `npm audit --audit-level=high`.
3. **`secrets`** — TruffleHog secret scanning.

### How to configure in GitHub

1. Go to **Settings → Branches** in the GitHub repository.
2. Click **Add rule** (or edit existing).
3. Branch name pattern: `main`
4. Enable the checks listed above.
5. Under **Status checks that are required**, search for and add:
   - `build`
   - `audit`
   - `secrets`
6. Save changes.
7. Repeat for `develop` (optional but recommended).

---

## Force-Push Policy

**Never force-push to `main` or `develop`.** Force-pushes rewrite history, invalidate signed commits, and can drop audit events. If a bad commit lands on `main`, revert it with a new commit rather than rewriting history.

---

## Deployment Keys vs. Personal Access Tokens

If automated deployment (e.g., Netlify, Docker Hub) needs write access:

- Use **GitHub Deploy Keys** with **read-only** access where possible.
- If write access is required, use a **fine-grained Personal Access Token** scoped to this repository only, and rotate it every 90 days.
- Never store long-lived tokens in repository secrets without an expiration date.

---

## Audit Trail

- GitHub automatically logs all branch-protection changes in the **Security → Audit log** tab (organisation-level) or **Settings → Security log** (repository-level).
- Review these logs quarterly to detect unauthorised rule relaxations.
