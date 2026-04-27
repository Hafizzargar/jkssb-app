import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, TextInput, Modal, Platform } from 'react-native';
import { ChevronLeft, Plus, Trash2, Send, Sparkles, CheckCircle, HelpCircle, XCircle, Clock, Settings, BookOpen, Calendar } from 'lucide-react-native';
import api from '../../utils/api';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';
import DropDownPicker from 'react-native-dropdown-picker';
import { toast } from '../../components/Toast';

const AdminMCQReview = ({ navigation }) => {
  const theme = useTheme();
  const [pendingSets, setPendingSets] = useState([]);
  const [activeSets, setActiveSets] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'active'
  
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
        
        // Convert to 24h for calculation
        if (startPeriod === 'PM' && h < 12) h += 12;
        if (startPeriod === 'AM' && h === 12) h = 0;

        const date = new Date();
        date.setHours(h, m + mins);
        
        let endH = date.getHours();
        let endM = date.getMinutes().toString().padStart(2, '0');
        
        // Convert back to 12h for UI
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
      // If the entire list is empty, we can safely sync its size with questionsNeeded
      const isListEffectivelyEmpty = questions.every(q => !q.question || q.question.trim() === '');
      
      if (isListEffectivelyEmpty || questions.length === 0) {
        const emptyQs = Array(questionsNeeded).fill(0).map(() => ({
          question: '',
          options: ['', '', '', ''],
          correct: 'A',
          explanation: ''
        }));
        setQuestions(emptyQs);
      } else if (questions.length < questionsNeeded) {
        // Grow the list
        const diff = questionsNeeded - questions.length;
        const emptySlots = Array(diff).fill(0).map(() => ({
          question: '',
          options: ['', '', '', ''],
          correct: 'A',
          explanation: ''
        }));
        setQuestions(prev => [...prev, ...emptySlots]);
      } else if (questions.length > questionsNeeded) {
        // Shrink the list, but only remove EMPTY questions from the end
        const newQuestions = [...questions];
        while (newQuestions.length > questionsNeeded && 
               !newQuestions[newQuestions.length - 1].question.trim()) {
          newQuestions.pop();
        }
        setQuestions(newQuestions);
      }
    }
  }, [questionsNeeded]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingRes, activeRes, subRes] = await Promise.all([
        api.get('/api/admin/mcq/pending'),
        api.get('/api/admin/mcq/active'),
        api.get('/api/admin/subject')
      ]);
      
      setPendingSets(pendingRes.data || []);
      setActiveSets(activeRes.data || []);
      setSubjects(subRes.data.filter(s => s.isActive));
      
      const dropdownItems = subRes.data.filter(s => s.isActive).map(s => ({
        label: `${s.name} (${s.code})`,
        value: s.code
      }));
      
      dropdownItems.push({ label: '+ MANUAL ENTRY', value: 'MANUAL' });
      setItems(dropdownItems);
      
      if (dropdownItems.length > 0) setValue(dropdownItems[0].value);
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!testDate || !startTime || !endTime) {
      toast('Please fill in Date, Start Time, and End Time', 'error');
      return;
    }

    const subjectToUse = value === 'MANUAL' ? customSubject : value;
    if (!subjectToUse) {
      toast('Please select or enter a subject', 'error');
      return;
    }
    
    if (questions.length < questionsNeeded) {
      toast(`Complete all ${questionsNeeded} questions first.`, 'error');
      return;
    }

    // Smart Parsing: Auto-fix common typing issues
    const normalizeDate = (d) => {
      const parts = d.trim().replace(/\//g, '-').split('-');
      if (parts.length !== 3) return d;
      return [parts[0], parts[1].padStart(2, '0'), parts[2].padStart(2, '0')].join('-');
    };

    const normalizeTime = (t, period) => {
      const parts = t.trim().split(':');
      if (parts.length !== 2) return t;
      let h = parseInt(parts[0]);
      let m = parts[1].padStart(2, '0');
      
      if (period === 'PM' && h < 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      
      return [h.toString().padStart(2, '0'), m].join(':');
    };

    const cleanDate = normalizeDate(testDate);
    const cleanStart = normalizeTime(startTime, startPeriod);
    const cleanEnd = normalizeTime(endTime, endPeriod);

    const startObj = new Date(`${cleanDate}T${cleanStart}:00`);
    const endObj = new Date(`${cleanDate}T${cleanEnd}:00`);
    const now = new Date();

    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
      toast('Invalid Date or Time. Use YYYY-MM-DD (e.g. 2026-04-27) and HH:mm (e.g. 14:30)', 'error');
      return;
    }

    if (startObj < now) {
      toast('Mission start time cannot be in the past.', 'error');
      return;
    }

    if (endObj <= startObj) {
      toast('End time must be after Start time', 'error');
      return;
    }

    // Deep Validation for Questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || q.question.trim().length < 5) {
        toast(`Question ${i+1} is too short or empty`, 'error');
        return;
      }
      if (q.options.some(opt => !opt || opt.trim() === '')) {
        toast(`All options for Q${i+1} must be filled`, 'error');
        return;
      }
      if (!q.correct) {
        toast(`Please select a correct answer for Q${i+1}`, 'error');
        return;
      }
    }

    try {
      setLoading(true);
      const res = await api.post('/api/admin/mcq/manual', {
        id: editingSetId,
        subject: subjectToUse,
        questions,
        date: testDate, // Send explicit date string to prevent TZ shift
        testDuration: parseInt(totalMinutes),
        timePerQuestion: parseInt(secondsPerQ),
        startTime: startObj,
        endTime: endObj
      });
      
      // SUCCESS! Even if the following UI cleanup has a tiny glitch, 
      // we show the success toast because the mission IS SAVED.
      toast('Mission updated successfully!', 'success');
      
      try {
        setShowManual(false);
        setEditingSetId(null);
        resetManual();
        setTimeout(fetchData, 500);
      } catch (uiErr) {
        console.error('UI Cleanup Error (Mission still saved):', uiErr);
      }
    } catch (error) {
      console.error('Manual Submit Error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to schedule.';
      toast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    console.log('🔘 DELETE CLICKED:', id);
    if (!id) return;
    try {
      setLoading(true);
      await api.delete(`/api/admin/mcq/${id}`);
      fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMission = (set) => {
    console.log('🔘 EDIT CLICKED:', set._id, set.subject);
    setEditingSetId(set._id);
    setQuestions([...set.questions]);
    
    // Select the subject
    const item = items.find(i => i.value === set.subject || i.label === set.subject);
    if (item) setValue(item.value);
    else { setValue('MANUAL'); setCustomSubject(set.subject); }

    // Populate scheduling
    if (set.date) setTestDate(set.date);
    if (set.testDuration) setTotalMinutes(set.testDuration.toString());
    if (set.timePerQuestion) setSecondsPerQ(set.timePerQuestion.toString());
    
    if (set.startTime) {
      const start = new Date(set.startTime);
      setStartTime(`${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`);
    }

    setShowManual(true);
  };

  const handleAIAutoFill = async () => {
    console.log('✨ AI Fill Clicked. Value:', value, 'Custom:', customSubject);
    const subjectCode = value === 'MANUAL' ? customSubject : value;
    const selectedSubjectObj = subjects.find(s => s.code === subjectCode);
    const subjectToUse = selectedSubjectObj ? selectedSubjectObj.name : subjectCode;
    
    if (!subjectToUse) {
      console.log('⚠️ AI Fill blocked: No subject selected');
      return Alert.alert('Error', 'Choose a subject first');
    }
    
    console.log(`📡 Calling AI Generate for ${subjectToUse} (${questionsNeeded} Qs)`);
    
    try {
      setLoading(true);
      const res = await api.post('/api/admin/mcq/generate', {
        subject: subjectToUse,
        count: questionsNeeded,
        noSave: true
      }, { timeout: 60000 });
      console.log('✅ AI Response received');
      
      if (res.data.data && res.data.data.questions) {
        const aiQuestions = res.data.data.questions.map(q => {
          let correctText = q.correct;
          // If Gemini returns A, B, C, D, map it to the actual text
          if (q.correct.length === 1 && ['A','B','C','D'].includes(q.correct)) {
            const idx = q.correct.charCodeAt(0) - 65;
            correctText = q.options[idx];
          }
          return {
            question: q.question,
            options: q.options,
            correct: correctText,
            explanation: q.explanation
          };
        });
        setQuestions(aiQuestions);
        toast(`Generated ${aiQuestions.length} questions!`, 'success');
      } else {
        console.log('⚠️ AI returned no questions or wrong format');
        toast('Gemini returned an empty set. Please try again.', 'error');
      }
    } catch (error) {
      console.error('AI Error:', error);
      const msg = error.response?.data?.message || 'Gemini is busy. Try again.';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetManual = () => {
    setQuestions([{ question: '', options: ['', '', '', ''], correct: '', explanation: '' }]);
    setTotalMinutes('5');
    setSecondsPerQ('15');
    setTestDate(new Date().toLocaleDateString('en-CA'));
    setStartTime('12:00');
    setCustomSubject('');
    if (items.length > 0) setValue(items[0].value);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
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

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>MCQ Control Room</Text>
          <Text style={s.headerSub}>Advanced Mode</Text>
        </View>
        <TouchableOpacity 
          style={s.plusBtn} 
          onPress={() => {
            resetManual();
            setEditingSetId(null);
            setShowManual(true);
          }}
        >
          <Plus color={theme.colors.text} size={24} />
        </TouchableOpacity>
      </View>

        <View style={s.tabBar}>
          <TouchableOpacity 
            style={[s.tab, activeTab === 'pending' && s.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[s.tabText, activeTab === 'pending' && s.activeTabText]}>Review ({pendingSets.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.tab, activeTab === 'active' && s.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[s.tabText, activeTab === 'active' && s.activeTabText]}>Live Missions ({activeSets.length})</Text>
          </TouchableOpacity>
        </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>

        {(activeTab === 'pending' ? pendingSets : activeSets).length === 0 ? (
          <View style={s.emptyState}>
            <HelpCircle color={theme.colors.textMuted} size={48} />
            <Text style={s.emptyText}>No {activeTab} missions found</Text>
            <TouchableOpacity 
                style={s.manualBtnLarge} 
                onPress={() => {
                  resetManual();
                  setEditingSetId(null);
                  setShowManual(true);
                }}
              >
                <Text style={s.manualBtnLargeText}>Schedule New Mission</Text>
              </TouchableOpacity>
          </View>
        ) : (
          (activeTab === 'pending' ? pendingSets : activeSets).map((set) => (
              <View key={set._id} style={s.card}>
                <View style={s.cardHeader}>
                  <View style={s.subjectBadge}>
                    <Text style={s.subjectText}>{set.subject}</Text>
                  </View>
                  <View style={[
                    s.liveBadge, 
                    { backgroundColor: (new Date() >= new Date(set.startTime) && new Date() <= new Date(set.endTime)) ? '#10b98120' : '#3b82f620' }
                  ]}>
                    <View style={[
                      s.dot, 
                      { backgroundColor: (new Date() >= new Date(set.startTime) && new Date() <= new Date(set.endTime)) ? '#10b981' : '#3b82f6' }
                    ]} />
                    <Text style={[
                      s.liveText,
                      { color: (new Date() >= new Date(set.startTime) && new Date() <= new Date(set.endTime)) ? '#10b981' : '#3b82f6' }
                    ]}>
                      {(new Date() >= new Date(set.startTime) && new Date() <= new Date(set.endTime)) ? 'LIVE NOW' : 'SCHEDULED'}
                    </Text>
                  </View>
                </View>
                
                <Text style={s.cardTitle}>{activeTab === 'pending' ? 'AI Draft Generated' : 'Mission Details'}</Text>
                
                <View style={s.timeRow}>
                  <Clock size={14} color={theme.colors.textMuted} />
                  <Text style={s.timeText}>
                    {new Date(set.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                    {new Date(set.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                  <Text style={s.bullet}>•</Text>
                  <Calendar size={14} color={theme.colors.textMuted} />
                  <Text style={s.timeText}>
                    {set.date ? new Date(set.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'No Date'}
                  </Text>
                </View>

                <Text style={s.cardMeta}>{set.questions.length} Questions Prepared</Text>

                <View style={s.actionsRow}>
                  {activeTab === 'pending' ? (
                    <>
                      <TouchableOpacity 
                        style={[s.actionBtn, s.approveBtn]}
                        onPress={() => handleEditMission(set)}
                      >
                        <CheckCircle color="#000" size={18} />
                        <Text style={s.actionText}>Approve & Schedule</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[s.actionBtn, s.deleteBtn]}
                        onPress={() => handleDelete(set._id)}
                      >
                        <Trash2 color={theme.colors.error} size={18} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity 
                        style={[s.actionBtn, s.approveBtn, { flex: 1.5, backgroundColor: `${theme.colors.primary}20`, borderColor: theme.colors.primary, borderWidth: 1 }]}
                        onPress={() => handleEditMission(set)}
                      >
                        <Settings color={theme.colors.primary} size={18} />
                        <Text style={[s.actionText, { color: theme.colors.primary }]}>Edit Mission</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[s.actionBtn, s.deleteBtn, { flex: 1 }]}
                        onPress={() => handleDelete(set._id)}
                      >
                        <Trash2 color={theme.colors.error} size={18} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showManual} animationType="fade" transparent>
        <View style={[s.modalOverlay, { zIndex: 10000 }]}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Mission Scheduler</Text>
              </View>
              <TouchableOpacity onPress={() => setShowManual(false)}>
                <XCircle color={theme.colors.textMuted} size={28} />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
              <View style={[s.configSection, { zIndex: 3000 }]}>
                <View style={s.sectionHeader}>
                  <BookOpen color={theme.colors.primary} size={18} />
                  <Text style={s.sectionTitle}>1. Choose Subject</Text>
                </View>
                
                <DropDownPicker
                  open={open}
                  value={value}
                  items={items}
                  setOpen={setOpen}
                  setValue={setValue}
                  setItems={setItems}
                  theme="DARK"
                  listMode="SCROLLVIEW"
                  placeholder="Select a subject"
                  style={s.dropdownStyle}
                  dropDownContainerStyle={s.dropdownListStyle}
                  textStyle={s.dropdownTextStyle}
                  zIndex={3000}
                  zIndexInverse={1000}
                />

                {value === 'MANUAL' && (
                  <TextInput 
                    style={[s.input, { marginTop: 12 }]}
                    placeholder="Enter Custom Subject Name"
                    placeholderTextColor={theme.colors.textMuted}
                    value={customSubject}
                    onChangeText={setCustomSubject}
                  />
                )}
              </View>

              {/* 2. Scheduling */}
              <View style={[s.configSection, { zIndex: 2000 }]}>
                <View style={s.sectionHeader}>
                  <Calendar color={theme.colors.primary} size={18} />
                  <Text style={s.sectionTitle}>2. Schedule Window</Text>
                </View>
                <View style={s.timingRow}>
                  <View style={{ flex: 1.5 }}>
                    <Text style={s.subLabel}>Date</Text>
                    <TextInput style={s.input} value={testDate} onChangeText={setTestDate} />
                  </View>
                  <View style={{ flex: 2 }}>
                    <Text style={s.subLabel}>Start Time</Text>
                    <View style={s.timeInputContainer}>
                      <TextInput style={[s.input, { flex: 1 }]} value={startTime} onChangeText={setStartTime} placeholder="12:00" />
                      <View style={s.periodToggle}>
                        <TouchableOpacity 
                          style={[s.periodBtn, startPeriod === 'AM' && s.periodBtnActive]} 
                          onPress={() => setStartPeriod('AM')}
                        >
                          <Text style={[s.periodBtnText, startPeriod === 'AM' && s.periodBtnTextActive]}>AM</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[s.periodBtn, startPeriod === 'PM' && s.periodBtnActive]} 
                          onPress={() => setStartPeriod('PM')}
                        >
                          <Text style={[s.periodBtnText, startPeriod === 'PM' && s.periodBtnTextActive]}>PM</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={s.timingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.subLabel}>End Time (Auto-calculated)</Text>
                    <View style={s.timeInputContainer}>
                      <TextInput 
                        style={[s.input, { flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', color: theme.colors.primary }]} 
                        value={endTime} 
                        editable={false} 
                      />
                      <View style={[s.periodBtn, s.periodBtnActive, { paddingHorizontal: 16 }]}>
                        <Text style={s.periodBtnTextActive}>{endPeriod}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* 3. Timing Rules */}
              <View style={[s.configSection, { zIndex: 1000 }]}>
                <View style={s.sectionHeader}>
                  <Settings color={theme.colors.primary} size={18} />
                  <Text style={s.sectionTitle}>3. Timing Rules</Text>
                </View>
                <View style={s.timingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.subLabel}>Test Mins</Text>
                    <TextInput style={s.input} keyboardType="numeric" value={totalMinutes} onChangeText={setTotalMinutes} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.subLabel}>Sec / Q</Text>
                    <TextInput style={s.input} keyboardType="numeric" value={secondsPerQ} onChangeText={setSecondsPerQ} />
                  </View>
                </View>
                <View style={s.calcBox}><Text style={s.calcText}>Required: {questionsNeeded} Qs</Text></View>
              </View>

              {/* 4. Questions */}
              <View style={s.configSection}>
                <View style={s.sectionHeader}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Plus color={theme.colors.primary} size={18} />
                    <Text style={s.sectionTitle}>4. Questions ({questions.length} / {questionsNeeded})</Text>
                  </View>
                  <TouchableOpacity style={s.aiFillBtn} onPress={handleAIAutoFill}>
                    <Sparkles color="#000" size={14} />
                    <Text style={s.aiFillBtnText}>AI Fill</Text>
                  </TouchableOpacity>
                </View>
                
                {questions.map((q, idx) => (
                  <View key={idx} style={s.questionBlock}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                      <Text style={s.qNum}>QUESTION {idx + 1}</Text>
                      {questions.length > 1 && <TouchableOpacity onPress={() => removeQuestion(idx)}><Trash2 color={theme.colors.error} size={16} /></TouchableOpacity>}
                    </View>
                    <TextInput style={s.input} placeholder="Question..." value={q.question} onChangeText={t => updateQuestion(idx, 'question', t)} multiline />
                    <Text style={s.subLabel}>Options</Text>
                    {q.options.map((opt, oIdx) => (
                      <View key={oIdx} style={s.optRow}>
                        <Text style={s.optLetter}>{String.fromCharCode(65 + oIdx)}</Text>
                        <TextInput style={[s.input, { flex: 1, marginBottom: 8 }]} placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} value={opt} onChangeText={t => updateOption(idx, oIdx, t)} />
                      </View>
                    ))}
                    <Text style={s.subLabel}>Correct Option</Text>
                    <View style={s.correctSelector}>
                      {['A', 'B', 'C', 'D'].map((letter) => (
                        <TouchableOpacity 
                          key={letter}
                          style={[s.correctBtn, q.correct === letter && s.correctBtnActive]}
                          onPress={() => updateQuestion(idx, 'correct', letter)}
                        >
                          <Text style={[s.correctBtnText, q.correct === letter && s.correctBtnTextActive]}>{letter}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={[s.submitBtn, questions.length < questionsNeeded && { opacity: 0.7 }]} onPress={handleManualSubmit}>
                <Send color="#000" size={20} />
                <Text style={s.submitBtnText}>Schedule Mission</Text>
              </TouchableOpacity>
              <View style={{ height: 100 }} />
            </ScrollView>

            {loading && (
              <View style={s.loadingOverlay}>
                <View style={s.loadingCard}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={s.loadingText}>Gemini AI is Working</Text>
                  <Text style={s.loadingSubText}>Researching and drafting questions for you...</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={s.loadingOverlay}>
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={s.loadingText}>Processing...</Text>
            <Text style={s.loadingSubText}>♊ Gemini is generating premium MCQs for your students...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { marginRight: 12 },
  headerTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: theme.colors.primary, fontSize: 11, fontWeight: '600' },
  plusBtn: { backgroundColor: theme.colors.primary, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: theme.colors.textMuted, marginTop: 12, marginBottom: 24 },
  manualBtnLarge: { backgroundColor: `${theme.colors.primary}20`, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.primary },
  manualBtnLargeText: { color: theme.colors.primary, fontWeight: 'bold' },
  card: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  subjectBadge: { backgroundColor: `${theme.colors.primary}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  subjectText: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold' },
  dateText: { color: theme.colors.textMuted, fontSize: 10 },
  cardTitle: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardMeta: { color: theme.colors.textMuted, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '95%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text },
  modalBody: { flex: 1 },
  configSection: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
  subLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  timingRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  input: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 14, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
  calcBox: { backgroundColor: `${theme.colors.primary}10`, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: `${theme.colors.primary}30` },
  calcText: { color: theme.colors.text, fontSize: 14, fontWeight: 'bold' },
  questionBlock: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border },
  qNum: { color: theme.colors.primary, fontWeight: '900', fontSize: 12 },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optLetter: { color: theme.colors.primary, fontWeight: 'bold', width: 20 },
  submitBtn: { backgroundColor: theme.colors.primary, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 },
  submitBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  aiFillBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiFillBtnText: { color: '#000', fontSize: 11, fontWeight: 'bold' },
  dropdownStyle: { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.colors.border, borderRadius: 12 },
  dropdownListStyle: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  dropdownTextStyle: { color: theme.colors.text },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
  activeTabText: { color: theme.colors.primary, fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  approveBtn: { backgroundColor: theme.colors.primary, flex: 1 },
  deleteBtn: { backgroundColor: `${theme.colors.error}15`, borderColor: `${theme.colors.error}30`, paddingHorizontal: 16 },
  actionText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 10, fontWeight: 'bold' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 4 },
  timeText: { color: theme.colors.textMuted, fontSize: 13 },
  bullet: { color: theme.colors.textMuted, fontSize: 14 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingCard: {
    backgroundColor: theme.colors.surface,
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: '80%'
  },
  loadingText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15
  },
  loadingSubText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8
  },
  correctSelector: { flexDirection: 'row', gap: 10, marginTop: 4 },
  correctBtn: { flex: 1, height: 44, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  correctBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  correctBtnText: { color: theme.colors.textMuted, fontWeight: 'bold' },
  correctBtnTextActive: { color: '#000' },
  timeInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  periodToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 2 },
  periodBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  periodBtnActive: { backgroundColor: theme.colors.primary },
  periodBtnText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: 'bold' },
  periodBtnTextActive: { color: '#000' }
});

export default AdminMCQReview;
