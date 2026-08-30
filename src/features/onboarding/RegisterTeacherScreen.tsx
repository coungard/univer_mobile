import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { ApiError } from '../../api/errors';
import { ErrorBanner } from '../../components/ErrorBanner';
import { SelectField } from '../../components/SelectField';
import { AuthStackParamList } from '../../navigation/types';
import { useDepartmentsQuery, useRegisterTeacherMutation, useUniversitiesQuery } from './hooks';
import { TeacherRegistrationForm, teacherRegistrationSchema } from './schemas';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterTeacher'>;

export function RegisterTeacherScreen({ navigation }: Props) {
  const universities = useUniversitiesQuery();
  const register = useRegisterTeacherMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TeacherRegistrationForm>({
    resolver: zodResolver(teacherRegistrationSchema),
    defaultValues: {
      username: '',
      firstname: '',
      lastname: '',
      fullname: '',
      password: '',
      email: '',
      universityId: '',
      departmentId: '',
      position: '',
    },
  });

  const universityId = useWatch({ control, name: 'universityId' });
  const departments = useDepartmentsQuery(universityId || null);

  // Department list depends on the chosen university — drop a stale selection when it changes.
  useEffect(() => {
    setValue('departmentId', '');
  }, [universityId, setValue]);

  const onSubmit = handleSubmit(async ({ universityId: _universityId, ...request }) => {
    setSubmitError(null);
    try {
      await register.mutateAsync(request);
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof TeacherRegistrationForm, { message });
        });
        return;
      }
      setSubmitError(
        error instanceof ApiError ? error.message : 'Не удалось зарегистрироваться. Попробуйте ещё раз.',
      );
    }
  });

  if (done) {
    return (
      <View style={styles.doneContainer}>
        <Text variant="headlineSmall" style={styles.doneTitle}>
          Регистрация завершена
        </Text>
        <Text variant="bodyMedium" style={styles.doneText}>
          Ваш профиль преподавателя создан. Теперь можно войти.
        </Text>
        <Button mode="contained" onPress={() => navigation.navigate('Login')}>
          Перейти ко входу
        </Button>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />

      <Text variant="headlineSmall" style={styles.title}>
        Регистрация преподавателя
      </Text>

      <Controller
        control={control}
        name="username"
        render={({ field }) => (
          <View style={styles.field}>
            <TextInput
              label="Логин"
              value={field.value}
              onChangeText={field.onChange}
              autoCapitalize="none"
              error={!!errors.username}
            />
            <HelperText type="error" visible={!!errors.username}>
              {errors.username?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="firstname"
        render={({ field }) => (
          <View style={styles.field}>
            <TextInput label="Имя" value={field.value} onChangeText={field.onChange} error={!!errors.firstname} />
            <HelperText type="error" visible={!!errors.firstname}>
              {errors.firstname?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="lastname"
        render={({ field }) => (
          <View style={styles.field}>
            <TextInput label="Фамилия" value={field.value} onChangeText={field.onChange} error={!!errors.lastname} />
            <HelperText type="error" visible={!!errors.lastname}>
              {errors.lastname?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="fullname"
        render={({ field }) => (
          <View style={styles.field}>
            <TextInput label="Полное имя (необязательно)" value={field.value} onChangeText={field.onChange} />
          </View>
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <View style={styles.field}>
            <TextInput
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              autoCapitalize="none"
              keyboardType="email-address"
              error={!!errors.email}
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <View style={styles.field}>
            <TextInput
              label="Пароль"
              value={field.value}
              onChangeText={field.onChange}
              secureTextEntry
              error={!!errors.password}
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="universityId"
        render={({ field }) => (
          <View style={styles.field}>
            <SelectField
              label="Университет"
              value={field.value || null}
              options={universities.data ?? []}
              onChange={field.onChange}
              error={!!errors.universityId}
              disabled={universities.isLoading}
              emptyLabel={universities.isLoading ? 'Загрузка…' : 'Нет доступных университетов'}
            />
            <HelperText type="error" visible={!!errors.universityId}>
              {errors.universityId?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="departmentId"
        render={({ field }) => (
          <View style={styles.field}>
            <SelectField
              label="Кафедра"
              value={field.value || null}
              options={departments.data ?? []}
              onChange={field.onChange}
              error={!!errors.departmentId}
              disabled={!universityId || departments.isLoading}
              emptyLabel={
                !universityId
                  ? 'Сначала выберите университет'
                  : departments.isLoading
                    ? 'Загрузка…'
                    : 'Нет доступных кафедр'
              }
            />
            <HelperText type="error" visible={!!errors.departmentId}>
              {errors.departmentId?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="position"
        render={({ field }) => (
          <View style={styles.field}>
            <TextInput
              label="Должность"
              value={field.value}
              onChangeText={field.onChange}
              error={!!errors.position}
            />
            <HelperText type="error" visible={!!errors.position}>
              {errors.position?.message}
            </HelperText>
          </View>
        )}
      />

      <Button mode="contained" onPress={onSubmit} loading={isSubmitting} disabled={isSubmitting} style={styles.submit}>
        Зарегистрироваться
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 4,
  },
  title: {
    marginBottom: 16,
  },
  field: {
    marginBottom: 4,
  },
  submit: {
    marginTop: 16,
  },
  doneContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  doneTitle: {
    textAlign: 'center',
  },
  doneText: {
    textAlign: 'center',
    opacity: 0.8,
  },
});
