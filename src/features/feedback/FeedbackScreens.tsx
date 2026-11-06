import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, HelperText, Icon, TextInput, useTheme } from 'react-native-paper';
import { version } from '../../../package.json';
import { FeedbackType } from '../../api/types';
import { FeedbackParamList } from '../../navigation/types';
import { libraryFonts, libraryStyles, LibraryPalette, useLibraryColors, useLibraryFieldTheme } from '../../theme/library';
import {
  deviceInfo,
  deviceLine,
  FEEDBACK_KINDS,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  feedbackKind,
  feedbackMessageSchema,
  submitErrorText,
} from './feedback';
import { useSubmitFeedbackMutation } from './hooks';

/*
 * «Оставить отзыв» (issue #82), artboard 09 of https://claude.ai/artifact/3gHQb2x1tZeST3hi8AqFQm:
 * `FeedbackLink` on the profile → `FeedbackTypeScreen` → `FeedbackMessageScreen` → `FeedbackSentScreen`.
 * The screens live in both the student and the teacher stack, so they navigate through
 * `FeedbackParamList` rather than either stack's own list.
 */

type Navigation = NativeStackNavigationProp<FeedbackParamList>;

const DEVICE = deviceInfo(
  version,
  Platform.OS,
  Platform.OS === 'android' ? (Platform.constants as { Release?: string }).Release ?? Platform.Version : Platform.Version,
);

/** Icon and tint of each kind: terracotta, gold and sage, like the spines. */
function kindColors(type: FeedbackType, c: LibraryPalette, dark: boolean): { icon: string; tint: string } {
  switch (type) {
    case 'BUG':
      return { icon: c.terracotta, tint: c.accentTint };
    case 'IMPROVEMENT':
      // The spine gold is too light for an icon on cream — a darker gold keeps the contrast.
      return { icon: dark ? c.gold : '#8A6420', tint: dark ? 'rgba(227, 184, 102, 0.14)' : 'rgba(197, 149, 59, 0.18)' };
    case 'IDEA':
      return { icon: c.sage, tint: dark ? 'rgba(143, 192, 154, 0.14)' : 'rgba(41, 82, 51, 0.09)' };
  }
}

/** The quiet line at the bottom of a profile: «Нашли ошибку или есть идеи? Напишите нам». */
export function FeedbackLink({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Нашли ошибку или есть идеи? Напишите нам"
      onPress={onPress}
      hitSlop={8}
      style={styles.link}
    >
      <Text style={styles.linkText}>
        Нашли ошибку или есть идеи? <Text style={styles.linkAccent}>Напишите нам</Text>
      </Text>
    </Pressable>
  );
}

