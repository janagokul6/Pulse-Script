import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Link, Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!', headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SymbolView
          name={{ ios: 'stethoscope', android: 'healing', web: 'healing' }}
          tintColor={theme.tint}
          size={80}
        />

        <Text style={[styles.title, { color: theme.text }]}>Page Not Found</Text>
        <Text style={[styles.subtitle, { color: theme.secondary }]}>
          The clinical record or section you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </Text>

        <Link href="/(tabs)" asChild>
          <TouchableOpacity style={StyleSheet.flatten([styles.button, { backgroundColor: theme.tint }])}>
            <Text style={styles.buttonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

