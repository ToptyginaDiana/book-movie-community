
const prisma = require("../src/lib/prisma");

// ID существующих тематических коллекций
const collectionSettings = [
  {
    id: 1,
    title: "Мир магии и фэнтези",
    type: "BOOK",
    genres: ["Фентезі", "Фантастика"]
  },
  {
    id: 2,
    title: "Книги, которые стоит прочитать каждому",
    type: "BOOK",
    genres: ["Драма", "Пригоди", "Історія", "Біографія"]
  },
  {
    id: 3,
    title: "Детективы и загадки",
    type: "BOOK",
    genres: ["Детектив", "Кримінал", "Трилер"]
  },
  {
    id: 4,
    title: "Романтика и сильные чувства",
    type: "BOOK",
    genres: ["Романтика", "Мелодрама", "Драма"]
  },
  {
    id: 5,
    title: "Научная фантастика",
    type: "BOOK",
    genres: ["Наукова фантастика", "Фантастика"]
  },
  {
    id: 6,
    title: "Фильмы для уютного вечера",
    type: "MOVIE",
    genres: ["Комедія", "Сімейний", "Романтика", "Пригоди"]
  },
  {
    id: 7,
    title: "Лучшие драматические фильмы",
    type: "MOVIE",
    genres: ["Драма", "Історія", "Біографія"]
  },
  {
    id: 8,
    title: "Фантастические миры",
    type: "MOVIE",
    genres: ["Фантастика", "Фентезі", "Наукова фантастика"]
  },
  {
    id: 9,
    title: "Захватывающие триллеры",
    type: "MOVIE",
    genres: ["Трилер", "Кримінал", "Жахи", "Детектив"]
  },
  {
    id: 10,
    title: "Мультфильмы и анимация",
    type: "MOVIE",
    genres: ["Анімація", "Сімейний"]
  }
];

const MIXED_COLLECTION_ID = 11;
const WORKS_PER_COLLECTION = 12;

// Нормализация названия для поиска повторов
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

async function main() {
  console.log("Получаем коллекции...");

  const collectionIds = [
    ...collectionSettings.map(item => item.id),
    MIXED_COLLECTION_ID
  ];

  const collections = await prisma.collection.findMany({
    where: {
      id: { in: collectionIds }
    }
  });

  if (collections.length !== 11) {
    throw new Error(
      `Ожидалось 11 коллекций, найдено: ${collections.length}`
    );
  }

  console.log("Получаем книги и фильмы...");

  const works = await prisma.work.findMany({
    include: {
      genres: {
        include: {
          genre: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: [
      { popularity: "desc" },
      { ratingCount: "desc" },
      { averageRating: "desc" },
      { id: "asc" }
    ]
  });

  const usedIds = new Set();
  const usedTitles = new Set();

  const selectedWorks = new Map();

  // Отбираем произведения для тематических коллекций
  function selectWorks(type, genreNames, count) {
    const candidates = works.filter(work => {
      if (work.type !== type) {
        return false;
      }

      if (usedIds.has(work.id)) {
        return false;
      }

      if (usedTitles.has(normalizeTitle(work.title))) {
        return false;
      }

      const workGenres = work.genres.map(
        item => item.genre.name
      );

      return genreNames.some(name =>
        workGenres.includes(name)
      );
    });

    const result = candidates.slice(0, count);

    // Если подходящих жанров не хватает,
    // дополняем коллекцию другими произведениями того же типа
    if (result.length < count) {
      const remaining = works.filter(work => {
        return (
          work.type === type &&
          !usedIds.has(work.id) &&
          !usedTitles.has(normalizeTitle(work.title)) &&
          !result.some(item => item.id === work.id)
        );
      });

      result.push(
        ...remaining.slice(0, count - result.length)
      );
    }

    for (const work of result) {
      usedIds.add(work.id);
      usedTitles.add(normalizeTitle(work.title));
    }

    return result;
  }

  // Заполняем первые 10 тематических коллекций
  for (const settings of collectionSettings) {
    const selected = selectWorks(
      settings.type,
      settings.genres,
      WORKS_PER_COLLECTION
    );

    if (selected.length !== WORKS_PER_COLLECTION) {
      throw new Error(
        `Не удалось подобрать 12 произведений для коллекции ${settings.id}`
      );
    }

    selectedWorks.set(settings.id, selected);

    console.log(
      `Коллекция ${settings.id}: ${selected.length} произведений`
    );
  }

  // Для последней коллекции выбираем ещё не использованные
  // 6 книг и 6 фильмов
  const mixedBooks = selectWorks("BOOK", [], 6);
  const mixedMovies = selectWorks("MOVIE", [], 6);

  if (mixedBooks.length !== 6 || mixedMovies.length !== 6) {
    throw new Error(
      "Не удалось заполнить смешанную коллекцию"
    );
  }

  selectedWorks.set(
    MIXED_COLLECTION_ID,
    [...mixedBooks, ...mixedMovies]
  );

  // Дополнительная проверка: все 132 произведения уникальны
  const allSelected = [
    ...selectedWorks.values()
  ].flat();

  if (
    allSelected.length !== 132 ||
    new Set(allSelected.map(work => work.id)).size !== 132 ||
    new Set(
      allSelected.map(work => normalizeTitle(work.title))
    ).size !== 132
  ) {
    throw new Error(
      "Обнаружены повторения или неправильное количество произведений"
    );
  }

  console.log("\nПроверка пройдена: 132 уникальных произведения.");

  // Только после успешной проверки заменяем связи
  await prisma.$transaction(async tx => {
    await tx.collectionWork.deleteMany({
      where: {
        collectionId: {
          in: collectionIds
        }
      }
    });

    const rows = [];

    for (const [collectionId, collectionWorks] of selectedWorks) {
      collectionWorks.forEach((work, index) => {
        rows.push({
          collectionId,
          workId: work.id,
          position: index + 1
        });
      });
    }

    await tx.collectionWork.createMany({
      data: rows
    });
  });

  console.log("\nКоллекции успешно перераспределены!");

  for (const [collectionId, collectionWorks] of selectedWorks) {
    console.log(
      `Коллекция ${collectionId}: ${collectionWorks.length} произведений`
    );
  }
}

main()
  .catch(error => {
    console.error("\nОшибка:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
