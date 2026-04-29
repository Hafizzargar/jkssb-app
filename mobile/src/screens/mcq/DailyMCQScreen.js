import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, AppState, ScrollView, Dimensions, Platform, StatusBar } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import api from '../../utils/api';
import { CheckCircle2, Clock, AlertTriangle, Trophy, Eye, Star, Lock, ArrowLeft, Zap, Target, BookOpen } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import Animated, { FadeInUp, FadeInDown, BounceIn, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import ReviewModal from '../../components/ReviewModal';

const { width, height } = Dimensions.get('window');

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
  const [waitInfo, setWaitInfo] = useState(null);
  const [allAnswers, setAllAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsUntilOpen, setSecondsUntilOpen] = useState(0);

  const qTimerRef = useRef(null);
  const testTimerRef = useRef(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (isFinished) fetchResults();
  }, [isFinished]);

  const fetchResults = async () => {
    if (results) return;
    setResultsLoading(true);
    try {
      const res = await api.get('/mcq/results');
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
        if (!isFinished && mcqs.length > 0 && !isTooEarly && !isTooLate) {
          handleFinishTest(allAnswers);
        }
      }
      appState.current = nextAppState;
    });
    return () => { 
      subscription.remove(); 
      if (qTimerRef.current) clearInterval(qTimerRef.current);
      if (testTimerRef.current) clearInterval(testTimerRef.current);
    };
  }, []);

  const startGameplay = () => {
    startTimePerQTimer();
    startOverallTestTimer();
  };

  // Auto-start timer for locked missions
  useEffect(() => {
    let interval;
    if (isTooEarly && secondsUntilOpen > 0) {
      interval = setInterval(() => {
        setSecondsUntilOpen(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsTooEarly(false); // Reset to trigger re-fetch
            checkTimingAndFetch();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTooEarly, secondsUntilOpen === 0]);

  const startTimePerQTimer = () => {
    if (qTimerRef.current) clearInterval(qTimerRef.current);
    setTimeLeft(timePerQ);
    qTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startOverallTestTimer = () => {
    if (testTimerRef.current) clearInterval(testTimerRef.current);
    testTimerRef.current = setInterval(() => {
      setTestTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinishTest(allAnswers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const checkTimingAndFetch = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mcq/daily');
      const data = res.data;
      if (data.isAttempted) { setIsFinished(true); return; }
      if (data.isTooEarly) { 
        setIsTooEarly(true); 
        setWaitInfo({ subject: data.subject, opensAt: data.opensAt }); 
        const opensAt = new Date(data.opensAt);
        const diff = Math.floor((opensAt - new Date()) / 1000);
        setSecondsUntilOpen(diff > 0 ? diff : 0);
        return; 
      }
      if (data.isTooLate) { setIsTooLate(true); return; }
      if (!data.questions || data.questions.length === 0) { Alert.alert('Notice', 'No mission available for now.'); navigation.goBack(); return; }
      setTestId(data._id);
      setMcqs(data.questions);
      const qTime = data.timePerQuestion || 15;
      const endTime = new Date(data.endTime);
      const remainingSeconds = Math.floor((endTime - new Date()) / 1000);
      // Use whichever is smaller: time left until endTime OR questions × timePerQ
      const maxByQuestions = data.questions.length * qTime;
      setTimePerQ(qTime);
      setTestTimeLeft(remainingSeconds > 0 ? Math.min(remainingSeconds, maxByQuestions) : 0);
      startGameplay();
    } catch (error) {
      console.log('MCQ Fetch Error:', error);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const currentAnswer = selectedAnswer || 'NONE';
    const updatedAnswers = [...allAnswers, { q: mcqs[currentIndex].question, ans: currentAnswer, mcqSetId: testId }];
    setAllAnswers(updatedAnswers);
    if (currentIndex + 1 < mcqs.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      startTimePerQTimer();
    } else {
      handleFinishTest(updatedAnswers);
    }
  };

  const handleFinishTest = async (finalAnswers) => {
    setIsSubmitting(true);
    if (qTimerRef.current) clearInterval(qTimerRef.current);
    if (testTimerRef.current) clearInterval(testTimerRef.current);
    try {
      const res = await api.post('/mcq/submit', { answers: finalAnswers });
      if (res.data.attempt) setResults(res.data.attempt);
      setIsFinished(true);
    } catch (error) {
      console.log('Submission failed:', error);
      setIsFinished(true);
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
        <Text style={s.loadingText}>{isSubmitting ? 'SUBMITTING MISSION...' : 'INITIALIZING MISSION...'}</Text>
      </View>
    </SafeAreaView>
  );

  if (isTooEarly) return (
    <SafeAreaView style={s.container}>
      <View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><ArrowLeft color={theme.colors.text} size={24} /></TouchableOpacity></View>
      <View style={s.centered}>
        <View style={s.lockIconBg}><Lock color={theme.colors.primary} size={48} /></View>
        <Text style={s.resultTitle}>Mission Locked</Text>
        <Text style={s.resultSub}>Strategize! This mission opens in {formatTime(secondsUntilOpen)} at {new Date(waitInfo?.opensAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        
        <View style={s.autoStartBadge}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={s.autoStartText}>AUTO-OPENING IN {secondsUntilOpen}s</Text>
        </View>

        <TouchableOpacity style={s.secondaryAction} onPress={() => navigation.goBack()}><Text style={s.secondaryActionText}>Return to Hub</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (isTooLate) return (
    <SafeAreaView style={s.container}>
      <View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><ArrowLeft color={theme.colors.text} size={24} /></TouchableOpacity></View>
      <View style={s.centered}>
        <View style={[s.lockIconBg, { borderColor: 'rgba(239, 68, 68, 0.1)' }]}><Clock color={theme.colors.error} size={48} /></View>
        <Text style={s.resultTitle}>Missed Mission</Text>
        <Text style={s.resultSub}>Sorry, you missed this mission! ⏱️{"\n"}Stay tuned for the next scheduled assessment.</Text>
        <TouchableOpacity style={s.secondaryAction} onPress={() => navigation.goBack()}><Text style={s.secondaryActionText}>Return to Hub</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (!loading && (!mcqs || mcqs.length === 0)) return (
    <SafeAreaView style={s.container}>
      <View style={s.centered}>
        <AlertTriangle color={theme.colors.primary} size={48} />
        <Text style={s.resultTitle}>No Mission Found</Text>
        <Text style={s.resultSub}>There are no active missions available for now. Keep preparing!</Text>
        <TouchableOpacity style={s.primaryAction} onPress={() => navigation.goBack()}><Text style={s.primaryActionText}>Return Home</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (isFinished) return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.resultScroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={BounceIn} style={s.trophyContainer}><View style={s.glowCircle}><Trophy color={theme.colors.primary} size={80} /></View></Animated.View>
        <Text style={s.resultTitle}>Mission Complete!</Text>
        <Text style={s.resultSub}>Your performance has been synced to the global leaderboard.</Text>
        <View style={s.scoreCard}>
          <View style={s.scoreHeader}>
            <View><Text style={s.scoreLabel}>ACCURACY</Text><Text style={s.scoreValue}>{results?.score || 0}%</Text></View>
            <View style={s.scoreBadge}><Zap color="#000" size={14} /><Text style={s.scoreBadgeText}>TOP PERFORMER</Text></View>
          </View>
          <View style={s.performanceGrid}>
            <View style={s.perfBox}><Text style={s.perfVal}>{results?.answers?.filter(a => a.isCorrect).length || 0}</Text><Text style={s.perfLab}>Correct</Text></View>
            <View style={[s.perfBox, s.perfBorder]}><Text style={[s.perfVal, { color: theme.colors.error }]}>{results?.answers?.filter(a => !a.isCorrect && a.selectedOption !== 'NONE').length || 0}</Text><Text style={s.perfLab}>Wrong</Text></View>
            <View style={s.perfBox}><Text style={s.perfVal}>{results?.dailyMCQ?.questions?.length || mcqs.length}</Text><Text style={s.perfLab}>Total Qs</Text></View>
          </View>
        </View>
        <View style={s.resultActions}>
          <TouchableOpacity style={s.primaryAction} onPress={() => setShowReviewModal(true)}><Eye color="#000" size={20} /><Text style={s.primaryActionText}>Analyze Performance</Text></TouchableOpacity>
          <TouchableOpacity style={s.secondaryAction} onPress={() => navigation.goBack()}><Text style={s.secondaryActionText}>Finish Mission</Text></TouchableOpacity>
        </View>
      </ScrollView>
      <ReviewModal visible={showReviewModal} onClose={() => setShowReviewModal(false)} results={results} theme={theme} />
    </SafeAreaView>
  );

  const currentQ = mcqs[currentIndex];
  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => Alert.alert('Quit?', 'Are you sure? Progress will be lost.', [{text: 'Stay'}, {text: 'Quit', onPress: () => navigation.goBack()}])}><ArrowLeft color={theme.colors.text} size={24} /></TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.qProgressText}>QUESTION {currentIndex + 1} OF {mcqs.length}</Text>
          <View style={s.progressBarBg}><View style={[s.progressBarFill, { width: `${((currentIndex + 1) / mcqs.length) * 100}%` }]} /></View>
        </View>
        <View style={[s.timerPill, timeLeft < 5 && s.timerPillWarning]}><Clock size={14} color={timeLeft < 5 ? '#fff' : theme.colors.primary} /><Text style={[s.timerText, timeLeft < 5 && s.white]}>{timeLeft}s</Text></View>
      </View>
      <ScrollView style={s.gameScroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600)} key={currentIndex} style={s.questionContainer}>
           <View style={s.qBadgeRow}>
             <View style={s.qBadge}><Target color={theme.colors.primary} size={16} /><Text style={s.qBadgeText}>{mcqs[0]?.subject || 'OBJECTIVE'}</Text></View>
             <View style={s.diffBadge}><Text style={s.diffText}>MEDIUM</Text></View>
           </View>
           
           <Text style={s.questionText}>{currentQ?.question}</Text>
           <View style={s.optionsContainer}>
             {currentQ?.options?.map((opt, i) => {
               const isSelected = selectedAnswer === opt;
               return (
                 <TouchableOpacity 
                   key={i} 
                   activeOpacity={0.8} 
                   style={[s.optionCard, isSelected && s.selectedOptionCard, isSelected && { transform: [{ scale: 1.01 }] }]} 
                   onPress={() => setSelectedAnswer(opt)}
                 >
                   <View style={[s.optIndicator, isSelected && s.selectedOptIndicator]}>{isSelected && <View style={s.optDot} />}</View>
                   <Text style={[s.optText, isSelected && s.selectedOptText]}>{opt}</Text>
                 </TouchableOpacity>
               );
             })}
           </View>

           {/* Question Dots Tracker */}
           <View style={s.dotsContainer}>
             {mcqs.map((_, i) => (
               <View 
                 key={i} 
                 style={[
                   s.dotItem, 
                   i === currentIndex && s.activeDot,
                   i < currentIndex && s.completedDot
                 ]} 
               />
             ))}
           </View>
        </Animated.View>
      </ScrollView>
      <View style={s.footer}>
        <View style={s.footerInfo}><Clock size={12} color={theme.colors.textMuted} /><Text style={s.testTimerText}>MISSION ENDS IN {formatTime(testTimeLeft)}</Text></View>
        <TouchableOpacity style={[s.nextBtn, !selectedAnswer && s.btnDisabled]} onPress={handleNext} disabled={!selectedAnswer}><Text style={s.nextBtnText}>{currentIndex === mcqs.length - 1 ? 'FINISH MISSION' : 'CONFIRM & NEXT'}</Text><Zap color="#000" size={18} /></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' }, // Deep space black
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  loadingText: { color: theme.colors.primary, fontWeight: '900', marginTop: 24, letterSpacing: 2, fontSize: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: 16 },
  headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: 20 },
  qProgressText: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3 },
  timerPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(99, 91, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(99, 91, 255, 0.2)' },
  timerPillWarning: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  timerText: { color: theme.colors.primary, fontWeight: '800', fontSize: 13 },
  white: { color: '#fff' },
  gameScroll: { flex: 1, paddingHorizontal: spacing.xl },
  questionContainer: { marginTop: 20 },
  qBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  qBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qBadgeText: { color: theme.colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  diffBadge: { backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  diffText: { color: '#f59e0b', fontSize: 10, fontWeight: 'bold' },
  questionText: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 34, marginBottom: 32 },
  optionsContainer: { gap: 14 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 40, flexWrap: 'wrap' },
  dotItem: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)' },
  activeDot: { width: 14, backgroundColor: theme.colors.primary },
  completedDot: { backgroundColor: 'rgba(99, 91, 255, 0.4)' },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#16161E', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  selectedOptionCard: { borderColor: theme.colors.primary, backgroundColor: 'rgba(99, 91, 255, 0.08)' },
  optIndicator: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  selectedOptIndicator: { borderColor: theme.colors.primary },
  optDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
  optText: { color: theme.colors.textMuted, fontSize: 16, fontWeight: '600', flex: 1 },
  selectedOptText: { color: '#fff', fontWeight: '700' },
  footer: { padding: spacing.xl, backgroundColor: '#0A0A0F', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)' },
  footerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 },
  testTimerText: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  nextBtn: { backgroundColor: theme.colors.primary, height: 64, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  nextBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  btnDisabled: { opacity: 0.4, shadowOpacity: 0 },
  resultScroll: { padding: spacing.xl, alignItems: 'center' },
  trophyContainer: { marginTop: 40, marginBottom: 24 },
  glowCircle: { width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(99, 91, 255, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(99, 91, 255, 0.2)' },
  resultTitle: { color: '#fff', fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  resultSub: { color: theme.colors.textMuted, textAlign: 'center', fontSize: 16, lineHeight: 24, marginBottom: 40, paddingHorizontal: 20 },
  scoreCard: { backgroundColor: '#16161E', borderRadius: 32, padding: 32, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  scoreLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  scoreValue: { color: '#fff', fontSize: 56, fontWeight: '900' },
  scoreBadge: { backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreBadgeText: { color: '#000', fontSize: 10, fontWeight: '900' },
  performanceGrid: { flexDirection: 'row', paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  perfBox: { flex: 1, alignItems: 'center' },
  perfBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  perfVal: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  perfLab: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '700' },
  resultActions: { width: '100%', marginTop: 40, gap: 16 },
  primaryAction: { backgroundColor: theme.colors.primary, height: 64, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  primaryActionText: { color: '#000', fontSize: 16, fontWeight: '900' },
  secondaryAction: { height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secondaryActionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  lockIconBg: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  autoStartBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, marginBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  autoStartText: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1 }
});

export default DailyMCQScreen;
