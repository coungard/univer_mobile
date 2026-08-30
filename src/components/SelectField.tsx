import React, { useState } from 'react';
import { Menu, TextInput } from 'react-native-paper';

export interface SelectOption {
  label: string;
  value: string;
}

interface Props {
  label: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  /** Shown instead of the option list when `options` is empty (e.g. still loading). */
  emptyLabel?: string;
}

/**
 * Minimal read-only "select" built on Paper's `Menu` + `TextInput` — Paper has no dedicated
 * select component. Good enough for the short, single-page lists in Фаза 1 (universities,
 * departments); a searchable/paginated version can replace it once those lists grow.
 */
export function SelectField({
  label,
  value,
  options,
  onChange,
  error,
  disabled,
  emptyLabel = 'Нет доступных вариантов',
}: Props) {
  const [visible, setVisible] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? '';

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <TextInput
          label={label}
          value={selectedLabel}
          editable={false}
          error={error}
          disabled={disabled}
          right={<TextInput.Icon icon="menu-down" onPress={() => setVisible(true)} />}
          onPressIn={() => !disabled && setVisible(true)}
        />
      }
    >
      {options.length === 0 ? (
        <Menu.Item title={emptyLabel} disabled />
      ) : (
        options.map((option) => (
          <Menu.Item
            key={option.value}
            title={option.label}
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
