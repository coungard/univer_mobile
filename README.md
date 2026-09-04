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
по спецификации `MOBILE.md` бэкенд-репозитория. Настройки — в [`src/config/env.ts`](./src/config/env.ts)
(по умолчанию рассчитаны на локальный `docker-compose` бэкенда: Keycloak на `localhost:8082`,
API — на `localhost:8023`).

⚠️ На момент написания в Keycloak-конфиге бэкенда (`init-keycloak/realm-config.json` в
`coungard/univer`) ещё нет публичного клиента `univer-mobile`, описанного в `MOBILE.md` — только
служебный `univer-client`. Пока бэкенд-команда не добавит этот клиент, реальный вход через
локальный бэкенд будет падать с ошибкой Keycloak «client not found» (см.
[issue #1](https://github.com/coungard/univer_mobile/issues/1)); экраны и код при этом уже готовы.

### Тестовый аккаунт

Для входа на локальном `docker-compose`-бэкенде (реалм `univer-realm`) заведён тестовый студент:

- **Логин:** `student1`
- **Пароль:** `student123`

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
- **Физическое устройство** — ни `localhost`, ни `10.0.2.2` не сработают: нужно заменить хост в
  `env.ts` на LAN-IP машины с бэкендом (например, `192.168.x.x`), убедиться, что телефон и машина в
  одной сети, и что файрвол не блокирует входящие подключения на `8023`/`8082`.
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
