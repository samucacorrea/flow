# Decisions

- Monorepo with `backend/` (Laravel API) and `frontend/` (Next.js App Router) to reduce integration friction in Sprint 1.
- Team plan uses fixed price per workspace (Option A in PRD) for MVP; seat-based billing deferred.
- Team members limit is treated as unlimited for MVP.
- Workspaces and boards use UUID primary keys.
- Additional workspaces are only allowed if the user already has at least one active/trialing Team workspace; otherwise enforce the 1-workspace limit.
- Sprint 2 scope: minimal Mind Map editor with add/edit/select nodes, simple parent-child layout, and JSON document autosave; no realtime, no export, no offline sync.
- Mindmap document schema: { version, root: { id, text, children: [...] } }, stored in board_documents.content_json.
- Sprint 3 scope: minimal Whiteboard editor with shapes (rectangle, ellipse, sticky note, text), move, resize, edit text, delete; autosave via board_documents JSON; no realtime or export.
- Whiteboard document schema: { kind: "whiteboard", items: [{ id, type, x, y, w, h, text?, color?, borderColor?, textColor? }] } stored in board_documents.content_json.
