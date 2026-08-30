import React from 'react';
import { Banner } from 'react-native-paper';

interface Props {
  message: string | null;
  onDismiss: () => void;
}

/**
 * Shared "something went wrong" banner — used for Keycloak/network errors on the auth screens
 * (Фаза 1, issue "Экран ошибок авторизации") and reusable later for API errors elsewhere.
 */
export function ErrorBanner({ message, onDismiss }: Props) {
  return (
    <Banner visible={message !== null} actions={[{ label: 'Скрыть', onPress: onDismiss }]}>
      {message ?? ''}
    </Banner>
  );
}
