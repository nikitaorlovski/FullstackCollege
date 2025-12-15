<template>
  <div class="profile-container">
    <Navbar />

    <div class="profile-content">
      <div class="profile-header">
        <h1>Мой профиль</h1>
        <p>Управление бронированиями и настройками аккаунта</p>
      </div>

      <div class="profile-main">
        <!-- Левая колонка - информация пользователя -->
        <div class="user-info-section">
          <div class="user-card">
            <div class="user-avatar">
              <div class="avatar-icon">👤</div>
            </div>
            <div class="user-details">
              <h2>{{ userInfo.name || 'Пользователь' }}</h2>
              <p class="user-email">{{ userInfo.email || 'Загрузка...' }}</p>
              <div class="user-stats">
                <div class="stat-item">
                  <span class="stat-number">{{ activeBookings.length }}</span>
                  <span class="stat-label">Активных бронирований</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ totalBookings }}</span>
                  <span class="stat-label">Всего бронирований</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Правая колонка - бронирования -->
        <div class="bookings-section">
          <div class="section-header">
            <h3>Мои бронирования</h3>
            <div class="filter-tabs">
              <button
                class="filter-tab"
                :class="{ active: activeTab === 'active' }"
                @click="activeTab = 'active'"
              >
                Активные ({{ activeBookings.length }})
              </button>
              <button
                class="filter-tab"
                :class="{ active: activeTab === 'all' }"
                @click="activeTab = 'all'"
              >
                Все ({{ bookings.length }})
              </button>
            </div>
          </div>

          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Загрузка бронирований...</p>
          </div>

          <div v-else-if="error" class="error-state">
            <p>❌ {{ error }}</p>
            <button @click="loadBookings" class="retry-btn">Попробовать снова</button>
          </div>

          <div v-else-if="filteredBookings.length > 0" class="bookings-list">
            <div
              v-for="booking in filteredBookings"
              :key="booking.booking_id"
              class="booking-card"
              :class="{ canceled: booking.status === 'canceled' }"
              @click="openBookingDetails(booking)"
            >
              <div class="booking-info">
                <div class="film-title">{{ booking.film_title }}</div>
                <div class="booking-details">
                  <span class="detail-item" v-if="booking.start_time">
                    🕒 {{ formatDateTime(booking.start_time) }}
                  </span>
                  <span class="detail-item"> 💺 Место {{ booking.seat_number }} </span>
                  <span class="detail-item" v-if="booking.start_time">
                    📅 {{ formatDate(booking.start_time) }}
                  </span>
                </div>
              </div>

              <div class="booking-actions">
                <div class="booking-status" :class="booking.status">
                  {{ getStatusText(booking.status) }}
                </div>
                <button
                  v-if="booking.status === 'active'"
                  @click.stop="cancelBooking(booking.booking_id)"
                  class="cancel-btn"
                  :disabled="cancelingBooking === booking.booking_id"
                >
                  {{ cancelingBooking === booking.booking_id ? 'Отмена...' : 'Отменить' }}
                </button>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon">🎬</div>
            <h3>Бронирований нет</h3>
            <p>У вас пока нет активных бронирований</p>
            <router-link to="/home" class="browse-btn"> Посмотреть афишу </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="selectedBooking" class="modal-overlay" @click="selectedBooking = null">
    <div class="modal-content" @click.stop>
      <button class="close-btn" @click="selectedBooking = null">×</button>

      <div class="booking-details-modal">
        <h3 class="modal-title">Детали бронирования</h3>

        <div class="detail-grid">
          <div class="detail-item">
            <label>Фильм:</label>
            <span>{{ selectedBooking.film_title }}</span>
          </div>
          <div class="detail-item">
            <label>Время сеанса:</label>
            <span
              >{{ formatDateTime(selectedBooking.start_time) }},
              {{ formatDate(selectedBooking.start_time) }}</span
            >
          </div>
          <div class="detail-item">
            <label>Зал:</label>
            <span
              >Зал {{ selectedBooking.hall_name || selectedBooking.hall_id || 'Не указан' }}</span
            >
          </div>
          <div class="detail-item">
            <label>Место:</label>
            <span>{{ selectedBooking.seat_number }}</span>
          </div>
          <div class="detail-item">
            <label>Стоимость:</label>
            <span>{{ selectedBooking.price || 'Не указана' }} BYN</span>
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
        </div>

        <div class="modal-actions">
          <button @click="downloadPDF" class="pdf-btn">📄 PDF</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Layout/Navbar.vue'
import QRCode from 'qrcode'

