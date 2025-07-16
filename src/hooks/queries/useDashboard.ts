import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@clerk/nextjs';

interface DashboardStats {
  totalChurches: number;
  totalUsers: number;
  totalCells: number;
  pendingInvites: number;
  monthlyGrowth: {
    churches: number;
    users: number;
    cells: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'user_joined' | 'church_created' | 'invite_sent' | 'cell_created';
  message: string;
  timestamp: string;
  user?: {
    name: string;
    email: string;
  };
  church?: {
    name: string;
  };
}

interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  pendingInvites: Array<{
    id: string;
    email: string;
    role: string;
    church_name: string;
    created_at: string;
  }>;
}

export function useDashboardData() {
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['dashboard-data', user?.id],
    queryFn: async (): Promise<DashboardData> => {
      if (!user?.id) {
        console.warn('useDashboardData: No authenticated user');
        throw new Error('User not authenticated');
      }
      
      try {
        // Get user profile to determine scope with null safety
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('church_id, role')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('useDashboardData: Profile fetch error:', profileError);
          // Return default data instead of throwing
          return {
            stats: {
              totalChurches: 0,
              totalUsers: 0,
              totalCells: 0,
              pendingInvites: 0,
              monthlyGrowth: { churches: 0, users: 0, cells: 0 },
            },
            recentActivities: [],
            pendingInvites: [],
          };
        }
      
      const isAdmin = profile?.role === 'admin';
      const churchId = profile?.church_id;
      
      // Get stats based on user permissions
      let stats: DashboardStats = {
        totalChurches: 0,
        totalUsers: 0,
        totalCells: 0,
        pendingInvites: 0,
        monthlyGrowth: {
          churches: 0,
          users: 0,
          cells: 0,
        },
      };
      
      if (isAdmin && !churchId) {
        // Super admin - system-wide stats
        const [churchesResult, usersResult, cellsResult, invitesResult] = await Promise.all([
          supabase.from('churches').select('id, created_at'),
          supabase.from('profiles').select('id, created_at'),
          supabase.from('cells').select('id, created_at'),
          supabase.from('invites').select('id').eq('status', 'pending'),
        ]);
        
        stats.totalChurches = churchesResult.data?.length || 0;
        stats.totalUsers = usersResult.data?.length || 0;
        stats.totalCells = cellsResult.data?.length || 0;
        stats.pendingInvites = invitesResult.data?.length || 0;
        
        // Calculate monthly growth
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        
        const churchesThisMonth = churchesResult.data?.filter(c => 
          new Date(c.created_at) >= lastMonth
        ).length || 0;
        
        const usersThisMonth = usersResult.data?.filter(u => 
          new Date(u.created_at) >= lastMonth
        ).length || 0;
        
        const cellsThisMonth = cellsResult.data?.filter(c => 
          new Date(c.created_at) >= lastMonth
        ).length || 0;
        
        stats.monthlyGrowth = {
          churches: churchesThisMonth,
          users: usersThisMonth,
          cells: cellsThisMonth,
        };
      } else if (churchId) {
        // Church-scoped stats
        const [usersResult, cellsResult, invitesResult] = await Promise.all([
          supabase.from('profiles').select('id, created_at').eq('church_id', churchId),
          supabase.from('cells').select('id, created_at').eq('church_id', churchId),
          supabase.from('invites').select('id').eq('church_id', churchId).eq('status', 'pending'),
        ]);
        
        stats.totalChurches = 1;
        stats.totalUsers = usersResult.data?.length || 0;
        stats.totalCells = cellsResult.data?.length || 0;
        stats.pendingInvites = invitesResult.data?.length || 0;
        
        // Calculate monthly growth for church
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        
        const usersThisMonth = usersResult.data?.filter(u => 
          new Date(u.created_at) >= lastMonth
        ).length || 0;
        
        const cellsThisMonth = cellsResult.data?.filter(c => 
          new Date(c.created_at) >= lastMonth
        ).length || 0;
        
        stats.monthlyGrowth = {
          churches: 0,
          users: usersThisMonth,
          cells: cellsThisMonth,
        };
      }
      
      // Get recent activities
      let recentActivities: RecentActivity[] = [];
      
      if (churchId) {
        // Church-scoped activities
        const { data: activities, error: activitiesError } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            email,
            created_at,
            church:churches(name)
          `)
          .eq('church_id', churchId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (!activitiesError && activities) {
          recentActivities = activities.map(activity => ({
            id: activity.id,
            type: 'user_joined' as const,
            message: `${activity.name} se juntou à igreja`,
            timestamp: activity.created_at,
            user: {
              name: activity.name,
              email: activity.email,
            },
            church: activity.church || undefined,
          }));
        }
      }
      
      // Get pending invites for current user or church
      let pendingInvites: Array<{
        id: string;
        email: string;
        role: string;
        church_name: string;
        created_at: string;
      }> = [];
      
      if (churchId) {
        const { data: invites, error: invitesError } = await supabase
          .from('invites')
          .select(`
            id,
            email,
            role,
            created_at,
            church:churches(name)
          `)
          .eq('church_id', churchId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (!invitesError && invites) {
          pendingInvites = invites.map(invite => ({
            id: invite.id,
            email: invite.email,
            role: invite.role,
            church_name: invite.church?.name || '',
            created_at: invite.created_at,
          }));
        }
      }
      
      return {
        stats: stats || {
          totalChurches: 0,
          totalUsers: 0,
          totalCells: 0,
          pendingInvites: 0,
          monthlyGrowth: { churches: 0, users: 0, cells: 0 },
        },
        recentActivities: recentActivities || [],
        pendingInvites: pendingInvites || [],
      };
      } catch (error: any) {
        console.error('useDashboardData: Unexpected error:', error);
        // Return safe default data on error
        return {
          stats: {
            totalChurches: 0,
            totalUsers: 0,
            totalCells: 0,
            pendingInvites: 0,
            monthlyGrowth: { churches: 0, users: 0, cells: 0 },
          },
          recentActivities: [],
          pendingInvites: [],
        };
      }
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('permission') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useMonthlyGrowthChart() {
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['monthly-growth-chart', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Get user profile to determine scope
      const { data: profile } = await supabase
        .from('profiles')
        .select('church_id, role')
        .eq('id', user.id)
        .single();
      
      const churchId = profile?.church_id;
      
      // Generate last 6 months data
      const months = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        let usersCount = 0;
        let cellsCount = 0;
        
        if (churchId) {
          // Church-scoped data
          const [usersResult, cellsResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('id')
              .eq('church_id', churchId)
              .gte('created_at', date.toISOString())
              .lt('created_at', nextMonth.toISOString()),
            supabase
              .from('cells')
              .select('id')
              .eq('church_id', churchId)
              .gte('created_at', date.toISOString())
              .lt('created_at', nextMonth.toISOString()),
          ]);
          
          usersCount = usersResult.data?.length || 0;
          cellsCount = cellsResult.data?.length || 0;
        }
        
        months.push({
          month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          users: usersCount,
          cells: cellsCount,
        });
      }
      
      return months;
    },
    enabled: !!user?.id,
  });
}