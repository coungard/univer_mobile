import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, Text, TextInput, TouchableRipple, useTheme } from 'react-native-paper';
import { TeacherDto } from '../../api/types';
import { matchTeachers, teacherDisplayName } from './teacherName';

interface Props {
  name: string;
  /** Set while the name is a registered teacher picked from the suggestions; `''` for a typed name. */
  teacherId: string;
  teachers: readonly TeacherDto[];
  onChange: (value: { name: string; teacherId: string }) => void;
  error?: string;
}

/**
 * «Преподаватель (необязательно)» of the pair form (issue #68): any name typed in, or one of the
 * faculty's registered teachers suggested under the field as it is typed. Picking a suggestion links
 * the pair to that teacher; typing over it makes the name plain text again (univer#104).
 */
export function TeacherField({ name, teacherId, teachers, onChange, error }: Props) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const suggestions = focused && !teacherId ? matchTeachers(teachers, name) : [];

  return (
    <View>
      <TextInput
        label="Преподаватель (необязательно)"
        value={name}
        onChangeText={(text) => onChange({ name: text, teacherId: '' })}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        error={!!error}
        right={
          name ? (
            <TextInput.Icon
              icon="close"
              accessibilityLabel="Очистить"
              onPress={() => onChange({ name: '', teacherId: '' })}
            />
          ) : undefined
        }
      />
      {suggestions.length > 0 ? (
        <View style={[styles.list, { borderColor: theme.colors.outlineVariant }]}>
          {suggestions.map((teacher) => (
            <TouchableRipple
              key={teacher.id}
              onPress={() => onChange({ name: teacherDisplayName(teacher), teacherId: teacher.id })}
              style={styles.item}
              accessibilityRole="button"
            >
              <View>
                <Text variant="bodyMedium">{teacherDisplayName(teacher)}</Text>
                {teacher.position ? <Text style={styles.muted}>{teacher.position}</Text> : null}
              </View>
            </TouchableRipple>
          ))}
        </View>
      ) : null}
      <HelperText type={error ? 'error' : 'info'} visible={!!error || !!teacherId}>
        {error ?? 'Преподаватель факультета'}
      </HelperText>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  muted: {
    opacity: 0.6,
  },
});
