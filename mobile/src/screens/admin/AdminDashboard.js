import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Shield, BookOpen, Trophy, Users, AlertTriangle, TrendingUp, Newspaper, Layers } from 'lucide-react-native';
import { useTheme } from '../../utils/useTheme';

const AdminDashboard = ({ navigation }) => {
  const theme = useTheme();
  
  const stats = [
    { label: 'Total Users', value: '1,284', Icon: Users, color: '#3b82f6' },
    { label: 'Active Today', value: '432', Icon: TrendingUp, color: '#22c55e' },
    { label: 'Pending MCQs', value: '5', Icon: BookOpen, color: '#eab308' },
    { label: 'Unpaid Prizes', value: '₹4.5k', Icon: Trophy, color: '#ef4444' },
  ];

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <Text style={s.welcome}>Admin Access</Text>
            <Text style={s.name}>Control Center</Text>
          </View>
          <View style={s.badge}>
            <Shield color={theme?.colors?.primary || '#fbbf24'} size={16} />
            <Text style={s.badgeText}>SuperAdmin</Text>
          </View>
        </View>

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

        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={s.actionCard}
            onPress={() => navigation.navigate('AdminApprovals')}
          >
            <View style={[s.actionIcon, { backgroundColor: '#3b82f620' }]}>
              <Users color="#3b82f6" size={24} />
            </View>
            <View style={s.actionInfo}>
              <Text style={s.actionName}>User Approvals</Text>
              <Text style={s.actionSub}>Review & Approve New Registrations</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.actionCard}
            onPress={() => navigation.navigate('AdminBlogs')}
          >
            <View style={[s.actionIcon, { backgroundColor: '#22c55e20' }]}>
              <Newspaper color="#22c55e" size={24} />
            </View>
            <View style={s.actionInfo}>
              <Text style={s.actionName}>Review Daily News</Text>
              <Text style={s.actionSub}>AI Generated Blogs Pending</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.actionCard}
            onPress={() => navigation.navigate('AdminMCQ')}
          >
            <View style={[s.actionIcon, { backgroundColor: '#eab30820' }]}>
              <BookOpen color="#eab308" size={24} />
            </View>
            <View style={s.actionInfo}>
              <Text style={s.actionName}>Review Today's MCQs</Text>
              <Text style={s.actionSub}>5 Pending Approval</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.actionCard}
            onPress={() => navigation.navigate('AdminPrizes')}
          >
            <View style={[s.actionIcon, { backgroundColor: '#3b82f620' }]}>
              <Trophy color="#3b82f6" size={24} />
            </View>
            <View style={s.actionInfo}>
              <Text style={s.actionName}>Prize Management</Text>
              <Text style={s.actionSub}>Set Amounts & Mark Paid</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.actionCard}
            onPress={() => navigation.navigate('AdminSubjects')}
          >
            <View style={[s.actionIcon, { backgroundColor: '#a855f720' }]}>
              <Layers color="#a855f7" size={24} />
            </View>
            <View style={s.actionInfo}>
              <Text style={s.actionName}>Manage Subjects</Text>
              <Text style={s.actionSub}>Create, Enable/Disable Categories</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionCard}>
            <View style={[s.actionIcon, { backgroundColor: '#ef444420' }]}>
              <AlertTriangle color="#ef4444" size={24} />
            </View>
            <View style={s.actionInfo}>
              <Text style={s.actionName}>Cheat Reports</Text>
              <Text style={s.actionSub}>View Evidence Screenshots</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme?.colors?.background || '#0f172a' },
  content: { flex: 1, padding: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  welcome: { color: theme?.colors?.textMuted || '#94a3b8', fontSize: 14 },
  name: { color: theme?.colors?.text || '#f8fafc', fontSize: 24, fontWeight: 'bold' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme?.colors?.surface || '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  badgeText: { color: theme?.colors?.primary || '#fbbf24', fontWeight: 'bold', fontSize: 12 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: '46%', // Adjusted for gap
    backgroundColor: theme?.colors?.surface || '#1e293b',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: { color: theme?.colors?.textMuted || '#94a3b8', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  section: { marginBottom: 32 },
  sectionTitle: {
    color: theme?.colors?.text || '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: theme?.colors?.surface || '#1e293b',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionInfo: { flex: 1 },
  actionName: { color: theme?.colors?.text || '#f8fafc', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  actionSub: { color: theme?.colors?.textMuted || '#94a3b8', fontSize: 12 },
});

export default AdminDashboard;
