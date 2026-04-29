import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { X, Eye, HelpCircle } from 'lucide-react-native';

const { height } = Dimensions.get('window');

const ReviewModal = ({ visible, onClose, results, theme }) => {
  if (!results) return null;
  const s = styles(theme);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <View style={s.modalHeader}>
            <View>
              <Text style={s.modalTitle}>Mission Review</Text>
              <Text style={s.modalSub}>Analyze your performance</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <X color={theme.colors.text} size={24} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {results?.answers?.map((ans, i) => {
              const mcq = results?.dailyMCQ?.questions?.find(q => q._id === ans.questionId);
              const isCorrect = ans.isCorrect;
              return (
                <View key={i} style={s.reviewCard}>
                  <View style={s.reviewCardHeader}>
                    <View style={s.qNumBadge}><Text style={s.qNumText}>{i + 1}</Text></View>
                    <View style={[s.statusBadge, isCorrect ? s.bgSuccess : s.bgError]}>
                      <Text style={[s.statusBadgeText, { color: isCorrect ? theme.colors.success : theme.colors.error }]}>{isCorrect ? 'CORRECT' : 'WRONG'}</Text>
                    </View>
                  </View>
                  <Text style={s.reviewQuestion}>{mcq?.question || 'Question'}</Text>
                  <View style={s.answerComparison}>
                    <View style={s.answerRow}>
                      <Text style={s.answerLabel}>Your Answer:</Text>
                      <Text style={[s.answerVal, { color: isCorrect ? theme.colors.success : theme.colors.error }]}>{ans.selectedOption === 'NONE' ? 'Skipped' : (mcq?.options[ans.selectedOption.charCodeAt(0) - 65] || ans.selectedOption)}</Text>
                    </View>
                    {!isCorrect && (
                      <View style={[s.answerRow, { marginTop: 8 }]}>
                        <Text style={s.answerLabel}>Correct Answer:</Text>
                        <Text style={[s.answerVal, { color: theme.colors.success, fontWeight: '700' }]}>{mcq?.options[(mcq?.correct || ans.correctOption).charCodeAt(0) - 65] || (mcq?.correct || ans.correctOption)}</Text>
                      </View>
                    )}
                  </View>
                  {mcq?.explanation && (
                    <View style={s.explanationBox}>
                      <HelpCircle size={14} color={theme.colors.textMuted} />
                      <Text style={s.explanationText}>{mcq.explanation}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = (theme) => StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: theme.colors.background, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    height: height * 0.85, 
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 25
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: theme.colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  modalSub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  reviewCard: { backgroundColor: theme.colors.surface, padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  reviewCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  qNumBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  qNumText: { color: theme.colors.text, fontSize: 13, fontWeight: '900' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  reviewQuestion: { color: theme.colors.text, fontSize: 17, fontWeight: '700', lineHeight: 26, marginBottom: 20 },
  answerComparison: { backgroundColor: 'rgba(0,0,0,0.25)', padding: 18, borderRadius: 20, gap: 14 },
  answerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  answerLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  answerVal: { fontSize: 15, fontWeight: '600' },
  explanationBox: { flexDirection: 'row', gap: 12, marginTop: 20, padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  explanationText: { flex: 1, color: theme.colors.textMuted, fontSize: 13, lineHeight: 20 },
  bgSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
  bgError: { backgroundColor: 'rgba(239, 68, 68, 0.12)' }
});

export default ReviewModal;
