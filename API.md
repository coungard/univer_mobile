# API.md — Справочник эндпоинтов REST API

> Краткое описание всех эндпоинтов `/api/v1/...` (метод, путь, авторизация, тело запроса/ответа) — для
> переноса в проект мобильного приложения. Про то, как мобильный клиент должен получать JWT (Authorization
> Code + PKCE, публичный Keycloak-клиент `univer-mobile`), см. `MOBILE.md` — этот документ его не дублирует
> и описывает только сам HTTP API, который тот JWT авторизует.

---

## Общие сведения

- **Base URL (dev):** `http://localhost:8023/api/v1` (порт из `application.yml`, `server.port`; в проде —
  своя конфигурация, аналогично `auth-server-url` в `MOBILE.md`).
- **Авторизация:** для всех эндпоинтов, кроме явно помеченных «Public» ниже, обязателен заголовок
  `Authorization: Bearer <access_token>` с валидным JWT от Keycloak (`univer-realm`). Эндпоинт без роли в
  колонке «Auth» всё равно требует валидный JWT (`anyRequest().authenticated()` в `SecurityConfig`) — просто
  без ограничения по конкретной роли.
- **Роли:** `ADMIN`, `TEACHER`, `STUDENT` используются в проверках на эндпоинтах ниже (в Keycloak заведены
  также `APPLICANT`, `GUEST`, но текущий API их нигде не проверяет).
- **Content-Type:** `application/json` и для тела запроса, и для ответа.
- **ID сущностей:** везде `UUID` (строка вида `a8f2e7b1-1c2d-4e3f-8a9b-1c2d3e4f5a6b`).
- **Даты/время:** `LocalDate` → `"2026-09-01"`, `LocalDateTime` → `"2026-09-01T09:00:00"`, `LocalTime` →
  `"09:00:00"`, `Instant` (аудит-поля `createdAt`/`updatedAt`) → ISO-8601 с зоной, например
  `"2026-08-30T10:15:30.123456Z"`.

### Пагинация

Списковые эндпоинты принимают query-параметры `page` (по умолчанию `0`) и `size` (по умолчанию `10`) и
возвращают стандартный Spring Data `Page<T>`:

```json
{
  "content": [ /* массив DTO */ ],
  "totalElements": 42,
  "totalPages": 5,
  "number": 0,
  "size": 10,
  "first": true,
  "last": false,
  "numberOfElements": 10,
  "empty": false
}
```
(плюс служебные поля `pageable`, `sort` от Spring Data — обычно мобильному клиенту не нужны).

### Формат ошибок

| Статус | Когда | Тело |
|---|---|---|
| `400 Bad Request` | Невалидное тело запроса (`@Valid`, аннотации на полях DTO) | `{ "имяПоля": "текст ошибки", ... }` — плоская карта поле → сообщение |
| `401 Unauthorized` | Нет токена / токен невалиден или просрочен | стандартный ответ Spring Security (пустое тело или `WWW-Authenticate` заголовок) |
| `403 Forbidden` | Токен валиден, но роли не хватает (`@PreAuthorize`) | стандартный ответ Spring Security |
| `404 Not Found` | Сущность не найдена (`ResourceNotFoundException`) | `{ "timestamp", "status": 404, "error": "Not Found", "message", "path": "/" }` |
| `422 Unprocessable Entity` | Бизнес-валидация не прошла (`ValidationException`) | то же тело, что и 404 (`"status": 422`), поле `"error"` тоже всегда `"Not Found"` — известная неточность в `GlobalExceptionHandler`, не полагайтесь на текст `error`, только на `status`/`message` |

Во всех трёх случаях выше (`400`/`404`/`422`) поле `path` в теле **не** содержит реальный путь запроса —
всегда захардкожено `"/"` либо отсутствует (для `400`). Определять эндпоинт нужно по контексту запроса на
стороне клиента, не по телу ответа.

---

## Схемы данных (DTO)

Одна и та же схема, как правило, используется и для запроса (create/update), и для ответа — поля,
специфичные для запроса или для ответа, отмечены отдельно. `★` — поле обязательно (`@NotNull`/`@NotBlank`
и т.п.) при создании/обновлении.

