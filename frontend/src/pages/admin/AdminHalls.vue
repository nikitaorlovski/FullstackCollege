<template>
  <div class="admin-container">
    <Navbar />

    <div class="admin-content">
      <!-- Заголовок с иконкой -->
      <div class="admin-header">
        <div class="header-left">
          <div class="header-icon">🎭</div>
          <div>
            <h1>Управление залами</h1>
            <p class="header-subtitle">Добавление и управление кинозалами в системе</p>
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
          <div class="stat-icon total">🏛️</div>
          <div class="stat-info">
            <h3>{{ halls.length }}</h3>
            <p>Всего залов</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon capacity">💺</div>
          <div class="stat-info">
            <h3>{{ totalCapacity }}</h3>
            <p>Общая вместимость</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon average">📊</div>
          <div class="stat-info">
            <h3>{{ averageCapacity }}</h3>
            <p>Средняя вместимость</p>
          </div>
        </div>
      </div>

      <!-- Панель действий -->
      <div class="action-panel">
        <button @click="showAddForm = true" class="add-btn">
          <span class="btn-icon">+</span>
          Добавить зал
        </button>

        <div class="search-box">
          <input v-model="searchQuery" placeholder="Поиск залов..." class="search-input" />
          <span class="search-icon">🔍</span>
        </div>
      </div>

      <!-- Форма добавления зала -->
      <div v-if="showAddForm" class="modal-overlay" @click="showAddForm = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>🎭 Добавить новый зал</h3>
            <button class="close-btn" @click="showAddForm = false">×</button>
          </div>

          <form @submit.prevent="addHall" class="hall-form">
            <div class="form-grid">
              <div class="form-group">
                <label>Название зала *</label>
                <input
                  v-model="newHall.name"
                  placeholder="Например: Красный зал, IMAX, VIP..."
                  required
                />
              </div>

              <div class="form-group">
                <label>Вместимость (мест) *</label>
                <input
                  v-model="newHall.capacity"
                  type="number"
                  placeholder="100"
                  min="10"
                  max="500"
                  required
                />
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="showAddForm = false" class="cancel-btn">Отмена</button>
              <button type="submit" :disabled="loading || !isFormValid" class="submit-btn">
                {{ loading ? 'Добавление...' : 'Добавить зал' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Список залов -->
      <div class="halls-section">
        <div v-if="loading && halls.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка залов...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Ошибка загрузки</h3>
          <p>{{ error }}</p>
          <button @click="loadHalls" class="retry-btn">Попробовать снова</button>
        </div>

        <div v-else-if="filteredHalls.length === 0" class="empty-state">
          <div class="empty-icon">🎭</div>
          <h3>Залы не найдены</h3>
          <p>
            {{
              searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Добавьте первый зал в систему'
            }}
          </p>
          <button v-if="!searchQuery" @click="showAddForm = true" class="add-first-btn">
            Добавить зал
          </button>
        </div>

        <div v-else class="halls-grid">
          <div v-for="hall in filteredHalls" :key="hall.id" class="hall-card">
            <div class="hall-header">
              <div class="hall-icon">🎭</div>
              <div class="hall-title-section">
                <h3 class="hall-name">{{ hall.name }}</h3>
                <div class="hall-id">ID: {{ hall.id }}</div>
              </div>
            </div>

            <div class="hall-info">
              <div class="capacity-info">
                <div class="capacity-icon">💺</div>
                <div class="capacity-details">
                  <div class="capacity-number">{{ hall.capacity }}</div>
                  <div class="capacity-label">мест</div>
                </div>
              </div>

              <div class="hall-stats">
                <div class="stat-item">
                  <span class="stat-label">Сеансов:</span>
                  <span class="stat-value">{{ hall.total_sessions }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Размер:</span>
                  <span class="stat-value">{{ getHallSize(hall.capacity) }}</span>
                </div>
              </div>
            </div>

            <div class="card-actions">
              <button
                @click="deleteHall(hall.id)"
                class="action-btn delete"
                :disabled="deletingHall === hall.id"
              >
                <span class="btn-icon">🗑️</span>
                {{ deletingHall === hall.id ? '...' : 'Удалить' }}
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
  name: 'AdminHalls',
  components: {
    Navbar,
  },
  setup() {
    const API_BASE = import.meta.env.VITE_API_URL

    if (!API_BASE) {
      console.error('VITE_API_URL is not defined')
    }
    const router = useRouter()
    const halls = ref([])
    const loading = ref(false)
    const error = ref('')
    const showAddForm = ref(false)
    const searchQuery = ref('')
    const deletingHall = ref(null)

    const newHall = ref({
      name: '',
      capacity: '',
    })

    const totalCapacity = computed(() => {
      return halls.value.reduce((sum, hall) => sum + (hall.capacity || 0), 0)
    })
    const averageCapacity = computed(() => {
      return halls.value.length ? Math.round(totalCapacity.value / halls.value.length) : 0
    })

    const isFormValid = computed(() => {
      return newHall.value.name && newHall.value.capacity && newHall.value.capacity >= 10
    })

    const filteredHalls = computed(() => {
      if (!searchQuery.value) return halls.value

      const query = searchQuery.value.toLowerCase()
      return halls.value.filter(
        (hall) =>
          hall.name.toLowerCase().includes(query) || hall.capacity.toString().includes(query)
      )
    })

    const getHallSize = (capacity) => {
      if (capacity < 50) return 'Малый'
      if (capacity < 100) return 'Средний'
      if (capacity < 200) return 'Большой'
      return 'Огромный'
    }

    const loadHalls = async () => {
      loading.value = true
      error.value = ''
      try {
        const token = localStorage.getItem('token')

        const response = await fetch(`${API_BASE}/views/hall-usage`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error('Ошибка загрузки залов')

        // Тут уже приходят залы с total_sessions
        halls.value = await response.json()
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const addHall = async () => {
      loading.value = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE}/halls/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newHall.value.name,
            capacity: parseInt(newHall.value.capacity),
          }),
        })

        if (response.ok) {
          showAddForm.value = false
          newHall.value = { name: '', capacity: '' }
          await loadHalls()
        } else {
          const errorData = await response.json()
          let errorMessage = errorData.detail || 'Ошибка добавления зала'

          // Перевод ошибок на русский
          if (errorMessage.includes('already exists')) {
            errorMessage = 'Зал с таким названием уже существует'
          } else if (errorMessage.includes('Capacity must be positive')) {
            errorMessage = 'Вместимость зала должна быть положительной'
          } else if (errorMessage.includes('Hall name is required')) {
            errorMessage = 'Название зала обязательно'
          } else if (errorMessage.includes('capacity') && errorMessage.includes('positive')) {
            errorMessage = 'Вместимость зала должна быть положительной'
          } else if (errorMessage.includes('name') && errorMessage.includes('required')) {
            errorMessage = 'Название зала обязательно'
          }

          error.value = errorMessage
        }
      } catch (err) {
        let errorMessage = err.message || 'Ошибка добавления зала'

        // Перевод сетевых ошибок
        if (errorMessage.includes('Failed to fetch')) {
          errorMessage = 'Ошибка соединения с сервером'
        }

        error.value = errorMessage
      } finally {
        loading.value = false
      }
    }

    const deleteHall = async (hallId) => {
      if (
        !confirm(
          'Вы уверены, что хотите удалить этот зал? Все связанные сеансы также будут удалены.'
        )
      )
        return

      deletingHall.value = hallId
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE}/halls/${hallId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          await loadHalls()
        } else {
          const errorData = await response.json()
          let errorMessage = errorData.detail || 'Ошибка удаления зала'

          // Перевод ошибок на русский для удаления
          if (errorMessage.includes('future sessions')) {
            errorMessage = 'Нельзя удалить зал с будущими сеансами'
          } else if (errorMessage.includes('not found')) {
            errorMessage = 'Зал не найден'
          }

          error.value = errorMessage
        }
      } catch (err) {
        let errorMessage = err.message || 'Ошибка удаления зала'

        if (errorMessage.includes('Failed to fetch')) {
          errorMessage = 'Ошибка соединения с сервером'
        }

        error.value = errorMessage
      } finally {
        deletingHall.value = null
      }
    }

    onMounted(() => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      if (userInfo.role !== 'admin') {
        router.push('/home')
        return
      }
      loadHalls()
    })

    return {
      halls,
      loading,
      error,
      showAddForm,
      newHall,
      searchQuery,
      deletingHall,
      totalCapacity,
      averageCapacity,
      isFormValid,
      filteredHalls,
      loadHalls,
      addHall,
      deleteHall,
      getHallSize,
    }
  },
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

