const prisma = require("../lib/prisma");

// Статус книги або фільму
async function setStatus(req, res) {
  try {
    const workId = Number(req.params.workId);
    const { status } = req.body;

    const allowed = ["READ", "READING", "WANT_TO_READ"];

    if (!Number.isInteger(workId) || !allowed.includes(status)) {
      return res.status(400).json({ message: "Некоректний статус" });
    }

    const work = await prisma.work.findUnique({ where: { id: workId } });

    if (!work) {
      return res.status(404).json({ message: "Твір не знайдено" });
    }

    const result = await prisma.userWorkStatus.upsert({
      where: {
        userId_workId: {
          userId: req.user.id,
          workId
        }
      },
      create: {
        userId: req.user.id,
        workId,
        status
      },
      update: { status }
    });

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        workId,
        type: "STATUS",
        description: `Змінено статус: ${status}`
      }
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Не вдалося змінити статус" });
  }
}

// Особисті списки користувача
async function getMyStatuses(req, res) {
  try {
    const statuses = await prisma.userWorkStatus.findMany({
      where: { userId: req.user.id },
      include: { work: true },
      orderBy: { updatedAt: "desc" }
    });

    res.json(statuses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Помилка отримання списків" });
  }
}

// Створення колекції
async function createCollection(req, res) {
  try {
    const { title, description, isPublic = true } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Вкажіть назву колекції"
      });
    }

    if (typeof isPublic !== "boolean") {
      return res.status(400).json({
        message: "Некоректна видимість колекції"
      });
    }

    const collection = await prisma.collection.create({
      data: {
        userId: req.user.id,
        title: title.trim(),
        description: description || null,
        isPublic
      }
    });

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        type: "COLLECTION",
        description: `Створено колекцію "${collection.title}"`
      }
    });

    res.status(201).json(collection);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не вдалося створити колекцію"
    });
  }
}

// Перегляд усіх доступних колекцій
async function getCollections(req, res) {
  try {
    const collections = await prisma.collection.findMany({
      where: req.user
        ? {
            OR: [
              { isPublic: true },
              { userId: req.user.id }
            ]
          }
        : {
            isPublic: true
          },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        },
        works: {
          include: { work: true },
          orderBy: { position: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(collections);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Помилка отримання колекцій"
    });
  }
}

// Перегляд однієї колекції
async function getCollection(req, res) {
  try {
    const id = Number(req.params.collectionId);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Некоректний ID" });
    }

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        },
        works: {
          include: {
            work: {
              include: {
                genres: {
                  include: { genre: true }
                },
                authors: {
                  include: { author: true }
                }
              }
            }
          },
          orderBy: { position: "asc" }
        }
      }
    });

    if (!collection) {
      return res.status(404).json({
        message: "Колекцію не знайдено"
      });
    }

    if (!collection.isPublic && collection.userId !== req.user?.id) {
      return res.status(404).json({
        message: "Колекцію не знайдено"
      });
    }

    res.json(collection);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Помилка отримання колекції"
    });
  }
}

// Редагування колекції
async function updateCollection(req, res) {
  try {
    const id = Number(req.params.collectionId);
    const { title, description, isPublic } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Некоректний ID" });
    }

    const collection = await prisma.collection.findUnique({
      where: { id }
    });

    if (!collection) {
      return res.status(404).json({
        message: "Колекцію не знайдено"
      });
    }

    if (collection.userId !== req.user.id) {
      return res.status(403).json({
        message: "Це не ваша колекція"
      });
    }

    const data = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          message: "Вкажіть назву колекції"
        });
      }

      data.title = title.trim();
    }

    if (description !== undefined) {
      data.description = description;
    }

    if (isPublic !== undefined) {
      if (typeof isPublic !== "boolean") {
        return res.status(400).json({
          message: "Некоректна видимість колекції"
        });
      }

      data.isPublic = isPublic;
    }

    const updated = await prisma.collection.update({
      where: { id },
      data
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не вдалося оновити колекцію"
    });
  }
}

// Додавання твору до колекції
async function addWorkToCollection(req, res) {
  try {
    const collectionId = Number(req.params.collectionId);
    const workId = Number(req.body.workId);

    if (
      !Number.isInteger(collectionId) ||
      !Number.isInteger(workId)
    ) {
      return res.status(400).json({
        message: "Некоректний ID колекції або твору"
      });
    }

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId }
    });

    if (!collection) {
      return res.status(404).json({
        message: "Колекцію не знайдено"
      });
    }

    if (collection.userId !== req.user.id) {
      return res.status(403).json({
        message: "Це не ваша колекція"
      });
    }

    const work = await prisma.work.findUnique({
      where: { id: workId }
    });

    if (!work) {
      return res.status(404).json({
        message: "Твір не знайдено"
      });
    }

    const count = await prisma.collectionWork.count({
      where: { collectionId }
    });

    const item = await prisma.collectionWork.create({
      data: {
        collectionId,
        workId,
        position: count + 1
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Цей твір вже є в колекції"
      });
    }

    res.status(500).json({
      message: "Не вдалося додати твір"
    });
  }
}

