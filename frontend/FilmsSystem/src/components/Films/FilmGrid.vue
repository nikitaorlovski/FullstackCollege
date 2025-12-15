<template>
  <div class="film-grid">
    <FilmCard 
      v-for="film in activeFilms" 
      :key="film.id" 
      :film="film" 
    />
    
    <!-- Сообщение если нет активных фильмов -->
    <div v-if="activeFilms.length === 0" class="no-films-message">
      <div class="no-films-icon">🎬</div>
      <h3>Нет доступных фильмов</h3>
      <p>В данный момент нет активных фильмов в расписании</p>
    </div>
  </div>
</template>

<script>
import FilmCard from './FilmCard.vue'
import { computed } from 'vue'

export default {
  name: 'FilmGrid',
  components: {
    FilmCard
  },
  props: {
    films: {
      type: Array,
      required: true
    },
    showOnlyActive: {
      type: Boolean,
      default: true // По умолчанию показываем только активные
    }
  },
  setup(props) {
    // Вычисляемое свойство для фильтрации фильмов
    const activeFilms = computed(() => {
      if (props.showOnlyActive) {
        return props.films.filter(film => film.is_active)
      }
      return props.films
    })

    return {
      activeFilms
    }
  }
}
</script>

<style scoped>
.film-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  padding: 20px 0;
}

/* Сообщение когда нет фильмов */
.no-films-message {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.7);
}

.no-films-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.no-films-message h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.9);
}

.no-films-message p {
  font-size: 1rem;
  margin: 0;
}

@media (max-width: 1200px) {
  .film-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .film-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .film-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }
  
  .no-films-message {
    padding: 40px 15px;
  }
  
  .no-films-icon {
    font-size: 3rem;
  }
}
</style>