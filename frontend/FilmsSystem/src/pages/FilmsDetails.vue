<template>
  <div class="film-details-container">
    <Navbar />
    
    <div class="film-details" v-if="film">
      <!-- Верхняя часть с постером и основной информацией -->
      <div class="film-header">
        <div class="film-poster-container">
          <div class="film-poster">
            <img 
              v-if="film.image_url" 
              :src="film.image_url" 
              :alt="film.title"
              @load="onImageLoad"
              :class="{ 'loaded': imageLoaded }"
            />
            <div v-else class="no-image">🎬</div>
          </div>
        </div>
        
        <div class="film-main-info">
          <div class="film-title-section">
            <h1 class="film-title">{{ film.title }}</h1>

            <div class="rating-display">
              <div class="rating-stars">
                <span 
                  v-for="star in 10" 
                  :key="star"
                  class="star"
                  :class="{
                    'full': star <= Math.floor(film.rating),
                    'half': star === Math.ceil(film.rating) && film.rating % 1 !== 0
                  }"
                >
                  ★
                </span>
              </div>
              <div class="rating-value">{{ film.rating.toFixed(1) }}/10</div>
            </div>
          </div>
          
          <div class="film-meta">
            <!-- Актеры -->
            <div class="actors-section" v-if="film.actors">
              <div class="actors-label">В главных ролях</div>
              <div class="actors-list">{{ film.actors }}</div>
            </div>

            <p class="film-description" v-if="film.description">{{ film.description }}</p>
            
            <div class="basic-info-grid">
              <div class="info-item">
                <span class="info-label">Жанр</span>
                <span class="info-value">{{ film.genre }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Длительность</span>
                <span class="info-value">{{ film.duration }} мин.</span>
              </div>
              <div class="info-item" v-if="film.year">
                <span class="info-label">Год</span>
                <span class="info-value">{{ film.year }}</span>
              </div>
              <div class="info-item" v-if="film.country">
                <span class="info-label">Страна</span>
                <span class="info-value">{{ film.country }}</span>
              </div>
            </div>

            <!-- Кнопка выбора сеанса -->
            <div class="action-buttons">
              <button class="session-btn" @click="scrollToSessions">
                Выбрать сеанс ▼
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Блок с сеансами -->
      <div class="sessions-section" ref="sessionsSection">
        <h3>Ближайшие сеансы</h3>
        
        <!-- Состояние загрузки -->
        <div v-if="sessionsLoading || hallsLoading" class="sessions-loading">
          <p>Загрузка сеансов...</p>
        </div>
        
        <!-- Состояние ошибки -->
        <div v-else-if="sessionsError || hallsError" class="sessions-error">
          <p>Ошибка при загрузке сеансов</p>
          <button @click="loadSessions" class="retry-btn">Попробовать снова</button>
        </div>
        
        <!-- Сеансы сгруппированные по датам -->
        <div v-else-if="groupedSessions.length > 0" class="sessions-container">
          <div v-for="group in groupedSessions" :key="group.date" class="session-date-group">
            <div class="date-header">
              <span class="date-day">{{ formatDay(group.date) }}</span>
              <span class="date-full">{{ formatDate(group.date) }}</span>
            </div>
            
            <div class="sessions-list">
              <div 
  v-for="session in group.sessions" 
  :key="session.id" 
  class="session-card"
  :class="{ 'disabled': session.available_seats === 0 }"
  @click="session.available_seats > 0 ? selectSession(session) : null"
>
  <div class="session-time">{{ formatTime(session.start_time) }}</div>
  <div class="session-hall">{{ getHallName(session.hall_id) }}</div>
  <div class="session-price">{{ session.price }} руб</div>
  <div class="session-seats" :class="{ 'no-seats': session.available_seats === 0 }">
    {{ session.available_seats }} из {{ session.total_seats }} мест
  </div>
  <!-- УБРАТЬ КНОПКУ -->
</div>
            </div>
          </div>
        </div>
        
        <!-- Нет сеансов -->
        <div v-else class="no-sessions">
          <p>На данный момент сеансов нет</p>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="loading">Загрузка фильма...</div>
    <div v-else class="error">Фильм не найден</div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '@/components/Layout/Navbar.vue'
import { useFilmsStore } from '@/stores/films'
import { filmsAPI, hallsAPI } from '@/api/auth'

export default {
  name: 'FilmDetails',
  components: { Navbar },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useFilmsStore()

    // id из пути
    const filmId = Number(route.params.id)

    store.seed(route.state?.film)

    // фильм берём из стора
    const film = computed(() => store.byId[filmId])
    const loading = computed(() => !!store.loading[filmId])
    const error = computed(() => store.errors[filmId])

    // остальное — как у тебя
    const imageLoaded = ref(false)
    const sessionsSection = ref(null)
    const sessions = ref([])
    const sessionsLoading = ref(false)
    const sessionsError = ref(false)
    const halls = ref([])
    const hallsLoading = ref(false)
    const hallsError = ref(false)

    // Сеансы
    const loadSessions = async () => {
  if (!filmId) return
  sessionsLoading.value = true
  sessionsError.value = false

  try {
    const { data } = await filmsAPI.getUpcomingSessions(filmId)
    sessions.value = data
  } catch (e) {
    sessionsError.value = true
    console.error('Ошибка загрузки предстоящих сессий.')
  } finally {
    sessionsLoading.value = false
  }
}

    // Залы
    const loadHalls = async () => {
      hallsLoading.value = true
      hallsError.value = false
      try {
        const { data } = await hallsAPI.getHalls()
        halls.value = data
      } catch (e) {
        hallsError.value = true
        console.error('Ошибка загрузки залов:', e)
      } finally {
        hallsLoading.value = false
      }
    }

    // Группировка сеансов
    const groupedSessions = computed(() => {
      const groups = {}
      sessions.value.forEach(s => {
        const dateKey = new Date(s.start_time).toDateString()
        if (!groups[dateKey]) groups[dateKey] = { date: s.start_time, sessions: [] }
        groups[dateKey].sessions.push(s)
      })
      Object.values(groups).forEach(g =>
        g.sessions.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      )
      return Object.values(groups).sort((a, b) => new Date(a.date) - new Date(b.date))
    })

    const formatDate = (d) =>
      new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    const formatDay = (d) =>
      new Date(d).toLocaleDateString('ru-RU', { weekday: 'long' })
    const formatTime = (d) =>
      new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

    const getHallName = (hallId) =>
      halls.value.find(h => h.id === hallId)?.name || `Зал ${hallId}`
    
    const selectSession = (session) => {
  store.setSelectedSession(session)

  router.push({
    name: 'Booking',
    query: { filmId: filmId, sessionId: session.id }
  })
}


    const onImageLoad = () => { imageLoaded.value = true }
    const scrollToSessions = () => {
      sessionsSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    onMounted(async () => {
      // если зашли по прямой ссылке — загрузим фильм
      await store.fetchById(filmId)
      // опционально тихо обновим
      store.refreshById(filmId)
      // и подтянем сеансы/залы
      await Promise.all([loadSessions(), loadHalls()])
    })

    return {
      film, loading, error,
      imageLoaded, sessionsSection, sessions,
      sessionsLoading, sessionsError, groupedSessions,
      halls, hallsLoading, hallsError,
      onImageLoad, scrollToSessions, loadSessions,
      formatDate, formatDay, formatTime, getHallName, selectSession
    }
  }
}
</script>


<style scoped>
.film-details-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d2d5a 100%);
  color: white;
}