export default {
  name: 'Profile',
  components: {
    Navbar,
  },
  setup() {
    const router = useRouter()

    const userInfo = ref({})
    const bookings = ref([])
    const loading = ref(false)
    const error = ref(null)
    const activeTab = ref('active')
    const cancelingBooking = ref(null)
    const selectedBooking = ref(null)

    const openBookingDetails = async (booking) => {
      try {
        const token = localStorage.getItem('token')

        const response = await fetch(
          `http://localhost:8000/views/booking-details/${booking.booking_id || booking.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (response.ok) {
          const detailedBooking = await response.json()
          selectedBooking.value = detailedBooking
          console.log('Detailed booking:', detailedBooking)
        } else {
          console.warn('Details endpoint failed, using basic data')
          selectedBooking.value = booking
        }
      } catch (err) {
        console.error('Error loading booking details:', err)
        selectedBooking.value = booking
      }
    }

    const downloadPDF = async () => {
      const html2pdf = (await import('html2pdf.js')).default
      const QRCode = (await import('qrcode')).default

      const booking = selectedBooking.value

      const qrData = JSON.stringify({
        booking_id: booking.booking_id,
        film: booking.film_title,
        time: booking.start_time,
        seat: booking.seat_number,
      })

      const qrBase64 = await QRCode.toDataURL(qrData, { width: 160 })

      const element = document.createElement('div')
      element.style.padding = '25px'
      element.style.fontFamily = 'Arial'
      element.style.width = '400px'
      element.style.border = '2px solid #4f46e5'
      element.style.borderRadius = '12px'
      element.style.background = '#f9fafb'
      element.style.color = '#111827'
      element.style.boxSizing = 'border-box'

      element.innerHTML = `
    <div style="text-align:center; margin-bottom: 15px;">
      <h2 style="margin:0; color:#4f46e5;">🎟️ Билет в кино</h2>
      <p style="margin:0; font-size:14px;">Film Viewer</p>
    </div>

    <hr style="margin: 15px 0; border-color:#c7d2fe"/>

    <p><strong>🎬 Фильм:</strong> ${booking.film_title}</p>
    <p><strong>📅 Дата:</strong> ${formatDate(booking.start_time)}</p>
    <p><strong>⏰ Время:</strong> ${formatDateTime(booking.start_time)}</p>
    <p><strong>🏛 Зал:</strong> ${booking.hall_name || booking.hall_id}</p>
    <p><strong>💺 Место:</strong> ${booking.seat_number}</p>
    <p><strong>💰 Цена:</strong> ${booking.price} BYN</p>
    <p><strong>📌 Статус:</strong> ${getStatusText(booking.status)}</p>

    <hr style="margin: 15px 0; border-color:#c7d2fe"/>

    <p style="font-size:12px;"><strong>ID бронирования:</strong> ${booking.booking_id}</p>

    <div style="margin-top: 20px; text-align:center;">
      <img src="${qrBase64}" 
           style="display:block; margin:0 auto; width:160px; height:160px;" />
      <p style="font-size:11px; color:#6b7280;">Покажите QR-код при входе</p>
    </div>
  `

      // === Центровка на листе PDF ===
      const wrapper = document.createElement('div')
      wrapper.style.width = '100%'
      wrapper.style.display = 'flex'
      wrapper.style.justifyContent = 'center'
      wrapper.style.alignItems = 'center'
      wrapper.style.padding = '40px 0'
      wrapper.appendChild(element)

      html2pdf()
        .from(wrapper)
        .set({
          margin: 0,
          filename: `ticket-${booking.booking_id}.pdf`,
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .save()
    }

    const loadUserInfo = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch('http://localhost:8000/views/user-info', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          userInfo.value = await response.json()
          // ⭐ ВАЖНО: Сохраняем в localStorage для проверки роли в guards
          localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
          console.log('User info loaded:', userInfo.value)
        } else {
          userInfo.value = {
            name: 'Пользователь',
            email: 'user@example.com',
            role: 'user', // добавляем роль по умолчанию
          }
          localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
        }
      } catch (err) {
        console.error('Error loading user info:', err)
        userInfo.value = {
          name: 'Пользователь',
          email: 'user@example.com',
          role: 'user', // добавляем роль по умолчанию
        }
        localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
      }
    }

    const loadBookings = async () => {
      loading.value = true
      error.value = null

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch('http://localhost:8000/views/user-history', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        console.log('Response status:', response.status)

        if (response.status === 401) {
          localStorage.removeItem('token')
          throw new Error('Не авторизован. Пожалуйста, войдите снова.')
        }

        if (!response.ok) {
          throw new Error(`Ошибка загрузки бронирований: ${response.status}`)
        }

        const data = await response.json()
        console.log('User history data:', data)
        bookings.value = data
      } catch (err) {
        console.error('Error loading bookings:', err)
        error.value = err.message || 'Не удалось загрузить бронирования'

        if (err.message.includes('Не авторизован')) {
          setTimeout(() => router.push('/login'), 2000)
        }
      } finally {
        loading.value = false
      }
    }

    const cancelBooking = async (bookingId) => {
      cancelingBooking.value = bookingId

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:8000/bookings/${bookingId}/cancel`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Ошибка отмены бронирования')
        }

        await loadBookings()
      } catch (err) {
        console.error('Error canceling booking:', err)
        alert('Не удалось отменить бронирование')
      } finally {
        cancelingBooking.value = null
      }
    }

    const formatDateTime = (dateString) => {
      try {
        let date

        if (typeof dateString === 'string' || typeof dateString === 'number') {
          date = new Date(dateString)
        } else {
          console.warn('Invalid date format:', dateString)
          return '--:--'
        }

        // Проверяем валидность даты
        if (isNaN(date.getTime())) {
          console.warn('Invalid date:', dateString)
          return '--:--'
        }

        return date.toLocaleString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Moscow',
        })
      } catch (error) {
        console.error('Error formatting datetime:', error, dateString)
        return '--:--'
      }
    }

    const formatDate = (dateString) => {
      try {
        let date

        if (typeof dateString === 'string' || typeof dateString === 'number') {
          date = new Date(dateString)
        } else {
          console.warn('Invalid date format:', dateString)
          return 'Неизвестная дата'
        }

        if (isNaN(date.getTime())) {
          console.warn('Invalid date:', dateString)
          return 'Неизвестная дата'
        }

        return date.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'Europe/Moscow',
        })
      } catch (error) {
        console.error('Error formatting date:', error, dateString)
        return 'Неизвестная дата'
      }
    }
    const getStatusText = (status) => {
      const statusMap = {
        active: 'Активно',
        canceled: 'Отменено',
        expired: 'Прошло',
      }
      return statusMap[status] || status
    }

    const activeBookings = computed(() => bookings.value.filter((b) => b.status === 'active'))

    const totalBookings = computed(() => bookings.value.length)

    const filteredBookings = computed(() => {
      if (activeTab.value === 'active') {
        return activeBookings.value
      }
      return bookings.value
    })

    onMounted(() => {
      loadUserInfo()
      loadBookings()
    })

    return {
      userInfo,
      bookings,
      loading,
      error,
      activeTab,
      cancelingBooking,
      selectedBooking,
      activeBookings,
      totalBookings,
      filteredBookings,
      loadBookings,
      cancelBooking,
      openBookingDetails,
      downloadPDF,
      formatDateTime,
      formatDate,
      getStatusText,
    }
  },
}
</script>

