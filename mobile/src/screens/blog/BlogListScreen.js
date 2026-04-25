import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../../utils/useTheme';

const BlogListScreen = () => {
  const theme = useTheme();
  const s = styles(theme);
  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <Text style={s.title}>Daily Blogs</Text>
        <Text style={s.subtitle}>Current affairs auto-generated daily.</Text>
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

export default BlogListScreen;
