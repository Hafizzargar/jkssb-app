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
  const [results, setResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const qTimerRef = useRef(null);
  const testTimerRef = useRef(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (isFinished) {
      fetchResults();
    }
  }, [isFinished]);

  const fetchResults = async () => {
    setResultsLoading(true);
    try {
      const res = await api.get('/api/mcq/results');
      setResults(res.data);
    } catch (error) {
      console.log('Error fetching results:', error);
    } finally {
      setResultsLoading(false);
    }
  };

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
  }, [isFinished]); // Removed mcqs to prevent infinite loop

  // Effect to automatically start the mission if we are on the "Too Early" dashboard
  useEffect(() => {
    if (!isTooEarly || !mcqs[0]?.startTime) return;

    const start = new Date(mcqs[0].startTime);
    const checkTimer = setInterval(() => {
      const now = new Date();
      if (now >= start) {
        clearInterval(checkTimer);
        setIsTooEarly(false);
        setLoading(true);
        checkTimingAndFetch(); // Final check to launch
      }
    }, 1000);

    return () => clearInterval(checkTimer);
  }, [isTooEarly, mcqs]);

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
      setHistory(data.history || []);
      
      // 1. If already attempted, skip straight to results review! (Priority #1)
      if (data.isAttempted) {
        setIsFinished(true);
        setLoading(false);
        return;
      }

      // 2. If not attempted, check timing
      if (data.isTooEarly) {
        setTestId(data._id);
        // Map the correct fields for the dashboard display
        setMcqs([ { 
          question: data.subject, 
          startTime: data.opensAt || data.startTime 
        } ]); 
        return setIsTooEarly(true);
      }
      
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
    if (!selectedAnswer) return;

    const currentAnswer = selectedAnswer;
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
    setIsSubmitting(true);
    stopAllTimers();
    try {
      await api.post('/api/mcq/submit', { answers: finalAnswers });
      setIsFinished(true);
    } catch (error) {
      console.log('Submission failed:', error);
      const msg = error.response?.data?.message || 'We could not save your results. Please try again.';
      if (error.response?.status === 400 && error.response?.data?.alreadySubmitted) {
        Alert.alert('Mission Already Completed', 'You have already submitted this mission.');
        setIsFinished(true);
      } else {
        Alert.alert('Submission Error', msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const s = styles(theme);

  if (loading || isSubmitting) return (
    <SafeAreaView style={s.container}>
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[s.emptySub, { marginTop: 20 }]}>
          {isSubmitting ? 'Securing your results...' : 'Preparing mission...'}
        </Text>
      </View>
    </SafeAreaView>
  );

  if (isTooEarly || isTooLate) return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={[s.upcomingHero, isTooLate && { borderColor: theme.colors.error, backgroundColor: `${theme.colors.error}10` }]}>
          {isTooLate ? (
            <AlertTriangle color={theme.colors.error} size={32} />
          ) : (
            <Clock color={theme.colors.primary} size={32} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={[s.upcomingLabel, isTooLate && { color: theme.colors.error }]}>
              {isTooLate ? 'MISSION CLOSED' : 'UPCOMING MISSION'}
            </Text>
            <Text style={s.upcomingSubject}>{mcqs[0]?.question || 'Daily Challenge'}</Text>
            <Text style={s.upcomingTime}>
              {isTooLate ? 'The window for this mission has ended.' : `Starts at ${mcqs[0]?.startTime ? new Date(mcqs[0].startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}`}
            </Text>
          </View>
        </View>

        <Text style={s.historyTitle}>Personal Records</Text>
        
        {history.length === 0 ? (
          <View style={s.emptyHistory}>
            <HelpCircle color={theme.colors.textMuted} size={40} />
            <Text style={s.emptyHistoryText}>Complete your first mission to see your records here!</Text>
          </View>
        ) : (
          history.map((item, idx) => (
            <View key={idx} style={s.historyCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.historySubject}>{item.subjectCode}</Text>
                <Text style={s.historyDate}>{new Date(item.attemptedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              </View>
              <View style={s.historyStatsRow}>
                <View style={s.historyStatItem}>
                  <Text style={s.historyScoreLabel}>SCORE</Text>
                  <Text style={s.historyScoreValue}>{item.score}</Text>
                </View>
                <View style={[s.historyStatItem, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.05)', paddingLeft: 12 }]}>
                  <Text style={s.historyScoreLabel}>RANK</Text>
                  <Text style={[s.historyScoreValue, { color: theme.colors.text }]}>#{item.rank || '--'}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );

  if (isFinished) return (
    <SafeAreaView style={s.container}>
      {resultsLoading || !results?.dailyMCQ ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[s.emptySub, { marginTop: 20 }]}>Analyzing performance...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.resultScroll}>
          <View style={s.resultHeader}>
            <CheckCircle2 color={theme.colors.success} size={64} />
            <Text style={s.resultTitle}>Mission Complete!</Text>
            
            <View style={s.scoreCard}>
              <Text style={s.scoreLabel}>Your Final Score</Text>
              <Text style={s.scoreValue}>{results?.score || 0}</Text>
            </View>
          </View>

          <View style={s.reviewSection}>
            <Text style={s.reviewTitle}>Question Review</Text>
            {results?.answers?.map((ans, i) => {
              const mcq = results?.dailyMCQ?.questions?.find(q => q._id === ans.questionId);
              if (!mcq) return null;
              return (
                <View key={i} style={s.reviewCard}>
                  <View style={s.reviewHeader}>
                    <Text style={s.reviewQNum}>Q{i + 1}</Text>
                    {ans.isCorrect ? (
                      <View style={[s.statusMini, s.bgSuccess]}>
                        <CheckCircle2 size={12} color="#fff" />
                        <Text style={s.statusTextMini}>CORRECT</Text>
                      </View>
                    ) : (
                      <View style={[s.statusMini, s.bgError]}>
                        <AlertTriangle size={12} color="#fff" />
                        <Text style={s.statusTextMini}>WRONG</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.reviewQuestion}>{mcq?.question || 'Question text unavailable'}</Text>
                  
                  <View style={s.reviewOptions}>
                    <View style={s.reviewOptionRow}>
                      <Text style={s.reviewLabel}>Your Answer:</Text>
                      <Text style={[s.reviewValue, !ans.isCorrect && s.textError]}>
                        {mcq?.options[ans.selectedOption.charCodeAt(0) - 65] || ans.selectedOption}
                      </Text>
                    </View>
                    {!ans.isCorrect && mcq && (
                      <View style={s.reviewOptionRow}>
                        <Text style={s.reviewLabel}>Correct Answer:</Text>
                        <Text style={[s.reviewValue, s.textSuccess]}>
                          {mcq.options[mcq.correct.charCodeAt(0) - 65]}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={s.homeBtnFull} onPress={() => navigation.goBack()}>
            <Text style={s.homeBtnTextFull}>Back to Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
        {!selectedAnswer && (
          <View style={s.hintBox}>
            <HelpCircle color={theme.colors.textMuted} size={14} />
            <Text style={s.hintText}>Select an option to continue</Text>
          </View>
        )}
        <TouchableOpacity 
          style={[s.nextBtn, !selectedAnswer && s.btnDisabled]} 
          onPress={handleNext}
          disabled={!selectedAnswer}
        >
          <Text style={[s.nextBtnText, !selectedAnswer && s.textMuted]}>
            {currentIndex === mcqs.length - 1 ? 'Finish Mission' : 'Next Question'}
          </Text>
          <ChevronRight color={selectedAnswer ? "#000" : theme.colors.textMuted} size={20} />
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
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
  btnDisabled: { backgroundColor: theme.colors.border, opacity: 0.6 },
  hintBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 },
  hintText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  resultScroll: { padding: spacing.lg, paddingBottom: 40 },
  resultHeader: { alignItems: 'center', marginBottom: 32 },
  resultTitle: { color: theme.colors.text, fontSize: 28, fontWeight: 'bold', marginTop: 16, marginBottom: 24 },
  scoreCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: theme.colors.border },
  scoreLabel: { color: theme.colors.textMuted, fontSize: 14, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  scoreValue: { color: theme.colors.primary, fontSize: 64, fontWeight: '900' },
  reviewSection: { marginTop: 16 },
  reviewTitle: { color: theme.colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  reviewCard: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reviewQNum: { color: theme.colors.textMuted, fontWeight: 'bold', fontSize: 14 },
  statusMini: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  bgSuccess: { backgroundColor: '#10b981' },
  bgError: { backgroundColor: '#ef4444' },
  statusTextMini: { color: '#fff', fontSize: 10, fontWeight: '900' },
  reviewQuestion: { color: theme.colors.text, fontSize: 16, fontWeight: '600', lineHeight: 24, marginBottom: 16 },
  reviewOptions: { gap: 10, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  reviewOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewLabel: { color: theme.colors.textMuted, fontSize: 12 },
  reviewValue: { color: theme.colors.text, fontSize: 14, fontWeight: 'bold' },
  textSuccess: { color: '#10b981' },
  textError: { color: '#ef4444' },
  homeBtnFull: { backgroundColor: 'rgba(255,255,255,0.05)', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 24, borderWidth: 1, borderColor: theme.colors.border },
  homeBtnTextFull: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
  emptyTitle: { color: theme.colors.text, fontSize: 28, fontWeight: 'bold', marginTop: 24, marginBottom: 12 },
  emptySub: { color: theme.colors.textMuted, textAlign: 'center', fontSize: 16, lineHeight: 26 },
  homeBtn: { marginTop: 40, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  homeBtnText: { color: theme.colors.text, fontWeight: 'bold' },
  upcomingHero: { 
    backgroundColor: `${theme.colors.primary}15`, 
    borderRadius: 24, 
    padding: 24, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginBottom: 32
  },
  upcomingLabel: { color: theme.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  upcomingSubject: { color: theme.colors.text, fontSize: 24, fontWeight: 'bold' },
  upcomingTime: { color: theme.colors.textMuted, fontSize: 13, marginTop: 4 },
  historyTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16, marginLeft: 4 },
  historyCard: { 
    backgroundColor: theme.colors.surface, 
    borderRadius: 20, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  historySubject: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
  historyDate: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  historyStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyStatItem: { alignItems: 'center' },
  historyScoreLabel: { color: theme.colors.textMuted, fontSize: 8, fontWeight: '900', marginBottom: 2 },
  historyScoreValue: { color: theme.colors.primary, fontSize: 18, fontWeight: '900' },
  emptyHistory: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  emptyHistoryText: { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 12 }
});

export default DailyMCQScreen;
