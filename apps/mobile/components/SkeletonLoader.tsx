import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: any;
}

export function SkeletonLoader({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [animatedValue]);

    const backgroundColor = colorScheme === 'dark' ? '#374151' : '#e5e7eb';
    const highlightColor = colorScheme === 'dark' ? '#4b5563' : '#f3f4f6';

    const interpolatedBackgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [backgroundColor, highlightColor],
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: interpolatedBackgroundColor,
                },
                style,
            ]}
        />
    );
}

export function PostSkeleton() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];

    return (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.header}>
                <SkeletonLoader width={40} height={40} borderRadius={20} />
                <View style={styles.headerText}>
                    <SkeletonLoader width={120} height={16} />
                    <SkeletonLoader width={80} height={12} style={{ marginTop: 4 }} />
                </View>
            </View>

            <SkeletonLoader width="100%" height={24} style={{ marginTop: 12, marginBottom: 8 }} />
            <SkeletonLoader width="100%" height={16} style={{ marginBottom: 4 }} />
            <SkeletonLoader width="80%" height={16} style={{ marginBottom: 12 }} />

            <View style={styles.footer}>
                <SkeletonLoader width={80} height={24} borderRadius={12} />
                <View style={styles.metrics}>
                    <SkeletonLoader width={40} height={16} style={{ marginRight: 12 }} />
                    <SkeletonLoader width={40} height={16} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        marginLeft: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    metrics: {
        flexDirection: 'row',
    }
});
