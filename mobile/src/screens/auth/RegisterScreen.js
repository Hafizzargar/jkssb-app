import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Animated, StatusBar, ActivityIndicator } from 'react-native';
import { Mail, User, Phone, AtSign, ArrowRight, CheckSquare, Square, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';
import client from '../../api/client';
import { toast } from '../../components/Toast';

const { width, height } = Dimensions.get('window');
const isLargeScreen = width > 768;

const RegisterScreen = ({ navigation }) => {
  const theme = useTheme();
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    isTermsAccepted: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  const handleRegister = async () => {
    if (loading) return;
    const { name, username, email, phone, password, isTermsAccepted } = form;
    
    if (!name || !username || !email || !phone || !password) {
      toast('Please fill in all details', 'error');
      return;
    }

    if (password.length < 6) {
      toast('Password must be at least 6 characters', 'error');
      return;
    }

    if (!isTermsAccepted) {
      toast('Please accept the terms and conditions', 'error');
      return;
    }

    setLoading(true);
    try {
      await client.post('/auth/register', form);
      toast('Registration successful! Please wait for admin approval.', 'success');
      navigation.navigate('Login');
    } catch (error) {
      // Interceptor handles error toast
    } finally {
      setLoading(false);
    }
  };

  const s = styles(theme);

  const renderInput = (icon, placeholder, key, keyboardType = 'default', isPassword = false) => (
    <View style={[
      s.inputWrapper,
      focusedField === key && { borderColor: theme.colors.primary, backgroundColor: theme.colors.background }
    ]}>
      {React.cloneElement(icon, { 
        color: focusedField === key ? theme.colors.primary : theme.colors.textMuted,
        size: 20,
        style: s.icon
      })}
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType={keyboardType}
        secureTextEntry={isPassword && !showPassword}
        autoCapitalize={key === 'email' || key === 'username' ? 'none' : 'sentences'}
        value={form[key]}
        onChangeText={(v) => setForm({...form, [key]: v})}
        onFocus={() => setFocusedField(key)}
        onBlur={() => setFocusedField(null)}
      />
      {isPassword && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeIcon}>
          {showPassword ? <EyeOff color={theme.colors.textMuted} size={20} /> : <Eye color={theme.colors.textMuted} size={20} />}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={theme.name === 'Dark Mode' ? 'light-content' : 'dark-content'} />
      <View style={s.backgroundDecorator} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={[s.innerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={s.title}>Create Account</Text>
            <Text style={s.subtitle}>Start your journey with JKSSB PrepMaster</Text>

            <View style={s.form}>
              {renderInput(<User />, "Full Name", "name")}
              {renderInput(<AtSign />, "Username", "username")}
              {renderInput(<Phone />, "Phone Number", "phone", "phone-pad")}
              {renderInput(<Mail />, "Email Address", "email", "email-address")}
              {renderInput(<Lock />, "Password", "password", "default", true)}

              <TouchableOpacity 
                style={s.termsRow}
                onPress={() => setForm({...form, isTermsAccepted: !form.isTermsAccepted})}
                activeOpacity={0.7}
              >
                <View style={s.checkbox}>
                  {form.isTermsAccepted ? 
                    <CheckSquare color={theme.colors.primary} size={24} /> : 
                    <Square color={theme.colors.textMuted} size={24} />
                  }
                </View>
                <Text style={s.termsText}>I am above 18 years old and agree to the <Text style={s.linkUnderline}>Terms & Conditions</Text></Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[s.button, loading && s.buttonDisabled]}
                onPress={handleRegister}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text style={s.buttonText}>Register Now</Text>
                    <ArrowRight color="#000" size={20} strokeWidth={3} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={s.footerContainer}>
              <Text style={s.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={s.link}> Login</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  backgroundDecorator: { position: 'absolute', top: -height * 0.05, left: -width * 0.1, width: width * 0.6, height: width * 0.6, borderRadius: width * 0.3, backgroundColor: theme.colors.primary, opacity: 0.03, zIndex: 0 },
  scrollContent: { padding: spacing.xl, alignItems: 'center', width: isLargeScreen ? 500 : '100%', alignSelf: 'center', paddingBottom: 60 },
  innerContent: { width: '100%', alignItems: 'center' },
  title: { color: theme.colors.text, fontSize: 34, fontWeight: '800', marginBottom: spacing.xs, marginTop: 20, letterSpacing: -0.5 },
  subtitle: { color: theme.colors.textMuted, fontSize: 16, marginBottom: 40, textAlign: 'center' },
  form: { width: '100%' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, height: 64, marginBottom: spacing.md, borderWidth: 1.5, borderColor: theme.colors.border },
  icon: { marginRight: spacing.sm },
  input: { flex: 1, color: theme.colors.text, fontSize: 16, fontWeight: '500' },
  eyeIcon: { padding: 8 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.xl, paddingRight: 10 },
  checkbox: { marginRight: 12 },
  termsText: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20, flex: 1 },
  linkUnderline: { textDecorationLine: 'underline', color: theme.colors.text },
  button: { 
    backgroundColor: theme.colors.primary, 
    height: 64, 
    borderRadius: borderRadius.lg, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    elevation: 5 
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#000', fontSize: 17, fontWeight: '700' },
  footerContainer: { flexDirection: 'row', marginTop: 40, alignItems: 'center' },
  footerText: { color: theme.colors.textMuted, fontSize: 15 },
  link: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 15 }
});

export default RegisterScreen;
