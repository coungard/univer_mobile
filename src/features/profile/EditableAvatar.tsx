/**
 * The owner's tappable avatar (issue #94): one menu for «Сделать фото» / «Выбрать из галереи» /
 * «Удалить фото» / «Отмена», the square crop preview belonging to the picker itself, a spinner over
 * the circle while the upload runs (which also blocks a second tap) and one Snackbar for every
 * outcome. The profile screens only decide the size and read the photo from their own cache.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Menu, Portal, Snackbar } from 'react-native-paper';
import { Avatar } from '../../components/Avatar';
import { useLibraryColors } from '../../theme/library';
import {
  avatarSizeProblem,
  avatarUploadFileOf,
  describeAvatarError,
  isAvatarPermissionDenial,
  isAvatarPickerCancel,
  permissionDeniedText,
  pickerFailedText,
  type AvatarPick,
  type AvatarSource,
} from './avatar';
import { discardAvatarPick, pickAvatarFromCamera, pickAvatarFromGallery } from './avatarPicker';
import { useDeleteAvatarMutation, useUploadAvatarMutation } from './hooks';

interface EditableAvatarProps {
  /** Current photo — the full `avatarUrl` on the owner's own profile. */
  avatarUrl?: string | null;
  /** Fallback letters, see `initialsOf`. */
  initials: string;
  /** Circle diameter; the menu opens from anywhere on it. */
  size: number;
  /** Screen-reader name of the button, e.g. «Фото профиля». */
  accessibilityLabel: string;
}

export function EditableAvatar({ avatarUrl, initials, size, accessibilityLabel }: EditableAvatarProps) {
  const c = useLibraryColors();
  const [menuVisible, setMenuVisible] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const upload = useUploadAvatarMutation();
  const remove = useDeleteAvatarMutation();
  const busy = upload.isPending || remove.isPending;

  const settingsAlert = (source: AvatarSource) => {
    Alert.alert('Нет доступа', permissionDeniedText(source), [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Настройки',
        onPress: () => {
          Linking.openSettings().catch(() => {
            // Nothing else to offer if the system settings can't be opened.
          });
        },
      },
    ]);
  };

  const uploadPick = async (pick: AvatarPick) => {
    const problem = avatarSizeProblem(pick.size);
    if (problem) {
      discardAvatarPick(pick);
      setNotice(problem);
      return;
    }
    try {
      await upload.mutateAsync(avatarUploadFileOf(pick));
      setNotice('Фото обновлено');
    } catch (error) {
      setNotice(describeAvatarError(error));
    } finally {
      discardAvatarPick(pick);
    }
  };

  const pickFrom = async (source: AvatarSource) => {
    setMenuVisible(false);
    if (busy) return;
    let pick: AvatarPick | null;
    try {
      pick = source === 'camera' ? await pickAvatarFromCamera() : await pickAvatarFromGallery();
    } catch (error) {
      if (isAvatarPickerCancel(error)) return;
      if (isAvatarPermissionDenial(error)) {
        settingsAlert(source);
        return;
      }
      setNotice(pickerFailedText(source));
      return;
    }
    if (pick) await uploadPick(pick);
  };

  const removePhoto = async () => {
    setMenuVisible(false);
    if (busy) return;
    try {
      await remove.mutateAsync();
      setNotice('Фото удалено');
    } catch (error) {
      setNotice(describeAvatarError(error));
    }
  };

  return (
    <>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityHint="Открывает выбор фото профиля"
            accessibilityState={{ disabled: busy, busy }}
            disabled={busy}
            onPress={() => setMenuVisible(true)}
            style={({ pressed }) => (pressed && !busy ? styles.pressed : null)}
          >
            <Avatar uri={avatarUrl} initials={initials} size={size}>
              {busy ? (
                <View style={[styles.busy, { borderRadius: size / 2 }]}>
                  <ActivityIndicator color={c.cream} />
                </View>
              ) : null}
            </Avatar>
          </Pressable>
        }
      >
        <Menu.Item leadingIcon="camera-outline" title="Сделать фото" onPress={() => pickFrom('camera')} />
        <Menu.Item leadingIcon="image-outline" title="Выбрать из галереи" onPress={() => pickFrom('gallery')} />
        {avatarUrl ? <Menu.Item leadingIcon="trash-can-outline" title="Удалить фото" onPress={removePhoto} /> : null}
        <Menu.Item leadingIcon="close" title="Отмена" onPress={() => setMenuVisible(false)} />
      </Menu>

      {/* Both the picker failures above and the API errors land here, at the bottom of the app. */}
      <Portal>
        <Snackbar visible={notice !== null} onDismiss={() => setNotice(null)} duration={4000}>
          {notice ?? ''}
        </Snackbar>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  busy: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(39, 29, 23, 0.45)',
  },
});
