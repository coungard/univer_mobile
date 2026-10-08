import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { libraryColors, libraryFonts, librarySpineColors } from '../../theme/library';

/** Steps of student registration, in order (PLAN.md). The progress indicator derives from this. */
export const STUDENT_REGISTRATION_STEPS = [
  'Личные данные',
  'Регион',
  'Университет',
  'Факультет',
  'Курс',
  'Группа',
] as const;

interface StepProgressProps {
  /** 1-based index into `STUDENT_REGISTRATION_STEPS`. */
  step: number;
}

/** "Шаг N из M" with one book-spine-colored segment per step, filled up to the current one. */
export function StepProgress({ step }: StepProgressProps) {
  const total = STUDENT_REGISTRATION_STEPS.length;
  return (
    <View style={styles.progress} accessibilityLabel={`Шаг ${step} из ${total}`}>
      <View style={styles.progressSegments}>
        {STUDENT_REGISTRATION_STEPS.map((name, index) => (
          <View
            key={name}
            style={[
              styles.progressSegment,
              index < step && { backgroundColor: librarySpineColors[index % librarySpineColors.length] },
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressLabel}>
        Шаг {step} из {total} · {STUDENT_REGISTRATION_STEPS[step - 1]}
      </Text>
    </View>
  );
}

interface StepHeaderProps extends StepProgressProps {
  title: string;
  subtitle: string;
}

export function StepHeader({ step, title, subtitle }: StepHeaderProps) {
  return (
    <View style={styles.header}>
      <StepProgress step={step} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

interface StepSearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

export function StepSearchInput({ value, onChangeText, placeholder }: StepSearchInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      autoCapitalize="none"
      autoCorrect={false}
      mode="outlined"
      left={<TextInput.Icon icon="magnify" color={libraryColors.inkMuted} />}
      theme={{
        colors: {
          primary: libraryColors.terracottaButton,
          outline: libraryColors.border,
          background: libraryColors.surface,
          onSurfaceVariant: libraryColors.inkMuted,
          onSurface: libraryColors.ink,
        },
      }}
      outlineStyle={styles.searchOutline}
      style={styles.searchInput}
    />
  );
}

interface OptionRowProps {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onPress: () => void;
}

/** One tappable choice in the list of a step. */
export function OptionRow({ title, subtitle, selected = false, onPress }: OptionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.optionPressed]}
    >
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.optionMark}>{selected ? '✓' : '›'}</Text>
    </Pressable>
  );
}

/** Layout shared by the step screens (everything around the step-specific list). */
export const stepStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: libraryColors.background,
  },
  top: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: libraryColors.border,
  },
  footerLinkLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 13,
  },
  primaryButton: {
    borderRadius: 12,
  },
  primaryButtonContent: {
    height: 52,
  },
  primaryButtonLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 15,
  },
});

const styles = StyleSheet.create({
  progress: {
    gap: 6,
  },
  progressSegments: {
    flexDirection: 'row',
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: libraryColors.border,
  },
  progressLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: libraryColors.inkMuted,
  },
  header: {
    gap: 4,
  },
  title: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 22,
    color: libraryColors.ink,
    marginTop: 8,
  },
  subtitle: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 12.5,
    color: libraryColors.inkMuted,
  },
  searchOutline: {
    borderRadius: 10,
  },
  searchInput: {
    backgroundColor: libraryColors.surface,
    fontFamily: libraryFonts.bodyRegular,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: libraryColors.border,
    backgroundColor: libraryColors.surface,
  },
  optionSelected: {
    borderColor: libraryColors.terracotta,
    backgroundColor: 'rgba(116, 47, 37, 0.07)',
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 14.5,
    color: libraryColors.ink,
  },
  optionSubtitle: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 12.5,
    color: libraryColors.inkMuted,
  },
  optionMark: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 18,
    color: libraryColors.terracotta,
  },
});
