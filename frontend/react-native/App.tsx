import './global.css';
import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BarChart3, ClipboardList } from 'lucide-react-native';

import { useAllocationWorkspace } from './src/hooks/useAllocationWorkspace';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { theme } from './src/theme';

const Tab = createBottomTabNavigator();

function App() {
  const workspace = useAllocationWorkspace();

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background.surface}
        translucent={false}
      />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.text.primary,
            tabBarInactiveTintColor: theme.colors.text.placeholder,
            tabBarStyle: {
              backgroundColor: theme.colors.background.surface,
              borderTopColor: theme.colors.border.default,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          }}
        >
          <Tab.Screen
            name="Visualize"
            options={{
              tabBarIcon: ({ color, size }) => (
                <BarChart3 size={size} color={color} strokeWidth={1.75} />
              ),
            }}
          >
            {() => <DashboardScreen workspace={workspace} />}
          </Tab.Screen>
          <Tab.Screen
            name="Orders"
            options={{
              tabBarIcon: ({ color, size }) => (
                <ClipboardList size={size} color={color} strokeWidth={1.75} />
              ),
            }}
          >
            {() => <OrdersScreen workspace={workspace} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
