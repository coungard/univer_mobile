import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Icon } from 'react-native-paper';
import { useAuthStore } from '../../auth/authStore';
import { AccountParamList } from '../../navigation/types';
import { libraryFonts, libraryStyles, useLibraryColors } from '../../theme/library';
import { deleteErrorText, deletionConsequences } from './deleteAccount';
import { useDeleteAccountMutation } from './hooks';

/*
 * «Удалить аккаунт» (issue #86): `DeleteAccountLink` on the profile → `DeleteAccountScreen`. The
 * screen lives in both the student and the teacher stack, so it navigates through `AccountParamList`.
 */

/** The quiet line on a profile. Muted error colour, no button: it's there for whoever looks for it. */
export function DeleteAccountLink({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={styles.link}>
      <Text style={styles.linkText}>Удалить аккаунт</Text>
    </Pressable>
  );
}

/** «Удалить аккаунт?» — what goes with it, that it can't be undone, «Удалить» and «Отмена». */
export function DeleteAccountScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AccountParamList>>();
  const c = useLibraryColors();
  const styles = useStyles();
  const role = useAuthStore((state) => state.role);
  const remove = useDeleteAccountMutation();
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    if (remove.isPending) return;
    setError(null);
    try {
      // On success the session is gone and the login screen replaces this whole stack.
      await remove.mutateAsync();
    } catch (failure) {
      setError(deleteErrorText(failure));
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Удалить аккаунт?</Text>
      <Text style={styles.text}>Вместе с аккаунтом сразу удалится:</Text>

      <View style={styles.list}>
        {deletionConsequences(role === 'TEACHER' ? 'TEACHER' : 'STUDENT').map((item) => (
          <View key={item} style={styles.item}>
            <Icon source="close" size={16} color={c.error} />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.warning}>Это необратимо: восстановить аккаунт и данные не получится.</Text>

      {error ? (
        <View style={styles.error} accessibilityLiveRegion="polite">
          <Icon source="alert-circle-outline" size={18} color={c.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.spacer} />

      <Button
        mode="contained"
        onPress={onDelete}
        loading={remove.isPending}
        disabled={remove.isPending}
        buttonColor={c.error}
        textColor={c.onButton}
        style={styles.button}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
      >
        Удалить
      </Button>
      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        disabled={remove.isPending}
        textColor={c.ink}
        style={[styles.button, styles.cancel]}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
      >
        Отмена
      </Button>
    </ScrollView>
  );
}

const useStyles = libraryStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
  },
  heading: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 26,
    lineHeight: 32,
    color: c.ink,
  },
  text: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
    color: c.ink,
  },
  list: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemText: {
    flex: 1,
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 14.5,
    lineHeight: 20,
    color: c.ink,
    // Lines the first line up with the 16px icon.
    marginTop: -2,
  },
  warning: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 14,
    lineHeight: 20,
    color: c.inkMuted,
  },
  error: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: c.accentTint,
  },
  errorText: {
    flex: 1,
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 20,
    color: c.ink,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 12,
  },
  button: {
    borderRadius: 24,
  },
  cancel: {
    borderColor: c.border,
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 15,
  },
  link: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  linkText: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 13,
    color: c.error,
    opacity: 0.8,
  },
}));
