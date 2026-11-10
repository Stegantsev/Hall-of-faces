# Данные игры

Схема — [`src/data/schema.ts`](../src/data/schema.ts). Проверка — `pnpm validate` (`-- --sample` проверяет тестовые данные).

| Файл | Что это |
|---|---|
| `src/data/characters.json` | Реальная база персонажей |
| `src/data/houses.json` | Дома, на которые ссылаются персонажи |
| `src/data/results.json` | Лестница результатов: по одному персонажу на каждый счёт от 0 до 30 |
| `src/data/*.sample.json` | Небольшой стабильный набор для юнит-тестов, в игру не попадает |
| `public/portraits/`, `public/sigils/` | Иллюстрации и гербы. В JSON пути указываются без `public/` |
| `public/placeholders/` | Заглушки для тестового набора |

## Персонаж

Все тексты задаются как `{ "ru": "…", "en": "…" }`. Необязательные поля, если данных нет, не пишутся вовсе.

| Поле | Обяз. | Значения |
|---|---|---|
| `id` | да | kebab-case латиницей, например `eddard-stark` |
| `level` | да | `show` · `book` · `fanfic` |
| `race` | да | люди: `northman`, `ironborn`, `andal`, `valyrian`, `dornish`, `free_folk`, `first_men`, `dothraki`, `free_cities`, `ghiscari`, `summer_islander`, `other_essos`; нелюди: `direwolf`, `dragon`, `giant`, `child_of_the_forest`, `other`, `animal` |
| `name` | да | |
| `nickname`, `title`, `castle` | нет | |
| `gender` | да | `m` · `f` · `-` |
| `house` | нет | id из `houses.json` |
| `serves` | нет | id дома или персонажа |
| `facts` | да | от 1 до 10 фактов, без имени персонажа: используются как подсказка |
| `portrait` | да | `portraits/<id>.<ext>` |
| `extraPortraits` | нет | `[{ "src": "portraits/<id>--2.jpg", "caption": {…} }]` |
| `wiki.ru` / `wiki.en` | да | `https://7kingdoms.ru/…` / `https://awoiaf.westeros.org/…` |

## Другие языки

В данных хранятся только `ru` и `en`. Остальные языки (сейчас `mk`) лежат в `src/i18n/locales/<lang>.json` и загружаются, только когда игрок их выбрал:

- `ui` — строки интерфейса с теми же ключами, что в `src/i18n/en.json`;
- `data` — тексты данных по путям вроде `character.jon-snow.fact.2` (список путей — [`src/data/textPaths.ts`](../src/data/textPaths.ts)), в виде `{ "en": "<английский оригинал>", "text": "<перевод>" }`.

Если `text` пустой или `en` не совпадает с текущим английским текстом (перевод устарел), игра показывает английский. `pnpm locale:sync <lang>` добавляет в файл новые тексты и удаляет исчезнувшие, готовые переводы не трогает. `pnpm validate` показывает, сколько переведено, и перечисляет устаревшие переводы. Ссылки на вики для таких языков ведут на английскую, если у языка нет своей вики. Если есть (сейчас — испанская Hielo y Fuego, бразильская Gelo e Fogo, немецкая Das Lied von Eis und Feuer Wiki итальянская Il Trono di Spade Wiki и польская Gra o tron Wiki), её адрес задаётся в `LANG_WIKI` (`src/i18n/langs.ts`), а ссылки на страницы персонажей лежат в `src/i18n/wiki/<lang>.json` в виде `{ "<id персонажа>": "<url>" }`. Персонажи без страницы на этой вики ссылаются на английскую. Подпись кнопки называет сайт, на который ведёт ссылка (`{site}` в `reveal.wiki`).

Новый язык: добавить код в `LANGS` и название в `LANG_NAMES` (`src/i18n/langs.ts`), затем `pnpm locale:sync <lang>` и заполнить `text` в получившемся файле.

## Лестница результатов

`{ "score": 23, "characterId": "jon-snow", "captions": [{…}], "fixedCaption": {…} }`. Из `captions` фраза выбирается случайно. Если задан `fixedCaption`, показывается всегда он.

## Очки

Очки игроку не показываются. Верный ответ даёт 3 очка, каждая подсказка на этом вопросе отнимает 1, но верный ответ приносит минимум 1. Неверный ответ — 0. Подсказок 3 на всю игру. Максимум 30.
