// Tipos e constantes para a interface gamificada da Escada do Sucesso

export interface LadderLevel {
  id: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  criteria: string;
  isUnlocked?: boolean;
  unlockedAt?: Date;
}

export type BadgeCategory = 'FREQUENCY' | 'LEADERSHIP' | 'LEARNING' | 'SERVICE';

export interface Activity {
  id: string;
  name: string;
  points: number;
  category: string;
  icon: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface MemberStats {
  currentScore: number;
  currentLevel: LadderLevel;
  nextLevel?: LadderLevel;
  progressToNextLevel: number; // 0-100
  totalActivities: number;
  rank: number;
  monthlyScore: number;
  weeklyScore: number;
  badges: Badge[];
  recentActivities: Activity[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  level: LadderLevel;
  rank: number;
  isCurrentUser?: boolean;
}

// Níveis da Escada do Sucesso G12
export const LADDER_LEVELS: LadderLevel[] = [
  { id: 1, name: "Visitante", minPoints: 0, maxPoints: 49, color: "#94A3B8" },
  { id: 2, name: "Membro", minPoints: 50, maxPoints: 149, color: "#10B981" },
  { id: 3, name: "Consolidado", minPoints: 150, maxPoints: 299, color: "#3B82F6" },
  { id: 4, name: "Discípulo", minPoints: 300, maxPoints: 599, color: "#8B5CF6" },
  { id: 5, name: "Timóteo", minPoints: 600, maxPoints: 999, color: "#F59E0B" },
  { id: 6, name: "Líder Potencial", minPoints: 1000, maxPoints: 1999, color: "#EF4444" },
  { id: 7, name: "Líder", minPoints: 2000, maxPoints: 3999, color: "#DC2626" },
  { id: 8, name: "Supervisor", minPoints: 4000, maxPoints: 7999, color: "#7C3AED" },
  { id: 9, name: "Pastor", minPoints: 8000, maxPoints: 15999, color: "#1D4ED8" },
  { id: 10, name: "Líder Sênior", minPoints: 16000, maxPoints: 999999, color: "#0F172A" }
];

// Sistema de Badges
export const BADGE_CATEGORIES = {
  FREQUENCY: [
    { 
      id: "perfect_month", 
      name: "Mês Perfeito", 
      description: "100% presença em 1 mês", 
      icon: "⭐",
      category: 'FREQUENCY' as BadgeCategory,
      criteria: "Participar de todas as reuniões durante um mês"
    },
    { 
      id: "consistent_quarter", 
      name: "Consistência", 
      description: "90%+ presença em 3 meses", 
      icon: "🔥",
      category: 'FREQUENCY' as BadgeCategory,
      criteria: "Manter 90% ou mais de presença por 3 meses consecutivos"
    },
    { 
      id: "year_warrior", 
      name: "Guerreiro Anual", 
      description: "80%+ presença no ano", 
      icon: "🏆",
      category: 'FREQUENCY' as BadgeCategory,
      criteria: "Manter 80% ou mais de presença durante todo o ano"
    }
  ],
  LEADERSHIP: [
    { 
      id: "first_timoteo", 
      name: "Primeiro Timóteo", 
      description: "Tornar-se Timóteo", 
      icon: "🌱",
      category: 'LEADERSHIP' as BadgeCategory,
      criteria: "Alcançar o nível Timóteo pela primeira vez"
    },
    { 
      id: "mentor", 
      name: "Mentor", 
      description: "Treinar 3 Timóteos", 
      icon: "👨‍🏫",
      category: 'LEADERSHIP' as BadgeCategory,
      criteria: "Ajudar 3 pessoas a se tornarem Timóteos"
    },
    { 
      id: "multiplier", 
      name: "Multiplicador", 
      description: "Liderar multiplicação", 
      icon: "🌟",
      category: 'LEADERSHIP' as BadgeCategory,
      criteria: "Liderar uma célula que se multiplicou"
    }
  ],
  LEARNING: [
    { 
      id: "student", 
      name: "Estudante", 
      description: "Completar 5 módulos", 
      icon: "📚",
      category: 'LEARNING' as BadgeCategory,
      criteria: "Completar 5 módulos de estudo"
    },
    { 
      id: "graduate", 
      name: "Graduado", 
      description: "Completar Universidade da Vida", 
      icon: "🎓",
      category: 'LEARNING' as BadgeCategory,
      criteria: "Completar todos os módulos da Universidade da Vida"
    },
    { 
      id: "teacher", 
      name: "Mestre", 
      description: "Completar Capacitação Destino", 
      icon: "👑",
      category: 'LEARNING' as BadgeCategory,
      criteria: "Completar a Capacitação Destino"
    }
  ],
  SERVICE: [
    { 
      id: "volunteer", 
      name: "Voluntário", 
      description: "10 serviços", 
      icon: "🤝",
      category: 'SERVICE' as BadgeCategory,
      criteria: "Participar de 10 atividades de serviço"
    },
    { 
      id: "servant", 
      name: "Servo", 
      description: "50 serviços", 
      icon: "❤️",
      category: 'SERVICE' as BadgeCategory,
      criteria: "Participar de 50 atividades de serviço"
    },
    { 
      id: "minister", 
      name: "Ministro", 
      description: "Liderar um ministério", 
      icon: "⚡",
      category: 'SERVICE' as BadgeCategory,
      criteria: "Liderar ou coordenar um ministério"
    }
  ]
};

// Funções utilitárias
export function getCurrentLevel(points: number): LadderLevel {
  return LADDER_LEVELS.find(level => 
    points >= level.minPoints && points <= level.maxPoints
  ) || LADDER_LEVELS[0];
}

export function getNextLevel(currentLevel: LadderLevel): LadderLevel | null {
  const currentIndex = LADDER_LEVELS.findIndex(level => level.id === currentLevel.id);
  return currentIndex < LADDER_LEVELS.length - 1 ? LADDER_LEVELS[currentIndex + 1] : null;
}

export function getProgressToNextLevel(points: number): number {
  const currentLevel = getCurrentLevel(points);
  const nextLevel = getNextLevel(currentLevel);
  
  if (!nextLevel) return 100; // Já está no nível máximo
  
  const currentLevelPoints = points - currentLevel.minPoints;
  const totalLevelPoints = currentLevel.maxPoints - currentLevel.minPoints + 1;
  
  return Math.round((currentLevelPoints / totalLevelPoints) * 100);
}

export function getAllBadges(): Badge[] {
  return [
    ...BADGE_CATEGORIES.FREQUENCY,
    ...BADGE_CATEGORIES.LEADERSHIP,
    ...BADGE_CATEGORIES.LEARNING,
    ...BADGE_CATEGORIES.SERVICE
  ];
}

export function getCategoryBadges(category: BadgeCategory): Badge[] {
  return BADGE_CATEGORIES[category] || [];
}

// Ícones para categorias de atividades
export const ACTIVITY_ICONS: Record<string, string> = {
  'PRESENCE': '👥',
  'LEADERSHIP': '👑',
  'LEARNING': '📚',
  'SERVICE': '🤝',
  'EVANGELISM': '💒',
  'DISCIPLESHIP': '🌱',
  'MULTIPLICATION': '🌟',
  'CONSOLIDATION': '🤗',
  'TRAINING': '🎯',
  'MEETING': '🗣️',
  'PRAYER': '🙏',
  'WORSHIP': '🎵'
};

export function getActivityIcon(category: string): string {
  return ACTIVITY_ICONS[category.toUpperCase()] || '📋';
}