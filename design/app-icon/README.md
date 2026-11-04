# Иконка приложения (#79)

Концепт **02 «Монограмма U»** с [canvas](https://claude.ai/artifact/QKb3cMWoc5UjsnPkeGZ8P8): крупная «U» шрифтом Lora Bold (переведена в кривые, от шрифта не зависит) и полоска из пяти корешков «Library»: терракота, золото, зелёный, ржавый, синий.

## Исходники
- `icon.svg` — основная, светлая (кремовый фон `#F8F1E7`, чернила `#271D17`);
- `icon-dark.svg` — тёмная, палитра «Переплёт» (#62);
- `icon-tinted.svg` — оттенки серого для режима tinted в iOS 18+.

Геометрия задана в `generate.cjs` в координатах 100×100: «U» 62 единицы, базовая линия 68, полоска `27.5…72.5 × 76…81`.

## Что генерируется
| Платформа | Файлы |
|---|---|
| iOS | `ios/univer_mobile/Images.xcassets/AppIcon.appiconset/` — `AppIcon.png`, `AppIcon-Dark.png`, `AppIcon-Tinted.png` (1024×1024, без альфа-канала) и `Contents.json` (single size, Xcode 16+) |
| Android 8+ | `res/mipmap-anydpi-v26/ic_launcher{,_round}.xml` (adaptive icon), `res/drawable/ic_launcher_foreground.xml`, `res/drawable/ic_launcher_monochrome.xml` (themed icons, Android 13+), `res/values/ic_launcher_background.xml` |
| Android 7 | `res/mipmap-*dpi/ic_launcher{,_round}.png` |

На Android дизайн 100×100 вписан в видимые 72 dp из 108 dp, поэтому «U» и полоска остаются в безопасной зоне при любой маске лаунчера.

## Перегенерировать
Зависимости в проект не входят, их ставят отдельно:

```sh
npm i --prefix /tmp/icon-deps @resvg/resvg-js@2.6.2 opentype.js@1.3.4 pngjs@7.0.0
NODE_PATH=/tmp/icon-deps/node_modules node design/app-icon/generate.cjs
```

Руками сгенерированные файлы не правьте: меняйте `generate.cjs` и запускайте его заново.
