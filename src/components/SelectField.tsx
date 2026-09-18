import React, { useState } from 'react';
import { Menu, TextInput } from 'react-native-paper';
import { libraryColors, libraryFonts } from '../theme/library';

export interface SelectOption {
  label: string;
  value: string;
  /** Secondary text shown under the label (e.g. a university's city) — used by `SearchableSelectField`. */
  sublabel?: string;
}

type PaperThemeProp = React.ComponentProps<typeof TextInput>['theme'];

interface Props {
  label: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  /** Shown instead of the option list when `options` is empty (e.g. still loading). */
  emptyLabel?: string;
  /** Per-instance color override for the closed field, mirroring `SearchableSelectField`'s `inputTheme`. */
  inputTheme?: PaperThemeProp;
  /** Renders the closed field as a plain outlined box with no floating label — `label` is still used as the menu's accessible title. */
  hideInlineLabel?: boolean;
  /** Draws the closed field and dropdown menu in the "Library" visual identity (issue #45), matching `SearchableSelectField`'s `libraryStyle`. */
  libraryStyle?: boolean;
}

/**
 * Minimal read-only "select" built on Paper's `Menu` + `TextInput` — Paper has no dedicated
 * select component. Good enough for the short, single-page lists in Фаза 1 (departments, scoped to
 * one university) — for a list large enough to need searching (universities), see
 * `SearchableSelectField` instead.
 */
export function SelectField({
  label,
  value,
  options,
  onChange,
  error,
  disabled,
  emptyLabel = 'Нет доступных вариантов',
  inputTheme,
  hideInlineLabel,
  libraryStyle,
}: Props) {
  const [visible, setVisible] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? '';

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      contentStyle={libraryStyle && styles.menuContentLibrary}
      anchor={
        <TextInput
          label={hideInlineLabel ? undefined : label}
          value={selectedLabel}
          editable={false}
          error={error}
          disabled={disabled}
          mode={libraryStyle ? 'outlined' : undefined}
          theme={inputTheme}
          outlineStyle={libraryStyle && styles.fieldOutlineLibrary}
          style={libraryStyle && styles.fieldInputLibrary}
          right={
            <TextInput.Icon
              icon="menu-down"
              color={libraryStyle ? libraryColors.terracotta : undefined}
              onPress={() => setVisible(true)}
            />
          }
          onPressIn={() => !disabled && setVisible(true)}
        />
      }
    >
      {options.length === 0 ? (
        <Menu.Item title={emptyLabel} disabled titleStyle={libraryStyle && styles.itemTitleLibrary} />
      ) : (
        options.map((option) => (
          <Menu.Item
            key={option.value}
            title={option.label}
            titleStyle={libraryStyle && styles.itemTitleLibrary}
            onPress={() => {
              onChange(option.value);
              setVisible(false);
            }}
          />
        ))
      )}
    </Menu>
  );
}

const styles = {
  fieldOutlineLibrary: {
    borderRadius: 10,
  },
  fieldInputLibrary: {
    backgroundColor: libraryColors.surface,
    fontFamily: libraryFonts.bodyRegular,
  },
  menuContentLibrary: {
    backgroundColor: libraryColors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: libraryColors.border,
  },
  itemTitleLibrary: {
    fontFamily: libraryFonts.bodyRegular,
    color: libraryColors.ink,
  },
} as const;
