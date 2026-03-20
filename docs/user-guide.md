# ProjectOpsOS — User Guide

> **Version**: 0.1.0
> **Last updated**: 2026-03-19

ProjectOpsOS is a project operations management system with Vietnamese localization throughout the UI. This guide provides an overview of each module.

---

## Login

Navigate to `/login` and sign in with your credentials. The system supports 5 roles: **admin**, **manager**, **lead**, **member**, and **viewer**. Your role determines which actions are available.

<!-- Screenshot: Login page -->

---

## 1. Dashboard (Tong quan — Bang dieu khien)

**Route**: `/dashboard`

The executive dashboard provides a high-level overview of your organization's project portfolio.

### Components

- **Stat Cards (The thong ke)**: Total projects, active tasks, pending handovers, unread notifications at a glance
- **Project Stage Chart (Bieu do giai doan)**: Visual breakdown of projects by lifecycle stage
- **Task Overview (Tong quan cong viec)**: Task counts by status (open, in-progress, completed, overdue)
- **Recent Activity (Hoat dong gan day)**: Timeline of the latest actions across all modules

<!-- Screenshot: Dashboard page -->

---

## 2. Projects (Du an — Quan ly du an)

**Route**: `/dashboard/projects`

Manage the full lifecycle of projects through an 8-stage state machine.

### Stages (Giai doan)

| Stage | Vietnamese Label |
|-------|-----------------|
| Initiation | Khoi tao |
| Planning | Lap ke hoach |
| In Progress | Dang thuc hien |
| Review | Danh gia |
| UAT | Kiem thu chap nhan |
| Deployment | Trien khai |
| Warranty | Bao hanh |
| Closed | Dong |

### Features

- **Project List (Danh sach du an)**: Searchable, filterable table with pagination. Filter by stage, priority, health status
- **Project Detail (Chi tiet du an)**: Tabbed view with overview, handovers, documents, tasks, finance, and audit log tabs
- **Create/Edit Project (Tao/Sua du an)**: Form with client-side Zod validation
- **Stage Transition (Chuyen giai doan)**: Interactive transition bar with confirmation dialog. Only valid next stages are shown
- **Status Badges**: Color-coded badges for stage, priority (Uu tien), and health (Tinh trang)

<!-- Screenshot: Project list page -->
<!-- Screenshot: Project detail page -->

---

## 3. Handovers (Ban giao — Quan ly ban giao)

**Route**: `/dashboard/handovers`

Track handover records between team members or departments.

### Statuses

| Status | Vietnamese Label |
|--------|-----------------|
| Draft | Ban nhap |
| Pending Review | Cho danh gia |
| Approved | Da duyet |
| Rejected | Bi tu choi |
| Completed | Hoan thanh |

### Features

- **Handover List**: Table with status filters and search
- **Handover Detail**: Full record with from/to users, items checklist, attachments
- **Create/Edit Handover**: Form with type selection (internal/external), checklist items
- **Approval Workflow**: Managers/admins can approve or reject pending handovers

<!-- Screenshot: Handover list page -->

---

## 4. Documents (Tai lieu — Quan ly tai lieu)

**Route**: `/dashboard/documents`

Centralized document management for project artifacts.

### Document Types

| Type | Vietnamese Label |
|------|-----------------|
| Contract | Hop dong |
| Report | Bao cao |
| Meeting Minutes | Bien ban hop |
| Technical Spec | Tai lieu ky thuat |
| Other | Khac |

### Features

- **Document List**: Searchable table with type/status filters
- **Document Detail**: View metadata, version history, associated project
- **Upload**: File upload with metadata form (title, type, description)
- **Status Tracking**: Draft, published, archived states

<!-- Screenshot: Document list page -->

---

## 5. Tasks (Cong viec — Quan ly cong viec)

**Route**: `/dashboard/tasks`

Task management with both list and Kanban board views.

### Statuses

| Status | Vietnamese Label |
|--------|-----------------|
| Open | Mo |
| In Progress | Dang thuc hien |
| Completed | Hoan thanh |
| Cancelled | Huy bo |

### Features

- **Task List (Danh sach cong viec)**: Table view with status, priority, assignee filters
- **Kanban Board (Bang Kanban)**: Drag-and-drop board organized by status columns
- **Task Detail**: Description, assignee, due date, priority, time tracking
- **Task Form**: Create/edit with project association, assignee selection, due date picker
- **Overdue Alerts**: Automatic high-priority notifications for past-due tasks

