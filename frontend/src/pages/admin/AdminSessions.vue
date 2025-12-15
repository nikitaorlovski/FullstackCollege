<template>
  <div class="admin-container">
    <Navbar />
    
    <div class="admin-content">
      <!-- Заголовок с иконкой -->
      <div class="admin-header">
        <div class="header-left">
          <div class="header-icon">🎬</div>
          <div>
            <h1>Управление сеансами</h1>
            <p class="header-subtitle">Создание и управление киносеансами в системе</p>
          </div>
        </div>
        <router-link to="/admin" class="back-btn">
          <span class="back-arrow">←</span>
          Назад в панель
        </router-link>
      </div>

      <!-- Статистика -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total">📅</div>
          <div class="stat-info">
            <h3>{{ sessions.length }}</h3>
            <p>Всего сеансов</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon capacity">💰</div>
          <div class="stat-info">
            <h3>{{ totalRevenue }} BYN</h3>
            <p>Общий потенциал</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon average">🎟️</div>
          <div class="stat-info">
            <h3>{{ occupancyRate }}%</h3>
            <p>Средняя занятость</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon upcoming">⏰</div>
          <div class="stat-info">
            <h3>{{ upcomingSessionsCount }}</h3>
            <p>Ближайшие сеансы</p>
          </div>
        </div>
      </div>

      <!-- Панель действий -->
      <div class="action-panel">
        <button @click="showAddForm = true" class="add-btn">
          <span class="btn-icon">+</span>
          Добавить сеанс
        </button>
        
        <div class="filter-controls">
          <select v-model="dateFilter" class="filter-select">
            <option value="all">Все даты</option>
            <option value="today">Сегодня</option>
            <option value="week">Эта неделя</option>
            <option value="month">Этот месяц</option>
          </select>
          
          <select v-model="hallFilter" class="filter-select">
            <option value="all">Все залы</option>
            <option v-for="hall in halls" :key="hall.id" :value="hall.id">
              {{ hall.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Форма добавления сеанса -->
      <div v-if="showAddForm" class="modal-overlay" @click="showAddForm = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>🎬 Добавить новый сеанс</h3>
            <button class="close-btn" @click="showAddForm = false">×</button>
          </div>
          
          <form @submit.prevent="addSession" class="session-form">
            <div class="form-grid">
              <div class="form-group">
                <label>Фильм *</label>
                <select v-model="newSession.film_id" required class="form-select">
                  <option value="">Выберите фильм</option>
                  <option 
                    v-for="film in activeFilms" 
                    :key="film.id" 
                    :value="film.id"
                    class="film-option"
                  >
                    {{ film.title }} ({{ film.duration }} мин, {{ film.rating }}★)
                  </option>
                </select>
                
              </div>
              
              <div class="form-group">
                <label>Зал *</label>
                <select v-model="newSession.hall_id" required class="form-select">
                  <option value="">Выберите зал</option>
                  <option v-for="hall in halls" :key="hall.id" :value="hall.id">
                    {{ hall.name }} ({{ hall.capacity }} мест)
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Дата и время *</label>
                <input 
                  v-model="newSession.start_time" 
                  type="datetime-local" 
                  required
                  class="form-input"
                  :min="minDateTime"
                >
              </div>
              
              <div class="form-group">
                <label>Цена (BYN) *</label>
                <input 
                  v-model="newSession.price" 
                  type="number" 
                  placeholder="50"
                  min="1"
                  max="5000"
                  required
                  class="form-input"
                >
              </div>
            </div>

            <!-- Предварительный просмотр сеанса -->
            <div v-if="isSessionPreviewValid" class="session-preview">
              <div class="preview-header">
                <h4>Предварительный просмотр</h4>
              </div>
              <div class="preview-content">
                <div class="preview-film">
                  <strong>{{ selectedFilm?.title }}</strong>
                  <span>{{ selectedFilm?.duration }} мин</span>
                </div>
                <div class="preview-details">
                  <div class="preview-item">
                    <span class="preview-label">Зал:</span>
                    <span class="preview-value">{{ selectedHall?.name }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="preview-label">Время:</span>
                    <span class="preview-value">{{ formatPreviewDateTime(newSession.start_time) }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="preview-label">Цена:</span>
                    <span class="preview-value price">{{ newSession.price }} BYN</span>
                  </div>
                  <div class="preview-item">
                    <span class="preview-label">Мест:</span>
                    <span class="preview-value">{{ selectedHall?.capacity }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button 
                type="button" 
                @click="showAddForm = false" 
                class="cancel-btn"
              >
                Отмена
              </button>
              <button 
                type="submit" 
                :disabled="loading || !isFormValid" 
                class="submit-btn"
              >
                {{ loading ? 'Добавление...' : 'Создать сеанс' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Список сеансов -->
      <div class="sessions-section">
        <div v-if="loading && sessions.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка сеансов...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Ошибка загрузки</h3>
          <p>{{ error }}</p>
          <button @click="loadSessions" class="retry-btn">
            Попробовать снова
          </button>
        </div>

        <div v-else-if="filteredSessions.length === 0" class="empty-state">
          <div class="empty-icon">🎬</div>
          <h3>Сеансы не найдены</h3>
          <p>{{ hasFilters ? 'Попробуйте изменить фильтры' : 'Добавьте первый сеанс в систему' }}</p>
          <button v-if="!hasFilters" @click="showAddForm = true" class="add-first-btn">
            Добавить сеанс
          </button>
        </div>

        <div v-else class="sessions-grid">
          <div 
            v-for="session in filteredSessions" 
            :key="session.id" 
            class="session-card"
            :class="{ 'upcoming': isUpcoming(session.start_time) }"
          >
            <div class="session-header">
              <div class="film-poster">
                <img 
                  v-if="getFilmImage(session.film_id)" 
                  :src="getFilmImage(session.film_id)" 
                  :alt="getFilmTitle(session.film_id)"
                  class="poster-img"
                >
                <div v-else class="poster-placeholder">🎬</div>
              </div>
              <div class="session-title-section">
                <h3 class="film-title">{{ getFilmTitle(session.film_id) }}</h3>
                <div class="film-meta">
                  <span class="film-genre">{{ getFilmGenre(session.film_id) }}</span>
                  <span class="film-duration">{{ getFilmDuration(session.film_id) }} мин</span>
                  <span class="film-rating">⭐ {{ getFilmRating(session.film_id) }}</span>
                </div>
                <div class="session-id">ID: {{ session.id }}</div>
              </div>
            </div>

            <div class="session-details">
              <div class="detail-row">
                <div class="detail-item">
                  <div class="detail-icon">⏰</div>
                  <div class="detail-info">
                    <div class="detail-label">Время начала</div>
                    <div class="detail-value">{{ formatDateTime(session.start_time) }}</div>
                  </div>
                </div>
                
                <div class="detail-item">
                  <div class="detail-icon">🏛️</div>
                  <div class="detail-info">
                    <div class="detail-label">Зал</div>
                    <div class="detail-value">{{ getHallName(session.hall_id) }}</div>
                  </div>
                </div>
              </div>

              <div class="detail-row">
                <div class="detail-item">
                  <div class="detail-icon">💰</div>
                  <div class="detail-info">
                    <div class="detail-label">Цена</div>
                    <div class="detail-value price">{{ session.price }} BYN</div>
                  </div>
                </div>
                
                <div class="detail-item">
                  <div class="detail-icon">💺</div>
                  <div class="detail-info">
                    <div class="detail-label">Занятость</div>
                    <div class="detail-value">
                      {{ session.total_seats - session.available_seats }}/{{ session.total_seats }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Прогресс бар занятости -->
            <div class="occupancy-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: getOccupancyPercent(session) + '%' }"
                  :class="getOccupancyClass(session)"
                ></div>
              </div>
              <div class="progress-label">
                {{ getOccupancyPercent(session) }}% занято
              </div>
            </div>

            <!-- Статус сеанса -->
            <div class="session-status">
              <span class="status-badge" :class="getSessionStatus(session)">
                {{ getSessionStatusText(session) }}
              </span>
              <span class="revenue">
                Потенциал: {{ calculateSessionRevenue(session) }} BYN
              </span>
            </div>

            <!-- Действия -->
            <div class="card-actions">
              <button 
                @click="deleteSession(session.id)"
                class="action-btn delete"
                :disabled="deletingSession === session.id"
              >
                <span class="btn-icon">🗑️</span>
                {{ deletingSession === session.id ? '...' : 'Удалить' }}
              </button>
            </div>
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
  name: 'AdminSessions',
  components: {
    Navbar
  },
  setup() {
    const router = useRouter()
    const sessions = ref([])
    const films = ref([])
    const halls = ref([])
    const loading = ref(false)
    const error = ref('')
    const showAddForm = ref(false)
    const deletingSession = ref(null)
    const dateFilter = ref('all')
    const hallFilter = ref('all')
    
    const newSession = ref({
      film_id: '',
      hall_id: '',
      start_time: '',
      price: ''
    })

    // Computed свойства
    const activeFilms = computed(() => {
      return films.value.filter(film => film.is_active)
    })

    const selectedFilm = computed(() => {
      return films.value.find(f => f.id === parseInt(newSession.value.film_id))
    })

    const selectedHall = computed(() => {
      return halls.value.find(h => h.id === parseInt(newSession.value.hall_id))
    })

    const isFormValid = computed(() => {
      return newSession.value.film_id && 
             newSession.value.hall_id && 
             newSession.value.start_time && 
             newSession.value.price && 
             newSession.value.price >= 0
    })

    const isSessionPreviewValid = computed(() => {
      return selectedFilm.value && selectedHall.value && newSession.value.start_time
    })

    const totalRevenue = computed(() => {
      return sessions.value.reduce((sum, session) => sum + (session.price * session.total_seats), 0)
    })

    const occupancyRate = computed(() => {
      if (sessions.value.length === 0) return 0
      const totalOccupancy = sessions.value.reduce((sum, session) => {
        return sum + ((session.total_seats - session.available_seats) / session.total_seats) * 100
      }, 0)
      return Math.round(totalOccupancy / sessions.value.length)
    })

    const upcomingSessionsCount = computed(() => {
      const now = new Date()
      return sessions.value.filter(session => new Date(session.start_time) > now).length
    })

    const filteredSessions = computed(() => {
      let filtered = sessions.value
      
      // Фильтр по дате
      const now = new Date()
      switch (dateFilter.value) {
        case 'today':
          const today = new Date().toDateString()
          filtered = filtered.filter(s => new Date(s.start_time).toDateString() === today)
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(s => new Date(s.start_time) >= weekAgo)
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(s => new Date(s.start_time) >= monthAgo)
          break
      }
      
      // Фильтр по залу
      if (hallFilter.value !== 'all') {
        filtered = filtered.filter(s => s.hall_id === parseInt(hallFilter.value))
      }
      
      // Сортировка по дате (сначала ближайшие)
      return filtered.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    })

    const hasFilters = computed(() => {
      return dateFilter.value !== 'all' || hallFilter.value !== 'all'
    })

    const minDateTime = computed(() => {
      const now = new Date()
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
      return now.toISOString().slice(0, 16)
    })

    // Методы
    const getFilmTitle = (filmId) => {
      const film = films.value.find(f => f.id === filmId)
      return film ? film.title : 'Неизвестный фильм'
    }

    const getFilmGenre = (filmId) => {
      const film = films.value.find(f => f.id === filmId)
      return film ? film.genre : 'Неизвестно'
    }

    const getFilmDuration = (filmId) => {
      const film = films.value.find(f => f.id === filmId)
      return film ? film.duration : '?'
    }

    const getFilmRating = (filmId) => {
      const film = films.value.find(f => f.id === filmId)
      return film ? film.rating : '?'
    }

    const getFilmImage = (filmId) => {
      const film = films.value.find(f => f.id === filmId)
      return film?.image_url || null
    }

    const getHallName = (hallId) => {
      const hall = halls.value.find(h => h.id === hallId)
      return hall ? hall.name : 'Неизвестный зал'
    }

    const formatDateTime = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatPreviewDateTime = (dateTimeString) => {
      if (!dateTimeString) return ''
      const date = new Date(dateTimeString)
      return date.toLocaleString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const isUpcoming = (dateString) => {
      return new Date(dateString) > new Date()
    }

    const getOccupancyPercent = (session) => {
      return Math.round(((session.total_seats - session.available_seats) / session.total_seats) * 100)
    }

    const getOccupancyClass = (session) => {
      const percent = getOccupancyPercent(session)
      if (percent < 30) return 'low'
      if (percent < 70) return 'medium'
      return 'high'
    }

    const getSessionStatus = (session) => {
      const now = new Date()
      const sessionTime = new Date(session.start_time)
      if (sessionTime < now) return 'completed'
      if (getOccupancyPercent(session) > 80) return 'high-demand'
      return 'upcoming'
    }

    const getSessionStatusText = (session) => {
      const status = getSessionStatus(session)
      switch (status) {
        case 'completed': return 'Завершен'
        case 'high-demand': return 'Высокий спрос'
        default: return 'Предстоящий'
      }
    }

    const calculateSessionRevenue = (session) => {
      return (session.total_seats - session.available_seats) * session.price
    }

    // API методы
    const loadSessions = async () => {
      loading.value = true
      error.value = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:8000/sessions/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          sessions.value = await response.json()
        } else {
          throw new Error('Ошибка загрузки сеансов')
        }
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const loadFilms = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:8000/films/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          films.value = await response.json()
        }
      } catch (err) {
        console.error('Error loading films:', err)
      }
    }

    const loadHalls = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:8000/halls/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          halls.value = await response.json()
        }
      } catch (err) {
        console.error('Error loading halls:', err)
      }
    }

    const addSession = async () => {
      loading.value = true
      try {
        const token = localStorage.getItem('token')
        
        const sessionData = {
          ...newSession.value,
          start_time: new Date(newSession.value.start_time).toISOString(),
          film_id: parseInt(newSession.value.film_id),
          hall_id: parseInt(newSession.value.hall_id),
          price: parseFloat(newSession.value.price)
        }

        const response = await fetch('http://localhost:8000/sessions/', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(sessionData)
        })

        if (response.ok) {
          showAddForm.value = false
          newSession.value = { film_id: '', hall_id: '', start_time: '', price: '' }
          await loadSessions()
        } else {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Ошибка добавления сеанса')
        }
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const deleteSession = async (sessionId) => {
  if (!confirm('Вы уверены, что хотите удалить этот сеанс? Все связанные бронирования также будут удалены.')) return
  
  deletingSession.value = sessionId
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:8000/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (response.ok) {
      await loadSessions()
    } else {
      const errorData = await response.json()
      let errorMessage = errorData.detail || 'Ошибка удаления сеанса'
      
      // Быстрый перевод ошибок
      if (errorMessage.includes('Cannot delete session with active bookings')) {
        errorMessage = 'Нельзя удалить сеанс с активными бронированиями'
      } else if (errorMessage.includes('Session') && errorMessage.includes('not found')) {
        errorMessage = 'Сеанс не найден'
      } else if (errorMessage.includes('not found')) {
        errorMessage = 'Сеанс не найден'
      }
      
      alert(errorMessage)
    }
  } catch (err) {
    let errorMessage = err.message || 'Ошибка удаления сеанса'
    
    // Перевод для ошибок сети и т.д.
    if (errorMessage.includes('Failed to fetch')) {
      errorMessage = 'Ошибка соединения с сервером'
    }
    
    alert(errorMessage)
  } finally {
    deletingSession.value = null
  }
}
    onMounted(() => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      if (userInfo.role !== 'admin') {
        router.push('/home')
        return
      }
      loadSessions()
      loadFilms()
      loadHalls()
    })

    return {
      sessions,
      films,
      halls,
      loading,
      error,
      showAddForm,
      newSession,
      deletingSession,
      dateFilter,
      hallFilter,
      activeFilms,
      selectedFilm,
      selectedHall,
      isFormValid,
      isSessionPreviewValid,
      totalRevenue,
      occupancyRate,
      upcomingSessionsCount,
      filteredSessions,
      hasFilters,
      minDateTime,
      loadSessions,
      addSession,
      deleteSession,
      getFilmTitle,
      getFilmGenre,
      getFilmDuration,
      getFilmRating,
      getFilmImage,
      getHallName,
      formatDateTime,
      formatPreviewDateTime,
      isUpcoming,
      getOccupancyPercent,
      getOccupancyClass,
      getSessionStatus,
      getSessionStatusText,
      calculateSessionRevenue
    }
  }
}
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%);
  color: white;
}

