Flowio — Documento Mestre FINAL (v4)
Planos Oficiais (MVP)
🆓 Free

3 Mind Maps

3 Whiteboards

1 workspace

Até 2 membros

Export PNG ✅

Export PDF ❌

Share link view-only ✅

⭐ Pro (Trial 15 dias)

Boards ilimitados

1 workspace

Até 5 membros

Export PNG/PDF ✅

Templates básicos ✅

Offline + Sync completo ✅

👥 Team (Trial 15 dias)

Boards ilimitados

Múltiplos workspaces

Membros ilimitados (ou limite alto, ex: 50)

Permissões avançadas (Admin/Member/Viewer)

Export PNG/PDF ✅

Templates + futuros recursos de colaboração

Prioridade em features V2 (collab realtime)

Trial de 15 dias tanto para Pro quanto Team.

1) Ajustes no Modelo de Dados (para TEAM)
workspace_members (já compatível)

role: owner | admin | member | viewer

Um usuário pode estar em N workspaces (TEAM)

subscriptions (Cashier)

1 subscription por workspace

Isso é MUITO importante.

Pro: workspace único

Team: múltiplos workspaces por usuário, cada um com sua assinatura

Decisão técnica correta: a assinatura pertence ao workspace, não ao usuário.

2) Billing (Stripe) — Estrutura Correta
Stripe Products

flowio_pro

flowio_team

Stripe Prices

Pro: preço fixo mensal/anual

Team:

Opção A: preço fixo (mais simples MVP)

Opção B: preço por membro (seat-based)
👉 Recomendo A no MVP, evolui para seat-based depois.

Regras de plano (backend)
Free:
- boards <= 3 + 3
- members <= 2
- 1 workspace

Pro:
- unlimited boards
- members <= 5
- 1 workspace

Team:
- unlimited boards
- unlimited members
- unlimited workspaces

3) Enforce de Limites (lógica única)

Criar um PlanCapabilityService (importante):

canCreateBoard(workspace, type)
canAddMember(workspace)
canCreateWorkspace(user)
canExportPDF(workspace)


Tudo passa por ele → evita regra espalhada.

4) Backend — Impactos Técnicos
Controllers novos

WorkspaceSubscriptionController

upgrade/downgrade

iniciar trial

redirecionar para Stripe Portal

Policies

WorkspacePolicy

BoardPolicy

SubscriptionPolicy

Webhooks Stripe

customer.subscription.created

customer.subscription.updated

customer.subscription.deleted

invoice.payment_failed

Toda mudança de status reflete em:

workspace.plan

workspace.subscription_status

workspace.trial_ends_at

5) Frontend — UX para planos integrados
Onde o plano aparece

Badge do plano no workspace switcher

Banner de trial (ex: “Trial ends in 7 days”)

Paywall elegante ao bater limite

Tela “Billing & Plan” por workspace

Upgrade Flow (UX)

Usuário tenta criar board/membro

Bate limite → modal:

“Upgrade to Pro” ou “Upgrade to Team”

Stripe Checkout

Retorno → refresh workspace + liberar ações

6) Offline + Team (compatibilidade)

Offline funciona por board, independente do plano.

Quando voltar online:

Se workspace downgraded:

Não apaga dados

Bloqueia ações acima do limite

Mostra aviso elegante

7) Backlog atualizado (com TEAM)
Sprint 1 — Base SaaS + Billing

 Workspace + multi-members

 Boards + documents + limits Free

 Stripe Pro + Team + Trial

 Webhooks + enforce de plano
Aceite: upgrade/downgrade funciona por workspace.

Sprint 2 — Mind Map Editor

(igual ao definido)

Sprint 3 — Whiteboard Editor

(igual ao definido)

Sprint 4 — Offline + i18n

(igual ao definido)

8) Checklist final de MVP (TEAM incluso)

 Um usuário cria workspace Free

 Convida membros (limitado no Free)

 Cria boards até o limite

 Faz upgrade para Pro (trial)

 Cria boards ilimitados

 Cria segundo workspace → exige Team

 Upgrade Team → múltiplos workspaces liberados

 Downgrade não apaga dados

 Offline não perde dados

 Export PDF só em Pro/Team