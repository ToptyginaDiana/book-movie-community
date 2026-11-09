const express = require("express");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const controller = require("../controllers/community.controller");

const router = express.Router();

// Статуси
router.put("/statuses/:workId", auth, controller.setStatus);
router.get("/statuses", auth, controller.getMyStatuses);

// Колекції
router.post("/collections", auth, controller.createCollection);
router.get("/collections", controller.getCollections);
router.get("/collections/:collectionId", controller.getCollection);

router.patch(
  "/collections/:collectionId",
  auth,
  controller.updateCollection
);

router.post(
  "/collections/:collectionId/works",
  auth,
  controller.addWorkToCollection
);

router.delete(
  "/collections/:collectionId/works/:workId",
  auth,
  controller.removeWorkFromCollection
);

router.delete(
  "/collections/:collectionId",
  auth,
  controller.deleteCollection
);

// Підписки та стрічка
router.post("/follow/:userId", auth, controller.followUser);
router.delete("/follow/:userId", auth, controller.unfollowUser);
router.get("/feed", auth, controller.getFeed);

// Жанри
router.get("/genres", controller.getGenres);

router.post(
  "/genres",
  auth,
  allowRoles("ADMIN"),
  controller.createGenre
);

router.delete(
  "/genres/:genreId",
  auth,
  allowRoles("ADMIN"),
  controller.deleteGenre
);

// Адміністрування користувачів
router.get(
  "/users",
  auth,
  allowRoles("ADMIN"),
  controller.getUsers
);

router.patch(
  "/users/:userId/role",
  auth,
  allowRoles("ADMIN"),
  controller.updateUserRole
);

// Звіт адміністратора
router.get(
  "/admin/report",
  auth,
  allowRoles("ADMIN"),
  controller.getReport
);

module.exports = router;