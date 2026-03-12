import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

const tint = Colors.light.tint;

export function useAuthStyles() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return useMemo(() => {
    const inputBorder = isDark ? '#444' : '#ccc';
    const inputBg = isDark ? '#1a1a1a' : '#fff';
    const placeholderColor = '#888';
    const linkColor = tint;

    const sheet = StyleSheet.create({
      container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
      },
      scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
      },
      title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 24,
      },
      label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        marginTop: 12,
      },
      input: {
        borderWidth: 1,
        borderColor: inputBorder,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: inputBg,
      },
      button: {
        backgroundColor: tint,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
      },
      buttonDisabled: {
        opacity: 0.6,
      },
      buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
      },
      secondaryButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginTop: 8,
      },
      secondaryButtonText: {
        color: linkColor,
        fontWeight: '600',
      },
      linkContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 24,
        alignItems: 'center',
        gap: 4,
      },
      error: {
        color: '#d32f2f',
        fontSize: 12,
        marginTop: 4,
      },
    });
    return { ...sheet, placeholderColor };
  }, [isDark]);
}
