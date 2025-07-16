/**
 * Dados de demonstração especializados para o contexto G12
 * Use estes dados quando precisar exibir informações fictícias da Visão G12
 */

export interface DemoChurch {
  id: string;
  name: string;
  pastor: string;
  email: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  totalCells: number;
  totalMembers: number;
  foundedAt: string;
  vision: string;
}

export interface DemoLeader {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'Pastor Principal' | 'G12 Pastoral' | 'Líder Central' | 'Líder de Célula' | 'Timóteo';
  cellId?: string;
  cellName?: string;
  membersCount?: number;
  conversionDate?: string;
  baptismDate?: string;
  ladderLevel: number;
  mentorId?: string;
  avatar?: string;
  location?: string;
}

export interface DemoCell {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  supervisorId?: string;
  supervisorName?: string;
  membersCount: number;
  visitorsThisMonth: number;
  conversionsThisMonth: number;
  mode: 'ganhar' | 'consolidar' | 'discipular' | 'enviar';
  meetingDay: string;
  meetingTime: string;
  address: {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  healthScore: number;
  multiplicationReady: boolean;
  createdAt: string;
}

export interface DemoLadderActivity {
  id: string;
  name: string;
  description: string;
  points: number;
  category: 'presenca' | 'evento' | 'curso' | 'servico' | 'lideranca';
  level: number;
}

export interface DemoNotificationG12 {
  id: string;
  type: 'reuniao' | 'multiplicacao' | 'novo-membro' | 'meta' | 'evento' | 'sistema';
  title: string;
  message: string;
  time: string;
  unread: boolean;
  cellId?: string;
  leaderId?: string;
  priority: 'low' | 'medium' | 'high';
}

// Igrejas de demonstração
export const demoChurches: DemoChurch[] = [
  {
    id: '1',
    name: 'Igreja Vida Nova',
    pastor: 'Pr. João Silva',
    email: 'contato@vidanova.com.br',
    phone: '+55 (11) 99999-0001',
    address: {
      street: 'Rua da Fé, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100'
    },
    totalCells: 45,
    totalMembers: 520,
    foundedAt: '2010-03-15',
    vision: 'Ganhar, Consolidar, Discipular e Enviar - transformando vidas através da Visão G12'
  },
  {
    id: '2',
    name: 'Igreja Renovo',
    pastor: 'Pr. Maria Santos',
    email: 'pastora@renovo.com.br',
    phone: '+55 (21) 99999-0002',
    address: {
      street: 'Av. da Esperança, 456',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '22070-900'
    },
    totalCells: 28,
    totalMembers: 340,
    foundedAt: '2015-08-20',
    vision: 'Multiplicando discípulos através da Visão G12 para alcançar toda cidade'
  }
];

// Líderes de demonstração
export const demoLeaders: DemoLeader[] = [
  {
    id: '1',
    name: 'Pr. João Silva',
    email: 'joao@vidanova.com.br',
    phone: '+55 (11) 99999-0001',
    role: 'Pastor Principal',
    conversionDate: '1995-05-10',
    baptismDate: '1995-06-15',
    ladderLevel: 10,
    location: 'São Paulo, SP'
  },
  {
    id: '2',
    name: 'Ana Oliveira',
    email: 'ana.oliveira@vidanova.com.br',
    phone: '+55 (11) 99999-0002',
    role: 'G12 Pastoral',
    cellId: '1',
    cellName: 'Célula Vitória',
    membersCount: 12,
    conversionDate: '2018-03-20',
    baptismDate: '2018-04-10',
    ladderLevel: 8,
    mentorId: '1',
    location: 'São Paulo, SP'
  },
  {
    id: '3',
    name: 'Carlos Mendes',
    email: 'carlos@vidanova.com.br',
    phone: '+55 (11) 99999-0003',
    role: 'Líder de Célula',
    cellId: '2',
    cellName: 'Célula Esperança',
    membersCount: 15,
    conversionDate: '2019-09-15',
    baptismDate: '2019-10-20',
    ladderLevel: 6,
    mentorId: '2',
    location: 'São Paulo, SP'
  },
  {
    id: '4',
    name: 'Fernanda Costa',
    email: 'fernanda@vidanova.com.br',
    phone: '+55 (11) 99999-0004',
    role: 'Timóteo',
    cellId: '2',
    cellName: 'Célula Esperança',
    conversionDate: '2022-01-10',
    baptismDate: '2022-02-15',
    ladderLevel: 3,
    mentorId: '3',
    location: 'São Paulo, SP'
  },
  {
    id: '5',
    name: 'Roberto Lima',
    email: 'roberto@vidanova.com.br',
    phone: '+55 (11) 99999-0005',
    role: 'Líder Central',
    conversionDate: '2016-11-05',
    baptismDate: '2016-12-18',
    ladderLevel: 9,
    mentorId: '1',
    location: 'São Paulo, SP'
  }
];

// Células de demonstração
export const demoCells: DemoCell[] = [
  {
    id: '1',
    name: 'Célula Vitória',
    leaderId: '2',
    leaderName: 'Ana Oliveira',
    supervisorId: '1',
    supervisorName: 'Pr. João Silva',
    membersCount: 12,
    visitorsThisMonth: 3,
    conversionsThisMonth: 1,
    mode: 'consolidar',
    meetingDay: 'Quarta-feira',
    meetingTime: '19:30',
    address: {
      street: 'Rua das Flores, 45',
      neighborhood: 'Jardim Paulista',
      city: 'São Paulo',
      state: 'SP'
    },
    healthScore: 85,
    multiplicationReady: false,
    createdAt: '2023-02-15'
  },
  {
    id: '2',
    name: 'Célula Esperança',
    leaderId: '3',
    leaderName: 'Carlos Mendes',
    supervisorId: '2',
    supervisorName: 'Ana Oliveira',
    membersCount: 15,
    visitorsThisMonth: 5,
    conversionsThisMonth: 2,
    mode: 'enviar',
    meetingDay: 'Sexta-feira',
    meetingTime: '20:00',
    address: {
      street: 'Av. Paulista, 1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP'
    },
    healthScore: 92,
    multiplicationReady: true,
    createdAt: '2022-11-20'
  },
  {
    id: '3',
    name: 'Célula Renovação',
    leaderId: '4',
    leaderName: 'Fernanda Costa',
    supervisorId: '3',
    supervisorName: 'Carlos Mendes',
    membersCount: 8,
    visitorsThisMonth: 2,
    conversionsThisMonth: 0,
    mode: 'ganhar',
    meetingDay: 'Terça-feira',
    meetingTime: '19:00',
    address: {
      street: 'Rua da Consolação, 234',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP'
    },
    healthScore: 65,
    multiplicationReady: false,
    createdAt: '2024-01-10'
  }
];

// Atividades da Escada do Sucesso
export const demoLadderActivities: DemoLadderActivity[] = [
  {
    id: '1',
    name: 'Presença na Célula',
    description: 'Participação regular nas reuniões de célula',
    points: 10,
    category: 'presenca',
    level: 1
  },
  {
    id: '2',
    name: 'Encontro com Deus',
    description: 'Participação no retiro de final de semana',
    points: 100,
    category: 'evento',
    level: 2
  },
  {
    id: '3',
    name: 'Universidade da Vida - Nível 1',
    description: 'Conclusão do primeiro módulo de discipulado',
    points: 150,
    category: 'curso',
    level: 3
  },
  {
    id: '4',
    name: 'Servo no Ministério',
    description: 'Engajamento ativo em algum ministério da igreja',
    points: 80,
    category: 'servico',
    level: 4
  },
  {
    id: '5',
    name: 'Capacitação Destino',
    description: 'Treinamento intensivo para liderança',
    points: 200,
    category: 'lideranca',
    level: 5
  }
];

// Notificações G12
export const demoNotificationsG12: DemoNotificationG12[] = [
  {
    id: '1',
    type: 'reuniao',
    title: 'Reunião de Célula Hoje',
    message: 'Lembre-se da reunião da Célula Vitória às 19:30',
    time: '2h',
    unread: true,
    cellId: '1',
    priority: 'high'
  },
  {
    id: '2',
    type: 'multiplicacao',
    title: 'Célula Pronta para Multiplicar',
    message: 'A Célula Esperança atingiu os critérios para multiplicação',
    time: '4h',
    unread: true,
    cellId: '2',
    leaderId: '3',
    priority: 'high'
  },
  {
    id: '3',
    type: 'novo-membro',
    title: 'Novo Membro na Célula',
    message: 'Maria João foi adicionada à Célula Renovação',
    time: '1d',
    unread: false,
    cellId: '3',
    priority: 'medium'
  },
  {
    id: '4',
    type: 'meta',
    title: 'Meta de Visitantes Atingida',
    message: 'Parabéns! A meta mensal de visitantes foi alcançada',
    time: '2d',
    unread: false,
    priority: 'medium'
  },
  {
    id: '5',
    type: 'evento',
    title: 'Encontro com Deus',
    message: 'Inscrições abertas para o próximo Encontro com Deus',
    time: '3d',
    unread: false,
    priority: 'low'
  }
];

// Dados para métricas G12
export const demoG12Metrics = {
  totalCells: 45,
  totalMembers: 520,
  totalLeaders: 48,
  totalVisitors: 23,
  conversionsThisMonth: 8,
  multiplicationsThisYear: 6,
  averageAttendance: 78,
  healthyMembersPercentage: 85,
  
  cellGrowth: [
    { month: 'Jan', cells: 38, members: 450 },
    { month: 'Fev', cells: 39, members: 465 },
    { month: 'Mar', cells: 41, members: 485 },
    { month: 'Abr', cells: 42, members: 500 },
    { month: 'Mai', cells: 44, members: 515 },
    { month: 'Jun', cells: 45, members: 520 }
  ],
  
  modeDistribution: [
    { mode: 'Ganhar', count: 12, percentage: 27 },
    { mode: 'Consolidar', count: 15, percentage: 33 },
    { mode: 'Discipular', count: 11, percentage: 24 },
    { mode: 'Enviar', count: 7, percentage: 16 }
  ],
  
  ladderProgression: [
    { level: 1, members: 150, name: 'Presença' },
    { level: 2, members: 120, name: 'Encontro' },
    { level: 3, members: 95, name: 'Universidade 1' },
    { level: 4, members: 75, name: 'Servo' },
    { level: 5, members: 45, name: 'Capacitação' },
    { level: 6, members: 25, name: 'Líder' }
  ]
};

// Funções auxiliares
export function getDemoChurch(id?: string): DemoChurch {
  if (id) {
    return demoChurches.find(church => church.id === id) || demoChurches[0];
  }
  return demoChurches[0];
}

export function getDemoLeader(id?: string): DemoLeader {
  if (id) {
    return demoLeaders.find(leader => leader.id === id) || demoLeaders[0];
  }
  return demoLeaders[0];
}

export function getDemoCell(id?: string): DemoCell {
  if (id) {
    return demoCells.find(cell => cell.id === id) || demoCells[0];
  }
  return demoCells[0];
}

export function getLeadersByRole(role: DemoLeader['role']): DemoLeader[] {
  return demoLeaders.filter(leader => leader.role === role);
}

export function getCellsByMode(mode: DemoCell['mode']): DemoCell[] {
  return demoCells.filter(cell => cell.mode === mode);
}

export function getReadyForMultiplication(): DemoCell[] {
  return demoCells.filter(cell => cell.multiplicationReady);
}

export function getUnreadNotificationsG12Count(): number {
  return demoNotificationsG12.filter(notification => notification.unread).length;
}

export function getHighPriorityNotifications(): DemoNotificationG12[] {
  return demoNotificationsG12.filter(notification => notification.priority === 'high');
}

// Dados de formulário específicos G12
export const demoG12FormData = {
  church: {
    name: getDemoChurch().name,
    pastor: getDemoChurch().pastor,
    email: getDemoChurch().email,
    phone: getDemoChurch().phone,
    vision: getDemoChurch().vision
  },
  
  leader: {
    name: getDemoLeader().name,
    email: getDemoLeader().email,
    phone: getDemoLeader().phone,
    role: getDemoLeader().role,
    conversionDate: getDemoLeader().conversionDate,
    baptismDate: getDemoLeader().baptismDate
  },
  
  cell: {
    name: getDemoCell().name,
    meetingDay: getDemoCell().meetingDay,
    meetingTime: getDemoCell().meetingTime,
    mode: getDemoCell().mode
  }
};