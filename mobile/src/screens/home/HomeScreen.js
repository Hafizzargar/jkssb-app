import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Modal, ActivityIndicator, Alert } from 'react-native';
import { Trophy, BookOpen, Clock, ChevronRight, Flame, Award, Moon, Sun, Play, Users, Shield, Calendar, X, Sparkles, ArrowRight } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import { setTheme } from '../../redux/settingsSlice';
import { useTheme } from '../../utils/useTheme';
import api from '../../utils/api';
import { spacing, borderRadius } from '../../theme';
import { toast } from '../../components/Toast';

const { width } = Dimensions.get('window');
const isLargeScreen = width > 768;

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const route = useRoute();
  const { theme: currentTheme } = useSelector((state) => state.settings);
  const { user } = useSelector((state) => state.auth);
  const isMasterAdmin = user?.email === 'hafezzargar987@gmail.com';
  
  const [showWelcome, setShowWelcome] = React.useState(!!route.params?.isNewUser);

  const toggleTheme = () => {
    const modes = ['dark', 'light', 'read'];
    const next = modes[(modes.indexOf(currentTheme) + 1) % modes.length];
    dispatch(setTheme(next));
  };

  const [dailyMission, setDailyMission] = React.useState(null);
  const [timeLeft, setTimeLeft] = React.useState('');

  // 1. Fetch on Mount & Focus (only if not already finished)
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDailyMission();
    });
    fetchDailyMission();
    return unsubscribe;
  }, [navigation, dailyMission?.isAttempted]);

  const [isAutoStarting, setIsAutoStarting] = React.useState(false);

  // 2. Countdown Timer (Local only, no API calls)
  React.useEffect(() => {
    if (!dailyMission || dailyMission.isAttempted) return;

    const timer = setInterval(() => {
      const status = getMissionStatus();
      if (status === 'UPCOMING') {
        const start = new Date(dailyMission.startTime);
        const diff = start - new Date();
        
        if (diff <= 0) {
          // Mission started! Auto-launch
          clearInterval(timer);
          setIsAutoStarting(false);
          handleStartMission();
          return;
        }

        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        
        // Auto-start visual sequence at 10 seconds
        if (mins === 0 && secs <= 10) {
          setIsAutoStarting(true);
        }

        setTimeLeft(`Starts in ${mins}m ${secs}s`);
      } else if (status === 'LIVE') {
        setTimeLeft('LIVE NOW');
      } else {
        setTimeLeft('');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [dailyMission, navigation]);

  const fetchDailyMission = async () => {
    // If we already know it's attempted, don't bother the server!
    if (dailyMission?.isAttempted) return;

    try {
      const res = await api.get('/mcq/daily');
      if (res.data) setDailyMission(res.data);
    } catch (e) {
      setDailyMission(null);
    }
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

  const handleStartMission = () => {
    // Check if the user is approved OR if they have a "Guest Pass" (new registration)
    const isApproved = user?.status === 'APPROVED';
    const isGuest = !!route.params?.isNewUser;

    if (dailyMission?.isAttempted) {
      return toast('Mission already completed. Check rankings later!', 'info');
    }

    if (!isApproved && !isGuest) {
      return toast('Your account is pending admin approval. Please wait for verification.', 'info');
    }
    
    setShowWelcome(false);
    navigation.navigate('TakeMission');
  };

  const status = getMissionStatus();
  const s = styles(theme);
  
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : (isMasterAdmin ? 'AD' : 'ST');
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <SafeAreaView style={s.container}>
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.avatarBox}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <View style={s.greetingBox}>
              <Text style={s.greetingTitle}>Good morning,{'\n'}{user?.name?.split(' ')[0] || (isMasterAdmin ? 'Admin' : 'Student')}</Text>
              <Text style={s.greetingDate}>{todayStr}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.iconButton} onPress={toggleTheme}>
            {currentTheme === 'light' ? <Moon color={theme.colors.textMuted} size={20} /> : <Sun color={theme.colors.textMuted} size={20} />}
          </TouchableOpacity>
        </View>

        {/* OVERVIEW SECTION */}
        <Text style={s.sectionHeaderTitle}>OVERVIEW</Text>
        <View style={s.overviewGrid}>
          <View style={s.overviewCard}>
            <Text style={s.overviewValue}>{dailyMission ? 1 : 0}</Text>
            <Text style={s.overviewLabel}>Missions{'\n'}today</Text>
          </View>
          <View style={s.overviewCard}>
            <Text style={s.overviewValue}>{user?.streak || 0}</Text>
            <Text style={s.overviewLabel}>Day{'\n'}streak</Text>
          </View>
        </View>

        {/* RECENT ACTIVITY SECTION */}
        <Text style={s.sectionHeaderTitle}>RECENT ACTIVITY</Text>
        
        {isMasterAdmin && (
          <TouchableOpacity style={s.activityRow} onPress={() => navigation.navigate('Admin')}>
            <View style={s.activityIconBox}>
              <Shield color={theme.colors.primary} size={20} />
            </View>
            <View style={s.activityInfo}>
              <Text style={s.activityTitle}>Admin Dashboard</Text>
              <Text style={s.activitySub}>Manage platform</Text>
            </View>
            <View style={[s.badge, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Text style={[s.badgeText, { color: theme.colors.primary }]}>Active</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={s.activityRow} 
          onPress={handleStartMission}
          disabled={!dailyMission || (status !== 'LIVE' && !isAutoStarting) || dailyMission?.isAttempted}
        >
          <View style={s.activityIconBox}>
            <BookOpen color={theme.colors.primary} size={20} />
          </View>
          <View style={s.activityInfo}>
            <Text style={s.activityTitle}>{dailyMission ? dailyMission.subject : 'No Mission'}</Text>
            <Text style={s.activitySub}>
              {dailyMission?.isAttempted ? 'Completed successfully' :
               status === 'LIVE' ? 'Ready to start' :
               status === 'UPCOMING' ? timeLeft : 'Check back tomorrow'}
            </Text>
          </View>
          <View style={[s.badge, 
            dailyMission?.isAttempted ? s.badgeDone :
            (status === 'LIVE' || isAutoStarting) ? s.badgeActive : s.badgeLate
          ]}>
            <Text style={[s.badgeText, 
              dailyMission?.isAttempted ? s.badgeTextDone :
              (status === 'LIVE' || isAutoStarting) ? s.badgeTextActive : s.badgeTextLate
            ]}>
              {dailyMission?.isAttempted ? 'Done' :
               (status === 'LIVE' || isAutoStarting) ? 'Active' : 'Wait'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.activityRow} onPress={() => navigation.navigate('Blogs')}>
          <View style={s.activityIconBox}>
            <Users color={theme.colors.primary} size={20} />
          </View>
          <View style={s.activityInfo}>
            <Text style={s.activityTitle}>Daily News Update</Text>
            <Text style={s.activitySub}>Latest JKSSB updates</Text>
          </View>
          <View style={[s.badge, { backgroundColor: `${theme.colors.primary}20` }]}>
             <Text style={[s.badgeText, { color: theme.colors.primary }]}>New</Text>
          </View>
        </TouchableOpacity>

        {!isMasterAdmin && (
          <TouchableOpacity style={s.activityRow} onPress={() => navigation.navigate('Ranks')}>
            <View style={s.activityIconBox}>
              <Trophy color={theme.colors.primary} size={20} />
            </View>
            <View style={s.activityInfo}>
              <Text style={s.activityTitle}>Global Leaderboard</Text>
              <Text style={s.activitySub}>View your ranking</Text>
            </View>
            <View style={[s.badge, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
               <Text style={[s.badgeText, { color: theme.colors.textMuted }]}>View</Text>
            </View>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Welcome Onboarding Modal */}
      <Modal visible={showWelcome} animationType="slide" transparent>
        <View style={s.welcomeOverlay}>
          <View style={s.welcomeCard}>
            <TouchableOpacity style={s.closeIcon} onPress={() => setShowWelcome(false)}>
              <X color={theme.colors.textMuted} size={24} />
            </TouchableOpacity>
            
            <View style={s.sparkleBox}>
              <Sparkles color={theme.colors.primary} size={40} />
            </View>
            
            <Text style={s.welcomeTitle}>Welcome Aboard! 🎉</Text>
            <Text style={s.welcomeSub}>
              Registration successful. We've unlocked your first mission so you can start preparing immediately!
            </Text>

            <TouchableOpacity 
              style={s.welcomeActionBtn}
              onPress={handleStartMission}
              disabled={!dailyMission || status !== 'LIVE'}
            >
              <Text style={s.welcomeActionText}>Start First Mission</Text>
              <ArrowRight color="#FFFFFF" size={20} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowWelcome(false)} style={{ marginTop: 20 }}>
              <Text style={s.skipText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, alignItems: isLargeScreen ? 'center' : 'stretch' },
  content: { flex: 1, padding: spacing.xl, width: isLargeScreen ? 600 : '100%', maxWidth: 800 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  greetingBox: { justifyContent: 'center' },
  greetingTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700', lineHeight: 22 },
  greetingDate: { color: theme.colors.textMuted, fontSize: 13, marginTop: 4 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },

  sectionHeaderTitle: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 16, marginTop: 10 },
  
  overviewGrid: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  overviewCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  overviewValue: { color: theme.colors.text, fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  overviewLabel: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20 },

  activityRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, paddingVertical: 12, marginBottom: 16 },
  activityIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  activityInfo: { flex: 1, marginLeft: 16 },
  activityTitle: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  activitySub: { color: theme.colors.textMuted, fontSize: 13 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeDone: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  badgeActive: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  badgeLate: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  badgeTextDone: { color: '#10b981' },
  badgeTextActive: { color: '#f59e0b' },
  badgeTextLate: { color: '#ef4444' },

  welcomeOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  welcomeCard: { backgroundColor: theme.colors.surface, borderRadius: 32, padding: 32, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  closeIcon: { position: 'absolute', top: 20, right: 20 },
  sparkleBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${theme.colors.primary}20`, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  welcomeTitle: { color: theme.colors.text, fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  welcomeSub: { color: theme.colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  welcomeActionBtn: { backgroundColor: theme.colors.primary, height: 60, borderRadius: 20, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  welcomeActionText: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' },
  skipText: { color: theme.colors.textMuted, fontSize: 15, fontWeight: '600' }
});

export default HomeScreen;
