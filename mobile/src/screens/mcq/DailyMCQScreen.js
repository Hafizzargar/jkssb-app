import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, AppState, ScrollView } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import api from '../../utils/api';
import { spacing, borderRadius } from '../../theme';
import { CheckCircle2, Circle, Clock, AlertTriangle, ChevronRight, HelpCircle } from 'lucide-react-native';
import { useSelector } from 'react-redux';

const DailyMCQScreen = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [testId, setTestId] = useState(null);
  const [mcqs, setMcqs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timePerQ, setTimePerQ] = useState(15);
  const [testTimeLeft, setTestTimeLeft] = useState(300);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isTooEarly, setIsTooEarly] = useState(false);
  const [isTooLate, setIsTooLate] = useState(false);
  const [allAnswers, setAllAnswers] = useState([]);

  const qTimerRef = useRef(null);
  const testTimerRef = useRef(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    checkTimingAndFetch();
    
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        if (!isFinished && mcqs.length > 0) {
          Alert.alert('Test Interrupted', 'You exited the app. Test auto-submitted.');
          handleFinishTest(allAnswers);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      stopAllTimers();
    };
  }, [mcqs, isFinished]);

  useEffect(() => {
    if (mcqs.length > 0 && !isFinished && !loading) {
      startQuestionTimer();
      if (!testTimerRef.current) startTestTimer();
    }
  }, [currentIndex, mcqs, isFinished, loading]);

  const stopAllTimers = () => {
    if (qTimerRef.current) clearInterval(qTimerRef.current);
    if (testTimerRef.current) clearInterval(testTimerRef.current);
  };

  const startQuestionTimer = () => {
    if (qTimerRef.current) clearInterval(qTimerRef.current);
    setTimeLeft(timePerQ);
    qTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(qTimerRef.current);
          handleNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startTestTimer = () => {
    testTimerRef.current = setInterval(() => {
      setTestTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(testTimerRef.current);
          handleFinishTest(allAnswers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const checkTimingAndFetch = async () => {
    try {
      const res = await api.get('/api/mcq/daily');
      const data = res.data;
      if (data.isTooEarly) return setIsTooEarly(true);
      if (data.isTooLate) return setIsTooLate(true);
      
      if (!data.questions || data.questions.length === 0) {
        Alert.alert('Not Ready', 'Questions are being prepared.');
        return navigation.goBack();
      }

      setTestId(data._id);
      setMcqs(data.questions);
      const qTime = data.timePerQuestion || 15;
      const endTime = new Date(data.endTime);
      const now = new Date();
      const remainingSeconds = Math.floor((endTime - now) / 1000);
      
      setTimePerQ(qTime);
      setTestTimeLeft(remainingSeconds > 0 ? remainingSeconds : 0);
      setTimeLeft(qTime);
    } catch (error) {
      console.log('MCQ Fetch Error:', error);
      Alert.alert('Error', 'Could not fetch mission.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const currentAnswer = selectedAnswer || 'NONE';
    const updatedAnswers = [...allAnswers, { 
      q: mcqs[currentIndex].question, 
      ans: currentAnswer,
      mcqSetId: testId
    }];
    setAllAnswers(updatedAnswers);

    if (currentIndex + 1 < mcqs.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      handleFinishTest(updatedAnswers);
    }
  };

  const handleFinishTest = async (finalAnswers) => {
    setIsFinished(true);
    stopAllTimers();
    try {
      await api.post('/api/mcq/submit', { answers: finalAnswers });
    } catch (error) {
      console.log('Submission failed:', error);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const s = styles(theme);

  if (loading) return (
    <SafeAreaView style={s.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />
    </SafeAreaView>
  );

  if (isTooEarly) return (
    <SafeAreaView style={s.container}>
      <View style={s.emptyState}>
        <Clock color={theme.colors.primary} size={48} />
        <Text style={s.emptyTitle}>Access Denied</Text>
        <Text style={s.emptySub}>The daily mission is not yet open.</Text>
      </View>
    </SafeAreaView>
  );

  if (isTooLate) return (
    <SafeAreaView style={s.container}>
      <View style={s.emptyState}>
        <AlertTriangle color={theme.colors.error} size={48} />
        <Text style={s.emptyTitle}>Window Closed</Text>
        <Text style={s.emptySub}>Mission has already ended.</Text>
      </View>
    </SafeAreaView>
  );

  if (isFinished) return (
    <SafeAreaView style={s.container}>
      <View style={s.emptyState}>
        <CheckCircle2 color={theme.colors.success} size={64} />
        <Text style={s.emptyTitle}>Mission Complete!</Text>
        <Text style={s.emptySub}>Results will unlock in 5 minutes.</Text>
        <TouchableOpacity style={s.homeBtn} onPress={() => navigation.goBack()}>
          <Text style={s.homeBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const currentQ = mcqs[currentIndex];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.progressBarBg}>
        <View style={[s.progressBarFill, { width: `${((currentIndex + 1) / mcqs.length) * 100}%` }]} />
      </View>

      <View style={s.header}>
        <View>
          <Text style={s.qProgress}>Question {currentIndex + 1} / {mcqs.length}</Text>
          <Text style={s.totalTimerText}>Mission Ends: {formatTime(testTimeLeft)}</Text>
        </View>
        <View style={[s.timerCircle, timeLeft < 5 && s.timerWarning]}>
          <Text style={[s.timerText, timeLeft < 5 && s.white]}>{timeLeft}s</Text>
        </View>
      </View>

      <ScrollView style={s.cardWrapper}>
        <View style={s.card}>
          <Text style={s.question}>{currentQ?.question}</Text>
          <View style={s.options}>
            {currentQ?.options?.map((opt, i) => {
              const isSelected = selectedAnswer === opt;
              return (
                <TouchableOpacity 
                  key={i} 
                  style={[s.option, isSelected && s.selectedOption]}
                  onPress={() => setSelectedAnswer(opt)}
                >
                  <View style={[s.optCircle, isSelected && s.optCircleActive]}>
                    <Text style={[s.optLetter, isSelected && s.optLetterActive]}>{String.fromCharCode(65 + i)}</Text>
                  </View>
                  <Text style={[s.optText, isSelected && s.selectedOptText]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
          <Text style={s.nextBtnText}>{currentIndex === mcqs.length - 1 ? 'Finish Mission' : 'Next Question'}</Text>
          <ChevronRight color="#000" size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  progressBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)' },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, marginTop: 10 },
  qProgress: { color: theme.colors.text, fontSize: 20, fontWeight: 'bold' },
  totalTimerText: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4, fontWeight: '600' },
  timerCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: `${theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.primary },
  timerWarning: { backgroundColor: theme.colors.error, borderColor: theme.colors.error },
  timerText: { color: theme.colors.primary, fontSize: 18, fontWeight: 'bold' },
  white: { color: '#fff' },
  cardWrapper: { flex: 1, paddingHorizontal: spacing.lg },
  card: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.border },
  question: { color: theme.colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 28, lineHeight: 30 },
  options: { gap: 14 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, gap: 14 },
  selectedOption: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` },
  optCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${theme.colors.textMuted}15`, alignItems: 'center', justifyContent: 'center' },
  optCircleActive: { backgroundColor: theme.colors.primary },
  optLetter: { color: theme.colors.textMuted, fontSize: 14, fontWeight: 'bold' },
  optLetterActive: { color: '#000' },
  optText: { color: theme.colors.text, fontSize: 16, flex: 1 },
  selectedOptText: { fontWeight: 'bold', color: theme.colors.text },
  footer: { padding: spacing.lg },
  nextBtn: { backgroundColor: theme.colors.primary, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  nextBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyTitle: { color: theme.colors.text, fontSize: 28, fontWeight: 'bold', marginTop: 24, marginBottom: 12 },
  emptySub: { color: theme.colors.textMuted, textAlign: 'center', fontSize: 16, lineHeight: 26 },
  homeBtn: { marginTop: 40, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  homeBtnText: { color: theme.colors.text, fontWeight: 'bold' }
});

export default DailyMCQScreen;
