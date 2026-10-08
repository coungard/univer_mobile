import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ErrorBanner } from '../../components/ErrorBanner';
import { QueryErrorState } from '../../components/QueryErrorState';
import { libraryColors, libraryFonts } from '../../theme/library';
import { OptionRow, StepHeader, StepSearchInput, stepStyles } from './RegistrationStep';

export interface ChoiceItem {
  id: string;
  title: string;
  subtitle?: string;
}

interface ChoiceStepProps {
  /** 1-based step number for the progress indicator. */
  step: number;
  title: string;
  subtitle: string;
  search?: { value: string; onChangeText: (text: string) => void; placeholder: string };

  /** State of the query behind `items`: loading, failed and empty are three different screens. */
  isPending: boolean;
  loadError: unknown;
  onRetry: () => void;
  items: ChoiceItem[];
  /** Shown instead of the list when it loaded fine but has nothing in it. */
  empty: React.ReactNode;
  onEndReached?: () => void;
  isFetchingMore?: boolean;

  selected: ChoiceItem | null;
  onSelect: (item: ChoiceItem) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
  onDismissSubmitError: () => void;

  /** The way out when the needed entity isn't there or the student doesn't know it yet. */
  skipLabel: string;
  onSkip: () => void;
}

/**
 * One "pick from a list" step of the student setup wizard (PLAN.md): header with progress, optional
 * search, the list in its loading/error/empty/loaded state, and a footer with «Далее» plus the
 * skip link that keeps a missing entity from being a dead end.
 */
export function ChoiceStep({
  step,
  title,
  subtitle,
  search,
  isPending,
  loadError,
  onRetry,
  items,
  empty,
  onEndReached,
  isFetchingMore = false,
  selected,
  onSelect,
  onSubmit,
  submitting,
  submitError,
  onDismissSubmitError,
  skipLabel,
  onSkip,
}: ChoiceStepProps) {
  return (
    <View style={stepStyles.screen}>
      <ErrorBanner message={submitError} onDismiss={onDismissSubmitError} />

      <View style={stepStyles.top}>
        <StepHeader step={step} title={title} subtitle={subtitle} />
        {search && !loadError ? <StepSearchInput {...search} /> : null}
      </View>

      {isPending ? (
        <View style={stepStyles.centered}>
          <ActivityIndicator color={libraryColors.terracotta} />
        </View>
      ) : loadError ? (
        <View style={stepStyles.centered}>
          <QueryErrorState error={loadError} onRetry={onRetry} />
        </View>
      ) : (
        <FlatList
          style={stepStyles.list}
          contentContainerStyle={stepStyles.listContent}
          data={items}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <OptionRow
              title={item.title}
              subtitle={item.subtitle}
              selected={selected?.id === item.id}
              onPress={() => onSelect(item)}
            />
          )}
          ListFooterComponent={isFetchingMore ? <ActivityIndicator color={libraryColors.terracotta} /> : null}
          ListEmptyComponent={<View style={stepStyles.centered}>{empty}</View>}
        />
      )}

      <View style={stepStyles.footer}>
        {selected ? (
          <Text style={styles.selectedLabel} numberOfLines={1}>
            Выбрано: {selected.title}
          </Text>
        ) : null}
        <Button
          mode="contained"
          onPress={onSubmit}
          loading={submitting}
          disabled={!selected || submitting}
          buttonColor={libraryColors.terracottaButton}
          textColor={libraryColors.cream}
          style={stepStyles.primaryButton}
          contentStyle={stepStyles.primaryButtonContent}
          labelStyle={stepStyles.primaryButtonLabel}
        >
          Далее
        </Button>
        <Button
          mode="text"
          onPress={onSkip}
          disabled={submitting}
          textColor={libraryColors.terracottaButton}
          labelStyle={stepStyles.footerLinkLabel}
        >
          {skipLabel}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedLabel: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 12.5,
    color: libraryColors.inkMuted,
    marginBottom: 4,
  },
});
