import { UseMutationResult } from '@tanstack/react-query';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, SegmentedButtons, Text } from 'react-native-paper';
import { Gender } from '../../api/types';
import { GENDER_OPTIONS, genderSaveErrorText } from './gender';

interface Props {
  value: Gender | null | undefined;
  save: UseMutationResult<unknown, Error, Gender>;
}

/**
 * «Пол» in the student's «Настройки» and on the teacher's profile (issue #92): for those who
 * registered before it was asked, and for fixing a wrong pick. Saved on tap; it can be changed but
 * not cleared — the server answers `null` with `422`, so there's no «not set» option.
 */
export function GenderSetting({ value, save }: Props) {
  const [error, setError] = useState<string | null>(null);

  const onChange = (next: string) => {
    if (save.isPending || next === value) return;
    setError(null);
    save.mutate(next as Gender, { onError: (failure) => setError(genderSaveErrorText(failure)) });
  };

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={save.isPending && save.variables ? save.variables : value ?? ''}
        onValueChange={onChange}
        buttons={GENDER_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
          disabled: save.isPending,
        }))}
      />
      {!value && !error ? (
        <Text variant="bodySmall" style={styles.note}>
          Не указан
        </Text>
      ) : null}
      {error ? (
        <HelperText type="error" style={styles.error}>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  note: {
    opacity: 0.6,
  },
  error: {
    paddingHorizontal: 0,
  },
});
