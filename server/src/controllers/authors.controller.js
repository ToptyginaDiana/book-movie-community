
const prisma = require("../lib/prisma");

// Получение всех авторов
const getAuthors = async (req, res) => {
  try {
    const authors = await prisma.author.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return res.json(authors);
  } catch (error) {
    console.error("Get authors error:", error);

    return res.status(500).json({
      message: "Не удалось получить список авторов",
    });
  }
};

// Создание автора
const createAuthor = async (req, res) => {
  try {
    const { name, biography, birthYear } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Укажите имя автора",
      });
    }

    const author = await prisma.author.create({
      data: {
        name: name.trim(),
        biography: biography || null,
        birthYear: birthYear ? Number(birthYear) : null,
      },
    });

    return res.status(201).json(author);
  } catch (error) {
    console.error("Create author error:", error);

    return res.status(500).json({
      message: "Не удалось создать автора",
    });
  }
};

// Обновление автора
const updateAuthor = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, biography, birthYear } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Некорректный ID автора",
      });
    }

    const author = await prisma.author.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(biography !== undefined && { biography }),
        ...(birthYear !== undefined && {
          birthYear: birthYear === null || birthYear === ""
            ? null
            : Number(birthYear),
        }),
      },
    });

    return res.json(author);
  } catch (error) {
    console.error("Update author error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Автора не знайдено",
      });
    }

    return res.status(500).json({
      message: "Не удалось обновить автора",
    });
  }
};

module.exports = {
  getAuthors,
  createAuthor,
  updateAuthor,
};
