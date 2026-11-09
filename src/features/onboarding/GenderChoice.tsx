import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gender } from '../../api/types';
import { libraryFonts, libraryStyles } from '../../theme/library';
import { GENDER_OPTIONS } from '../profile/gender';

interface Props {
  value: Gender | undefined;
  onChange: (value: Gender) => void;
  error?: boolean;
}

/**
 * «Пол» on both registration screens (issue #92): two options side by side rather than a dropdown —
 * there are only two. A picked one takes the terracotta border on its tint, like a wizard choice.
 */
export function GenderChoice({ value, onChange, error }: Props) {
  const styles = useStyles();
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {GENDER_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              error && styles.optionError,
              selected && styles.optionSelected,
              pressed && styles.optionPressed,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = libraryStyles((c) => ({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionError: {
    borderColor: c.error,
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: c.terracotta,
    backgroundColor: c.accentTint,
  },
  optionPressed: {
    opacity: 0.7,
  },
  label: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 15,
    color: c.ink,
  },
  labelSelected: {
    fontFamily: libraryFonts.bodyBold,
    color: c.terracotta,
  },
}));
