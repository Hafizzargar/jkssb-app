import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { ChevronLeft, Save, Trophy, Percent, Wallet, Info, ArrowRight } from 'lucide-react-native';
import api from '../../utils/api';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';

const AdminPrizeConfig = ({ navigation }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('WEEKLY'); // WEEKLY or MONTHLY
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [modelType, setModelType] = useState('FIXED'); // FIXED or DYNAMIC
  const [entryFee, setEntryFee] = useState('10');
  const [commission, setCommission] = useState('20');
  const [rank1, setRank1] = useState('400');
  const [rank2, setRank2] = useState('250');
  const [rank3, setRank3] = useState('150');

  useEffect(() => {
    fetchConfig();
  }, [activeTab]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/prize/config');
      const data = activeTab === 'WEEKLY' ? res.data.weekly : res.data.monthly;
      
      if (data) {
        setModelType(data.modelType || 'FIXED');
        setEntryFee(String(data.entryFee || '10'));
        setCommission(String(data.platformCommission || '20'));
        setRank1(String(data.amounts?.rank1 || '400'));
        setRank2(String(data.amounts?.rank2 || '250'));
        setRank3(String(data.amounts?.rank3 || '150'));
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to load prize configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        type: activeTab,
        modelType,
        entryFee: Number(entryFee),
        platformCommission: Number(commission),
        rank1: Number(rank1),
        rank2: Number(rank2),
        rank3: Number(rank3)
      };

      await api.put('/admin/prize/config', payload);
      Alert.alert('Success', `${activeTab} prize configuration updated!`);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // Calculations for DYNAMIC model
  const exampleUsers = 100;
  const totalPool = exampleUsers * Number(entryFee || 0);
  const platformCut = (totalPool * Number(commission || 0)) / 100;
  const finalPrizePool = totalPool - platformCut;
  const distributedTotal = Number(rank1 || 0) + Number(rank2 || 0) + Number(rank3 || 0);

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <ChevronLeft color={theme.colors.text} size={24} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Prize & Fee Master</Text>
            <Text style={s.subtitle}>Configure rewards & entry economics</Text>
          </View>
          <TouchableOpacity 
            style={[s.saveBtn, saving && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator size="small" color="#000" /> : <Save color="#000" size={20} />}
          </TouchableOpacity>
        </View>

        <View style={s.tabBar}>
          <TouchableOpacity 
            style={[s.tab, activeTab === 'WEEKLY' && s.activeTab]} 
            onPress={() => setActiveTab('WEEKLY')}
          >
            <Text style={[s.tabText, activeTab === 'WEEKLY' && s.activeTabText]}>Weekly Rewards</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.tab, activeTab === 'MONTHLY' && s.activeTab]} 
            onPress={() => setActiveTab('MONTHLY')}
          >
            <Text style={[s.tabText, activeTab === 'MONTHLY' && s.activeTabText]}>Monthly Rewards</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : (
          <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
            {/* Model Selection */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Revenue Model</Text>
              <View style={s.modelPicker}>
                <TouchableOpacity 
                  style={[s.modelOption, modelType === 'FIXED' && s.modelActive]}
                  onPress={() => setModelType('FIXED')}
                >
                  <Text style={[s.modelText, modelType === 'FIXED' && s.modelTextActive]}>Fixed Prizes</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[s.modelOption, modelType === 'DYNAMIC' && s.modelActive]}
                  onPress={() => setModelType('DYNAMIC')}
                >
                  <Text style={[s.modelText, modelType === 'DYNAMIC' && s.modelTextActive]}>Entry Fee Based</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.helperText}>
                {modelType === 'FIXED' 
                  ? 'Set constant prize amounts regardless of user count.' 
                  : 'Prizes are funded by entry fees. Platform keeps a commission.'}
              </Text>
            </View>

            {modelType === 'DYNAMIC' && (
              <View style={s.card}>
                <View style={s.cardHeader}>
                  <Wallet color={theme.colors.primary} size={20} />
                  <Text style={s.cardTitle}>Economics Configuration</Text>
                </View>
                
                <View style={s.inputRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.inputLabel}>Entry Fee (₹)</Text>
                    <TextInput 
                      style={s.input} 
                      value={entryFee} 
                      onChangeText={setEntryFee} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ width: 16 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.inputLabel}>Commission (%)</Text>
                    <TextInput 
                      style={s.input} 
                      value={commission} 
                      onChangeText={setCommission} 
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Calculator Preview */}
                <View style={s.calculator}>
                  <View style={s.calcHeader}>
                    <Info size={14} color={theme.colors.primary} />
                    <Text style={s.calcHeaderText}>Simulation for {exampleUsers} Users</Text>
                  </View>
                  <View style={s.calcBody}>
                    <View style={s.calcRow}>
                      <Text style={s.calcLabel}>Total Collection:</Text>
                      <Text style={s.calcVal}>₹{totalPool}</Text>
                    </View>
                    <View style={s.calcRow}>
                      <Text style={s.calcLabel}>Platform Profit ({commission}%):</Text>
                      <Text style={[s.calcVal, { color: '#10b981' }]}>- ₹{platformCut}</Text>
                    </View>
                    <View style={s.divider} />
                    <View style={s.calcRow}>
                      <Text style={[s.calcLabel, { fontWeight: 'bold' }]}>Net Prize Pool:</Text>
                      <Text style={[s.calcVal, { fontWeight: 'bold', color: theme.colors.primary }]}>₹{finalPrizePool}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Prize Distribution */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Trophy color="#f59e0b" size={20} />
                <Text style={s.cardTitle}>Prize Distribution</Text>
              </View>

              <View style={s.rankInput}>
                <View style={s.rankBadge}><Text style={s.rankBadgeText}>1st</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>Winner Prize (₹)</Text>
                  <TextInput 
                    style={s.input} 
                    value={rank1} 
                    onChangeText={setRank1} 
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={s.rankInput}>
                <View style={[s.rankBadge, { backgroundColor: '#94a3b8' }]}><Text style={s.rankBadgeText}>2nd</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>Runner Up (₹)</Text>
                  <TextInput 
                    style={s.input} 
                    value={rank2} 
                    onChangeText={setRank2} 
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={s.rankInput}>
                <View style={[s.rankBadge, { backgroundColor: '#b45309' }]}><Text style={s.rankBadgeText}>3rd</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>3rd Position (₹)</Text>
                  <TextInput 
                    style={s.input} 
                    value={rank3} 
                    onChangeText={setRank3} 
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {modelType === 'DYNAMIC' && (
                <View style={[s.totalWarning, distributedTotal > finalPrizePool && { borderColor: theme.colors.error }]}>
                  <Text style={[s.totalWarningText, distributedTotal > finalPrizePool && { color: theme.colors.error }]}>
                    {distributedTotal > finalPrizePool 
                      ? `⚠️ Total (₹${distributedTotal}) exceeds pool (₹${finalPrizePool})`
                      : `✅ Distributed: ₹${distributedTotal} / ₹${finalPrizePool}`}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border
  },
  backBtn: { padding: 4 },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  saveBtn: { backgroundColor: theme.colors.primary, width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  
  tabBar: { flexDirection: 'row', padding: spacing.md, gap: 12 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'transparent' },
  activeTab: { backgroundColor: `${theme.colors.primary}10`, borderColor: theme.colors.primary },
  tabText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
  activeTabText: { color: theme.colors.primary, fontWeight: 'bold' },

  content: { flex: 1, padding: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  section: { marginBottom: 24 },
  sectionLabel: { color: theme.colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  modelPicker: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4 },
  modelOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  modelActive: { backgroundColor: theme.colors.surface, elevation: 2 },
  modelText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
  modelTextActive: { color: theme.colors.primary, fontWeight: 'bold' },
  helperText: { color: theme.colors.textMuted, fontSize: 11, marginTop: 8, paddingHorizontal: 4 },

  card: { backgroundColor: theme.colors.surface, borderRadius: borderRadius.lg, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  cardTitle: { color: theme.colors.text, fontSize: 15, fontWeight: 'bold' },

  inputRow: { flexDirection: 'row' },
  inputLabel: { color: theme.colors.textMuted, fontSize: 11, marginBottom: 6, fontWeight: 'bold', textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 12, color: theme.colors.text, fontSize: 16, borderWidth: 1, borderColor: theme.colors.border },

  calculator: { marginTop: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 12 },
  calcHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  calcHeaderText: { color: theme.colors.primary, fontSize: 11, fontWeight: 'bold' },
  calcBody: { gap: 8 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calcLabel: { color: theme.colors.textMuted, fontSize: 12 },
  calcVal: { color: theme.colors.text, fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 4 },

  rankInput: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  rankBadge: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center' },
  rankBadgeText: { color: '#000', fontWeight: 'bold', fontSize: 12 },

  totalWarning: { marginTop: 8, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#10b98120', backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center' },
  totalWarningText: { color: '#10b981', fontSize: 11, fontWeight: 'bold' }
});

export default AdminPrizeConfig;
