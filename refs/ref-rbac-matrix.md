# Reference: RBAC Permission Matrix

> **SOT** for role-based access control. 5 roles x permissions per module. Extracted from PRD §6.

---

## 1. Role Hierarchy

```
admin (100) > manager (80) > lead (60) > member (40) > viewer (20)
```

- Higher level roles inherit all permissions of lower levels ONLY when explicitly defined
- Permissions are NOT cumulative — each role has its own explicit permission set
- System roles cannot be deleted

---

## 2. Complete Permission Matrix

### Legend
- **C** = Create
- **R** = Read
- **U** = Update
- **D** = Delete
- **X** = Special permission (defined in footnotes)
- `-` = No access

---

### F01: Projects

| Permission | Admin | Manager | Lead | Member | Viewer |
|-----------|-------|---------|------|--------|--------|
| Create project | C | C | - | - | - |
| Read projects (all) | R | R | - | - | - |
| Read projects (own/member) | R | R | R | R | R |
| Update project | U | U | U¹ | - | - |
| Delete project (soft) | D | - | - | - | - |
| Manage members | X | X | X¹ | - | - |
| Transition stage (forward) | X | X | X | - | - |
| Transition stage (backward) | X | X | - | - | - |
| Archive project | X | X | - | - | - |

¹ Lead: only for projects they lead

---

### F02: Handovers

| Permission | Admin | Manager | Lead | Member | Viewer |
|-----------|-------|---------|------|--------|--------|
| Create handover | C | C | C | - | - |
| Read handovers (all) | R | R | - | - | - |
| Read handovers (own) | R | R | R | R | R |
| Update handover | U | U | U² | - | - |
| Approve handover | X | X | - | - | - |
| Reject handover | X | X | - | - | - |
| Complete handover | X | X | X² | - | - |
| Cancel handover | X | X | X² | - | - |

² Lead: only for handovers they are a party to

---

### F03: Documents

| Permission | Admin | Manager | Lead | Member | Viewer |
|-----------|-------|---------|------|--------|--------|
| Create document | C | C | C | C | - |
| Read documents (project) | R | R | R | R | R |
| Update own document | U | U | U | U | - |
| Update any document | U | U | - | - | - |
| Delete document | D | - | - | - | - |
| Approve document | X | X | - | - | - |
| Archive document | X | X | X | - | - |

---

### F04: Auth & Users

| Permission | Admin | Manager | Lead | Member | Viewer |
|-----------|-------|---------|------|--------|--------|
| Invite users | X | X | - | - | - |
| Read user list | R | R | R³ | R³ | - |
| Update user profile (any) | U | - | - | - | - |
| Update own profile | U | U | U | U | U |
| Delete user | D | - | - | - | - |
| Assign roles | X | - | - | - | - |
| Manage departments | C/U/D | - | - | - | - |
| Read departments | R | R | R | R | R |

³ Lead/Member: can read users within their projects only

---

### F05: Tasks

| Permission | Admin | Manager | Lead | Member | Viewer |
|-----------|-------|---------|------|--------|--------|
| Create task | C | C | C | C | - |
| Read tasks (all) | R | R | - | - | - |
| Read tasks (project) | R | R | R | R | R |
| Update any task | U | U | U | - | - |
| Update assigned task | U | U | U | U | - |
| Delete task | D | - | - | - | - |
| Assign task | X | X | X | - | - |
| Change task status | X | X | X | X⁴ | - |
| Add comment | X | X | X | X | - |

⁴ Member: can only change status of tasks assigned to them

---

### F06: Notifications

| Permission | Admin | Manager | Lead | Member | Viewer |
|-----------|-------|---------|------|--------|--------|
| Read own notifications | R | R | R | R | R |
| Mark as read | U | U | U | U | U |
| Manage preferences | X | X | X | X | X |
| Send system notifications | X | - | - | - | - |

---

### F07: Audit Logs

