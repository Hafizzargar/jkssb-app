import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Mail, ArrowRight, Shield, Lock, Smartphone, RefreshCcw, ChevronLeft } from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { loginSuccess } from '../../redux/authSlice';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';
import api from '../../utils/api';
import { toast } from '../../components/Toast';
import Input from '../../components/Input';

const { width } = Dimensions.get('window');
const isLargeScreen = width > 768;

const LoginScreen = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOtpMode && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isOtpMode, timeLeft]);

  const handleLogin = async () => {
    if (loading) return;
    if (!email || !password) {
      toast('Please enter both email and password', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.twoFactorRequired) {
        setIsOtpMode(true);
        setTimeLeft(30);
        toast('Code sent to your email!', 'success');
      } else {
        const { user } = response.data;
        toast('Welcome back!', 'success');
        dispatch(loginSuccess({ user }));
      }
    } catch (error) {
      // Interceptor handles error toast
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (loading) return;
    if (!otp || otp.length < 6) {
      toast('Please enter the 6-digit code', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      const { user } = response.data;
      toast('Success! Logged in.', 'success');
      dispatch(loginSuccess({ user }));
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (loading || timeLeft > 0) return;
    handleLogin();
  };

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.content}
      >
        <View style={s.innerContent}>
          {!isOtpMode ? (
            <Animated.View entering={FadeInDown.duration(600)} style={s.modeContainer}>
              <View style={s.header}>
                <View style={s.logoBox}>
                  <Shield color="#FFFFFF" size={28} strokeWidth={2.5} />
                </View>
                <Text style={s.brandName}>Medx Institute</Text>
                <Text style={s.brandSlogan}>Your Ultimate NEET Partner</Text>
              </View>

              <View style={s.titleSection}>
                <Text style={s.title}>Welcome back</Text>
                <Text style={s.subtitle}>Sign in to continue</Text>
              </View>

              <View style={s.form}>
                <Input 
                  label="EMAIL"
                  placeholder="you@email.com"
                  icon={Mail}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Input 
                  label="PASSWORD"
                  placeholder="••••••••"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity style={s.forgotBtn}>
                  <Text style={s.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[s.button, loading && s.buttonDisabled]} 
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={s.buttonText}>Sign in</Text>
                      <ArrowRight color="#FFFFFF" size={20} />
                    </>
                  )}
                </TouchableOpacity>

                <View style={s.dividerContainer}>
                  <View style={s.divider} />
                  <Text style={s.dividerText}>or</Text>
                  <View style={s.divider} />
                </View>

                <TouchableOpacity style={s.googleBtn}>
                  <Text style={s.googleText}>Continue with Google</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.duration(600)} style={s.modeContainer}>
              <TouchableOpacity onPress={() => setIsOtpMode(false)} style={s.backBtn}>
                <ChevronLeft color={theme.colors.textMuted} size={24} />
                <Text style={s.backText}>Change email</Text>
              </TouchableOpacity>

              <View style={s.otpHeader}>
                <View style={[s.logoBox, { backgroundColor: 'rgba(99, 91, 255, 0.1)', borderWidth: 1, borderColor: theme.colors.primary }]}>
                  <Lock color={theme.colors.primary} size={28} strokeWidth={2.5} />
                </View>
                <Text style={s.otpTitle}>Verify your identity</Text>
                <Text style={s.otpSubtitle}>We sent a 6-digit code to</Text>
                <Text style={s.otpEmail}>{email}</Text>
              </View>

              <View style={s.form}>
                <Input 
                  label="6-DIGIT CODE"
                  placeholder="000000"
                  icon={Smartphone}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={s.otpInput}
                />

                <View style={s.timerContainer}>
                  <Text style={[s.timerText, timeLeft < 10 && s.timerWarning]}>
                    Code expires in {timeLeft}s
                  </Text>
                  <TouchableOpacity 
                    onPress={handleResend} 
                    disabled={timeLeft > 0 || loading}
                    style={[s.resendBtn, (timeLeft > 0 || loading) && { opacity: 0.5 }]}
                  >
                    <RefreshCcw size={14} color={timeLeft === 0 ? theme.colors.primary : theme.colors.textMuted} />
                    <Text style={[s.resendText, timeLeft === 0 && { color: theme.colors.primary }]}>Resend Code</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[s.button, loading && s.buttonDisabled]} 
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={s.buttonText}>Verify & Login</Text>
                      <Shield color="#FFFFFF" size={20} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          <View style={s.footer}>
            <Text style={s.footerText}>No account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.link}> Sign up free</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' },
  innerContent: { width: isLargeScreen ? 360 : '100%', maxWidth: 400 },
  modeContainer: { width: '100%' },
  header: { alignItems: 'center', marginBottom: 30 },
  logoBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  brandName: { fontSize: 26, fontWeight: 'bold', color: theme.colors.text, marginBottom: 4 },
  brandSlogan: { fontSize: 13, color: theme.colors.textMuted, letterSpacing: 1 },
  titleSection: { marginBottom: 32, alignItems: 'flex-start' },
  title: { fontSize: 32, fontWeight: 'bold', color: theme.colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: theme.colors.textMuted, lineHeight: 24 },
  form: { width: '100%' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: theme.colors.primary, fontSize: 14, fontWeight: '700' },
  button: { backgroundColor: theme.colors.primary, height: 64, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 32 },
  divider: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.textMuted, paddingHorizontal: 20, fontSize: 13, fontWeight: '600' },
  googleBtn: { backgroundColor: 'transparent', height: 60, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: theme.colors.border },
  googleText: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  
  // OTP Styles
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, marginLeft: -8 },
  backText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  otpHeader: { alignItems: 'center', marginBottom: 40 },
  otpTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.text, marginTop: 16, marginBottom: 8 },
  otpSubtitle: { fontSize: 15, color: theme.colors.textMuted },
  otpEmail: { fontSize: 16, color: theme.colors.text, fontWeight: '700', marginTop: 4 },
  otpInput: { fontSize: 24, letterSpacing: 10, textAlign: 'center' },
  timerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingHorizontal: 4 },
  timerText: { fontSize: 13, color: theme.colors.textMuted, fontWeight: '600' },
  timerWarning: { color: '#ef4444' },
  resendBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resendText: { fontSize: 13, fontWeight: '700', color: theme.colors.textMuted },
  
  footer: { flexDirection: 'row', marginTop: 40, justifyContent: 'center' },
  footerText: { color: theme.colors.textMuted, fontSize: 14 },
  link: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 14 }
});

export default LoginScreen;
