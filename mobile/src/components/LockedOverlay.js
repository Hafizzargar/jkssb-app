import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Clock, LogOut } from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { useTheme } from '../utils/useTheme';
import { spacing, borderRadius } from '../theme';
import client from '../api/client';

const { width, height } = Dimensions.get('window');

const LockedOverlay = () => {
  const theme = useTheme() || { colors: {}, name: '' };
  const dispatch = useDispatch();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
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
    <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
      <View style={s.card}>
        <View style={s.iconCircle}>
          <Clock color={theme.colors.primary} size={48} />
        </View>
        
        <Text style={s.title}>Approval Pending</Text>
        <Text style={s.message}>
          Your account is currently under review. Once approved, you'll get full access to all features!
        </Text>

        <View style={s.statusBadge}>
          <View style={s.dot} />
          <Text style={s.statusText}>PENDING REVIEW</Text>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <LogOut color={theme.colors.error} size={18} />
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = (theme) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 8,
    elevation: 10,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  statusText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: '600',
  }
});

export default LockedOverlay;