### AddressDto
`id`, `address`★, `country`★, `region`★, `city`★, `street`★, `postalCode`, `phone`, `email`, `website`.
`id` — если передан, используется существующий адрес; если нет — создаётся новый по остальным полям.

### UniversityDto
`id`, `name`, `description`, `createdAt`, `updatedAt` (только в ответе), `address: AddressDto`,
`faculties: FacultyDto[]` (в ответе; при создании/обновлении можно не передавать — по умолчанию `[]`).

### FacultyDto
`id`, `name`, `description`, `universityId`, `departments: DepartmentDto[]` (по умолчанию `[]`).

### DepartmentDto
`id`, `name`★, `description`, `facultyId`.

### ProgramDto (ответ)
`id`, `facultyId`, `code`, `name`, `profession`, `direction`, `educationLevel`,
`educationForm: EducationForm`, `durationOfStudy: StudyDuration`, `qualification`.

### CreateProgramRequest (запрос create/update программы)
`facultyId`★, `code`★, `name`★, `profession`, `direction`, `educationLevel`★, `educationForm`,
`durationOfStudy`★, `qualification`.

- `EducationForm` (enum): `FULL_TIME` | `PART_TIME` | `FULL_AND_PART_TIME`.
- `StudyDuration`: `{ "years": int, "months": int, "days": int }`.

### StudyYearDto
`id`, `programId`★, `yearNumber`★ (`≥ 1`).

### SemesterDto
`id`, `studyYearId`★, `type: SemesterType`★, `startDate`★, `endDate`★.
`SemesterType` (enum): `AUTUMN` | `SPRING`.

### WeekScheduleCycleDto
`id`, `semesterId`★. Циклическое расписание семестра — контейнер для шаблонов `Pair`.

### BellScheduleEntryDto
`id`, `universityId` (`null` = дефолт для университетов без своей записи на этот `pairNumber`),
`pairNumber`★ (`≥ 1`), `startTime`★, `endTime`★.

### PairDto
`id`, `weekScheduleCycleId`★, `dayOfWeek`★ (`MONDAY`…`SUNDAY`), `weekParity: WeekParity`★,
`pairNumber`★ (`≥ 1`), `startTime` (опционально — если не задано, подставляется из
`BellScheduleEntry` по университету курса и `pairNumber`), `endTime`, `courseId`★, `teacherId`, `room`,
`groupIds: UUID[]`★ (непусто). Шаблон повторяющегося занятия в циклическом расписании — из него
генерируются конкретные `Lecture` на даты.
`WeekParity` (enum): `ODD` (нечётная неделя) | `EVEN` (чётная) | `BOTH` (каждую неделю).

### GroupDto
`id`, `semesterId`★, `name`★.

### CourseDto
`id`, `title`★, `description`, `departmentId`, `teacherId`.
(Сериализуется с `@JsonInclude(NON_NULL)` — `null`-поля в ответе могут отсутствовать вовсе, а не быть `null`.)

### LectureDto
`id`, `title`★, `content`, `scheduledTime`★, `durationMinutes`, `courseId`★, `teacherId`, `room`,
`sourcePairId` (заполняется автоматически при генерации из `Pair` — не заполнять вручную), `groupIds`★
(непусто).

### GenerateLectureRequest (только запрос)
`pairId`★, `date`★.

### StudentDto
`id`, `username`★, `firstname`★, `lastname`★, `fullname`, `createdAt`, `updatedAt` (только в ответе),
`email`★ (валидный email), `enrollmentDate`★ (не в будущем), `universityId`★, `groupId`.

### RegisterStudentRequest (только запрос, `POST /students/register`)
`username`★, `firstname`★, `lastname`★, `fullname`, `email`★, `password`★, `enrollmentDate`★
(не в будущем), `universityId`★. Пароль и остальные данные регистрации уходят в Keycloak — `id` итогового
`StudentDto` в ответе равен Keycloak user ID (см. флоу регистрации в `CLAUDE.md`).

