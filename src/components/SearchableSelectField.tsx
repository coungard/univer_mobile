import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Divider, IconButton, List, Modal, Portal, Searchbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SelectOption } from './SelectField';

interface Props {
  label: string;
  value: string | null;
  /** Currently loaded page(s) of results for `searchText` — not the full universe of options. */
  options: SelectOption[];
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onChange: (value: string) => void;
  /** Initial load of the first page for the current search text — shown in place of the empty list. */
  loading?: boolean;
  /** Fetching a further page — shown as a footer spinner below the current results. */
  loadingMore?: boolean;
  /** More pages exist for the current search — wire up `onEndReached`. */
  hasMore?: boolean;
  onEndReached?: () => void;
  error?: boolean;
  disabled?: boolean;
  emptyLabel?: string;
}

/**
 * Full-screen searchable picker for lists too large for `SelectField`'s plain dropdown (e.g.
 * universities) — a `Searchbar` drives a server-side search (the caller's query hook debounces and
 * re-fetches), and results page in via `onEndReached` as the list is scrolled, instead of loading
 * everything up front.
 */
export function SearchableSelectField({
  label,
  value,
  options,
  searchText,
  onSearchTextChange,
  onChange,
  loading,
  loadingMore,
  hasMore,
  onEndReached,
  error,
  disabled,
  emptyLabel = 'Ничего не найдено',
}: Props) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  // Kept independently of `options` so the closed field still shows the chosen university once
  // further typing changes the search results out from under it.
  const [selected, setSelected] = useState(() => options.find((option) => option.value === value) ?? null);
  const selectedText = selected ? [selected.label, selected.sublabel].filter(Boolean).join(' — ') : '';

  const open = () => {
    if (disabled) return;
    onSearchTextChange('');
    setVisible(true);
  };

  const select = (option: SelectOption) => {
    setSelected(option);
    onChange(option.value);
    setVisible(false);
  };

  return (
    <>
      <TextInput
        label={label}
        value={selectedText}
        editable={false}
        error={error}
        disabled={disabled}
        right={<TextInput.Icon icon="magnify" onPress={open} />}
        onPressIn={open}
      />

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
        >
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.headerTitle}>
              {label}
            </Text>
            <IconButton icon="close" onPress={() => setVisible(false)} />
          </View>
          <Searchbar
            placeholder="Поиск…"
            value={searchText}
            onChangeText={onSearchTextChange}
            autoFocus
            style={styles.searchbar}
          />
          <FlatList
            data={options}
            keyExtractor={(option) => option.value}
            ItemSeparatorComponent={Divider}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              if (hasMore && !loadingMore) onEndReached?.();
            }}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator style={styles.stateIndicator} />
              ) : (
                <Text style={styles.emptyText}>{emptyLabel}</Text>
              )
            }
            ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.stateIndicator} /> : null}
            renderItem={({ item }) => (
              <List.Item title={item.label} description={item.sublabel} onPress={() => select(item)} />
            )}
          />
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    marginTop: 48,
    marginHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    flex: 1,
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  stateIndicator: {
    marginVertical: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 24,
    opacity: 0.7,
  },
});
