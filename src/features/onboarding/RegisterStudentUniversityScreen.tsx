import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { ApiError } from '../../api/errors';
import { useAuth } from '../../auth/useAuth';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { QueryErrorState } from '../../components/QueryErrorState';
import { AuthStackParamList } from '../../navigation/types';
import { libraryColors, libraryFonts } from '../../theme/library';
import { useRegisterStudentMutation, useUniversitiesQuery } from './hooks';
import { useRegistrationDraftStore } from './registrationDraftStore';
import { OptionRow, StepHeader, StepSearchInput, stepStyles } from './RegistrationStep';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterStudentUniversity'>;

/**
 * Which step-1 field a "already taken" rejection is about. The backend reports a taken email or
 * login as a `422` with only a human-readable message (verified live; API.md documents `409` for
 * email), so the field has to be read off the message text.
 */
function duplicateField(error: ApiError): 'email' | 'username' | null {
  if (error.status === 409) return 'email';
  if (error.status !== 422) return null;
  if (/email/i.test(error.message)) return 'email';
  if (/логин/i.test(error.message)) return 'username';
  return null;
}

/**
 * Step 3 of student registration (PLAN.md): pick a university — within the region chosen on step
 * 2, or country-wide when there is none — and submit the whole registration. This is where the
 * account gets created for now, because the backend still requires `universityId` on
 * `POST /students/register` (PLAN.md, B3).
 */
