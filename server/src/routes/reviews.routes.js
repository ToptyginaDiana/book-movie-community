
const express = require("express");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const controller = require("../controllers/reviews.controller");

const router = express.Router();

// Создание комментария — авторизованный пользователь
router.post("/:id", auth, controller.createReview);

// Скрытие комментария — редактор или администратор
router.patch(
  "/:reviewId/hide",
  auth,
  allowRoles("EDITOR", "ADMIN"),
  controller.hideReview
);

// Удаление — владелец комментария, редактор или администратор
router.delete("/:reviewId", auth, controller.deleteReview);

module.exports = router;
