import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { ApiError } from '../../api/errors';
import { useAuth } from '../../auth/useAuth';
import { ErrorBanner } from '../../components/ErrorBanner';
import { SearchableSelectField } from '../../components/SearchableSelectField';
import { AuthStackParamList } from '../../navigation/types';
import { libraryColors, libraryFonts } from '../../theme/library';
import { formatDateInput } from './formatDateInput';
import { useRegisterStudentMutation, useUniversitiesQuery } from './hooks';
import { StudentRegistrationForm, studentRegistrationSchema } from './schemas';
import { StudentIdCard } from './StudentIdCard';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterStudent'>;

type PaperThemeProp = React.ComponentProps<typeof TextInput>['theme'];

/** Per-field color override so the boxed "Library" look doesn't need touching Paper's global theme. */
const fieldTheme: PaperThemeProp = {
  colors: {
    primary: libraryColors.terracottaButton,
    outline: libraryColors.border,
    background: libraryColors.surface,
    onSurfaceVariant: libraryColors.inkMuted,
    onSurface: libraryColors.ink,
  },
};

interface FieldBoxProps {
  label: string;
  error?: boolean;
  helperText?: string;
  /** Fields with no validation (e.g. the optional full name) skip the reserved helper-text row entirely. */
  validated?: boolean;
  children: React.ReactNode;
}

function FieldBox({ label, error, helperText, validated = true, children }: FieldBoxProps) {
  return (
    <View style={styles.fieldBox}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {validated && (
        <HelperText type="error" visible={!!error} style={styles.helperText}>
          {helperText}
        </HelperText>
      )}
    </View>
  );
}

