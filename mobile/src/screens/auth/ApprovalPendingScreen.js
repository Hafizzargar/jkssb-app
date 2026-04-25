import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import { Clock, ShieldAlert, LogOut, Mail } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/authSlice';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';
import client from '../../api/client';

const { width, height } = Dimensions.get('window');

const ApprovalPendingScreen = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    // Pulse animation for the clock icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleLogout = async () => {
    try {
      await client.post('/auth/logout');
      dispatch(logout());
    } catch (error) {
      dispatch(logout());
    }
  };

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={theme.name === 'Dark Mode' ? 'light-content' : 'dark-content'} />
      <View style={s.backgroundDecorator} />

      <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={[s.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Clock color={theme.colors.primary} size={80} strokeWidth={1.5} />
        </Animated.View>

        <Text style={s.title}>Approval Pending</Text>
        <Text style={s.subtitle}>
          Your account is currently under review by our administration team.
        </Text>

        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Mail color={theme.colors.textMuted} size={18} />
            <Text style={s.infoText}>{user?.email}</Text>
          </View>
          <View style={s.statusBadge}>
            <View style={s.statusDot} />
            <Text style={s.statusText}>PENDING REVIEW</Text>
          </View>
        </View>

        <Text style={s.description}>
          We'll notify you once your account is approved. This usually takes less than 24 hours.
        </Text>

        <TouchableOpacity style={s.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut color={theme.colors.error} size={20} />
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backgroundDecorator: {
    position: 'absolute',
    top: -height * 0.2,
    right: -width * 0.2,
    width: width,
    height: width,
    borderRadius: width / 2,
    backgroundColor: theme.colors.primary,
    opacity: 0.03,
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
    width: '90%',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  infoText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  statusText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
    fontStyle: 'italic',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
  },
  logoutText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: '600',
  }
});

export default ApprovalPendingScreen;
