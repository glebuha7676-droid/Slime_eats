# Опубликованные настройки редакторов

Игра на GitHub Pages читает `food.js` и `worlds.js`. Локальные изменения редакторов не попадают сюда автоматически, потому что статический сайт не может записывать файлы репозитория.

1. В редакторе еды скачайте `slime-food-publish.json`.
2. В редакторе миров скачайте `slime-worlds-publish.json`.
3. Выполните:

   `node tools/publish-editor-catalogs.mjs slime-food-publish.json slime-worlds-publish.json`

4. Увеличьте версии `published/food.js` и `published/worlds.js` в HTML, затем опубликуйте изменения.
