# Reference: UI Screen Specifications

> **SOT** for all UI screens, routes, layouts, and component hierarchy. Extracted from PRD §6, §16.1.

---

## 1. Route Map

### Public Routes (No Auth Required)

| Route | Page | Layout |
|-------|------|--------|
| `/` | Landing Page | `(marketing)` layout |
| `/pricing` | Pricing Page | `(marketing)` layout |
| `/login` | Login Page | `(auth)` layout |
| `/signup` | Signup Page | `(auth)` layout |
| `/forgot-password` | Forgot Password | `(auth)` layout |
| `/reset-password` | Reset Password | `(auth)` layout |
| `/callback` | OAuth Callback | `(auth)` layout (API route) |

### Protected Routes (Auth Required)

| Route | Page | Module | Access |
|-------|------|--------|--------|
| `/dashboard` | Dashboard Home / Reports Overview | F09 | All roles |
| `/dashboard/projects` | Project List | F01 | All roles |
| `/dashboard/projects/new` | Create Project | F01 | Admin, Manager, Lead |
| `/dashboard/projects/[slug]` | Project Detail | F01 | Project members |
| `/dashboard/projects/[slug]/edit` | Edit Project | F01 | Owner, Lead, Admin |
| `/dashboard/projects/[slug]/members` | Project Members | F01 | Owner, Lead, Admin |
| `/dashboard/projects/[slug]/tasks` | Project Tasks | F05 | Project members |
| `/dashboard/projects/[slug]/tasks/new` | Create Task | F05 | Project members |
| `/dashboard/projects/[slug]/handovers` | Project Handovers | F02 | Project members |
| `/dashboard/projects/[slug]/handovers/new` | Create Handover | F02 | Admin, Manager, Lead |
| `/dashboard/projects/[slug]/documents` | Project Documents | F03 | Project members |
| `/dashboard/projects/[slug]/financials` | Project Financials | F08 | Admin, Manager, Lead |
| `/dashboard/projects/[slug]/compliance` | Project Compliance | F10 | Admin, Manager, Lead |
| `/dashboard/projects/[slug]/audit` | Project Audit Trail | F07 | Admin, Manager |
| `/dashboard/projects/[slug]/report` | Project Report | F09 | Admin, Manager, Lead |
| `/dashboard/tasks` | My Tasks | F05 | All roles |
| `/dashboard/tasks/[id]` | Task Detail | F05 | Project members |
| `/dashboard/handovers` | My Handovers | F02 | All roles |
| `/dashboard/handovers/[id]` | Handover Detail | F02 | Handover parties + admin |
| `/dashboard/documents` | All Documents | F03 | All roles |
| `/dashboard/documents/new` | Create Document | F03 | All roles |
| `/dashboard/documents/[id]` | Document Detail | F03 | Author + shared users |
| `/dashboard/documents/[id]/edit` | Edit Document | F03 | Author + admin |
| `/dashboard/notifications` | Notifications | F06 | All roles |
| `/dashboard/reports` | Reports Overview | F09 | Admin, Manager |
| `/dashboard/financials` | Financial Overview | F08 | Admin, Manager |
| `/dashboard/compliance` | Compliance Overview | F10 | Admin, Manager |
| `/dashboard/audit-log` | Audit Log | F07 | Admin, Manager |
| `/dashboard/settings` | User Profile | F04 | All roles |
| `/dashboard/settings/users` | User Management | F04 | Admin |
| `/dashboard/settings/departments` | Department Management | F04 | Admin |
| `/dashboard/settings/roles` | Role Management | F04 | Admin |
| `/dashboard/settings/notifications` | Notification Preferences | F06 | All roles |

---

## 2. Layout Hierarchy

```
app/layout.tsx                          # Root: HTML, fonts, theme, Toaster
├── (auth)/layout.tsx                   # Auth: centered card, no sidebar
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
├── (marketing)/layout.tsx              # Marketing: header + footer, no sidebar
│   ├── page.tsx                        # Landing
│   └── pricing/page.tsx
└── (dashboard)/layout.tsx              # Dashboard: sidebar + header + main
    ├── page.tsx                        # Dashboard home
    ├── projects/...
    ├── tasks/...
    ├── handovers/...
    ├── documents/...
    ├── notifications/...
    ├── reports/...
    ├── financials/...
    ├── compliance/...
    ├── audit-log/...
    └── settings/...
```

---

## 3. Dashboard Layout Specification

```
┌─────────────────────────────────────────────────────┐
│ Header (64px)                                        │
│ ┌─────┬──────────────────────────────────┬────────┐ │
│ │ Logo│ Search                            │ Bell N │ │
│ │     │                                  │ Avatar │ │
│ └─────┴──────────────────────────────────┴────────┘ │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │ Main Content                              │
│ (256px)  │                                          │
│          │ ┌──────────────────────────────────────┐ │
│ □ Tổng   │ │ Page Header                          │ │
│   quan   │ │ Title + Actions                      │ │
│ □ Dự án  │ ├──────────────────────────────────────┤ │
│ □ Công   │ │                                      │ │
│   việc   │ │ Page Content                         │ │
│ □ Bàn    │ │                                      │ │
│   giao   │ │                                      │ │
│ □ Tài    │ │                                      │ │
│   liệu   │ │                                      │ │
│          │ │                                      │ │
│ ─────── │ │                                      │ │
│ □ Báo   │ │                                      │ │
│   cáo   │ │                                      │ │
│ □ Tài   │ │                                      │ │
│   chính  │ │                                      │ │
│ □ Tuân  │ │                                      │ │
│   thủ   │ │                                      │ │
│ □ Nhật  │ │                                      │ │
│   ký    │ │                                      │ │
│          │ │                                      │ │
│ ─────── │ │                                      │ │
│ □ Cài   │ │                                      │ │
│   đặt   │ └──────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────┘
```

