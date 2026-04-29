import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { Shield, BookOpen, Trophy, Users, AlertTriangle, TrendingUp, Newspaper, Layers, UserCheck, UserMinus, Clock, Star } from 'lucide-react-native';
import { useTheme } from '../../utils/useTheme';
import api from '../../utils/api';

const { width } = Dimensions.get('window');

const AdminDashboard = ({ navigation }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  const s = styles(theme);

  if (loading && !refreshing) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const stats = data ? [
    { label: 'Total Registered', value: data.stats.totalUsers, Icon: Users, color: '#3b82f6' },
    { label: 'Active Today', value: data.stats.activeUsers, Icon: TrendingUp, color: '#22c55e' },
    { label: 'Pending MCQ', value: data.stats.pendingMCQs, Icon: BookOpen, color: '#eab308' },
    { label: 'Pending Prize', value: data.stats.unpaidPrizes, Icon: Trophy, color: '#ef4444' },
  ] : [];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView 
        style={s.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={s.header}>
          <View>
            <Text style={s.welcome}>Admin Dashboard</Text>
            <Text style={s.name}>Platform Overview</Text>
          </View>
          <View style={s.badge}>
            <Shield color={theme.colors.primary} size={16} />
            <Text style={s.badgeText}>SuperAdmin</Text>
          </View>
        </View>

        {/* Primary Stats Grid */}
        <View style={s.statsGrid}>
          {stats.map((stat, i) => {
            const IconComp = stat.Icon;
            return (
              <View key={i} style={s.statCard}>
                <View style={[s.iconBox, { backgroundColor: `${stat.color}20` }]}>
                  <IconComp color={stat.color} size={20} />
                </View>
                <Text style={s.statLabel}>{stat.label}</Text>
                <Text style={s.statValue}>{stat.value}</Text>
              </View>
            );
          })}
        </View>

        {/* User Engagement Analytics */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>User Growth & Health</Text>
          <View style={s.analyticsRow}>
            <View style={s.analyticsBox}>
              <Text style={s.analyticsLabel}>New Users (Weekly)</Text>
              <Text style={s.analyticsValue}>+{data?.stats?.newUsers?.weekly || 0}</Text>
              <Text style={s.analyticsSub}>Last 7 days</Text>
            </View>
            <View style={s.analyticsBox}>
              <Text style={s.analyticsLabel}>Active vs Inactive</Text>
              <View style={s.ratioBar}>
                <View style={[s.ratioFill, { flex: data?.stats?.activeUsers || 1, backgroundColor: '#22c55e' }]} />
                <View style={[s.ratioFill, { flex: data?.stats?.inactiveUsers || 1, backgroundColor: '#475569' }]} />
              </View>
              <Text style={s.analyticsSub}>{data?.stats?.activeUsers} Active · {data?.stats?.inactiveUsers} Inactive</Text>
            </View>
          </View>
        </View>

        {/* Security & Moderation */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Moderation</Text>
          <View style={s.modRow}>
            <View style={[s.modCard, { borderColor: '#ef444430' }]}>
              <AlertTriangle color="#ef4444" size={20} />
              <View>
                <Text style={s.modVal}>{data?.stats?.bannedUsers || 0}</Text>
                <Text style={s.modLab}>Banned Users</Text>
              </View>
            </View>
            <View style={[s.modCard, { borderColor: '#eab30830' }]}>
              <Clock color="#eab308" size={20} />
              <View>
                <Text style={s.modVal}>{data?.stats?.pendingApprovals || 0}</Text>
                <Text style={s.modLab}>Pending Approval</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top Performers Ranking */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Top Students</Text>
            <Star color="#eab308" size={18} />
          </View>
          <View style={s.rankingCard}>
            {data?.topPerformers?.map((user, index) => (
              <View key={user._id} style={[s.rankItem, index === 4 && { borderBottomWidth: 0 }]}>
                <Text style={s.rankNum}>#{index + 1}</Text>
                <View style={s.rankInfo}>
                  <Text style={s.rankName}>{user.name}</Text>
                  <Text style={s.rankUser}>@{user.username}</Text>
                </View>
                <View style={s.rankScoreBox}>
                  <Text style={s.rankScore}>{user.weeklyPrepScore}</Text>
                  <Text style={s.rankLabel}>Score</Text>
                </View>
              </View>
            ))}
            {(!data?.topPerformers || data.topPerformers.length === 0) && (
              <Text style={s.emptyText}>No scores recorded yet</Text>
            )}
          </View>
        </View>

        {/* Quick Actions Navigation */}
        <View style={[s.section, { marginBottom: 100 }]}>
          <Text style={s.sectionTitle}>Administration</Text>
          
          <View style={s.actionsGrid}>
            <TouchableOpacity style={s.smallAction} onPress={() => navigation.navigate('AdminApprovals')}>
              <UserCheck color={theme.colors.primary} size={20} />
              <Text style={s.smallActionText}>Approvals</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={s.smallAction} onPress={() => navigation.navigate('AdminMCQ')}>
              <BookOpen color="#eab308" size={20} />
              <Text style={s.smallActionText}>MCQ Review</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.smallAction} onPress={() => navigation.navigate('AdminSubjects')}>
              <Layers color="#a855f7" size={20} />
              <Text style={s.smallActionText}>Subjects</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.smallAction} onPress={() => navigation.navigate('AdminPrizes')}>
              <Trophy color="#3b82f6" size={20} />
              <Text style={s.smallActionText}>Prizes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.smallAction} onPress={() => navigation.navigate('AdminBlogs')}>
              <Newspaper color="#ef4444" size={20} />
              <Text style={s.smallActionText}>News Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  welcome: { color: theme.colors.textMuted, fontSize: 13 },
  name: { color: theme.colors.text, fontSize: 22, fontWeight: 'bold' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99,91,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(99,91,255,0.2)',
  },
  badgeText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 11 },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 42) / 2,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: { color: theme.colors.textMuted, fontSize: 11, marginBottom: 4 },
  statValue: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 12 },

  analyticsRow: { flexDirection: 'row', gap: 10 },
  analyticsBox: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
  analyticsLabel: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8 },
  analyticsValue: { color: theme.colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  analyticsSub: { color: theme.colors.textMuted, fontSize: 10 },
  ratioBar: { height: 6, borderRadius: 3, flexDirection: 'row', overflow: 'hidden', marginVertical: 8 },
  ratioFill: { height: '100%' },

  modRow: { flexDirection: 'row', gap: 10 },
  modCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1 },
  modVal: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
  modLab: { color: theme.colors.textMuted, fontSize: 10 },

  rankingCard: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 8, borderWidth: 1, borderColor: theme.colors.border },
  rankItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rankNum: { width: 30, color: theme.colors.primary, fontWeight: 'bold', fontSize: 14 },
  rankInfo: { flex: 1 },
  rankName: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  rankUser: { color: theme.colors.textMuted, fontSize: 11 },
  rankScoreBox: { alignItems: 'flex-end' },
  rankScore: { color: '#22c55e', fontSize: 14, fontWeight: 'bold' },
  rankLabel: { color: theme.colors.textMuted, fontSize: 9 },
  emptyText: { textAlign: 'center', color: theme.colors.textMuted, padding: 20, fontSize: 13 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  smallAction: { width: (width - 42) / 2, height: 60, backgroundColor: theme.colors.surface, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12, borderWidth: 1, borderColor: theme.colors.border },
  smallActionText: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
});

export default AdminDashboard;
