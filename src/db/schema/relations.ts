import { relations } from 'drizzle-orm';
import {
  users,
  departments,
  roles,
  userSessions,
  userInvitations,
} from './foundation';
import {
  projects,
  projectMembers,
  handovers,
  handoverChecklistItems,
  documents,
  documentVersions,
  projectStageHistory,
} from './core';
import {
  tasks,
  taskComments,
  notifications,
  auditLogs,
  financialRecords,
  complianceRecords,
  settings,
} from './operations';

// ── Foundation Relations ──────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
    relationName: 'userDepartment',
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  sessions: many(userSessions),
  invitationsSent: many(userInvitations),
  managedProjects: many(projects, { relationName: 'projectManager' }),
  ledProjects: many(projects, { relationName: 'projectTeamLead' }),
  createdProjects: many(projects, { relationName: 'projectCreator' }),
  projectMemberships: many(projectMembers),
  assignedTasks: many(tasks, { relationName: 'taskAssignee' }),
  reportedTasks: many(tasks, { relationName: 'taskReporter' }),
  notifications: many(notifications, { relationName: 'notificationRecipient' }),
  auditLogs: many(auditLogs),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  parent: one(departments, {
    fields: [departments.parentId],
    references: [departments.id],
    relationName: 'departmentHierarchy',
  }),
  children: many(departments, { relationName: 'departmentHierarchy' }),
  members: many(users, { relationName: 'userDepartment' }),
  head: one(users, {
    fields: [departments.headUserId],
    references: [users.id],
    relationName: 'departmentHead',
  }),
  projects: many(projects),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const userInvitationsRelations = relations(userInvitations, ({ one }) => ({
  role: one(roles, {
    fields: [userInvitations.roleId],
    references: [roles.id],
  }),
  department: one(departments, {
    fields: [userInvitations.departmentId],
    references: [departments.id],
  }),
  inviter: one(users, {
    fields: [userInvitations.invitedBy],
    references: [users.id],
  }),
}));

// ── Core Relations ────────────────────────────────────────────────

export const projectsRelations = relations(projects, ({ one, many }) => ({
  manager: one(users, {
    fields: [projects.managerId],
    references: [users.id],
    relationName: 'projectManager',
  }),
  teamLead: one(users, {
    fields: [projects.teamLeadId],
    references: [users.id],
    relationName: 'projectTeamLead',
  }),
  createdBy: one(users, {
    fields: [projects.createdById],
    references: [users.id],
    relationName: 'projectCreator',
  }),
  department: one(departments, {
    fields: [projects.departmentId],
    references: [departments.id],
  }),
  members: many(projectMembers),
  handovers: many(handovers),
  documents: many(documents),
  tasks: many(tasks),
  stageHistory: many(projectStageHistory),
  financialRecords: many(financialRecords),
  complianceRecords: many(complianceRecords),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const handoversRelations = relations(handovers, ({ one, many }) => ({
  project: one(projects, {
    fields: [handovers.projectId],
    references: [projects.id],
  }),
  fromUser: one(users, {
    fields: [handovers.fromUserId],
    references: [users.id],
    relationName: 'handoverFrom',
  }),
  toUser: one(users, {
    fields: [handovers.toUserId],
    references: [users.id],
    relationName: 'handoverTo',
  }),
  approvedByUser: one(users, {
    fields: [handovers.approvedBy],
    references: [users.id],
    relationName: 'handoverApprover',
  }),
  fromDepartment: one(departments, {
    fields: [handovers.fromDepartmentId],
    references: [departments.id],
    relationName: 'handoverFromDept',
  }),
  toDepartment: one(departments, {
    fields: [handovers.toDepartmentId],
    references: [departments.id],
    relationName: 'handoverToDept',
  }),
  checklistItems: many(handoverChecklistItems),
  documents: many(documents),
}));

export const handoverChecklistItemsRelations = relations(
  handoverChecklistItems,
  ({ one }) => ({
    handover: one(handovers, {
      fields: [handoverChecklistItems.handoverId],
      references: [handovers.id],
    }),
    completedByUser: one(users, {
      fields: [handoverChecklistItems.completedBy],
      references: [users.id],
    }),
  }),
);

export const documentsRelations = relations(documents, ({ one, many }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  handover: one(handovers, {
    fields: [documents.handoverId],
    references: [handovers.id],
  }),
  createdByUser: one(users, {
    fields: [documents.createdBy],
    references: [users.id],
  }),
  versions: many(documentVersions),
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id],
  }),
  createdByUser: one(users, {
    fields: [documentVersions.createdBy],
    references: [users.id],
  }),
}));

export const projectStageHistoryRelations = relations(
  projectStageHistory,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectStageHistory.projectId],
      references: [projects.id],
    }),
    triggeredByUser: one(users, {
      fields: [projectStageHistory.triggeredBy],
      references: [users.id],
    }),
  }),
);

// ── Operations Relations ──────────────────────────────────────────

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: 'taskAssignee',
  }),
  reporter: one(users, {
    fields: [tasks.reporterId],
    references: [users.id],
    relationName: 'taskReporter',
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: 'taskHierarchy',
  }),
  subtasks: many(tasks, { relationName: 'taskHierarchy' }),
  comments: many(taskComments),
}));

export const taskCommentsRelations = relations(taskComments, ({ one, many }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  author: one(users, {
    fields: [taskComments.authorId],
    references: [users.id],
  }),
  parentComment: one(taskComments, {
    fields: [taskComments.parentCommentId],
    references: [taskComments.id],
    relationName: 'commentThread',
  }),
  replies: many(taskComments, { relationName: 'commentThread' }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
    relationName: 'notificationRecipient',
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
    relationName: 'notificationActor',
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [notifications.taskId],
    references: [tasks.id],
  }),
  handover: one(handovers, {
    fields: [notifications.handoverId],
    references: [handovers.id],
  }),
  document: one(documents, {
    fields: [notifications.documentId],
    references: [documents.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [auditLogs.projectId],
    references: [projects.id],
  }),
}));

export const financialRecordsRelations = relations(financialRecords, ({ one }) => ({
  project: one(projects, {
    fields: [financialRecords.projectId],
    references: [projects.id],
  }),
  approvedByUser: one(users, {
    fields: [financialRecords.approvedBy],
    references: [users.id],
    relationName: 'financialApprover',
  }),
  createdByUser: one(users, {
    fields: [financialRecords.createdBy],
    references: [users.id],
    relationName: 'financialCreator',
  }),
}));

export const complianceRecordsRelations = relations(complianceRecords, ({ one }) => ({
  project: one(projects, {
    fields: [complianceRecords.projectId],
    references: [projects.id],
  }),
  assessedByUser: one(users, {
    fields: [complianceRecords.assessedBy],
    references: [users.id],
    relationName: 'complianceAssessor',
  }),
  responsibleUser: one(users, {
    fields: [complianceRecords.responsibleId],
    references: [users.id],
    relationName: 'complianceResponsible',
  }),
}));
