<template>
  <div class="admin-container">
    <Navbar />
    
    <div class="admin-content">
      <!-- Заголовок с иконкой -->
      <div class="admin-header">
        <div class="header-left">
          <div class="header-icon">🎬</div>
          <div>
            <h1>Управление фильмами</h1>
            <p class="header-subtitle">Добавление и управление фильмами в системе</p>
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
          <div class="stat-icon total">📊</div>
          <div class="stat-info">
            <h3>{{ films.length }}</h3>
            <p>Всего фильмов</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon popular">🔥</div>
          <div class="stat-info">
            <h3>{{ highRatedFilms.length }}</h3>
            <p>Высокий рейтинг (8+)</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active">✅</div>
          <div class="stat-info">
            <h3>{{ activeFilms.length }}</h3>
            <p>Активные фильмы</p>
          </div>
        </div>
        
      </div>

      <!-- Панель действий -->
      <div class="action-panel">
        <button @click="openAddForm" class="add-btn">
          <span class="btn-icon">+</span>
          Добавить фильм
        </button>
        
        <div class="filter-controls">
          <div class="search-box">
            <input 
              v-model="searchQuery" 
              placeholder="Поиск фильмов..." 
              class="search-input"
            >
            <span class="search-icon">🔍</span>
          </div>
          
          <select v-model="genreFilter" class="genre-filter">
            <option value="">Все жанры</option>
            <option v-for="genre in uniqueGenres" :key="genre" :value="genre">
              {{ genre }}
            </option>
          </select>

          <select v-model="statusFilter" class="status-filter">
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
        </div>
      </div>

      <!-- Форма добавления/редактирования фильма -->
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ isEditing ? '✏️ Редактировать фильм' : '🎬 Добавить новый фильм' }}</h3>
            <button class="close-btn" @click="closeModal">×</button>
          </div>
          
          <form @submit.prevent="isEditing ? updateFilm() : addFilm()" class="film-form">
            <div class="form-grid">
              <div class="form-group">
                <label>Название фильма *</label>
                <input 
                  v-model="currentFilm.title" 
                  placeholder="Введите название"
                  required
                >
              </div>
              
              <div class="form-group">
                <label>Жанр *</label>
                <select v-model="currentFilm.genre" required class="genre-select">
                  <option value="">Выберите жанр</option>
                  <option v-for="genre in popularGenres" :key="genre" :value="genre">
                    {{ genre }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Длительность (мин) *</label>
                <input 
                  v-model="currentFilm.duration" 
                  type="number" 
                  placeholder="120"
                  min="1"
                  max="500"
                  required
                >
              </div>
              
              <div class="form-group">
                <label>Рейтинг *</label>
                <div class="rating-input-container">
                  <input 
                    v-model="currentFilm.rating" 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="8.5"
                    required
                    class="rating-input"
                  >
                  <div class="rating-visual">
                    <div class="rating-stars">
                      <span 
                        v-for="star in 10" 
                        :key="star"
                        class="star"
                        :class="{ active: star <= Math.round(currentFilm.rating) }"
                        @click="currentFilm.rating = star"
                      >★</span>
                    </div>
                    <span class="rating-value">{{ currentFilm.rating }}/10</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-group full-width">
              <label>Описание фильма</label>
              <textarea 
                v-model="currentFilm.description" 
                placeholder="Опишите сюжет фильма..."
                rows="4"
              ></textarea>
              <div class="char-counter" :class="{ warning: descriptionLength > 490 }">
                {{ descriptionLength }}/500
              </div>
            </div>

            <!-- Загрузка изображения -->
            <div class="form-group full-width">
              <label>Постер фильма</label>
              <div 
                class="image-upload-area"
                @click="triggerFileInput"
                @drop="handleDrop"
                @dragover.prevent
                @dragenter.prevent
              >
                <div v-if="!imagePreview && !currentFilm.image_url" class="upload-placeholder">
                  <span class="upload-icon">🖼️</span>
                  <p>Перетащите сюда изображение или нажмите для выбора</p>
                  <small>Поддерживаются JPG, PNG, WebP (макс. 5MB)</small>
                </div>
                <div v-else class="image-preview">
                  <img :src="imagePreview || currentFilm.image_url" alt="Preview" class="preview-image">
                  <button type="button" @click.stop="removeImage" class="remove-image-btn">
                    ×
                  </button>
                </div>
                <input 
                  ref="fileInput"
                  type="file" 
                  @change="handleImageUpload"
                  accept="image/jpeg,image/png,image/webp"
                  class="file-input"
                >
              </div>
            </div>

            <div class="form-group full-width" v-if="isEditing">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="currentFilm.is_active"
                  class="checkbox-input"
                >
                <span class="checkmark"></span>
                Активный фильм (отображается в расписании)
              </label>
            </div>

            <div class="form-actions">
              <button 
                type="button" 
                @click="closeModal" 
                class="cancel-btn"
              >
                Отмена
              </button>
              <button 
                type="submit" 
                :disabled="loading || !isFormValid" 
                class="submit-btn"
              >
                <span v-if="loading" class="btn-spinner"></span>
                {{ loading ? 'Сохранение...' : (isEditing ? 'Обновить' : 'Добавить фильм') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Список фильмов -->
      <div class="films-section">
        <div v-if="loading && films.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка фильмов...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Ошибка загрузки</h3>
          <p>{{ error }}</p>
          <button @click="loadFilms" class="retry-btn">
            Попробовать снова
          </button>
        </div>

        <div v-else-if="filteredFilms.length === 0" class="empty-state">
          <div class="empty-icon">🎭</div>
          <h3>Фильмы не найдены</h3>
          <p>{{ hasActiveFilters ? 'Попробуйте изменить фильтры' : 'Добавьте первый фильм в систему' }}</p>
          <button v-if="!hasActiveFilters" @click="openAddForm" class="add-first-btn">
            Добавить фильм
          </button>
        </div>

        <div v-else class="films-grid">
          <div 
            v-for="film in filteredFilms" 
            :key="film.id" 
            class="film-card"
            :class="{ inactive: !film.is_active }"
          >
            <!-- Изображение фильма -->
            <div class="film-image">
              <img 
                v-if="film.image_url" 
                :src="film.image_url" 
                :alt="film.title"
                class="poster-image"
              >
              <div v-else class="poster-placeholder">
                <span class="placeholder-icon">🎬</span>
              </div>
              <div class="film-overlay">
                <div class="film-rating">
                  <span class="rating-star">⭐</span>
                  {{ film.rating }}
                </div>
                <div class="film-status" :class="film.is_active ? 'active' : 'inactive'">
                  {{ film.is_active ? 'Активен' : 'Неактивен' }}
                </div>
              </div>
            </div>

            <!-- Информация о фильме -->
            <div class="card-body">
              <h3 class="film-title">{{ film.title }}</h3>
              <div class="film-genre">
                <span class="genre-badge">{{ film.genre }}</span>
              </div>
              
              <p class="film-description" v-if="film.description">
                {{ truncateDescription(film.description) }}
              </p>
              
              <div class="film-meta">
                <div class="meta-item">
                  <span class="meta-icon">⏱️</span>
                  <span>{{ film.duration }} мин</span>
                </div>
                <div class="meta-item">
                  <span class="meta-icon">🆔</span>
                  <span>ID: {{ film.id }}</span>
                </div>
              </div>
            </div>

            <!-- Действия -->
            <div class="card-actions">
              <button 
                @click="viewSessions(film.id)"
                class="action-btn sessions"
                title="Посмотреть сеансы"
              >
                <span class="btn-icon">🎫</span>
                Сеансы
              </button>
              <button 
                @click="editFilm(film)"
                class="action-btn edit"
                title="Редактировать"
              >
                <span class="btn-icon">✏️</span>
                Изменить
              </button>
              <button 
                @click="toggleFilmStatus(film)"
                class="action-btn status"
                :title="film.is_active ? 'Деактивировать' : 'Активировать'"
              >
                <span class="btn-icon">{{ film.is_active ? '⏸️' : '▶️' }}</span>
                {{ film.is_active ? 'Скрыть' : 'Показать' }}
              </button>
              <button 
                @click="deleteFilm(film.id)"
                class="action-btn delete"
                :disabled="deletingFilm === film.id"
                title="Удалить фильм"
              >
                <span class="btn-icon">🗑️</span>
                {{ deletingFilm === film.id ? '...' : '' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Layout/Navbar.vue'

export default {
  name: 'AdminFilms',
  components: {
    Navbar
  },
  setup() {
    const router = useRouter()
    const films = ref([])
    const loading = ref(false)
    const error = ref('')
    const showModal = ref(false)
    const isEditing = ref(false)
    const searchQuery = ref('')
    const genreFilter = ref('')
    const statusFilter = ref('all')
    const deletingFilm = ref(null)
    const fileInput = ref(null)
    const imagePreview = ref(null)
    const customGenre = ref('')
    
    const popularGenres = [
    "Боевик", "Комедия", "Драма", "Триллер", "Фэнтези",
    "Фантастика", "Ужасы", "Романтика", "Приключения", 
    "Детектив", "Мультфильм", "Документальный", "Исторический",
    "Биография", "Семейный"
]
    const openAddForm = () => {
  isEditing.value = false
  resetForm()
  showModal.value = true
}

    const currentFilm = ref({
      title: '',
      genre: '',
      duration: '',
      rating: '',
      description: '',
      is_active: true
    })

    const loadFilms = async () => {
      loading.value = true
      error.value = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:8000/films/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          films.value = await response.json()
        } else {
          throw new Error('Ошибка загрузки фильмов')
        }
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const addFilm = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    
    // Добавляем текстовые поля
    formData.append('title', currentFilm.value.title)
    formData.append('genre', currentFilm.value.genre === 'other' ? customGenre.value : currentFilm.value.genre)
    formData.append('duration', parseInt(currentFilm.value.duration))
    formData.append('rating', parseFloat(currentFilm.value.rating))
    formData.append('description', currentFilm.value.description || '')
    
    // Добавляем изображение если есть
    if (fileInput.value?.files[0]) {
      formData.append('image', fileInput.value.files[0])
    }

    const response = await fetch('http://localhost:8000/films/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })

    if (response.ok) {
      showModal.value = false
      resetForm()
      await loadFilms()
    } else {
      const errorData = await response.json()
      let errorMessage = errorData.detail || 'Ошибка добавления фильма'
      
      // Перевод ошибок на русский
      if (errorMessage.includes('Rating must be between 0 and 10')) {
        errorMessage = 'Рейтинг должен быть от 0 до 10'
      } else if (errorMessage.includes('Duration must be positive')) {
        errorMessage = 'Продолжительность должна быть положительной'
      } else if (errorMessage.includes('Title is required')) {
        errorMessage = 'Название фильма обязательно'
      } else if (errorMessage.includes('Genre is required')) {
        errorMessage = 'Жанр фильма обязателен'
      } else if (errorMessage.includes('already exists')) {
        errorMessage = 'Фильм с таким названием уже существует'
      } else if (errorMessage.includes('rating') && errorMessage.includes('between')) {
        errorMessage = 'Рейтинг должен быть от 0 до 10'
      } else if (errorMessage.includes('duration') && errorMessage.includes('positive')) {
        errorMessage = 'Продолжительность должна быть положительной'
      } else if (errorMessage.includes('Unsupported image type') || response.status === 415) {
    errorMessage = 'Неподдерживаемый формат изображения. Используйте JPG, PNG или WebP.'
  }
      
      error.value = errorMessage
    }
  } catch (err) {
    let errorMessage = err.message || 'Ошибка добавления фильма'
    
    // Перевод сетевых ошибок
    if (errorMessage.includes('Failed to fetch')) {
      errorMessage = 'Ошибка соединения с сервером'
    }
    
    error.value = errorMessage
  } finally {
    loading.value = false
  }
}

    const updateFilm = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    
    formData.append('title', currentFilm.value.title)
    formData.append('genre', currentFilm.value.genre === 'other' ? customGenre.value : currentFilm.value.genre)
    formData.append('duration', parseInt(currentFilm.value.duration))
    formData.append('rating', parseFloat(currentFilm.value.rating))
    formData.append('description', currentFilm.value.description || '')
    formData.append('is_active', currentFilm.value.is_active.toString())
    
    // ⭐ ДОБАВЛЯЕМ ФЛАГ УДАЛЕНИЯ ИЗОБРАЖЕНИЯ С ПРОВЕРКОЙ
    const shouldRemoveImage = currentFilm.value.shouldRemoveImage || false
    formData.append('remove_image', shouldRemoveImage.toString())
    
    // Если загружаем новое изображение
    if (fileInput.value?.files[0]) {
      formData.append('image', fileInput.value.files[0])
    }

    console.log('Обновление фильма:', {
      title: currentFilm.value.title,
      removeImage: shouldRemoveImage,
      hasNewImage: !!fileInput.value?.files[0]
    })

    const response = await fetch(`http://localhost:8000/films/${currentFilm.value.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })

    if (response.ok) {
      showModal.value = false
      resetForm()
      await loadFilms()
    } else {
      const errorData = await response.json()
      let errorMessage = errorData.detail || 'Ошибка обновления фильма'
      
      // Перевод ошибок на русский
      if (errorMessage.includes('Rating must be between 0 and 10')) {
        errorMessage = 'Рейтинг должен быть от 0 до 10'
      } else if (errorMessage.includes('Duration must be positive')) {
        errorMessage = 'Продолжительность должна быть положительной'
      } else if (errorMessage.includes('Title is required')) {
        errorMessage = 'Название фильма обязательно'
      } else if (errorMessage.includes('Genre is required')) {
        errorMessage = 'Жанр фильма обязателен'
      } else if (errorMessage.includes('already exists')) {
        errorMessage = 'Фильм с таким названием уже существует'
      } else if (errorMessage.includes('rating') && errorMessage.includes('between')) {
        errorMessage = 'Рейтинг должен быть от 0 до 10'
      } else if (errorMessage.includes('duration') && errorMessage.includes('positive')) {
        errorMessage = 'Продолжительность должна быть положительной'
      } else if (errorMessage.includes('Unsupported image type') || response.status === 415) {
    errorMessage = 'Неподдерживаемый формат изображения. Используйте JPG, PNG или WebP.'
  }
      
      error.value = errorMessage
    }
  } catch (err) {
    let errorMessage = err.message || 'Ошибка обновления фильма'
    
    if (errorMessage.includes('Failed to fetch')) {
      errorMessage = 'Ошибка соединения с сервером'
    }
    
    error.value = errorMessage
  } finally {
    loading.value = false
  }
}

    const deleteFilm = async (filmId) => {
      if (!confirm('Вы уверены, что хотите удалить этот фильм? Все связанные сеансы также будут удалены.')) return
      
      deletingFilm.value = filmId
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:8000/films/${filmId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          await loadFilms()
        } else {
          throw new Error('Ошибка удаления фильма')
        }
      } catch (err) {
        error.value = err.message
      } finally {
        deletingFilm.value = null
      }
    }

    const toggleFilmStatus = async (film) => {
      try {
        const token = localStorage.getItem('token')
        const formData = new FormData()
        formData.append('title', film.title)
        formData.append('genre', film.genre)
        formData.append('duration', film.duration)
        formData.append('rating', film.rating)
        formData.append('description', film.description || '')
        formData.append('is_active', (!film.is_active).toString())

        const response = await fetch(`http://localhost:8000/films/${film.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        })

        if (response.ok) {
          await loadFilms()
        } else {
          throw new Error('Ошибка обновления статуса фильма')
        }
      } catch (err) {
        error.value = err.message
      }
    }

    const editFilm = (film) => {
  isEditing.value = true
  currentFilm.value = { 
    ...film,
    shouldRemoveImage: false // ⭐ СБРАСЫВАЕМ ПРИ РЕДАКТИРОВАНИИ
  }
  imagePreview.value = null
  customGenre.value = popularGenres.includes(film.genre) ? '' : film.genre
  currentFilm.value.genre = popularGenres.includes(film.genre) ? film.genre : 'other'
  showModal.value = true
}

    const viewSessions = (filmId) => {
      router.push(`/admin/sessions?film=${filmId}`)
    }

    const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Проверка размера файла
    if (file.size > 5 * 1024 * 1024) {
      error.value = 'Файл слишком большой. Максимальный размер: 5MB'
      fileInput.value.value = ''
      return
    }
    
    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      error.value = 'Неподдерживаемый формат изображения. Используйте JPG, PNG или WebP.'
      fileInput.value.value = ''
      return
    }
    
    // Проверка расширения файла (дополнительная проверка)
    const fileName = file.name.toLowerCase()
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
    
    if (!hasValidExtension) {
      error.value = 'Неподдерживаемый формат файла. Используйте JPG, PNG или WebP.'
      fileInput.value.value = ''
      return
    }
    
    // Если все проверки пройдены, загружаем превью
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
      error.value = '' // Очищаем ошибку при успешной загрузке
    }
    reader.onerror = () => {
      error.value = 'Ошибка чтения файла'
      fileInput.value.value = ''
    }
    reader.readAsDataURL(file)
  }
}

    const handleDrop = (event) => {
  event.preventDefault()
  const files = event.dataTransfer.files
  if (files.length > 0) {
    fileInput.value.files = files
    handleImageUpload({ target: fileInput.value })
  }
}

    const triggerFileInput = () => {
      fileInput.value?.click()
    }

    const removeImage = () => {
  imagePreview.value = null
  fileInput.value.value = ''
  currentFilm.value.image_url = null
  // ⭐ УБЕДИТЕСЬ ЧТО СВОЙСТВО СУЩЕСТВУЕТ
  if (!currentFilm.value.hasOwnProperty('shouldRemoveImage')) {
    currentFilm.value.shouldRemoveImage = true
  } else {
    currentFilm.value.shouldRemoveImage = true
  }
  console.log('Изображение помечено для удаления')
}
    const resetForm = () => {
  currentFilm.value = {
    title: '',
    genre: '',
    duration: '',
    rating: '',
    description: '',
    is_active: true,
    shouldRemoveImage: false // ⭐ СБРАСЫВАЕМ ФЛАГ
  }
  imagePreview.value = null
  customGenre.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  isEditing.value = false
}

    const closeModal = () => {
      showModal.value = false
      resetForm()
    }

    const truncateDescription = (text, length = 120) => {
      if (!text) return ''
      return text.length > length ? text.substring(0, length) + '...' : text
    }

    // Computed свойства
    const highRatedFilms = computed(() => 
      films.value.filter(film => film.rating >= 8)
    )

    const activeFilms = computed(() => 
      films.value.filter(film => film.is_active)
    )

    const uniqueGenres = computed(() => {
      const genres = films.value.map(film => film.genre)
      return [...new Set(genres)].sort()
    })

    const descriptionLength = computed(() => {
      return currentFilm.value.description?.length || 0
    })

    const isFormValid = computed(() => {
      return currentFilm.value.title && 
             currentFilm.value.genre && 
             currentFilm.value.duration && 
             currentFilm.value.rating &&
             (currentFilm.value.genre !== 'other' || customGenre.value)
    })

    const hasActiveFilters = computed(() => {
      return searchQuery.value || genreFilter.value || statusFilter.value !== 'all'
    })

    const filteredFilms = computed(() => {
      let filtered = films.value

      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(film => 
          film.title.toLowerCase().includes(query) ||
          film.genre.toLowerCase().includes(query) ||
          (film.description && film.description.toLowerCase().includes(query))
        )
      }

      if (genreFilter.value) {
        filtered = filtered.filter(film => film.genre === genreFilter.value)
      }

      if (statusFilter.value !== 'all') {
        filtered = filtered.filter(film => 
          statusFilter.value === 'active' ? film.is_active : !film.is_active
        )
      }

      return filtered
    })

    // Watchers
    watch(() => currentFilm.value.genre, (newGenre) => {
      if (newGenre !== 'other') {
        customGenre.value = ''
      }
    })

    onMounted(() => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      if (userInfo.role !== 'admin') {
        router.push('/home')
        return
      }
      loadFilms()
    })

    return {
      films,
      loading,
      error,
      showModal,
      isEditing,
      openAddForm,
      searchQuery,
      genreFilter,
      statusFilter,
      deletingFilm,
      fileInput,
      imagePreview,
      customGenre,
      popularGenres,
      currentFilm,
      highRatedFilms,
      activeFilms,
      uniqueGenres,
      descriptionLength,
      isFormValid,
      hasActiveFilters,
      filteredFilms,
      loadFilms,
      addFilm,
      updateFilm,
      deleteFilm,
      toggleFilmStatus,
      editFilm,
      viewSessions,
      handleImageUpload,
      handleDrop,
      triggerFileInput,
      removeImage,
      closeModal,
      truncateDescription
    }
  }
}
</script>