### Header Components
- Logo (links to `/dashboard`)
- Global search bar (searches across projects, tasks, documents)
- Notification bell with unread count badge
- User avatar with dropdown (profile, settings, logout)

### Sidebar Navigation

| Icon | Vietnamese Label | English | Route | Access |
|------|-----------------|---------|-------|--------|
| LayoutDashboard | Tổng quan | Dashboard | `/dashboard` | All |
| FolderKanban | Dự án | Projects | `/dashboard/projects` | All |
| CheckSquare | Công việc của tôi | My Tasks | `/dashboard/tasks` | All |
| ArrowRightLeft | Bàn giao | Handovers | `/dashboard/handovers` | All |
| FileText | Tài liệu | Documents | `/dashboard/documents` | All |
| --- | --- (separator) | --- | --- | --- |
| BarChart3 | Báo cáo | Reports | `/dashboard/reports` | Admin, Manager |
| DollarSign | Tài chính | Financials | `/dashboard/financials` | Admin, Manager |
| Shield | Tuân thủ | Compliance | `/dashboard/compliance` | Admin, Manager |
| ScrollText | Nhật ký kiểm toán | Audit Log | `/dashboard/audit-log` | Admin, Manager |
| --- | --- (separator) | --- | --- | --- |
| Settings | Cài đặt | Settings | `/dashboard/settings` | All |

---

## 4. Common Component Patterns

### 4.1 List Page Pattern

Every list page follows the same structure:

```
┌──────────────────────────────────────────────┐
│ Page Title              [+ Tạo mới] button   │
├──────────────────────────────────────────────┤
│ Filters Bar                                   │
│ [Search] [Status ▼] [Priority ▼] [More ▼]   │
├──────────────────────────────────────────────┤
│ Results: 42 items                 View: □ ≡   │
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ │
│ │ Item Row / Card                          │ │
│ │ Name | Status Badge | Priority | Date    │ │
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │ Item Row / Card                          │ │
│ └──────────────────────────────────────────┘ │
│ ...                                          │
├──────────────────────────────────────────────┤
│ Pagination: [< 1 2 3 ... 5 >]               │
└──────────────────────────────────────────────┘
```

### 4.2 Detail Page Pattern

```
┌──────────────────────────────────────────────┐
│ ← Back to List    Title           [Edit] [...] │
├──────────────────────────────────────────────┤
│ ┌─────────────────────┬────────────────────┐ │
│ │ Main Content        │ Sidebar            │ │
│ │                     │                    │ │
│ │ Description         │ Status: Badge      │ │
│ │                     │ Priority: Badge    │ │
│ │ Tabs:               │ Owner: Avatar      │ │
│ │ [Overview|Tasks|    │ Department: Text   │ │
│ │  Docs|History]      │ Created: Date      │ │
│ │                     │ Updated: Date      │ │
│ │ Tab Content         │                    │ │
│ │                     │ Actions:           │ │
│ │                     │ [Transition Stage] │ │
│ │                     │ [Archive]          │ │
│ └─────────────────────┴────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 4.3 Form Page Pattern

```
┌──────────────────────────────────────────────┐
│ ← Back    Create / Edit {Entity}              │
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ │
│ │ Form                                     │ │
│ │                                          │ │
│ │ Tên dự án *                              │ │
│ │ [_________________________________]      │ │
│ │                                          │ │
│ │ Mô tả                                   │ │
│ │ [_________________________________]      │ │
│ │ [_________________________________]      │ │
│ │                                          │ │
│ │ Ưu tiên *          Phòng ban             │ │
│ │ [Trung bình ▼]     [Chọn... ▼]          │ │
│ │                                          │ │
│ │ Ngày bắt đầu       Ngày kết thúc        │ │
│ │ [__/__/____]        [__/__/____]         │ │
│ │                                          │ │
│ │              [Hủy]  [Lưu]               │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

---

## 5. Responsive Breakpoints

| Breakpoint | Width | Layout Behavior |
|-----------|-------|-----------------|
| Mobile | < 640px (sm) | Sidebar collapsed to hamburger menu, single column |
| Tablet | 640-1024px (md) | Sidebar icon-only (64px), content adapts |
| Desktop | 1024-1280px (lg) | Full sidebar (256px), content area fills |
| Wide | > 1280px (xl) | Full sidebar, content max-width 1200px centered |

---

## 6. Component Library (shadcn/ui)

### Required Components

| Component | Usage |
|-----------|-------|
| Button | All actions |
| Card | Cards, panels |
| Dialog | Confirmations, modals |
| DropdownMenu | Actions menu, user menu |
| Input | Text inputs |
| Label | Form labels |
| Select | Dropdowns |
| Table | Data tables |
| Tabs | Detail page tabs |
| Badge | Status indicators |
| Toast | Success/error messages |
| Pagination | List pagination |
| Skeleton | Loading states |
| Tooltip | Help text |
| Avatar | User avatars |
| Sidebar | Dashboard sidebar |
| Breadcrumb | Navigation breadcrumbs |
| Command | Search dialog (Cmd+K) |
| Calendar | Date pickers |
| Progress | Progress bars |

---

## 7. Loading & Error States

### Loading
- Skeleton components for initial page load
- Spinner for async actions (form submission, data refresh)
- Progress bar for multi-step operations

### Error
- Form validation: inline error messages below fields (Vietnamese)
- API errors: Toast notification with error message
- 404: Custom not-found page
- Error boundary: `error.tsx` with retry button

### Empty States
- Lists with no data: illustration + message + action button
- Vietnamese messages: "Chưa có dự án nào. Tạo dự án đầu tiên."

---

*Source: PRD v1.0 §6, §7, §16.1*
