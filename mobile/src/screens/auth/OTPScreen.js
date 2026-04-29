import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Animated, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../redux/authSlice';
import { Shield, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';
import client from '../../api/client';
import { toast } from '../../components/Toast';

const { width, height } = Dimensions.get('window');

const OTPScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { email } = route.params || { email: 'student@example.com' };
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dispatch = useDispatch();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleVerify = async () => {
    if (otp.length < 6) return;
    
    setLoading(true);
    try {
      const response = await client.post('/auth/verify-otp', { email, otp });
      const { user, token } = response.data;
      
      toast('Welcome back!', 'success');
      dispatch(loginSuccess({ user, token }));
    } catch (error) {
      // Interceptor handles error toast
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    try {
      await client.post('/auth/send-otp', { email });
      toast('New code sent!', 'success');
    } catch (error) {
      // Interceptor handles error toast
    } finally {
      setResending(false);
    }
  };

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={theme.name === 'Dark Mode' ? 'light-content' : 'dark-content'} />
      <View style={s.backgroundDecorator} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.content}
      >
        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft color={theme.colors.text} size={28} />
        </TouchableOpacity>

        <Animated.View style={[s.innerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={s.header}>
            <View style={s.logoContainer}>
              <View style={s.logoGlow}>
                <Shield color={theme.colors.primary} size={48} strokeWidth={2.5} />
              </View>
            </View>
            <Text style={s.title}>Verification</Text>
            <Text style={s.subtitle}>We've sent a 6-digit secure code to{'\n'}<Text style={s.emailText}>{email}</Text></Text>
          </View>

          <View style={s.form}>
            <View style={[
              s.otpWrapper,
              isFocused && { borderColor: theme.colors.primary, backgroundColor: theme.colors.background }
            ]}>
              <TextInput
                style={s.otpInput}
                placeholder="0 0 0 0 0 0"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
                maxLength={6}
                letterSpacing={12}
                textAlign="center"
                autoFocus
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </View>

            <TouchableOpacity 
              style={[s.button, (otp.length < 6 || loading) && s.buttonDisabled]}
              onPress={handleVerify}
              activeOpacity={0.8}
              disabled={otp.length < 6 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={s.buttonText}>Complete Verification</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[s.resendButton, resending && { opacity: 0.5 }]} 
              onPress={handleResend}
              disabled={resending}
              activeOpacity={0.7}
            >
              {resending ? (
                <ActivityIndicator color={theme.colors.primary} size="small" />
              ) : (
                <>
                  <RefreshCw color={theme.colors.primary} size={16} />
                  <Text style={s.resendText}>Resend Code in 30s</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  backgroundDecorator: {
    position: 'absolute',
    bottom: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: theme.colors.primary,
    opacity: 0.05,
    zIndex: 0,
  },
  content: { 
    flex: 1, 
    padding: spacing.xl, 
    justifyContent: 'center' 
  },
  innerContent: {
    alignItems: 'center',
    width: '100%',
  },
  backButton: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 20 : 40, 
    left: 20, 
    zIndex: 10,
    padding: 8,
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 48 
  },
  logoContainer: {
    width: 80, 
    height: 80, 
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: spacing.md, 
    borderWidth: 1.5, 
    borderColor: theme.colors.border
  },
  logoGlow: {
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    elevation: 8,
  },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: theme.colors.text, 
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: { 
    fontSize: 16, 
    color: theme.colors.textMuted, 
    textAlign: 'center', 
    lineHeight: 24,
  },
  emailText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  form: { 
    width: '100%' 
  },
  otpWrapper: {
    backgroundColor: theme.colors.surface, 
    borderRadius: borderRadius.lg,
    height: 80, 
    borderWidth: 1.5, 
    borderColor: theme.colors.border,
    marginBottom: spacing.xl, 
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  otpInput: { 
    color: theme.colors.primary, 
    fontSize: 36, 
    fontWeight: '800' 
  },
  button: {
    backgroundColor: theme.colors.primary, 
    height: 64, 
    borderRadius: borderRadius.lg,
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    elevation: 5,
  },
  buttonDisabled: { 
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: { 
    color: '#000', 
    fontSize: 17, 
    fontWeight: '700' 
  },
  resendButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: spacing.xl, 
    gap: 8 
  },
  resendText: { 
    color: theme.colors.textMuted, 
    fontSize: 15,
    fontWeight: '500',
  }
});

export default OTPScreen;

