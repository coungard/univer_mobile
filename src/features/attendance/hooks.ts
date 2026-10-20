import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyAttendance,
  getMyCourseAttendanceSummary,
  markMyAttendance,
  unmarkMyAttendance,
} from '../../api/endpoints/attendance';
import { fetchAllPages } from '../../api/pagination';
import { MyAttendanceDto } from '../../api/types';
import { SelfMark, withMark } from './selfMark';

const MY_MARKS_KEY = ['attendance', 'me', 'marks'] as const;

/**
 * `GET /attendance/me` — every resulting mark of the signed-in student (univer#117), all pages: a
 * lecture missing from a truncated list would show as unmarked, which it may not be.
 */
export function useMyAttendanceQuery() {
  return useQuery({
    queryKey: MY_MARKS_KEY,
    queryFn: () => fetchAllPages((page) => getMyAttendance(page)),
  });
}

/** `GET /attendance/me/course/{courseId}/summary` — the tiles «был / не был / без отметки» on the course card. */
export function useMyCourseAttendanceSummaryQuery(courseId: string) {
  return useQuery({
    queryKey: ['attendance', 'me', 'summary', courseId],
    queryFn: () => getMyCourseAttendanceSummary(courseId),
  });
}

export interface MarkVariables {
  lectureId: string;
  mark: SelfMark;
}

/**
 * The student's own mark on one lecture (issue #71): `PUT` for «был»/«не был», `DELETE` for no mark.
 * The plaque changes at once — the new mark goes into the `GET /attendance/me` cache before the
 * request — and goes back to the previous one if the request fails; `onFailure` then gets the error
 * to show. Either way the student's marks and summaries are fetched again afterwards.
 */
export function useMarkMyAttendanceMutation(onFailure: (error: unknown, variables: MarkVariables) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lectureId, mark }: MarkVariables): Promise<void> => {
      if (mark === 'none') await unmarkMyAttendance(lectureId);
      else await markMyAttendance(lectureId, mark === 'attended');
    },
    onMutate: async ({ lectureId, mark }) => {
      await queryClient.cancelQueries({ queryKey: MY_MARKS_KEY });
      const previous = queryClient.getQueryData<MyAttendanceDto[]>(MY_MARKS_KEY);
      queryClient.setQueryData<MyAttendanceDto[]>(MY_MARKS_KEY, (marks) => withMark(marks ?? [], lectureId, mark));
      return { previous };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(MY_MARKS_KEY, context?.previous);
      onFailure(error, variables);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['attendance', 'me'] }),
  });
}
