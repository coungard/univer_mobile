import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterRoleChoice'>;

export function RegisterRoleChoiceScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Кто вы?
      </Text>

      <Button mode="contained" style={styles.button} onPress={() => navigation.navigate('RegisterStudent')}>
        Я студент
      </Button>
      <Button mode="outlined" style={styles.button} onPress={() => navigation.navigate('RegisterTeacher')}>
        Я преподаватель
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    marginTop: 4,
  },
});
