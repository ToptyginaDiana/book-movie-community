
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authorsRoutes = require("./routes/authors.routes");
const authRoutes = require("./routes/auth.routes");
const worksRoutes = require("./routes/works.routes");
const ratingsRoutes = require("./routes/ratings.routes");
const reviewsRoutes = require("./routes/reviews.routes");
const communityRoutes = require("./routes/community.routes");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "BookMovie API працює",
  });
});

app.use("/api/authors", authorsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/works", worksRoutes);
app.use("/api/ratings", ratingsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/community", communityRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Маршрут не знайдено",
  });
});

app.listen(process.env.PORT || 5000, () => {
  console.log(
    `Сервер запущено: http://localhost:${process.env.PORT || 5000}`
  );
});
