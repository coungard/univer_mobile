Продолжение #137 (аватары) и #135 (медиа). Нужно, чтобы фото и имя студента доходили до преподавателя.

Клиент: coungard/univer_mobile#94.

## Зачем

В ростере посещаемости на экране лекции преподаватель видит вместо студента обрезанный UUID — «Студент 1a2b3c4d»:

> Показан ID студента — карточка с ФИО недоступна роли «Преподаватель» (ограничение бэкенда, см. API.md: `GET /students/{id}` требует роль STUDENT у вызывающего).

Ростер на клиенте собирается из двух ответов:

| Запрос | Что даёт |
|---|---|
| `GET /api/v1/enrollments/course/{courseId}` | активные зачисления; в `EnrollmentDto` только `studentId` |
| `GET /api/v1/attendance/lecture/{lectureId}` | отметки; в `LectureAttendanceDto` только `studentId` |

`GET /api/v1/students/{id}` закрыт ролью `STUDENT` (`StudentController#getStudentById`), поэтому `TEACHER` не может разрезолвить ни ФИО, ни `avatarUrl` по `studentId`. В итоге имя и фото студента недоступны ровно там, где они нужны для проверки посещаемости, хотя в `StudentDto`/`TeacherDto` аватар уже отдаётся (#137).

## Что сделать

Добавить в ответ `EnrollmentDto` поля только для чтения (тот же приём, что `createdAt`/`updatedBy` в #119: во входящих запросах игнорируются):

| Поле | Значение |
|---|---|
| `studentFullname` | `Person.fullname` |
| `studentAvatarUrl` | 512×512, как `StudentDto.avatarUrl`; `null`, если фото нет |
| `studentAvatarThumbnailUrl` | 128×128, как `StudentDto.avatarThumbnailUrl`; `null`, если фото нет |

- `EnrollmentMapper` уже собирает DTO из `Enrollment` с загруженными `student`/`course` — внедрить в него `AvatarUrls` (бин из #137, там же `avatarUrls.full(mediaFile)` / `avatarUrls.thumbnail(mediaFile)`), как это делает `StudentMapper`, и заполнить три поля из `enrollment.getStudent().getPerson()`.
- `toEntity` не трогать: поля приходят только в ответе, `POST /enrollments` и `PUT /enrollments/{studentId}/{courseId}` должны работать без них.
- Ленивую загрузку `Enrollment.student` проверить: `toDto` вызывается внутри `@Transactional(readOnly = true)` в `EnrollmentServiceImpl`, но если появятся запросы вне транзакции или N+1 на страницу — добавить `@EntityGraph`/join fetch в `EnrollmentRepository` (по образцу других репозиториев), а не `EAGER`.

## Почему не открыть `GET /students/{id}` роли TEACHER

`StudentDto` — это весь профиль: `email`, `birthday`, `enrollmentDate`, `username`. Открытие эндпоинта роли `TEACHER` позволило бы любому преподавателю перебором UUID читать профили любых студентов, а не только своих. Список `GET /students` при этом остаётся `ADMIN`-only, так что имя в зачислении — минимально необходимый кусок.

Если позже понадобится карточка студента для преподавателя — отдельный slim-DTO (`id`, `fullname`, `groupId`, аватар) и проверка, что студент зачислен на курс, который ведёт вызывающий.

Отдельный `GET /attendance/lecture/{lectureId}/roster` (студент + отметка одним ответом) тоже возможен, но это join посещаемости с зачислениями плюс авторизация по владельцу лекции; сейчас клиент и так делает два запроса, и достаточно расширить уже существующий список зачислений.

## Замечание по безопасности (можно отдельной задачей)

`EnrollmentController#getEnrollmentsByCourse` вообще без `@PreAuthorize` — список зачислений любого курса читает любой аутентифицированный пользователь. С ФИО в ответе это становится заметнее. Закрыть `hasRole('ADMIN') or hasRole('TEACHER')` (в идеале — ещё и проверкой, что преподаватель действительно ведёт курс) стоит, но это изменение поведения, поэтому в текущую задачу не включаю. Клиент вызывает этот эндпоинт только с экрана преподавателя, так что ограничение ничего не сломает.

## Тесты

- `GET /enrollments/course/{courseId}` под токеном `TEACHER` → у зачислений заполнен `studentFullname`.
- Студент с аватаром → `studentAvatarUrl` и `studentAvatarThumbnailUrl` не `null`, ведут на существующие файлы; без аватара → оба `null`, без 500.
- `POST /enrollments` без новых полей → 200/201, как раньше; поля в ответе заполнены.
- `GET /students/{id}` под токеном `TEACHER` по-прежнему 403.

## Документация

- `API.md` — поля `EnrollmentDto`.
- `MOBILE.md` — преподаватель видит ФИО и аватар студента в ростере; после деплоя клиенту нужен `npm run sync-api` и правка в coungard/univer_mobile#94.
- `mvn test` зелёный.
