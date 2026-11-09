
const prisma = require("../lib/prisma");

async function setRating(req, res) {
  try {
    const workId = Number(req.params.id);
    const score = Number(req.body.score);

    if (!Number.isInteger(workId) || workId <= 0) {
      return res.status(400).json({ message: "Некорректный ID произведения" });
    }

    if (!Number.isInteger(score) || score < 1 || score > 10) {
      return res.status(400).json({ message: "Оценка должна быть от 1 до 10" });
    }

    await prisma.$transaction(
      async (tx) => {
        const work = await tx.work.findUnique({
          where: { id: workId },
        });

        if (!work) {
          throw new Error("WORK_NOT_FOUND");
        }

        await tx.rating.upsert({
          where: {
            userId_workId: {
              userId: req.user.id,
              workId,
            },
          },
          update: { score },
          create: {
            userId: req.user.id,
            workId,
            score,
          },
        });

        const aggregate = await tx.rating.aggregate({
          where: { workId },
          _avg: { score: true },
          _count: { _all: true },
        });

        await tx.work.update({
          where: { id: workId },
          data: {
            averageRating: aggregate._avg.score ?? 0,
            ratingCount: aggregate._count._all,
          },
        });

        await tx.activity.create({
          data: {
            userId: req.user.id,
            workId,
            type: "RATING",
            description: `Поставил оценку ${score}`,
          },
        });
      },
      { isolationLevel: "Serializable" }
    );

    return res.json({ message: "Оценка сохранена" });
  } catch (error) {
    if (error.message === "WORK_NOT_FOUND") {
      return res.status(404).json({ message: "Произведение не найдено" });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        message: "Конфликт изменений. Попробуйте ещё раз",
      });
    }

    console.error(error);
    return res.status(500).json({ message: "Ошибка сохранения оценки" });
  }
}

async function deleteRating(req, res) {
  const ratingId = Number(req.params.ratingId);

  if (!Number.isInteger(ratingId) || ratingId <= 0) {
    return res.status(400).json({ message: "Некорректный ID оценки" });
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const rating = await tx.rating.findUnique({
          where: { id: ratingId },
        });

        if (!rating) {
          throw new Error("RATING_NOT_FOUND");
        }

        await tx.rating.delete({
          where: { id: ratingId },
        });

        const aggregate = await tx.rating.aggregate({
          where: { workId: rating.workId },
          _avg: { score: true },
          _count: { _all: true },
        });

        await tx.work.update({
          where: { id: rating.workId },
          data: {
            averageRating: aggregate._avg.score ?? 0,
            ratingCount: aggregate._count._all,
          },
        });
      },
      { isolationLevel: "Serializable" }
    );

    return res.json({ message: "Оценка удалена" });
  } catch (error) {
    if (error.message === "RATING_NOT_FOUND") {
      return res.status(404).json({ message: "Оценка не найдена" });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        message: "Конфликт изменений. Попробуйте ещё раз",
      });
    }

    console.error(error);
    return res.status(500).json({ message: "Ошибка удаления оценки" });
  }
}

module.exports = {
  setRating,
  deleteRating,
};
