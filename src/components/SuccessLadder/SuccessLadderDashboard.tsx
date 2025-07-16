"use client";

import { FC, useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { 
  useMemberScore, 
  useSuccessLadderRankings, 
  useSuccessLadderActivities 
} from '@/hooks/queries/useSuccessLadder';
import { 
  MemberStats, 
  Activity, 
  LeaderboardEntry, 
  Badge,
  getCurrentLevel,
  getNextLevel,
  getProgressToNextLevel,
  getAllBadges
} from './types';

// Componentes
import { LevelProgressBar } from './LevelProgressBar';
import { BadgeSystem } from './BadgeSystem';
import { ActivityFeed, CompactActivityFeed } from './ActivityFeed';
import { LeaderboardWidget, Podium } from './LeaderboardWidget';
import { StatCounter, ScoreCounter } from './AnimatedCounter';
import { LevelUpModal, useLevelUpModal } from './LevelUpModal';

interface SuccessLadderDashboardProps {
  memberId: string;
  cellId?: string;
  churchId?: string;
  className?: string;
  layout?: 'full' | 'compact';
  showRanking?: boolean;
  showBadges?: boolean;
  showActivityFeed?: boolean;
}

export const SuccessLadderDashboard: FC<SuccessLadderDashboardProps> = ({
  memberId,
  cellId,
  churchId,
  className,
  layout = 'full',
  showRanking = true,
  showBadges = true,
  showActivityFeed = true
}) => {
  const t = useTranslations('SuccessLadder');
  const [previousScore, setPreviousScore] = useState(0);
  const { isOpen, modalData, showLevelUp, hideLevelUp } = useLevelUpModal();

  // Hooks para buscar dados
  const { data: memberData, isLoading: loadingMember } = useMemberScore(memberId, {
    include_history: true,
    days: 30
  });

  const { data: rankingData, isLoading: loadingRanking } = useSuccessLadderRankings({
    type: cellId ? 'cell' : 'church',
    cell_id: cellId,
    limit: 10,
    period: 'all'
  });

  const { data: activitiesData, isLoading: loadingActivities } = useSuccessLadderActivities({
    is_active: true,
    limit: 20
  });

  // Processar dados do membro
  const memberStats: MemberStats | null = useMemo(() => {
    if (!memberData) return null;

    const currentScore = memberData.member.current_score || 0;
    const currentLevel = getCurrentLevel(currentScore);
    const nextLevel = getNextLevel(currentLevel);
    const progressToNextLevel = getProgressToNextLevel(currentScore);

    // Simular badges baseados na pontuação e dados
    const allBadges = getAllBadges();
    const unlockedBadges = allBadges.filter(badge => {
      // Lógica simplificada para demonstração
      switch (badge.id) {
        case 'perfect_month':
          return currentScore >= 100;
        case 'first_timoteo':
          return currentLevel.id >= 5;
        case 'student':
          return currentScore >= 200;
        case 'volunteer':
          return currentScore >= 50;
        default:
          return Math.random() > 0.7; // Random para demonstração
      }
    });

    // Converter atividades recentes
    const recentActivities: Activity[] = memberData.history?.recent_activities?.map((activity: any) => ({
      id: activity.id || Math.random().toString(),
      name: activity.activity_name || 'Atividade',
      points: activity.points || 0,
      category: activity.category || 'GENERAL',
      icon: '📋',
      timestamp: new Date(activity.created_at || Date.now()),
      metadata: activity.metadata
    })) || [];

    return {
      currentScore,
      currentLevel,
      nextLevel,
      progressToNextLevel,
      totalActivities: memberData.history?.total_activities || 0,
      rank: memberData.member.cell_ranking?.position || 0,
      monthlyScore: memberData.history?.total_points_period || 0,
      weeklyScore: Math.floor(memberData.history?.total_points_period * 0.3) || 0,
      badges: unlockedBadges,
      recentActivities
    };
  }, [memberData]);

  // Processar dados do ranking
  const leaderboardEntries: LeaderboardEntry[] = useMemo(() => {
    if (!rankingData?.ranking) return [];

    return rankingData.ranking.map((entry: any) => ({
      id: entry.profile_id,
      name: entry.full_name,
      score: entry.success_ladder_score,
      level: getCurrentLevel(entry.success_ladder_score),
      rank: entry.rank,
      isCurrentUser: entry.profile_id === memberId
    }));
  }, [rankingData, memberId]);

  // Detectar level up
  useEffect(() => {
    if (memberStats && previousScore > 0) {
      const previousLevel = getCurrentLevel(previousScore);
      const currentLevel = memberStats.currentLevel;
      
      if (currentLevel.id > previousLevel.id) {
        showLevelUp({
          newLevel: currentLevel,
          previousLevel,
          totalPoints: memberStats.currentScore,
          pointsGained: memberStats.currentScore - previousScore,
          newBadges: [] // Implementar lógica de novos badges
        });
      }
    }
    
    if (memberStats) {
      setPreviousScore(memberStats.currentScore);
    }
  }, [memberStats, previousScore, showLevelUp]);

  if (loadingMember) {
    return <DashboardSkeleton layout={layout} />;
  }

  if (!memberStats) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="text-4xl mb-4">🚫</div>
        <p className="text-body-color dark:text-body-color-dark">
          {t('dashboard.noData')}
        </p>
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <CompactDashboard
        memberStats={memberStats}
        leaderboardEntries={leaderboardEntries}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header com estatísticas principais */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCounter
          label={t('stats.totalPoints')}
          value={memberStats.currentScore}
          icon="🏆"
          color="primary"
        />
        
        <StatCounter
          label={t('stats.currentLevel')}
          value={memberStats.currentLevel.id}
          icon="⭐"
          color="blue"
        />
        
        <StatCounter
          label={t('stats.rank')}
          value={memberStats.rank}
          icon="🥇"
          color="orange"
        />
        
        <StatCounter
          label={t('stats.badges')}
          value={memberStats.badges.length}
          icon="🏅"
          color="purple"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress do nível */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark"
          >
            <LevelProgressBar
              currentPoints={memberStats.currentScore}
              previousPoints={previousScore}
              showLevelUpAnimation={true}
              onLevelUp={(newLevel) => {
                // Level up será tratado pelo useEffect
              }}
            />
          </motion.div>

          {/* Sistema de Badges */}
          {showBadges && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark"
            >
              <BadgeSystem
                unlockedBadges={memberStats.badges.map(b => b.id)}
                showCategories={true}
                layout="grid"
              />
            </motion.div>
          )}

          {/* Feed de Atividades */}
          {showActivityFeed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark"
            >
              <ActivityFeed
                activities={memberStats.recentActivities}
                maxItems={10}
                showFilters={true}
                showLoadMore={false}
                isLoading={loadingActivities}
              />
            </motion.div>
          )}
        </div>

        {/* Coluna direita */}
        <div className="space-y-6">
          {/* Ranking/Leaderboard */}
          {showRanking && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark"
            >
              {leaderboardEntries.length >= 3 && (
                <Podium
                  topThree={leaderboardEntries.slice(0, 3)}
                  className="mb-6"
                />
              )}
              
              <LeaderboardWidget
                entries={leaderboardEntries}
                currentUserId={memberId}
                title={cellId ? t('leaderboard.cell.title') : t('leaderboard.church.title')}
                maxEntries={5}
                showLevels={true}
                type={cellId ? 'cell' : 'church'}
              />
            </motion.div>
          )}

          {/* Estatísticas adicionais */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark"
          >
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">
              {t('stats.additional')}
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-body-color dark:text-body-color-dark">
                  {t('stats.monthlyPoints')}
                </span>
                <span className="font-bold text-dark dark:text-white">
                  {memberStats.monthlyScore}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-body-color dark:text-body-color-dark">
                  {t('stats.weeklyPoints')}
                </span>
                <span className="font-bold text-dark dark:text-white">
                  {memberStats.weeklyScore}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-body-color dark:text-body-color-dark">
                  {t('stats.totalActivities')}
                </span>
                <span className="font-bold text-dark dark:text-white">
                  {memberStats.totalActivities}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Atividades recentes compactas */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark"
          >
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">
              {t('activity.recent')}
            </h3>
            
            <CompactActivityFeed
              activities={memberStats.recentActivities}
              maxItems={5}
            />
          </motion.div>
        </div>
      </div>

      {/* Modal de Level Up */}
      {modalData && (
        <LevelUpModal
          isOpen={isOpen}
          onClose={hideLevelUp}
          newLevel={modalData.newLevel}
          previousLevel={modalData.previousLevel}
          newBadges={modalData.newBadges}
          totalPoints={modalData.totalPoints}
          pointsGained={modalData.pointsGained}
        />
      )}
    </div>
  );
};