### TeacherDto
`id`, `username`★, `firstname`★, `lastname`★, `fullname`, `email`★, `phone`, `createdAt`, `updatedAt`
(только в ответе), `facultyId`★, `position`★, `registered` (`Boolean`, только в ответе — зарегистрирован ли
преподаватель в Keycloak).

### RegisterTeacherRequest (только запрос, `POST /teachers/register`)
`username`★, `firstname`★, `lastname`★, `fullname`, `password`★, `email`★, `departmentId`★, `position`★.

### EnrollmentDto
`studentId`★, `courseId`★, `enrolledAt` (заполняется сервером при `POST`), `status: EnrollmentStatus`.
`EnrollmentStatus` (enum): `ACTIVE` | `COMPLETED` | `DROPPED`. У `Enrollment` нет собственного `id` —
идентифицируется парой (`studentId`, `courseId`).

### LectureAttendanceDto
`studentId`★, `lectureId`★, `attended` (`boolean`).

### AttendanceStatsDto (только ответ)
`totalMarked` (`long`), `attendedCount` (`long`), `attendanceRate` (`double`, `0..1`).

---

## Universities — `/api/v1/universities`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/` | любая роль | — (`?page&size`) | `Page<UniversityDto>` |
| GET | `/{id}` | любая роль | — | `UniversityDto` |
| POST | `/` | `ADMIN` | `UniversityDto` | `201` + `UniversityDto` |
| PUT | `/{id}` | `ADMIN` | `UniversityDto` | `UniversityDto` |
| DELETE | `/{id}` | `ADMIN` | — | `204` |

## Faculties — `/api/v1/faculties`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| POST | `/` | любая роль | `FacultyDto` | `201` + `FacultyDto` |
| GET | `/university/{universityId}` | любая роль | — (`?page&size`) | `Page<FacultyDto>` |
| GET | `/{id}` | любая роль | — | `FacultyDto` |
| PUT | `/{id}` | любая роль | `FacultyDto` | `FacultyDto` |
| DELETE | `/{id}` | любая роль | — | `204` |

> В отличие от большинства ресурсов, у `Faculties` (и `Departments` ниже) нет `@PreAuthorize` на
> create/update/delete — эти операции доступны любому аутентифицированному пользователю, не только `ADMIN`.
> При переносе в мобильное приложение стоит перепроверить это перед тем, как показывать соответствующий
> функционал не-админам — похоже на недосмотр в текущей реализации, а не сознательное решение.

## Departments — `/api/v1/departments`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| POST | `/` | любая роль | `DepartmentDto` | `201` + `DepartmentDto` |
| GET | `/faculty/{facultyId}` | любая роль | — (`?page&size`) | `Page<DepartmentDto>` |
| GET | `/university/{universityId}` | любая роль | — (`?page&size`) | `Page<DepartmentDto>` |
| GET | `/{id}` | любая роль | — | `DepartmentDto` |
| PUT | `/{id}` | любая роль | `DepartmentDto` | `DepartmentDto` |
| DELETE | `/{id}` | любая роль | — | `204` |

## Programs — `/api/v1/programs`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| POST | `/` | любая роль | `CreateProgramRequest` | `201` + `ProgramDto` |
| GET | `/{id}` | любая роль | — | `ProgramDto` |
| GET | `/` | любая роль | — (`?page&size`) | `Page<ProgramDto>` |
| GET | `/faculty/{facultyId}` | `ADMIN`/`TEACHER`/`STUDENT` | — (`?page&size`) | `Page<ProgramDto>` |
| PUT | `/{id}` | `ADMIN` | `CreateProgramRequest` | `ProgramDto` |
| DELETE | `/{id}` | `ADMIN` | — | `204` |

## StudyYears — `/api/v1/study-years`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/` | любая роль | — (`?page&size`) | `Page<StudyYearDto>` |
| GET | `/program/{programId}` | любая роль | — (`?page&size`) | `Page<StudyYearDto>` |
| GET | `/{id}` | любая роль | — | `StudyYearDto` |
| POST | `/` | `ADMIN` | `StudyYearDto` | `201` + `StudyYearDto` |
| PUT | `/{id}` | `ADMIN` | `StudyYearDto` | `StudyYearDto` |
| DELETE | `/{id}` | `ADMIN` | — | `204` |

