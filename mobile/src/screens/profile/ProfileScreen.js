import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/authSlice';
import { useTheme } from '../../utils/useTheme';
import { toast } from '../../components/Toast';
import Input from '../../components/Input';
import { LogOut, User, Camera, Lock, Check, ChevronRight, X, Moon, Sun, Star, Heart, Zap, Shield, Mail, Award } from 'lucide-react-native';
import api from '../../utils/api';
import { updateUser } from '../../redux/authSlice';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  const isMasterAdmin = user?.role === 'super-admin' || user?.email === 'hafezzargar987@gmail.com';
  
  const [displayName, setDisplayName] = useState(user?.name || 'User');
  const [username, setUsername] = useState(user?.username || 'user');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    console.log('🚀 ATTEMPTING PROFILE UPDATE...', { name: displayName, username });
    setIsSaving(true);
    try {
      const res = await api.post('/auth/update-profile', { 
        name: displayName, 
        username 
      });
      
      if (res.data.user) {
        dispatch(updateUser(res.data.user));
        toast('Operational profile updated!', 'success');
      }
    } catch (error) {
      console.error('❌ CRITICAL UPDATE ERROR:', error);
      console.log('Error Type:', typeof error);
      console.log('Error Config:', error.config);
      const msg = error.response?.data?.message || 'Update failed';
      toast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={s.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        <View style={s.header}>
          <Text style={s.headerLabel}>PERSONNEL FILE</Text>
          <Text style={s.headerTitle}>User Profile</Text>
        </View>

        <Animated.View entering={FadeInUp.duration(600)} style={s.profileCard}>
          <View style={s.avatarContainer}>
             <View style={s.avatarGlow}><User color={theme.colors.primary} size={40} /></View>
             <TouchableOpacity style={s.cameraBtn}><Camera color="#000" size={14} /></TouchableOpacity>
          </View>
          <Text style={s.profileName}>{displayName}</Text>
          <View style={s.roleBadge}><Shield size={12} color={theme.colors.primary} /><Text style={s.roleText}>{user?.role?.toUpperCase() || 'STUDENT'}</Text></View>
        </Animated.View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>IDENTIFICATION</Text>
          <View style={s.inputBox}>
            <Input label="DISPLAY NAME" value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
            <Input label="USERNAME" value={username} onChangeText={setUsername} placeholder="your_handle" />
            <Input label="EMAIL ADDRESS" value={user?.email} editable={false} icon={Lock} />
          </View>
        </View>

        {!isMasterAdmin && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>PERFORMANCE STATS</Text>
            <View style={s.statsRow}>
               <View style={s.statItem}><Award size={20} color={theme.colors.primary} /><Text style={s.statVal}>#{user?.rank || '--'}</Text><Text style={s.statLab}>GLOBAL RANK</Text></View>
               <View style={s.statDivider} />
               <View style={s.statItem}><Zap size={20} color="#f59e0b" /><Text style={s.statVal}>{user?.weeklyPrepScore || 0}</Text><Text style={s.statLab}>PREP SCORE</Text></View>
            </View>
          </View>
        )}

        <TouchableOpacity style={[s.actionBtn, s.saveBtn]} onPress={handleSave} disabled={isSaving}>
           {isSaving ? <ActivityIndicator color="#000" size="small" /> : <><Check size={20} color="#000" /><Text style={s.saveBtnText}>SAVE OPERATIONAL DATA</Text></>}
        </TouchableOpacity>

        <TouchableOpacity style={[s.actionBtn, s.logoutBtn]} onPress={() => dispatch(logout())}>
           <LogOut size={20} color={theme.colors.error} /><Text style={s.logoutBtnText}>DEAUTHORIZE DEVICE</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  content: { flex: 1, padding: 24 },
  header: { marginBottom: 32, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  headerLabel: { color: theme.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '900' },

  profileCard: { backgroundColor: '#16161E', borderRadius: 32, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 32 },
  avatarContainer: { position: 'relative', marginBottom: 20 },
  avatarGlow: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(99, 91, 255, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(99, 91, 255, 0.2)' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#16161E' },
  profileName: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  roleText: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  section: { marginBottom: 32 },
  sectionLabel: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 16 },
  inputBox: { gap: 12 },

  statsRow: { flexDirection: 'row', backgroundColor: '#16161E', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 8, marginBottom: 2 },
  statLab: { color: theme.colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  statDivider: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.05)' },

  actionBtn: { height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 },
  saveBtn: { backgroundColor: theme.colors.primary },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  logoutBtnText: { color: theme.colors.error, fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});

export default ProfileScreen;
