import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Stack } from 'expo-router';
import React from 'react';

export default function CreateLayout() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];

    const screenOptions = {
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.tint,
        headerTitleStyle: { color: theme.text, fontWeight: '700' as const },
        headerShadowVisible: false,
    };

    return (
        <Stack screenOptions={screenOptions}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="text-entry" options={{ title: 'Case Notes' }} />
            <Stack.Screen name="edit" options={{ title: 'Structured Case' }} />
            <Stack.Screen name="review" options={{ title: 'Review & Publish', presentation: 'modal' }} />
        </Stack>
    );
}
