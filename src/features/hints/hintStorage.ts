import * as Keychain from 'react-native-keychain';

/**
 * What the device remembers about the newcomer hints (PLAN.md, section 3.3): the hints the student
 * closed and whether they turned the whole mode off. Kept in the same OS storage as the tokens
 * (`auth/keychain.ts`) under its own entry — nothing here is secret, but it is the only persistent
 * storage the app already ships, and the blob is a few dozen bytes.
 */

const SERVICE = 'univer-mobile.hints';

export interface StoredHints {
  /** «Не показывать подсказки» — no hint is shown while this is set. */
  disabled: boolean;
  /** Ids of the hints the student closed one by one. */
  dismissed: string[];
}

export const EMPTY_HINTS: StoredHints = { disabled: false, dismissed: [] };

export async function loadHints(): Promise<StoredHints> {
  try {
    const result = await Keychain.getGenericPassword({ service: SERVICE });
    if (!result) return EMPTY_HINTS;
    const parsed = JSON.parse(result.password) as Partial<StoredHints>;
    return {
      disabled: parsed.disabled === true,
      dismissed: Array.isArray(parsed.dismissed) ? parsed.dismissed.filter(id => typeof id === 'string') : [],
    };
  } catch {
    return EMPTY_HINTS;
  }
}

export async function saveHints(hints: StoredHints): Promise<void> {
  try {
    await Keychain.setGenericPassword('univer-mobile', JSON.stringify(hints), { service: SERVICE });
  } catch {
    // Losing this only means a closed hint shows up once more.
  }
}
