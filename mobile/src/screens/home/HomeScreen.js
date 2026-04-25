import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Trophy, BookOpen, Clock, ChevronRight, Flame, Award, Moon, Sun, Play, Users } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme } from '../../redux/settingsSlice';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');
const isLargeScreen = width > 768;

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { theme: currentTheme } = useSelector((state) => state.settings);
  const { user } = useSelector((state) => state.auth);
  const isMasterAdmin = user?.email === 'hafezzargar987@gmail.com';

  const toggleTheme = () => {
    const modes = ['dark', 'light', 'read'];
    const next = modes[(modes.indexOf(currentTheme) + 1) % modes.length];
    dispatch(setTheme(next));
  };

  const [dailyMission, setDailyMission] = React.useState(null);
  const [timeLeft, setTimeLeft] = React.useState('');

  React.useEffect(() => {
    fetchDailyMission();
    // Check every 5 seconds for more precision
    const timer = setInterval(updateStatus, 5000); 
    return () => clearInterval(timer);
  }, [dailyMission, user]);

  const fetchDailyMission = async () => {
    try {
      const res = await api.get('/api/mcq/daily');
      if (res.data) setDailyMission(res.data);
    } catch (e) {}
  };

  const getMissionStatus = () => {
    if (!dailyMission) return 'NONE';
    const now = new Date();
    const start = new Date(dailyMission.startTime);
    const end = new Date(dailyMission.endTime);

    if (now < start) return 'UPCOMING';
    if (now >= start && now <= end) return 'LIVE';
    return 'ENDED';
  };

  const updateStatus = () => {
    const status = getMissionStatus();
    if (status === 'UPCOMING') {
      const start = new Date(dailyMission.startTime);
      const diff = start - new Date();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`Starts in ${mins}m ${secs}s`);
    } else if (status === 'LIVE' && user?.isApproved) {
      // AUTO-START Logic: Jump into the mission if it just started!
      navigation.navigate('MCQ');
      setTimeLeft('');
    } else {
      setTimeLeft('');
    }
  };

  const handleStartMission = () => {
    if (!user?.isApproved) {
      return alert('Your account is pending admin approval. Please wait for verification.');
    }
    navigation.navigate('MCQ');
  };

  const status = getMissionStatus();
  const s = styles(theme);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Good morning, {user?.name?.split(' ')[0] || (isMasterAdmin ? 'Admin' : 'Student')}</Text>
            {isMasterAdmin ? (
              <View style={[s.rankBadge, { backgroundColor: '#3b82f620' }]}>
                <Shield color="#3b82f6" size={14} />
                <Text style={[s.rankText, { color: '#3b82f6' }]}>System Administrator</Text>
              </View>
            ) : (
              <View style={s.rankBadge}>
                <Trophy color={theme.colors.primary} size={14} />
                <Text style={s.rankText}>Global Rank #14</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={s.themeToggle} onPress={toggleTheme}>
            {currentTheme === 'light' ? <Moon color={theme.colors.text} size={20} /> : <Sun color={theme.colors.text} size={20} />}
          </TouchableOpacity>
        </View>

        {isMasterAdmin && (
          <View style={s.adminSummaryCard}>
            <Text style={s.adminSummaryTitle}>Platform Health</Text>
            <View style={s.adminStatsRow}>
              <View style={s.adminStatItem}>
                <Text style={s.adminStatVal}>1.2k</Text>
                <Text style={s.adminStatLabel}>Users</Text>
              </View>
              <View style={s.adminStatDivider} />
              <View style={s.adminStatItem}>
                <Text style={s.adminStatVal}>43</Text>
                <Text style={s.adminStatLabel}>Active</Text>
              </View>
              <View style={s.adminStatDivider} />
              <View style={s.adminStatItem}>
                <Text style={s.adminStatVal}>5</Text>
                <Text style={s.adminStatLabel}>Pending</Text>
              </View>
            </View>
            <TouchableOpacity style={s.adminGoBtn} onPress={() => navigation.navigate('Admin')}>
              <Text style={s.adminGoBtnText}>Go to Control Center</Text>
              <ChevronRight color="#000" size={16} />
            </TouchableOpacity>
          </View>
        )}

        {/* TOP PRIORITY: DAILY NEWS */}
        <Text style={s.sectionTitle}>Daily News Update</Text>
        <TouchableOpacity 
          style={s.newsHeroCard}
          onPress={() => navigation.navigate('Blogs')}
        >
          <View style={s.newsHeroInfo}>
            <View style={s.iconBoxLarge}>
              <Users color="#000" size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.newsHeroTitle}>Fresh JKSSB News</Text>
              <Text style={s.newsHeroSub}>3 curated articles for your prep</Text>
            </View>
            <ChevronRight color={theme.colors.textMuted} size={20} />
          </View>
        </TouchableOpacity>

        {/* SECOND PRIORITY: TODAY'S MCQS */}
        {dailyMission ? (
          <View style={[s.heroCard, status === 'LIVE' && s.heroCardLive]}>
            <View style={s.heroInfo}>
              <Text style={s.heroEmoji}>{status === 'LIVE' ? '🚀' : '⏳'}</Text>
              <View>
                <Text style={s.heroTitle}>{dailyMission.subject}</Text>
                <Text style={s.heroSub}>
                  {status === 'UPCOMING' ? `Mission with ${dailyMission.questions?.length || 0} questions starts at ${new Date(dailyMission.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 
                   status === 'LIVE' ? 'The mission window is OPEN. Jump in now!' : 'You missed today\'s window. See you tomorrow!'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                s.startButton, 
                status === 'UPCOMING' && s.btnDisabled,
                status === 'ENDED' && s.btnEnded
              ]}
              onPress={handleStartMission}
              disabled={status !== 'LIVE'}
            >
              <Text style={s.startButtonText}>
                {status === 'UPCOMING' ? `STARTS AT ${new Date(dailyMission.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 
                 status === 'LIVE' ? 'START MISSION NOW' : 'WINDOW CLOSED'}
              </Text>
              {status === 'LIVE' && <Play color="#000" size={18} fill="#000" />}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.heroCard}>
            <View style={s.heroInfo}>
              <Text style={s.heroEmoji}>😴</Text>
              <View>
                <Text style={s.heroTitle}>No Mission Today</Text>
                <Text style={s.heroSub}>Rest up! Tomorrow's prep will be big.</Text>
              </View>
            </View>
          </View>
        )}

        {/* RANK / LEADERBOARD SECTION */}
        {!isMasterAdmin && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Leaderboard</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Ranks')}>
                <Text style={s.viewAll}>View Rankings</Text>
              </TouchableOpacity>
            </View>

            <View style={s.rankPreview}>
              {[
                { name: 'Aarif Wani', score: '94.2', rank: 1 },
                { name: 'Me (You)', score: '84.5', rank: 14, isMe: true },
                { name: 'Suhail Bhat', score: '82.1', rank: 15 },
              ].map((item, i) => (
                <View key={i} style={[s.rankRow, item.isMe && s.rankRowMe]}>
                  <Text style={s.rankNum}>#{item.rank}</Text>
                  <Text style={[s.rankName, item.isMe && s.bold]}>{item.name}</Text>
                  <Text style={s.rankScore}>{item.score}</Text>
                </View>
              ))}
            </View>

            <View style={s.streakBox}>
              <Flame color="#ff4500" size={18} />
              <Text style={s.streakText}>{user?.streak || 0} Day Learning Streak!</Text>
            </View>
          </>
        )}

        {/* SUBJECT PERFORMANCE SECTION */}
        {!isMasterAdmin && <Text style={[s.sectionTitle, { marginTop: 32, marginBottom: 16 }]}>Subject Mastery</Text>}
        <View style={s.subjectGrid}>
          {!isMasterAdmin && (
            user?.subjectPerformance && user.subjectPerformance.length > 0 ? (
              user.subjectPerformance.map((perf, i) => (
                <View key={i} style={s.subjectCard}>
                  <Text style={s.subCode}>{perf.subjectCode}</Text>
                  <Text style={s.subPercent}>{perf.percentage}%</Text>
                  <View style={s.miniProgressBg}>
                    <View style={[s.miniProgressFill, { width: `${perf.percentage}%` }]} />
                  </View>
                  <Text style={s.subDetail}>{perf.correctAnswers}/{perf.totalAttempted} Qs</Text>
                </View>
              ))
            ) : (
              <View style={s.noDataCard}>
                <BookOpen color={theme.colors.textMuted} size={20} />
                <Text style={s.noDataText}>Start missions to see subject stats</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, alignItems: isLargeScreen ? 'center' : 'stretch' },
  content: { flex: 1, padding: spacing.lg, width: isLargeScreen ? 600 : '100%', maxWidth: 800 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: spacing.md },
  greeting: { color: theme.colors.textMuted, fontSize: 14, marginBottom: 4 },
  rankBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${theme.colors.primary}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rankText: { color: theme.colors.primary, fontSize: 12, fontWeight: 'bold' },
  themeToggle: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  
  heroCard: { 
    backgroundColor: theme.colors.surface, 
    borderRadius: borderRadius.lg, 
    padding: 24, 
    marginBottom: 32, 
    borderWidth: 1, 
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5
  },
  heroCardLive: { borderColor: '#10b981', backgroundColor: '#10b98105' },
  heroInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  heroEmoji: { fontSize: 32 },
  heroTitle: { color: theme.colors.text, fontSize: 22, fontWeight: 'bold' },
  heroSub: { color: theme.colors.textMuted, fontSize: 14, marginTop: 2 },
  startButton: { backgroundColor: theme.colors.primary, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnDisabled: { backgroundColor: theme.colors.border, opacity: 0.7 },
  btnEnded: { backgroundColor: `${theme.colors.error}20`, borderColor: theme.colors.error, borderWidth: 1 },
  startButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' },
  viewAll: { color: theme.colors.primary, fontSize: 14, fontWeight: '600' },

  rankPreview: { backgroundColor: theme.colors.surface, borderRadius: borderRadius.md, padding: 8, marginBottom: 32, borderWidth: 1, borderColor: theme.colors.border },
  rankRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  rankRowMe: { backgroundColor: `${theme.colors.primary}10`, borderRadius: 12 },
  rankNum: { color: theme.colors.textMuted, fontSize: 14, width: 30, fontWeight: '600' },
  rankName: { color: theme.colors.text, fontSize: 15, flex: 1 },
  rankScore: { color: theme.colors.primary, fontSize: 14, fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },

  newsHeroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: 20,
    marginTop: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3
  },
  newsHeroInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  newsHeroTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' },
  newsHeroSub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2 },
  iconBoxLarge: { 
    width: 50, 
    height: 50, 
    borderRadius: 15, 
    backgroundColor: theme.colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  streakBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  streakText: { color: '#ff4500', fontSize: 14, fontWeight: '600' },

  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  subjectCard: { backgroundColor: theme.colors.surface, width: (width - spacing.lg * 2 - 12) / 2, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  subCode: { color: theme.colors.textMuted, fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  subPercent: { color: theme.colors.text, fontSize: 22, fontWeight: '900', marginBottom: 8 },
  miniProgressBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 8 },
  miniProgressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 2 },
  subDetail: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '600' },
  noDataCard: { flex: 1, height: 100, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: theme.colors.border },
  noDataText: { color: theme.colors.textMuted, fontSize: 12, marginTop: 8 },
  adminSummaryCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: theme.colors.border },
  adminSummaryTitle: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  adminStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 20 },
  adminStatItem: { alignItems: 'center' },
  adminStatVal: { color: theme.colors.primary, fontSize: 24, fontWeight: 'bold' },
  adminStatLabel: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4 },
  adminStatDivider: { width: 1, height: 30, backgroundColor: theme.colors.border },
  adminGoBtn: { backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  adminGoBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 }
});

export default HomeScreen;
