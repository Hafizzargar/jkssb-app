import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Image, StatusBar, Platform, Dimensions } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';
import { ChevronLeft, Trophy, Users, CheckCircle2, Star, Zap, Target, Medal } from 'lucide-react-native';
import api from '../../utils/api';
import { useSelector } from 'react-redux';
import Animated, { FadeInUp, FadeInDown, BounceIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const LeaderboardScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  const missionId = route.params?.missionId;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      let targetId = missionId;
      if (!targetId) {
        const missionsRes = await api.get('/mcq/all');
        const latest = missionsRes.data.live[0] || missionsRes.data.past[0];
        if (latest) targetId = latest._id;
      }
      if (targetId) {
        const res = await api.get(`/mcq/leaderboard/${targetId}`);
        setData(res.data);
      }
    } catch (error) {
      console.error('Leaderboard Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [missionId]);

  const s = styles(theme);

  if (loading) return (
    <View style={[s.container, s.centered]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={s.loadingText}>CALCULATING RANKINGS...</Text>
    </View>
  );

  if (!data) return (
    <SafeAreaView style={s.container}>
      <View style={s.centered}>
        <Trophy size={64} color="rgba(255,255,255,0.05)" />
        <Text style={s.emptyTitle}>HALL OF FAME EMPTY</Text>
        <Text style={s.emptySub}>Rankings will materialize once the first student completes the mission.</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}><Text style={s.backBtnText}>Return to Control</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const { top3, allRankings, userStats, subject, totalParticipants } = data;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backIcon}><ChevronLeft color="#fff" size={24} /></TouchableOpacity>
        <View style={s.headerContent}>
          <Text style={s.headerLabel}>{subject?.toUpperCase()} RANKINGS</Text>
          <Text style={s.headerTitle}>Global Leaderboard</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Podium Section */}
        <View style={s.podiumContainer}>
          {top3[1] && (
            <Animated.View entering={FadeInUp.delay(400)} style={s.podiumItem}>
               <View style={[s.avatarCircle, s.silverGlow]}><Text style={s.avatarInitial}>{top3[1].name[0]}</Text></View>
               <Text style={s.podiumName} numberOfLines={1}>{top3[1].name}</Text>
               <Text style={s.podiumScore}>{top3[1].score}%</Text>
               <View style={[s.rankPill, s.silverPill]}><Text style={s.rankPillText}>#2</Text></View>
            </Animated.View>
          )}
          {top3[0] && (
            <Animated.View entering={BounceIn.delay(200)} style={[s.podiumItem, s.goldItem]}>
               <View style={s.crown}><Trophy size={20} color="#f59e0b" /></View>
               <View style={[s.avatarCircle, s.goldGlow, s.largeAvatar]}><Text style={[s.avatarInitial, {fontSize: 32}]}>{top3[0].name[0]}</Text></View>
               <Text style={[s.podiumName, s.goldName]} numberOfLines={1}>{top3[0].name}</Text>
               <Text style={s.podiumScore}>{top3[0].score}%</Text>
               <View style={[s.rankPill, s.goldPill]}><Text style={s.rankPillText}>#1</Text></View>
            </Animated.View>
          )}
          {top3[2] && (
            <Animated.View entering={FadeInUp.delay(600)} style={s.podiumItem}>
               <View style={[s.avatarCircle, s.bronzeGlow]}><Text style={s.avatarInitial}>{top3[2].name[0]}</Text></View>
               <Text style={s.podiumName} numberOfLines={1}>{top3[2].name}</Text>
               <Text style={s.podiumScore}>{top3[2].score}%</Text>
               <View style={[s.rankPill, s.bronzePill]}><Text style={s.rankPillText}>#3</Text></View>
            </Animated.View>
          )}
        </View>

        {/* User Status Bar */}
        <Animated.View entering={FadeInDown.duration(800)} style={s.userStatsBar}>
           <View style={s.uStat}>
              <Text style={s.uVal}>{userStats?.percentage || 0}%</Text>
              <Text style={s.uLab}>SCORE</Text>
           </View>
           <View style={s.uStatDivider} />
           <View style={s.uStat}>
              <Text style={[s.uVal, {color: theme.colors.primary}]}>#{userStats?.rank || '--'}</Text>
              <Text style={s.uLab}>YOUR RANK</Text>
           </View>
           <View style={s.uStatDivider} />
           <View style={s.uStat}>
              <Text style={s.uVal}>{totalParticipants}</Text>
              <Text style={s.uLab}>STUDENTS</Text>
           </View>
        </Animated.View>

        {/* Full List */}
        <View style={s.listContainer}>
          <Text style={s.listTitle}>TOP PERFORMERS</Text>
          {allRankings.map((item, index) => {
            const isMe = item.userId === user?._id;
            return (
              <Animated.View entering={FadeInUp.delay(index * 50)} key={index} style={[s.rankRow, isMe && s.rankRowMe]}>
                <View style={s.rankNumBox}><Text style={[s.rankNum, isMe && {color: theme.colors.primary}]}>{index + 1}</Text></View>
                <View style={s.rankAvatar}><Text style={s.rankAvatarText}>{item.name[0]}</Text></View>
                <View style={s.rankInfo}>
                  <Text style={[s.rankName, isMe && {color: theme.colors.primary}]}>{item.name} {isMe && '(You)'}</Text>
                  <Text style={s.rankTime}>{item.timeTaken || '3:45'} mins taken</Text>
                </View>
                <View style={s.rankScoreBox}>
                  <Text style={s.rankScore}>{item.score}%</Text>
                  <Medal size={12} color={index < 3 ? '#f59e0b' : 'rgba(255,255,255,0.2)'} />
                </View>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { color: theme.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: 24 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  backIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' },
  headerContent: { marginLeft: 20 },
  headerLabel: { color: theme.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  
  scroll: { flex: 1 },
  podiumContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginTop: 40, paddingHorizontal: 20, marginBottom: 40 },
  podiumItem: { flex: 1, alignItems: 'center', paddingBottom: 20 },
  goldItem: { marginTop: -40, zIndex: 10 },
  crown: { marginBottom: 8 },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#16161E', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.05)' },
  largeAvatar: { width: 90, height: 90, borderRadius: 45 },
  goldGlow: { borderColor: '#f59e0b', shadowColor: '#f59e0b', shadowOpacity: 0.2, shadowRadius: 15, elevation: 10 },
  silverGlow: { borderColor: '#94a3b8' },
  bronzeGlow: { borderColor: '#b45309' },
  avatarInitial: { color: '#fff', fontSize: 24, fontWeight: '800' },
  podiumName: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 4, textAlign: 'center' },
  goldName: { fontSize: 15, fontWeight: '900' },
  podiumScore: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' },
  rankPill: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  goldPill: { backgroundColor: '#f59e0b' },
  silverPill: { backgroundColor: '#94a3b8' },
  bronzePill: { backgroundColor: '#b45309' },
  rankPillText: { color: '#000', fontSize: 10, fontWeight: '900' },

  userStatsBar: { flexDirection: 'row', backgroundColor: '#16161E', marginHorizontal: 24, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 40 },
  uStat: { flex: 1, alignItems: 'center' },
  uVal: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  uLab: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  uStatDivider: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.05)' },

  listContainer: { paddingHorizontal: 24 },
  listTitle: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 20 },
  rankRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16161E', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  rankRowMe: { borderColor: theme.colors.primary, backgroundColor: 'rgba(99, 91, 255, 0.05)' },
  rankNumBox: { width: 30 },
  rankNum: { color: theme.colors.textMuted, fontWeight: '900' },
  rankAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  rankAvatarText: { color: '#fff', fontWeight: '800' },
  rankInfo: { flex: 1 },
  rankName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  rankTime: { color: theme.colors.textMuted, fontSize: 11, marginTop: 2 },
  rankScoreBox: { alignItems: 'flex-end', gap: 4 },
  rankScore: { color: '#22c55e', fontSize: 16, fontWeight: '900' },
  
  emptyTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 12, marginTop: 24 },
  emptySub: { color: theme.colors.textMuted, textAlign: 'center', fontSize: 13, lineHeight: 20, marginBottom: 40 },
  backBtn: { height: 54, paddingHorizontal: 30, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontWeight: '700' }
});

export default LeaderboardScreen;
