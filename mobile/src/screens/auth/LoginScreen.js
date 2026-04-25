import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../redux/authSlice';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';
import client from '../../api/client';
import { toast } from '../../components/Toast';

const { width } = Dimensions.get('window');
const isLargeScreen = width > 768;

const LoginScreen = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    if (!email || !password) {
      toast('Please enter both email and password', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await client.post('/auth/login', { email, password });
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
              <ShieldCheck color={theme.colors.primary} size={40} strokeWidth={2.5} />
            </View>
            <Text style={s.title}>Sign In</Text>
            <Text style={s.subtitle}>Enter your credentials to continue your prep</Text>
          </View>

          <View style={s.form}>
            <View style={s.inputWrapper}>
              <Mail color={theme.colors.textMuted} size={20} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Email Address"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={s.inputWrapper}>
              <Lock color={theme.colors.textMuted} size={20} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Password"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeIcon}>
                {showPassword ? <EyeOff color={theme.colors.textMuted} size={20} /> : <Eye color={theme.colors.textMuted} size={20} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[s.button, loading && s.buttonDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={s.buttonText}>Login</Text>
                  <ArrowRight color="#000" size={20} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.link}> Register</Text>
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
  innerContent: { width: isLargeScreen ? 400 : '100%' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
  title: { fontSize: 32, fontWeight: 'bold', color: theme.colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: theme.colors.textMuted, textAlign: 'center' },
  form: { width: '100%' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: borderRadius.md, paddingHorizontal: 16, height: 60, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: theme.colors.text, fontSize: 16 },
  eyeIcon: { padding: 8 },
  button: { backgroundColor: theme.colors.primary, height: 60, borderRadius: borderRadius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', marginTop: 32, justifyContent: 'center' },
  footerText: { color: theme.colors.textMuted, fontSize: 15 },
  link: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 15 }
});

export default LoginScreen;
