<template>
  <div class="film-card" @click="goToFilm">
    <div class="film-poster">
      <img 
        v-if="film.image_url" 
        :src="film.image_url" 
        :alt="film.title"
        @load="onImageLoad"
        :class="{ 'loaded': imageLoaded }"
      />
      <div v-else class="no-image">🎬</div>
      <div class="film-rating">{{ film.rating.toFixed(1) }}</div>
      
      <!-- Наложение с названием и жанром -->
      <div class="film-overlay">
        <div class="overlay-content">
          <h3 class="overlay-title">{{ film.title }}</h3>
          <p class="overlay-genre">{{ film.genre }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'FilmCard',
  props: {
    film: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const router = useRouter()
    const imageLoaded = ref(false)
    
    const goToFilm = () => {
  router.push({
    name: 'film',
    params: { id: props.film.id },
  })
}

    const onImageLoad = () => {
      imageLoaded.value = true
    }

    return {
      goToFilm,
      imageLoaded,
      onImageLoad
    }
  }
}
</script>

<style scoped>
.film-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 0;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  overflow: hidden;
  height: fit-content;
}

.film-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.2);
}

.film-poster {
  position: relative;
  width: 100%;
  height: 400px;
  overflow: hidden;
}

.film-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: all 0.3s ease;
  opacity: 0;
}

.film-poster img.loaded {
  opacity: 1;
}

.film-card:hover .film-poster img {
  transform: scale(1.05);
  filter: brightness(0.7); /* Затемнение картинки */
}

.no-image {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  color: rgba(255, 255, 255, 0.3);
}

.film-rating {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7));
  color: #ffd700;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 700;
  border: 1px solid rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(10px);
  z-index: 3; /* Чтобы был поверх overlay */
}

/* Наложение с текстом */
.film-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.5) 40%,
    rgba(0, 0, 0, 0) 70%
  ); /* Градиент снизу вверх */
  display: flex;
  align-items: flex-end; /* Текст прижат к низу */
  justify-content: flex-start;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 2;
}

.film-card:hover .film-overlay {
  opacity: 1;
}

.overlay-content {
  text-align: left;
  padding: 20px;
  transform: translateY(20px);
  transition: transform 0.3s ease;
  width: 100%;
}

.film-card:hover .overlay-content {
  transform: translateY(0);
}

.overlay-title {
  color: white;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 6px 0;
  line-height: 1.2;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
}

.overlay-genre {
  color: #a8b1ff;
  font-size: 1rem;
  margin: 0;
  font-weight: 500;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
}

/* Адаптивность */
@media (max-width: 1200px) {
  .film-poster {
    height: 380px;
  }
}

@media (max-width: 768px) {
  .film-poster {
    height: 350px;
  }
  
  .overlay-content {
    padding: 15px;
  }
  
  .overlay-title {
    font-size: 1.1rem;
  }
  
  .overlay-genre {
    font-size: 0.9rem;
  }
  
  .film-rating {
    font-size: 0.9rem;
    padding: 6px 10px;
  }
}

@media (max-width: 480px) {
  .film-poster {
    height: 300px;
  }
  
  .overlay-content {
    padding: 12px;
  }
  
  .overlay-title {
    font-size: 1rem;
  }
  
  .overlay-genre {
    font-size: 0.85rem;
  }
  
  .no-image {
    font-size: 3rem;
  }
}
</style>