/** «Что вы хотите рассказать?» — three kinds, each opens the text screen. */
export function FeedbackTypeScreen() {
  const navigation = useNavigation<Navigation>();
  const c = useLibraryColors();
  const dark = useTheme().dark;
  const styles = useStyles();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Что вы хотите рассказать?</Text>
      {FEEDBACK_KINDS.map((kind) => {
        const colors = kindColors(kind.type, c, dark);
        return (
          <Pressable
            key={kind.type}
            accessibilityRole="button"
            accessibilityHint={kind.subtitle}
            onPress={() => navigation.navigate('FeedbackMessage', { type: kind.type })}
            style={({ pressed }) => [styles.kind, pressed && styles.kindPressed]}
          >
            <View style={[styles.kindIcon, { backgroundColor: colors.tint }]}>
              <Icon source={kind.icon} size={22} color={colors.icon} />
            </View>
            <View style={styles.kindText}>
              <Text style={styles.kindTitle}>{kind.title}</Text>
              <Text style={styles.kindSubtitle}>{kind.subtitle}</Text>
            </View>
            <Icon source="chevron-right" size={20} color={c.inkMuted} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/**
 * The header title of the text screen: a chip saying which kind is being written. One component per
 * kind, made once: the native header renders outside the screen's route, so it can't `useRoute`.
 */
export const FEEDBACK_MESSAGE_TITLES: Record<FeedbackType, () => React.ReactElement> = {
  BUG: () => <FeedbackKindChip type="BUG" />,
  IMPROVEMENT: () => <FeedbackKindChip type="IMPROVEMENT" />,
  IDEA: () => <FeedbackKindChip type="IDEA" />,
};

function FeedbackKindChip({ type }: { type: FeedbackType }) {
  const c = useLibraryColors();
  const dark = useTheme().dark;
  const styles = useStyles();
  const colors = kindColors(type, c, dark);
  return (
    <View style={[styles.chip, { backgroundColor: colors.tint }]}>
      <Text style={[styles.chipText, { color: colors.icon }]}>{feedbackKind(type).chip}</Text>
    </View>
  );
}

/** The text of the feedback and «Отправить». A failure keeps the text and says why. */
export function FeedbackMessageScreen() {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<RouteProp<FeedbackParamList, 'FeedbackMessage'>>();
  const kind = feedbackKind(params.type);
  const c = useLibraryColors();
  const styles = useStyles();
  const fieldTheme = useLibraryFieldTheme();
  const submit = useSubmitFeedbackMutation();
  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const onSend = async () => {
    if (submit.isPending) return;
    const parsed = feedbackMessageSchema.safeParse(message);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Проверьте текст отзыва.');
      return;
    }
    setFieldError(null);
    setSendError(null);
    try {
      await submit.mutateAsync({ type: kind.type, message: parsed.data, ...DEVICE });
      // «Спасибо!» takes the place of both feedback screens, so back from it leads to the profile.
      navigation.dispatch((state) => {
        const routes = state.routes.filter((route) => route.name !== 'Feedback' && route.name !== 'FeedbackMessage');
        return CommonActions.reset({
          ...state,
          routes: [...routes, { key: `FeedbackSent-${Date.now()}`, name: 'FeedbackSent' }],
          index: routes.length,
        });
      });
    } catch (error) {
      setSendError(submitErrorText(error));
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={styles.question}>{kind.question}</Text>
      <Text style={styles.hint}>{kind.hint}</Text>

      <View style={styles.field}>
        <TextInput
          label="Описание"
          value={message}
          onChangeText={(text) => {
            setMessage(text);
            if (fieldError) setFieldError(null);
          }}
          mode="outlined"
          multiline
          maxLength={FEEDBACK_MESSAGE_MAX_LENGTH}
          autoCapitalize="sentences"
          error={!!fieldError}
          theme={fieldTheme}
          outlineStyle={styles.fieldOutline}
          style={styles.input}
          contentStyle={styles.inputContent}
        />
        <View style={styles.fieldFooter}>
          <HelperText type="error" visible={!!fieldError} theme={fieldTheme} style={styles.fieldError}>
            {fieldError ?? ''}
          </HelperText>
          <Text style={styles.counter}>
            {message.length} / {FEEDBACK_MESSAGE_MAX_LENGTH}
          </Text>
        </View>
      </View>

      <Text style={styles.device}>Отзыв подписан вашим аккаунтом. Ещё отправим: {deviceLine(DEVICE)}.</Text>

      {sendError ? (
        <View style={styles.sendError} accessibilityLiveRegion="polite">
          <Icon source="alert-circle-outline" size={18} color={c.error} />
          <Text style={styles.sendErrorText}>{sendError}</Text>
        </View>
      ) : null}

      <Button
        mode="contained"
        onPress={onSend}
        loading={submit.isPending}
        disabled={submit.isPending}
        buttonColor={c.terracottaButton}
        textColor={c.onButton}
        style={styles.primaryButton}
        contentStyle={styles.primaryButtonContent}
        labelStyle={styles.primaryButtonLabel}
      >
        Отправить
      </Button>
    </ScrollView>
  );
}

/** «Спасибо!» after sending. One feedback per hour (univer#130), so no «Написать ещё». */
export function FeedbackSentScreen() {
  const navigation = useNavigation<Navigation>();
  const c = useLibraryColors();
  const dark = useTheme().dark;
  const styles = useStyles();
  const done = kindColors('IDEA', c, dark);
  return (
    <View style={[styles.screen, styles.sent]}>
      <View style={[styles.sentMark, { backgroundColor: done.tint }]}>
        <Icon source="check" size={44} color={done.icon} />
      </View>
      <Text style={styles.sentTitle}>Спасибо!</Text>
      <Text style={styles.sentText}>Отзыв отправлен. Мы читаем каждый и чиним ошибки в первую очередь.</Text>
      <Text style={styles.sentNote}>Следующий отзыв можно оставить через час.</Text>
      <Button
        mode="contained"
        onPress={() => navigation.popToTop()}
        buttonColor={c.terracottaButton}
        textColor={c.onButton}
        style={[styles.primaryButton, styles.sentButton]}
        contentStyle={styles.primaryButtonContent}
        labelStyle={styles.primaryButtonLabel}
      >
        В профиль
      </Button>
    </View>
  );
}

const useStyles = libraryStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
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
    marginBottom: 8,
  },
  kind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  kindPressed: {
    opacity: 0.7,
  },
  kindIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindText: {
    flex: 1,
    gap: 2,
  },
  kindTitle: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 16,
    color: c.ink,
  },
  kindSubtitle: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 13,
    color: c.inkMuted,
  },
  chip: {
    // The header's title slot stretches its child; the chip hugs its label instead.
    alignSelf: 'flex-start',
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 13,
  },
  question: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 24,
    lineHeight: 30,
    color: c.ink,
  },
  hint: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
    color: c.inkMuted,
  },
  field: {
    marginTop: 4,
  },
  fieldOutline: {
    borderRadius: 10,
  },
  input: {
    backgroundColor: c.surface,
    fontFamily: libraryFonts.bodyRegular,
  },
  inputContent: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
  fieldFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  fieldError: {
    flex: 1,
    paddingHorizontal: 2,
  },
  counter: {
    paddingTop: 4,
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 12,
    color: c.inkMuted,
  },
  device: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 12,
    lineHeight: 18,
    color: c.inkMuted,
  },
  sendError: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: c.accentTint,
  },
  sendErrorText: {
    flex: 1,
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 20,
    color: c.ink,
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 24,
  },
  primaryButtonContent: {
    height: 48,
  },
  primaryButtonLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 15,
  },
  sent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  sentMark: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentTitle: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 26,
    color: c.ink,
  },
  sentText: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: c.inkMuted,
  },
  sentNote: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 13,
    textAlign: 'center',
    color: c.inkMuted,
  },
  sentButton: {
    alignSelf: 'stretch',
    marginTop: 16,
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
    lineHeight: 19,
    textAlign: 'center',
    color: c.inkMuted,
  },
  linkAccent: {
    fontFamily: libraryFonts.bodyBold,
    color: c.terracotta,
    textDecorationLine: 'underline',
  },
}));
