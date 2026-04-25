import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { Home, BookOpen, Trophy, Shield, User, HelpCircle } from 'lucide-react-native';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import LockedOverlay from '../components/LockedOverlay';

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';
import DailyMCQScreen from '../screens/mcq/DailyMCQScreen';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import BlogListScreen from '../screens/home/BlogListScreen';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminMCQReview from '../screens/admin/AdminMCQReview';
import AdminBlogReview from '../screens/admin/AdminBlogReview';
import AdminPrizeConfig from '../screens/admin/AdminPrizeConfig';
import AdminUserApproval from '../screens/admin/AdminUserApproval';
import AdminSubjectManage from '../screens/admin/AdminSubjectManage';

import { useTheme } from '../utils/useTheme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
    <Stack.Screen name="AdminMCQ" component={AdminMCQReview} />
    <Stack.Screen name="AdminBlogs" component={AdminBlogReview} />
    <Stack.Screen name="AdminPrizes" component={AdminPrizeConfig} />
    <Stack.Screen name="AdminApprovals" component={AdminUserApproval} />
    <Stack.Screen name="AdminSubjects" component={AdminSubjectManage} />
  </Stack.Navigator>
);

const MainTabs = () => {
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  const isMasterAdmin = user?.email === 'hafezzargar987@gmail.com';

  return (
    <Tab.Navigator
      initialRouteName={isMasterAdmin ? 'Admin' : 'Home'}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const iconSize = size || 24;
          if (route.name === 'Home') return <Home color={color} size={iconSize} />;
          if (route.name === 'MCQ') return <BookOpen color={color} size={iconSize} />;
          if (route.name === 'Admin') return <Shield color={color} size={iconSize} />;
          if (route.name === 'Ranks') return <Trophy color={color} size={iconSize} />;
          if (route.name === 'Profile') return <User color={color} size={iconSize} />;
          return <HelpCircle color={color} size={iconSize} />;
        },
        tabBarLabel: ({ focused, color }) => (
          <Text style={{ 
            color, 
            fontSize: 11, 
            fontWeight: focused ? 'bold' : '500',
            marginTop: -5,
            marginBottom: 5 
          }}>
            {route.name}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: theme?.colors?.surface || '#1e293b',
          borderTopWidth: 0,
          height: 65,
        },
        tabBarActiveTintColor: theme?.colors?.primary || '#fbbf24',
        tabBarInactiveTintColor: theme?.colors?.textMuted || '#94a3b8',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      {!isMasterAdmin && <Tab.Screen name="MCQ" component={DailyMCQScreen} />}
      {isMasterAdmin && (
        <Tab.Screen 
          name="Admin" 
          component={AdminStack} 
          options={{ }}
        />
      )}
      <Tab.Screen name="Ranks" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Blogs" component={BlogListScreen} options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
  );
};

/**
 * Wraps MainTabs to show a lock overlay if the user is pending
 */
const MainWrapper = () => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return null;
  
  return (
    <View style={{ flex: 1 }}>
      <MainTabs />
      {user?.status === 'PENDING' && <LockedOverlay />}
    </View>
  );
};

const AppNavigator = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <Stack.Screen name="Main" component={MainWrapper} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