## Semesters — `/api/v1/semesters`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/` | любая роль | — (`?page&size`) | `Page<SemesterDto>` |
| GET | `/study-year/{studyYearId}` | любая роль | — (`?page&size`) | `Page<SemesterDto>` |
| GET | `/{id}` | любая роль | — | `SemesterDto` |
| POST | `/` | `ADMIN` | `SemesterDto` | `201` + `SemesterDto` |
| PUT | `/{id}` | `ADMIN` | `SemesterDto` | `SemesterDto` |
| DELETE | `/{id}` | `ADMIN` | — | `204` |

## WeekScheduleCycles — `/api/v1/week-schedule-cycles`

Циклическое расписание семестра (контейнер шаблонов `Pair`).

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/` | любая роль | — (`?page&size`) | `Page<WeekScheduleCycleDto>` |
| GET | `/semester/{semesterId}` | любая роль | — | `WeekScheduleCycleDto` |
| GET | `/{id}` | любая роль | — | `WeekScheduleCycleDto` |
| POST | `/` | `ADMIN` | `WeekScheduleCycleDto` | `201` + `WeekScheduleCycleDto` |
| DELETE | `/{id}` | `ADMIN` | — | `204` |

## BellScheduleEntries — `/api/v1/bell-schedule-entries`

Справочник «номер пары → время начала/окончания» по университетам (звонковое расписание).

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/` | любая роль | — (`?page&size`) | `Page<BellScheduleEntryDto>` |
| GET | `/university/{universityId}` | любая роль | — (`?page&size`) | `Page<BellScheduleEntryDto>` |
| GET | `/{id}` | любая роль | — | `BellScheduleEntryDto` |
| POST | `/` | `ADMIN` | `BellScheduleEntryDto` | `201` + `BellScheduleEntryDto` |
| PUT | `/{id}` | `ADMIN` | `BellScheduleEntryDto` | `BellScheduleEntryDto` |
| DELETE | `/{id}` | `ADMIN` | — | `204` |

## Pairs — `/api/v1/pairs`

Шаблоны занятий циклического расписания (день недели + чётность недели + номер пары), из которых
генерируются конкретные `Lecture`.

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/` | любая роль | — (`?page&size`) | `Page<PairDto>` |
| GET | `/week-schedule-cycle/{weekScheduleCycleId}` | любая роль | — (`?page&size`) | `Page<PairDto>` |
| GET | `/group/{groupId}` | любая роль | — (`?page&size`) | `Page<PairDto>` — расписание группы |
| GET | `/{id}` | любая роль | — | `PairDto` |
| POST | `/` | `ADMIN` | `PairDto` | `201` + `PairDto` |
| PUT | `/{id}` | `ADMIN` | `PairDto` | `PairDto` |
| DELETE | `/{id}` | `ADMIN` | — | `204` |

## Groups — `/api/v1/groups`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/` | любая роль | — (`?page&size`) | `Page<GroupDto>` |
| GET | `/semester/{semesterId}` | любая роль | — (`?page&size`) | `Page<GroupDto>` |
| GET | `/{id}` | любая роль | — | `GroupDto` |
| POST | `/` | `ADMIN` | `GroupDto` | `201` + `GroupDto` |
| PUT | `/{id}` | `ADMIN` | `GroupDto` | `GroupDto` |
| DELETE | `/{id}` | `ADMIN` | — | `204` |

## Courses — `/api/v1/courses`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/` | любая роль | — (`?page&size`) | `Page<CourseDto>` |
| GET | `/department/{departmentId}` | любая роль | — (`?page&size`) | `Page<CourseDto>` |
| GET | `/{id}` | любая роль | — | `CourseDto` |
| POST | `/` | `ADMIN`/`TEACHER` | `CourseDto` | `201` + `CourseDto` |
| PUT | `/{id}` | `ADMIN`/`TEACHER` | `CourseDto` | `CourseDto` |
| DELETE | `/{id}` | `ADMIN`/`TEACHER` | — | `204` |

