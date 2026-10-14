import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { libraryFonts, libraryStyles, useLibraryColors, useLibraryFieldTheme } from '../../theme/library';

/** Steps of student registration, in order (PLAN_FINISHED_01.MD). The progress indicator derives from this. */
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
  const styles = useStyles();
  const { spines } = useLibraryColors();
  const total = STUDENT_REGISTRATION_STEPS.length;
  return (
    <View style={styles.progress} accessibilityLabel={`Шаг ${step} из ${total}`}>
      <View style={styles.progressSegments}>
        {STUDENT_REGISTRATION_STEPS.map((name, index) => (
          <View
            key={name}
            style={[
              styles.progressSegment,
              index < step && { backgroundColor: spines[index % spines.length] },
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
  const styles = useStyles();
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
  const styles = useStyles();
  const c = useLibraryColors();
  const fieldTheme = useLibraryFieldTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      autoCapitalize="none"
      autoCorrect={false}
      mode="outlined"
      left={<TextInput.Icon icon="magnify" color={c.inkMuted} />}
      theme={fieldTheme}
      outlineStyle={styles.searchOutline}
      style={styles.searchInput}
    />
  );
}

interface StepTextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
  /** Shown under the field, which is then outlined as invalid. */
  errorText?: string;
}

/** A labelled text field for the forms of the wizard (creating a group, a faculty, ...). */
export function StepTextField({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  autoCapitalize,
  errorText,
}: StepTextFieldProps) {
  const styles = useStyles();
  const fieldTheme = useLibraryFieldTheme();
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        mode="outlined"
        error={!!errorText}
        theme={fieldTheme}
        outlineStyle={styles.searchOutline}
        style={styles.searchInput}
      />
      {errorText ? (
        <HelperText type="error" visible theme={fieldTheme} style={styles.fieldError}>
          {errorText}
        </HelperText>
      ) : null}
    </View>
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
  const styles = useStyles();
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

/** Layout shared by the step screens (everything around the step-specific list), for the current theme. */
export const useStepStyles = libraryStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
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
    borderTopColor: c.border,
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
}));

const useStyles = libraryStyles((c) => ({
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
    backgroundColor: c.border,
  },
  progressLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: c.inkMuted,
  },
  header: {
    gap: 4,
  },
  title: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 22,
    color: c.ink,
    marginTop: 8,
  },
  subtitle: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 12.5,
    color: c.inkMuted,
  },
  searchOutline: {
    borderRadius: 10,
  },
  searchInput: {
    backgroundColor: c.surface,
    fontFamily: libraryFonts.bodyRegular,
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
  fieldError: {
    marginTop: -6,
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
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  optionSelected: {
    borderColor: c.terracotta,
    backgroundColor: c.accentTint,
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
    color: c.ink,
  },
  optionSubtitle: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 12.5,
    color: c.inkMuted,
  },
  optionMark: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 18,
    color: c.terracotta,
  },
}));
