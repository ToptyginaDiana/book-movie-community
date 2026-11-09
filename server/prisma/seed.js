
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

const TARGET = {
  books: 400,
  movies: 400,
  authors: 400,
  users: 300,
  ratings: 4000,
  reviews: 900
};

const GENRES = [
  "Фантастика", "Фентезі", "Детектив", "Романтика", "Драма",
  "Комедія", "Трилер", "Жахи", "Пригоди", "Історія",
  "Біографія", "Наукова фантастика", "Мелодрама", "Бойовик",
  "Документальний", "Містика", "Психологія", "Кримінал",
  "Сімейний", "Анімація"
];

const MOVIE_GENRES = {
  28: "Бойовик",
  12: "Пригоди",
  16: "Анімація",
  35: "Комедія",
  80: "Кримінал",
  99: "Документальний",
  18: "Драма",
  10751: "Сімейний",
  14: "Фентезі",
  36: "Історія",
  27: "Жахи",
  10402: "Драма",
  9648: "Детектив",
  10749: "Романтика",
  878: "Наукова фантастика",
  10770: "Драма",
  53: "Трилер",
  10752: "Історія",
  37: "Пригоди"
};

const BOOK_SUBJECT_GENRES = [
  { words: ["fantasy", "magic", "myth"], genre: "Фентезі" },
  { words: ["science fiction", "sci-fi", "space", "dystopia"], genre: "Наукова фантастика" },
  { words: ["mystery", "detective", "crime"], genre: "Детектив" },
  { words: ["romance", "love"], genre: "Романтика" },
  { words: ["horror", "ghost"], genre: "Жахи" },
  { words: ["history", "historical"], genre: "Історія" },
  { words: ["biography", "autobiography", "memoir"], genre: "Біографія" },
  { words: ["psychology", "self-help"], genre: "Психологія" },
  { words: ["comedy", "humor"], genre: "Комедія" },
  { words: ["adventure", "travel"], genre: "Пригоди" }
];

const NORMAL_REVIEWS = [
  "Мені сподобалося, як автор поступово розкриває тему твору. Історія залишає після себе багато думок.",
  "Цей твір справив на мене сильне враження. Особливо сподобалися атмосфера, розвиток подій і загальний настрій.",
  "На мою думку, це вдале поєднання цікавого задуму та добре побудованої історії. Однозначно вартий уваги.",
  "Спочатку темп здавався повільним, але поступово сюжет захопив. Після завершення захотілося обговорити його з іншими.",
  "Найбільше мені запам’яталися персонажі та їхні рішення. Вони роблять історію переконливою та емоційною.",
  "Твір порушує важливі теми й не намагається дати прості відповіді. Саме це робить його цікавим.",
  "Мені сподобалася цілісність історії та увага до деталей. Деякі моменти особливо добре запам’ятовуються.",
  "Це не ідеальний твір, але його сильні сторони переважають недоліки. Я б рекомендував його шанувальникам жанру.",
  "Після знайомства з твором залишилося приємне враження. Хочеться повернутися до нього через деякий час.",
  "Цікава робота з темами та персонажами. Історія змушує співпереживати й уважніше ставитися до деталей."
];

