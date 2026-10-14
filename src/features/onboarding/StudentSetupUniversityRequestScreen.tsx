import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, Text, View } from 'react-native';
import { Button, IconButton, Modal, Portal } from 'react-native-paper';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { QueryErrorState } from '../../components/QueryErrorState';
import { StudentStackScreenProps } from '../../navigation/types';
import { libraryFonts, libraryStyles, useLibraryColors } from '../../theme/library';
import { useOwnStudentQuery } from '../profile/hooks';
import {
  useOwnUniversityRequestQuery,
  useRegionsQuery,
  useSubmitUniversityRequestMutation,
  useUpdateOwnStudentMutation,
} from './hooks';
import { OptionRow, StepHeader, StepSearchInput, StepTextField, useStepStyles } from './RegistrationStep';

const NAME_MAX_LENGTH = 255;

interface Region {
  id: string;
  name: string;
}

/**
 * The way out of step 3 when the university isn't in the catalog (PLAN_FINISHED_01.MD, сценарий 1): students
 * don't create universities, they leave a request for an administrator to add one. A request that
 * is still pending is edited rather than duplicated, so the form opens with its data.
 */
export function StudentSetupUniversityRequestScreen({
  navigation,
  route,
}: StudentStackScreenProps<'SetupUniversityRequest'>) {
  const c = useLibraryColors();
  const stepStyles = useStepStyles();
  const student = useOwnStudentQuery();
  const request = useOwnUniversityRequestQuery();

  if (student.isPending || request.isPending) {
    return (
      <View style={[stepStyles.screen, stepStyles.centered]}>
        <ActivityIndicator color={c.terracotta} />
      </View>
    );
  }

  if (student.isError || request.isError) {
    return (
      <View style={[stepStyles.screen, stepStyles.centered]}>
        <QueryErrorState
          error={student.error ?? request.error}
          onRetry={() => {
            if (student.isError) student.refetch();
            if (request.isError) request.refetch();
          }}
        />
      </View>
    );
  }

  const pending = request.data?.status === 'PENDING' ? request.data : null;
  const initialRegion: Region | null = pending
    ? pending.regionId
      ? { id: pending.regionId, name: pending.regionName ?? '' }
      : null
    : route.params?.regionId
      ? { id: route.params.regionId, name: route.params.regionName ?? '' }
      : null;

  return (
    <RequestForm
      initialName={pending?.name ?? route.params?.name ?? ''}
      initialRegion={initialRegion}
      isUpdate={!!pending}
      hasUniversity={!!student.data.universityId}
      onSubmitted={(name) => navigation.replace('SetupDone', { requestedUniversity: name })}
      onSkip={() => navigation.navigate('SetupDone')}
    />
  );
}

interface RequestFormProps {
  initialName: string;
  initialRegion: Region | null;
  /** A pending request exists — the form edits it. */
  isUpdate: boolean;
  /** The profile has a university: the server takes a request only after it is cleared. */
  hasUniversity: boolean;
  onSubmitted: (name: string) => void;
  onSkip: () => void;
}

