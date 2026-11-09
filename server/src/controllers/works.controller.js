
const prisma = require("../lib/prisma");

async function getWorks(req, res) {
  try {
    const {
      type,
      genre,
      year,
      minRating,
      search,
      sort = "newest",
      page = "1"
    } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = 1000;
    const where = {};

    if (type && ["BOOK", "MOVIE"].includes(type.toUpperCase())) {
      where.type = type.toUpperCase();
    }

    if (genre) {
      where.genres = {
        some: {
          genre: {
            name: {
              equals: genre,
              mode: "insensitive"
            }
          }
        }
      };
    }

    if (year) {
      where.releaseYear = Number(year);
    }

    if (minRating) {
      where.averageRating = {
        gte: Number(minRating)
      };
    }

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive"
      };
    }

    let orderBy = { createdAt: "desc" };

    if (sort === "rating") {
      orderBy = { averageRating: "desc" };
    }

    if (sort === "popularity") {
      orderBy = { popularity: "desc" };
    }

    let items = await prisma.work.findMany({
      where,
      include: {
        genres: {
          include: { genre: true }
        },
        authors: {
          include: { author: true }
        }
      },
      orderBy,
      take: pageSize,
      skip: (currentPage - 1) * pageSize
    });

    if (sort === "newest" && !type) {
      items = items.sort(() => Math.random() - 0.5);
    }

    const total = await prisma.work.count({ where });

    res.json({
      items,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error("Помилка отримання каталогу:", error);

    res.status(500).json({
      message: "Не вдалося отримати каталог"
    });
  }
}

async function getWork(req, res) {
  try {
    const id = Number(req.params.id);

    const work = await prisma.work.findUnique({
      where: { id },
      include: {
        genres: {
          include: { genre: true }
        },
        authors: {
          include: { author: true }
        },
        reviews: {
          where: { isHidden: false },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!work) {
      return res.status(404).json({
        message: "Твір не знайдено"
      });
    }

    res.json(work);
  } catch (error) {
    console.error("Помилка отримання твору:", error);

    res.status(500).json({
      message: "Помилка отримання твору"
    });
  }
}

module.exports = { getWorks, getWork };
