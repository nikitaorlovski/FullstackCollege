<template>
  <div class="collections-container">
    <Navbar />

    <div class="collections-content">
      <!-- Заголовок с иконкой -->
      <div class="collections-header">
        <div class="header-left">
          <div class="header-icon">🎭</div>
          <div>
            <h1>Коллекции фильмов</h1>
            <p class="header-subtitle">Тематические подборки и рекомендации</p>
          </div>
        </div>
      </div>

      <!-- Основной контент -->
      <div class="collections-section">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка коллекций...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Ошибка загрузки</h3>
          <p>{{ error }}</p>
          <button @click="loadCollections" class="retry-btn">Попробовать снова</button>
        </div>

        <div v-else class="collections-main">
          <!-- Топ по бронированиям -->
          <section v-if="enrichedTopFilms.length > 0" class="collection-section">
            <div class="section-header">
              <div class="section-icon">🔥</div>
              <div class="section-title">
                <h2>Самые популярные</h2>
                <p>Фильмы с наибольшим количеством бронирований</p>
              </div>
            </div>
            <div class="films-scroll-container">
              <div
                v-for="film in enrichedTopFilms"
                :key="film.id"
                class="film-card-scroll"
                @click="goToFilmSessions(film.id)"
              >
                <div class="film-poster-scroll">
                  <img
                    v-if="film.image_url"
                    :src="film.image_url"
                    :alt="film.title"
                    class="poster-img-scroll"
                  />
                  <div v-else class="poster-placeholder-scroll">🎬</div>
                  <div class="film-rank" v-if="film.total_bookings">
                    🔥 {{ film.total_bookings }}
                  </div>
                </div>
                <div class="film-info-scroll">
                  <h3 class="film-title-scroll">{{ film.title }}</h3>
                  <div class="film-meta-scroll">
                    <span class="film-rating-scroll">⭐ {{ film.rating }}</span>
                    <span class="film-genre-scroll">{{ film.genre }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Лучшие по рейтингу -->
          <section v-if="filteredTopRated.length > 0" class="collection-section">
            <div class="section-header">
              <div class="section-icon">⭐</div>
              <div class="section-title">
                <h2>Лучшие по рейтингу</h2>
                <p>Фильмы с высшими оценками зрителей</p>
              </div>
            </div>
            <div class="films-scroll-container">
              <div
                v-for="film in filteredTopRated"
                :key="film.id"
                class="film-card-scroll"
                @click="goToFilmSessions(film.id)"
              >
                <div class="film-poster-scroll">
                  <img
                    v-if="film.image_url"
                    :src="film.image_url"
                    :alt="film.title"
                    class="poster-img-scroll"
                  />
                  <div v-else class="poster-placeholder-scroll">🎬</div>
                  <div class="film-rank">⭐ {{ film.rating }}</div>
                </div>
                <div class="film-info-scroll">
                  <h3 class="film-title-scroll">{{ film.title }}</h3>
                  <div class="film-meta-scroll">
                    <span class="film-duration-scroll">{{ film.duration }} мин</span>
                    <span class="film-genre-scroll">{{ film.genre }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Ближайшие сеансы -->
          <section v-if="filteredUpcomingFilms.length > 0" class="collection-section">
            <div class="section-header">
              <div class="section-icon">⏰</div>
              <div class="section-title">
                <h2>Скоро на экранах</h2>
                <p>Фильмы с ближайшими сеансами</p>
              </div>
            </div>
            <div class="films-scroll-container">
              <div
                v-for="film in filteredUpcomingFilms"
                :key="film.id"
                class="film-card-scroll"
                @click="goToFilmSessions(film.id)"
              >
                <div class="film-poster-scroll">
                  <img
                    v-if="film.image_url"
                    :src="film.image_url"
                    :alt="film.title"
                    class="poster-img-scroll"
                  />
                  <div v-else class="poster-placeholder-scroll">🎬</div>
                  <div class="film-next-time">🕒 {{ formatTime(film.next_session) }}</div>
                </div>
                <div class="film-info-scroll">
                  <h3 class="film-title-scroll">{{ film.title }}</h3>
                  <div class="film-meta-scroll">
                    <span class="film-rating-scroll">⭐ {{ film.rating }}</span>
                    <span class="film-genre-scroll">{{ film.genre }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Популярные за неделю -->
          <section v-if="enrichedPopularWeek.length > 0" class="collection-section">
            <div class="section-header">
              <div class="section-icon">📈</div>
              <div class="section-title">
                <h2>Популярные за неделю</h2>
                <p>Тренды последних 7 дней</p>
              </div>
            </div>
            <div class="films-scroll-container">
              <div
                v-for="film in enrichedPopularWeek"
                :key="film.id"
                class="film-card-scroll"
                @click="goToFilmSessions(film.id)"
              >
                <div class="film-poster-scroll">
                  <img
                    v-if="film.image_url"
                    :src="film.image_url"
                    :alt="film.title"
                    class="poster-img-scroll"
                  />
                  <div v-else class="poster-placeholder-scroll">🎬</div>
                  <div class="film-trend">📈 {{ film.weekly_bookings }}</div>
                </div>
                <div class="film-info-scroll">
                  <h3 class="film-title-scroll">{{ film.title }}</h3>
                  <div class="film-meta-scroll">
                    <span class="film-rating-scroll">⭐ {{ film.rating }}</span>
                    <span class="film-genre-scroll">{{ film.genre }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Сообщение если нет данных -->
          <div v-if="!hasCollections" class="empty-collections">
            <div class="empty-icon">🎬</div>
            <h3>Коллекции пока пусты</h3>
            <p>Скоро здесь появятся интересные подборки фильмов</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Layout/Navbar.vue'

export default {
  name: 'CollectionsPage',
  components: {
    Navbar,
  },
  setup() {
    const API_BASE = import.meta.env.VITE_API_URL

    if (!API_BASE) {
      console.error('VITE_API_URL is not defined')
    }
    const router = useRouter()
    const topFilms = ref([])
    const topRated = ref([])
    const upcomingFilms = ref([])
    const popularWeek = ref([])
    const allFilms = ref([])
    const loading = ref(false)
    const error = ref('')

    const loadCollections = async () => {
      loading.value = true
      error.value = ''
      try {
        const token = localStorage.getItem('token')

        // Загружаем все фильмы
        const filmsResponse = await fetch(`${API_BASE}/films/`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (filmsResponse.ok) {
          allFilms.value = await filmsResponse.json()
        }

        // Загружаем коллекции
        const [topResponse, ratedResponse, upcomingResponse, weekResponse] = await Promise.all([
          fetch(`${API_BASE}/views/top-films`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/views/top-rated`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/views/films/upcoming`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/views/popular-last-week`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (topResponse.ok) topFilms.value = await topResponse.json()
        if (ratedResponse.ok) topRated.value = await ratedResponse.json()
        if (upcomingResponse.ok) upcomingFilms.value = await upcomingResponse.json()
        if (weekResponse.ok) popularWeek.value = await weekResponse.json()
      } catch (err) {
        error.value = 'Ошибка загрузки коллекций'
        console.error('Error loading collections:', err)
      } finally {
        loading.value = false
      }
    }

    // Обогащаем данные из топ фильмов полной информацией
    const enrichedTopFilms = computed(() => {
      return topFilms.value
        .filter((film) => film.total_bookings > 0)
        .slice(0, 10)
        .map((film) => {
          const fullFilm = allFilms.value.find((f) => f.id === film.id)
          return {
            ...film,
            genre: fullFilm?.genre || 'Неизвестно',
            rating: fullFilm?.rating || 0,
            duration: fullFilm?.duration || 0,
            image_url: fullFilm?.image_url,
          }
        })
    })

    const filteredTopRated = computed(() => {
      return topRated.value.filter((film) => film.rating >= 7.0).slice(0, 10)
    })

    const filteredUpcomingFilms = computed(() => {
      return upcomingFilms.value.filter((film) => film.next_session).slice(0, 10)
    })

    // Обогащаем данные популярных за неделю
    const enrichedPopularWeek = computed(() => {
      return popularWeek.value
        .filter((film) => film.weekly_bookings > 0)
        .slice(0, 10)
        .map((film) => {
          const fullFilm = allFilms.value.find((f) => f.id === film.id)
          return {
            ...film,
            genre: fullFilm?.genre || 'Неизвестно',
            rating: fullFilm?.rating || 0,
            image_url: fullFilm?.image_url,
          }
        })
    })

    const hasCollections = computed(() => {
      return (
        enrichedTopFilms.value.length > 0 ||
        filteredTopRated.value.length > 0 ||
        filteredUpcomingFilms.value.length > 0 ||
        enrichedPopularWeek.value.length > 0
      )
    })

    const formatTime = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const goToFilmSessions = (filmId) => {
      router.push(`/film/${filmId}`)
    }

    onMounted(() => {
      loadCollections()
    })

    return {
      enrichedTopFilms,
      filteredTopRated,
      filteredUpcomingFilms,
      enrichedPopularWeek,
      hasCollections,
      loading,
      error,
      loadCollections,
      formatTime,
      goToFilmSessions,
    }
  },
}
</script>

<style scoped>
/* Основные стили остаются такими же */
.collections-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%);
  color: white;
}

.collections-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.collections-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 3rem;
}

.collections-header h1 {
  font-size: 2.5rem;
  margin: 0;
  background: linear-gradient(135deg, #fff, #a8b1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-subtitle {
  color: rgba(255, 255, 255, 0.7);
  margin: 8px 0 0 0;
  font-size: 1.1rem;
}

.collection-section {
  margin-bottom: 50px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 25px;
}

.section-icon {
  font-size: 2.5rem;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.section-title h2 {
  font-size: 1.8rem;
  margin: 0 0 5px 0;
  color: white;
}

.section-title p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-size: 1rem;
}

/* Горизонтальные скролл-контейнеры */
.films-scroll-container {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 10px 5px 20px 5px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
}

.films-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.films-scroll-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.films-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.films-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Карточки для горизонтального скролла */
.film-card-scroll {
  min-width: 200px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
}

.film-card-scroll:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
}

.film-poster-scroll {
  position: relative;
  margin-bottom: 12px;
}

.poster-img-scroll {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 12px;
}

.poster-placeholder-scroll {
  width: 100%;
  height: 140px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.film-rank,
.film-trend,
.film-next-time {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

.film-rank {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
}

.film-trend {
  background: linear-gradient(135deg, #4834d4, #686de0);
}

.film-next-time {
  background: linear-gradient(135deg, #00d2d3, #54a0ff);
}

.film-info-scroll {
  text-align: center;
}

.film-title-scroll {
  font-size: 1rem;
  margin: 0 0 8px 0;
  color: white;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.film-meta-scroll {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.film-rating-scroll,
.film-duration-scroll,
.film-genre-scroll {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
}

.film-genre-scroll {
  background: rgba(168, 177, 255, 0.2);
  color: #a8b1ff;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
}

.empty-collections {
  text-align: center;
  padding: 80px 20px;
  color: rgba(255, 255, 255, 0.7);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.7;
}

.empty-collections h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.9);
}

.empty-collections p {
  font-size: 1rem;
  margin: 0;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.7);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #a8b1ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.7;
}

.retry-btn {
  margin-top: 20px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

@media (max-width: 768px) {
  .collections-content {
    padding: 20px 15px;
  }

  .collections-header {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .header-left {
    flex-direction: column;
    text-align: center;
  }

  .film-card-scroll {
    min-width: 160px;
    padding: 12px;
  }

  .poster-img-scroll,
  .poster-placeholder-scroll {
    height: 120px;
  }

  .section-header {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .film-card-scroll {
    min-width: 140px;
  }

  .film-title-scroll {
    font-size: 0.9rem;
  }
}
</style>
