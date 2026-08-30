Мобильное приложение на [**React Native**](https://reactnative.dev), созданное с помощью
[`@react-native-community/cli`](https://github.com/react-native-community/cli) — клиент для
бэкенда [`univer`](https://github.com/coungard/univer) (расписание, лекции, посещаемость).

Справочник REST API бэкенда — в [`API.md`](./API.md), план развития UI/UX — в
[`ROADMAP.md`](./ROADMAP.md).

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