function RequestForm({ initialName, initialRegion, isUpdate, hasUniversity, onSubmitted, onSkip }: RequestFormProps) {
  const c = useLibraryColors();
  const stepStyles = useStepStyles();
  const styles = useStyles();
  const [name, setName] = useState(initialName);
  const [region, setRegion] = useState<Region | null>(initialRegion);
  const [pickingRegion, setPickingRegion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useSubmitUniversityRequestMutation();
  const update = useUpdateOwnStudentMutation();
  const busy = submit.isPending || update.isPending;
  const trimmedName = name.trim();

  const send = async (clearUniversity: boolean) => {
    setError(null);
    try {
      if (clearUniversity) await update.mutateAsync({ universityId: null });
      // The region is sent every time: one left out of the body is cleared on the server.
      await submit.mutateAsync({ name: trimmedName, regionId: region?.id });
      onSubmitted(trimmedName);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить заявку. Попробуйте ещё раз.');
    }
  };

  const onSubmit = () => {
    if (!trimmedName || busy) return;
    if (!hasUniversity) {
      send(false);
      return;
    }
    Alert.alert(
      'Сбросить текущий университет?',
      'Текущий университет, факультет, курс и группа будут сброшены. Расписания не будет, пока университет не добавят.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Сбросить и отправить', style: 'destructive', onPress: () => send(true) },
      ],
    );
  };

  return (
    <View style={stepStyles.screen}>
      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <StepHeader
          step={3}
          title="Заявка на добавление университета"
          subtitle="Университеты добавляет администратор. Оставьте заявку — мы добавим ваш университет, и вы продолжите настройку"
        />

        <StepTextField
          label="Название университета"
          value={name}
          onChangeText={setName}
          placeholder="Полное или краткое название"
          maxLength={NAME_MAX_LENGTH}
          autoCapitalize="sentences"
        />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Регион (необязательно)</Text>
          <View style={styles.regionBox}>
            <Text style={[styles.regionText, !region && styles.regionTextEmpty]} numberOfLines={2}>
              {region ? region.name : 'Не указан'}
            </Text>
            <Button
              mode="text"
              compact
              onPress={() => setPickingRegion(true)}
              disabled={busy}
              textColor={c.terracottaButton}
            >
              {region ? 'Изменить' : 'Выбрать'}
            </Button>
            {region ? (
              <Button
                mode="text"
                compact
                onPress={() => setRegion(null)}
                disabled={busy}
                textColor={c.inkMuted}
              >
                Убрать
              </Button>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View style={stepStyles.footer}>
        <Button
          mode="contained"
          onPress={onSubmit}
          loading={busy}
          disabled={!trimmedName || busy}
          buttonColor={c.terracottaButton}
          textColor={c.onButton}
          style={stepStyles.primaryButton}
          contentStyle={stepStyles.primaryButtonContent}
          labelStyle={stepStyles.primaryButtonLabel}
        >
          {isUpdate ? 'Обновить заявку' : 'Отправить заявку'}
        </Button>
        <Button
          mode="text"
          onPress={onSkip}
          disabled={busy}
          textColor={c.terracottaButton}
          labelStyle={stepStyles.footerLinkLabel}
        >
          {isUpdate ? 'Оставить как есть' : 'Завершить без заявки'}
        </Button>
      </View>

      <RegionPicker
        visible={pickingRegion}
        onDismiss={() => setPickingRegion(false)}
        onPick={(picked) => {
          setRegion(picked);
          setPickingRegion(false);
        }}
      />
    </View>
  );
}

interface RegionPickerProps {
  visible: boolean;
  onDismiss: () => void;
  onPick: (region: Region) => void;
}

/** The region list of step 2 in a modal — for a student who reached the form without a region. */
function RegionPicker({ visible, onDismiss, onPick }: RegionPickerProps) {
  const c = useLibraryColors();
  const stepStyles = useStepStyles();
  const styles = useStyles();
  const regions = useRegionsQuery();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) setSearch('');
  }, [visible]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const all = regions.data ?? [];
    return needle ? all.filter((region) => (region.name ?? '').toLowerCase().includes(needle)) : all;
  }, [regions.data, search]);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Регион</Text>
          <IconButton icon="close" iconColor={c.terracotta} onPress={onDismiss} />
        </View>
        {regions.isPending ? (
          <View style={stepStyles.centered}>
            <ActivityIndicator color={c.terracotta} />
          </View>
        ) : regions.isError ? (
          <View style={stepStyles.centered}>
            <QueryErrorState error={regions.error} onRetry={() => regions.refetch()} />
          </View>
        ) : (
          <>
            <View style={styles.modalSearch}>
              <StepSearchInput value={search} onChangeText={setSearch} placeholder="Поиск региона" />
            </View>
            <FlatList
              style={stepStyles.list}
              contentContainerStyle={stepStyles.listContent}
              data={filtered}
              keyExtractor={(region) => region.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <OptionRow
                  title={item.name ?? 'Без названия'}
                  onPress={() => onPick({ id: item.id, name: item.name ?? '' })}
                />
              )}
              ListEmptyComponent={<EmptyState title="Регион не найден" description="Проверьте название." />}
            />
          </>
        )}
      </Modal>
    </Portal>
  );
}

const useStyles = libraryStyles((c) => ({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: c.inkMuted,
  },
  regionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  regionText: {
    flex: 1,
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 14,
    color: c.ink,
  },
  regionTextEmpty: {
    color: c.inkMuted,
  },
  modal: {
    flex: 1,
    marginHorizontal: 12,
    marginVertical: 48,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: c.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 4,
  },
  modalTitle: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 18,
    color: c.ink,
  },
  modalSearch: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
}));