## Lectures — `/api/v1/lectures`

Конкретные занятия на дату/время — либо создаются вручную, либо генерируются из шаблона `Pair`.

| Метод | Путь | Auth | Query/Path | Тело запроса | Тело ответа |
|---|---|---|---|---|---|
| GET | `/` | любая роль | `?page&size` | — | `Page<LectureDto>` |
| GET | `/course/{courseId}` | любая роль | `?page&size` | — | `Page<LectureDto>` |
| GET | `/group/{groupId}` | любая роль | `?page&size` | — | `Page<LectureDto>` |
| GET | `/me` | `STUDENT` | `?page&size` | — | `Page<LectureDto>`, отсортировано по `scheduledTime` ASC |
| GET | `/{id}` | любая роль | — | — | `LectureDto` |
| POST | `/` | `ADMIN`/`TEACHER` | — | `LectureDto` | `201` + `LectureDto` |
| POST | `/generate` | `ADMIN`/`TEACHER` | — | `GenerateLectureRequest` | `201` + `LectureDto` |
| POST | `/generate/semester/{weekScheduleCycleId}` | `ADMIN`/`TEACHER` | — | — | `200` + `LectureDto[]` |
| PUT | `/{id}` | `ADMIN`/`TEACHER` | — | `LectureDto` | `LectureDto` |
| DELETE | `/{id}` | `ADMIN`/`TEACHER` | — | — | `204` |

- **`GET /me`** — расписание текущего студента: `id` берётся из `sub` в JWT (равен `Student.id`, см.
  «Флоу регистрации» в `CLAUDE.md`), а не из path/query. Возвращает лекции группы, к которой привязан
  студент; если студент ещё не привязан к группе — пустая страница, а не ошибка. Это основной эндпоинт для
  экрана «моё расписание» в мобильном приложении.
- **`POST /generate`** — генерирует одну `Lecture` на конкретную `date` из шаблона `Pair` (курс,
  преподаватель, группы копируются из `Pair`); `date` должна соответствовать `dayOfWeek`/`weekParity` пары.
- **`POST /generate/semester/{weekScheduleCycleId}`** — генерирует лекции на весь семестр разом для всех
  `Pair` данного цикла, в границах `Semester.startDate`…`Semester.endDate`; уже сгенерированные пара+дата
  пропускаются без ошибки — вызывать повторно безопасно (идемпотентно).

## Students — `/api/v1/students`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/` | `ADMIN` | — (`?page&size`) | `Page<StudentDto>` |
| GET | `/{id}` | `STUDENT` | — | `StudentDto` |
| POST | `/register` | **Public** (без токена) | `RegisterStudentRequest` | `201` + `StudentDto` |
| PUT | `/{id}` | `ADMIN` | `StudentDto` | `StudentDto` |
| DELETE | `/{id}` | `ADMIN` | — | `204` |

- **`POST /register`** — единственный публичный эндпоинт создания студента (не требует JWT). Создаёт
  пользователя в Keycloak, назначает роль `STUDENT`, сохраняет локальную сущность с `id`, равным Keycloak
  user ID. Возможные ответы: `201` успех, `400` невалидные данные, `409` email уже занят.
- **`GET /{id}`** требует роль `STUDENT` у самого вызывающего (эндпоинт не проверяет, что `id` совпадает с
  `sub` вызывающего токена — то есть любой `STUDENT` технически может запросить чужой профиль по ID).

## Teachers — `/api/v1/teachers`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/` | любая роль | — (`?page&size`) | `Page<TeacherDto>` |
| GET | `/{id}` | любая роль | — | `TeacherDto` |
| POST | `/register` | **Public** (без токена) | `RegisterTeacherRequest` | `201` + `TeacherDto` |
| POST | `/` | любая роль | `TeacherDto` | `201` + `TeacherDto` |
| PUT | `/{id}` | `ADMIN` | `TeacherDto` | `TeacherDto` |
| DELETE | `/{id}` | `ADMIN` | — | `204` |