const SPOILER_REVIEWS = [
  "Увага, спойлери. Фінальні події змусили мене по-іншому подивитися на попередні епізоди. Після розкриття головної таємниці багато деталей набувають нового значення.",
  "Є спойлери. Найсильніше на мене вплинуло завершення історії. Воно не виглядає випадковим і добре підсумовує теми, які розкривалися протягом твору.",
  "Спойлер. Рішення головного персонажа наприкінці стало для мене найважливішим моментом. Я не повністю з ним погоджуюся, але розумію його мотивацію.",
  "Містить спойлери. Після фіналу захотілося повернутися до початку й помітити підказки, які раніше здавалися незначними.",
  "Увага: спойлери. Розв’язка виявилася емоційною. Особливо цікаво, як останні події змінюють сприйняття стосунків між персонажами.",
  "Є спойлери до фіналу. Мені сподобалося, що історія не завершується надто просто. Наслідки рішень персонажів відчуваються до останніх сторінок або хвилин.",
  "Спойлер. Останній поворот сюжету був несподіваним, але після завершення він здається логічним. Саме такі деталі роблять твір цікавим для повторного перегляду чи читання.",
  "Містить спойлери. Фінальна сцена залишила неоднозначні почуття. Вона добре підкреслює основну думку твору та змушує замислитися над вибором героїв.",
  "Увага, спойлери. Мені сподобалося, що автор не забув про наслідки попередніх подій. Завершення пов’язує кілька сюжетних ліній в одну історію.",
  "Спойлер до завершення. Після розв’язки я ще довго обмірковував мотивацію персонажів. Не всі їхні вчинки можна виправдати, але вони роблять історію живою."
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJson(url, label) {
  let lastError;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "BookMovieCommunity/1.0 (seed script)" }
      });

      if (response.status === 429 || response.status >= 500) {
        await sleep(1000 * attempt);
        continue;
      }

      if (!response.ok) {
        throw new Error(`${label}: HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      await sleep(700 * attempt);
    }
  }

  throw lastError || new Error(`Не вдалося отримати дані: ${label}`);
}

async function mapLimit(items, limit, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await callback(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );

  return results;
}

function cleanText(value) {
  if (Array.isArray(value)) value = value[0];
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function bookGenre(subjects = []) {
  const normalized = subjects.join(" ").toLowerCase();

  for (const item of BOOK_SUBJECT_GENRES) {
    if (item.words.some(word => normalized.includes(word))) {
      return item.genre;
    }
  }

  return "Драма";
}

function ukrainianBookDescription(book) {
  const year = book.year ? ` Рік першого видання — ${book.year}.` : "";

  return `«${book.title}» — літературний твір ${book.author}. Видання входить до книжкового каталогу спільноти та належить до жанру «${book.genre}».${year} Цей запис містить бібліографічні відомості й обкладинку видання.`;
}

function ukrainianMovieDescription(movie) {
  const year = movie.year ? ` Рік виходу — ${movie.year}.` : "";
  const overview = cleanText(movie.overview);

  const isUkrainian = /[іїєґІЇЄҐ]/.test(overview);

  if (overview && isUkrainian) {
    return overview;
  }

  return `«${movie.title}» — фільм режисера ${movie.author}. Стрічка представлена в каталозі спільноти в жанрі «${movie.genre}».${year} Картка містить основні відомості про фільм і його постер.`;
}

async function loadBooks() {
  console.log("Завантажуємо книжки з Open Library...");

  const found = new Map();

  const queries = [
    "subject:fiction",
    "subject:fantasy",
    "subject:mystery",
    "subject:romance",
    "subject:science_fiction",
    "subject:history",
    "subject:biography",
    "subject:adventure"
  ];

  for (const query of queries) {
    for (let page = 1; page <= 5 && found.size < TARGET.books * 2; page++) {
      const url = new URL("https://openlibrary.org/search.json");
      url.searchParams.set("q", query);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "100");
      url.searchParams.set(
        "fields",
        "key,title,author_name,first_publish_year,cover_i,subject"
      );

      const data = await fetchJson(url.toString(), "Open Library");

      for (const doc of data.docs || []) {
        const title = cleanText(doc.title);
        const author = cleanText(doc.author_name?.[0]);

        if (!doc.key || !title || !author || found.has(doc.key)) continue;

        found.set(doc.key, {
          title,
          author,
          year: Number.isInteger(doc.first_publish_year)
            ? doc.first_publish_year
            : null,
          poster: doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
            : null,
          subjects: doc.subject || []
        });
      }

      await sleep(250);

      if (page >= 2 && data.numFound && page * 100 >= data.numFound) {
        break;
      }
    }

    if (found.size >= TARGET.books) break;
  }

  const books = [...found.values()].slice(0, TARGET.books);

  if (books.length < TARGET.books) {
    throw new Error(
      `Open Library повернула лише ${books.length} придатних книжок замість ${TARGET.books}. Базу ще не змінено.`
    );
  }

  return books.map(book => {
    const genre = bookGenre(book.subjects);

    return {
      ...book,
      type: "BOOK",
      genre,
      description: ukrainianBookDescription({ ...book, genre }),
      popularity: 1
    };
  });
}

async function loadMovies(apiKey) {
  console.log("Завантажуємо фільми з TMDB...");

  const candidates = new Map();

  for (let page = 1; page <= 35 && candidates.size < 650; page++) {
    const url = new URL("https://api.themoviedb.org/3/discover/movie");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("language", "uk-UA");
    url.searchParams.set("include_adult", "false");
    url.searchParams.set("sort_by", "popularity.desc");
    url.searchParams.set("page", String(page));

    const data = await fetchJson(url.toString(), "TMDB discover");

    for (const movie of data.results || []) {
      if (!movie.id || !movie.poster_path || candidates.has(movie.id)) continue;

      candidates.set(movie.id, movie);
    }

    if (page >= data.total_pages) break;

    await sleep(150);
  }

  const list = [...candidates.values()];

  const withDirectors = await mapLimit(list, 6, async movie => {
    const url = new URL(`https://api.themoviedb.org/3/movie/${movie.id}/credits`);
    url.searchParams.set("api_key", apiKey);

    const credits = await fetchJson(url.toString(), `TMDB credits ${movie.id}`);
    const director = (credits.crew || []).find(person => person.job === "Director");

    if (!director?.name) return null;

    const title = cleanText(movie.title || movie.original_title);

    const year = movie.release_date
      ? Number(movie.release_date.slice(0, 4))
      : null;

    const genre = (movie.genre_ids || [])
      .map(id => MOVIE_GENRES[id])
      .find(Boolean) || "Драма";

    const result = {
      title,
      author: cleanText(director.name),
      year: Number.isInteger(year) ? year : null,
      poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      overview: movie.overview || "",
      genre,
      type: "MOVIE",
      popularity: Math.max(1, Math.round(movie.popularity || 1))
    };

    result.description = ukrainianMovieDescription(result);

    return result;
  });

  const movies = withDirectors.filter(Boolean).slice(0, TARGET.movies);

  if (movies.length < TARGET.movies) {
    throw new Error(
      `TMDB повернув лише ${movies.length} фільмів із режисерами замість ${TARGET.movies}. Базу ще не змінено.`
    );
  }

  return movies;
}