<style scoped>
/* Основные стили контейнера */
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

/* Заголовок */
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

/* Статистика */
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

/* Панель действий */
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
  align-items: center;
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

.genre-filter,
.status-filter {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  min-width: 140px;
  cursor: pointer;
}

/* Модальное окно */
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
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
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

/* Форма */
.film-form {
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

.form-group input,
.form-group textarea,
.form-group select {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #a8b1ff;
  background: rgba(255, 255, 255, 0.08);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

/* Рейтинг */
.rating-input-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rating-visual {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 1.2rem;
  color: #4b5563;
  cursor: pointer;
  transition: color 0.2s ease;
}

.star.active {
  color: #fbbf24;
}

.star:hover {
  color: #fbbf24;
}

.rating-value {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-weight: 600;
}

/* Загрузка изображения */
.image-upload-area {
  position: relative;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-upload-area:hover {
  border-color: #a8b1ff;
  background: rgba(255, 255, 255, 0.05);
}

.upload-placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.upload-icon {
  font-size: 2rem;
  margin-bottom: 8px;
  display: block;
}

.image-preview {
  position: relative;
  max-width: 200px;
  max-height: 200px;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
}

.remove-image-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-input {
  display: none;
}

/* Чекбокс */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
}

.checkbox-input {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  position: relative;
  transition: all 0.3s ease;
}

.checkbox-input:checked + .checkmark {
  background: #4ade80;
  border-color: #4ade80;
}

.checkbox-input:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  color: white;
  font-size: 14px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Счетчик символов */
.char-counter {
  text-align: right;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
}

.char-counter.warning {
  color: #fbbf24;
}

/* Действия формы */
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Сетка фильмов */
.films-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.film-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.film-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
}

.film-card.inactive {
  opacity: 0.7;
}

.film-card.inactive::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(100, 116, 139, 0.1);
  z-index: 1;
  pointer-events: none;
}

