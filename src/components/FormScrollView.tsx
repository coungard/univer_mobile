import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';

/**
 * A `ScrollView` for screens with text fields (#87).
 *
 * On Android the window itself shrinks above the keyboard (`windowSoftInputMode="adjustResize"` in
 * AndroidManifest.xml), so a plain `ScrollView` is enough there. iOS has no such thing: the keyboard
 * just covers the bottom of the screen — on registration it hid «Пароль» and «Дата рождения».
 * `automaticallyAdjustKeyboardInsets` makes the iOS scroll view add a bottom inset of the keyboard's
 * height and scroll the focused field above it; Android ignores the prop.
 *
 * `keyboardShouldPersistTaps="handled"` lets a tap on a button (e.g. «Зарегистрироваться») work while
 * the keyboard is open instead of only closing it; dragging the form down closes the keyboard.
 */
export function FormScrollView(props: ScrollViewProps) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
      {...props}
    />
  );
}
