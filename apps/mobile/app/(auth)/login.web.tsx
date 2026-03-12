import React from 'react';
import { SignIn } from '@clerk/expo/web';
import { View } from '@/components/Themed';

export default function LoginWebScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <SignIn
        signUpUrl="/(auth)/register"
        signUpForceRedirectUrl="/"
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
      />
    </View>
  );
}
