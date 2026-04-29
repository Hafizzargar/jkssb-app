import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Mail, ArrowRight, Shield } from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../redux/authSlice';
import { useTheme } from '../../utils/useTheme';
import { spacing } from '../../theme';
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
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    if (!email || !password) {
      toast('Please enter both email and password', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user } = response.data;
      
      toast('Welcome back!', 'success');
      dispatch(loginSuccess({ user }));
    } catch (error) {
      // Interceptor handles error toast
    } finally {
      setLoading(false);
    }
  };

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.content}
      >
        <View style={s.innerContent}>
          <View style={s.header}>
            <View style={s.logoBox}>
              <Shield color="#FFFFFF" size={28} strokeWidth={2.5} />
            </View>
            <Text style={s.brandName}>AdaptLearn-JKSSB</Text>
            <Text style={s.brandSlogan}>your ultimate prep partner</Text>
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
                <Text style={s.buttonText}>Sign in</Text>
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
  header: { alignItems: 'center', marginBottom: 30 },
  logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  brandName: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 2 },
  brandSlogan: { fontSize: 13, color: theme.colors.textMuted },
  titleSection: { marginBottom: 24, alignItems: 'flex-start' },
  title: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text, marginBottom: 6 },
  subtitle: { fontSize: 15, color: theme.colors.textMuted },
  form: { width: '100%' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: theme.colors.primary, fontSize: 14, fontWeight: '600' },
  button: { backgroundColor: theme.colors.primary, height: 56, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.textMuted, paddingHorizontal: 16, fontSize: 13 },
  googleBtn: { backgroundColor: 'transparent', height: 56, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  googleText: { color: theme.colors.text, fontSize: 15, fontWeight: '600', marginLeft: 8 },
  footer: { flexDirection: 'row', marginTop: 30, justifyContent: 'center' },
  footerText: { color: theme.colors.textMuted, fontSize: 14 },
  link: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 14 }
});

export default LoginScreen;
