
const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Создание токена
const createToken = (user, role) => {
  return jwt.sign(
    {
      id: user.id,
      role: role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Регистрация обычного пользователя
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Заповніть усі поля",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Користувач з таким email вже існує",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "READER",
      },
    });

    const token = createToken(user, "READER");

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: "READER",
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Помилка сервера під час реєстрації",
    });
  }
};


const login = async (req, res) => {
  try {
    const { email, password, editorCode, adminCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Введіть email та пароль",
      });
    }

    if (editorCode && adminCode) {
      return res.status(400).json({
        message: "Виберіть лише один додатковий код",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        message: "Користувача з таким email не знайдено",
      });
    }

    const passwordIsValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        message: "Неправильний email або пароль",
      });
    }

    let role = "READER";

    if (adminCode && adminCode.trim() !== "") {
      if (
        !process.env.ADMIN_SECRET ||
        adminCode !== process.env.ADMIN_SECRET
      ) {
        return res.status(403).json({
          message: "Неправильний пароль адміністратора",
        });
      }

      role = "ADMIN";
    } else if (editorCode && editorCode.trim() !== "") {
      if (
        !process.env.EDITOR_SECRET ||
        editorCode !== process.env.EDITOR_SECRET
      ) {
        return res.status(403).json({
          message: "Неправильний код редактора",
        });
      }

      role = "EDITOR";
    }

    const token = createToken(user, role);

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Помилка сервера під час входу",
    });
  }
};


// Отримання інформації про поточного користувача
const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Користувача не знайдено",
      });
    }

    return res.json({
      user: {
        ...user,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error("Me error:", error);

    return res.status(500).json({
      message: "Не вдалося отримати інформацію про користувача",
    });
  }
};

module.exports = {
  register,
  login,
  me,
};
