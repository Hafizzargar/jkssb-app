import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Animated, StatusBar, ActivityIndicator } from 'react-native';
import { Mail, User, Phone, AtSign, CheckSquare, Shield } from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../redux/authSlice';
import { useTheme } from '../../utils/useTheme';
import { spacing } from '../../theme';
import api from '../../utils/api';
import { toast } from '../../components/Toast';
import Input from '../../components/Input';

const { width } = Dimensions.get('window');
const isLargeScreen = width > 768;

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    isTermsAccepted: false
  });
  const [loading, setLoading] = useState(false);

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
      const res = await api.post('/auth/register', form);
      dispatch(loginSuccess({ user: res.data.user }));
      
      toast('Welcome! Registration successful.', 'success');
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main', params: { isNewUser: true } }],
      });
    } catch (error) {
      // Interceptor handles error toast
    } finally {
      setLoading(false);
    }
  };

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={theme.name === 'Dark Mode' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={[s.innerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            
            <View style={s.header}>
              <View style={s.logoBox}>
                <Shield color="#FFFFFF" size={28} strokeWidth={2.5} />
              </View>
              <Text style={s.brandName}>AdaptLearn-JKSSB</Text>
              <Text style={s.brandSlogan}>your ultimate prep partner</Text>
            </View>

            <View style={s.tabContainer}>
              <TouchableOpacity style={s.tab} onPress={() => navigation.navigate('Login')}>
                <Text style={s.tabTextInactive}>Sign in</Text>
              </TouchableOpacity>
              <View style={[s.tab, s.tabActive]}>
                <Text style={s.tabTextActive}>Create account</Text>
              </View>
            </View>

            <View style={s.form}>
              <Input 
                label="FULL NAME"
                placeholder="Alex Morgan"
                icon={User}
                value={form.name}
                onChangeText={(v) => setForm({...form, name: v})}
              />

              <Input 
                label="USERNAME"
                placeholder="alexmorg"
                icon={AtSign}
                autoCapitalize="none"
                value={form.username}
                onChangeText={(v) => setForm({...form, username: v})}
              />

              <Input 
                label="PHONE NUMBER"
                placeholder="9876543210"
                icon={Phone}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(v) => setForm({...form, phone: v})}
              />

              <Input 
                label="WORK EMAIL"
                placeholder="alex@company.com"
                icon={Mail}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(v) => setForm({...form, email: v})}
              />

              <Input 
                label="PASSWORD"
                placeholder="••••••••"
                secureTextEntry
                value={form.password}
                onChangeText={(v) => setForm({...form, password: v})}
              />

              <TouchableOpacity 
                style={s.termsRow}
                onPress={() => setForm({...form, isTermsAccepted: !form.isTermsAccepted})}
                activeOpacity={0.7}
              >
                <View style={[s.checkbox, form.isTermsAccepted && s.checkboxActive]}>
                  {form.isTermsAccepted && <CheckSquare color="#FFFFFF" size={18} />}
                </View>
                <Text style={s.termsText}>I agree to the <Text style={s.linkUnderline}>Terms</Text> and <Text style={s.linkUnderline}>Privacy Policy</Text></Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[s.button, loading && s.buttonDisabled]}
                onPress={handleRegister}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={s.buttonText}>Create account</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={s.footerContainer}>
              <Text style={s.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={s.link}> Sign in</Text>
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
  scrollContent: { padding: spacing.xl, alignItems: 'center', width: isLargeScreen ? 360 : '100%', maxWidth: 400, alignSelf: 'center', paddingBottom: 60, paddingTop: 60 },
  innerContent: { width: '100%', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  brandName: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 2 },
  brandSlogan: { fontSize: 13, color: theme.colors.textMuted },
  tabContainer: { flexDirection: 'row', width: '100%', marginBottom: 30, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabTextInactive: { color: theme.colors.textMuted, fontSize: 15, fontWeight: '600' },
  tabTextActive: { color: theme.colors.primary, fontSize: 15, fontWeight: '600' },
  form: { width: '100%' },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 30 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.textMuted, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  termsText: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 18, flex: 1 },
  linkUnderline: { color: theme.colors.primary },
  button: { backgroundColor: theme.colors.primary, height: 56, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  footerContainer: { flexDirection: 'row', marginTop: 30, alignItems: 'center' },
  footerText: { color: theme.colors.textMuted, fontSize: 14 },
  link: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 14 }
});

export default RegisterScreen;
