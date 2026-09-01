# Диагностика и починка сборки Android (Windows)

Эта заметка описывает реальную последовательность проблем, с которыми
столкнулись при первом запуске проекта в эмуляторе Android на Windows,
и как каждая была решена. Полезно, если сборка снова перестанет
работать после переустановки окружения, обновления Android
Studio/SDK/Gradle или переноса репозитория на другую машину.

## Контекст

- React Native 0.86.3, New Architecture включена (`newArchEnabled=true`,
  `hermesEnabled=true`).
- Gradle 9.4.1, Android Gradle Plugin 8.12.0, Kotlin Gradle Plugin 2.1.20
  (идёт внутри `@react-native/gradle-plugin`), NDK 27.1.12297006.
- Разработка ведётся на Windows — часть проблем ниже специфична именно
  для Windows и не встретится на macOS/Linux.
- **Расположение проекта: `C:\dev\um`** (специально короткий путь без
  пробелов и кириллицы — см. проблему про 260 символов ниже). Изначально
  проект лежал в `...\Desktop\Space\projects\mobile\univer_mobile`,
  пришлось перенести.

## Симптом: «пустой экран» в эмуляторе

Если в эмуляторе просто пустой/чёрный экран — почти всегда это значит,
что приложение **вообще не собралось и не установилось**, а не что оно
упало после запуска. Первым делом проверяйте:

```powershell
adb devices                      # эмулятор должен быть виден со статусом "device"
adb shell pm list packages -3    # если приложения там нет — сборка не дошла до конца
```

Просто открыть AVD через Device Manager недостаточно — нужно ещё
собрать и установить APK (`npm run android` или `gradlew installDebug`).

## Проблемы и решения по порядку

### 1. `ANDROID_HOME` / `ANDROID_SDK_ROOT` не заданы

**Симптом:** `"adb" is not recognized`, `"gradlew.bat" is not recognized`.

**Решение:** прописать переменные окружения на уровне пользователя
(без прав администратора):

```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", "$env:LOCALAPPDATA\Android\Sdk", "User")
# и добавить в PATH: %ANDROID_HOME%\platform-tools, %ANDROID_HOME%\emulator
```

### 2. `NoDefaultCurrentDirectoryInExePath` ломает запуск `gradlew.bat`/`adb`

