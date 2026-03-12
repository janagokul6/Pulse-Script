import React from 'react';
import { SignUp } from '@clerk/expo/web';
import { View } from '@/components/Themed';

export default function RegisterWebScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <SignUp
        signInUrl="/(auth)/login"
        signInForceRedirectUrl="/"
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
      />
    </View>
  );
}
