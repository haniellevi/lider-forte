// Componentes existentes
export { SuccessLadderRanking } from './SuccessLadderRanking';
export { ActivityRegistrationForm } from './ActivityRegistrationForm';
export { MemberScoreProfile } from './MemberScoreProfile';

// Novos componentes da interface gamificada
export { SuccessLadderDashboard } from './SuccessLadderDashboard';
export { LevelProgressBar, CompactLevelProgress } from './LevelProgressBar';
export { BadgeSystem, RecentBadges } from './BadgeSystem';
export { ActivityFeed, CompactActivityFeed } from './ActivityFeed';
export { LeaderboardWidget, Podium } from './LeaderboardWidget';
export { 
  AnimatedCounter, 
  ScoreCounter, 
  StatCounter 
} from './AnimatedCounter';
export { LevelUpModal, useLevelUpModal } from './LevelUpModal';

// Tipos e constantes
export type {
  LadderLevel,
  Badge,
  BadgeCategory,
  Activity,
  MemberStats,
  LeaderboardEntry
} from './types';

export {
  LADDER_LEVELS,
  BADGE_CATEGORIES,
  ACTIVITY_ICONS,
  getCurrentLevel,
  getNextLevel,
  getProgressToNextLevel,
  getAllBadges,
  getCategoryBadges,
  getActivityIcon
} from './types';

// Levels and Badges System Components
export * from './LevelsAndBadges';

// Re-export hooks for convenience
export { 
  useSuccessLadderActivities,
  useMemberScore,
  useSuccessLadderRankings,
  useRegisterActivity,
  useBulkAttendanceRegistration,
  useCreateActivity,
  useSuccessLadderStats
} from '@/hooks/queries/useSuccessLadder';

// Levels and Badges hooks
export {
  useBadges,
  useMemberBadges,
  useCreateBadge,
  useUpdateBadge,
  useDeleteBadge,
  useAwardBadge,
  useBadgeMetadata
} from '@/hooks/queries/useBadges';

export {
  useLadderLevels,
  useMemberLevel,
  useLeaderboard,
  useCreateLadderLevel,
  useUpdateLadderLevel,
  getLevelByScore,
  useLevelProgress,
  useLevelStatistics
} from '@/hooks/queries/useLevels';