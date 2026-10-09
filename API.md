# API.md — Справочник эндпоинтов REST API

> Краткое описание всех эндпоинтов `/api/v1/...` (метод, путь, авторизация, тело запроса/ответа) — для
> переноса в проект мобильного приложения. Про то, как мобильный клиент должен получать JWT (Authorization
> Code + PKCE, публичный Keycloak-клиент `univer-mobile`), см. `MOBILE.md` — этот документ его не дублирует
> и описывает только сам HTTP API, который тот JWT авторизует.

---

## Общие сведения

- **Base URL (dev):** `http://localhost:8023/api/v1` (порт из `application.yml`, `server.port`; в проде —
  своя конфигурация, аналогично `auth-server-url` в `MOBILE.md`).
- **Авторизация:** для всех эндпоинтов, кроме явно помеченных «публично» ниже, обязателен заголовок
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
| `409 Conflict` | Значение уже занято: email или логин при регистрации, название группы в семестре, название факультета в университете (`ConflictException`) | `{ "timestamp", "status": 409, "error": "Conflict", "message", "field", "path": "/" }` — `field` называет поле запроса с занятым значением: `"email"`, `"username"` или `"name"`; `null`, если определить не удалось. Для названия группы или факультета в теле есть ещё `id` — ID уже существующей группы или факультета с таким названием; для email и логина поля `id` нет |
| `422 Unprocessable Entity` | Бизнес-валидация не прошла (`ValidationException`) | то же тело, что и 404 (`"status": 422`), поле `"error"` тоже всегда `"Not Found"` — известная неточность в `GlobalExceptionHandler`, не полагайтесь на текст `error`, только на `status`/`message` |

