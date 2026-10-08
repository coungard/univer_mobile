import React, { useState } from 'react';
import { Button } from 'react-native-paper';
import { EmptyState } from '../../components/EmptyState';
import { StudentStackScreenProps } from '../../navigation/types';
import { libraryColors } from '../../theme/library';
import { ChoiceItem, ChoiceStep } from './ChoiceStep';
import { useUniversitiesQuery } from './hooks';
import { useSaveSetupStep } from './studentSetup';

/**
 * Step 3 of student registration (PLAN.md): pick a university — within the region chosen on step
 * 2, or country-wide when there is none. A university missing from the region's list leads to the
 * country-wide search first (it may be filed under another region), and only then out of the wizard.
 */
export function StudentSetupUniversityScreen({ navigation, route }: StudentStackScreenProps<'SetupUniversity'>) {
  const regionId = route.params?.regionId;
  const regionName = route.params?.regionName;

  const [search, setSearch] = useState('');
  const universities = useUniversitiesQuery(search, regionId);
  const [selected, setSelected] = useState<ChoiceItem | null>(null);
  const { save, saving, error, clearError } = useSaveSetupStep(() => {
    setSelected(null);
    universities.refetch();
  });

  const searchAllRegions = () => navigation.setParams({ regionId: undefined, regionName: undefined });

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
                  ? 'Проверьте название.'
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
      onSelect={setSelected}
      onSubmit={onSubmit}
      submitting={saving}
      submitError={error}
      onDismissSubmitError={clearError}
      skipLabel={regionId ? 'Нет в списке — искать по всем регионам' : 'Моего университета нет в списке'}
      onSkip={regionId ? searchAllRegions : () => navigation.navigate('SetupDone')}
    />
  );
}
