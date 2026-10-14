import { isDarkTheme } from '../src/features/settings/settingsStore';

describe('isDarkTheme', () => {
  test('«Как в системе» follows the system', () => {
    expect(isDarkTheme('system', 'dark')).toBe(true);
    expect(isDarkTheme('system', 'light')).toBe(false);
    expect(isDarkTheme('system', null)).toBe(false);
  });

  test('a picked theme overrides the system', () => {
    expect(isDarkTheme('dark', 'light')).toBe(true);
    expect(isDarkTheme('light', 'dark')).toBe(false);
  });
});
