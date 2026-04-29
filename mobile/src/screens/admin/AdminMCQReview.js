import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Trash2, Send, Sparkles, CheckCircle, HelpCircle, XCircle, Clock, Settings, BookOpen, Calendar, Eye, Trophy, ChevronRight, Users } from 'lucide-react-native';
import api from '../../utils/api';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';
import DropDownPicker from 'react-native-dropdown-picker';
import { toast } from '../../components/Toast';

// Dynamic patterns fetched from DB

const AdminMCQReview = ({ navigation }) => {
  const theme = useTheme();
  const [pendingSets, setPendingSets] = useState([]);
  const [activeSets, setActiveSets] = useState([]);
  const [pastSets, setPastSets] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [selectedPastSet, setSelectedPastSet] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'active' | 'past' | 'settings'
  const [appConfig, setAppConfig] = useState({ latestVersion: '1.0.0', downloadUrl: '', updateMessage: '' });
  const [savingConfig, setSavingConfig] = useState(false);
  
  // Dropdown State
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);
  
  // Configuration State
  const [testModes, setTestModes] = useState([]);
  const [testMode, setTestMode] = useState(null);
  const [sections, setSections] = useState([]);
  const [customSubject, setCustomSubject] = useState('');
  const [totalMinutes, setTotalMinutes] = useState('5');
  const [secondsPerQ, setSecondsPerQ] = useState('15');
  const [questionsNeeded, setQuestionsNeeded] = useState(20);
  const [creationMode, setCreationMode] = useState('pattern'); // 'pattern' | 'subject'
  
  // Scheduling State
  const getInitialTime = (plusMins = 5) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + plusMins);
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const p = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return { time: `${h.toString().padStart(2, '0')}:${m}`, period: p };
  };

  const initialSchedule = getInitialTime(5);
  const [testDate, setTestDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [startTime, setStartTime] = useState(initialSchedule.time);
  const [endTime, setEndTime] = useState('12:05');
  const [startPeriod, setStartPeriod] = useState(initialSchedule.period);
  const [endPeriod, setEndPeriod] = useState('PM'); // AM | PM
  const [isPrizeTest, setIsPrizeTest] = useState(false);
  const [entryFee, setEntryFee] = useState('0');
  const [prizeDistribution, setPrizeDistribution] = useState(['500']); // Array of strings for rank prizes

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingRes, activeRes, pastRes, subRes, patternRes, configRes] = await Promise.all([
        api.get('/admin/mcq/pending'),
        api.get('/admin/mcq/active'),
        api.get('/admin/mcq/past'),
        api.get('/admin/subject'),
        api.get('/admin/pattern'),
        api.get('/admin/config')
      ]);
      
      setPendingSets(pendingRes.data || []);
      setActiveSets(activeRes.data || []);
      setPastSets(pastRes.data || []);
      setSubjects(subRes.data.filter(s => s.isActive));
      setTestModes(patternRes.data || []);
      if (configRes.data?.success) setAppConfig(configRes.data.data);
      
      const dropdownItems = subRes.data.filter(s => s.isActive).map(s => ({ label: `${s.name} (${s.code})`, value: s.code }));
      dropdownItems.push({ label: '+ MANUAL ENTRY', value: 'MANUAL' });
      setItems(dropdownItems);
      if (dropdownItems.length > 0 && !value) setValue(dropdownItems[0].value);
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    const mins = parseInt(totalMinutes) || 0;
    const secs = parseInt(secondsPerQ) || 0;
    
    // Only auto-calculate if not in a fixed Test Mode
    if (!testMode && mins > 0 && secs > 0) {
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


  const applyTestMode = (mode) => {
    setTestMode(mode._id);
    setSections([...mode.sections]);
    
    // 1. Set Duration (Mins)
    const newMins = mode.duration.toString();
    setTotalMinutes(newMins);
    
    // 2. Set Seconds Per Question (calculated to match exactly)
    const autoSecs = Math.floor((mode.duration * 60) / mode.total);
    setSecondsPerQ(autoSecs.toString());
    
    // 3. Set Total Questions (Locked)
    setQuestionsNeeded(mode.total);
    
    // 4. Update Subject & Questions List
    setValue('MANUAL');
    setCustomSubject(`NEET ${mode.label}`);
    
    // Auto-generate empty questions following section pattern
    const newQuestions = [];
    mode.sections.forEach(sec => {
      for (let i = 0; i < sec.count; i++) {
        newQuestions.push({ 
          question: `[${sec.name}] `, 
          options: ['', '', '', ''], 
          correct: 'A', 
          explanation: '' 
        });
      }
    });
    setQuestions(newQuestions);
  };

  const handleAIFill = async () => {
    const isPatternMode = creationMode === 'pattern';
    if (isPatternMode && !testMode) {
      toast('Please select an Exam Pattern first', 'error');
      return;
    }
    if (!isPatternMode && !value) {
      toast('Please select a Subject first', 'error');
      return;
    }

    let progressInterval;
    try {
      setLoading(true);
      setGenProgress(0);
      
      // Simulated progress for better UX
      progressInterval = setInterval(() => {
        setGenProgress(prev => {
          if (prev >= 95) return 95;
          const increment = prev < 60 ? 2 : 1;
          return prev + increment;
        });
      }, 500);

      const payload = {
        noSave: true,
        difficulty: 'MEDIUM',
        sections: sections,
        mode: testMode,
        subject: value === 'MANUAL' ? customSubject : value,
        count: questionsNeeded
      };

      const res = await api.post('/admin/mcq/generate', payload);

      if (res.data?.data?.questions) {
        setQuestions(res.data.data.questions);
        setGenProgress(100);
        setTimeout(() => toast('✨ Questions generated and auto-filled!', 'success'), 500);
      } else {
        toast('AI returned empty questions. Try again.', 'error');
      }
    } catch (err) {
      toast('AI Generation failed. Check server.', 'error');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setLoading(false);
        setGenProgress(0);
      }, 800);
    }
  };

  const saveAppConfig = async () => {
    try {
      setSavingConfig(true);
      const res = await api.put('/admin/config', appConfig);
      if (res.data?.success) toast('Platform settings updated!', 'success');
    } catch (e) {
      toast('Failed to save settings', 'error');
    } finally {
      setSavingConfig(false);
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
    
    const now = new Date();
    if (startObj < now && !editingSetId) {
      toast('Warning: This start time has already passed!', 'error');
    }

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
        endTime: endObj,
        isPrizeTest,
        entryFee: parseInt(entryFee || '0'),
        prizeDistribution: prizeDistribution.map(val => parseInt(val || '0'))
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
    if (!id) {
      toast('Invalid Mission ID', 'error');
      return;
    }

    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to permanently delete this mission? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/admin/mcq/${id}`);
              
              toast('Mission deleted successfully', 'success');
              fetchData();
            } catch (err) {
              toast(err.response?.data?.message || 'Failed to delete mission', 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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
    
    // Set Start Time from mission data
    if (set.startTime) {
      const d = new Date(set.startTime);
      let h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, '0');
      const p = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      setStartTime(`${h.toString().padStart(2, '0')}:${m}`);
      setStartPeriod(p);
    }

    setIsPrizeTest(set.isPrizeTest || false);
    setEntryFee(String(set.entryFee || '0'));
    setPrizeDistribution(set.prizeDistribution?.length > 0 
      ? set.prizeDistribution.map(String) 
      : ['500']);
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
            const nowTime = getInitialTime(5);
            setEditingSetId(null);
            setTestMode(null);
            setIsPrizeTest(false);
            setEntryFee('0');
            setPrizeDistribution(['500']);
            setStartTime(nowTime.time);
            setStartPeriod(nowTime.period);
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
        <TouchableOpacity style={[s.tab, activeTab === 'settings' && s.activeTab]} onPress={() => setActiveTab('settings')}>
          <Settings color={activeTab === 'settings' ? theme.colors.primary : theme.colors.textMuted} size={18} />
          <Text style={[s.tabText, activeTab === 'settings' && s.activeTabText]}>Settings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'settings' && (
          <View style={s.settingsContainer}>
            <View style={s.settingsCard}>
              <Text style={s.settingsTitle}>Manual Update Management</Text>
              <Text style={s.settingsDesc}>Since you aren't using Google Play, update these values to notify students of new APK versions.</Text>
              
              <Text style={s.inputLabel}>Latest App Version</Text>
              <TextInput 
                style={s.input} 
                value={appConfig.latestVersion} 
                onChangeText={t => setAppConfig({...appConfig, latestVersion: t})} 
                placeholder="e.g. 1.0.1" 
              />

              <Text style={[s.inputLabel, {marginTop: 15}]}>Download URL (Direct APK Link)</Text>
              <TextInput 
                style={s.input} 
                value={appConfig.downloadUrl} 
                onChangeText={t => setAppConfig({...appConfig, downloadUrl: t})} 
                placeholder="https://medx.com/medx-prep.apk" 
              />

              <Text style={[s.inputLabel, {marginTop: 15}]}>Update Notification Message</Text>
              <TextInput 
                style={[s.input, {height: 80}]} 
                value={appConfig.updateMessage} 
                onChangeText={t => setAppConfig({...appConfig, updateMessage: t})} 
                placeholder="e.g. New Biology section added! Update now."
                multiline 
              />

              <TouchableOpacity style={[s.submitBtn, {marginTop: 25}]} onPress={saveAppConfig} disabled={savingConfig}>
                {savingConfig ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Save Platform Config</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab !== 'settings' && (
          loading ? (
            <ActivityIndicator style={{marginTop: 50}} color={theme.colors.primary} />
          ) : getSetList().length === 0 ? (
            <View style={s.emptyState}>
              <HelpCircle color={theme.colors.textMuted} size={48} />
              <Text style={s.emptyText}>No {activeTab} missions found</Text>
            </View>
          ) : (
            getSetList().map((set) => (
              <View key={set._id} style={s.card}>
                <View style={s.cardHeader}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <View style={s.subjectBadge}>
                      <Text style={s.subjectText}>{set.subject}</Text>
                    </View>
                    {set.isPrizeTest && (
                      <View style={[s.subjectBadge, { backgroundColor: '#f59e0b20', borderColor: '#f59e0b40', borderWidth: 1, flexDirection: 'row', gap: 4 }]}>
                        <Trophy color="#f59e0b" size={10} />
                        <Text style={[s.subjectText, { color: '#f59e0b' }]}>₹{set.entryFee}</Text>
                      </View>
                    )}
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
                    <>
                      <TouchableOpacity 
                        style={[s.actionBtn, s.viewBtn]}
                        onPress={() => { setSelectedPastSet(set); setShowDetails(true); }}
                      >
                        <Eye color="#fff" size={18} />
                        <Text style={s.viewBtnText}>View Stats</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={s.deleteBtn} 
                        onPress={() => handleDelete(set._id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 color={theme.colors.error} size={18} />
                      </TouchableOpacity>
                    </>
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
          )
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
                <View style={s.classificationCard}>
                  <View style={s.sectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <BookOpen color={theme.colors.primary} size={20} />
                      <Text style={s.classificationTitle}>Mission Classification</Text>
                    </View>
                  </View>

                  {/* Creation Mode Toggle */}
                  <View style={s.modeSelector}>
                    <TouchableOpacity 
                      style={[s.modeOption, creationMode === 'pattern' && s.modeOptionActive]}
                      onPress={() => {
                        setCreationMode('pattern');
                        setValue(null);
                      }}
                    >
                      <Text style={[s.modeOptionText, creationMode === 'pattern' && s.modeOptionTextActive]}>NEET Pattern</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[s.modeOption, creationMode === 'subject' && s.modeOptionActive]}
                      onPress={() => {
                        setCreationMode('subject');
                        setTestMode(null);
                      }}
                    >
                      <Text style={[s.modeOptionText, creationMode === 'subject' && s.modeOptionTextActive]}>Subject Test</Text>
                    </TouchableOpacity>
                  </View>

                  {creationMode === 'pattern' ? (
                    <>
                      <Text style={s.subLabel}>Exam Pattern (Standard NEET)</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                          {testModes.map((mode) => (
                            <TouchableOpacity
                              key={mode._id}
                              onPress={() => applyTestMode(mode)}
                              style={[s.chip, testMode === mode._id && s.chipSelected]}
                            >
                              <Text style={[s.chipText, testMode === mode._id && s.chipTextSelected]}>{mode.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>

                      {testMode && (
                        <View style={s.patternInfo}>
                          <Sparkles color={theme.colors.primary} size={14} />
                          <Text style={s.patternText}>
                            Pattern: {testModes.find(m => m._id === testMode)?.label || 'Dynamic Pattern'} ({questionsNeeded} Qs)
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={s.subLabel}>Subject Hub</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                          {items.map((item) => (
                            <TouchableOpacity
                              key={item.value}
                              onPress={() => {
                                setValue(item.value);
                                if (item.value !== 'MANUAL') setTestMode(null);
                              }}
                              style={[s.chip, value === item.value && s.chipSelected]}
                            >
                              <Text style={[s.chipText, value === item.value && s.chipTextSelected]}>{item.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>

                      {value === 'MANUAL' && (
                        <TextInput
                          style={s.input}
                          placeholder="Enter Custom Subject Name..."
                          value={customSubject}
                          onChangeText={setCustomSubject}
                        />
                      )}
                    </>
                  )}
                </View>

                {creationMode === 'subject' && (
                  <>
                    <Text style={s.subLabel}>Sections & Distribution</Text>
                    <View style={s.sectionsContainer}>
                      {sections.map((sec, idx) => (
                        <View key={idx} style={s.sectionRow}>
                          <TextInput
                            style={[s.input, { flex: 2 }]}
                            value={sec.name}
                            onChangeText={(t) => {
                              const newSecs = [...sections];
                              newSecs[idx].name = t;
                              setSections(newSecs);
                            }}
                            placeholder="Section Name (e.g. Physics)"
                          />
                          <TextInput
                            style={[s.input, { flex: 1, marginLeft: 8 }]}
                            value={sec.count.toString()}
                            onChangeText={(t) => {
                              const newSecs = [...sections];
                              const val = parseInt(t) || 0;
                              newSecs[idx].count = val;
                              setSections(newSecs);
                              const total = newSecs.reduce((acc, s) => acc + s.count, 0);
                              setQuestionsNeeded(total);
                            }}
                            keyboardType="numeric"
                            placeholder="Count"
                          />
                          <TouchableOpacity 
                            style={s.removeSecBtn} 
                            onPress={() => {
                              const newSecs = sections.filter((_, i) => i !== idx);
                              setSections(newSecs);
                              const total = newSecs.reduce((acc, s) => acc + s.count, 0);
                              setQuestionsNeeded(total);
                            }}
                          >
                            <Trash2 color={theme.colors.error} size={18} />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity 
                        style={s.addSecBtn} 
                        onPress={() => setSections([...sections, { name: 'New Section', count: 5 }])}
                      >
                        <Plus color={theme.colors.primary} size={16} />
                        <Text style={s.addSecText}>Add Section</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                <Text style={s.subLabel}>Prize Mission</Text>
                <View style={s.prizeToggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.inputLabel}>Is this a prize mission?</Text>
                    <Text style={s.helperText}>Users will need to pay an entry fee.</Text>
                  </View>
                  <Switch 
                    value={isPrizeTest} 
                    onValueChange={setIsPrizeTest}
                    trackColor={{ false: '#767577', true: theme.colors.primary }}
                  />
                </View>

                {isPrizeTest && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={s.inputLabel}>Entry Fee (₹)</Text>
                    <TextInput 
                      style={s.input} 
                      value={entryFee} 
                      onChangeText={setEntryFee} 
                      keyboardType="numeric"
                      placeholder="e.g. 10"
                    />

                    <Text style={[s.inputLabel, { marginTop: 16 }]}>Prize Distribution (by Rank)</Text>
                    {prizeDistribution.map((amt, idx) => (
                      <View key={idx} style={s.rankInputRow}>
                        <View style={s.rankLabelBox}><Text style={s.rankLabelText}>{idx + 1}</Text></View>
                        <TextInput 
                          style={[s.input, { flex: 1 }]} 
                          value={amt} 
                          onChangeText={(v) => {
                            const newDist = [...prizeDistribution];
                            newDist[idx] = v;
                            setPrizeDistribution(newDist);
                          }}
                          keyboardType="numeric"
                          placeholder="₹ Amount"
                        />
                        {prizeDistribution.length > 1 && (
                          <TouchableOpacity 
                            style={s.removeRankBtn} 
                            onPress={() => setPrizeDistribution(prizeDistribution.filter((_, i) => i !== idx))}
                          >
                            <Trash2 color={theme.colors.error} size={16} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    <TouchableOpacity 
                      style={s.addRankBtn} 
                      onPress={() => setPrizeDistribution([...prizeDistribution, ''])}
                    >
                      <Plus color={theme.colors.primary} size={14} />
                      <Text style={s.addRankBtnText}>Add More Ranks (Rank {prizeDistribution.length + 1})</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Text style={s.subLabel}>Mission Details</Text>
                <View style={s.configRow}>
                  <View style={{flex: 1}}>
                    <Text style={s.inputLabel}>Date (YYYY-MM-DD)</Text>
                    <TextInput style={s.input} value={testDate} onChangeText={setTestDate} placeholder="2026-04-20" />
                  </View>
                  {!testMode && (
                    <View style={{flex: 1, marginLeft: 10}}>
                      <Text style={s.inputLabel}>Duration (Mins)</Text>
                      <TextInput style={s.input} value={totalMinutes} onChangeText={setTotalMinutes} keyboardType="numeric" />
                    </View>
                  )}
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
                    <Text style={s.inputLabel}>Total Qs {testMode && '(SYNCED)'}</Text>
                    <View style={[s.readOnlyBox, testMode && {borderColor: theme.colors.primary, borderWidth: 1.5}]}>
                      <Text style={[s.readOnlyVal, testMode && {color: theme.colors.primary, fontSize: 18}]}>
                        {questionsNeeded}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={s.sectionHeader}>
                  <Text style={s.subLabel}>Questions ({questions.length})</Text>
                  {(testMode || (creationMode === 'subject' && value)) && (
                    <TouchableOpacity style={s.aiFillBtn} onPress={handleAIFill}>
                      <Sparkles color="#fff" size={14} />
                      <Text style={s.aiFillText}>Auto-Fill with AI</Text>
                    </TouchableOpacity>
                  )}
                </View>

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
          {loading && (
            <View style={s.loadingOverlay}>
              <View style={{ backgroundColor: theme.colors.surface, padding: 30, borderRadius: 24, alignItems: 'center', width: '80%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>{genProgress}%</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 10 }}>
                  Gemini is researching and formatting {questionsNeeded} questions...
                </Text>
                <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: 'bold', marginTop: 5 }}>
                  Please wait, this may take a minute.
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>

      
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, alignItems: Platform.OS === 'web' ? 'center' : 'stretch' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: spacing.lg, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.border 
  },
  content: { 
    flex: 1, 
    padding: spacing.xl,
    width: Platform.OS === 'web' ? 800 : '100%',
    maxWidth: 1000
  },
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
    readOnlyVal: { color: theme.colors.textMuted, fontWeight: 'bold' },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
    chipSelected: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}20` },
    chipText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
    chipTextSelected: { color: theme.colors.primary, fontWeight: 'bold' },
    prizeToggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
    helperText: { color: theme.colors.textMuted, fontSize: 10, marginTop: 2 },
    rankInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
    rankLabelBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
    rankLabelText: { color: theme.colors.primary, fontSize: 12, fontWeight: 'bold' },
    removeRankBtn: { padding: 8 },
    addRankBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 8 },
    addRankBtnText: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
    patternInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(99, 91, 255, 0.08)', padding: 10, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(99, 91, 255, 0.2)' },
    patternText: { color: theme.colors.primary, fontSize: 12, fontWeight: '800' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
    aiFillBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#635BFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    aiFillText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    sectionsContainer: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 16, marginBottom: 12 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    removeSecBtn: { marginLeft: 8, padding: 8 },
    addSecBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, alignSelf: 'flex-start' },
    addSecText: { color: theme.colors.primary, fontSize: 12, fontWeight: 'bold' },
    classificationCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    classificationTitle: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
    modeSelector: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modeOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    modeOptionActive: { backgroundColor: theme.colors.primary },
    modeOptionText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
    modeOptionTextActive: { color: '#000' }
});

export default AdminMCQReview;
