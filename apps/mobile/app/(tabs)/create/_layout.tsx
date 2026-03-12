import { Stack } from 'expo-router';
import React from 'react';

export default function CreateLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="text-entry" options={{ title: 'Raw Case Details', presentation: 'card' }} />
            <Stack.Screen name="edit" options={{ title: 'Structured Case', presentation: 'card' }} />
            <Stack.Screen name="review" options={{ title: 'Review & Publish', presentation: 'modal' }} />
        </Stack>
    );
}