Во всех случаях выше с телом (`400`/`404`/`409`/`422`) поле `path` в теле **не** содержит реальный путь запроса —
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
`id`, `name`, `description`, `rector`, `foundingYear`, `studentCount`, `createdAt`, `updatedAt` (только
в ответе), `address: AddressDto`, `regionId`★, `faculties: FacultyDto[]` (в ответе; при создании/обновлении
можно не передавать — по умолчанию `[]`). `rector`/`foundingYear`/`studentCount` необязательны (`foundingYear`,
если передан, — не меньше 1000; `studentCount`, если передан, — не отрицательный). `regionId` — ID региона
из `GET /regions`, обязателен: регион есть у каждого вуза (issue #80). Без `regionId` `POST`/`PUT`
вернут `400`, с несуществующим — `404`. Текстовый `address.region` от `regionId` не зависит.

### RegionDto (только ответ)
`id`, `code` (двузначный код субъекта РФ, например `05`), `name` (официальное название, например
`Республика Дагестан`).

### FacultyDto
`id`, `name`, `description`, `universityId`, `departments: DepartmentDto[]` (по умолчанию `[]`),
`createdByStudentId` (только в ответе: ID студента, создавшего факультет через
`POST /students/me/faculty`; у факультетов, заведённых администратором, поля в ответе нет; в запросах
игнорируется). Название уникально в пределах университета без учёта регистра и крайних пробелов.
(Сериализуется с `@JsonInclude(NON_NULL)` — как и `DepartmentDto`/`CourseDto` ниже, `null`-поля в ответе
могут отсутствовать вовсе, а не быть `null`.)

### CreateStudentFacultyRequest (только запрос, `POST` и `PUT /students/me/faculty`)
`name`★ (до 255 символов; крайние пробелы отбрасываются). Университета в запросе нет — он берётся из
профиля студента.

### DepartmentDto
`id`, `name`★, `description`, `facultyId`.
(Тоже `@JsonInclude(NON_NULL)` — см. замечание у `FacultyDto`.)

### StudyYearDto
`id`, `facultyId`★, `yearNumber`★ (`≥ 1`). Учебный год — это курс факультета («1 курс», «2 курс»);
пара `facultyId` + `yearNumber` уникальна.

### SemesterDto
`id`, `studyYearId`★, `type: SemesterType`★, `startDate`★, `endDate`★.
`SemesterType` (enum): `AUTUMN` | `SPRING`.

### WeekScheduleCycleDto
`id`, `semesterId`★, `status: WeekScheduleCycleStatus` (только в ответе — при создании форсируется
`DRAFT` независимо от присланного значения, менять — только через `PUT /{id}/status`). Циклическое
расписание семестра — контейнер для шаблонов `Pair`. Один цикл на семестр: повторный `POST` с уже
занятым `semesterId` — `422`.
`WeekScheduleCycleStatus` (enum): `DRAFT` (черновик, доступен для правок `ADMIN` и `STUDENT` своей
группы) | `AGREED` (согласовано, правки только `ADMIN`).

### UpdateWeekScheduleCycleStatusRequest (только запрос, `PUT /week-schedule-cycles/{id}/status`)
`status: WeekScheduleCycleStatus`★.

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
`id`, `semesterId`★, `name`★ (до 64 символов; крайние пробелы отбрасываются), `fullName` (полная
расшифровка названия, например «Разработка программных и информационных систем» для «У530»;
необязательна, до 255 символов, пустая строка сохраняется как `null`), `createdByStudentId` (только в
ответе: ID студента, создавшего группу через `POST /students/me/group`; `null` у групп, заведённых
администратором; в запросах игнорируется). Название уникально в пределах семестра без учёта регистра
и крайних пробелов.

### CreateStudentGroupRequest (только запрос, `POST` и `PUT /students/me/group`)
`name`★ (до 64 символов), `fullName` (до 255 символов) — как в `GroupDto`. Факультета, курса и
семестра в запросе нет: они берутся из профиля студента и подбираются сервером.

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
`email`★ (валидный email), `enrollmentDate` (не в будущем, необязательна — назначается администратором
после регистрации, не собирается на самой регистрации), `birthday` (не в будущем), `universityId`
(`null`, пока студент не выбрал университет), `facultyId`, `yearNumber` (номер курса, `≥ 1`) — оба
только в ответе, `null`, пока не выбраны; меняются через `PATCH /students/me`, а `PUT /students/{id}`
их игнорирует, — `groupId`.

### UpdateStudentProfileRequest (только запрос, `PATCH /students/me`)
`universityId`, `facultyId`, `yearNumber` (от 1 до 6), `groupId` — все необязательны. Поле, которого нет
в теле, не меняется; поле с явным `null` очищается.

### UniversityRequestDto (только ответ)
Заявка студента на добавление университета. `id`, `name` (название, как его ввёл студент), `regionId`,
`regionName` (оба `null`, если студент региона не указал), `status: UniversityRequestStatus`,
`universityId` (университет, которым заявка закрыта; заполнен только у `COMPLETED`), `comment`
(пояснение администратора при отклонении; бывает только у `REJECTED`, и то не всегда), `studentId`,
`studentUsername`, `studentFullname` (автор заявки), `createdAt`, `updatedAt`.
`UniversityRequestStatus` (enum): `PENDING` (необработанная) | `COMPLETED` (выполнена) | `REJECTED`
(отклонена).

### SubmitUniversityRequest (только запрос, `PUT /students/me/university-request`)
`name`★ (до 255 символов; крайние пробелы отбрасываются), `regionId` (необязателен — ID региона из
`GET /regions`).

### CompleteUniversityRequest (только запрос, `POST /university-requests/{id}/complete`)
`universityId`★.

### RejectUniversityRequest (только запрос, `POST /university-requests/{id}/reject`)
`comment` (необязателен, до 500 символов; крайние пробелы отбрасываются, пустой сохраняется как
`null`). Тело можно не передавать вовсе.

### RegisterStudentRequest (только запрос, `POST /students/register`)
`username`★, `firstname`★, `lastname`★, `fullname`, `email`★, `password`★, `enrollmentDate` (не в
будущем, необязательна — форма регистрации её больше не запрашивает, см.
`coungard/univer_mobile#46`), `birthday`★ (не в будущем), `universityId` (необязателен — аккаунт
можно создать до выбора университета или вовсе без него; если передан, должен существовать, иначе
`404`). Пароль и остальные данные
регистрации уходят в Keycloak — `id` итогового `StudentDto` в ответе равен Keycloak user ID (см. флоу
регистрации в `CLAUDE.md`).

### TeacherDto
`id`, `username`★, `firstname`★, `lastname`★, `fullname`, `email`★, `phone`, `birthday`, `createdAt`,
`updatedAt` (только в ответе), `facultyId`★ (только для `PUT`/`POST /teachers` — на регистрации не
приходит, см. ниже, может быть `null` в ответе, пока кафедра не назначена), `position`★, `registered`
(`Boolean`, только в ответе — зарегистрирован ли преподаватель в Keycloak).

### RegisterTeacherRequest (только запрос, `POST /teachers/register`)
`username`★, `firstname`★, `lastname`★, `fullname`, `password`★, `email`★, `departmentId` (необязателен
— форма регистрации больше не выбирает кафедру, см. `coungard/univer_mobile#47`; кафедра
назначается позже через `PUT /teachers/{id}`), `birthday`★ (не в будущем), `position`★.

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
| GET | `/` | публично | — (`?search&regionId&page&size`) | `Page<UniversityDto>` |
| GET | `/{id}` | публично | — | `UniversityDto` |
| POST | `/` | `ADMIN` | `UniversityDto` | `201` + `UniversityDto` |
| PUT | `/{id}` | `ADMIN` | `UniversityDto` | `UniversityDto` |
| DELETE | `/{id}` | `ADMIN` | — | `204` |

> `GET`-эндпоинты сделаны публичными намеренно: экран регистрации студента ещё не имеет токена,
> но должен дать выбрать университет (`RegisterStudentRequest.universityId`) до входа в систему.
>
> `search` — необязательный, регистронезависимый поиск по подстроке в `name`; без него — все
> университеты постранично, как раньше. Мобильный клиент использует его в пикере «Университет» на
> экране регистрации (`SearchableSelectField`, `useUniversitiesQuery` — `src/features/onboarding/`),
> чтобы искать среди большого числа ВУЗов вместо прокрутки/загрузки всего списка целиком.
>
> `regionId` — необязательный фильтр по региону (ID из `GET /regions`), сочетается с `search`.

## UniversityRequests — `/api/v1/university-requests`

Заявки студентов на добавление университета, которого нет в справочнике (issue #92). Студент
оставляет и смотрит свою заявку через `PUT`/`GET /students/me/university-request`; здесь — разбор
заявок администратором.

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/` | `ADMIN` | — (`?status&page&size`) | `Page<UniversityRequestDto>` |
| POST | `/{id}/complete` | `ADMIN` | `CompleteUniversityRequest` | `UniversityRequestDto` |
| POST | `/{id}/reject` | `ADMIN` | `RejectUniversityRequest` (необязательно) | `UniversityRequestDto` |

- **`GET /`** — сначала самые давние заявки. `status` — необязательный фильтр (`PENDING`,
  `COMPLETED`, `REJECTED`); без него — заявки во всех статусах. Одинаковые заявки разных студентов
  не группируются — каждая закрывается отдельно.
- **`POST /{id}/complete`** — закрыть заявку, указав университет: только что созданный через
  `POST /universities` или уже существующий, если студент его просто не нашёл. Заявка переходит в
  `COMPLETED`, университет проставляется в профиль автора, **если `universityId` там всё ещё
  пуст**. Заявка без региона допустима, но университет без региона создать нельзя — регион
  администратор указывает сам при создании университета.
- **`POST /{id}/reject`** — отклонить заявку (не университет, дубль, мусор): статус `REJECTED`,
  профиль автора не меняется. В необязательном `comment` администратор поясняет, что не так, —
  студент увидит его в `GET /students/me/university-request` и поймёт, исправить ли название или
  искать университет под другим именем.
- `GET /?status=` с неизвестным статусом — `400`.
- Закрыть или отклонить можно только необработанную заявку: для уже обработанной — `422`.
  Несуществующая заявка или университет — `404`.

## Regions — `/api/v1/regions`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/` | публично | — | `RegionDto[]` |

> Справочник всех 89 субъектов РФ, отсортирован по названию, без пагинации. Наполняется миграцией
> (`V24__insert_regions.sql`), эндпоинтов изменения нет. Публичный по той же причине, что и
> `GET /universities`: нужен на экране регистрации до входа.

## Faculties — `/api/v1/faculties`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| POST | `/` | `ADMIN` | `FacultyDto` | `201` + `FacultyDto` |
| GET | `/university/{universityId}` | публично | — (`?page&size`) | `Page<FacultyDto>` |
| GET | `/{id}` | публично | — | `FacultyDto` |
| PUT | `/{id}` | `ADMIN` | `FacultyDto` | `FacultyDto` |
| DELETE | `/{id}` | `ADMIN` | — | `204` |

- **`POST /`, `PUT /{id}`, `DELETE /{id}`** — только `ADMIN` (с issue #87; раньше были доступны любому
  аутентифицированному пользователю). Студент создаёт факультет через `POST /students/me/faculty`.
- **`POST /`, `PUT /{id}`** — если в университете уже есть факультет с таким названием (без учёта
  регистра и крайних пробелов) — `409` с `field: "name"` и `id` существующего факультета (см. «Формат
  ошибок»).
- У факультета, созданного студентом, нет описания и кафедр (`departments: []`) — как и у большинства
  факультетов справочника.

> `GET`-эндпоинты остаются публичными по историческим причинам (раньше — выбор кафедры на
> регистрации преподавателя; с issue #79 форма регистрации кафедру больше не запрашивает,
> `departmentId` необязателен — см. `RegisterTeacherRequest` выше), а также потому что на
> факультеты/кафедры ссылаются списки курсов.
>
> В отличие от большинства ресурсов, у `Departments` (ниже) нет `@PreAuthorize` на
> create/update/delete — эти операции доступны любому аутентифицированному пользователю, не только `ADMIN`.
> При переносе в мобильное приложение стоит перепроверить это перед тем, как показывать соответствующий
> функционал не-админам — похоже на недосмотр в текущей реализации, а не сознательное решение. У
> `Faculties` этот недосмотр закрыт в issue #87.

## Departments — `/api/v1/departments`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| POST | `/` | любая роль | `DepartmentDto` | `201` + `DepartmentDto` |
| GET | `/faculty/{facultyId}` | публично | — (`?page&size`) | `Page<DepartmentDto>` |
| GET | `/university/{universityId}` | публично | — (`?page&size`) | `Page<DepartmentDto>` |
| GET | `/{id}` | публично | — | `DepartmentDto` |
| PUT | `/{id}` | любая роль | `DepartmentDto` | `DepartmentDto` |
| DELETE | `/{id}` | любая роль | — | `204` |

> `GET`-эндпоинты публичны по той же причине, что и у `Faculties`/`Universities` — нужны для выбора
> кафедры на экране регистрации преподавателя.

## StudyYears — `/api/v1/study-years`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/` | любая роль | — (`?page&size`) | `Page<StudyYearDto>` |
| GET | `/faculty/{facultyId}` | любая роль | — (`?page&size`) | `Page<StudyYearDto>` |
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
| PUT | `/{id}/status` | `ADMIN` | `UpdateWeekScheduleCycleStatusRequest` | `WeekScheduleCycleDto` |
| DELETE | `/{id}` | `ADMIN` | — | `204` |

- **`POST /`** — только `ADMIN`; создание всегда форсирует `status: DRAFT` (значение `status` в теле
  запроса игнорируется). Один цикл на семестр: если `WeekScheduleCycle` для этого `semesterId` уже
  существует — `422`.
- **`PUT /{id}/status`** — переключает `DRAFT`⇄`AGREED` (в обе стороны), тоже только `ADMIN`. Пока
  цикл в `DRAFT`, свои `Pair` внутри него может писать `ADMIN` без ограничений либо `STUDENT` своей
  группы; после перевода в `AGREED` — только `ADMIN` (см. раздел `Pairs`).

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
| POST | `/` | `ADMIN`/`STUDENT`¹ | `PairDto` | `201` + `PairDto` |
| PUT | `/{id}` | `ADMIN`/`STUDENT`¹ | `PairDto` | `PairDto` |
| DELETE | `/{id}` | `ADMIN`/`STUDENT`¹ | — | `204` |

¹ `STUDENT` может писать `Pair` только своей группы (`groupIds` должен состоять ровно из его группы,
без потока на другие группы) и только пока `WeekScheduleCycle.status == DRAFT` (см. раздел
`WeekScheduleCycles`) — как для текущего, так и для нового состояния пары при `PUT`. Нарушение любого
из двух условий — `422` с соответствующим сообщением. `ADMIN` не ограничен ни группой, ни статусом.

`POST`/`PUT /pairs` также проверяют конфликты преподаватель/аудитория — для **всех** ролей, включая
`ADMIN`: в пределах одного `weekScheduleCycleId` два `Pair` не могут одновременно иметь совпадающий
`dayOfWeek`, пересекающуюся `weekParity` (с учётом `BOTH`) и пересекающиеся `[startTime, endTime)`,
если при этом у них совпадает `teacherId` или `room`. Нарушение — `422`. Защиты от гонки при
параллельных сохранениях нет (осознанно, для MVP).

## Groups — `/api/v1/groups`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/` | любая роль | — (`?facultyId&yearNumber&page&size`) | `Page<GroupDto>` |
| GET | `/semester/{semesterId}` | любая роль | — (`?page&size`) | `Page<GroupDto>` |
| GET | `/{id}` | любая роль | — | `GroupDto` |
| POST | `/` | `ADMIN` | `GroupDto` | `201` + `GroupDto` |
| PUT | `/{id}` | `ADMIN` | `GroupDto` | `GroupDto` |
| DELETE | `/{id}` | `ADMIN` | — | `204` |

- **`GET /?facultyId=…&yearNumber=…`** — группы факультета на указанном курсе,
  одним запросом вместо обхода цепочки учебный год → семестр → группа
  (последний шаг регистрации студента). Оба параметра необязательны и работают по отдельности: только
  `facultyId` — все курсы факультета, только `yearNumber` — этот курс на всех факультетах. Без обоих
  параметров — прежнее поведение: все группы, без отбора по семестру.
- С любым из фильтров в выдачу попадают только группы **актуального семестра**. Он выбирается на
  сегодняшнюю дату отдельно для каждого учебного года (факультет + курс), в три ступени:
  1. семестр, который идёт сейчас (`startDate ≤ сегодня ≤ endDate`, границы включаются);
  2. если такого нет (каникулы) — ближайший будущий;
  3. если нет и будущих (следующий семестр ещё не заведён) — последний закончившийся.
- Сортировка при фильтрах — по `name`. Если подходящих групп нет (в том числе `facultyId` не
  существует) — `200` с пустой страницей, не ошибка. Студент в этом случае может создать группу сам:
  `POST /students/me/group`.
- **`POST /`, `PUT /{id}`** — если в семестре уже есть группа с таким названием (без учёта регистра и
  крайних пробелов) — `409` с `field: "name"` и `id` существующей группы (см. «Формат ошибок»).

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
| POST | `/generate` | `ADMIN`/`TEACHER`/`STUDENT`² | — | `GenerateLectureRequest` | `201` + `LectureDto` |
| POST | `/generate/semester/{weekScheduleCycleId}` | `ADMIN`/`TEACHER`/`STUDENT`² | — | — | `200` + `LectureDto[]` |
| PUT | `/{id}` | `ADMIN`/`TEACHER` | — | `LectureDto` | `LectureDto` |
| DELETE | `/{id}` | `ADMIN`/`TEACHER` | — | — | `204` |

- **`GET /me`** — расписание текущего студента: `id` берётся из `sub` в JWT (равен `Student.id`, см.
  «Флоу регистрации» в `CLAUDE.md`), а не из path/query. Возвращает лекции группы, к которой привязан
  студент; если студент ещё не привязан к группе — пустая страница, а не ошибка. Это основной эндпоинт для
  экрана «моё расписание» в мобильном приложении.
- ² `STUDENT` может генерировать лекции только для своей группы: `POST /generate` — целевой `Pair`
  должен принадлежать его группе; `POST /generate/semester/{id}` — генерирует только по `Pair` своей
  группы, остальные `Pair` цикла пропускаются молча (не ошибка). Статус цикла (`DRAFT`/`AGREED`, см.
  `WeekScheduleCycles`) на генерацию не влияет. `ADMIN`/`TEACHER` не ограничены.
- **`POST /generate`** — генерирует одну `Lecture` на конкретную `date` из шаблона `Pair` (курс,
  преподаватель, группы копируются из `Pair`); `date` должна соответствовать `dayOfWeek`/`weekParity` пары.
  **Не идемпотентно**: если `Lecture` для этой пары+даты уже существует — `422` («уже сгенерирована»), а
  не тихий пропуск (в отличие от `generate/semester` ниже) — повторный клик в UI на этом пути нужно явно
  обрабатывать как ошибку, не как no-op.
- **`POST /generate/semester/{weekScheduleCycleId}`** — генерирует лекции на весь семестр разом для всех
  `Pair` данного цикла, в границах `Semester.startDate`…`Semester.endDate`; уже сгенерированные пара+дата
  пропускаются без ошибки — вызывать повторно безопасно (идемпотентно).

## Students — `/api/v1/students`

| Метод | Путь | Auth | Тело запроса | Тело ответа |
|---|---|---|---|---|
| GET | `/` | `ADMIN` | — (`?page&size`) | `Page<StudentDto>` |
| GET | `/me` | `STUDENT` | — | `StudentDto` |
| PATCH | `/me` | `STUDENT` | `UpdateStudentProfileRequest` | `StudentDto` |
| GET | `/me/university-request` | `STUDENT` | — | `UniversityRequestDto` |
| PUT | `/me/university-request` | `STUDENT` | `SubmitUniversityRequest` | `UniversityRequestDto` |
| POST | `/me/faculty` | `STUDENT` | `CreateStudentFacultyRequest` | `201` + `StudentDto` |
| PUT | `/me/faculty` | `STUDENT` | `CreateStudentFacultyRequest` | `FacultyDto` |
| POST | `/me/group` | `STUDENT` | `CreateStudentGroupRequest` | `201` + `StudentDto` |
| PUT | `/me/group` | `STUDENT` | `CreateStudentGroupRequest` | `GroupDto` |
| GET | `/{id}` | `STUDENT` | — | `StudentDto` |
| POST | `/register` | **Public** (без токена) | `RegisterStudentRequest` | `201` + `StudentDto` |
| PUT | `/{id}` | `ADMIN` | `StudentDto` | `StudentDto` |
| DELETE | `/{id}` | `ADMIN` | — | `204` |

- **`POST /register`** — единственный публичный эндпоинт создания студента (не требует JWT). Создаёт
  пользователя в Keycloak, назначает роль `STUDENT`, сохраняет локальную сущность с `id`, равным Keycloak
  user ID. Возможные ответы: `201` успех, `400` невалидные данные, `409` email или логин уже занят — в теле `field`: `"email"` либо `"username"` (см. «Формат ошибок»). Занятость проверяется и среди студентов, и в Keycloak, где логины и email общие с преподавателями.
- **Студент без университета** (`universityId: null`) — валидное состояние: `GET /lectures/me` отдаёт
  ему пустую страницу, а не ошибку (группы у него тоже ещё нет).
- **`PUT /{id}`** — `universityId: null` в теле снимает привязку к университету (как `groupId: null` —
  к группе). Переданный `universityId` закрывает необработанную заявку студента на добавление
  университета. `facultyId` и `yearNumber` этот эндпоинт не меняет и согласованность цепочки не
  проверяет — это делает только `PATCH /me`.
- **`GET /me`** — профиль вызывающего студента; студент определяется по `sub` из JWT (как в
  `GET /lectures/me`), подставлять свой ID в `GET /{id}` не нужно.
- **`PATCH /me`** — студент сам заполняет профиль: университет → факультет → курс → группа,
  подтверждение администратора не требуется. Можно остановиться на любом шаге. Правила:
  - **Смена поля сбрасывает всё, что ниже по цепочке**: сменил университет — очищаются факультет,
    курс и группа; факультет — курс и группа; курс — группа. Поля ниже, переданные в том же запросе,
    применяются после сброса, так что перевод в другой вуз можно сделать одним запросом со всеми
    четырьмя полями. Повторная отправка текущего значения сменой не считается и ничего не
    сбрасывает. Явный `null` очищает поле и всё, что ниже.
  - **Незаполненное выше по цепочке проставляется автоматически**: `groupId` проставляет
    `facultyId` и `yearNumber` по цепочке группы (группа → семестр → учебный год → факультет),
    а `facultyId` или `groupId` — ещё и `universityId`, если он не выбран.
  - **Уже заполненное обязано согласовываться**, иначе `422` с пояснением в `message`: факультет
    должен принадлежать университету студента, группа — его факультету и курсу; курс нельзя выбрать
    без факультета.
  - Несуществующий `universityId`/`facultyId`/`groupId` — `404`; `yearNumber` вне диапазона 1–6 —
    `400`.
  - После выбора группы `GET /lectures/me` сразу отдаёт её расписание.
  - Если в профиле появился университет, необработанная заявка студента на добавление университета
    закрывается автоматически (см. `PUT /me/university-request`).
- **`PUT /me/university-request`** — студент не нашёл свой университет в `GET /universities` и
  оставляет заявку на его добавление. Сам он университеты не создаёт: заявку разбирает
  администратор (см. «UniversityRequests»). В ответе `200` и `UniversityRequestDto` в статусе
  `PENDING`.
  - У студента не больше одной необработанной заявки: повторный запрос обновляет её название и
    регион, а не создаёт вторую. `regionId`, не переданный в теле, очищается. Два одновременных
    запроса (двойное нажатие «Отправить») тоже дают одну заявку: оба получают `200` с ней.
  - Профиль заявка не меняет: `universityId` остаётся пустым, пока администратор её не закроет.
    Уведомления о закрытии нет — клиент увидит университет в `GET /me`.
  - После закрытия или отклонения заявки следующий `PUT` создаёт новую необработанную.
  - Регион необязателен: студент мог не найти и регион. Несуществующий `regionId` — `404`.
  - В профиле уже выбран университет — `422`: такая заявка закрылась бы сразу. Чтобы оставить
    заявку, университет сначала снимается через `PATCH /me` (`universityId: null`).
  - Заявка закрывается автоматически (`COMPLETED` с `universityId` выбранного университета), если
    студент, не дожидаясь администратора, выбрал университет сам через `PATCH /me` — напрямую либо
    выбором факультета или группы — или университет ему назначил администратор через `PUT /{id}`.
- **`GET /me/university-request`** — последняя заявка студента: необработанная, а если её нет —
  последняя закрытая или отклонённая. У закрытой заполнен `universityId`, у отклонённой может быть
  `comment` с причиной. Студент заявок не
  оставлял — `404`.
- **`POST /me/faculty`** — студент создаёт факультет, которого нет в
  `GET /faculties/university/{id}`, и сразу выбирает его: в ответе `StudentDto` с новым `facultyId`,
  в заголовке `Location` — адрес факультета. Подтверждение администратора не требуется, факультет
  сразу виден всем в списке факультетов университета.
  - Университет берётся из профиля студента. Если `universityId` в профиле не заполнен — `422`.
  - `yearNumber` и `groupId` в профиле сбрасываются — как при смене факультета через `PATCH /me`.
    Дальше студент выбирает курс и создаёт группу (`POST /me/group`).
  - Факультет с таким названием в этом университете уже есть (без учёта регистра и крайних
    пробелов) — `409` с `field: "name"` и `id` существующего факультета: клиент может предложить
    выбрать его через `PATCH /me`. Профиль студента при этом не меняется.
  - Один студент может создать не больше 3 факультетов; четвёртая попытка — `422`. Считаются
    существующие факультеты, созданные им (`FacultyDto.createdByStudentId`), в том числе те, с
    которых он уже ушёл.
- **`PUT /me/faculty`** — студент исправляет название факультета, выбранного в его профиле, —
  например, опечатку. В ответе обновлённый `FacultyDto`; профиль студента, курсы и группы
  факультета не меняются.
  - Разрешено, только если студент сам создал этот факультет и кроме него факультет никто из
    студентов не выбрал. Иначе `422`: у студента не выбран факультет; факультет создал не он (в
    том числе администратор); факультет уже выбрали другие студенты — тогда название меняет только
    администратор через `PUT /faculties/{id}`.
  - Другой факультет с таким названием в этом университете уже есть — `409`, как в
    `POST /me/faculty`.
- **`POST /me/group`** — студент создаёт группу, которой нет в `GET /groups?facultyId=&yearNumber=`,
  и сразу в неё зачисляется: в ответе `StudentDto` с новым `groupId`, в заголовке `Location` — адрес
  группы. Подтверждение администратора не требуется, группа сразу видна всем в списке групп курса.
  - Факультет и курс берутся из профиля студента. Если `facultyId` или `yearNumber` в профиле не
    заполнены — `422`.
  - Семестр подбирает сервер: актуальный семестр учебного года (факультет + курс) по тому же
    правилу, что и в `GET /groups` с фильтрами. Если учебного года или семестров у него ещё нет —
    они создаются. Новый семестр — текущее календарное полугодие: осенний с 1 сентября по 31 января,
    весенний с 1 февраля по 30 июня; в июле–августе создаётся ближайший осенний.
  - Группа с таким названием в этом семестре уже есть (без учёта регистра и крайних пробелов) —
    `409` с `field: "name"` и `id` существующей группы: клиент может предложить выбрать её через
    `PATCH /me`. Профиль студента при этом не меняется.
  - Если у студента уже была группа, он переходит в созданную; прежняя группа не удаляется.
  - Один студент может создать не больше 3 групп; четвёртая попытка — `422`. Считаются существующие
    группы, созданные им (`GroupDto.createdByStudentId`), в том числе те, из которых он уже вышел.
- **`PUT /me/group`** — студент исправляет название (и расшифровку) группы, в которой состоит, —
  например, опечатку. В ответе обновлённый `GroupDto`; семестр и состав группы не меняются.
  `fullName`, не переданный в теле, очищается.
  - Разрешено, только если студент сам создал эту группу и кроме него в ней никого нет. Иначе
    `422`: у студента нет группы; группу создал не он (в том числе администратор); в группе уже
    есть другие студенты — тогда название меняет только администратор через `PUT /groups/{id}`.
  - Клиент может заранее понять, показывать ли правку: `GroupDto.createdByStudentId` совпадает с
    `StudentDto.id`. Есть ли в группе другие студенты, по DTO не видно — это покажет только `422`.
  - Другая группа с таким названием в этом семестре уже есть — `409`, как в `POST /me/group`.
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

- `Departments` create/update/delete не защищены ролью (см. врезку в разделе `Faculties`
  выше; у `Faculties` закрыто в issue #87) — стоит уточнить у бэкенд-команды, до того как открывать соответствующие экраны не-`ADMIN`
  пользователям.
- `Teachers`: `POST /` (без `/register`) не привязан к Keycloak и не имеет ограничения по роли — не
  использовать этот путь для функции «регистрация преподавателя» в приложении, только `POST /register`.
- **Keycloak в dev-окружении редиректит на `localhost`, а не на хост фактического запроса** —
  `docker-compose.yml` жёстко задаёт `KC_HOSTNAME: localhost` без `--hostname-strict=false`/эквивалента для
  Keycloak 22. На Android-эмуляторе (`10.0.2.2` вместо `localhost`, см. `MOBILE.md`) это ломает
  Authorization Code + PKCE флоу сразу после ввода пароля: браузер получает `302` на
  `http://localhost:8082/...`, которое с эмулятора недостижимо (`ERR_CONNECTION_REFUSED`), и не долетает до
  `univer://auth/callback`. Подтверждено вживую с реальными учётными данными. Мобильное приложение здесь
  ничего не может исправить — нужна правка hostname-конфигурации Keycloak на стороне бэкенда. Не
  подтверждено, что это ещё актуально в текущей версии upstream `API.md` (та больше не содержит этот
  пункт) — возможно, перенесено в `MOBILE.md` бэкенд-репозитория или уже исправлено; перепроверить, если
  Authorization Code + PKCE снова начнёт падать на эмуляторе.
