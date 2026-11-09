import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useParams
} from "react-router-dom";
import {
  BookOpen,
  Film,
  Search,
  Star,
  User,
  LogOut,
  Heart,
  Bookmark,
  Plus,
  Eye,
  EyeOff,
  LayoutDashboard,
  Library,
  Users,
  Clapperboard,
  Pencil,
  UserPlus,
  Merge
} from "lucide-react";
import api from "./services/api";

// =========================
// HEADER
// =========================

function Header({ user, onLogout }) {
  return (
    <header className="header">
      <Link to="/" className="logo">
        <span className="logo-icon"><BookOpen size={23} /></span>
        Book<span>Movie</span>
      </Link>

      <nav className="navigation">
        <Link to="/">Головна</Link>
        <Link to="/catalog">Каталог</Link>
        <Link to="/collections">Колекції</Link>

        {user && <Link to="/profile">Мій профіль</Link>}

        {(user?.role === "EDITOR" || user?.role === "ADMIN") && (
          <Link to="/editor">Панель редактора</Link>
        )}

        {user?.role === "ADMIN" && (
          <Link to="/admin">Адмінпанель</Link>
        )}
      </nav>

      <div className="header-actions">
        {user ? (
          <>
            <Link to="/profile" className="user-button">
              <User size={17} />
              {user.displayName || user.username}
            </Link>

            <button
              className="icon-button"
              onClick={onLogout}
              title="Вийти"
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-link">Увійти</Link>
            <Link to="/register" className="primary-button small">
              Реєстрація
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

// =========================
// WORK CARD
// =========================

function WorkCard({ work }) {
  return (
    <Link to={`/work/${work.id}`} className="work-card">
      <div className="poster">
        {work.poster ? (
          <img src={work.poster} alt={work.title} />
        ) : (
          <div className="poster-placeholder">
            {work.type === "BOOK" ? (
              <BookOpen size={48} />
            ) : (
              <Film size={48} />
            )}

            <span>{work.type === "BOOK" ? "BOOK" : "MOVIE"}</span>
          </div>
        )}

        <span className="type-label">
          {work.type === "BOOK" ? "Книга" : "Фільм"}
        </span>
      </div>

      <div className="work-info">
        <h3>{work.title}</h3>
        <p>{work.releaseYear || "Рік невідомий"}</p>

        <div className="rating-line">
          <Star size={16} fill="currentColor" />
          <strong>{Number(work.averageRating).toFixed(1)}</strong>
          <span>({work.ratingCount || 0})</span>
        </div>
      </div>
    </Link>
  );
}

// =========================
// HOME
// =========================

function Home() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/works?sort=popularity")
      .then(response => setWorks(response.data.items))
      .catch(() => setWorks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-label">
            <span className="online-dot"></span>
            СПІЛЬНОТА ПОЦІНОВУВАЧІВ ІСТОРІЙ
          </div>

          <h1>
            Кожна історія
            <br />
            <span>залишає слід.</span>
          </h1>

          <p>
            Відкривай книги та фільми, ділися враженнями,
            оцінюй улюблені історії та знаходь однодумців.
          </p>

          <div className="hero-buttons">
            <Link to="/catalog" className="primary-button">
              Відкрити каталог <Search size={18} />
            </Link>

            <Link to="/register" className="secondary-button">
              Приєднатися
            </Link>
          </div>

          <div className="hero-stats">
            <div><strong>800+</strong><span>Історій</span></div>
            <div><strong>300+</strong><span>Читачів</span></div>
            <div><strong>4K+</strong><span>Оцінок</span></div>
          </div>
        </div>

        <div className="hero-art">
          <div className="art-circle circle-one"></div>
          <div className="art-circle circle-two"></div>

          <div className="art-card art-card-main">
            <BookOpen size={85} strokeWidth={1} />
            <span>YOUR NEXT STORY</span>
          </div>

          <div className="floating-icon floating-book"><BookOpen /></div>
          <div className="floating-icon floating-film"><Clapperboard /></div>
          <div className="floating-star"><Star fill="currentColor" /></div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ВИБІР СПІЛЬНОТИ</span>
            <h2>Популярні твори</h2>
          </div>

          <Link to="/catalog" className="text-link">
            Увесь каталог →
          </Link>
        </div>

        {loading ? (
          <p className="muted">Завантаження каталогу...</p>
        ) : works.length ? (
          <div className="works-grid">
            {works.slice(0, 4).map(work => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <BookOpen size={38} />
            <h3>Каталог поки порожній</h3>
            <p>Додай тестові дані або відкрий каталог пізніше.</p>
          </div>
        )}
      </section>

      <section className="join-banner">
        <div>
          <span className="eyebrow">ТВОЯ ІСТОРІЯ ПОЧИНАЄТЬСЯ ТУТ</span>
          <h2>Знайди свою наступну улюблену історію</h2>
          <p>Оцінюй, обговорюй і створюй власні колекції.</p>
        </div>

        <Link to="/register" className="primary-button">
          Створити акаунт <Plus size={18} />
        </Link>
      </section>
    </>
  );
}

// =========================
// CATALOG
// =========================

function Catalog() {
  const [works, setWorks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("newest");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadWorks() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (search) params.set("search", search);
      if (type) params.set("type", type);
      if (genre) params.set("genre", genre);
      if (year) params.set("year", year);

      params.set("sort", sort);

      const response = await api.get(`/works?${params.toString()}`);
      setWorks(response.data.items);
    } catch {
      setWorks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get("/community/genres")
      .then(response => setGenres(response.data))
      .catch(() => setGenres([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadWorks, 250);
    return () => clearTimeout(timer);
  }, [search, type, genre, year, sort]);

  return (
    <section className="section catalog-section">
      <span className="eyebrow">ЗНАЙДИ СВОЮ ІСТОРІЮ</span>
      <h1 className="page-title">Каталог</h1>

      <p className="page-description">
        Книги та фільми, які варто побачити або прочитати.
      </p>

      <div className="catalog-toolbar">
        <div className="search-box">
          <Search size={19} />
          <input
            placeholder="Назва книги або фільму..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="">Усі типи</option>
          <option value="BOOK">Книги</option>
          <option value="MOVIE">Фільми</option>
        </select>

        <select value={genre} onChange={e => setGenre(e.target.value)}>
          <option value="">Усі жанри</option>
          {genres.map(item => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>

        <input
          className="year-input"
          type="number"
          placeholder="Рік"
          value={year}
          onChange={e => setYear(e.target.value)}
        />

        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="newest">Нові</option>
          <option value="rating">За рейтингом</option>
          <option value="popularity">Популярні</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Завантаження...</p>
      ) : works.length ? (
        <div className="works-grid">
          {works.map(work => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={38} />
          <h3>Нічого не знайдено</h3>
          <p>Спробуй змінити параметри пошуку.</p>
        </div>
      )}
    </section>
  );
}

// =========================
// WORK DETAILS
// =========================

function WorkDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [work, setWork] = useState(null);
  const [score, setScore] = useState(10);
  const [reviewText, setReviewText] = useState("");
  const [spoilers, setSpoilers] = useState(false);
  const [message, setMessage] = useState("");
  const [revealed, setRevealed] = useState([]);

  async function loadWork() {
    try {
      const response = await api.get(`/works/${id}`);
      setWork(response.data);
    } catch {
      setWork(null);
    }
  }

  useEffect(() => {
    setWork(null);
    loadWork();
  }, [id]);

  async function deleteWork() {
    if (!confirm("Точно видалити цей твір?")) return;

    try {
      await api.delete(`/works/${id}`);
      alert("Твір видалено");
      navigate("/catalog");
    } catch (error) {
      alert(
        error.response?.data?.message || "Не вдалося видалити твір"
      );
    }
  }

  async function rateWork() {
    try {
      await api.post(`/ratings/${id}`, { score });
      setMessage("Оцінку збережено!");
      loadWork();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Не вдалося зберегти оцінку"
      );
    }
  }

  async function addReview(e) {
    e.preventDefault();

    try {
      await api.post(`/reviews/${id}`, {
        text: reviewText,
        hasSpoilers: spoilers
      });

      setReviewText("");
      setSpoilers(false);
      setMessage("Відгук додано!");
      loadWork();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Помилка створення відгуку"
      );
    }
  }

  async function deleteReview(reviewId) {
    if (!confirm("Точно видалити цей відгук?")) return;

    try {
      await api.delete(`/reviews/${reviewId}`);
      setMessage("Відгук видалено");
      loadWork();
    } catch (error) {
      alert(
        error.response?.data?.message || "Не вдалося видалити відгук"
      );
    }
  }

  async function changeStatus(status) {
    try {
      await api.put(`/community/statuses/${id}`, { status });
      setMessage("Статус збережено!");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Не вдалося зберегти статус"
      );
    }
  }

  if (!work) {
    return (
      <div className="section">
        <h2>Завантаження твору...</h2>
      </div>
    );
  }

  return (
    <section className="section details-section">
      <Link to="/catalog" className="back-link">
        ← Назад до каталогу
      </Link>

      <div className="details-layout">
        <div className="details-poster">
          {work.poster ? (
            <img src={work.poster} alt={work.title} />
          ) : (
            <div className="poster-placeholder large">
              {work.type === "BOOK" ? (
                <BookOpen size={70} />
              ) : (
                <Film size={70} />
              )}
              <span>{work.type === "BOOK" ? "BOOK" : "MOVIE"}</span>
            </div>
          )}
        </div>

        <div className="details-content">
          <span className="eyebrow">
            {work.type === "BOOK" ? "КНИГА" : "ФІЛЬМ"}
          </span>

          <h1>{work.title}</h1>

          {(user?.role === "EDITOR" || user?.role === "ADMIN") && (
            <button
              className="secondary-button"
              onClick={deleteWork}
              type="button"
            >
              Видалити твір
            </button>
          )}

          <p className="muted">{work.releaseYear || "Рік невідомий"}</p>

          <div className="big-rating">
            <Star fill="currentColor" />
            <strong>{Number(work.averageRating).toFixed(1)}</strong>
            <span>({work.ratingCount} оцінок)</span>
          </div>

          <p className="details-description">
            {work.description || "Опис поки відсутній."}
          </p>

          <div className="tag-list">
            {work.genres?.map(item => (
              <span key={item.genre.id}>{item.genre.name}</span>
            ))}
          </div>

          {work.authors?.length > 0 && (
            <p className="muted">
              Автори: {work.authors.map(item => item.author.name).join(", ")}
            </p>
          )}

          {user && (
            <div className="action-panel">
              <h3>Твоя оцінка</h3>

              <div className="rating-picker">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    className={score === number ? "score active" : "score"}
                    onClick={() => setScore(number)}
                  >
                    {number}
                  </button>
                ))}
              </div>

              <button className="primary-button" onClick={rateWork}>
                <Star size={17} /> Зберегти оцінку
              </button>

              <div className="status-buttons">
                <button onClick={() => changeStatus("READ")}>
                  Прочитано / Переглянуто
                </button>
                <button onClick={() => changeStatus("READING")}>
                  Читаю / Дивлюся
                </button>
                <button onClick={() => changeStatus("WANT_TO_READ")}>
                  У планах
                </button>
              </div>
            </div>
          )}

          {message && <p className="form-message">{message}</p>}
        </div>
      </div>

      <div className="reviews-section">
        <h2>Відгуки спільноти</h2>

        {user && (
          <form className="review-form" onSubmit={addReview}>
            <textarea
              placeholder="Поділися своїми враженнями..."
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              required
            />

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={spoilers}
                onChange={e => setSpoilers(e.target.checked)}
              />
              Відгук містить спойлери
            </label>

            <button className="primary-button">
              Опублікувати відгук
            </button>
          </form>
        )}

        {!user && (
          <p className="muted">Увійди, щоб залишити відгук.</p>
        )}

        <div className="reviews-list">
          {work.reviews?.map(review => (
            <article className="review-card" key={review.id}>
              <div className="review-author">
                <div className="avatar">
                  {(review.user?.displayName || review.user?.username)?.[0]?.toUpperCase() || "?"}
                </div>

                <strong>
                  {review.user?.displayName || review.user?.username}
                </strong>

                {user && (
                  (user.id === review.user.id ||
                    user.role === "EDITOR" ||
                    user.role === "ADMIN") && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => deleteReview(review.id)}
                    >
                      Видалити відгук
                    </button>
                  )
                )}

                <span>
                  {new Date(review.createdAt).toLocaleDateString("uk-UA")}
                </span>
              </div>

              {review.hasSpoilers && !revealed.includes(review.id) ? (
                <div className="spoiler-box">
                  <EyeOff size={20} />
                  <span>Цей відгук містить спойлери</span>

                  <button
                    onClick={() => setRevealed(old => [...old, review.id])}
                  >
                    <Eye size={16} /> Показати
                  </button>
                </div>
              ) : (
                <p>{review.text}</p>
              )}
            </article>
          ))}

          {!work.reviews?.length && (
            <p className="muted">Відгуків поки немає.</p>
          )}
        </div>
      </div>
    </section>
  );
}

