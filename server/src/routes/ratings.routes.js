
const express = require("express");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const controller = require("../controllers/ratings.controller");

const router = express.Router();

// Читатель может выставлять и менять собственную оценку
router.post("/:id", auth, controller.setRating);

// Удалять оценки могут только редактор и администратор
router.delete(
  "/:ratingId",
  auth,
  allowRoles("EDITOR", "ADMIN"),
  controller.deleteRating
);

module.exports = router;