export function RegisterStudentScreen({ navigation }: Props) {
  const [universitySearch, setUniversitySearch] = useState('');
  const universities = useUniversitiesQuery(universitySearch);
  const register = useRegisterStudentMutation();
  const { loginWithPassword } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StudentRegistrationForm>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: {
      username: '',
      firstname: '',
      lastname: '',
      fullname: '',
      email: '',
      password: '',
      birthday: '',
      universityId: '',
    },
  });

  const [firstname, lastname, username] = useWatch({ control, name: ['firstname', 'lastname', 'username'] });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await register.mutateAsync(values);
      // Log the user straight into their new profile with the credentials they just typed,
      // instead of bouncing them through a second manual sign-in — falls back to the done screen
      // below if that somehow fails.
      try {
        await loginWithPassword(values.username, values.password);
      } catch {
        setDone(true);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof StudentRegistrationForm, { message });
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
          Ваш профиль создан. Группу назначит администратор — после этого в приложении появится
          расписание. Пока можно войти и посмотреть свой профиль.
        </Text>
        <Button mode="contained" onPress={() => navigation.navigate('Login')}>
          Перейти ко входу
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <ErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />

      <StudentIdCard firstname={firstname} lastname={lastname} username={username} />

      <View style={styles.heading}>
        <Text style={styles.title}>Заполните профиль</Text>
        <Text style={styles.subtitle}>Билет выше обновится, как только вы допишете данные</Text>
      </View>

      <Controller
        control={control}
        name="username"
        render={({ field }) => (
          <FieldBox label="Логин" error={!!errors.username} helperText={errors.username?.message}>
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              autoCapitalize="none"
              mode="outlined"
              theme={fieldTheme}
              outlineStyle={styles.fieldOutline}
              style={styles.fieldInput}
              error={!!errors.username}
            />
          </FieldBox>
        )}
      />

      <View style={styles.row}>
        <Controller
          control={control}
          name="firstname"
          render={({ field }) => (
            <View style={styles.rowItem}>
              <FieldBox label="Имя" error={!!errors.firstname} helperText={errors.firstname?.message}>
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  mode="outlined"
                  theme={fieldTheme}
                  outlineStyle={styles.fieldOutline}
                  style={styles.fieldInput}
                  error={!!errors.firstname}
                />
              </FieldBox>
            </View>
          )}
        />
        <Controller
          control={control}
          name="lastname"
          render={({ field }) => (
            <View style={styles.rowItem}>
              <FieldBox label="Фамилия" error={!!errors.lastname} helperText={errors.lastname?.message}>
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  mode="outlined"
                  theme={fieldTheme}
                  outlineStyle={styles.fieldOutline}
                  style={styles.fieldInput}
                  error={!!errors.lastname}
                />
              </FieldBox>
            </View>
          )}
        />
      </View>

      <Controller
        control={control}
        name="fullname"
        render={({ field }) => (
          <FieldBox label="Полное имя (необязательно)" validated={false}>
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              mode="outlined"
              theme={fieldTheme}
              outlineStyle={styles.fieldOutline}
              style={styles.fieldInput}
            />
          </FieldBox>
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <FieldBox label="Email" error={!!errors.email} helperText={errors.email?.message}>
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              autoCapitalize="none"
              keyboardType="email-address"
              mode="outlined"
              theme={fieldTheme}
              outlineStyle={styles.fieldOutline}
              style={styles.fieldInput}
              error={!!errors.email}
            />
          </FieldBox>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <FieldBox label="Пароль" error={!!errors.password} helperText={errors.password?.message}>
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              secureTextEntry={!showPassword}
              mode="outlined"
              theme={fieldTheme}
              outlineStyle={styles.fieldOutline}
              style={styles.fieldInput}
              error={!!errors.password}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  color={libraryColors.inkMuted}
                  onPress={() => setShowPassword((value) => !value)}
                  forceTextInputFocus={false}
                />
              }
            />
          </FieldBox>
        )}
      />

      <Controller
        control={control}
        name="birthday"
        render={({ field }) => (
          <FieldBox
            label="Дата рождения (ГГГГ-ММ-ДД)"
            error={!!errors.birthday}
            helperText={errors.birthday?.message}
          >
            <TextInput
              value={field.value}
              onChangeText={(text) => field.onChange(formatDateInput(text))}
              placeholder="2005-09-01"
              keyboardType="number-pad"
              maxLength={10}
              mode="outlined"
              theme={fieldTheme}
              outlineStyle={styles.fieldOutline}
              style={styles.fieldInput}
              error={!!errors.birthday}
            />
          </FieldBox>
        )}
      />

      <Controller
        control={control}
        name="universityId"
        render={({ field }) => (
          <FieldBox
            label="Университет"
            error={!!errors.universityId}
            helperText={errors.universityId?.message}
          >
            <SearchableSelectField
              label="Университет"
              value={field.value || null}
              options={universities.data ?? []}
              searchText={universitySearch}
              onSearchTextChange={setUniversitySearch}
              onChange={field.onChange}
              error={!!errors.universityId}
              loading={universities.isLoading}
              loadingMore={universities.isFetchingNextPage}
              hasMore={universities.hasNextPage}
              onEndReached={universities.fetchNextPage}
              inputTheme={fieldTheme}
              hideInlineLabel
              libraryStyle
            />
          </FieldBox>
        )}
      />

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        buttonColor={libraryColors.terracottaButton}
        textColor={libraryColors.cream}
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
        labelStyle={styles.submitButtonLabel}
      >
        Зарегистрироваться
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        disabled={isSubmitting}
        textColor={libraryColors.terracottaButton}
        labelStyle={styles.footerLinkLabel}
      >
        Уже есть аккаунт? Войти
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: libraryColors.background,
  },
  container: {
    padding: 20,
    gap: 12,
  },
  heading: {
    gap: 4,
    marginTop: 4,
  },
  title: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 22,
    color: libraryColors.ink,
  },
  subtitle: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 12.5,
    color: libraryColors.inkMuted,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowItem: {
    flex: 1,
  },
  fieldBox: {
    gap: 4,
  },
  fieldLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: libraryColors.inkMuted,
  },
  fieldOutline: {
    borderRadius: 10,
  },
  fieldInput: {
    backgroundColor: libraryColors.surface,
    fontFamily: libraryFonts.bodyRegular,
  },
  helperText: {
    marginTop: -6,
  },
  submitButton: {
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonContent: {
    height: 52,
  },
  submitButtonLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 15,
  },
  footerLinkLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 13,
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
