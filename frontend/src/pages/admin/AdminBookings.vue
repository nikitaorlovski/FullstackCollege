<template>
  <div class="admin-container">
    <Navbar />

    <div class="admin-content">
      <!-- Заголовок с иконкой -->
      <div class="admin-header">
        <div class="header-left">
          <div class="header-icon">🎫</div>
          <div>
            <h1>Все бронирования</h1>
            <p class="header-subtitle">Управление бронированиями системы</p>
          </div>
        </div>
        <router-link to="/admin" class="back-btn">
          <span class="back-arrow">←</span>
          Назад в панель
        </router-link>
      </div>

      <!-- Статистика в реальном времени -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total">📊</div>
          <div class="stat-info">
            <h3>{{ bookings.length }}</h3>
            <p>Всего бронирований</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active">✅</div>
          <div class="stat-info">
            <h3>{{ activeBookings.length }}</h3>
            <p>Активные</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon canceled">❌</div>
          <div class="stat-info">
            <h3>{{ canceledBookings.length }}</h3>
            <p>Отмененные</p>
          </div>
        </div>
      </div>

      <!-- Фильтры с красивым дизайном -->
      <div class="filter-section">
        <h3 class="filter-title">Фильтры</h3>
        <div class="filter-tabs">
          <button
            class="filter-tab"
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
          >
            <span class="tab-icon">🌐</span>
            Все
            <span class="tab-count">{{ bookings.length }}</span>
          </button>
          <button
            class="filter-tab"
            :class="{ active: activeFilter === 'active' }"
            @click="activeFilter = 'active'"
          >
            <span class="tab-icon">🟢</span>
            Активные
            <span class="tab-count">{{ activeBookings.length }}</span>
          </button>
          <button
            class="filter-tab"
            :class="{ active: activeFilter === 'canceled' }"
            @click="activeFilter = 'canceled'"
          >
            <span class="tab-icon">🔴</span>
            Отмененные
            <span class="tab-count">{{ canceledBookings.length }}</span>
          </button>
        </div>
      </div>

      <!-- Список бронирований с карточками -->
      <div class="bookings-section">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка бронирований...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Ошибка загрузки</h3>
          <p>{{ error }}</p>
          <button @click="loadBookings" class="retry-btn">Попробовать снова</button>
        </div>

        <div v-else-if="filteredBookings.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>Бронирований нет</h3>
          <p>В выбранной категории бронирования отсутствуют</p>
        </div>

        <div v-else class="bookings-grid">
          <div
            v-for="booking in filteredBookings"
            :key="booking.id"
            class="booking-card"
            :class="{
              active: booking.status === 'active',
              canceled: booking.status === 'canceled',
            }"
          >
            <!-- Заголовок карточки -->
            <div class="card-header">
              <div class="booking-badge" :class="booking.status">
                <span class="badge-dot"></span>
                {{ getStatusText(booking.status) }}
              </div>
              <div class="booking-id">#{{ booking.id }}</div>
            </div>

            <!-- Основная информация -->
            <div class="card-body">
              <div class="info-row">
                <div class="info-item">
                  <span class="info-icon">👤</span>
                  <div class="info-content">
                    <label>Пользователь</label>
                    <span class="info-value">ID {{ booking.user_id }}</span>
                  </div>
                </div>
                <div class="info-item">
                  <span class="info-icon">🎬</span>
                  <div class="info-content">
                    <label>Сеанс</label>
                    <span class="info-value">ID {{ booking.session_id }}</span>
                  </div>
                </div>
              </div>

              <div class="info-row">
                <div class="info-item">
                  <span class="info-icon">💺</span>
                  <div class="info-content">
                    <label>Место</label>
                    <span class="info-value highlight">{{ booking.seat_number }}</span>
                  </div>
                </div>
                <div class="info-item">
                  <span class="info-icon">📅</span>
                  <div class="info-content">
                    <label>Создано</label>
                    <span class="info-value">{{ formatDate(booking.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Действия -->
            <div class="card-actions">
              <button
                v-if="booking.status === 'active'"
                @click="cancelBooking(booking.id)"
                class="action-btn cancel"
                :disabled="cancelingBooking === booking.id"
              >
                <span class="btn-icon">🗑️</span>
                {{ cancelingBooking === booking.id ? 'Отмена...' : 'Отменить' }}
              </button>
              <button @click.stop="showBookingDetails(booking)" class="action-btn details">
                <span class="btn-icon">👁️</span>
                Детали
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- Модалка деталей бронирования -->
  <div v-if="selectedBooking" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <button class="close-btn" @click="closeModal">×</button>

      <div class="booking-details-modal">
        <h3 class="modal-title">
          Детали бронирования #{{ selectedBooking.booking_id || selectedBooking.id }}
        </h3>

        <div class="detail-grid">
          <div class="detail-item">
            <label>Фильм:</label>
            <span>{{ selectedBooking.film_title || 'Не указан' }}</span>
          </div>
          <div class="detail-item">
            <label>Пользователь:</label>
            <span>{{ selectedBooking.user_name || `ID ${selectedBooking.user_id}` }}</span>
          </div>
          <div class="detail-item">
            <label>Email:</label>
            <span>{{ selectedBooking.email || 'Не указан' }}</span>
          </div>
          <div class="detail-item" v-if="selectedBooking.start_time">
            <label>Время сеанса:</label>
            <span>{{ formatDate(selectedBooking.start_time) }}</span>
          </div>
          <div class="detail-item">
            <label>Зал:</label>
            <span>{{ selectedBooking.hall_name || selectedBooking.hall_id || 'Не указан' }}</span>
          </div>
          <div class="detail-item">
            <label>Место:</label>
            <span>{{ selectedBooking.seat_number }}</span>
          </div>
          <div class="detail-item">
            <label>Стоимость:</label>
            <span>{{ selectedBooking.price || 'Не указана' }} ₽</span>
          </div>
          <div class="detail-item">
            <label>Длительность:</label>
            <span>{{ selectedBooking.duration || 'Не указана' }} мин.</span>
          </div>
          <div class="detail-item">
            <label>Статус:</label>
            <span class="booking-status" :class="selectedBooking.status">
              {{ getStatusText(selectedBooking.status) }}
            </span>
          </div>
          <div class="detail-item" v-if="selectedBooking.created_at">
            <label>Дата создания:</label>
            <span>{{ formatDate(selectedBooking.created_at) }}</span>
          </div>
        </div>

        <div class="modal-actions">
          <button
            v-if="selectedBooking.status === 'active'"
            @click="handleCancelAndClose"
            class="cancel-btn"
          >
            🗑️ Отменить бронирование
          </button>
          <button @click="closeModal" class="close-modal-btn">Закрыть</button>
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
  name: 'AdminBookings',
  components: {
    Navbar,
  },
  setup() {
    const API_BASE = import.meta.env.VITE_API_URL

    if (!API_BASE) {
      console.error('VITE_API_URL is not defined')
    }
    const selectedBooking = ref(null)
    const bookingDetails = ref(null)

    const showBookingDetails = async (booking) => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE}/views/booking-details/${booking.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          bookingDetails.value = await response.json()
          selectedBooking.value = bookingDetails.value
        } else {
          // Если нет деталей, используем базовые данные
          selectedBooking.value = booking
        }
      } catch (err) {
        console.error('Error loading booking details:', err)
        selectedBooking.value = booking
      }
    }
    const handleCancelAndClose = () => {
      cancelBooking(selectedBooking.value.booking_id || selectedBooking.value.id)
      closeModal()
    }
    const closeModal = () => {
      selectedBooking.value = null
      bookingDetails.value = null
    }
    const router = useRouter()
    const bookings = ref([])
    const loading = ref(false)
    const error = ref('')
    const activeFilter = ref('all')
    const cancelingBooking = ref(null)

    const loadBookings = async () => {
      loading.value = true
      error.value = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE}/bookings/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          bookings.value = await response.json()
        } else {
          throw new Error('Ошибка загрузки бронирований')
        }
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const cancelBooking = async (bookingId) => {
      if (!confirm('Вы уверены, что хотите отменить это бронирование?')) return

      cancelingBooking.value = bookingId
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          await loadBookings()
        } else {
          throw new Error('Ошибка отмены бронирования')
        }
      } catch (err) {
        error.value = err.message
      } finally {
        cancelingBooking.value = null
      }
    }

    const getStatusText = (status) => {
      const statusMap = {
        active: 'Активно',
        canceled: 'Отменено',
      }
      return statusMap[status] || status
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    // Computed свойства
    const activeBookings = computed(() => bookings.value.filter((b) => b.status === 'active'))

    const canceledBookings = computed(() => bookings.value.filter((b) => b.status === 'canceled'))

    const formatDateTime = (dateString) => {
      if (!dateString) return 'Не указано'
      const date = new Date(dateString)
      return date.toLocaleString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }
    const filteredBookings = computed(() => {
      switch (activeFilter.value) {
        case 'active':
          return activeBookings.value
        case 'canceled':
          return canceledBookings.value
        default:
          return bookings.value
      }
    })

    onMounted(() => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      if (userInfo.role !== 'admin') {
        router.push('/home')
        return
      }
      loadBookings()
    })

    return {
      bookings,
      loading,
      error,
      activeFilter,
      cancelingBooking,
      activeBookings,
      canceledBookings,
      filteredBookings,
      loadBookings,
      cancelBooking,
      handleCancelAndClose,
      getStatusText,
      formatDate,
      selectedBooking,
      showBookingDetails,
      closeModal,
      formatDateTime,
    }
  },
}
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%);
  color: white;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.admin-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* Заголовок */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  font-size: 3.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 20px;
  padding: 15px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.admin-header h1 {
  font-size: 2.8rem;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #fff, #a8b1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

.header-subtitle {
  color: #a8b1ff;
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.8;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a8b1ff;
  text-decoration: none;
  padding: 12px 20px;
  border: 1px solid rgba(168, 177, 255, 0.3);
  border-radius: 12px;
  transition: all 0.3s ease;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
}

.back-btn:hover {
  background: rgba(168, 177, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
}

.back-arrow {
  font-size: 1.2rem;
}

/* Статистика */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  font-size: 2.5rem;
  padding: 15px;
  border-radius: 15px;
}

.stat-icon.total {
  background: rgba(102, 126, 234, 0.2);
}
.stat-icon.active {
  background: rgba(34, 197, 94, 0.2);
}
.stat-icon.canceled {
  background: rgba(239, 68, 68, 0.2);
}

.stat-info h3 {
  font-size: 2.2rem;
  margin: 0;
  color: #ffd700;
  font-weight: 700;
}

.stat-info p {
  margin: 5px 0 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

/* Фильтры */
.filter-section {
  margin-bottom: 30px;
}

.filter-title {
  color: #a8b1ff;
  margin-bottom: 15px;
  font-size: 1.3rem;
  font-weight: 600;
}

.filter-tabs {
  display: flex;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 0.95rem;
}

.filter-tab.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.tab-icon {
  font-size: 1.1rem;
}

.tab-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
}

/* Сетка бронирований */
.bookings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.booking-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.booking-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.booking-card.active::before {
  opacity: 1;
  background: linear-gradient(135deg, #4ade80, #22c55e);
}

.booking-card.canceled::before {
  opacity: 1;
  background: linear-gradient(135deg, #f87171, #ef4444);
}

.booking-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

/* Заголовок карточки */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.booking-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.booking-badge.active {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.booking-badge.canceled {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.booking-id {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  font-weight: 600;
}

/* Тело карточки */
.card-body {
  margin-bottom: 20px;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-icon {
  font-size: 1.2rem;
  opacity: 0.7;
}

.info-content {
  display: flex;
  flex-direction: column;
}

.info-content label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2px;
}

.info-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
}

.info-value.highlight {
  color: #ffd700;
}

/* Действия */
.card-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s ease;
  flex: 1;
  justify-content: center;
}

.action-btn.cancel {
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.action-btn.cancel:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
}

.action-btn.details {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.action-btn.details:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Состояния загрузки и ошибки */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  grid-column: 1 / -1;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.1);
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

.error-icon,
.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.retry-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background: rgba(168, 177, 255, 0.2);
  color: #a8b1ff;
  border: 1px solid rgba(168, 177, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.retry-btn:hover {
  background: rgba(168, 177, 255, 0.3);
}

/* Адаптивность */
@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 20px;
  }

  .header-left {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .bookings-grid {
    grid-template-columns: 1fr;
  }

  .info-row {
    grid-template-columns: 1fr;
  }

  .filter-tabs {
    flex-direction: column;
  }
}
/* Стили для модалки */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: #1a1a3e;
  border-radius: 20px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.modal-title {
  color: #a8b1ff;
  margin-bottom: 25px;
  font-size: 1.5rem;
  text-align: center;
  border-bottom: 2px solid rgba(168, 177, 255, 0.3);
  padding-bottom: 15px;
}

.detail-grid {
  display: grid;
  gap: 15px;
  margin: 25px 0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-item label {
  font-weight: 600;
  color: #a8b1ff;
  font-size: 0.95rem;
}

.detail-item span {
  color: white;
  text-align: right;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  transform: translateY(-2px);
}

.close-modal-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.close-modal-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}
</style>