// 300 — мінімальна кількість користувачів.
// Якщо в базі вже більше 300 акаунтів, усі вони залишаються.
async function ensureUsers() {
  let users = await db.user.findMany({ orderBy: { id: "asc" } });

  if (users.length >= TARGET.users) {
    console.log(
      `Користувачів у базі вже ${users.length}. Усі акаунти збережено.`
    );

    return users;
  }

  console.log(
    `Додаємо ${TARGET.users - users.length} тестових користувачів...`
  );

  const password = await bcrypt.hash("password123", 10);

  const existingUsernames = new Set(users.map(user => user.username));
  const existingEmails = new Set(users.map(user => user.email));

  const newUsers = [];

  let number = 1;

  while (users.length + newUsers.length < TARGET.users) {
    const username = `читач_${String(number).padStart(3, "0")}`;
    const email = `reader${String(number).padStart(3, "0")}@bookmovie.com`;

    if (
      !existingUsernames.has(username) &&
      !existingEmails.has(email)
    ) {
      newUsers.push({
        username,
        email,
        password,
        role: "READER"
      });

      existingUsernames.add(username);
      existingEmails.add(email);
    }

    number++;
  }

  await db.user.createMany({ data: newUsers });

  users = await db.user.findMany({ orderBy: { id: "asc" } });

  return users;
}

function makeReview(index, workTitle) {
  const hasSpoilers = index % 3 === 0;
  const templates = hasSpoilers ? SPOILER_REVIEWS : NORMAL_REVIEWS;
  const text = templates[index % templates.length];

  return {
    text: `${text}\n\nТвір: «${workTitle}».`,
    hasSpoilers
  };
}

