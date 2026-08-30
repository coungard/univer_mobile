import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ErrorBanner } from '../../components/ErrorBanner';
import { useAuth } from '../../auth/useAuth';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { isLoggingIn, loginError, login } = useAuth();

  return (
    <View style={styles.container}>
      <ErrorBanner message={loginError} onDismiss={() => {}} />

      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Univer
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Войдите, чтобы увидеть своё расписание
        </Text>

        <Button
          mode="contained"
          onPress={() => login()}
          loading={isLoggingIn}
          disabled={isLoggingIn}
          style={styles.button}
        >
          Войти
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('RegisterRoleChoice')}
          disabled={isLoggingIn}
        >
          Нет аккаунта? Зарегистрироваться
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  button: {
    marginTop: 12,
  },
});
