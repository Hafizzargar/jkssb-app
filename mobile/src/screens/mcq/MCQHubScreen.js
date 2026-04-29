import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar, Platform, Dimensions } from 'react-native';
import Animated, { FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';
import { BookOpen, Clock, CheckCircle2, ChevronRight, AlertTriangle, Trophy, Calendar, Zap, Eye, Target } from 'lucide-react-native';
import api from '../../utils/api';
import ReviewModal from '../../components/ReviewModal';

const { width } = Dimensions.get('window');

const MCQHubScreen = ({ navigation }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('live'); // 'live', 'upcoming', 'past'
  
  useEffect(() => {
    fetchMissions(false); // Background refresh
  }, [activeTab]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missions, setMissions] = useState({ live: [], upcoming: [], past: [] });
  const [now, setNow] = useState(new Date());

  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewResults, setReviewResults] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchMissions = async (showFullLoader = false) => {
    if (showFullLoader) setLoading(true);
    try {
      const res = await api.get('/mcq/all');
      setMissions(res.data);
    } catch (error) {
      console.error('Error fetching all missions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewAnswer = async (missionId) => {
    try {
      setReviewLoading(true);
      const res = await api.get(`/mcq/results?missionId=${missionId}`);
      setReviewResults(res.data);
      setReviewVisible(true);
    } catch (error) {
      console.error('Error fetching review results:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  const formatTimeLeft = (endTime) => {
    const end = new Date(endTime);
    const diff = end - now;
    if (diff <= 0) return '00:00';
    const minutes = Math.floor(diff / 1000 / 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMissions(true); // Show loader when coming back to screen
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMissions(false);
  };

  const s = styles(theme);

  const renderMissionCard = (mission, index) => {
    const isLiveTab = activeTab === 'live';
    const isPastTab = activeTab === 'past';
    const isAttempted = mission.isAttempted;
    const hasStarted = now >= new Date(mission.startTime);
    
    return (
      <Animated.View entering={FadeInUp.delay(index * 100).duration(600)} key={mission._id}>
        <TouchableOpacity 
          style={[s.card, isLiveTab && !isAttempted && s.cardLive]} 
          onPress={() => (isLiveTab || activeTab === 'upcoming') && navigation.navigate('TakeMission')}
          disabled={isPastTab || isAttempted}
          activeOpacity={0.9}
        >
          <View style={s.cardHeader}>
            <View style={s.subjectBadge}>
              <Target size={12} color={theme.colors.primary} />
              <Text style={s.subjectText}>{mission.subject.toUpperCase()}</Text>
            </View>
            {isLiveTab && !isAttempted && hasStarted && (
              <View style={s.liveIndicator}>
                <View style={s.pulseDot} />
                <Text style={s.liveLabel}>{formatTimeLeft(mission.endTime)} REMAINING</Text>
              </View>
            )}
            {isAttempted && (
              <View style={s.successBadge}>
                <CheckCircle2 size={12} color="#10b981" />
                <Text style={s.successLabel}>MISSION COMPLETE</Text>
              </View>
            )}
          </View>

          <Text style={s.missionTitle}>{mission.subject} Mission</Text>
          
          <View style={s.cardInfoRow}>
            <View style={s.infoItem}>
              <Clock size={14} color={theme.colors.textMuted} />
              <Text style={s.infoText}>{new Date(mission.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
            </View>
            <View style={s.infoDivider} />
            <View style={s.infoItem}>
              <Zap size={14} color="#f59e0b" />
              <Text style={s.infoText}>{mission.questionCount ?? mission.questions?.length ?? '?'} OBJECTIVES</Text>
            </View>
          </View>

          <View style={s.cardFooter}>
            {isAttempted ? (
              <View style={s.pastActions}>
                <TouchableOpacity style={s.footerBtn} onPress={() => handleViewAnswer(mission._id)}>
                  <Eye size={16} color={theme.colors.primary} />
                  <Text style={s.footerBtnText}>ANSWERS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.footerBtn, s.footerBtnMain]} onPress={() => navigation.navigate('Ranks', { missionId: mission._id })}>
                  <Trophy size={16} color="#000" />
                  <Text style={[s.footerBtnText, {color: '#000'}]}>RANKINGS</Text>
                </TouchableOpacity>
              </View>
            ) : isLiveTab ? (
              <View style={s.startCallout}>
                <Text style={s.startCalloutText}>{hasStarted ? 'INITIATE MISSION' : 'STARTING SOON'}</Text>
                <ChevronRight size={20} color={theme.colors.primary} />
              </View>
            ) : (
              <View style={s.upcomingCallout}>
                <Calendar size={14} color={theme.colors.textMuted} />
                <Text style={s.upcomingText}>{new Date(mission.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <View>
          <Text style={s.welcomeText}>MISSION CONTROL</Text>
          <Text style={s.headerTitle}>Operational Hub</Text>
        </View>
        <TouchableOpacity style={s.profileBtn} onPress={() => navigation.navigate('Profile')}>
           <View style={s.avatarGlow}><Trophy size={20} color={theme.colors.primary} /></View>
        </TouchableOpacity>
      </View>

      <View style={s.tabContainer}>
        {['live', 'upcoming', 'past'].map((tab) => (
          <TouchableOpacity 
            key={tab}
            style={[s.tabPill, activeTab === tab && s.activeTabPill]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabPillText, activeTab === tab && s.activeTabPillText]}>
              {tab === 'live' ? 'ACTIVE' : tab === 'upcoming' ? 'UPCOMING' : 'FINISHED'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView 
          style={s.scroll} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        >
          {missions[activeTab]?.length === 0 ? (
            <View style={s.emptyBox}>
              <View style={s.emptyIcon}><AlertTriangle size={40} color="rgba(255,255,255,0.1)" /></View>
              <Text style={s.emptyTitle}>NO MISSIONS ACTIVE</Text>
              <Text style={s.emptySub}>All systems clear. Check back shortly for new deployment updates.</Text>
            </View>
          ) : (
            missions[activeTab]?.map(renderMissionCard)
          )}
        </ScrollView>
      )}

      <ReviewModal visible={reviewVisible} onClose={() => setReviewVisible(false)} results={reviewResults} theme={theme} />
      {reviewLoading && <View style={s.loadingOverlay}><ActivityIndicator size="large" color={theme.colors.primary} /></View>}
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  welcomeText: { color: theme.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  profileBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  avatarGlow: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(99, 91, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 24 },
  tabPill: { flex: 1, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  activeTabPill: { backgroundColor: 'rgba(99, 91, 255, 0.08)', borderColor: 'rgba(99, 91, 255, 0.2)' },
  tabPillText: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  activeTabPillText: { color: theme.colors.primary },

  scroll: { flex: 1 },
  card: { backgroundColor: '#16161E', borderRadius: 28, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  cardLive: { borderColor: 'rgba(99, 91, 255, 0.3)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  subjectBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  subjectText: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  liveLabel: { color: '#ef4444', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  successBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  successLabel: { color: '#10b981', fontSize: 9, fontWeight: '900' },

  missionTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 20 },
  cardInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  infoDivider: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },

  cardFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)', paddingTop: 20 },
  pastActions: { flexDirection: 'row', gap: 12 },
  footerBtn: { flex: 1, height: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.03)' },
  footerBtnMain: { backgroundColor: theme.colors.primary },
  footerBtnText: { color: theme.colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  startCallout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  startCalloutText: { color: theme.colors.primary, fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  upcomingCallout: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  upcomingText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIcon: { marginBottom: 24 },
  emptyTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  emptySub: { color: theme.colors.textMuted, textAlign: 'center', fontSize: 13, lineHeight: 20 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 }
});

export default MCQHubScreen;
