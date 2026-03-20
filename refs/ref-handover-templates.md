# Reference: Handover Checklist Templates

> **SOT** for handover checklist templates. Templates auto-populate when a handover is created based on the handover type.

---

## 1. Template Structure

```typescript
interface ChecklistTemplate {
  id: string;                                    // Template identifier
  handover_type: HandoverType;                   // Which handover type uses this
  items: ChecklistTemplateItem[];
}

interface ChecklistTemplateItem {
  title: string;
  title_vi: string;                              // Vietnamese label
  description: string;
  description_vi: string;                        // Vietnamese description
  category: ChecklistCategory;
  priority: 'required' | 'recommended' | 'optional';
  requires_evidence: boolean;
  sort_order: number;
}

type ChecklistCategory =
  | 'documentation'
  | 'access_transfer'
  | 'knowledge_transfer'
  | 'tool_setup'
  | 'review'
  | 'signoff'
  | 'other';

type HandoverType =
  | 'project_transfer'
  | 'stage_transition'
  | 'team_change'
  | 'department_transfer'
  | 'role_change';
```

---

## 2. Template: Project Transfer

**Use case**: Full project ownership transfer from one person/team to another.

| # | Title (EN) | Title (VI) | Category | Priority | Evidence? |
|---|-----------|-----------|----------|----------|-----------|
| 1 | Project overview document updated | Cập nhật tài liệu tổng quan dự án | documentation | required | Yes |
| 2 | Architecture documentation current | Tài liệu kiến trúc cập nhật | documentation | required | Yes |
| 3 | API documentation reviewed | Tài liệu API được đánh giá | documentation | required | Yes |
| 4 | Database schema documentation | Tài liệu schema cơ sở dữ liệu | documentation | required | Yes |
| 5 | Repository access granted | Cấp quyền truy cập repository | access_transfer | required | Yes |
| 6 | Cloud/hosting access transferred | Chuyển quyền truy cập cloud/hosting | access_transfer | required | Yes |
| 7 | CI/CD pipeline access granted | Cấp quyền CI/CD pipeline | access_transfer | required | Yes |
| 8 | Third-party service credentials transferred | Chuyển giao thông tin xác thực dịch vụ bên thứ ba | access_transfer | required | Yes |
| 9 | Knowledge transfer session conducted | Đã tổ chức buổi chuyển giao kiến thức | knowledge_transfer | required | Yes |
| 10 | Known issues and technical debt documented | Ghi nhận các vấn đề và nợ kỹ thuật | knowledge_transfer | required | Yes |
| 11 | Current sprint/backlog status reviewed | Đánh giá tình trạng sprint/backlog hiện tại | knowledge_transfer | required | No |
| 12 | Stakeholder contact list provided | Cung cấp danh sách liên hệ các bên liên quan | knowledge_transfer | recommended | No |
| 13 | Development environment setup guide | Hướng dẫn thiết lập môi trường phát triển | tool_setup | required | Yes |
| 14 | Monitoring and alerting access | Quyền truy cập giám sát và cảnh báo | tool_setup | required | Yes |
| 15 | Project management tool access | Quyền truy cập công cụ quản lý dự án | tool_setup | recommended | No |
| 16 | Code review of critical modules | Đánh giá mã nguồn các module quan trọng | review | required | No |
| 17 | Security review completed | Hoàn thành đánh giá bảo mật | review | recommended | Yes |
| 18 | Receiving party confirmation | Xác nhận của bên nhận | signoff | required | Yes |
| 19 | Transferring party confirmation | Xác nhận của bên giao | signoff | required | Yes |
| 20 | Management approval | Phê duyệt của quản lý | signoff | required | Yes |

---

## 3. Template: Stage Transition

**Use case**: Project moving from one lifecycle stage to the next (e.g., review → testing).

| # | Title (EN) | Title (VI) | Category | Priority | Evidence? |
|---|-----------|-----------|----------|----------|-----------|
| 1 | Stage completion criteria met | Đã đáp ứng tiêu chí hoàn thành giai đoạn | review | required | Yes |
| 2 | All critical tasks completed | Hoàn thành tất cả công việc quan trọng | review | required | No |
| 3 | Outstanding issues documented | Ghi nhận các vấn đề còn tồn đọng | documentation | required | No |
| 4 | Stage deliverables reviewed | Đánh giá sản phẩm bàn giao của giai đoạn | review | required | Yes |
| 5 | Next stage plan prepared | Chuẩn bị kế hoạch giai đoạn tiếp theo | documentation | required | No |
| 6 | Resource allocation confirmed for next stage | Xác nhận phân bổ nguồn lực cho giai đoạn tiếp | review | recommended | No |
| 7 | Risk assessment updated | Cập nhật đánh giá rủi ro | documentation | recommended | No |
| 8 | Team lead approval | Phê duyệt của trưởng nhóm | signoff | required | Yes |
| 9 | Quality gate passed | Vượt qua cổng chất lượng | review | required | Yes |
| 10 | Budget status reviewed | Đánh giá tình trạng ngân sách | review | recommended | No |

---

## 4. Template: Team Change

**Use case**: Team member joining or leaving the project team.

