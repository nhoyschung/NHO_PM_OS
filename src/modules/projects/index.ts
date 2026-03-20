// ── Projects Module — Public API ──────────────────────────────────
// Re-exports components and constants for cross-module consumption.
// Types: import directly from './types' to avoid name collisions.
// Server actions / queries: import directly from their respective files.

export {
  ProjectList,
  ProjectDetail,
  ProjectForm,
  StageTransitionBar,
  StageBadge,
  PriorityBadge,
  HealthBadge,
} from './components';

export { PERMISSIONS } from './constants';
