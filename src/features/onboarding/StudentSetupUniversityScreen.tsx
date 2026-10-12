import React, { useState } from 'react';
import { Button } from 'react-native-paper';
import { EmptyState } from '../../components/EmptyState';
import { StudentStackScreenProps } from '../../navigation/types';
import { libraryColors } from '../../theme/library';
import { useOwnStudentQuery, useUniversityQuery } from '../profile/hooks';
import { ChoiceItem, ChoiceStep } from './ChoiceStep';
import { useUniversitiesQuery } from './hooks';
import { useSaveSetupStep } from './studentSetup';

/**
 * Step 3 of student registration (PLAN.md): pick a university — within the region chosen on step
 * 2, or country-wide when there is none. A university missing from the region's list leads to the
 * country-wide search first (it may be filed under another region), and only then to the request
 * for an administrator to add it.
 */
export function StudentSetupUniversityScreen({ navigation, route }: StudentStackScreenProps<'SetupUniversity'>) {
  // The region of step 2 outlives the filter: the request form is prefilled with it.
  const regionId = route.params?.allRegions ? undefined : route.params?.regionId;
  const regionName = route.params?.allRegions ? undefined : route.params?.regionName;

  const [search, setSearch] = useState('');
  const universities = useUniversitiesQuery(search, regionId);
  const [picked, setPicked] = useState<ChoiceItem | null>(null);
  const { save, saving, error, clearError } = useSaveSetupStep(() => {
    setPicked(null);
    universities.refetch();
  });

  // Until something is picked, the university saved in the profile is the selection — the step is
  // also reached by going back from step 4.
  const student = useOwnStudentQuery();
  const savedId = student.data?.universityId ?? undefined;
  const saved = useUniversityQuery(savedId);
  const selected: ChoiceItem | null =
    picked ?? (savedId && saved.data?.name ? { id: savedId, title: saved.data.name } : null);

  const searchAllRegions = () => navigation.setParams({ allRegions: true });
  const requestUniversity = () =>
    navigation.navigate('SetupUniversityRequest', {
      name: search.trim() || undefined,
      regionId: route.params?.regionId,
      regionName: route.params?.regionName,
    });

  const onSubmit = async () => {
    if (!selected) return;
    if (await save({ universityId: selected.id })) navigation.navigate('SetupFaculty');
  };

  const hasSearch = search.trim().length > 0;

  return (
    <ChoiceStep
      step={3}
      title="Выберите университет"
      subtitle={regionName ? `Регион: ${regionName}` : 'Поиск по всем регионам'}
      search={{ value: search, onChangeText: setSearch, placeholder: 'Название университета' }}
      isPending={universities.isPending}
      loadError={universities.error}
      onRetry={() => universities.refetch()}
      items={(universities.data ?? []).map((u) => ({ id: u.value, title: u.label, subtitle: u.sublabel }))}
      onEndReached={() => {
        if (universities.hasNextPage && !universities.isFetchingNextPage) universities.fetchNextPage();
      }}
      isFetchingMore={universities.isFetchingNextPage}
      empty={
        <>
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
                  ? 'Проверьте название. Если университета нет в списке — оставьте заявку на добавление.'
                  : undefined
            }
          />
          {regionId ? (
            <Button mode="outlined" onPress={searchAllRegions} textColor={libraryColors.terracottaButton}>
              Искать по всем регионам
            </Button>
          ) : null}
        </>
      }
      selected={selected}
      onSelect={setPicked}
      onSubmit={onSubmit}
      submitting={saving}
      submitError={error}
      onDismissSubmitError={clearError}
      skipLabel={regionId ? 'Нет в списке — искать по всем регионам' : 'Моего университета нет в списке'}
      onSkip={regionId ? searchAllRegions : requestUniversity}
    />
  );
}
