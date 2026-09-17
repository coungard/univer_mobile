import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Divider, IconButton, List, Modal, Portal, Searchbar, Text, TextInput, useTheme } from 'react-native-paper';
import { libraryColors, libraryFonts } from '../theme/library';
import { SelectOption } from './SelectField';

type PaperThemeProp = React.ComponentProps<typeof TextInput>['theme'];

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
  /**
   * Per-instance color/font override for the closed field and the search bar, e.g. a screen with
   * its own brand palette (`RegisterStudentScreen`'s "Library" identity). Leave unset to keep the
   * app's ambient theme — other callers (`RegisterTeacherScreen`) are unaffected either way.
   */
  inputTheme?: PaperThemeProp;
  /**
   * Renders the closed field as a plain outlined box with no floating label, for screens that
   * draw their own label above the field instead. `label` is still used for the modal's header
   * title regardless.
   */
  hideInlineLabel?: boolean;
  /**
   * Draws the modal (header, search bar, list) in the "Library" visual identity (issue #44) to
   * match the rest of `RegisterStudentScreen`, instead of the app's default Paper look.
   */
  libraryStyle?: boolean;
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
  inputTheme,
  hideInlineLabel,
  libraryStyle,
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
        label={hideInlineLabel ? undefined : label}
        value={selectedText}
        editable={false}
        error={error}
        disabled={disabled}
        mode={libraryStyle ? 'outlined' : undefined}
        theme={inputTheme}
        outlineStyle={libraryStyle && styles.fieldOutlineLibrary}
        style={libraryStyle && styles.fieldInputLibrary}
        right={
          <TextInput.Icon
            icon="magnify"
            color={libraryStyle ? libraryColors.terracotta : undefined}
            onPress={open}
          />
        }
        onPressIn={open}
      />

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: libraryStyle ? libraryColors.background : theme.colors.background },
            libraryStyle && styles.modalLibrary,
          ]}
        >
          <View style={[styles.header, libraryStyle && styles.headerLibrary]}>
            <Text
              variant="titleMedium"
              style={[styles.headerTitle, libraryStyle && styles.headerTitleLibrary]}
            >
              {label}
            </Text>
            <IconButton
              icon="close"
              iconColor={libraryStyle ? libraryColors.terracotta : undefined}
              onPress={() => setVisible(false)}
            />
          </View>
          <Searchbar
            placeholder="Поиск…"
            value={searchText}
            onChangeText={onSearchTextChange}
            autoFocus
            style={[styles.searchbar, libraryStyle && styles.searchbarLibrary]}
            inputStyle={libraryStyle && styles.searchbarInputLibrary}
            iconColor={libraryStyle ? libraryColors.terracotta : undefined}
            placeholderTextColor={libraryStyle ? libraryColors.inkFaint : undefined}
            theme={inputTheme}
          />
          <FlatList
            data={options}
            keyExtractor={(option) => option.value}
            ItemSeparatorComponent={() => (
              <Divider style={libraryStyle && styles.dividerLibrary} />
            )}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              if (hasMore && !loadingMore) onEndReached?.();
            }}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator
                  style={styles.stateIndicator}
                  color={libraryStyle ? libraryColors.terracotta : undefined}
                />
              ) : (
                <Text style={[styles.emptyText, libraryStyle && styles.emptyTextLibrary]}>{emptyLabel}</Text>
              )
            }
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator
                  style={styles.stateIndicator}
                  color={libraryStyle ? libraryColors.terracotta : undefined}
                />
              ) : null
            }
            renderItem={({ item }) => (
              <List.Item
                title={item.label}
                description={item.sublabel}
                onPress={() => select(item)}
                titleStyle={libraryStyle && styles.itemTitleLibrary}
                descriptionStyle={libraryStyle && styles.itemDescriptionLibrary}
              />
            )}
          />
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  fieldOutlineLibrary: {
    borderRadius: 10,
  },
  fieldInputLibrary: {
    backgroundColor: libraryColors.surface,
    fontFamily: libraryFonts.bodyRegular,
  },
  modal: {
    flex: 1,
    marginTop: 48,
    marginHorizontal: 0,
  },
  modalLibrary: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLibrary: {
    paddingTop: 12,
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleLibrary: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 18,
    color: libraryColors.ink,
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchbarLibrary: {
    backgroundColor: libraryColors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: libraryColors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  searchbarInputLibrary: {
    fontFamily: libraryFonts.bodyRegular,
    color: libraryColors.ink,
  },
  dividerLibrary: {
    backgroundColor: libraryColors.border,
  },
  stateIndicator: {
    marginVertical: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 24,
    opacity: 0.7,
  },
  emptyTextLibrary: {
    fontFamily: libraryFonts.bodyRegular,
    color: libraryColors.inkMuted,
    opacity: 1,
  },
  itemTitleLibrary: {
    fontFamily: libraryFonts.bodyBold,
    color: libraryColors.ink,
  },
  itemDescriptionLibrary: {
    fontFamily: libraryFonts.bodyRegular,
    color: libraryColors.inkMuted,
  },
});
