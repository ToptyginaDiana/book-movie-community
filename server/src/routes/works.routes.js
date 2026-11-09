
const express = require("express");
const controller = require("../controllers/works.controller");
const editor = require("../controllers/catalog-editor.controller");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");

const router = express.Router();

router.get("/", controller.getWorks);
router.get("/:id", controller.getWork);

// Создание произведения
router.post(
  "/",
  auth,
  allowRoles("EDITOR", "ADMIN"),
  async (req, res) => {
    const prisma = require("../lib/prisma");

    try {
      const work = await prisma.work.create({
        data: {
          title: req.body.title,
          description: req.body.description || "",
          type: req.body.type,
          releaseYear: Number(req.body.releaseYear),
          poster: req.body.poster || null,
        },
      });

      res.status(201).json(work);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка создания произведения" });
    }
  }
);

router.put("/:id", auth, allowRoles("EDITOR", "ADMIN"), editor.updateWork);

router.patch(
  "/:id/authors",
  auth,
  allowRoles("EDITOR", "ADMIN"),
  editor.setWorkAuthors
);

router.post(
  "/:sourceId/merge",
  auth,
  allowRoles("EDITOR", "ADMIN"),
  editor.mergeWorks
);

router.delete(
  "/:id",
  auth,
  allowRoles("EDITOR", "ADMIN"),
  editor.deleteWork
);

module.exports = router;
