import { apiClient } from '../client';
import { ProgramDto } from '../types';

/** `GET /programs/{id}` — last hop of a student's group → semester → study year → program chain. */
export async function getProgram(id: string): Promise<ProgramDto> {
  const { data } = await apiClient.get<ProgramDto>(`/programs/${id}`);
  return data;
}
