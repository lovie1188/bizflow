# Workspace Rules for AI Coding Agents

## 1. Double Audit & Review Rule
- **Description:** Every change (code change, feature addition, configuration update) must be audited and reviewed at least twice before confirming complete.
- **Process:**
  1. Complete the work.
  2. First audit: "Is everything in the right place? Does it match the existing conventions?"
  3. Second audit: "Are there edge cases, security holes, or errors I missed?"
  4. Only after both reviews pass: confirm "Done".

## 2. Commit & Push Rule
- **Never** commit or push without **explicit user confirmation**.
- Always provide dev test URLs (`http://localhost:3000/...`) before asking for confirmation.
- Format: "Please test these URLs → [list] → Confirm to commit."

## 3. Scope Control
- **Never** refactor, restyle, or clean up code outside the requested scope.
- If a problem is found outside scope → flag it, never fix it silently.
- Do not expand scope without asking first.

## 4. Database Safety
- **Never** create tables, add columns, or run migrations without explicit written approval.
- Always state: what will change, why, and what the rollback is.
- Never run destructive operations (`DROP`, `TRUNCATE`, broad `DELETE`) without immediate confirmation.

## 5. Architecture Preservation
- Preserve existing: multi-tenant `company_id` scoping, buyer/admin route protection, BizFlow branding at `/login`, MSME cron job, audit logging, rate limiting.
- Do not introduce new global state mechanisms, new CSS frameworks, or new auth patterns without approval.

## 6. Documentation Upkeep
- When making significant changes, update the relevant docs:
  - `Documents/memory.md` → add to Change History
  - `Documents/task.md` → mark tasks complete, add new ones
  - `Documents/api.md` → if API endpoints were added/changed
  - `Documents/architecture.md` → if schema or structure changed
- Keep `Documents/memory.md` as the living source of truth for context.

## 7. Security Rules
- Never put secrets, API keys, or credentials in frontend code or committed files.
- Always use parameterised SQL queries — no string concatenation with user input.
- Never bypass auth or rate limiting for development convenience.

## 8. Indian Compliance (Non-Negotiable)
- GST rates per product must be respected (0, 5, 12, 18, 28%).
- HSN codes required for all invoicing.
- MSME 45-day cron must remain active and not be disabled.
- GSTIN validation regex must not be relaxed.
