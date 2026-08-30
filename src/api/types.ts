/**
 * DTOs from `API.md`, limited to what Фаза 1 (auth/registration) needs. Add the rest as later
 * phases (schedule, courses, attendance, admin) start consuming them.
 */

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface AddressDto {
  id?: string;
  address: string;
  country: string;
  region: string;
  city: string;
  street: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface FacultyDto {
  id: string;
  name: string;
  description?: string;
  universityId: string;
}

export interface UniversityDto {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  address: AddressDto;
  faculties?: FacultyDto[];
}

export interface DepartmentDto {
  id: string;
  name: string;
  description?: string;
  facultyId: string;
}

export interface StudentDto {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  fullname?: string;
  createdAt?: string;
  updatedAt?: string;
  email: string;
  enrollmentDate: string;
  universityId: string;
  /** `null` until an admin assigns one — see ROADMAP.md "Фаза 2". */
  groupId: string | null;
}

export interface RegisterStudentRequest {
  username: string;
  firstname: string;
  lastname: string;
  fullname?: string;
  email: string;
  password: string;
  enrollmentDate: string; // LocalDate "yyyy-MM-dd", must not be in the future
  universityId: string;
}

export interface TeacherDto {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  fullname?: string;
  email: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  facultyId: string;
  position: string;
  registered?: boolean;
}

export interface RegisterTeacherRequest {
  username: string;
  firstname: string;
  lastname: string;
  fullname?: string;
  password: string;
  email: string;
  departmentId: string;
  position: string;
}
