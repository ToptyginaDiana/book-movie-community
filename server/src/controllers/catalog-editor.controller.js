const prisma = require("../lib/prisma");

// Редагування твору
async function updateWork(req, res) {
  try {
    const id = Number(req.params.id);
    const {
      title,
      description,
      type,
      releaseYear,
      poster,
      genreIds
    } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Некоректний ID твору" });
    }

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ message: "Назва не може бути порожньою" });
    }

    if (type !== undefined && !["BOOK", "MOVIE"].includes(type)) {
      return res.status(400).json({ message: "Некоректний тип твору" });
    }

    const data = {};

    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description;
    if (type !== undefined) data.type = type;
    if (releaseYear !== undefined) data.releaseYear = releaseYear;
    if (poster !== undefined) data.poster = poster;

    const work = await prisma.$transaction(async (tx) => {
      if (genreIds !== undefined) {
        if (!Array.isArray(genreIds)) {
          throw new Error("genreIds має бути масивом");
        }

        await tx.workGenre.deleteMany({ where: { workId: id } });

        if (genreIds.length > 0) {
          await tx.workGenre.createMany({
            data: [...new Set(genreIds.map(Number))].map(genreId => ({
              workId: id,
              genreId
            }))
          });
        }
      }

      return tx.work.update({
        where: { id },
        data,
        include: {
          genres: { include: { genre: true } },
          authors: { include: { author: true } }
        }
      });
    });

    res.json(work);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Твір не знайдено" });
    }

    res.status(400).json({ message: error.message || "Не вдалося змінити твір" });
  }
}

// Прив'язування авторів до твору
async function setWorkAuthors(req, res) {
  try {
    const workId = Number(req.params.id);
    const { authorIds } = req.body;

    if (!Number.isInteger(workId) || !Array.isArray(authorIds)) {
      return res.status(400).json({ message: "Передайте масив authorIds" });
    }

    const ids = [...new Set(authorIds.map(Number))];

    const result = await prisma.$transaction(async (tx) => {
      await tx.workAuthor.deleteMany({ where: { workId } });

      if (ids.length > 0) {
        await tx.workAuthor.createMany({
          data: ids.map(authorId => ({ workId, authorId }))
        });
      }

      return tx.work.findUnique({
        where: { id: workId },
        include: {
          authors: { include: { author: true } }
        }
      });
    });

    if (!result) {
      return res.status(404).json({ message: "Твір не знайдено" });
    }

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: "Не вдалося прив'язати авторів" });
  }
}

// Об'єднання двох творів
async function mergeWorks(req, res) {
  try {
    const sourceId = Number(req.params.sourceId);
    const targetId = Number(req.body.targetWorkId);

    if (
      !Number.isInteger(sourceId) ||
      !Number.isInteger(targetId) ||
      sourceId === targetId
    ) {
      return res.status(400).json({ message: "Некоректні ID творів" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const source = await tx.work.findUnique({
        where: { id: sourceId }
      });

      const target = await tx.work.findUnique({
        where: { id: targetId }
      });

      if (!source || !target) {
        throw new Error("Один із творів не знайдено");
      }

      if (source.type !== target.type) {
        throw new Error("Можна об'єднувати тільки твори одного типу");
      }

      // Переносимо жанри й авторів
      const genres = await tx.workGenre.findMany({
        where: { workId: sourceId }
      });

      const authors = await tx.workAuthor.findMany({
        where: { workId: sourceId }
      });

      if (genres.length) {
        await tx.workGenre.createMany({
          data: genres.map(item => ({
            workId: targetId,
            genreId: item.genreId
          })),
          skipDuplicates: true
        });
      }

      if (authors.length) {
        await tx.workAuthor.createMany({
          data: authors.map(item => ({
            workId: targetId,
            authorId: item.authorId
          })),
          skipDuplicates: true
        });
      }

      // Переносимо оцінки. Якщо користувач уже оцінив цільовий твір,
      // зберігаємо його оцінку для цільового твору.
      const ratings = await tx.rating.findMany({
        where: { workId: sourceId }
      });

      for (const rating of ratings) {
        const existing = await tx.rating.findUnique({
          where: {
            userId_workId: {
              userId: rating.userId,
              workId: targetId
            }
          }
        });

        if (existing) {
          await tx.rating.delete({ where: { id: rating.id } });
        } else {
          await tx.rating.update({
            where: { id: rating.id },
            data: { workId: targetId }
          });
        }
      }

      // Переносимо статуси читання
      const statuses = await tx.userWorkStatus.findMany({
        where: { workId: sourceId }
      });

      for (const status of statuses) {
        const existing = await tx.userWorkStatus.findUnique({
          where: {
            userId_workId: {
              userId: status.userId,
              workId: targetId
            }
          }
        });

        if (existing) {
          await tx.userWorkStatus.delete({ where: { id: status.id } });
        } else {
          await tx.userWorkStatus.update({
            where: { id: status.id },
            data: { workId: targetId }
          });
        }
      }

      // Переносимо зв'язки з колекціями
      const collectionItems = await tx.collectionWork.findMany({
        where: { workId: sourceId }
      });

      for (const item of collectionItems) {
        const existing = await tx.collectionWork.findUnique({
          where: {
            collectionId_workId: {
              collectionId: item.collectionId,
              workId: targetId
            }
          }
        });

        if (existing) {
          await tx.collectionWork.delete({
            where: {
              collectionId_workId: {
                collectionId: item.collectionId,
                workId: sourceId
              }
            }
          });
        } else {
          await tx.collectionWork.update({
            where: {
              collectionId_workId: {
                collectionId: item.collectionId,
                workId: sourceId
              }
            },
            data: { workId: targetId }
          });
        }
      }

      // Переносимо відгуки й активність
      await tx.review.updateMany({
        where: { workId: sourceId },
        data: { workId: targetId }
      });

      await tx.activity.updateMany({
        where: { workId: sourceId },
        data: { workId: targetId }
      });

      // Перераховуємо середній рейтинг і кількість оцінок
      const aggregate = await tx.rating.aggregate({
        where: { workId: targetId },
        _avg: { score: true },
        _count: { id: true }
      });

      await tx.work.update({
        where: { id: targetId },
        data: {
          averageRating: aggregate._avg.score || 0,
          ratingCount: aggregate._count.id,
          popularity: Math.max(source.popularity, target.popularity)
        }
      });

      // Видаляємо дублікат
      await tx.work.delete({
        where: { id: sourceId }
      });

      return tx.work.findUnique({
        where: { id: targetId }
      });
    });

    res.json({
      message: "Твори успішно об'єднано",
      work: result
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Не вдалося об'єднати твори"
    });
  }
}

async function deleteWork(req, res) {
  const workId = Number(req.params.id);

  if (!Number.isInteger(workId) || workId <= 0) {
    return res.status(400).json({ message: "Некорректный ID произведения" });
  }

  try {
    await prisma.work.delete({
      where: { id: workId },
    });

    return res.json({ message: "Произведение удалено" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Произведение не найдено" });
    }

    console.error(error);
    return res.status(500).json({ message: "Ошибка удаления произведения" });
  }
}

module.exports = {
  updateWork,
  setWorkAuthors,
  mergeWorks,
  deleteWork,
};