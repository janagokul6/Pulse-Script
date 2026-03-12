import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Stack } from 'expo-router';

export default function LibraryLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    />
  );
}