<style scoped>
.modal-title {
  color: #ffffff !important;
}
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
}

.modal-content {
  background: #1a1a3e;
  border-radius: 16px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.detail-grid {
  display: grid;
  gap: 15px;
  margin: 20px 0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-item label {
  font-weight: bold;
  color: #a8b1ff;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.pdf-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.pdf-btn {
  background: #3b82f6;
  color: white;
}

.print-btn:hover {
  background: #22c55e;
}
.pdf-btn:hover {
  background: #2563eb;
}

/* Стили для печати */
@media print {
  .navbar,
  .filter-tabs,
  .cancel-btn,
  .modal-actions {
    display: none !important;
  }

  .booking-details-modal {
    background: white !important;
    color: black !important;
  }
}

/* Добавьте курсор для карточек */
.booking-card {
  cursor: pointer;
  /* остальные ваши стили остаются */
}
/* Стили остаются такими же как в предыдущем коде */
.profile-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%);
  color: white;
}

.profile-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.profile-header {
  text-align: center;
  margin-bottom: 40px;
}

.profile-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #fff, #a8b1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.profile-header p {
  color: #a8b1ff;
  font-size: 1.1rem;
}

.profile-main {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 40px;
}

.user-info-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.user-avatar {
  margin-bottom: 20px;
}

.avatar-icon {
  font-size: 4rem;
  margin: 0 auto;
  width: 100px;
  height: 100px;
  background: rgba(168, 177, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(168, 177, 255, 0.3);
}

.user-details h2 {
  font-size: 1.5rem;
  margin-bottom: 5px;
}

.user-email {
  color: #a8b1ff;
  margin-bottom: 20px;
}

.user-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-number {
  display: block;
  font-size: 1.8rem;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.bookings-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.section-header h3 {
  font-size: 1.5rem;
  color: #a8b1ff;
}

.filter-tabs {
  display: flex;
  gap: 10px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border-radius: 8px;
}

.filter-tab {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.filter-tab.active {
  background: rgba(102, 126, 234, 0.3);
  color: white;
}

.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.booking-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.booking-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.booking-card.canceled {
  opacity: 0.6;
}

.booking-info {
  flex: 1;
}

.film-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: white;
}

.booking-details {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.detail-item {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.booking-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.booking-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.booking-status.active {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.booking-status.expired {
  background: rgba(148, 163, 184, 0.15); /* серый с прозрачностью */
  color: #94a3b8; /* красивый серый */
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.booking-status.canceled {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.cancel-btn {
  padding: 6px 12px;
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.cancel-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
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

.retry-btn {
  margin-top: 15px;
  padding: 8px 16px;
  background: rgba(168, 177, 255, 0.2);
  color: #a8b1ff;
  border: 1px solid rgba(168, 177, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.browse-btn {
  display: inline-block;
  margin-top: 15px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.browse-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

@media (max-width: 1024px) {
  .profile-main {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}

@media (max-width: 768px) {
  .profile-content {
    padding: 20px 15px;
  }

  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .booking-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .booking-actions {
    align-items: flex-start;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }

  .booking-details {
    flex-direction: column;
    gap: 5px;
  }

  .user-stats {
    grid-template-columns: 1fr;
  }
}
</style>
