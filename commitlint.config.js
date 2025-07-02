module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Type enum - разрешенные типы коммитов
    "type-enum": [
      2,
      "always",
      [
        "feat", // новая функциональность
        "fix", // исправление багов
        "docs", // документация
        "style", // форматирование, отсутствующие точки с запятой и т.д.; без изменений кода
        "refactor", // рефакторинг production кода
        "test", // добавление тестов, рефакторинг тестов; без изменений production кода
        "chore", // обновление grunt tasks и т.д.; без изменений production кода
        "perf", // улучшения производительности
        "ci", // изменения CI/CD конфигурации
        "build", // изменения системы сборки или внешних зависимостей
        "revert", // откат предыдущего коммита
      ],
    ],
    // Максимальная длина заголовка
    "header-max-length": [2, "always", 100],
    // Минимальная длина subject (отключено для flexibility)
    "subject-min-length": [0],
    // Subject не должен заканчиваться точкой
    "subject-full-stop": [2, "never", "."],
    // Subject может быть в любом регистре (для flexibility)
    "subject-case": [0],
    // Type должен быть в нижнем регистре
    "type-case": [2, "always", "lower-case"],
    // Type не должен быть пустым
    "type-empty": [2, "never"],
    // Subject не должен быть пустым
    "subject-empty": [2, "never"],
    // Body должно начинаться с пустой строки
    "body-leading-blank": [1, "always"],
    // Footer должен начинаться с пустой строки
    "footer-leading-blank": [1, "always"],
  },
};