async function main() {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Не знайдено TMDB_API_KEY. Додай ключ у server/.env. Сам ключ у чат надсилати не потрібно."
    );
  }

  // Усі зовнішні дані отримуємо ДО очищення таблиць.
  // Якщо API не поверне потрібну кількість записів, чинна база залишиться без змін.
  const [books, movies] = await Promise.all([
    loadBooks(),
    loadMovies(apiKey)
  ]);

  const allWorks = [...books, ...movies];

  // Формуємо рівно 400 унікальних авторів/режисерів.
  const authorFrequency = new Map();

  for (const work of allWorks) {
    authorFrequency.set(
      work.author,
      (authorFrequency.get(work.author) || 0) + 1
    );
  }

  const authorNames = [...authorFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, TARGET.authors);

  if (authorNames.length < TARGET.authors) {
    throw new Error(
      `Знайдено лише ${authorNames.length} унікальних авторів і режисерів. Потрібно ${TARGET.authors}. Базу ще не змінено.`
    );
  }

  const authorSet = new Set(authorNames);

  const users = await ensureUsers();

  console.log("Перевірка даних пройдена. Починаємо оновлення каталогу...");

  // Видалення творів запускає каскадне видалення їхніх оцінок,
  // рецензій, статусів, жанрових та авторських зв'язків,
  // а також елементів творів у колекціях.
  // Самі користувачі, паролі, ролі, колекції та підписки залишаються.
  await db.work.deleteMany();
  await db.author.deleteMany();
  await db.genre.deleteMany();

  await db.genre.createMany({
    data: GENRES.map(name => ({ name }))
  });

  const genreRows = await db.genre.findMany();

  const genreMap = new Map(
    genreRows.map(genre => [genre.name, genre.id])
  );

  await db.author.createMany({
    data: authorNames.map(name => ({
      name,
      biography: null,
      birthYear: null
    }))
  });

  const authorRows = await db.author.findMany();

  const authorMap = new Map(
    authorRows.map(author => [author.name, author.id])
  );

  const createdWorks = [];

  for (const work of allWorks) {
    const created = await db.work.create({
      data: {
        title: work.title,
        description: work.description,
        type: work.type,
        releaseYear: work.year,
        poster: work.poster,
        popularity: work.popularity || 1
      }
    });

    createdWorks.push(created);

    if (authorSet.has(work.author)) {
      await db.workAuthor.create({
        data: {
          workId: created.id,
          authorId: authorMap.get(work.author)
        }
      });
    }

    const genreId = genreMap.get(work.genre) || genreMap.get("Драма");

    await db.workGenre.create({
      data: {
        workId: created.id,
        genreId
      }
    });
  }

  console.log("Каталог творів створено. Додаємо оцінки...");

  // Рівно 5 оцінок на кожен із 800 творів = 4000 оцінок.
  const ratingData = [];

  for (let workIndex = 0; workIndex < createdWorks.length; workIndex++) {
    for (let slot = 0; slot < 5; slot++) {
      const user = users[(workIndex * 5 + slot) % users.length];

      ratingData.push({
        userId: user.id,
        workId: createdWorks[workIndex].id,
        score: 6 + ((workIndex + slot * 2) % 5)
      });
    }
  }

  for (let start = 0; start < ratingData.length; start += 500) {
    await db.rating.createMany({
      data: ratingData.slice(start, start + 500)
    });
  }

  console.log("Додаємо 900 рецензій, зокрема зі спойлерами...");

  const reviewData = [];

  for (let index = 0; index < TARGET.reviews; index++) {
    const work = createdWorks[index % createdWorks.length];
    const user = users[(index * 17) % users.length];

    const review = makeReview(
      index,
      allWorks[index % allWorks.length].title
    );

    reviewData.push({
      userId: user.id,
      workId: work.id,
      text: review.text,
      hasSpoilers: review.hasSpoilers
    });
  }

  for (let start = 0; start < reviewData.length; start += 300) {
    await db.review.createMany({
      data: reviewData.slice(start, start + 300)
    });
  }

  // Оновлюємо середній рейтинг та кількість оцінок.
  await db.$executeRaw`
    UPDATE "Work"
    SET
      "averageRating" = COALESCE(stats.average, 0),
      "ratingCount" = COALESCE(stats.total, 0)
    FROM (
      SELECT
        "workId",
        AVG(score)::double precision AS average,
        COUNT(*)::integer AS total
      FROM "Rating"
      GROUP BY "workId"
    ) AS stats
    WHERE "Work".id = stats."workId"
  `;

  const [
    workCount,
    authorCount,
    userCount,
    ratingCount,
    reviewCount,
    spoilerCount
  ] = await Promise.all([
    db.work.count(),
    db.author.count(),
    db.user.count(),
    db.rating.count(),
    db.review.count(),
    db.review.count({ where: { hasSpoilers: true } })
  ]);

  console.log("\n========== РЕЗУЛЬТАТ СИДУ ==========");
  console.log(`Творів: ${workCount} (книг: ${books.length}, фільмів: ${movies.length})`);
  console.log(`Авторів і режисерів: ${authorCount}`);
  console.log(`Користувачів: ${userCount}`);
  console.log(`Оцінок: ${ratingCount}`);
  console.log(`Рецензій: ${reviewCount}`);
  console.log(`Рецензій зі спойлерами: ${spoilerCount}`);
  console.log("====================================");
  console.log("Заповнення бази даних завершено!");
}

main()
  .catch(error => {
    console.error("\nПомилка заповнення бази:", error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