// Видалення твору з колекції
async function removeWorkFromCollection(req, res) {
  try {
    const collectionId = Number(req.params.collectionId);
    const workId = Number(req.params.workId);

    if (
      !Number.isInteger(collectionId) ||
      !Number.isInteger(workId)
    ) {
      return res.status(400).json({
        message: "Некоректний ID"
      });
    }

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId }
    });

    if (!collection) {
      return res.status(404).json({
        message: "Колекцію не знайдено"
      });
    }

    if (collection.userId !== req.user.id) {
      return res.status(403).json({
        message: "Це не ваша колекція"
      });
    }

    const result = await prisma.collectionWork.deleteMany({
      where: {
        collectionId,
        workId
      }
    });

    if (result.count === 0) {
      return res.status(404).json({
        message: "Твір не знайдено в колекції"
      });
    }

    res.json({
      message: "Твір видалено з колекції"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не вдалося видалити твір"
    });
  }
}

// Видалення колекції
async function deleteCollection(req, res) {
  try {
    const id = Number(req.params.collectionId);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Некоректний ID" });
    }

    const collection = await prisma.collection.findUnique({
      where: { id }
    });

    if (!collection) {
      return res.status(404).json({
        message: "Колекцію не знайдено"
      });
    }

    if (collection.userId !== req.user.id) {
      return res.status(403).json({
        message: "Це не ваша колекція"
      });
    }

    await prisma.collection.delete({
      where: { id }
    });

    res.json({ message: "Колекцію видалено" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не вдалося видалити колекцію"
    });
  }
}

// Підписка на користувача
async function followUser(req, res) {
  try {
    const followedId = Number(req.params.userId);
    const followerId = req.user.id;

    if (followedId === followerId) {
      return res.status(400).json({
        message: "Не можна підписатися на себе"
      });
    }

    const target = await prisma.user.findUnique({
      where: { id: followedId }
    });

    if (!target) {
      return res.status(404).json({
        message: "Користувача не знайдено"
      });
    }

    const follow = await prisma.follow.create({
      data: { followerId, followedId }
    });

    await prisma.activity.create({
      data: {
        userId: followerId,
        type: "FOLLOW",
        description: `Підписка на ${target.username}`
      }
    });

    res.status(201).json(follow);
  } catch (error) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Ви вже підписані"
      });
    }

    res.status(500).json({
      message: "Помилка підписки"
    });
  }
}

// Відписка
async function unfollowUser(req, res) {
  try {
    const followedId = Number(req.params.userId);

    await prisma.follow.delete({
      where: {
        followerId_followedId: {
          followerId: req.user.id,
          followedId
        }
      }
    });

    res.json({ message: "Ви відписалися" });
  } catch (error) {
    console.error(error);
    res.status(404).json({
      message: "Підписку не знайдено"
    });
  }
}

// Стрічка активності підписок
async function getFeed(req, res) {
  try {
    const subscriptions = await prisma.follow.findMany({
      where: { followerId: req.user.id },
      select: { followedId: true }
    });

    const userIds = subscriptions.map(item => item.followedId);

    const activities = await prisma.activity.findMany({
      where: { userId: { in: userIds } },
      include: {
        user: {
          select: { id: true, username: true }
        },
        work: {
          select: { id: true, title: true, type: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    res.json(activities);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не вдалося отримати стрічку"
    });
  }
}

// Перегляд жанрів
async function getGenres(req, res) {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: "asc" }
    });

    res.json(genres);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Помилка отримання жанрів"
    });
  }
}

// Додавання жанру
async function createGenre(req, res) {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Вкажіть назву жанру"
      });
    }

    const genre = await prisma.genre.create({
      data: { name: name.trim() }
    });

    res.status(201).json(genre);
  } catch (error) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Такий жанр вже існує"
      });
    }

    res.status(500).json({
      message: "Помилка створення жанру"
    });
  }
}

// Видалення жанру
async function deleteGenre(req, res) {
  try {
    await prisma.genre.delete({
      where: { id: Number(req.params.genreId) }
    });

    res.json({ message: "Жанр видалено" });
  } catch (error) {
    console.error(error);
    res.status(404).json({
      message: "Жанр не знайдено"
    });
  }
}

// Отримання списку користувачів для адміністратора
async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true
      },
      orderBy: { id: "asc" }
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не вдалося отримати список користувачів"
    });
  }
}

// Управління ролями
async function updateUserRole(req, res) {
  try {
    const id = Number(req.params.userId);
    const { role } = req.body;

    const allowedRoles = ["READER", "EDITOR", "ADMIN"];

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        message: "Некоректний ID користувача"
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Некоректна роль"
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "Користувача не знайдено"
      });
    }

    if (existingUser.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" }
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Не можна змінити роль останнього адміністратора"
        });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не вдалося змінити роль користувача"
    });
  }
}

// Звіт адміністратора
async function getReport(req, res) {
  try {
    const [
      users,
      works,
      books,
      movies,
      ratings,
      reviews,
      collections
    ] = await Promise.all([
      prisma.user.count(),
      prisma.work.count(),
      prisma.work.count({ where: { type: "BOOK" } }),
      prisma.work.count({ where: { type: "MOVIE" } }),
      prisma.rating.count(),
      prisma.review.count(),
      prisma.collection.count()
    ]);

    res.json({
      users,
      works,
      books,
      movies,
      ratings,
      reviews,
      collections
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Помилка формування звіту"
    });
  }
}

module.exports = {
  setStatus,
  getMyStatuses,
  createCollection,
  getCollections,
  getCollection,
  updateCollection,
  addWorkToCollection,
  removeWorkFromCollection,
  deleteCollection,
  followUser,
  unfollowUser,
  getFeed,
  getGenres,
  createGenre,
  deleteGenre,
  getUsers,
  updateUserRole,
  getReport
};