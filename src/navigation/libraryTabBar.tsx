import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { libraryDarkColors, libraryFonts, libraryTabBarColors } from '../theme/library';

const styles = StyleSheet.create({
  bar: {
    backgroundColor: libraryTabBarColors.background,
    // Unseen against the light screen; in the dark theme it keeps the bar apart from the screen.
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: libraryDarkColors.tabBarEdge,
  },
  label: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  icon: {
    alignItems: 'center',
  },
  stripe: {
    position: 'absolute',
    top: -7,
    width: 48,
    height: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});

/**
 * Bottom tab bar in the "Library" identity (issue #55, canvas
 * https://claude.ai/artifact/ERUY4mAE4n2rNnobd7PKeq, «Корешок на тёмной панели»): a dark bar, and
 * the active tab marked by a short stripe, icon and label in a lightened book-spine colour.
 */
export const libraryTabBarOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarStyle: styles.bar,
  tabBarInactiveTintColor: libraryTabBarColors.inactive,
  tabBarLabelStyle: styles.label,
};

/**
 * Options of one tab: its icon (a MaterialCommunityIcons name) and the spine colour it takes when
 * active. The stripe is drawn with the icon — the default tab bar has no slot of its own for it.
 */
export function libraryTab(title: string, icon: string, activeColor: string): BottomTabNavigationOptions {
  return {
    title,
    tabBarActiveTintColor: activeColor,
    tabBarIcon: ({ color, focused }) => (
      <View style={styles.icon}>
        {focused ? <View style={[styles.stripe, { backgroundColor: color }]} /> : null}
        <Icon source={icon} size={24} color={color} />
      </View>
    ),
  };
}
