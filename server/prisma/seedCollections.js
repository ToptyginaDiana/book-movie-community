
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const firstNames = [
  "Анна", "Максим", "София", "Артём", "Мария",
  "Дмитрий", "Анастасия", "Александр", "Дарина", "Андрей",
  "Елизавета", "Назар", "Виктория", "Богдан", "Полина",
  "Роман", "Екатерина", "Михаил", "Вероника", "Денис",
  "Юлия", "Кирилл", "Олена", "Владислав"
];

const lastNames = [
  "Коваль", "Шевченко", "Мельник", "Бондаренко",
  "Ткаченко", "Кравченко", "Савченко", "Мороз",
  "Петренко", "Поліщук", "Лисенко", "Романенко",
  "Олійник", "Павленко", "Марченко", "Гриценко",
  "Козак", "Бойко", "Іваненко", "Сидоренко",
  "Клименко", "Захарченко", "Дорошенко", "Коваленко"
];

const collectionsData = [
  {
    title: "Мир магии и фэнтези",
    description: "Книги, которые переносят в волшебные миры, полные приключений и необычных персонажей.",
    types: ["BOOK"],
    keywords: ["fantasy", "фэнтези"]
  },
  {
    title: "Книги, которые стоит прочитать каждому",
    description: "Интересные истории, которые заставляют задуматься и оставляют впечатление надолго.",
    types: ["BOOK"]
  },
  {
    title: "Детективы и загадки",
    description: "Истории с тайнами, расследованиями и неожиданными развязками.",
    types: ["BOOK"],
    keywords: ["mystery", "crime", "detective"]
  },
  {
    title: "Романтика и сильные чувства",
    description: "Истории о любви, отношениях и человеческих чувствах.",
    types: ["BOOK"],
    keywords: ["romance", "romantic"]
  },
  {
    title: "Научная фантастика",
    description: "Путешествия в будущее, технологии и невероятные миры.",
    types: ["BOOK"],
    keywords: ["science fiction", "sci-fi"]
  },
  {
    title: "Фильмы для уютного вечера",
    description: "Фильмы, которые приятно посмотреть после долгого дня.",
    types: ["MOVIE"],
    keywords: ["comedy", "romance"]
  },
  {
    title: "Лучшие драматические фильмы",
    description: "Сильные истории, эмоциональные сюжеты и запоминающиеся персонажи.",
    types: ["MOVIE"],
    keywords: ["drama"]
  },
  {
    title: "Фантастические миры",
    description: "Фильмы о космосе, будущем, магии и других мирах.",
    types: ["MOVIE"],
    keywords: ["science fiction", "fantasy"]
  },
  {
    title: "Захватывающие триллеры",
    description: "Напряжённые фильмы, от которых невозможно оторваться.",
    types: ["MOVIE"],
    keywords: ["thriller", "mystery"]
  },
  {
    title: "Мультфильмы и анимация",
    description: "Красочная анимация и истории для зрителей любого возраста.",
    types: ["MOVIE"],
    keywords: ["animation"]
  },
  {
    title: "Мои любимые истории",
    description: "Подборка интересных книг и фильмов разных жанров.",
    types: ["BOOK", "MOVIE"]
  }
];

async function setUserNames() {
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" }
  });

  console.log(`Найдено пользователей: ${users.length}`);

  for (let i = 0; i < users.length; i++) {
    const firstName = firstNames[i % firstNames.length];

    const lastName =
      lastNames[
        Math.floor(i / firstNames.length) % lastNames.length
      ];

    await prisma.user.update({
      where: { id: users[i].id },
      data: {
        displayName: `${firstName} ${lastName}`
      }
    });
  }

  console.log("Имена пользователей обновлены.");
}

async function getWorks(collectionData) {
  const result = [];

  for (const type of collectionData.types) {
    const where = { type };

    if (collectionData.keywords?.length) {
      where.OR = collectionData.keywords.map(keyword => ({
        genres: {
          some: {
            genre: {
              name: {
                contains: keyword,
                mode: "insensitive"
              }
            }
          }
        }
      }));
    }

    let works = await prisma.work.findMany({
      where,
      orderBy: [
        { popularity: "desc" },
        { averageRating: "desc" }
      ],
      take: collectionData.types.length > 1 ? 6 : 12,
      select: { id: true }
    });

    // Если подходящих жанров мало, берём другие произведения
    // того же типа, чтобы коллекция не осталась пустой.
    if (works.length < 6) {
      works = await prisma.work.findMany({
        where: { type },
        orderBy: [
          { popularity: "desc" },
          { averageRating: "desc" }
        ],
        take: 12,
        select: { id: true }
      });
    }

    result.push(...works);
  }

  // Убираем возможные повторения.
  return [...new Map(result.map(work => [work.id, work])).values()]
    .slice(0, 12);
}

async function createCollections() {
  const users = await prisma.user.findMany({
    where: { role: "READER" },
    orderBy: { id: "asc" }
  });

  if (users.length < collectionsData.length) {
    throw new Error(
      `Недостаточно пользователей READER. Нужно ${collectionsData.length}, найдено ${users.length}.`
    );
  }

  const existingCollections = await prisma.collection.findMany({
    orderBy: { id: "asc" },
    take: collectionsData.length
  });

  for (let i = 0; i < collectionsData.length; i++) {
    const data = collectionsData[i];
    const owner = users[i];

    let collection;

    if (existingCollections[i]) {
      collection = await prisma.collection.update({
        where: { id: existingCollections[i].id },
        data: {
          userId: owner.id,
          title: data.title,
          description: data.description,
          isPublic: true
        }
      });
    } else {
      collection = await prisma.collection.create({
        data: {
          userId: owner.id,
          title: data.title,
          description: data.description,
          isPublic: true
        }
      });
    }

    const works = await getWorks(data);

    if (works.length === 0) {
      console.log(`Для коллекции "${data.title}" не найдены произведения.`);
      continue;
    }

    await prisma.collectionWork.createMany({
      data: works.map((work, index) => ({
        collectionId: collection.id,
        workId: work.id,
        position: index + 1
      })),
      skipDuplicates: true
    });

    console.log(
      `Коллекция "${data.title}" — добавлено произведений: ${works.length}`
    );
  }
}

async function main() {
  console.log("Обновляем имена пользователей...");
  await setUserNames();

  console.log("\nСоздаём публичные коллекции...");
  await createCollections();

  console.log("\nГотово! Коллекции заполнены.");
}

main()
  .catch(error => {
    console.error("Ошибка:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
