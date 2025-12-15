<template>
  <div class="home-container">
    <Navbar />
    <div class="home-content">
      <div class="header-section">
        <div class="header-top">
          <h1 class="page-title">Новинки проката</h1>

          <!-- Контейнер со скроллом для многих категорий -->
          <div class="categories-scroll-container">
            <div class="categories-underlined">
              <div
                v-for="category in categories"
                :key="category"
                class="category-underlined"
                :class="{ active: selectedCategory === category }"
                @click="selectCategory(category)"
              >
                {{ category }}
              </div>
            </div>
          </div>

          <div class="search-section">
            <div class="search-input-container">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Поиск по названию или жанру..."
                class="search-input"
              />
              <span class="search-icon">🔍</span>
            </div>
          </div>
        </div>
      </div>

      <main class="main-content">
        <FilmGrid :films="filteredFilms" />
      </main>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import Navbar from '@/components/Layout/Navbar.vue'
import FilmGrid from '@/components/Films/FilmGrid.vue'
import axios from 'axios'

export default {
  name: 'Home',
  components: {
    Navbar,
    FilmGrid,
  },
  setup() {
    const films = ref([])
    const loading = ref(true)
    const selectedCategory = ref('Все')
    const searchQuery = ref('')

    // Синхронизируем с бэкенд жанрами
    const categories = ref([
      'Все',
      'Боевик',
      'Комедия',
      'Драма',
      'Триллер',
      'Фэнтези',
      'Фантастика',
      'Ужасы',
      'Романтика',
      'Приключения',
      'Детектив',
      'Мультфильм',
      'Документальный',
      'Исторический',
      'Биография',
      'Семейный',
    ])

    const filteredFilms = computed(() => {
      let filtered = films.value

      // Фильтруем по выбранной категории
      if (selectedCategory.value !== 'Все') {
        filtered = filtered.filter((film) => film.genre === selectedCategory.value)
      }

      // Фильтруем по поиску
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(
          (film) =>
            film.title.toLowerCase().includes(query) || film.genre.toLowerCase().includes(query)
        )
      }

      return filtered
    })

    const fetchFilms = async () => {
      try {
        const response = await axios.get('http://localhost:8000/films/')
        films.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки фильмов:', error)
      } finally {
        loading.value = false
      }
    }

    const selectCategory = (category) => {
      selectedCategory.value = category
    }

    onMounted(() => {
      fetchFilms()
    })

    return {
      films,
      loading,
      categories,
      selectedCategory,
      searchQuery,
      filteredFilms,
      selectCategory,
    }
  },
}
</script>

<style scoped>
.categories-scroll-container {
  flex: 1;
  overflow-x: auto;
  padding-bottom: 10px;
  margin: 0 20px;
}

.categories-scroll-container::-webkit-scrollbar {
  height: 4px;
}

.categories-scroll-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.categories-scroll-container::-webkit-scrollbar-thumb {
  background: #a8b1ff;
  border-radius: 2px;
}

.categories-underlined {
  display: flex;
  gap: 25px;
  flex-wrap: nowrap; /* Убираем перенос на новую строку */
  justify-content: flex-start;
  min-width: max-content;
}

/* Остальные стили остаются прежними */
.category-underlined {
  padding: 8px 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #a8b1ff;
  font-size: 1rem;
  font-weight: 500;
  white-space: nowrap;
  position: relative;
  border: none;
  background: none;
}

.category-underlined::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.category-underlined:hover {
  color: white;
}

.category-underlined:hover::after {
  width: 100%;
}

.category-underlined.active {
  color: white;
  font-weight: 600;
}

.category-underlined.active::after {
  width: 100%;
  background: linear-gradient(135deg, #ffd700, #ff6b6b);
  height: 2px;
}

/* Адаптивность для скролла */
@media (max-width: 768px) {
  .categories-scroll-container {
    margin: 0 10px;
    order: 2;
  }

  .categories-underlined {
    gap: 20px;
  }

  .category-underlined {
    font-size: 0.9rem;
    padding: 6px 3px;
  }
}
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d2d5a 100%);
  color: white;
}

.home-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.header-section {
  margin-bottom: 40px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
  white-space: nowrap;
  background: linear-gradient(135deg, #fff, #a8b1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Стили для подчеркнутых категорий */
.categories-underlined {
  display: flex;
  gap: 25px;
  flex-wrap: wrap;
  justify-content: center;
  flex: 1;
}

.category-underlined {
  padding: 8px 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #a8b1ff;
  font-size: 1rem;
  font-weight: 500;
  white-space: nowrap;
  position: relative;
  border: none;
  background: none;
}

.category-underlined::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.category-underlined:hover {
  color: white;
}

.category-underlined:hover::after {
  width: 100%;
}

.category-underlined.active {
  color: white;
  font-weight: 600;
}

.category-underlined.active::after {
  width: 100%;
  background: linear-gradient(135deg, #ffd700, #ff6b6b);
  height: 2px;
}

.search-section {
  display: flex;
  justify-content: flex-end;
  min-width: 250px;
}

.search-input-container {
  position: relative;
  width: 100%;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 12px 45px 12px 16px;
  border-radius: 25px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: white;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.search-input::placeholder {
  color: #a8b1ff;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.search-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #a8b1ff;
  font-size: 1.1rem;
}

.main-content {
  margin-top: 30px;
}

/* Адаптивность */
@media (max-width: 1024px) {
  .header-top {
    gap: 20px;
  }

  .page-title {
    font-size: 1.8rem;
  }

  .search-section {
    min-width: 200px;
  }

  .categories-underlined {
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .home-content {
    padding: 15px;
  }

  .header-top {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }

  .page-title {
    text-align: center;
    font-size: 1.8rem;
  }

  .categories-underlined {
    order: 2;
    justify-content: center;
    gap: 15px;
  }

  .search-section {
    order: 1;
    min-width: auto;
    justify-content: center;
  }

  .search-input-container {
    max-width: 100%;
  }

  .category-underlined {
    font-size: 0.95rem;
    padding: 6px 2px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.6rem;
  }

  .categories-underlined {
    gap: 12px;
    flex-wrap: wrap;
  }

  .category-underlined {
    font-size: 0.9rem;
    padding: 4px 1px;
  }

  .search-input {
    padding: 10px 40px 10px 14px;
    font-size: 0.9rem;
  }
}
</style>