.film-details {
  max-width: 1100px;
  margin: 0 auto;
  padding: 30px 20px;
}

.film-header {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 50px;
  margin-bottom: 40px;
  align-items: start;
}

.film-poster-container {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
}

.film-poster {
  position: relative;
  width: 100%;
  height: 500px; /* Фиксированная высота для всех постеров */
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.film-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Обрезает изображение чтобы заполнить контейнер */
  object-position: center; /* Центрирует изображение */
  border-radius: 16px;
  opacity: 0;
  transition: opacity 0.5s ease;
  display: block;
}

.film-poster img.loaded {
  opacity: 1;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
}

.film-main-info {
  padding-top: 10px;
}

.film-title-section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.film-title {
  font-size: 2.4rem;
  margin: 0 0 20px 0;
  color: white;
  line-height: 1.1;
  font-weight: 700;
  background: linear-gradient(135deg, #fff, #a8b1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 0;
}

.rating-stars {
  display: flex;
  gap: 2px;
  font-size: 1.6rem;
}

.star {
  color: #444;
  position: relative;
  transition: color 0.3s ease;
}

.star.full {
  color: #ffd700;
}

.star.half {
  color: #444;
}

.star.half::before {
  content: '★';
  position: absolute;
  left: 0;
  width: 50%;
  overflow: hidden;
  color: #ffd700;
}

.rating-value {
  font-size: 1.3rem;
  font-weight: 600;
  color: #a8b1ff;
  background: rgba(168, 177, 255, 0.1);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(168, 177, 255, 0.3);
}

.film-meta {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.actors-section {
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.actors-label {
  color: #a8b1ff;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.actors-list {
  color: #e2e8f0;
  font-size: 1rem;
  line-height: 1.5;
}

.film-description {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #e2e8f0;
  margin: 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.basic-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  color: #a8b1ff;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  color: white;
  font-size: 1rem;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.session-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  flex: 1;
}

.session-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.sessions-section {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.sessions-section h3 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: white;
  font-weight: 600;
}

/* Стили для группы сеансов по дате */
.session-date-group {
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.date-header {
  padding: 15px 20px;
  background: rgba(168, 177, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.date-day {
  font-size: 1.1rem;
  font-weight: 600;
  color: #a8b1ff;
  text-transform: capitalize;
  margin-right: 10px;
}

.date-full {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.sessions-list {
  padding: 15px;
  display: grid;
  gap: 12px;
}

.session-card {
  display: grid;
  grid-template-columns: 80px 1fr auto auto auto;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.session-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(168, 177, 255, 0.3);
  transform: translateY(-2px);
}


.session-time {
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
}

.session-hall {
  color: #a8b1ff;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 4px 8px;
  background: rgba(168, 177, 255, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(168, 177, 255, 0.2);
  display: inline-block;
}

.session-price {
  color: #a8b1ff;
  font-weight: 600;
  font-size: 1.1rem;
}

.session-seats {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  text-align: center;
}

.select-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-btn:hover {
  background: linear-gradient(135deg, #764ba2, #667eea);
  transform: translateY(-1px);
}

/* Состояния загрузки и ошибок */
.sessions-loading,
.sessions-error,
.no-sessions {
  background: rgba(255, 255, 255, 0.05);
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sessions-loading p,
.sessions-error p,
.no-sessions p {
  color: #a8b1ff;
  margin: 0 0 15px 0;
  font-size: 1.1rem;
}

.retry-btn {
  padding: 8px 16px;
  background: rgba(168, 177, 255, 0.2);
  color: #a8b1ff;
  border: 1px solid rgba(168, 177, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: rgba(168, 177, 255, 0.3);
}

.loading, .error {
  text-align: center;
  padding: 80px 20px;
  font-size: 1.2rem;
  color: #a8b1ff;
}

/* Адаптивность */
@media (max-width: 1024px) {
  .film-header {
    grid-template-columns: 300px 1fr;
    gap: 40px;
  }
  
  .film-poster {
    height: 450px;
  }
}

@media (max-width: 768px) {
  .film-details {
    padding: 20px 15px;
  }
  
  .film-header {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .film-poster-container {
    max-width: 400px;
    margin: 0 auto;
  }
  
  .film-poster {
    height: 400px;
    max-width: 100%;
  }
  
  .film-title {
    font-size: 2rem;
  }
  
  .rating-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .rating-stars {
    font-size: 1.4rem;
  }
  
  .basic-info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .session-card {
    grid-template-columns: 1fr;
    gap: 10px;
    text-align: center;
  }
  
  .session-time {
    font-size: 1.3rem;
  }
  
  .sessions-list {
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .film-poster-container {
    max-width: 300px;
  }
  
  .film-poster {
    height: 350px;
  }
  
  .film-title {
    font-size: 1.8rem;
  }
  
  .date-header {
    padding: 12px 15px;
  }
  
  .session-card {
    padding: 12px;
  }
}

.session-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.session-card.disabled:hover {
  transform: none;
  background: rgba(255, 255, 255, 0.03);
}

.session-seats.no-seats {
  color: #ff6b6b;
}
</style>