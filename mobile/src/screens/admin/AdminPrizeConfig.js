import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../../utils/useTheme';

const AdminPrizeConfig = () => {
  const theme = useTheme();
  const s = styles(theme);
  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <Text style={s.title}>Prize Config</Text>
        <Text style={s.subtitle}>Set Weekly & Monthly prize amounts.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: theme.colors.textMuted, marginTop: 8 },
});

export default AdminPrizeConfig;
