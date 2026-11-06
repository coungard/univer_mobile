Мобильное приложение на [**React Native**](https://reactnative.dev), созданное с помощью
[`@react-native-community/cli`](https://github.com/react-native-community/cli) — клиент для
бэкенда [`univer`](https://github.com/coungard/univer) (расписание, лекции, посещаемость).

Справочник REST API бэкенда — в [`API.md`](./API.md), план развития UI/UX — в
[`ROADMAP.md`](./ROADMAP.md).

## Синхронизация с бэкендом

Типы DTO (`src/api/types.ts`) не пишутся руками — они выводятся из живой OpenAPI-спеки бэкенда
(`src/api/generated/schema.ts`, сгенерирован `openapi-typescript`). Это единственный источник
правды по контракту API между двумя репозиториями: бэкенд может уйти вперёд (новое поле, смена
типа, новый эндпоинт), а мобильный клиент подхватывает это перегенерацией, а не ручной правкой
интерфейсов, которая рано или поздно разъедется с реальным кодом бэкенда.

Перегенерировать после любого изменения контракта в `coungard/univer` (при поднятом локально
бэкенде на `localhost:8023`):

```sh
npm run sync-api
```

Файл `src/api/generated/schema.ts` — сгенерированный, коммитится в репозиторий (чтобы проект
собирался без обязательного живого бэкенда под рукой), но не редактируется руками — правки
пропадут при следующей генерации.

## Авторизация (Keycloak)

Вход реализован как Authorization Code + PKCE через системный браузер (`react-native-app-auth`),
по спецификации `MOBILE.md` бэкенд-репозитория. Настройки — в [`src/config/env.ts`](./src/config/env.ts).
Сервер выбирается сборкой:

| Сборка | Бэкенд | API | Keycloak |
|---|---|---|---|
| Debug (эмуляторы, Metro) | локальный `docker-compose` | `http://localhost:8023` (`10.0.2.2` на Android) | `https://localhost:8443` |
| Release (телефон) | стенд на VDS (DEPLOY.md бэкенда) | `https://api.univerapp.ru` | `https://auth.univerapp.ru` |

### Тестовые аккаунты

Для входа на локальном `docker-compose`-бэкенде (реалм `univer-realm`) заведены тестовые студент и
преподаватель (на стенде пароли свои — из `.env.prod` на сервере):

| Роль | Логин | Пароль |
|---|---|---|
| Студент | `student1` | `student123` |
| Преподаватель | `gamid_teacher_dgtu` | `teacher123` |

Если вход всё равно падает с `AuthorizationException: Invalid ID Token` — это не пароль, а часы
эмулятора; см. ANDROID_TROUBLESHOOTING.md, пункт 10.

## Локальный бэкенд и эмулятор

Чтобы собранное приложение достучалось до бэкенда, поднятого локально (`docker-compose` в
`coungard/univer`, порты `8023`/`8082`):

- **Android-эмулятор (AVD)** — работает в собственной виртуальной сети: `localhost` там означает сам
  эмулятор, а не хост-машину. [`src/config/env.ts`](./src/config/env.ts) уже учитывает это и
  подставляет специальный алиас эмулятора `10.0.2.2` вместо `localhost`, когда `Platform.OS ===
  'android'` — никаких доп. действий не требуется, если бэкенд поднят на той же машине, где
  запущен эмулятор.
- **iOS-симулятор** — использует сетевое пространство хоста напрямую, `localhost` работает как
  есть (уже настроено).
- **Физическое устройство** — ставится Release-сборка, она работает со стендом, см.
  [«Установка на iPhone»](#установка-на-iphone-стенд) ниже.
- **Cleartext HTTP** — бэкенд и Keycloak сейчас на голом `http://`, не `https://`. На Android это
  разрешено автоматически в debug-сборке (React Native Gradle Plugin сам выставляет
  `usesCleartextTraffic=true` для `debug`/`debugOptimized`, `false` для `release`) — специально
  ничего настраивать не нужно, но **это не будет работать в release-сборке** без отдельной
  network security config. На iOS уже включён `NSAllowsLocalNetworking` в `Info.plist`.

# Начало работы

> **Примечание**: перед началом убедитесь, что вы выполнили инструкции из
> [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment).

## Шаг 1: запустите Metro

Сначала нужно запустить **Metro** — JavaScript-сборщик для React Native.

Из корня проекта выполните:

```sh
# Через npm
npm start

# ИЛИ через Yarn
yarn start
```

## Шаг 2: соберите и запустите приложение

Пока Metro работает, откройте новое окно/вкладку терминала из корня проекта и выполните одну из
следующих команд, чтобы собрать и запустить приложение на Android или iOS:

### Android

```sh
# Через npm
npm run android

# ИЛИ через Yarn
yarn android
```

### iOS

Для iOS не забудьте установить зависимости CocoaPods (нужно делать только при первом клонировании
или после обновления нативных зависимостей).

При первом создании проекта нужно установить сам Ruby-бандлер для CocoaPods:

```sh
bundle install
```

Затем, при каждом обновлении нативных зависимостей, выполняйте:

```sh
bundle exec pod install
```

Подробнее — в [руководстве CocoaPods по началу работы](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Через npm
npm run ios

# ИЛИ через Yarn
yarn ios
```

Если всё настроено верно, вы увидите приложение в Android-эмуляторе, iOS-симуляторе или на
подключённом устройстве.

Это лишь один из способов запуска — приложение также можно собрать напрямую из Android Studio или
Xcode.

## Установка на iPhone (стенд)

На телефон ставится **Release**-сборка: JavaScript вшит в приложение, Metro и Мак после установки не
нужны, а бэкенд — стенд `api.univerapp.ru` / `auth.univerapp.ru` с настоящими сертификатами.

Один раз:

1. **Xcode → Settings → Accounts**: добавить свой Apple ID. Появится команда «Имя (Personal Team)».
2. **iPhone → Настройки → Конфиденциальность и безопасность → Режим разработчика**: включить,
   телефон перезагрузится. Пункт появляется после первого подключения iPhone к Маку с открытым Xcode.
3. Подключить iPhone кабелем, на телефоне нажать «Доверять этому компьютеру».

Сборка и установка:

```sh
git pull
npm install
cd ios && bundle exec pod install && cd ..
open ios/univer_mobile.xcworkspace
```

В Xcode:

1. Цель **univer_mobile → Signing & Capabilities**: включить **Automatically manage signing**, **Team** —
   свою «(Personal Team)». Bundle Identifier — `ru.univerapp.mobile`, менять не нужно.
2. **Product → Scheme → Edit Scheme… → Run → Build Configuration: Release**.
3. Сверху выбрать подключённый iPhone вместо симулятора и нажать **Run** (⌘R).

Или из терминала, если подпись уже настроена в Xcode:

```sh
npx react-native run-ios --mode Release --device
```

При первом запуске iOS скажет «Ненадёжный разработчик»: **Настройки → Основные → VPN и управление
устройством → Apple Development: <ваш Apple ID> → Доверять**.

С бесплатным аккаунтом (Personal Team) подпись живёт **7 дней**: потом приложение перестаёт открываться,
и его нужно заново поставить с Мака теми же шагами (данные при этом сохраняются). На одном телефоне
одновременно может быть не больше трёх приложений с такой подписью.

После установки схему лучше вернуть в **Debug** (п. 2): `npm run ios` для симулятора работает с
локальным бэкендом и Metro.

## Шаг 3: внесите изменения

Теперь, когда приложение успешно запущено, можно вносить изменения!

Откройте `App.tsx` в любом текстовом редакторе и что-нибудь измените. После сохранения приложение
автоматически обновится — это работает благодаря [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

Если нужно принудительно перезагрузить приложение (например, чтобы сбросить состояние), выполните
полную перезагрузку:

- **Android**: дважды нажмите клавишу <kbd>R</kbd> или выберите **"Reload"** в **Dev Menu**,
  которое открывается по <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) или <kbd>Cmd ⌘</kbd> +
  <kbd>M</kbd> (macOS).
- **iOS**: нажмите <kbd>R</kbd> в iOS-симуляторе.

## Поздравляем! :tada:

Вы успешно запустили и изменили ваше React Native приложение. :partying_face:

### Что дальше?

- Если хотите добавить этот React Native-код в уже существующее приложение, посмотрите
  [руководство по интеграции](https://reactnative.dev/docs/integration-with-existing-apps).
- Если хотите узнать больше о React Native — загляните в
  [документацию](https://reactnative.dev/docs/getting-started).

# Решение проблем

Если на предыдущих шагах что-то пошло не так, посмотрите страницу
[Troubleshooting](https://reactnative.dev/docs/troubleshooting).

# Узнать больше

Чтобы узнать больше о React Native, посмотрите следующие материалы:

- [Сайт React Native](https://reactnative.dev) — подробнее о React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) — **обзор** React Native и
  настройка окружения.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) — **экскурсия** по основам
  React Native.
- [Блог](https://reactnative.dev/blog) — последние записи официального **блога** React Native.
- [`@facebook/react-native`](https://github.com/facebook/react-native) — репозиторий React Native
  с открытым исходным кодом на GitHub.