// Componente compacto do dashboard
interface CompactDashboardProps {
  memberStats: MemberStats;
  leaderboardEntries: LeaderboardEntry[];
  className?: string;
}

const CompactDashboard: FC<CompactDashboardProps> = ({
  memberStats,
  leaderboardEntries,
  className
}) => {
  const t = useTranslations('SuccessLadder');

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header compacto */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 rounded-lg bg-white dark:bg-gray-dark border border-stroke dark:border-dark-3">
          <ScoreCounter
            score={memberStats.currentScore}
            className="text-xl"
          />
          <p className="text-xs text-body-color dark:text-body-color-dark">
            {t('stats.totalPoints')}
          </p>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-white dark:bg-gray-dark border border-stroke dark:border-dark-3">
          <div className="text-xl font-bold" style={{ color: memberStats.currentLevel.color }}>
            {memberStats.currentLevel.name}
          </div>
          <p className="text-xs text-body-color dark:text-body-color-dark">
            {t('stats.currentLevel')}
          </p>
        </div>
      </div>

      {/* Progress compacto */}
      <div className="rounded-lg bg-white dark:bg-gray-dark border border-stroke dark:border-dark-3 p-4">
        <LevelProgressBar
          currentPoints={memberStats.currentScore}
          showLevelUpAnimation={false}
        />
      </div>

      {/* Top 3 e posição do usuário */}
      <div className="rounded-lg bg-white dark:bg-gray-dark border border-stroke dark:border-dark-3 p-4">
        <LeaderboardWidget
          entries={leaderboardEntries}
          currentUserId="current-user" // Substituir pelo ID real
          maxEntries={3}
          showLevels={false}
          type="cell"
        />
      </div>
    </div>
  );
};

// Skeleton para loading
const DashboardSkeleton: FC<{ layout: 'full' | 'compact' }> = ({ layout }) => {
  if (layout === 'compact') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
        
        <div className="space-y-6">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
};