// =========================
// AUTHENTICATION
// =========================

function AuthPage({ mode, onLogin }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editorCode, setEditorCode] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      const url = mode === "login"
        ? "/auth/login"
        : "/auth/register";

      const body = mode === "login"
        ? { email, password, editorCode, adminCode }
        : { username, email, password };

      const response = await api.post(url, body);

      localStorage.setItem("bookmovie_token", response.data.token);
      onLogin(response.data.user);
      navigate("/");
    } catch (error) {
      setError(
        error.response?.data?.message || "Не вдалося виконати запит"
      );
    }
  }

  return (
    <section className="auth-section">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-icon"><BookOpen size={30} /></div>

        <span className="eyebrow">BOOKMOVIE COMMUNITY</span>

        <h1>
          {mode === "login" ? "З поверненням!" : "Створи акаунт"}
        </h1>

        <p className="muted">
          {mode === "login"
            ? "Увійди у свою спільноту історій."
            : "Приєднуйся до спільноти читачів і кіноманів."}
        </p>

        {mode === "register" && (
          <label>
            Ім'я користувача
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Твоє ім'я"
              required
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />
        </label>

        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Мінімум 6 символів"
            minLength="6"
            required
          />
        </label>

        {mode === "login" && (
          <>
            <label>
              Код редактора (необов'язково)
              <input
                type="password"
                value={editorCode}
                onChange={e => setEditorCode(e.target.value)}
                placeholder="Введи код редактора"
              />
            </label>

            <label>
              Пароль адміністратора (необов'язково)
              <input
                type="password"
                value={adminCode}
                onChange={e => setAdminCode(e.target.value)}
                placeholder="Введи пароль адміністратора"
              />
            </label>
          </>
        )}

        {error && <p className="error-message">{error}</p>}

        <button className="primary-button full-width">
          {mode === "login" ? "Увійти" : "Зареєструватися"}
        </button>

        <p className="auth-switch">
          {mode === "login"
            ? "Ще немає акаунта?"
            : "Вже маєш акаунт?"}
          {" "}

          <Link to={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Реєстрація" : "Увійти"}
          </Link>
        </p>
      </form>
    </section>
  );
}

// =========================
// PROFILE
// =========================

function Profile({ user }) {
  const [statuses, setStatuses] = useState([]);
  const [collections, setCollections] = useState([]);
  const [feed, setFeed] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function loadData() {
    try {
      const [
        statusResponse,
        collectionResponse,
        feedResponse
      ] = await Promise.all([
        api.get("/community/statuses"),
        api.get("/community/collections"),
        api.get("/community/feed")
      ]);

      setStatuses(statusResponse.data);
      setCollections(collectionResponse.data);
      setFeed(feedResponse.data);
    } catch {
      setStatuses([]);
      setCollections([]);
      setFeed([]);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createCollection(e) {
    e.preventDefault();

    try {
      await api.post("/community/collections", {
        title,
        description,
        isPublic: true
      });

      setTitle("");
      setDescription("");
      loadData();
    } catch (error) {
      alert(
        error.response?.data?.message || "Помилка створення колекції"
      );
    }
  }

  const statusNames = {
    READ: "Прочитано / Переглянуто",
    READING: "Читаю / Дивлюся",
    WANT_TO_READ: "У планах"
  };

  return (
    <section className="section profile-section">
      <div className="profile-heading">
        <div className="avatar big">
          {user?.username?.[0]?.toUpperCase() || "?"}
        </div>

        <div>
          <span className="eyebrow">ОСОБИСТИЙ ПРОФІЛЬ</span>
          <h1>{user?.displayName || user?.username || "Користувач"}</h1>
          <p className="muted">{user?.email || ""} · {user?.role || ""}</p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-main">
          <div className="content-panel">
            <h2><Bookmark size={20} /> Мої списки</h2>

            {statuses.length ? statuses.map(item => (
              <div className="status-item" key={item.id}>
                <div>
                  <strong>{item.work.title}</strong>
                  <span>{statusNames[item.status]}</span>
                </div>

                <Link to={`/work/${item.work.id}`}>
                  Відкрити →
                </Link>
              </div>
            )) : (
              <p className="muted">Тут поки немає творів.</p>
            )}
          </div>

          <div className="content-panel">
            <h2><Library size={20} /> Мої колекції</h2>

            <form className="inline-form" onSubmit={createCollection}>
              <input
                placeholder="Назва колекції"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />

              <input
                placeholder="Опис"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />

              <button className="primary-button">
                <Plus size={16} /> Створити
              </button>
            </form>

            {collections
              .filter(item => item.userId === user.id)
              .map(item => (
                <div className="status-item" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.works.length} творів</span>
                  </div>

                  <span>
                    {item.isPublic ? "Публічна" : "Приватна"}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <aside className="content-panel">
          <h2>Стрічка активності</h2>

          {feed.length ? feed.slice(0, 15).map(item => (
            <div className="feed-item" key={item.id}>
              <strong>{item.user?.displayName || item.user?.username}</strong>
              <p>{item.description}</p>
              <span>
                {new Date(item.createdAt).toLocaleDateString("uk-UA")}
              </span>
            </div>
          )) : (
            <p className="muted">
              Підпишись на інших читачів, щоб бачити їхню активність.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

// =========================
// COLLECTIONS
// =========================

function Collections() {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    api.get("/community/collections")
      .then(response => setCollections(response.data))
      .catch(() => setCollections([]));
  }, []);

  return (
    <section className="section">
      <span className="eyebrow">ІДЕЇ ВІД СПІЛЬНОТИ</span>
      <h1 className="page-title">Колекції</h1>

      <p className="page-description">
        Добірки книг і фільмів від інших користувачів.
      </p>

      <div className="collections-grid">
        {collections.map(collection => (
          <article className="collection-card" key={collection.id}>
            <div className="collection-icon">
              <Library size={28} />
            </div>

            <h3>{collection.title}</h3>
            <p>{collection.description}</p>

            <span>
              Автор: {collection.user?.displayName || collection.user?.username}
            </span>

            <div className="collection-works">
              {collection.works.slice(0, 5).map(item => (
                <Link
                  key={item.work.id}
                  to={`/work/${item.work.id}`}
                >
                  {item.position}. {item.work.title}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>

      {!collections.length && (
        <div className="empty-state">
          <Library size={38} />
          <h3>Колекцій поки немає</h3>
          <p>Увійди та створи власну добірку.</p>
        </div>
      )}
    </section>
  );
}

// =========================
// ADMIN PANEL
// =========================

function Admin({ user }) {
  const [report, setReport] = useState(null);
  const [genres, setGenres] = useState([]);
  const [users, setUsers] = useState([]);

  const [genreName, setGenreName] = useState("");
  const [search, setSearch] = useState("");
  const [pendingRoles, setPendingRoles] = useState({});

  const [usersExpanded, setUsersExpanded] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingError, setLoadingError] = useState("");

  const roleNames = {
    READER: "Читач",
    EDITOR: "Редактор",
    ADMIN: "Адміністратор"
  };

  async function loadData() {
    try {
      setLoadingUsers(true);
      setLoadingError("");

      const [reportResponse, genreResponse, usersResponse] =
        await Promise.all([
          api.get("/community/admin/report"),
          api.get("/community/genres"),
          api.get("/community/users")
        ]);

      setReport(reportResponse.data);
      setGenres(genreResponse.data);
      setUsers(usersResponse.data);

      const roles = {};

      usersResponse.data.forEach(item => {
        roles[item.id] = item.role;
      });

      setPendingRoles(roles);
    } catch (error) {
      setLoadingError(
        error.response?.data?.message ||
        "Не вдалося завантажити дані адмінпанелі"
      );
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadData();
    }
  }, []);

  async function addGenre(e) {
    e.preventDefault();

    try {
      await api.post("/community/genres", {
        name: genreName
      });

      setGenreName("");
      await loadData();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Помилка додавання жанру"
      );
    }
  }

  async function deleteGenre(id) {
    if (!confirm("Видалити цей жанр?")) return;

    try {
      await api.delete(`/community/genres/${id}`);
      await loadData();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Не вдалося видалити жанр"
      );
    }
  }

  function changePendingRole(id, newRole) {
    setPendingRoles(old => ({
      ...old,
      [id]: newRole
    }));
  }

  async function changeRole(targetUser) {
    const newRole = pendingRoles[targetUser.id];

    if (!newRole || newRole === targetUser.role) {
      return;
    }

    const confirmed = confirm(
      `Змінити роль користувача ${
        targetUser.displayName || targetUser.username
      } з «${roleNames[targetUser.role]}» на «${roleNames[newRole]}»?`
    );

    if (!confirmed) {
      setPendingRoles(old => ({
        ...old,
        [targetUser.id]: targetUser.role
      }));

      return;
    }

    try {
      const response = await api.patch(
        `/community/users/${targetUser.id}/role`,
        { role: newRole }
      );

      setUsers(old =>
        old.map(item =>
          item.id === targetUser.id ? response.data : item
        )
      );

      setPendingRoles(old => ({
        ...old,
        [targetUser.id]: response.data.role
      }));

      alert("Роль користувача успішно змінено!");
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Не вдалося змінити роль користувача"
      );

      setPendingRoles(old => ({
        ...old,
        [targetUser.id]: targetUser.role
      }));
    }
  }

  const filteredUsers = users.filter(item => {
    const value = search.trim().toLowerCase();

    if (!value) return true;

    return (
      String(item.id).includes(value) ||
      (item.displayName || "").toLowerCase().includes(value) ||
      (item.username || "").toLowerCase().includes(value) ||
      (item.email || "").toLowerCase().includes(value)
    );
  });

  if (user.role !== "ADMIN") {
    return (
      <section className="section">
        <h1>Доступ заборонено</h1>
      </section>
    );
  }

  return (
    <section className="section">
      <span className="eyebrow">
        КЕРУВАННЯ СПІЛЬНОТОЮ
      </span>

      <h1 className="page-title">
        Адмінпанель
      </h1>

      {report && (
        <div className="stats-grid">
          {[
            ["Користувачі", report.users, Users],
            ["Усі твори", report.works, BookOpen],
            ["Книги", report.books, BookOpen],
            ["Фільми", report.movies, Film],
            ["Оцінки", report.ratings, Star],
            ["Відгуки", report.reviews, Heart],
            ["Колекції", report.collections, Library]
          ].map(([label, value, Icon]) => (
            <div className="stat-card" key={label}>
              <Icon size={22} />
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      {loadingError && (
        <p className="error-message">
          {loadingError}
        </p>
      )}

      <div className="admin-grid">

        {/* Управління жанрами */}
        <div className="content-panel">
          <h2>Управління жанрами</h2>

          <form
            className="inline-form"
            onSubmit={addGenre}
          >
            <input
              placeholder="Назва нового жанру"
              value={genreName}
              onChange={e => setGenreName(e.target.value)}
              required
            />

            <button className="primary-button">
              <Plus size={16} />
              Додати
            </button>
          </form>

          <div className="genre-list">
            {genres.map(genre => (
              <div key={genre.id}>
                <span>{genre.name}</span>

                <button
                  type="button"
                  onClick={() => deleteGenre(genre.id)}
                >
                  Видалити
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Управління користувачами */}
        <div className="content-panel">

          <button
            type="button"
            className="admin-users-header"
            onClick={() => setUsersExpanded(old => !old)}
            aria-expanded={usersExpanded}
          >
            <div className="admin-users-heading">
              <h2>Управління користувачами</h2>

              <p className="muted">
                Зареєстровано користувачів: {users.length}
              </p>
            </div>

            <div className="admin-users-toggle">
              <span>
                {usersExpanded ? "Згорнути" : "Показати"}
              </span>

              <span className={usersExpanded ? "admin-arrow open" : "admin-arrow"}>
                <Plus size={20} />
              </span>
            </div>
          </button>

          {usersExpanded && (
            <div className="admin-users-content">

              <div className="search-box">
                <Search size={19} />

                <input
                  placeholder="Пошук за ID, ім'ям або email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {loadingUsers ? (
                <p className="muted">
                  Завантаження користувачів...
                </p>
              ) : (
                <>
                  <p className="muted">
                    Знайдено користувачів: {filteredUsers.length}
                  </p>

                  <div className="admin-users-list">
                    {filteredUsers.map(item => (
                      <div
                        key={item.id}
                        className="admin-user-item"
                      >
                        <div className="admin-user-info">
                          <strong>
                            {item.displayName || item.username}
                          </strong>

                          <span>ID: {item.id}</span>
                          <span>@{item.username}</span>
                          <span>{item.email}</span>

                          <span className="admin-current-role">
                            Поточна роль: {roleNames[item.role]}
                          </span>
                        </div>

                        <div className="admin-user-actions">
                          <select
                            value={pendingRoles[item.id] || item.role}
                            onChange={e =>
                              changePendingRole(item.id, e.target.value)
                            }
                          >
                            <option value="READER">Читач</option>
                            <option value="EDITOR">Редактор</option>
                            <option value="ADMIN">Адміністратор</option>
                          </select>

                          <button
                            type="button"
                            className="primary-button"
                            disabled={
                              pendingRoles[item.id] === item.role
                            }
                            onClick={() => changeRole(item)}
                          >
                            Зберегти роль
                          </button>
                        </div>
                      </div>
                    ))}

                    {filteredUsers.length === 0 && (
                      <p className="muted">
                        Користувачів за таким запитом не знайдено.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// =========================
// EDITOR PANEL
// =========================

function Editor({ user }) {
  const [workId, setWorkId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("BOOK");
  const [releaseYear, setReleaseYear] = useState("");
  const [poster, setPoster] = useState("");
  const [genreIds, setGenreIds] = useState("");
  const [authorIds, setAuthorIds] = useState("");

  const [authorName, setAuthorName] = useState("");
  const [authorBiography, setAuthorBiography] = useState("");

  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function parseIds(value) {
    return value
      .split(",")
      .map(item => Number(item.trim()))
      .filter(id => Number.isInteger(id) && id > 0);
  }

  async function loadWork(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await api.get(`/works/${workId}`);
      const work = response.data;

      setTitle(work.title || "");
      setDescription(work.description || "");
      setType(work.type || "BOOK");
      setReleaseYear(work.releaseYear || "");
      setPoster(work.poster || "");

      setGenreIds(
        (work.genres || [])
          .map(item => item.genre.id)
          .join(", ")
      );

      setAuthorIds(
        (work.authors || [])
          .map(item => item.author.id)
          .join(", ")
      );

      setMessage("Твір завантажено для редагування.");
    } catch (error) {
      setError(
        error.response?.data?.message || "Не вдалося завантажити твір."
      );
    }
  }

  async function saveWork(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    const data = {
      title,
      description,
      type,
      releaseYear: releaseYear ? Number(releaseYear) : null,
      poster: poster || null,
      genreIds: parseIds(genreIds)
    };

    try {
      if (workId) {
        await api.put(`/works/${workId}`, data);

        await api.patch(`/works/${workId}/authors`, {
          authorIds: parseIds(authorIds)
        });

        setMessage("Зміни твору збережено!");
      } else {
        const response = await api.post("/works", data);

        if (authorIds.trim()) {
          await api.patch(`/works/${response.data.id}/authors`, {
            authorIds: parseIds(authorIds)
          });
        }

        setWorkId(String(response.data.id));
        setMessage("Новий твір успішно додано!");
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Не вдалося зберегти твір."
      );
    }
  }

  async function addAuthor(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.post("/authors", {
        name: authorName,
        biography: authorBiography
      });

      setAuthorName("");
      setAuthorBiography("");
      setMessage("Автора додано!");
    } catch (error) {
      setError(
        error.response?.data?.message || "Не вдалося додати автора."
      );
    }
  }

  async function mergeWorks(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (Number(sourceId) === Number(targetId)) {
      setError("ID творів повинні відрізнятися.");
      return;
    }

    if (!confirm("Об'єднати твори? Дублікат буде видалено.")) {
      return;
    }

    try {
      await api.post(`/works/${sourceId}/merge`, {
        targetId: Number(targetId)
      });

      setSourceId("");
      setTargetId("");
      setMessage("Твори успішно об'єднано!");
    } catch (error) {
      setError(
        error.response?.data?.message || "Не вдалося об'єднати твори."
      );
    }
  }

  if (user.role !== "EDITOR" && user.role !== "ADMIN") {
    return (
      <section className="section">
        <h1>Доступ заборонено</h1>
      </section>
    );
  }

  return (
    <section className="section">
      <span className="eyebrow">КЕРУВАННЯ КАТАЛОГОМ</span>
      <h1 className="page-title">Панель редактора</h1>

      <p className="page-description">
        Додавай і редагуй твори, керуй авторами та об'єднуй дублікати.
      </p>

      {message && <p className="form-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="content-panel">
        <h2><Pencil size={20} /> Додавання та редагування твору</h2>

        <form onSubmit={loadWork} className="inline-form">
          <input
            type="number"
            min="1"
            placeholder="ID твору для редагування"
            value={workId}
            onChange={e => setWorkId(e.target.value)}
            required
          />

          <button className="secondary-button" type="submit">
            Завантажити твір
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setWorkId("");
              setTitle("");
              setDescription("");
              setType("BOOK");
              setReleaseYear("");
              setPoster("");
              setGenreIds("");
              setAuthorIds("");
              setMessage("");
              setError("");
            }}
          >
            Очистити форму
          </button>
        </form>

        <form onSubmit={saveWork} className="admin-form">
          <label>
            Назва
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </label>

          <label>
            Тип твору
            <select
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="BOOK">Книга</option>
              <option value="MOVIE">Фільм</option>
            </select>
          </label>

          <label>
            Рік випуску
            <input
              type="number"
              value={releaseYear}
              onChange={e => setReleaseYear(e.target.value)}
            />
          </label>

          <label>
            Посилання на обкладинку або постер
            <input
              value={poster}
              onChange={e => setPoster(e.target.value)}
              placeholder="https://..."
            />
          </label>

          <label>
            Опис
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows="4"
            />
          </label>

          <label>
            ID жанрів через кому
            <input
              value={genreIds}
              onChange={e => setGenreIds(e.target.value)}
              placeholder="Наприклад: 1, 3, 5"
            />
          </label>

          <label>
            ID авторів через кому
            <input
              value={authorIds}
              onChange={e => setAuthorIds(e.target.value)}
              placeholder="Наприклад: 2, 7"
            />
          </label>

          <button className="primary-button" type="submit">
            <Plus size={17} />
            {workId ? "Зберегти зміни" : "Додати твір"}
          </button>
        </form>
      </div>

      <div className="content-panel">
        <h2><UserPlus size={20} /> Додавання автора</h2>

        <form onSubmit={addAuthor} className="admin-form">
          <label>
            Ім'я автора
            <input
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              required
            />
          </label>

          <label>
            Біографія
            <textarea
              value={authorBiography}
              onChange={e => setAuthorBiography(e.target.value)}
              rows="3"
            />
          </label>

          <button className="primary-button">
            Додати автора
          </button>
        </form>
      </div>

      <div className="content-panel">
        <h2><Merge size={20} /> Об'єднання дублікатів</h2>

        <p className="muted">
          Вкажи ID дубліката та ID основного твору.
          Дублікат буде видалено.
        </p>

        <form onSubmit={mergeWorks} className="admin-form">
          <label>
            ID дубліката
            <input
              type="number"
              min="1"
              value={sourceId}
              onChange={e => setSourceId(e.target.value)}
              required
            />
          </label>

          <label>
            ID основного твору
            <input
              type="number"
              min="1"
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
              required
            />
          </label>

          <button className="primary-button" type="submit">
            Об'єднати твори
          </button>
        </form>
      </div>
    </section>
  );
}

// =========================
// FOOTER
// =========================

function Footer() {
  return (
    <footer className="footer">
      <Link to="/" className="logo">
        Book<span>Movie</span>
      </Link>

      <p>Спільнота тих, хто любить хороші історії.</p>

      <span>© 2026 BookMovie Community</span>
    </footer>
  );
}

// =========================
// MAIN APP
// =========================

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("bookmovie_token");

    if (!token) {
      setChecking(false);
      return;
    }

    api.get("/auth/me")
      .then(response => {
        const userData = response.data.user || response.data;
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem("bookmovie_token");
        setUser(null);
      })
      .finally(() => setChecking(false));
  }, []);

  function logout() {
    localStorage.removeItem("bookmovie_token");
    setUser(null);
    window.location.href = "/";
  }

  if (checking) {
    return <div className="loading-screen">BookMovie</div>;
  }

  return (
    <div className="app">
      <Header user={user} onLogout={logout} />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/catalog" element={<Catalog />} />

          <Route
            path="/work/:id"
            element={<WorkDetails user={user} />}
          />

          <Route
            path="/login"
            element={<AuthPage mode="login" onLogin={setUser} />}
          />

          <Route
            path="/register"
            element={<AuthPage mode="register" onLogin={setUser} />}
          />

          <Route
            path="/profile"
            element={
              user
                ? <Profile user={user} />
                : <AuthPage mode="login" onLogin={setUser} />
            }
          />

          <Route path="/collections" element={<Collections />} />

          <Route
            path="/editor"
            element={
              user
                ? <Editor user={user} />
                : <AuthPage mode="login" onLogin={setUser} />
            }
          />

          <Route
            path="/admin"
            element={
              user
                ? <Admin user={user} />
                : <AuthPage mode="login" onLogin={setUser} />
            }
          />

          <Route
            path="*"
            element={
              <div className="section">
                <h1>Сторінку не знайдено</h1>
                <Link to="/">На головну</Link>
              </div>
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}