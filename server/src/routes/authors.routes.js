const express = require("express");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const controller = require("../controllers/authors.controller");

const router = express.Router();

router.get("/", controller.getAuthors);

router.post(
  "/",
  auth,
  allowRoles("EDITOR", "ADMIN"),
  controller.createAuthor
);

router.put(
  "/:id",
  auth,
  allowRoles("EDITOR", "ADMIN"),
  controller.updateAuthor
);

module.exports = router;