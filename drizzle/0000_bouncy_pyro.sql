CREATE TYPE "public"."audit_action" AS ENUM('create', 'read', 'update', 'delete', 'login', 'logout', 'login_failed', 'export', 'import', 'approve', 'reject', 'assign', 'unassign', 'stage_change', 'status_change', 'handover_initiate', 'handover_complete', 'permission_grant', 'permission_revoke', 'settings_change', 'billing_change');--> statement-breakpoint
CREATE TYPE "public"."audit_entity_type" AS ENUM('project', 'task', 'handover', 'document', 'user', 'role', 'department', 'settings', 'billing', 'notification');--> statement-breakpoint
CREATE TYPE "public"."audit_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."checklist_category" AS ENUM('documentation', 'access_transfer', 'knowledge_transfer', 'tool_setup', 'review', 'signoff', 'other');--> statement-breakpoint
CREATE TYPE "public"."checklist_priority" AS ENUM('required', 'recommended', 'optional');--> statement-breakpoint
CREATE TYPE "public"."compliance_framework" AS ENUM('iso_27001', 'soc2', 'gdpr', 'hipaa', 'pci_dss', 'nist', 'custom');--> statement-breakpoint
CREATE TYPE "public"."compliance_status" AS ENUM('not_started', 'in_progress', 'implemented', 'verified', 'non_compliant', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('desktop', 'mobile', 'tablet', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('draft', 'review', 'approved', 'archived', 'obsolete');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('requirement', 'design', 'technical', 'test_plan', 'user_guide', 'handover', 'report', 'meeting_notes', 'other');--> statement-breakpoint
CREATE TYPE "public"."financial_category" AS ENUM('labor', 'software', 'hardware', 'infrastructure', 'consulting', 'training', 'travel', 'other');--> statement-breakpoint
CREATE TYPE "public"."financial_status" AS ENUM('pending', 'approved', 'rejected', 'processed');--> statement-breakpoint
CREATE TYPE "public"."financial_type" AS ENUM('budget_allocation', 'expense', 'invoice', 'payment', 'refund', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."handover_status" AS ENUM('draft', 'pending_review', 'in_review', 'approved', 'rejected', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."handover_type" AS ENUM('project_transfer', 'stage_transition', 'team_change', 'department_transfer', 'role_change');--> statement-breakpoint
CREATE TYPE "public"."health_status" AS ENUM('on_track', 'at_risk', 'delayed', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('urgent', 'high', 'normal', 'low');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('task_assigned', 'task_status_changed', 'task_comment', 'handover_initiated', 'handover_approved', 'handover_rejected', 'project_stage_changed', 'document_shared', 'document_approved', 'mention', 'deadline_approaching', 'deadline_overdue', 'system_alert', 'report_generated');--> statement-breakpoint
CREATE TYPE "public"."project_member_role" AS ENUM('owner', 'lead', 'member', 'reviewer', 'observer');--> statement-breakpoint
CREATE TYPE "public"."project_priority" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."project_stage" AS ENUM('initiation', 'planning', 'in_progress', 'review', 'testing', 'staging', 'deployment', 'monitoring', 'handover', 'completed');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('critical', 'high', 'medium', 'low', 'none');--> statement-breakpoint
CREATE TYPE "public"."setting_scope" AS ENUM('system', 'organization', 'user');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro', 'team', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('feature', 'bug', 'improvement', 'documentation', 'testing', 'deployment', 'research', 'other');--> statement-breakpoint
CREATE TYPE "public"."transition_direction" AS ENUM('forward', 'backward');--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"change_summary" text,
	"content" text,
	"file_path" text,
	"file_size" integer,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"handover_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"type" "document_type" DEFAULT 'other' NOT NULL,
	"file_path" text,
	"file_size" integer,
	"mime_type" text,
	"content" text,
	"current_version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid NOT NULL,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "handover_checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handover_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" "checklist_category" DEFAULT 'other' NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_by" uuid,
	"completed_at" timestamp with time zone,
	"priority" "checklist_priority" DEFAULT 'required' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"requires_evidence" boolean DEFAULT false NOT NULL,
	"evidence_url" text,
	"evidence_notes" text,
	"template_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "handovers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "handover_type" NOT NULL,
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"from_department_id" uuid,
	"to_department_id" uuid,
	"status" "handover_status" DEFAULT 'draft' NOT NULL,
	"from_stage" text,
	"to_stage" text,
	"initiated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"review_started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"due_date" timestamp with time zone,
	"approved_by" uuid,
	"rejection_reason" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "project_member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"from_stage" "project_stage" NOT NULL,
	"to_stage" "project_stage" NOT NULL,
	"direction" "transition_direction" NOT NULL,
	"trigger" text NOT NULL,
	"triggered_by" uuid NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"category" text,
	"priority" "project_priority" DEFAULT 'medium' NOT NULL,
	"province" text,
	"district" text,
	"stage" "project_stage" DEFAULT 'initiation' NOT NULL,
	"manager_id" uuid,
	"department_id" uuid,
	"team_lead_id" uuid,
	"created_by_id" uuid,
	"start_date" date,
	"end_date" date,
	"actual_end_date" date,
	"budget" integer,
	"budget_spent" integer DEFAULT 0,
	"currency" text DEFAULT 'VND',
	"progress_percentage" integer DEFAULT 0,
	"health_status" "health_status" DEFAULT 'on_track',
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "projects_code_unique" UNIQUE("code"),
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"code" text NOT NULL,
	"parent_id" uuid,
	"head_user_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name"),
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role_id" uuid NOT NULL,
	"department_id" uuid,
	"invited_by" uuid NOT NULL,
	"token" text NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"device_type" "device_type",
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"full_name" text,
	"avatar_url" text,
	"department_id" uuid,
	"role_id" uuid NOT NULL,
	"stripe_customer_id" text,
	"subscription_status" "subscription_status" DEFAULT 'incomplete',
	"subscription_tier" "subscription_tier" DEFAULT 'free',
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"timezone" text DEFAULT 'UTC',
	"locale" text DEFAULT 'en',
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"user_email" text,
	"user_role" text,
	"action" "audit_action" NOT NULL,
	"entity_type" "audit_entity_type" NOT NULL,
	"entity_id" uuid,
	"entity_name" text,
	"project_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"description" text,
	"ip_address" text,
	"user_agent" text,
	"request_id" text,
	"severity" "audit_severity" DEFAULT 'info' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"framework" "compliance_framework" NOT NULL,
	"control_id" text NOT NULL,
	"control_name" text NOT NULL,
	"status" "compliance_status" DEFAULT 'not_started' NOT NULL,
	"description" text,
	"evidence_description" text,
	"evidence_url" text,
	"assessed_by" uuid,
	"assessed_at" timestamp with time zone,
	"next_review_date" date,
	"risk_level" "risk_level",
	"remediation_plan" text,
	"remediation_deadline" date,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"responsible_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"type" "financial_type" NOT NULL,
	"category" "financial_category" DEFAULT 'other' NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'VND' NOT NULL,
	"description" text NOT NULL,
	"reference_number" text,
	"transaction_date" date NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"status" "financial_status" DEFAULT 'pending' NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"priority" "notification_priority" DEFAULT 'normal' NOT NULL,
	"project_id" uuid,
	"task_id" uuid,
	"handover_id" uuid,
	"document_id" uuid,
	"actor_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"action_url" text,
	"email_sent" boolean DEFAULT false NOT NULL,
	"email_sent_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" "setting_scope" NOT NULL,
	"scope_id" uuid,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"is_secret" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"parent_comment_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"code" text NOT NULL,
	"type" "task_type" DEFAULT 'feature' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"status" "task_status" DEFAULT 'backlog' NOT NULL,
	"assignee_id" uuid,
	"reporter_id" uuid NOT NULL,
	"project_stage" text,
	"start_date" date,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"estimated_hours" integer,
	"actual_hours" integer,
	"parent_task_id" uuid,
	"depends_on" jsonb DEFAULT '[]'::jsonb,
	"acceptance_criteria" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "idx_document_versions_document" ON "document_versions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_documents_project" ON "documents" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_documents_handover" ON "documents" USING btree ("handover_id");--> statement-breakpoint
CREATE INDEX "idx_documents_type" ON "documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_documents_status" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_documents_created_by" ON "documents" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_checklist_items_handover" ON "handover_checklist_items" USING btree ("handover_id");--> statement-breakpoint
CREATE INDEX "idx_handovers_project" ON "handovers" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_handovers_from_user" ON "handovers" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "idx_handovers_to_user" ON "handovers" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "idx_handovers_status" ON "handovers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_project_members_project" ON "project_members" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_members_user" ON "project_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_project_members_unique" ON "project_members" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_stage_history_project" ON "project_stage_history" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_stage_history_created" ON "project_stage_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_projects_manager" ON "projects" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "idx_projects_department" ON "projects" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_projects_stage" ON "projects" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "idx_projects_priority" ON "projects" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_projects_health" ON "projects" USING btree ("health_status");--> statement-breakpoint
CREATE INDEX "idx_projects_code" ON "projects" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_projects_created_by" ON "projects" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "idx_departments_parent" ON "departments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_departments_code" ON "departments" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_roles_name" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_user_invitations_email" ON "user_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_user_invitations_status" ON "user_invitations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_invitations_token" ON "user_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_user" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_started" ON "user_sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_users_department" ON "users" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_project" ON "audit_logs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_severity" ON "audit_logs" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_compliance_records_project" ON "compliance_records" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_compliance_records_framework" ON "compliance_records" USING btree ("framework");--> statement-breakpoint
CREATE INDEX "idx_compliance_records_status" ON "compliance_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_compliance_records_risk" ON "compliance_records" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "idx_financial_records_project" ON "financial_records" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_financial_records_type" ON "financial_records" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_financial_records_status" ON "financial_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_financial_records_date" ON "financial_records" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_type" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_notifications_created" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_settings_scope" ON "settings" USING btree ("scope","scope_id");--> statement-breakpoint
CREATE INDEX "idx_settings_key" ON "settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_task_comments_task" ON "task_comments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_task_comments_author" ON "task_comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_project" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_assignee" ON "tasks" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tasks_priority" ON "tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_tasks_due_date" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_tasks_parent" ON "tasks" USING btree ("parent_task_id");