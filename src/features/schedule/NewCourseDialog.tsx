import React, { useState } from 'react';
import { Button, Dialog, HelperText, Portal, TextInput } from 'react-native-paper';
import { ApiError } from '../../api/errors';
import { useCreateOwnCourseMutation } from '../courses/hooks';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  /**
   * The subject to put into the pair: the one just created, or — when the faculty already has a
   * subject with this title (`409`) — that existing one, with `existed: true`.
   */
  onPicked: (course: { id: string; title: string }, existed: boolean) => void;
}

/**
 * «Добавить свой предмет» of the pair form (PLAN.md, M26): one field, the subject goes to the
 * student's faculty (`POST /students/me/course`). A dialog rather than a screen, so the half-filled
 * pair form underneath keeps its values.
 */
export function NewCourseDialog({ visible, onDismiss, onPicked }: Props) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createCourse = useCreateOwnCourseMutation();

  const close = () => {
    setTitle('');
    setError(null);
    onDismiss();
  };

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Введите название предмета');
      return;
    }
    setError(null);
    try {
      const course = await createCourse.mutateAsync(trimmed);
      onPicked({ id: course.id, title: course.title }, false);
      close();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.existingId) {
        onPicked({ id: e.existingId, title: trimmed }, true);
        close();
        return;
      }
      setError(
        e instanceof ApiError
          ? e.fieldErrors?.title ?? e.message
          : e instanceof Error
            ? e.message
            : 'Не удалось добавить предмет. Попробуйте ещё раз.',
      );
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={close}>
        <Dialog.Title>Свой предмет</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Название предмета"
            value={title}
            onChangeText={setTitle}
            maxLength={255}
            autoFocus
            error={!!error}
            onSubmitEditing={submit}
          />
          <HelperText type={error ? 'error' : 'info'} visible>
            {error ?? 'Предмет увидят все студенты вашего факультета.'}
          </HelperText>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={close} disabled={createCourse.isPending}>
            Отмена
          </Button>
          <Button onPress={submit} loading={createCourse.isPending} disabled={createCourse.isPending}>
            Добавить
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
