import React, { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import ImagePicker, { type Image as PickerImage, type Options } from 'react-native-image-crop-picker';
import { Button, Dialog, Icon, List, Portal, Snackbar } from 'react-native-paper';
import { Avatar } from '../../components/Avatar';
import { type LibraryPalette, useLibraryColors } from '../../theme/library';
import {
  AVATAR_QUALITY,
  AVATAR_SIZE,
  avatarFileOf,
  avatarUriOf,
  deleteErrorText,
  pickerFailureOf,
  uploadErrorText,
} from './avatar';
import { useDeleteAvatarMutation, useUploadAvatarMutation } from './hooks';

type Source = 'camera' | 'library';

/**
 * Square crop with the user dragging the photo under a round frame, then a JPEG of ~1024 px and
 * quality 0.85 (MOBILE.md of univer). Both platforms re-encode the cropped picture to JPEG, so a HEIC
 * from an iPhone's camera arrives as JPEG; `forceJpg` covers the iOS gallery as well.
 */
function pickerOptions(c: LibraryPalette) {
  return {
    mediaType: 'photo' as const,
    cropping: true,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    cropperCircleOverlay: true,
    compressImageQuality: AVATAR_QUALITY,
    forceJpg: true,
    includeExif: false,
    useFrontCamera: true,
    cropperToolbarTitle: 'Фото профиля',
    cropperChooseText: 'Готово',
    cropperCancelText: 'Отмена',
    cropperToolbarColor: '#271D17',
    cropperToolbarWidgetColor: '#FAF4EE',
    cropperStatusBarLight: false,
    cropperNavigationBarLight: false,
    cropperActiveWidgetColor: c.terracotta,
    cropperChooseColor: c.gold,
  } satisfies Options;
}

/**
 * The actions over the own photo (issue #94): one menu on a tap on the circle — «Сделать фото»,
 * «Выбрать из галереи», «Удалить фото» (only with a photo), «Отмена». Render `dialog` anywhere and
 * `snackbar` last in the screen's root view, like `useSelfMark`'s.
 */
export function useAvatarEditor(hasPhoto: boolean) {
  const c = useLibraryColors();
  const upload = useUploadAvatarMutation();
  const remove = useDeleteAvatarMutation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [picking, setPicking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { mutate: uploadFile } = upload;
  const { mutate: removePhoto } = remove;

  const busy = upload.isPending || remove.isPending;

  const pick = useCallback(
    async (source: Source) => {
      setMenuVisible(false);
      setMessage(null);
      setPicking(true);
      let image: PickerImage;
      try {
        const options = pickerOptions(c);
        image = source === 'camera' ? await ImagePicker.openCamera(options) : await ImagePicker.openPicker(options);
      } catch (error) {
        const failure = pickerFailureOf(error, source);
        if (failure.kind === 'denied') {
          Alert.alert(failure.title, failure.message, [
            { text: 'Отмена', style: 'cancel' },
            {
              text: 'Открыть настройки',
              onPress: () => Linking.openSettings(),
            },
          ]);
        } else if (failure.kind === 'failed') {
          setMessage(failure.message);
        }
        return;
      } finally {
        setPicking(false);
      }

      const checked = avatarFileOf(image);
      if ('error' in checked) {
        setMessage(checked.error);
        ImagePicker.cleanSingle(image.path).catch(() => {});
        return;
      }
      uploadFile(checked.file, {
        onError: (error) => setMessage(uploadErrorText(error)),
        // The cropped copy lives in the app's temporary folder; once sent it isn't needed.
        onSettled: () => {
          ImagePicker.cleanSingle(image.path).catch(() => {});
        },
      });
    },
    [c, uploadFile],
  );

  const deletePhoto = useCallback(() => {
    setMenuVisible(false);
    setMessage(null);
    removePhoto(undefined, {
      onSuccess: () => setMessage('Фото удалено'),
      onError: (error) => setMessage(deleteErrorText(error)),
    });
  }, [removePhoto]);

  const open = useCallback(() => {
    if (busy || picking) return;
    setMessage(null);
    setMenuVisible(true);
  }, [busy, picking]);

  const dialog = (
    <Portal>
      <Dialog visible={menuVisible} onDismiss={() => setMenuVisible(false)}>
        <Dialog.Title>Фото профиля</Dialog.Title>
        <Dialog.Content style={styles.menu}>
          <List.Item
            title="Сделать фото"
            left={(props) => <List.Icon {...props} icon="camera-outline" />}
            onPress={() => pick('camera')}
            accessibilityRole="button"
          />
          <List.Item
            title="Выбрать из галереи"
            left={(props) => <List.Icon {...props} icon="image-outline" />}
            onPress={() => pick('library')}
            accessibilityRole="button"
          />
          {hasPhoto ? (
            <List.Item
              title="Удалить фото"
              left={(props) => <List.Icon {...props} icon="delete-outline" />}
              onPress={deletePhoto}
              accessibilityRole="button"
            />
          ) : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setMenuVisible(false)}>Отмена</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  const snackbar = (
    <Snackbar visible={message !== null} onDismiss={() => setMessage(null)} duration={4000}>
      {message ?? ''}
    </Snackbar>
  );

  return { open, busy, blocked: busy || picking, dialog, snackbar };
}

interface EditableAvatarProps {
  url?: string | null;
  initials: string;
  size: number;
  backgroundColor: string;
  textColor: string;
  editor: ReturnType<typeof useAvatarEditor>;
}

/** The own circle: a tap opens the menu; a small camera badge says it can be tapped. */
export function EditableAvatar({ url, initials, size, backgroundColor, textColor, editor }: EditableAvatarProps) {
  const c = useLibraryColors();
  const badge = Math.max(18, Math.round(size * 0.32));
  return (
    <Pressable
      onPress={editor.open}
      disabled={editor.blocked}
      accessibilityRole="button"
      accessibilityLabel={avatarUriOf(url) ? 'Изменить фото профиля' : 'Добавить фото профиля'}
      accessibilityState={{ busy: editor.busy, disabled: editor.blocked }}
      hitSlop={6}
      style={{ width: size, height: size }}
    >
      <Avatar
        url={url}
        initials={initials}
        size={size}
        backgroundColor={backgroundColor}
        textColor={textColor}
        busy={editor.busy}
      />
      {editor.busy ? null : (
        <View
          style={[
            styles.badge,
            {
              width: badge,
              height: badge,
              borderRadius: badge / 2,
              backgroundColor: c.surface,
              borderColor: c.border,
            },
          ]}
        >
          <Icon source="camera-outline" size={Math.round(badge * 0.62)} color={c.ink} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menu: {
    paddingHorizontal: 8,
  },
  badge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