.admin-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.admin-header h1 {
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

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a8b1ff;
  text-decoration: none;
  padding: 12px 20px;
  border: 1px solid rgba(168, 177, 255, 0.3);
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.back-btn:hover {
  background: rgba(168, 177, 255, 0.1);
  transform: translateY(-1px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.08);
}

.stat-icon {
  font-size: 2.5rem;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
}

.stat-info h3 {
  font-size: 2rem;
  margin: 0;
  color: #a8b1ff;
}

.stat-info p {
  margin: 4px 0 0 0;
  color: rgba(255, 255, 255, 0.7);
}

.action-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.filter-controls {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  min-width: 150px;
}

.filter-select option {
  background: #1a1a3e;
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: linear-gradient(135deg, #1a1a3e, #0c0c1d);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 0;
  width: 95%;
  max-width: 900px;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 2.5rem;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  color: white;
  transform: scale(1.1);
}

.session-form {
  padding: 40px;
  flex: 1;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 35px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group label {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.1rem;
}

.form-select,
.form-input {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: white;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  min-height: 56px;
  width: 100%;
  box-sizing: border-box;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #a8b1ff;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 0 3px rgba(168, 177, 255, 0.2);
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23a8b1ff' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 20px center;
  background-size: 16px;
}

.film-option {
  padding: 12px 16px;
  background: #1a1a3e;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.film-option:hover {
  background: rgba(168, 177, 255, 0.2);
}

.film-info {
  display: flex;
  gap: 15px;
  align-items: center;
}

.film-genre {
  background: rgba(168, 177, 255, 0.3);
  color: #a8b1ff;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
}

.film-rating {
  color: #ffd700;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
}

.session-preview {
  margin: 35px 0;
  padding: 30px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.preview-header h4 {
  margin: 0 0 20px 0;
  color: #a8b1ff;
  font-size: 1.4rem;
  font-weight: 700;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-film {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.preview-film strong {
  color: white;
  font-size: 1.3rem;
  font-weight: 700;
}

.preview-film span {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  font-weight: 600;
}

.preview-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.preview-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  font-weight: 600;
}

.preview-value {
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
}

.preview-value.price {
  color: #4ade80;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  margin-top: 40px;
  padding-top: 30px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn {
  padding: 16px 32px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 56px;
  min-width: 140px;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.submit-btn {
  padding: 16px 32px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 56px;
  min-width: 180px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.session-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  position: relative;
}

.session-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
}

.session-card.upcoming {
  border-left: 4px solid #4ade80;
}

.session-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.film-poster {
  flex-shrink: 0;
}

.poster-img {
  width: 60px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}

.poster-placeholder {
  width: 60px;
  height: 80px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.session-title-section {
  flex: 1;
}

.film-title {
  font-size: 1.3rem;
  margin: 0 0 8px 0;
  color: white;
  line-height: 1.3;
}

.film-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.film-genre {
  background: rgba(168, 177, 255, 0.2);
  color: #a8b1ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.film-duration,
.film-rating {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  display: flex;
  align-items: center;
}

.session-id {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
}

.session-details {
  margin-bottom: 20px;
}

.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-icon {
  font-size: 1.2rem;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-info {
  flex: 1;
}

.detail-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  margin-bottom: 2px;
}

.detail-value {
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
}

.detail-value.price {
  color: #4ade80;
}

.occupancy-progress {
  margin-bottom: 16px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.low {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.progress-fill.medium {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.progress-fill.high {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.progress-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  text-align: right;
}

.session-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.upcoming {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.status-badge.high-demand {
  background: rgba(249, 115, 22, 0.2);
  color: #fb923c;
}

.status-badge.completed {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
}

.revenue {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.delete {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  opacity: 0.9;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state,
.error-state,
.empty-state {
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.7;
}

.retry-btn,
.add-first-btn {
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

.retry-btn:hover,
.add-first-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .header-left {
    flex-direction: column;
    text-align: center;
  }

  .action-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-controls {
    flex-direction: column;
  }

  .filter-select {
    min-width: auto;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .sessions-grid {
    grid-template-columns: 1fr;
  }

  .detail-row {
    grid-template-columns: 1fr;
  }

  .session-status {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .modal-content {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }
  
  .modal-header {
    padding: 25px;
  }
  
  .modal-header h3 {
    font-size: 1.5rem;
  }
  
  .session-form {
    padding: 25px;
  }
  
  .form-grid {
    gap: 25px;
  }
  
  .form-select,
  .form-input {
    padding: 14px 16px;
    min-height: 52px;
    font-size: 1rem;
  }
  
  .preview-details {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 15px;
  }
  
  .cancel-btn,
  .submit-btn {
    width: 100%;
    min-width: auto;
  }
  
  .session-preview {
    margin: 25px 0;
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .admin-content {
    padding: 20px 15px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .session-form {
    padding: 20px;
  }

  .preview-details {
    grid-template-columns: 1fr;
  }
  
  .modal-header {
    padding: 20px;
  }
  
  .session-form {
    padding: 20px;
  }
  
  .form-grid {
    gap: 20px;
  }
  
  .preview-film {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}

/* Исправление белых селектов */
select.form-select,
select.filter-select {
  background-color: rgba(255, 255, 255, 0.08) !important;
}

select.form-select option,
select.filter-select option {
  background: #1a1a3e !important;
  color: white !important;
}
</style>