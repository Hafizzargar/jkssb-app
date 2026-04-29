import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, TextInput, Modal, Platform } from 'react-native';
import { ChevronLeft, Plus, Trash2, Send, Sparkles, CheckCircle, HelpCircle, XCircle, Clock, Settings, BookOpen, Calendar, Eye, Trophy, ChevronRight, Users } from 'lucide-react-native';
import api from '../../utils/api';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';
import DropDownPicker from 'react-native-dropdown-picker';
import { toast } from '../../components/Toast';

const AdminMCQReview = ({ navigation }) => {
  const theme = useTheme();
  const [pendingSets, setPendingSets] = useState([]);
  const [activeSets, setActiveSets] = useState([]);
  const [pastSets, setPastSets] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPastSet, setSelectedPastSet] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'active' | 'past'
  
  // Dropdown State
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);
  
  // Configuration State
  const [customSubject, setCustomSubject] = useState('');
  const [totalMinutes, setTotalMinutes] = useState('5');
  const [secondsPerQ, setSecondsPerQ] = useState('15');
  const [questionsNeeded, setQuestionsNeeded] = useState(20);
  
  // Scheduling State
  const [testDate, setTestDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('12:05');
  const [startPeriod, setStartPeriod] = useState('PM'); // AM | PM
  const [endPeriod, setEndPeriod] = useState('PM'); // AM | PM

  const format12h = (text, setTime, setPeriod) => {
    setTime(text);
    if (text.includes(':')) {
      const [hStr, mStr] = text.split(':');
      let h = parseInt(hStr);
      if (!isNaN(h) && h > 12) {
        setTime(`${(h - 12).toString().padStart(2, '0')}:${mStr || ''}`);
        setPeriod('PM');
      } else if (!isNaN(h) && h === 0) {
        setTime(`12:${mStr || ''}`);
        setPeriod('AM');
      }
    }
  };
  
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], correct: 'A', explanation: '' }
  ]);
  const [editingSetId, setEditingSetId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    const mins = parseInt(totalMinutes) || 0;
    const secs = parseInt(secondsPerQ) || 0;
    if (mins > 0 && secs > 0) {
      setQuestionsNeeded(Math.floor((mins * 60) / secs));
    }

    if (startTime && mins > 0) {
      try {
        let [h, m] = startTime.split(':').map(Number);
        if (startPeriod === 'PM' && h < 12) h += 12;
        if (startPeriod === 'AM' && h === 12) h = 0;

        const date = new Date();
        date.setHours(h, m + mins);
        
        let endH = date.getHours();
        let endM = date.getMinutes().toString().padStart(2, '0');
        const period = endH >= 12 ? 'PM' : 'AM';
        endH = endH % 12;
        if (endH === 0) endH = 12;
        
        setEndTime(`${endH.toString().padStart(2, '0')}:${endM}`);
        setEndPeriod(period);
      } catch (e) {}
    }
  }, [totalMinutes, secondsPerQ, startTime, startPeriod]);

  useEffect(() => {
    if (questionsNeeded > 0) {
      const isListEffectivelyEmpty = questions.every(q => !q.question || q.question.trim() === '');
      if (isListEffectivelyEmpty || questions.length === 0) {
        setQuestions(Array(questionsNeeded).fill(0).map(() => ({ question: '', options: ['', '', '', ''], correct: 'A', explanation: '' })));
      } else if (questions.length < questionsNeeded) {
        const diff = questionsNeeded - questions.length;
        setQuestions(prev => [...prev, ...Array(diff).fill(0).map(() => ({ question: '', options: ['', '', '', ''], correct: 'A', explanation: '' }))]);
      } else if (questions.length > questionsNeeded) {
        setQuestions(prev => prev.slice(0, questionsNeeded));
      }
    }
  }, [questionsNeeded]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingRes, activeRes, pastRes, subRes] = await Promise.all([
        api.get('/admin/mcq/pending'),
        api.get('/admin/mcq/active'),
        api.get('/admin/mcq/past'),
        api.get('/admin/subject')
      ]);
      
      setPendingSets(pendingRes.data || []);
      setActiveSets(activeRes.data || []);
      setPastSets(pastRes.data || []);
      setSubjects(subRes.data.filter(s => s.isActive));
      
      const dropdownItems = subRes.data.filter(s => s.isActive).map(s => ({ label: `${s.name} (${s.code})`, value: s.code }));
      dropdownItems.push({ label: '+ MANUAL ENTRY', value: 'MANUAL' });
      setItems(dropdownItems);
      if (dropdownItems.length > 0 && !value) setValue(dropdownItems[0].value);
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!testDate || !startTime || !endTime) return toast('Please fill in Date, Start Time, and End Time', 'error');
    const subjectToUse = value === 'MANUAL' ? customSubject : value;
    if (!subjectToUse) return toast('Please select or enter a subject', 'error');
    
    const normalizeTime = (t, period) => {
      const parts = t.trim().split(':');
      let h = parseInt(parts[0]);
      let m = parts[1].padStart(2, '0');
      if (period === 'PM' && h < 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return [h.toString().padStart(2, '0'), m].join(':');
    };

    const cleanStart = normalizeTime(startTime, startPeriod);
    const cleanEnd = normalizeTime(endTime, endPeriod);
    const startObj = new Date(`${testDate}T${cleanStart}:00`);
    let endObj = new Date(`${testDate}T${cleanEnd}:00`);
    if (endObj <= startObj) endObj.setDate(endObj.getDate() + 1);

    try {
      setLoading(true);
      await api.post('/admin/mcq/manual', {
        id: editingSetId,
        subject: subjectToUse,
        questions,
        date: testDate,
        testDuration: parseInt(totalMinutes),
        timePerQuestion: parseInt(secondsPerQ),
        startTime: startObj,
        endTime: endObj
      });
      toast('Mission updated successfully!', 'success');
      setShowManual(false);
      fetchData();
    } catch (error) {
      toast(error.response?.data?.message || 'Failed to schedule.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/admin/mcq/${id}`);
      fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMission = (set) => {
    setEditingSetId(set._id);
    setQuestions([...set.questions]);
    const item = items.find(i => i.value === set.subject || i.label === set.subject);
    if (item) setValue(item.value);
    else { setValue('MANUAL'); setCustomSubject(set.subject); }
    if (set.date) setTestDate(set.date);
    if (set.testDuration) setTotalMinutes(set.testDuration.toString());
    if (set.timePerQuestion) setSecondsPerQ(set.timePerQuestion.toString());
    setShowManual(true);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const s = styles(theme);

  const getSetList = () => {
    if (activeTab === 'pending') return pendingSets;
    if (activeTab === 'active') return activeSets;
    return pastSets;
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Mission Hub</Text>
          <Text style={s.headerSub}>Admin Control Room</Text>
        </View>
        <TouchableOpacity 
          style={s.plusBtn} 
          onPress={() => {
            setEditingSetId(null);
            setShowManual(true);
          }}
        >
          <Plus color="#000" size={24} />
        </TouchableOpacity>
      </View>

      <View style={s.tabBar}>
        <TouchableOpacity style={[s.tab, activeTab === 'pending' && s.activeTab]} onPress={() => setActiveTab('pending')}>
          <Text style={[s.tabText, activeTab === 'pending' && s.activeTabText]}>Review ({pendingSets.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab === 'active' && s.activeTab]} onPress={() => setActiveTab('active')}>
          <Text style={[s.tabText, activeTab === 'active' && s.activeTabText]}>Live ({activeSets.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab === 'past' && s.activeTab]} onPress={() => setActiveTab('past')}>
          <Text style={[s.tabText, activeTab === 'past' && s.activeTabText]}>Past ({pastSets.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {getSetList().length === 0 ? (
          <View style={s.emptyState}>
            <HelpCircle color={theme.colors.textMuted} size={48} />
            <Text style={s.emptyText}>No {activeTab} missions found</Text>
          </View>
        ) : (
          getSetList().map((set) => (
            <View key={set._id} style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.subjectBadge}>
                  <Text style={s.subjectText}>{set.subject}</Text>
                </View>
                {activeTab === 'past' ? (
                  <View style={s.statBadge}>
                    <Users color={theme.colors.primary} size={12} />
                    <Text style={s.statText}>{set.attemptsCount || 0} Given</Text>
                  </View>
                ) : (
                  <View style={[s.liveBadge, { backgroundColor: (new Date() >= new Date(set.startTime) && new Date() <= new Date(set.endTime)) ? '#10b98120' : '#3b82f620' }]}>
                    <View style={[s.dot, { backgroundColor: (new Date() >= new Date(set.startTime) && new Date() <= new Date(set.endTime)) ? '#10b981' : '#3b82f6' }]} />
                    <Text style={[s.liveText, { color: (new Date() >= new Date(set.startTime) && new Date() <= new Date(set.endTime)) ? '#10b981' : '#3b82f6' }]}>
                      {(new Date() >= new Date(set.startTime) && new Date() <= new Date(set.endTime)) ? 'LIVE' : 'SCHEDULED'}
                    </Text>
                  </View>
                )}
              </View>
              
              <Text style={s.cardTitle}>{set.subject} Mission</Text>
              
              <View style={s.timeRow}>
                <Clock size={14} color={theme.colors.textMuted} />
                <Text style={s.timeText}>
                  {new Date(set.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {set.questions.length} Qs
                </Text>
                <Text style={s.bullet}>•</Text>
                <Calendar size={14} color={theme.colors.textMuted} />
                <Text style={s.timeText}>{set.date}</Text>
              </View>

              {activeTab === 'past' && set.toppers?.length > 0 && (
                <View style={s.topperPreview}>
                  <Trophy color="#f59e0b" size={14} />
                  <Text style={s.topperText}>Topper: {set.toppers[0].name} ({set.toppers[0].score})</Text>
                </View>
              )}

              <View style={s.actionsRow}>
                {activeTab === 'past' ? (
                  <TouchableOpacity 
                    style={[s.actionBtn, s.viewBtn]}
                    onPress={() => { setSelectedPastSet(set); setShowDetails(true); }}
                  >
                    <Eye color="#fff" size={18} />
                    <Text style={s.viewBtnText}>View Questions & Toppers</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity style={[s.actionBtn, s.approveBtn]} onPress={() => handleEditMission(set)}>
                      <Settings color="#000" size={18} />
                      <Text style={s.actionText}>Review & Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(set._id)}>
                      <Trash2 color={theme.colors.error} size={18} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Details Modal for Past Missions */}
      <Modal visible={showDetails} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Mission Report</Text>
                <Text style={s.modalSub}>{selectedPastSet?.subject} • {selectedPastSet?.date}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <XCircle color={theme.colors.textMuted} size={28} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.section}>
                <Text style={s.sectionTitle}>🏆 Hall of Fame</Text>
                <View style={s.toppersList}>
                  {selectedPastSet?.toppers?.map((t, i) => (
                    <View key={i} style={s.topperItem}>
                      <Text style={s.rankNum}>#{i+1}</Text>
                      <View style={{flex: 1}}>
                        <Text style={s.topperName}>{t.name}</Text>
                        <Text style={s.topperUser}>@{t.username}</Text>
                      </View>
                      <Text style={s.topperScore}>{t.score}</Text>
                    </View>
                  ))}
                  {(!selectedPastSet?.toppers || selectedPastSet.toppers.length === 0) && (
                    <Text style={s.emptyText}>No participation recorded.</Text>
                  )}
                </View>
              </View>

              <View style={s.section}>
                <Text style={s.sectionTitle}>📝 Questions & Answers</Text>
                {selectedPastSet?.questions?.map((q, i) => (
                  <View key={i} style={s.qReviewCard}>
                    <Text style={s.qReviewText}>Q{i+1}: {q.question}</Text>
                    <View style={s.optionsReview}>
                      {q.options.map((opt, oi) => {
                        const isCorrect = opt === q.correct || String.fromCharCode(65+oi) === q.correct;
                        return (
                          <View key={oi} style={[s.optReview, isCorrect && s.optReviewCorrect]}>
                            <Text style={[s.optReviewText, isCorrect && {color: '#fff', fontWeight: 'bold'}]}>
                              {String.fromCharCode(65+oi)}. {opt}
                            </Text>
                            {isCorrect && <CheckCircle color="#fff" size={14} />}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Manual Scheduler Modal (Reused for Edit) */}
      <Modal visible={showManual} animationType="fade" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
             <View style={s.modalHeader}>
                <Text style={s.modalTitle}>{editingSetId ? 'Edit Mission' : 'New Mission'}</Text>
                <TouchableOpacity onPress={() => setShowManual(false)}><XCircle color={theme.colors.textMuted} size={28} /></TouchableOpacity>
             </View>
             <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={s.subLabel}>Subject</Text>
                <TextInput style={s.input} value={customSubject} onChangeText={setCustomSubject} placeholder="e.g. GK_JK" />
                
                <Text style={s.subLabel}>Mission Details</Text>
                <View style={s.configRow}>
                  <View style={{flex: 1}}>
                    <Text style={s.inputLabel}>Date (YYYY-MM-DD)</Text>
                    <TextInput style={s.input} value={testDate} onChangeText={setTestDate} placeholder="2026-04-20" />
                  </View>
                  <View style={{flex: 1, marginLeft: 10}}>
                    <Text style={s.inputLabel}>Duration (Mins)</Text>
                    <TextInput style={s.input} value={totalMinutes} onChangeText={setTotalMinutes} keyboardType="numeric" />
                  </View>
                </View>

                <View style={s.configRow}>
                  <View style={{flex: 1}}>
                    <Text style={s.inputLabel}>Start Time (HH:MM)</Text>
                    <TextInput style={s.input} value={startTime} onChangeText={t => format12h(t, setStartTime, setStartPeriod)} placeholder="12:00" />
                  </View>
                  <View style={{flex: 0.5, marginLeft: 10, justifyContent: 'flex-end'}}>
                    <TouchableOpacity style={s.periodBtn} onPress={() => setStartPeriod(p => p === 'AM' ? 'PM' : 'AM')}>
                      <Text style={s.periodText}>{startPeriod}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={s.configRow}>
                  <View style={{flex: 1}}>
                    <Text style={s.inputLabel}>Secs per Q</Text>
                    <TextInput style={s.input} value={secondsPerQ} onChangeText={setSecondsPerQ} keyboardType="numeric" />
                  </View>
                  <View style={{flex: 1, marginLeft: 10}}>
                    <Text style={s.inputLabel}>Total Qs</Text>
                    <View style={s.readOnlyBox}><Text style={s.readOnlyVal}>{questionsNeeded}</Text></View>
                  </View>
                </View>

                <Text style={s.subLabel}>Questions ({questions.length})</Text>
                {questions.map((q, idx) => (
                  <View key={idx} style={s.questionBlock}>
                    <TextInput style={s.input} value={q.question} onChangeText={t => updateQuestion(idx, 'question', t)} placeholder={`Question ${idx+1}`} />
                    {q.options.map((opt, oIdx) => (
                      <TextInput key={oIdx} style={[s.input, {marginTop: 5}]} value={opt} onChangeText={t => updateOption(idx, oIdx, t)} placeholder={`Option ${String.fromCharCode(65+oIdx)}`} />
                    ))}
                    <TextInput style={[s.input, {marginTop: 5, borderColor: theme.colors.primary}]} value={q.correct} onChangeText={t => updateQuestion(idx, 'correct', t)} placeholder="Correct Option (e.g. A or the text)" />
                  </View>
                ))}
                
                <TouchableOpacity style={s.submitBtn} onPress={handleManualSubmit}>
                  <Text style={s.submitBtnText}>Save Mission</Text>
                </TouchableOpacity>
                <View style={{height: 50}} />
             </ScrollView>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { marginRight: 16 },
  headerTitle: { color: theme.colors.text, fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: theme.colors.primary, fontSize: 12 },
  plusBtn: { backgroundColor: theme.colors.primary, padding: 8, borderRadius: 12 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: 'bold' },
  activeTabText: { color: theme.colors.primary },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  subjectBadge: { backgroundColor: `${theme.colors.primary}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  subjectText: { color: theme.colors.primary, fontSize: 11, fontWeight: 'bold' },
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statText: { color: theme.colors.text, fontSize: 11, fontWeight: '600' },
  cardTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  timeText: { color: theme.colors.textMuted, fontSize: 13 },
  bullet: { color: theme.colors.textMuted },
  topperPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 8, borderRadius: 10, marginBottom: 12 },
  topperText: { color: '#f59e0b', fontSize: 12, fontWeight: 'bold' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  viewBtn: { backgroundColor: theme.colors.primary },
  viewBtnText: { color: '#000', fontWeight: 'bold' },
  approveBtn: { backgroundColor: theme.colors.primary },
  actionText: { color: '#000', fontWeight: 'bold' },
  deleteBtn: { width: 48, height: 48, backgroundColor: `${theme.colors.error}15`, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '90%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: theme.colors.text, fontSize: 24, fontWeight: 'bold' },
  modalSub: { color: theme.colors.textMuted, fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  toppersList: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 12 },
  topperItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rankNum: { width: 30, color: theme.colors.primary, fontWeight: 'bold' },
  topperName: { color: theme.colors.text, fontWeight: 'bold' },
  topperUser: { color: theme.colors.textMuted, fontSize: 12 },
  topperScore: { color: '#22c55e', fontWeight: 'bold', fontSize: 16 },
  qReviewCard: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  qReviewText: { color: theme.colors.text, fontSize: 15, fontWeight: '600', marginBottom: 12 },
  optionsReview: { gap: 8 },
  optReview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  optReviewCorrect: { backgroundColor: '#10b981', borderColor: '#10b981' },
  optReviewText: { color: theme.colors.textMuted, fontSize: 13 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 10, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 100, opacity: 0.5 },
  emptyText: { color: theme.colors.textMuted, marginTop: 12 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  input: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 14, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
  subLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: 'bold', marginBottom: 6, marginTop: 16 },
  submitBtn: { backgroundColor: theme.colors.primary, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  submitBtnText: { color: '#000', fontWeight: 'bold' },
    questionBlock: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
    configRow: { flexDirection: 'row', marginBottom: 12 },
    inputLabel: { color: theme.colors.textMuted, fontSize: 10, marginBottom: 4, textTransform: 'uppercase' },
    periodBtn: { height: 44, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
    periodText: { color: theme.colors.primary, fontWeight: 'bold' },
    readOnlyBox: { height: 44, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    readOnlyVal: { color: theme.colors.textMuted, fontWeight: 'bold' }
});

export default AdminMCQReview;