- **`POST /register`** — аналог регистрации студента, но для преподавателя: создаёт пользователя в
  Keycloak с ролью `TEACHER`, `id` сущности = Keycloak user ID. Ответы: `201`/`400`/`409`, как у студента.
- **`POST /`** — создание `Teacher` без прохождения через Keycloak (нет `@PreAuthorize`, доступно любой
  аутентифицированной роли) — использовать для регистрации, скорее всего, не стоит: `id` в этом случае
  генерируется локально и не будет совпадать ни с каким Keycloak user ID.

## Enrollments — `/api/v1/enrollments`

Зачисление студентов на курсы.

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/{studentId}/{courseId}` | любая роль | — | `EnrollmentDto` |
| GET | `/student/{studentId}` | любая роль | — (`?page&size`) | `Page<EnrollmentDto>` |
| GET | `/course/{courseId}` | любая роль | — (`?page&size`) | `Page<EnrollmentDto>` |
| POST | `/` | `ADMIN`/`TEACHER` | `EnrollmentDto` | `201` + `EnrollmentDto` |
| POST | `/group/{groupId}/course/{courseId}` | `ADMIN`/`TEACHER` | — | `200` + `EnrollmentDto[]` |
| PUT | `/{studentId}/{courseId}` | `ADMIN`/`TEACHER` | `EnrollmentDto` | `EnrollmentDto` |
| DELETE | `/{studentId}/{courseId}` | `ADMIN`/`TEACHER` | — | `204` |

- **`POST /group/{groupId}/course/{courseId}`** — массово зачисляет на курс всех студентов группы, ещё не
  зачисленных на него; уже зачисленные молча пропускаются (не ошибка).
- **`PUT /{studentId}/{courseId}`** — смена статуса зачисления (`ACTIVE`/`COMPLETED`/`DROPPED`) через то же
  тело `EnrollmentDto`.

## Attendance — `/api/v1/attendance`

Посещаемость лекций и статистика.

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| POST | `/` | `ADMIN`/`TEACHER` | `LectureAttendanceDto` | `200` + `LectureAttendanceDto` |
| GET | `/student/{studentId}` | любая роль | — (`?page&size`) | `Page<LectureAttendanceDto>` |
| GET | `/lecture/{lectureId}` | любая роль | — (`?page&size`) | `Page<LectureAttendanceDto>` |
| GET | `/lecture/{lectureId}/stats` | любая роль | — | `AttendanceStatsDto` |
| GET | `/student/{studentId}/course/{courseId}/stats` | любая роль | — | `AttendanceStatsDto` |

- **`POST /`** — студент должен быть активно (`ACTIVE`) зачислен на курс этой лекции, иначе ошибка
  (`422`/`ValidationException`, см. «Формат ошибок» выше).
- **`GET /lecture/{lectureId}/stats`** — статистика по лекции: сколько студентов отметилось из
  ожидаемых/зачисленных (`totalMarked`, `attendedCount`, `attendanceRate`).
- **`GET /student/{studentId}/course/{courseId}/stats`** — статистика по студенту в рамках курса: сколько
  лекций курса он посетил из уже отмеченных.

---

## Открытые вопросы при переносе в мобильное приложение

- `Faculties`/`Departments` create/update/delete не защищены ролью (см. врезку в разделе `Faculties`
  выше) — стоит уточнить у бэкенд-команды, до того как открывать соответствующие экраны не-`ADMIN`
  пользователям.
- `Programs`: часть эндпоинтов (`POST /`, `GET /{id}`, `GET /`) не имеет `@PreAuthorize` вовсе (закомментирован
  в коде), а `GET /faculty/{facultyId}` требует одну из трёх ролей — несогласованность между эндпоинтами
  одного ресурса, доступ де-факто одинаковый (любой аутентифицированный), но стоит иметь в виду при
  ревью бэкенда.
- `Teachers`: `POST /` (без `/register`) не привязан к Keycloak и не имеет ограничения по роли — не
  использовать этот путь для функции «регистрация преподавателя» в приложении, только `POST /register`.
