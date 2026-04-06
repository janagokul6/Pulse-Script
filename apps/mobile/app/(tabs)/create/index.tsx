/**
 * Unified "Case Entry" Carousel — hosts ManualFill, Voice, and AiDrop
 * as side-by-side slides in a full-bleed horizontal paging container.
 *
 * Voice (center) is the default view on mount.
 * Swipe right-to-left → AI Drop.  Swipe left-to-right → Manual Fill.
 *
 * Web: Uses CSS scroll-snap for smooth, native-feeling paging.
 * Native: Uses ScrollView pagingEnabled for native paging.
 */
import VoiceSlide from '@/components/create/VoiceSlide';
import ManualFillSlide from '@/components/create/ManualFillSlide';
import AiDropSlide from '@/components/create/AiDropSlide';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View as RNView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CaseEntryCarousel() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { initialSlide } = useLocalSearchParams<{ initialSlide?: string }>();

  const scrollRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(1); // default Voice
  const hasScrolledToInitial = useRef(false);

  // Determine which slide to start on (default: 1 = Voice)
  const startIndex = initialSlide === '0' ? 0 : initialSlide === '2' ? 2 : 1;

  // Measure actual container width for responsive slides
  const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(w);
  }, []);

  // Snap to initial slide once we have a valid width
  useEffect(() => {
    if (containerWidth > 0 && !hasScrolledToInitial.current) {
      hasScrolledToInitial.current = true;
      setActiveIndex(startIndex);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: startIndex * containerWidth, animated: false });
      }, 50);
    }
  }, [containerWidth, startIndex]);

  // Track active slide on scroll end
  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (containerWidth <= 0) return;
    const page = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
    setActiveIndex(page);
  }, [containerWidth]);

  // Web-specific: inject scroll-snap CSS for smooth paging
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.textContent = `
            [data-carousel-container] {
                scroll-snap-type: x mandatory !important;
                -webkit-overflow-scrolling: touch;
            }
            [data-carousel-slide] {
                scroll-snap-align: start;
                scroll-snap-stop: always;
            }
        `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // Web: attach scroll-snap data attributes after render
  const handleScrollViewLayout = useCallback(() => {
    if (Platform.OS !== 'web' || !scrollRef.current) return;
    try {
      const scrollNode = (scrollRef.current as any)._nativeRef?.current
        || (scrollRef.current as any).getScrollableNode?.()
        || (scrollRef.current as any)._scrollRef;
      if (scrollNode) {
        const el = scrollNode instanceof HTMLElement ? scrollNode : scrollNode.getHostNode?.();
        if (el instanceof HTMLElement) {
          const scrollable = el.querySelector('[class*="r-overflow"]') || el;
          scrollable.setAttribute('data-carousel-container', '');
          scrollable.querySelectorAll(':scope > [class*="r-flex"]')?.forEach((child: Element) => {
            child.setAttribute('data-carousel-slide', '');
          });
        }
      }
    } catch (e) {
      // Silently fail — CSS snap is a nice-to-have enhancement
    }
  }, []);

  if (containerWidth === 0) {
    // Initial render: measure container width first
    return (
      <RNView style={[styles.container, { backgroundColor: theme.background }]} onLayout={handleContainerLayout}>
        <RNView style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 12) }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.tint + '12' }]}>
            <SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={theme.tint} size={20} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Share a Case</Text>
          <RNView style={styles.headerSpacer} />
        </RNView>
      </RNView>
    );
  }

  return (
    <RNView style={[styles.container, { backgroundColor: theme.background }]} onLayout={handleContainerLayout}>
      {/* Shared header */}
      <RNView style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.tint + '12' }]}>
          <SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={theme.tint} size={20} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Share a Case</Text>
        <RNView style={styles.headerSpacer} />
      </RNView>

      {/* Horizontal paging carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        style={styles.carousel}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        onLayout={handleScrollViewLayout}
        onMomentumScrollEnd={handleMomentumEnd}
      >
        {/* Slide 0 — Manual Fill (left) */}
        <RNView style={{ width: containerWidth, flex: 1 }}>
          <ManualFillSlide theme={theme} />
        </RNView>

        {/* Slide 1 — Voice (center, default) */}
        <RNView style={{ width: containerWidth, flex: 1 }}>
          <VoiceSlide theme={theme} bottomInset={insets.bottom} />
        </RNView>

        {/* Slide 2 — AI Drop (right) */}
        <RNView style={{ width: containerWidth, flex: 1 }}>
          <AiDropSlide theme={theme} />
        </RNView>
      </ScrollView>

      {/* Fixed step dots — just above bottom navigation */}
      <RNView style={[styles.dotsRow, { paddingBottom: 12 }]}>
        <RNView style={[styles.stepDot, { backgroundColor: activeIndex === 0 ? theme.tint : theme.border }]} />
        <RNView style={[styles.stepDot, { backgroundColor: activeIndex === 1 ? theme.tint : theme.border }]} />
        <RNView style={[styles.stepDot, { backgroundColor: activeIndex === 2 ? theme.tint : theme.border }]} />
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  headerSpacer: { width: 36 },
  carousel: { flex: 1 },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
  },
  stepDot: { width: 7, height: 7, borderRadius: 4 },
});
