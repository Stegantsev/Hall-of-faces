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

## Лестница результатов

`{ "score": 23, "characterId": "jon-snow", "captions": [{…}], "fixedCaption": {…} }`. Из `captions` фраза выбирается случайно. Если задан `fixedCaption`, показывается всегда он.

## Очки

Очки игроку не показываются. Верный ответ даёт 3 очка, каждая подсказка на этом вопросе отнимает 1, но верный ответ приносит минимум 1. Неверный ответ — 0. Подсказок 3 на всю игру. Максимум 30.