.search-box {
  position: relative;
}

.search-input {
  padding: 12px 16px 12px 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  width: 250px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
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
  padding: 20px;
}

.modal-content {
  background: linear-gradient(135deg, #1a1a3e, #0c0c1d);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 0;
  max-width: 500px;
  width: 100%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: white;
}

.hall-form {
  padding: 30px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.form-group input {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #a8b1ff;
  background: rgba(255, 255, 255, 0.08);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.submit-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.halls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.hall-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.hall-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
}

.hall-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.hall-icon {
  font-size: 2.5rem;
  padding: 12px;
  background: rgba(168, 177, 255, 0.1);
  border-radius: 12px;
}

.hall-title-section {
  flex: 1;
}

.hall-name {
  font-size: 1.4rem;
  margin: 0 0 4px 0;
  color: white;
}

.hall-id {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
}

.hall-info {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.capacity-info {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.capacity-icon {
  font-size: 1.8rem;
}

.capacity-details {
  text-align: center;
}

.capacity-number {
  font-size: 1.8rem;
  font-weight: bold;
  color: #a8b1ff;
  line-height: 1;
}

.capacity-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}

.hall-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.stat-value {
  color: #a8b1ff;
  font-weight: 600;
  font-size: 0.9rem;
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

  .search-input {
    width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .halls-grid {
    grid-template-columns: 1fr;
  }

  .hall-info {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 20px;
  }
}

@media (max-width: 480px) {
  .admin-content {
    padding: 20px 15px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .hall-form {
    padding: 20px;
  }
}
</style>
