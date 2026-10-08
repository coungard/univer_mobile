import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { Button } from 'react-native-paper';
import { RegionDto } from '../../api/types';
import { EmptyState } from '../../components/EmptyState';
import { QueryErrorState } from '../../components/QueryErrorState';
import { AuthStackParamList } from '../../navigation/types';
import { libraryColors } from '../../theme/library';
import { useRegionsQuery } from './hooks';
import { OptionRow, StepHeader, StepSearchInput, stepStyles } from './RegistrationStep';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterStudentRegion'>;

/**
 * Step 2 of student registration (PLAN.md): pick a region to narrow the university list. The
 * region is only a filter, so "not in the list" — and a failed load — still lead on to the
 * university step, just unfiltered, instead of dead-ending the wizard here.
 */
export function RegisterStudentRegionScreen({ navigation }: Props) {
  const regions = useRegionsQuery();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const all = regions.data ?? [];
    return needle ? all.filter((region) => (region.name ?? '').toLowerCase().includes(needle)) : all;
  }, [regions.data, search]);

  const goToUniversities = (region?: RegionDto) =>
    navigation.navigate(
      'RegisterStudentUniversity',
      region ? { regionId: region.id, regionName: region.name ?? '' } : undefined,
    );

  return (
    <View style={stepStyles.screen}>
      <View style={stepStyles.top}>
        <StepHeader
          step={2}
          title="Выберите регион"
          subtitle="Покажем университеты только этого региона"
        />
        {regions.isSuccess ? (
          <StepSearchInput value={search} onChangeText={setSearch} placeholder="Поиск региона" />
        ) : null}
      </View>

      {regions.isPending ? (
        <View style={stepStyles.centered}>
          <ActivityIndicator color={libraryColors.terracotta} />
        </View>
      ) : regions.isError ? (
        <View style={stepStyles.centered}>
          <QueryErrorState error={regions.error} onRetry={() => regions.refetch()} />
        </View>
      ) : (
        <FlatList
          style={stepStyles.list}
          contentContainerStyle={stepStyles.listContent}
          data={filtered}
          keyExtractor={(region) => region.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <OptionRow title={item.name ?? 'Без названия'} onPress={() => goToUniversities(item)} />
          )}
          ListEmptyComponent={
            <EmptyState
              title="Регион не найден"
              description="Проверьте название или ищите университет по всем регионам."
            />
          }
        />
      )}

      <View style={stepStyles.footer}>
        <Button
          mode="text"
          onPress={() => goToUniversities()}
          textColor={libraryColors.terracottaButton}
          labelStyle={stepStyles.footerLinkLabel}
        >
          {regions.isError ? 'Искать университет по всем регионам' : 'Моего региона нет в списке'}
        </Button>
      </View>
    </View>
  );
}