**Симптом:** даже находясь в правильной папке (`cd android`), команда
`gradlew.bat --version` (без `.\`) даёт "not recognized", хотя файл
точно существует.

**Причина:** пользовательская переменная окружения
`NoDefaultCurrentDirectoryInExePath=1` отключает в cmd.exe поиск
исполняемых файлов в текущей директории по умолчанию — это защитная
фича Windows, но она ломает типичный npm/RN workflow на Windows.

**Решение:** удалить переменную насовсем:

```powershell
[Environment]::SetEnvironmentVariable("NoDefaultCurrentDirectoryInExePath", $null, "User")
```

Или, если её нельзя трогать глобально, всегда явно писать `.\gradlew.bat`.

### 3. Осиротевшие процессы Metro занимают порт 8081

**Симптом:** повторный запуск `react-native run-android`/`npm start`
интерактивно спрашивает "Use port 8082 instead?" и зависает
(неинтерактивная сессия не может ответить на этот вопрос).

**Причина:** RN CLI запускает Metro в отдельном, отсоединённом (detached)
процессе — он не завершается автоматически, даже если сама сборка
упала или CLI закрылся.

**Решение:** найти и убить процесс перед повторным запуском:

```powershell
Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
Stop-Process -Id <PID> -Force
```

### 4. `android/gradle/gradle-daemon-jvm.properties` форсирует не тот JDK

Если в этом файле (генерируется задачей `updateDaemonJvm`, обычно не
закоммичен) прописан `toolchainVersion=25` — Gradle daemon попытается
использовать JDK 25 вместо ожидаемого JDK 17, что может дополнительно
провоцировать проблемы с версиями Kotlin (см. ниже). Если файл не
нужен намеренно — удалить его.

### 5. Несовместимость версий Kotlin: `Incompatible classes were found in dependencies`

**Симптом:**
```
:gradle-plugin:settings-plugin:compileKotlin FAILED
Module was compiled with an incompatible version of Kotlin.
The binary version of its metadata is 2.3.0, expected version is 2.1.0
```
Ошибка не пропадает даже после полной очистки кэшей (`gradlew --stop`,
удаление `.gradle`/`build`/`app/build`) — значит, дело не в устаревшем
кэше.

**Причина:** `@react-native/gradle-plugin` (composite build,
подключённый через `includeBuild()` из `node_modules`) использует
`implementation(gradleApi())` в своём `settings-plugin`. Это подтягивает
**собственный встроенный Kotlin-рантайм самого Gradle 9.4.1** (версия
2.3.0), который конфликтует с Kotlin Gradle Plugin, которым скомпилирован
сам плагин (2.1.20, умеет читать метаданные максимум до 2.2.0). Это
реальный баг несовместимости версий в этой конкретной связке
RN 0.86.3 + Gradle 9.4.1, а не ошибка в коде проекта.

**Решение:** Gradle init-скрипт `android/skip-metadata-check-init.gradle`
(добавлен в репозиторий) добавляет флаг компилятора
`-Xskip-metadata-version-check` ко всем задачам `compileKotlin`/
`compileTestKotlin`, включая included builds. Использовать его нужно на
**каждый** вызов gradle через флаг `--init-script`:

```powershell
.\gradlew.bat --init-script skip-metadata-check-init.gradle app:installDebug -PreactNativeDevServerPort=8081
```

`npm run android` этот флаг не прокидывает, поэтому для установки на
устройство/эмулятор надёжнее вызывать `gradlew.bat` напрямую (как выше),
либо запускать Metro отдельно (`npx react-native start`) и ставить APK
отдельно.

Можно будет убрать этот init-скрипт, когда React Native обновит
встроенный Kotlin Gradle Plugin до версии, читающей метаданные 2.3.0+.

### 6. `compileSdkVersion 37` не резолвится: `Failed to find target with hash string 'android-37'`

**Причина:** на машине после автозагрузки SDK через Gradle оказывается
установлена только "дробная" платформа `android-37.0` (пакет
`platforms;android-37.0`), а не простой `android-37`. AGP 8.12.0 явно
предупреждает, что протестирован только до compile SDK 36.0, и не умеет
резолвить/докачать обычный `android-37` в этой ситуации.

**Решение:** в `android/build.gradle` понизили:
```groovy
buildToolsVersion = "36.0.0"
compileSdkVersion = 36
```
(было `37.0.0` / `37`). `targetSdkVersion` осталась 36.

### 7. `ninja: error: Filename longer than 260 characters` при сборке C++ (New Architecture codegen)

**Симптом:**
```
:app:buildCMakeDebug[arm64-v8a] FAILED
ninja: error: Stat(rngesturehandler_codegen_autolinked_build/.../RNGestureHandlerDetectorShadowNode.cpp.o):
Filename longer than 260 characters
```

**Причина:** CMake/ninja при кодогенерации для New Architecture
зеркалит **весь абсолютный путь исходника** (включая букву диска, вида
`C_\Users\...`) в дерево объектных файлов сборки. Если проект лежит
глубоко вложенным путём (например, на Рабочем столе, в нескольких
подпапках), итоговый путь легко превышает 260 символов — классическое
ограничение Windows.

**⚠️ Включение `LongPathsEnabled` в реестре Windows это НЕ чинит.**
Мы включили длинные пути (`HKLM\SYSTEM\CurrentControlSet\Control\FileSystem\LongPathsEnabled = 1`,
плюс `git config --system core.longpaths true`) и даже перезагрузили
машину — ошибка повторилась один в один. Причина: `ninja.exe`, который
идёт в комплекте с Android SDK (cmake 3.22.1), использует **свою
собственную** проверку длины пути в коде, не завязанную на системный
Win32 API и эту настройку Windows.

**Реальное решение: перенести проект в короткий путь.** Мы перенесли
его в `C:\dev\um`. После переноса та же самая сборка (без каких-либо
других изменений) прошла успешно на всех ABI (`arm64-v8a`,
`armeabi-v7a`, `x86`, `x86_64`).

Практический вывод: держите этот (и любой другой RN-с-New-Architecture)
проект на Windows как можно ближе к корню диска, без пробелов и
глубокой вложенности папок (например, `C:\dev\<name>`, а не
`C:\Users\<user>\Desktop\...\...\...\<name>`).

#### Если понадобится снова перенести проект

Directory rename/move может упасть с `The process cannot access the
file because it is being used by another process`, если:
- открыт Android Studio или IntelliJ IDEA с этим проектом (закрыть IDE
  полностью, не просто окно — проверить в диспетчере задач, что процесс
  `studio64`/`idea64` реально завершился);
- работает Gradle daemon (`gradlew --stop` перед переносом);
- инструмент, которым выполняется перенос, сам находится (`cd`) внутри
  переносимой папки — нужно сначала выйти из неё.

Если `Move-Item` всё равно падает, а IDE точно закрыты — надёжнее
скопировать через `robocopy /E /MOVE` (копирует и сам удаляет исходники
файл за файлом, устойчивее к единичным блокировкам, чем атомарный
rename каталога):
```powershell
robocopy "<источник>" "<назначение>" /E /MOVE /R:2 /W:1 /NFL /NDL /NP /NJH
```

### 8. Эмулятор закрывается сам во время долгой сборки

После первой полной (holodной) сборки нативного кода на всех ABI
(~5-6 минут) эмулятор иногда успевает закрыться, и `app:installDebug`
падает с `No connected devices!`, хотя сама сборка (компиляция,
линковка, упаковка APK) уже полностью прошла успешно. В этом случае
просто перезапустите эмулятор и повторите `installDebug` — он
переиспользует уже собранный APK (`UP-TO-DATE` на всех задачах компиляции)
и займёт секунды.

## Рецепт «с нуля» после перезагрузки/новой машины

```powershell
# 1. Запустить эмулятор и дождаться загрузки
emulator -avd Pixel_10
# (дождаться, проверяя adb shell getprop sys.boot_completed == 1)

# 2. Собрать и установить (из android/, с воркэраундом по Kotlin):
cd C:\dev\um\android
.\gradlew.bat --init-script skip-metadata-check-init.gradle app:installDebug -PreactNativeDevServerPort=8081

# 3. Поднять Metro отдельно и пробросить порт
cd C:\dev\um
npx react-native start
adb reverse tcp:8081 tcp:8081

# 4. Запустить приложение
adb shell am start -n com.univer_mobile/.MainActivity
```

## Файлы, связанные с этими фиксами

- `android/build.gradle` — `compileSdkVersion`/`buildToolsVersion`
  понижены с 37/37.0.0 до 36/36.0.0 (см. проблему 6).
- `android/skip-metadata-check-init.gradle` — воркэраунд по Kotlin
  metadata (см. проблему 5). Безопасно удалить, когда апстрим починит
  версии.