| Permission | Admin | Manager | Lead | Member | Viewer |
|-----------|-------|---------|------|--------|--------|
| Read all audit logs | R | R | - | - | - |
| Read own audit logs | R | R | R | - | - |
| Read project audit logs | R | R | R⁵ | - | - |
| Export audit logs | X | X | - | - | - |

⁵ Lead: only for projects they lead

---

### F08: Financial Records

| Permission | Admin | Manager | Lead | Member | Viewer |
|-----------|-------|---------|------|--------|--------|
| Create financial record | C | C | - | - | - |
| Read financial records | R | R | R⁶ | - | - |
| Update financial record | U | U | - | - | - |
| Approve financial record | X | X | - | - | - |
| Export financial records | X | X | - | - | - |

⁶ Lead: read-only for projects they lead

---

### F09: Reports

| Permission | Admin | Manager | Lead | Member | Viewer |
|-----------|-------|---------|------|--------|--------|
| View dashboard | R | R | R | R | R |
| View detailed reports | R | R | R⁷ | - | - |
| Export reports | X | X | - | - | - |
| View department reports | R | R | - | - | - |

⁷ Lead: only for projects they lead

---

### F10: Compliance

| Permission | Admin | Manager | Lead | Member | Viewer |
|-----------|-------|---------|------|--------|--------|
| Create compliance record | C | C | - | - | - |
| Read compliance records | R | R | R | R⁸ | R⁸ |
| Update compliance record | U | U | U | - | - |
| Assess compliance | X | X | - | - | - |
| Export compliance report | X | X | - | - | - |

⁸ Member/Viewer: can view compliance status but not details

---

## 3. Permission Check Implementation

```typescript
// lib/auth/permissions.ts

interface PermissionCheck {
  module: string;
  action: string;
  resourceOwnerId?: string;   // For ownership-based access
  projectId?: string;          // For project-scoped access
}

export function hasPermission(
  userRole: string,
  userPermissions: Record<string, Record<string, boolean>>,
  check: PermissionCheck
): boolean {
  const modulePerms = userPermissions[check.module];
  if (!modulePerms) return false;
  return modulePerms[check.action] === true;
}

// Usage in server actions:
export async function checkPermission(check: PermissionCheck): Promise<void> {
  const user = await getAuthUser();
  if (!user) throw new Error('Unauthorized');

  const role = await getUserRole(user.id);
  if (!hasPermission(role.name, role.permissions, check)) {
    throw new Error(`Insufficient permissions: ${check.module}.${check.action}`);
  }
}
```

---

## 4. RLS Policy Mapping

Each permission maps to an RLS policy:

| Permission Type | RLS Strategy |
|----------------|-------------|
| Read all | `USING (role IN ('admin', 'manager'))` |
| Read own | `USING (auth.uid() = user_id)` |
| Read project | `USING (EXISTS (SELECT 1 FROM project_members WHERE ...))` |
| Update own | `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)` |
| Admin-only write | `USING (role = 'admin')` |

---

## 5. Condensed Matrix (Quick Reference)

| Module | Admin | Manager | Lead | Member | Viewer |
|--------|-------|---------|------|--------|--------|
| Projects | CRUD + manage | CRU + manage | RU (own) | R | R |
| Handovers | CRUD + approve | CRU + approve | CRU (own) | R | R |
| Documents | CRUD + approve | CRU + approve | CRU | CRU (own) | R |
| Auth/Users | Full | R + invite | R (project) | R (project) | - |
| Tasks | CRUD + assign | CRU + assign | CRU + assign | CRU (own) | R |
| Notifications | R + system | R | R | R | R |
| Audit Logs | R + export | R + export | R (own) | - | - |
| Financials | CRUD + approve | CRU + approve | R (own) | - | - |
| Reports | R + export | R + export | R (own) | R (dashboard) | R (dashboard) |
| Compliance | CRUD + assess | CRU + assess | RU | R | R |

---

*Source: PRD v1.0 §6, §11.5*