| # | Title (EN) | Title (VI) | Category | Priority | Evidence? |
|---|-----------|-----------|----------|----------|-----------|
| 1 | Task reassignment completed | Hoàn thành phân công lại công việc | knowledge_transfer | required | No |
| 2 | Work in progress status documented | Ghi nhận tình trạng công việc đang thực hiện | documentation | required | No |
| 3 | Repository access updated | Cập nhật quyền truy cập repository | access_transfer | required | Yes |
| 4 | Tool access updated | Cập nhật quyền truy cập công cụ | access_transfer | required | No |
| 5 | Knowledge transfer for ongoing work | Chuyển giao kiến thức cho công việc đang thực hiện | knowledge_transfer | required | No |
| 6 | Team communication channels updated | Cập nhật kênh liên lạc nhóm | tool_setup | recommended | No |
| 7 | Meeting invitations updated | Cập nhật lời mời họp | tool_setup | recommended | No |
| 8 | Team lead acknowledgment | Xác nhận của trưởng nhóm | signoff | required | Yes |

---

## 5. Template: Department Transfer

**Use case**: Project responsibility moving from one department to another.

| # | Title (EN) | Title (VI) | Category | Priority | Evidence? |
|---|-----------|-----------|----------|----------|-----------|
| 1 | Department-specific documentation updated | Cập nhật tài liệu theo phòng ban | documentation | required | Yes |
| 2 | Budget transfer arranged | Sắp xếp chuyển ngân sách | other | required | Yes |
| 3 | Compliance requirements reviewed for new department | Đánh giá yêu cầu tuân thủ cho phòng ban mới | review | required | Yes |
| 4 | All access credentials transferred | Chuyển giao tất cả thông tin xác thực | access_transfer | required | Yes |
| 5 | Cross-department knowledge transfer | Chuyển giao kiến thức liên phòng ban | knowledge_transfer | required | Yes |
| 6 | SLA/timeline agreements updated | Cập nhật thỏa thuận SLA/tiến độ | documentation | required | No |
| 7 | Stakeholder notification sent | Đã gửi thông báo cho các bên liên quan | other | required | No |
| 8 | Inter-department dependency map updated | Cập nhật sơ đồ phụ thuộc liên phòng ban | documentation | recommended | No |
| 9 | Originating department head approval | Phê duyệt của trưởng phòng giao | signoff | required | Yes |
| 10 | Receiving department head approval | Phê duyệt của trưởng phòng nhận | signoff | required | Yes |
| 11 | Executive approval (if required) | Phê duyệt của ban giám đốc (nếu cần) | signoff | recommended | Yes |

---

## 6. Template: Role Change

**Use case**: Person's role within a project changes (e.g., member → lead).

| # | Title (EN) | Title (VI) | Category | Priority | Evidence? |
|---|-----------|-----------|----------|----------|-----------|
| 1 | New role responsibilities documented | Ghi nhận trách nhiệm vai trò mới | documentation | required | No |
| 2 | Access permissions updated | Cập nhật quyền truy cập | access_transfer | required | Yes |
| 3 | Previous role responsibilities transferred | Chuyển giao trách nhiệm vai trò cũ | knowledge_transfer | required | No |
| 4 | Training for new role (if applicable) | Đào tạo cho vai trò mới (nếu cần) | knowledge_transfer | recommended | No |
| 5 | Team notification | Thông báo cho nhóm | other | required | No |
| 6 | Manager approval | Phê duyệt của quản lý | signoff | required | Yes |

---

## 7. Template Registry Implementation

```typescript
// src/modules/handovers/templates.ts

const CHECKLIST_TEMPLATES: Record<HandoverType, ChecklistTemplateItem[]> = {
  project_transfer: [
    {
      title: 'Project overview document updated',
      title_vi: 'Cập nhật tài liệu tổng quan dự án',
      description: 'Ensure the project overview document reflects current state including goals, scope, timeline, and team structure.',
      description_vi: 'Đảm bảo tài liệu tổng quan dự án phản ánh đúng tình trạng hiện tại bao gồm mục tiêu, phạm vi, tiến độ và cấu trúc đội ngũ.',
      category: 'documentation',
      priority: 'required',
      requires_evidence: true,
      sort_order: 1,
    },
    // ... remaining items
  ],
  stage_transition: [/* ... */],
  team_change: [/* ... */],
  department_transfer: [/* ... */],
  role_change: [/* ... */],
};

export function getChecklistTemplate(handoverType: HandoverType): ChecklistTemplateItem[] {
  return CHECKLIST_TEMPLATES[handoverType] ?? [];
}

export function createChecklistFromTemplate(
  handoverId: string,
  handoverType: HandoverType
): ChecklistItem[] {
  const template = getChecklistTemplate(handoverType);
  return template.map((item, index) => ({
    id: crypto.randomUUID(),
    handover_id: handoverId,
    title: item.title_vi,          // Default to Vietnamese
    description: item.description_vi,
    category: item.category,
    priority: item.priority,
    is_completed: false,
    requires_evidence: item.requires_evidence,
    sort_order: item.sort_order,
    template_id: `${handoverType}-${index + 1}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}
```

---

## 8. Template Customization Rules

1. **Templates are starting points** — users can add, remove, or modify items after creation
2. **Required items cannot be skipped** for handover completion (unless manually changed to 'optional')
3. **Template IDs preserved** — `template_id` field tracks which items came from templates vs. manually added
4. **Bilingual** — all templates include both English and Vietnamese; Vietnamese is the default display language
5. **Evidence URLs** — when `requires_evidence` is true, the item cannot be marked complete without either `evidence_url` or `evidence_notes`

---

## 9. Statistics

| Template | Total Items | Required | Recommended | Optional |
|----------|------------|----------|-------------|----------|
| Project Transfer | 20 | 16 | 4 | 0 |
| Stage Transition | 10 | 7 | 3 | 0 |
| Team Change | 8 | 5 | 3 | 0 |
| Department Transfer | 11 | 8 | 3 | 0 |
| Role Change | 6 | 4 | 2 | 0 |

---

*Source: PRD v1.0 §6 (F02)*
