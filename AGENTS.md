<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:shadcn-agent-rules -->
# UI work is shadcn-first

For UI/layout work, treat this app as shadcn/Radix based:

- Check `components/ui/`, `components.json`, and `docs/ui_conventions.md` before creating new UI primitives.
- Prefer existing shadcn-style primitives and Radix-backed components over custom controls.
- When adding a shadcn pattern, adapt it to the existing tokens in `app/globals.css` and the app shell conventions in `components/layout/`.
- Do not add overlapping UI libraries or duplicate primitives when an existing shadcn-style component is sufficient.

Before using external skills, MCP servers, plugins, or generated shadcn snippets:

- Confirm whether the repo already has the needed component or pattern.
- Avoid overlapping tools that provide the same responsibility unless the user explicitly asks for them.
- If a requested MCP/plugin/skill is unavailable in the current Codex environment, state that and continue with the local shadcn conventions.
<!-- END:shadcn-agent-rules -->
