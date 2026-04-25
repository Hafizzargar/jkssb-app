import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/authSlice';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';
import { LogOut, User, Award, TrendingUp, BookOpen, ChevronRight } from 'lucide-react-native';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  const isMasterAdmin = user?.email === 'hafezzargar987@gmail.com';
  const s = styles(theme);

  const performance = user?.subjectPerformance || [];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.profileHeader}>
          <View style={s.avatarBox}>
            <User color={theme.colors.primary} size={40} />
          </View>
          <View>
            <Text style={s.userName}>{user?.name || 'Student Name'}</Text>
            <Text style={s.userEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Stats Summary */}
        {!isMasterAdmin && (
          <View style={s.statsGrid}>
            <View style={s.statBox}>
              <Award color={theme.colors.primary} size={20} />
              <Text style={s.statValue}>{user?.weeklyPrepScore || 0}</Text>
              <Text style={s.statLabel}>PrepScore</Text>
            </View>
            <View style={s.statBox}>
              <TrendingUp color="#22c55e" size={20} />
              <Text style={s.statValue}>#{user?.rank || '--'}</Text>
              <Text style={s.statLabel}>Global Rank</Text>
            </View>
          </View>
        )}

        {/* Subject Performance Section */}
        {!isMasterAdmin && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Subject Performance</Text>
            {performance.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>Start your first MCQ to see subject-wise analytics!</Text>
              </View>
            ) : (
              performance.map((sub, i) => (
                <View key={i} style={s.perfCard}>
                  <View style={s.perfInfo}>
                    <View style={s.subIconBox}>
                      <BookOpen color={theme.colors.primary} size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.subName}>{sub.subjectCode}</Text>
                      <Text style={s.subMeta}>{sub.correctAnswers}/{sub.totalAttempted} Correct</Text>
                    </View>
                    <View style={s.percentageBox}>
                      <Text style={[s.percentageText, { color: sub.percentage > 70 ? '#22c55e' : sub.percentage > 40 ? '#eab308' : '#ef4444' }]}>
                        {sub.percentage}%
                      </Text>
                    </View>
                  </View>
                  {/* Simple Progress Bar */}
                  <View style={s.progressBarBg}>
                    <View style={[s.progressBarFill, { width: `${sub.percentage}%`, backgroundColor: sub.percentage > 70 ? '#22c55e' : sub.percentage > 40 ? '#eab308' : '#ef4444' }]} />
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity 
          style={s.logoutBtn}
          onPress={() => dispatch(logout())}
        >
          <LogOut color="#fff" size={20} />
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, padding: spacing.lg },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 32, marginTop: 10 },
  avatarBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  userName: { color: theme.colors.text, fontSize: 24, fontWeight: 'bold' },
  userEmail: { color: theme.colors.textMuted, fontSize: 14 },
  
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  statBox: { flex: 1, backgroundColor: theme.colors.surface, padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  statValue: { color: theme.colors.text, fontSize: 20, fontWeight: 'bold', marginVertical: 4 },
  statLabel: { color: theme.colors.textMuted, fontSize: 12 },

  section: { marginBottom: 32 },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  perfCard: { backgroundColor: theme.colors.surface, borderRadius: borderRadius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  perfInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  subIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center' },
  subName: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
  subMeta: { color: theme.colors.textMuted, fontSize: 12 },
  percentageBox: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  percentageText: { fontWeight: 'bold', fontSize: 14 },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  emptyCard: { padding: 32, alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: borderRadius.lg, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.colors.border },
  emptyText: { color: theme.colors.textMuted, textAlign: 'center', fontSize: 14, lineHeight: 20 },

  logoutBtn: { backgroundColor: theme.colors.error, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default ProfileScreen;
