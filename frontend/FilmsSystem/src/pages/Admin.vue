<template>
  <div class="admin-container">
    <Navbar />
    
    <div class="admin-content">
      <div class="admin-header">
        <h1>Панель администратора</h1>
        <p>Управление кинотеатром</p>
      </div>

      <div class="admin-stats">
        <div class="stat-card">
          <div class="stat-icon">🎬</div>
          <div class="stat-info">
            <h3>{{ stats.films }}</h3>
            <p>Фильмов</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏛️</div>
          <div class="stat-info">
            <h3>{{ stats.halls }}</h3>
            <p>Залов</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-info">
            <h3>{{ stats.sessions }}</h3>
            <p>Сеансов</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎫</div>
          <div class="stat-info">
            <h3>{{ stats.bookings }}</h3>
            <p>Бронирований</p>
          </div>
        </div>
      </div>

      <div class="admin-links">
        <router-link to="/admin/films" class="admin-link">
          <div class="link-icon">🎬</div>
          <div class="link-text">
            <h3>Управление фильмами</h3>
            <p>Добавление, редактирование, удаление фильмов</p>
          </div>
        </router-link>

        <router-link to="/admin/halls" class="admin-link">
          <div class="link-icon">🏛️</div>
          <div class="link-text">
            <h3>Управление залами</h3>
            <p>Добавление и удаление кинозалов</p>
          </div>
        </router-link>

        <router-link to="/admin/sessions" class="admin-link">
          <div class="link-icon">📅</div>
          <div class="link-text">
            <h3>Управление сеансами</h3>
            <p>Создание и удаление сеансов</p>
          </div>
        </router-link>

        <router-link to="/admin/bookings" class="admin-link">
          <div class="link-icon">🎫</div>
          <div class="link-text">
            <h3>Просмотр бронирований</h3>
            <p>Все бронирования системы</p>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Layout/Navbar.vue'

export default {
  name: 'Admin',
  components: {
    Navbar
  },
  setup() {
    const router = useRouter()
    const stats = ref({
      films: 0,
      halls: 0,
      sessions: 0,
      bookings: 0
    })

    const loadStats = async () => {
      try {
        const token = localStorage.getItem('token')
        
        // Загружаем статистику
        const [filmsRes, hallsRes, sessionsRes, bookingsRes] = await Promise.all([
          fetch('http://localhost:8000/films/', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:8000/halls/', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:8000/sessions/', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:8000/bookings/', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        if (filmsRes.ok) stats.value.films = (await filmsRes.json()).length
        if (hallsRes.ok) stats.value.halls = (await hallsRes.json()).length
        if (sessionsRes.ok) stats.value.sessions = (await sessionsRes.json()).length
        if (bookingsRes.ok) stats.value.bookings = (await bookingsRes.json()).length

      } catch (err) {
        console.error('Error loading stats:', err)
      }
    }

    onMounted(() => {
      // Проверяем роль пользователя
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      if (userInfo.role !== 'admin') {
        router.push('/home')
        return
      }
      loadStats()
    })

    return {
      stats
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
  text-align: center;
  margin-bottom: 40px;
}

.admin-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #fff, #a8b1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.admin-header p {
  color: #a8b1ff;
  font-size: 1.1rem;
}

.admin-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info h3 {
  font-size: 2rem;
  margin: 0;
  color: #ffd700;
}

.stat-info p {
  margin: 5px 0 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.admin-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.admin-link {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  text-decoration: none;
  color: white;
  transition: all 0.3s ease;
}

.admin-link:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
  border-color: rgba(168, 177, 255, 0.3);
}

.link-icon {
  font-size: 3rem;
  opacity: 0.8;
}

.link-text h3 {
  margin: 0 0 8px 0;
  color: #a8b1ff;
}

.link-text p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .admin-stats {
    grid-template-columns: 1fr 1fr;
  }
  
  .admin-links {
    grid-template-columns: 1fr;
  }
  
  .admin-link {
    flex-direction: column;
    text-align: center;
  }
}

</style>