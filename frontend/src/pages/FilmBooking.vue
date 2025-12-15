<template>
  <div class="booking-container">
    <Navbar />

    <div class="booking-content" v-if="film && session">
      <!-- Шапка с информацией о фильме -->
      <div class="film-header">
        <div class="film-poster">
          <img v-if="film.image_url" :src="film.image_url" :alt="film.title" />
          <div v-else class="no-poster">🎬</div>
        </div>
        <div class="film-info">
          <h1>{{ film.title }}</h1>
          <p class="film-genre">{{ film.genre }}</p>
          <div class="session-info">
            <div class="session-date">{{ formatDate(session.start_time) }}</div>
            <div class="session-time">{{ formatTime(session.start_time) }}</div>
            <div class="session-hall">{{ getHallName(session.hall_id) }}</div>
          </div>
        </div>
      </div>

      <!-- Основной контент -->
      <div class="booking-main">
        <!-- Левая часть - схема зала -->
        <div class="hall-section">
          <div class="hall-layout">
            <!-- Экран -->
            <div class="screen">ЭКРАН</div>

            <!-- Схема мест -->
            <div class="seats-grid">
              <div v-for="row in seatRows" :key="row.rowNumber" class="seat-row">
                <div class="row-number">{{ row.rowNumber }}</div>
                <div
                  v-for="seat in row.seats"
                  :key="seat.seatNumber"
                  class="seat"
                  :class="{
                    available: seat.status === 'available',
                    occupied: seat.status === 'occupied',
                    selected: seat.status === 'selected',
                  }"
                  @click="toggleSeat(seat)"
                >
                  {{ seat.seatNumber }}
                </div>
              </div>
            </div>
          </div>

          <!-- Легенда -->
          <div class="legend">
            <div class="legend-item">
              <div class="seat-sample available"></div>
              <span>Свободно</span>
            </div>
            <div class="legend-item">
              <div class="seat-sample occupied"></div>
              <span>Занято</span>
            </div>
            <div class="legend-item">
              <div class="seat-sample selected"></div>
              <span>Ваш выбор</span>
            </div>
          </div>
        </div>

        <!-- Правая часть - информация о брони -->
        <div class="booking-sidebar">
          <div class="timer" :class="{ warning: timeLeftMinutes < 2 }">⏰ {{ formatTimeLeft }}</div>

          <div class="selected-seats">
            <h3>Выбранные места:</h3>
            <div v-if="selectedSeats.length === 0" class="no-seats">Места не выбраны</div>
            <div
              v-for="seat in selectedSeats"
              :key="`${seat.rowNumber}-${seat.seatNumber}`"
              class="selected-seat-item"
            >
              {{ seat.rowNumber }} ряд, {{ seat.seatNumber }} место
              <span class="seat-price">{{ session.price }} BYN</span>
            </div>
          </div>

          <div class="booking-summary">
            <div class="total-price">
              Стоимость билетов: <strong>{{ totalPrice }} BYN</strong>
            </div>
            <button
              class="buy-btn"
              :disabled="selectedSeats.length === 0 || bookingInProgress"
              @click="createBooking"
            >
              {{ bookingInProgress ? 'Оформление...' : 'Оформить билет' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно успеха -->
    <div v-if="showSuccessModal" class="modal-overlay">
      <div class="modal-content">
        <h2>🎉 Бронирование успешно!</h2>
        <p>Ваши билеты забронированы. Приятного просмотра!</p>
        <button @click="closeModal" class="modal-btn">OK</button>
      </div>
    </div>

    <!-- Модальное окно ошибки таймера -->
    <div v-if="showTimeoutModal" class="modal-overlay">
      <div class="modal-content">
        <h2>⏰ Время вышло!</h2>
        <p>К сожалению, время на бронирование истекло. Места были освобождены.</p>
        <button @click="redirectToFilm" class="modal-btn">Вернуться к фильму</button>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-else-if="loading" class="loading">Загрузка...</div>

    <!-- Ошибка -->
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '@/components/Layout/Navbar.vue'
import { useFilmsStore } from '@/stores/films'

export default {
  name: 'FilmBooking',
  components: {
    Navbar,
  },
  setup() {
    const API_BASE = import.meta.env.VITE_API_URL

    if (!API_BASE) {
      console.error('VITE_API_URL is not defined')
    }

    const route = useRoute()
    const router = useRouter()
    const store = useFilmsStore()

    const filmId = Number(route.query.filmId)
    const sessionId = Number(route.query.sessionId)

    const film = computed(() => store.byId[filmId] || null)
    const session = computed(() => store.selectedSession)
    const userBookingCount = ref(0)
    const halls = ref([])
    const seats = ref([])
    const selectedSeats = ref([])
    const bookingInProgress = ref(false)
    const showSuccessModal = ref(false)
    const showTimeoutModal = ref(false)
    const loading = ref(false)
    const error = ref(null)

    // Таймер (5 минут = 300 секунд)
    const timeLeft = ref(300)
    let timerInterval = null

    // Загрузка данных
    const loadData = async () => {
      try {
        loading.value = true
        error.value = null

        // Загружаем фильм если его нет в store
        if (!film.value) {
          await store.fetchById(filmId)
        }

        // Проверяем что сеанс правильный
        if (!session.value || session.value.id !== sessionId) {
          error.value = 'Сеанс не найден'
          return
        }

        // Загружаем залы
        const hallsResponse = await fetch(`${API_BASE}/halls/`)
        if (hallsResponse.ok) {
          halls.value = await hallsResponse.json()
        }

        // Проверяем лимит бронирований пользователя
        const activeBookingsCount = await checkUserBookingLimit()
        userBookingCount.value = activeBookingsCount
        if (activeBookingsCount >= 5) {
          console.warn('⚠️ У пользователя достигнут лимит бронирований')
        }

        // Загружаем занятые места и генерируем схему
        await loadBookedSeats()
        await generateSeatLayout()

        // Запускаем таймер
        startTimer()
      } catch (err) {
        console.error('Error loading booking data:', err)
        error.value = 'Ошибка загрузки данных'
      } finally {
        loading.value = false
      }
    }

    // Загрузка забронированных мест
    const loadBookedSeats = async () => {
      try {
        console.log('🔄 Loading booked seats for session:', session.value.id)
        const response = await fetch(`${API_BASE}/bookings/${session.value.id}/bookings`)

        if (response.ok) {
          const bookings = await response.json()
          console.log('📊 All bookings for this session:', bookings)

          // ФИЛЬТРУЕМ ТОЛЬКО АКТИВНЫЕ БРОНИРОВАНИЯ
          const activeBookings = bookings.filter((booking) => booking.status === 'active')
          console.log('✅ Active bookings:', activeBookings)

          const bookedSeats = activeBookings.map((booking) => {
            console.log(`Seat ${booking.seat_number} - status: ${booking.status}`)
            return booking.seat_number
          })

          console.log('🎯 Final booked seats array:', bookedSeats)
          return bookedSeats
        } else {
          console.error('❌ Failed to load bookings:', response.status)
          return []
        }
      } catch (err) {
        console.error('💥 Error loading booked seats:', err)
        return []
      }
    }

    // Генерация схемы мест (6 рядов по 8 мест)
    const generateSeatLayout = async () => {
      const bookedSeats = await loadBookedSeats()
      const rows = []

      // Получаем информацию о зале
      const hall = halls.value.find((h) => h.id === session.value.hall_id)
      if (!hall) {
        console.error('❌ Hall not found:', session.value.hall_id)
        return
      }

      const totalSeats = hall.capacity
      console.log('🏟️ Hall capacity:', totalSeats)

      // Определяем количество рядов и мест в ряду
      // Можно сделать адаптивную логику или использовать фиксированную
      const seatsPerRow = 8 // например, 8 мест в ряду
      const rowsCount = Math.ceil(totalSeats / seatsPerRow)

      console.log(`📊 Generating ${rowsCount} rows with ${seatsPerRow} seats each`)

      let seatCounter = 1

      for (let row = 1; row <= rowsCount; row++) {
        const rowSeats = []

        for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
          // Если превысили общее количество мест - останавливаемся
          if (seatCounter > totalSeats) break

          const isOccupied = bookedSeats.includes(seatCounter)

          rowSeats.push({
            rowNumber: row,
            seatNumber: seatNum,
            absoluteNumber: seatCounter,
            status: isOccupied ? 'occupied' : 'available',
          })

          seatCounter++
        }

        // Добавляем ряд только если в нем есть места
        if (rowSeats.length > 0) {
          rows.push({
            rowNumber: row,
            seats: rowSeats,
          })
        }
      }

      console.log('✅ Generated seat layout:', rows)
      seats.value = rows
    }
    // Таймер
    const startTimer = () => {
      timerInterval = setInterval(() => {
        timeLeft.value--

        if (timeLeft.value <= 0) {
          clearInterval(timerInterval)
          showTimeoutModal.value = true
          selectedSeats.value = []
        }
      }, 1000)
    }

    const formatTimeLeft = computed(() => {
      const minutes = Math.floor(timeLeft.value / 60)
      const seconds = timeLeft.value % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    })

    const timeLeftMinutes = computed(() => Math.floor(timeLeft.value / 60))

    // Выбор места
    const toggleSeat = (seat) => {
      if (seat.status === 'occupied') return

      if (seat.status === 'selected') {
        // Убираем из выбранных
        seat.status = 'available'
        selectedSeats.value = selectedSeats.value.filter(
          (s) => !(s.rowNumber === seat.rowNumber && s.seatNumber === seat.seatNumber)
        )
      } else {
        // Добавляем в выбранных
        seat.status = 'selected'
        selectedSeats.value.push({
          rowNumber: seat.rowNumber,
          seatNumber: seat.seatNumber,
          absoluteNumber: seat.absoluteNumber,
        })
      }
    }

    // Создание бронирования
    // Создание бронирования - упрощенная версия
    const createBooking = async () => {
      if (selectedSeats.value.length === 0) return

      bookingInProgress.value = true

      try {
        const token = localStorage.getItem('token')

        if (!token) {
          alert('Пожалуйста, войдите в систему для бронирования')
          router.push('/login')
          return
        }

        // Проверяем лимит бронирований перед отправкой
        const activeBookingsCount = await checkUserBookingLimit()
        if (activeBookingsCount + selectedSeats.value.length > 5) {
          alert(
            `Превышен лимит бронирований! У вас уже ${activeBookingsCount} активных бронирований. Максимум можно иметь 5 одновременно.`
          )
          bookingInProgress.value = false
          return
        }

        // Создаем бронирования для каждого выбранного места
        const bookingPromises = selectedSeats.value.map((seat) =>
          fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              session_id: session.value.id,
              seat_number: seat.absoluteNumber,
            }),
          })
        )

        const results = await Promise.all(bookingPromises)

        // Обрабатываем результаты
        let successCount = 0
        let conflictCount = 0
        let limitExceeded = false

        for (let i = 0; i < results.length; i++) {
          const response = results[i]
          const seat = selectedSeats.value[i]

          if (response.ok) {
            successCount++
            console.log(`✅ Место ${seat.absoluteNumber} успешно забронировано`)
          } else {
            // Получаем текст ошибки для анализа
            let errorText = ''
            try {
              const errorData = await response.json()
              errorText = errorData.detail || ''
            } catch {
              errorText = await response.text()
            }

            console.log(
              `❌ Ошибка для места ${seat.absoluteNumber}:`,
              errorText,
              `Status: ${response.status}`
            )

            if (response.status === 409) {
              // Анализируем текст ошибки чтобы понять настоящую причину
              if (
                errorText.includes('cannot have more than 5 active bookings') ||
                (errorText.includes('User') && errorText.includes('cannot have more than'))
              ) {
                limitExceeded = true
                console.log(`⚠️ Превышен лимит бронирований для места ${seat.absoluteNumber}`)
              } else if (
                errorText.includes('Seat') &&
                (errorText.includes('already booked') || errorText.includes('is already booked'))
              ) {
                conflictCount++
                console.log(`🚫 Место ${seat.absoluteNumber} уже занято`)
              } else {
                // Другие конфликты
                conflictCount++
                console.log(
                  `⚠️ Другая ошибка конфликта для места ${seat.absoluteNumber}:`,
                  errorText
                )
              }
            } else if (response.status === 401) {
              localStorage.removeItem('token')
              alert('Сессия истекла. Пожалуйста, войдите снова.')
              router.push('/login')
              bookingInProgress.value = false
              return
            } else {
              console.log(
                `🔥 Неизвестная ошибка для места ${seat.absoluteNumber}:`,
                response.status,
                errorText
              )
            }
          }
        }

        // Обрабатываем итоговые результаты
        if (limitExceeded) {
          alert(
            'Превышен лимит активных бронирований! Максимум 5 бронирований одновременно. Отмените предыдущие бронирования чтобы создать новые.'
          )
          // Обновляем информацию о бронированиях пользователя
          await loadBookedSeats()
          await generateSeatLayout()
        } else if (successCount > 0) {
          // Хотя бы одно бронирование прошло успешно
          showSuccessModal.value = true
          clearInterval(timerInterval)

          // Обновляем схему мест
          await loadBookedSeats()
          await generateSeatLayout()

          if (conflictCount > 0) {
            // Показываем сообщение о частичном успехе
            alert(
              `Успешно забронировано ${successCount} мест. ${conflictCount} мест уже были заняты или возникли ошибки.`
            )
          }
        } else if (conflictCount > 0) {
          // Все выбранные места уже заняты
          alert(
            'Все выбранные места уже заняты или возникли ошибки. Пожалуйста, выберите другие места.'
          )
          // Обновляем схему чтобы показать актуальные занятые места
          await loadBookedSeats()
          await generateSeatLayout()
        } else {
          throw new Error('Все бронирования провалились по неизвестной причине')
        }
      } catch (err) {
        console.error('💥 Booking error:', err)
        alert('Ошибка при бронировании. Попробуйте снова.')
      } finally {
        bookingInProgress.value = false
      }
    }

    const checkUserBookingLimit = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return 0

        const response = await fetch(`${API_BASE}/bookings/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const userBookings = await response.json()

          // ФИЛЬТРУЕМ ТОЛЬКО АКТИВНЫЕ БРОНИРОВАНИЯ
          const activeBookings = userBookings.filter(
            (booking) => booking.status === 'active' // ТОЛЬКО активные
          )

          console.log(
            `📊 У пользователя ${activeBookings.length} активных бронирований из ${userBookings.length} всего`
          )
          console.log(
            '📋 Активные бронирования:',
            activeBookings.map((b) => ({ id: b.booking_id, status: b.status }))
          )

          return activeBookings.length
        }
        return 0
      } catch (err) {
        console.error('❌ Error checking user bookings:', err)
        return 0
      }
    }

    // Вспомогательные функции
    const getHallName = (hallId) => {
      const hall = halls.value.find((h) => h.id === hallId)
      return hall ? hall.name : `Зал ${hallId}`
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    }

    const formatTime = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const totalPrice = computed(() => {
      if (!session.value || selectedSeats.value.length === 0) return '0.00'
      return (selectedSeats.value.length * session.value.price).toFixed(2)
    })

    const closeModal = () => {
      showSuccessModal.value = false
      // Очищаем выбранный сеанс
      store.clearSelectedSession()
      router.push('/')
    }

    const redirectToFilm = () => {
      showTimeoutModal.value = false
      router.go(-1)
    }

    const seatRows = computed(() => seats.value)

    onMounted(() => {
      if (filmId && sessionId) {
        loadData()
      } else {
        error.value = 'Неверные параметры бронирования'
      }
    })

    onUnmounted(() => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    })

    return {
      film,
      session,
      seatRows,
      selectedSeats,
      bookingInProgress,
      showSuccessModal,
      showTimeoutModal,
      loading,
      error,
      formatTimeLeft,
      timeLeftMinutes,
      formatDate,
      formatTime,
      getHallName,
      toggleSeat,
      createBooking,
      closeModal,
      redirectToFilm,
      totalPrice,
    }
  },
}
</script>

<style scoped>
.booking-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%);
  color: white;
}

.booking-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.film-header {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.film-poster {
  width: 120px;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.film-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-poster {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.1);
}

.film-info {
  flex: 1;
}

.film-info h1 {
  font-size: 2rem;
  margin: 0 0 10px 0;
  background: linear-gradient(135deg, #fff, #a8b1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.film-genre {
  color: #a8b1ff;
  font-size: 1.1rem;
  margin: 0 0 20px 0;
}

.session-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.session-date,
.session-time,
.session-hall {
  padding: 8px 16px;
  background: rgba(168, 177, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(168, 177, 255, 0.3);
}

.booking-main {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 40px;
}

.hall-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.screen {
  text-align: center;
  padding: 20px;
  margin-bottom: 40px;
  background: linear-gradient(180deg, #2d2d5a, #1a1a3e);
  border-radius: 8px;
  border: 2px solid #a8b1ff;
  color: #a8b1ff;
  font-weight: bold;
  font-size: 1.2rem;
}

.seats-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
}

.seat-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.row-number {
  width: 30px;
  text-align: center;
  color: #a8b1ff;
  font-weight: bold;
}

.seat {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.seat.available {
  background: rgba(78, 205, 196, 0.2);
  border-color: #4ecdc4;
  color: #4ecdc4;
}

.seat.available:hover {
  background: rgba(78, 205, 196, 0.4);
  transform: scale(1.1);
}

.seat.occupied {
  background: rgba(255, 107, 107, 0.2);
  border-color: #ff6b6b;
  color: #ff6b6b;
  cursor: not-allowed;
}

.seat.selected {
  background: rgba(255, 215, 0, 0.3);
  border-color: #ffd700;
  color: #ffd700;
  transform: scale(1.1);
}

.legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.seat-sample {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid;
}

.seat-sample.available {
  background: rgba(78, 205, 196, 0.2);
  border-color: #4ecdc4;
}

.seat-sample.occupied {
  background: rgba(255, 107, 107, 0.2);
  border-color: #ff6b6b;
}

.seat-sample.selected {
  background: rgba(255, 215, 0, 0.3);
  border-color: #ffd700;
}

.booking-sidebar {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: fit-content;
  position: sticky;
  top: 20px;
}

.timer {
  padding: 15px;
  background: rgba(78, 205, 196, 0.1);
  border: 2px solid #4ecdc4;
  border-radius: 12px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 25px;
}

.timer.warning {
  background: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.selected-seats {
  margin-bottom: 25px;
}

.selected-seats h3 {
  margin: 0 0 15px 0;
  color: #a8b1ff;
}

.no-seats {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  text-align: center;
  padding: 20px;
}

.selected-seat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.seat-price {
  color: #ffd700;
  font-weight: bold;
}

.booking-summary {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 20px;
}

.total-price {
  font-size: 1.3rem;
  text-align: center;
  margin-bottom: 20px;
  color: #ffd700;
}

.buy-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.buy-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.buy-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
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
  background: linear-gradient(135deg, #1a1a3e, #2d2d5a);
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  border: 2px solid #a8b1ff;
  max-width: 400px;
  width: 90%;
}

.modal-content h2 {
  margin: 0 0 15px 0;
  color: #ffd700;
}

.modal-content p {
  margin: 0 0 25px 0;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
}

.modal-btn {
  padding: 12px 30px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

@media (max-width: 1024px) {
  .booking-main {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .booking-sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .booking-content {
    padding: 15px;
  }

  .film-header {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .film-poster {
    align-self: center;
  }

  .session-info {
    justify-content: center;
  }

  .seats-grid {
    transform: scale(0.9);
  }

  .legend {
    flex-direction: column;
    gap: 15px;
    align-items: center;
  }
}
.loading,
.error {
  text-align: center;
  padding: 80px 20px;
  font-size: 1.2rem;
  color: #a8b1ff;
}

.error {
  color: #ff6b6b;
}
</style>