<!-- Screenshot: Task Kanban board -->

---

## 6. Notifications (Thong bao)

**Route**: `/dashboard/notifications`

System-wide notification center.

### Notification Types

| Type | Vietnamese Label | Trigger |
|------|-----------------|---------|
| Project Stage Changed | Giai doan du an thay doi | Stage transition |
| Handover Approved | Ban giao da duyet | Handover approval |
| Handover Rejected | Ban giao bi tu choi | Handover rejection |
| Task Assigned | Duoc giao cong viec | Task assignment |
| Deadline Overdue | Cong viec qua han | Past due date |
| Finance Approved/Rejected | Tai chinh duoc/bi tu choi | Finance record status change |

### Features

- **Notification Bell (Chuong thong bao)**: Badge count of unread notifications in the navigation
- **Notification List**: All notifications with read/unread state, clickable action URLs
- **Mark as Read**: Individual or bulk mark-as-read

<!-- Screenshot: Notification list -->

---

## 7. Audit Logs (Nhat ky — Nhat ky hoat dong)

**Route**: `/dashboard/audit-logs`

Immutable record of all system actions for compliance and accountability.

### Features

- **Timeline View**: Chronological list of all create, update, delete, approve, reject actions
- **Filters**: Filter by action type, entity type, user, date range
- **Change Diff**: View old/new values for each modification
- **Action Badges**: Color-coded badges by action type (create, update, delete, stage_change, etc.)
- **Severity Badges**: Categorized by impact level

<!-- Screenshot: Audit log timeline -->

---

## 8. Finance (Tai chinh — Quan ly tai chinh)

**Route**: `/dashboard/financials`

Financial record management for project budgets and expenses.

### Features

- **Finance List (Danh sach tai chinh)**: Table with type/category/status filters
- **Finance Detail**: Full record with amount (VND), category, approval status
- **Create/Edit**: Form with amount input, type selection (income/expense), category
- **Summary Cards (The tong hop)**: Total income, total expense, balance, pending approvals
- **CSV Import (Nhap CSV)**: Bulk import financial records from CSV files with row-level validation
- **Approval Workflow**: Managers approve/reject financial records

### Financial Categories

| Type | Vietnamese Label |
|------|-----------------|
| Income | Thu nhap |
| Expense | Chi phi |
| Internal Transfer | Chuyen noi bo |

<!-- Screenshot: Finance list with summary cards -->

---

## 9. Reports (Bao cao)

**Route**: `/dashboard/reports`

Generate and export reports in CSV or JSON format.

### Report Types

| Report | Vietnamese Label | Data |
|--------|-----------------|------|
| Project Summary | Tong hop du an | All projects with stage, health, dates |
| Finance Summary | Tong hop tai chinh | Financial records aggregated by project |
| Task Completion | Hoan thanh cong viec | Task completion rates and durations |
| Handover Status | Trang thai ban giao | Handover records with approval status |

### Features

- **Report Configuration**: Select report type, date range, optional project filter, output format
- **CSV Export**: UTF-8 BOM for Excel compatibility, Vietnamese column headers
- **JSON Export**: Structured JSON with metadata

<!-- Screenshot: Report configuration page -->

---

## 10. Compliance (Tuan thu)

**Route**: `/dashboard/compliance`

Compliance monitoring dashboard for organizational standards.

### Features

- **Compliance Dashboard (Bang tuan thu)**: Overview of compliance metrics across projects
- **Status Indicators**: Visual indicators for compliance health

<!-- Screenshot: Compliance dashboard -->

---

## Partner Portal (Cong doi tac)

**Route**: `/partner`

External-facing portal for project partners with limited access.

### Features

- **Partner Layout**: Simplified navigation for external users
- **Project List**: View assigned projects with read-only access
- **Project Detail**: View project progress, stages, and key metrics

<!-- Screenshot: Partner portal -->

---

## Keyboard Shortcuts & Tips

- Use the search bar in list views to quickly find records
- URL-based filters persist across page refreshes (share filtered views via URL)
- Click column headers to sort tables
- The notification bell in the top navigation shows unread count

---

## Getting Help

- **Technical issues**: Check `docs/troubleshooting.md` for common problems and solutions
- **Deployment**: See `docs/deploy-guide.md` for setup instructions
- **Security**: Review `docs/security-checklist.md` for the security audit report
