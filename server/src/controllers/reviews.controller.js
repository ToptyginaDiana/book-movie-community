
const prisma = require("../lib/prisma");

async function createReview(req, res) {
  try {
    const workId = Number(req.params.id);
    const { text, hasSpoilers = false } = req.body;

    if (!Number.isInteger(workId) || workId <= 0) {
      return res.status(400).json({
        message: "Некорректный ID произведения"
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Комментарий не может быть пустым"
      });
    }

    const work = await prisma.work.findUnique({
      where: { id: workId }
    });

    if (!work) {
      return res.status(404).json({
        message: "Произведение не найдено"
      });
    }

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        workId,
        text: text.trim(),
        hasSpoilers: Boolean(hasSpoilers)
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        workId,
        type: "REVIEW",
        description: "Оставил комментарий"
      }
    });

    return res.status(201).json(review);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Ошибка создания комментария"
    });
  }
}

async function hideReview(req, res) {
  try {
    const reviewId = Number(req.params.reviewId);

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({
        message: "Некорректный ID комментария"
      });
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { isHidden: true }
    });

    return res.json({
      message: "Комментарий скрыт",
      review
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Комментарий не найден"
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Ошибка скрытия комментария"
    });
  }
}

async function deleteReview(req, res) {
  try {
    const reviewId = Number(req.params.reviewId);

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({
        message: "Некорректный ID комментария"
      });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({
        message: "Комментарий не найден"
      });
    }

    const isOwner = review.userId === req.user.id;
    const isModerator = ["EDITOR", "ADMIN"].includes(req.user.role);

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        message: "Вы можете удалять только свои комментарии"
      });
    }

    await prisma.review.delete({
      where: { id: reviewId }
    });

    return res.json({
      message: "Комментарий удалён"
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Ошибка удаления комментария"
    });
  }
}

module.exports = {
  createReview,
  hideReview,
  deleteReview
};
