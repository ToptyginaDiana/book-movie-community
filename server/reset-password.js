
require("dotenv").config();

const readline = require("readline/promises");
const { stdin, stdout } = require("process");
const bcrypt = require("bcryptjs");
const prisma = require("./src/lib/prisma");

async function main() {
  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  try {
    const email = (await rl.question("Введите email аккаунта: "))
      .trim()
      .toLowerCase();

    const password = await rl.question("Введите новый пароль: ");

    if (password.length < 8) {
      console.log("Пароль должен содержать минимум 8 символов.");
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("Пользователь с таким email не найден.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log("Пароль успешно изменён!");
  } catch (error) {
    console.error("Ошибка:", error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
