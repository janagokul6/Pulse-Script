import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Tabs, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const animation = useSharedValue(0);

  const toggleMenu = () => {
    const toValue = isExpanded ? 0 : 1;
    animation.value = withSpring(toValue, {
      damping: 12,
      stiffness: 90,
    });
    setIsExpanded(!isExpanded);
  };

  const closeMenu = () => {
    animation.value = withSpring(0);
    setIsExpanded(false);
  };

  const navigateTo = (path: string, params?: any) => {
    closeMenu();
    router.push({ pathname: path as any, params });
  };

  const fabIconStyle = useAnimatedStyle(() => {
    const rotation = interpolate(animation.value, [0, 1], [0, 45]);
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(animation.value, { duration: 200 }),
      pointerEvents: animation.value > 0.5 ? 'auto' : 'none',
    };
  });

  const getButtonStyle = (index: number) => {
    return useAnimatedStyle(() => {
      // Arrangement: 3 buttons in an arc from 150 to 30 degrees
      const angle = 150 - index * 60;
      const radius = 90;
      const x = Math.cos((angle * Math.PI) / 180) * radius * animation.value;
      const y = Math.sin((angle * Math.PI) / 180) * radius * animation.value;

      return {
        transform: [
          { translateX: x },
          { translateY: -y },
          { scale: animation.value },
        ],
        opacity: animation.value,
      };
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.tint,
          tabBarInactiveTintColor: theme.secondary,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopColor: '#f0f0f0',
            height: (Platform.OS === 'ios' ? 94 : 90) + insets.bottom,
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 38 : 30),
            paddingTop: 10,
            elevation: 0,
            borderTopWidth: 1,
            borderStyle: 'solid',
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            marginTop: 6,
            letterSpacing: 0.2,
          },
          tabBarHideOnKeyboard: true,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <SymbolView
                name={{ ios: focused ? 'house.fill' : 'house', android: 'home', web: 'home' }}
                tintColor={color}
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <SymbolView
                name={{ ios: focused ? 'magnifyingglass' : 'magnifyingglass', android: 'search', web: 'search' }}
                tintColor={color}
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: '',
            tabBarButton: () => (
              <View style={styles.fabContainer}>
                <Pressable onPress={toggleMenu}>
                  <Animated.View style={[styles.createButton, fabIconStyle, { backgroundColor: theme.tint, borderColor: theme.background }]}>
                    <SymbolView
                      name={{ ios: 'plus', android: 'add', web: 'add' }}
                      tintColor="#fff"
                      size={28}
                      weight="bold"
                    />
                  </Animated.View>
                </Pressable>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Inbox',
            tabBarIcon: ({ color, focused }) => (
              <SymbolView
                name={{
                  ios: focused ? 'bubble.left.and.bubble.right.fill' : 'bubble.left.and.bubble.right',
                  android: focused ? 'chat_bubble' : 'chat_bubble_outline',
                  web: focused ? 'chat_bubble' : 'chat_bubble_outline',
                }}
                tintColor={color}
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <SymbolView
                name={{ ios: focused ? 'person.circle.fill' : 'person.circle', android: 'account_circle', web: 'account_circle' }}
                tintColor={color}
                size={24}
              />
            ),
          }}
        />
      </Tabs>

      {/* Expansion Overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>

        <View style={[styles.menuWrapper, { bottom: (Platform.OS === 'ios' ? 94 : 90) + insets.bottom - 45 }]}>
          {/* Circular Buttons */}
          <Animated.View style={[styles.subButtonContainer, getButtonStyle(0)]}>
            <TouchableOpacity
              style={[styles.subButton, { backgroundColor: theme.card }]}
              onPress={() => navigateTo('/(tabs)/create/edit', { draftData: JSON.stringify({ caseSummary: '' }) })}
            >
              <SymbolView name={{ ios: 'doc.text.fill', android: 'description', web: 'description' }} tintColor={theme.tint} size={24} />
            </TouchableOpacity>
            <View style={styles.labelContainer}>
              <Text style={styles.subLabel}>Full Form</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.subButtonContainer, getButtonStyle(1)]}>
            <TouchableOpacity
              style={[styles.subButton, { backgroundColor: theme.card }]}
              onPress={() => navigateTo('/(tabs)/create/text-entry')}
            >
              <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} tintColor={theme.tint} size={24} />
            </TouchableOpacity>
            <View style={styles.labelContainer}>
              <Text style={styles.subLabel}>AI Draft</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.subButtonContainer, getButtonStyle(2)]}>
            <TouchableOpacity
              style={[styles.subButton, { backgroundColor: theme.card }]}
              onPress={() => navigateTo('/(tabs)/create/')}
            >
              <SymbolView name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }} tintColor={theme.tint} size={24} />
            </TouchableOpacity>
            <View style={styles.labelContainer}>
              <Text style={styles.subLabel}>Voice Record</Text>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -32,
    shadowColor: '#1a355b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    zIndex: 5,
  },
  menuWrapper: {
    position: 'absolute',
    left: '50%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subButtonContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  subButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  labelContainer: {
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  subLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

