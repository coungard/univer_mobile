import React from 'react';
import { Button } from 'react-native-paper';
import { describeError } from '../api/errors';
import { EmptyState } from './EmptyState';

interface Props {
  error: unknown;
  onRetry?: () => void;
}

/**
 * Full-screen "failed to load" state for a blocking query. Replaces the screen-specific hardcoded
 * guesses that used to sit inline everywhere ("Проверьте подключение к сети" shown even for a `403`)
 * with the error's actual cause via `describeError` (ROADMAP.md "Фаза 8" — единая обработка ошибок).
 * Renders inside the caller's own centered container, same as a bare `EmptyState` would — it adds no
 * layout of its own.
 */
export function QueryErrorState({ error, onRetry }: Props) {
  const { title, message } = describeError(error);
  return (
    <>
      <EmptyState title={title} description={message} />
      {onRetry ? (
        <Button mode="outlined" onPress={onRetry}>
          Повторить
        </Button>
      ) : null}
    </>
  );
}