export function RegisterStudentUniversityScreen({ navigation, route }: Props) {
  const regionId = route.params?.regionId;
  const regionName = route.params?.regionName;

  const personal = useRegistrationDraftStore((state) => state.personal);
  const setServerFieldErrors = useRegistrationDraftStore((state) => state.setServerFieldErrors);
  const resetDraft = useRegistrationDraftStore((state) => state.reset);

  const [search, setSearch] = useState('');
  const universities = useUniversitiesQuery(search, regionId);
  const register = useRegisterStudentMutation();
  const { loginWithPassword } = useAuth();

  const [selected, setSelected] = useState<{ value: string; label: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [missingDialogVisible, setMissingDialogVisible] = useState(false);
  const [done, setDone] = useState(false);

  // No draft means there is nothing to submit (e.g. this screen was restored without step 1).
  useEffect(() => {
    if (!personal && !done) navigation.popTo('RegisterStudent');
  }, [personal, done, navigation]);

  const searchAllRegions = () => navigation.setParams({ regionId: undefined, regionName: undefined });

  const onSubmit = async () => {
    if (!personal || !selected) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await register.mutateAsync({ ...personal, universityId: selected.value });
      // Log the user straight into their new profile with the credentials they just typed,
      // instead of bouncing them through a second manual sign-in — falls back to the done screen
      // below if that somehow fails.
      try {
        await loginWithPassword(personal.username, personal.password);
      } catch {
        setDone(true);
        resetDraft();
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && error.fieldErrors) {
        const { universityId: universityError, ...personalErrors } = error.fieldErrors;
        if (Object.keys(personalErrors).length > 0) {
          // The rejected fields live on step 1 — send the user back there with the messages.
          setServerFieldErrors(personalErrors);
          navigation.popTo('RegisterStudent');
          return;
        }
        setSubmitError(universityError ?? error.message);
      } else if (error instanceof ApiError && duplicateField(error)) {
        setServerFieldErrors({ [duplicateField(error)!]: error.message });
        navigation.popTo('RegisterStudent');
      } else if (error instanceof ApiError && error.status === 404) {
        // The university disappeared between loading the list and submitting.
        setSelected(null);
        setSubmitError('Этот университет больше недоступен. Выберите другой.');
        universities.refetch();
      } else {
        setSubmitError(
          error instanceof ApiError ? error.message : 'Не удалось зарегистрироваться. Попробуйте ещё раз.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

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
        <Button mode="contained" onPress={() => navigation.popTo('Login')}>
          Перейти ко входу
        </Button>
      </View>
    );
  }

  const items = universities.data ?? [];
  const hasSearch = search.trim().length > 0;

  return (
    <View style={stepStyles.screen}>
      <ErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />

      <View style={stepStyles.top}>
        <StepHeader
          step={3}
          title="Выберите университет"
          subtitle={regionName ? `Регион: ${regionName}` : 'Поиск по всем регионам'}
        />
        <StepSearchInput value={search} onChangeText={setSearch} placeholder="Название университета" />
      </View>

      {universities.isPending ? (
        <View style={stepStyles.centered}>
          <ActivityIndicator color={libraryColors.terracotta} />
        </View>
      ) : universities.isError ? (
        <View style={stepStyles.centered}>
          <QueryErrorState error={universities.error} onRetry={() => universities.refetch()} />
        </View>
      ) : (
        <FlatList
          style={stepStyles.list}
          contentContainerStyle={stepStyles.listContent}
          data={items}
          keyExtractor={(item) => item.value}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => {
            if (universities.hasNextPage && !universities.isFetchingNextPage) universities.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <OptionRow
              title={item.label}
              subtitle={item.sublabel}
              selected={selected?.value === item.value}
              onPress={() => setSelected({ value: item.value, label: item.label })}
            />
          )}
          ListFooterComponent={
            universities.isFetchingNextPage ? <ActivityIndicator color={libraryColors.terracotta} /> : null
          }
          ListEmptyComponent={
            <View style={stepStyles.centered}>
              <EmptyState
                title={
                  hasSearch
                    ? 'Ничего не найдено'
                    : regionId
                      ? 'В этом регионе пока нет университетов'
                      : 'Университетов пока нет'
                }
                description={
                  regionId
                    ? 'Возможно, университет привязан к другому региону — попробуйте поиск по всем регионам.'
                    : hasSearch
                      ? 'Проверьте название.'
                      : undefined
                }
              />
              {regionId ? (
                <Button mode="outlined" onPress={searchAllRegions} textColor={libraryColors.terracottaButton}>
                  Искать по всем регионам
                </Button>
              ) : null}
            </View>
          }
        />
      )}

      <View style={stepStyles.footer}>
        {selected ? (
          <Text style={styles.selectedLabel} numberOfLines={1}>
            Выбрано: {selected.label}
          </Text>
        ) : null}
        <Button
          mode="contained"
          onPress={onSubmit}
          loading={submitting}
          disabled={!selected || submitting}
          buttonColor={libraryColors.terracottaButton}
          textColor={libraryColors.cream}
          style={stepStyles.primaryButton}
          contentStyle={stepStyles.primaryButtonContent}
          labelStyle={stepStyles.primaryButtonLabel}
        >
          Зарегистрироваться
        </Button>
        <Button
          mode="text"
          onPress={() => setMissingDialogVisible(true)}
          disabled={submitting}
          textColor={libraryColors.terracottaButton}
          labelStyle={stepStyles.footerLinkLabel}
        >
          Моего университета нет в списке
        </Button>
      </View>

      <Portal>
        <Dialog visible={missingDialogVisible} onDismiss={() => setMissingDialogVisible(false)}>
          <Dialog.Title>Университета нет в списке</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {regionId
                ? 'Сначала попробуйте поиск по всем регионам: университет может быть привязан к другому региону. '
                : ''}
              Зарегистрироваться без университета пока нельзя. Сообщите администратору название
              вашего университета — когда его добавят, он появится в этом списке.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            {regionId ? (
              <Button
                onPress={() => {
                  setMissingDialogVisible(false);
                  searchAllRegions();
                }}
              >
                Искать по всем регионам
              </Button>
            ) : null}
            <Button onPress={() => setMissingDialogVisible(false)}>Понятно</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedLabel: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 12.5,
    color: libraryColors.inkMuted,
    marginBottom: 4,
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