/* Изображение фильма */
.film-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.poster-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 3rem;
  opacity: 0.7;
}

.film-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.8) 100%);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 12px;
}

.film-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.7);
  padding: 6px 10px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.film-status {
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.film-status.active {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.film-status.inactive {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
  border: 1px solid rgba(100, 116, 139, 0.3);
}

/* Тело карточки */
.card-body {
  padding: 20px;
}

.film-title {
  font-size: 1.3rem;
  margin: 0 0 12px 0;
  color: white;
  line-height: 1.3;
}

.film-genre {
  margin-bottom: 12px;
}

.genre-badge {
  background: rgba(168, 177, 255, 0.2);
  color: #a8b1ff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.film-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 16px;
}

.film-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

/* Действия карточки */
.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 0 20px 20px 20px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.sessions {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.action-btn.edit {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.action-btn.status {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
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

/* Состояния загрузки и ошибок */
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

/* Адаптивность */
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

  .search-input {
    width: 100%;
  }

  .genre-filter,
  .status-filter {
    min-width: auto;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .films-grid {
    grid-template-columns: 1fr;
  }

  .card-actions {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 20px;
    max-height: calc(100vh - 40px);
  }

  .film-overlay {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .admin-content {
    padding: 20px 15px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .film-form {
    padding: 20px;
  }
}
/* Стили для селектов и их опций */
.genre-filter,
.status-filter,
.genre-select {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  min-width: 140px;
  cursor: pointer;
  appearance: none; /* Убираем стандартный стиль браузера */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23a8b1ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
}

/* Стили для опций в селектах */
.genre-filter option,
.status-filter option,
.genre-select option {
  background: #1a1a3e;
  color: white;
  padding: 10px;
  border: none;
}

/* Стили при фокусе */
.genre-filter:focus,
.status-filter:focus,
.genre-select:focus {
  outline: none;
  border-color: #a8b1ff;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 2px rgba(168, 177, 255, 0.2);
}
</style>