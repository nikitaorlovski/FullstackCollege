<template>
  <nav class="navbar">
    <div class="nav-container">
      <!-- Логотип и название -->
      <div class="nav-brand">
        <div class="logo">🎬</div>
        <span class="brand-name">Film Viewer</span>
      </div>

      <!-- Основная навигация -->
      <div class="nav-links">
        <router-link to="/home" class="nav-link">Афиша</router-link>
        <router-link to="/collections" class="nav-link">Подборки</router-link>
      </div>

      <!-- Правая часть (кнопки входа/профиля) -->
      <div class="nav-actions">
        <template v-if="isAuthenticated">
          <!-- ⭐ ДОБАВЬТЕ ЭТУ КНОПКУ АДМИНКИ -->
          <router-link v-if="userInfo.role === 'admin'" to="/admin" class="nav-btn admin-btn">
            <svg class="admin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M2 12.88V11.12C2 10.08 2.85 9.22 3.9 9.22C5.71 9.22 6.45 7.94 5.54 6.37C5.02 5.47 5.33 4.3 6.24 3.78L7.97 2.79C8.76 2.32 9.78 2.6 10.25 3.39L10.36 3.58C11.26 5.15 12.74 5.15 13.64 3.58L13.75 3.39C14.22 2.6 15.24 2.32 16.03 2.79L17.76 3.78C18.67 4.3 18.98 5.47 18.46 6.37C17.55 7.94 18.29 9.22 20.1 9.22C21.15 9.22 22 10.07 22 11.12V12.88C22 13.92 21.15 14.78 20.1 14.78C18.29 14.78 17.55 16.06 18.46 17.63C18.98 18.54 18.67 19.7 17.76 20.22L16.03 21.21C15.24 21.68 14.22 21.4 13.75 20.61L13.64 20.42C12.74 18.85 11.26 18.85 10.36 20.42L10.25 20.61C9.78 21.4 8.76 21.68 7.97 21.21L6.24 20.22C5.33 19.7 5.02 18.53 5.54 17.63C6.45 16.06 5.71 14.78 3.9 14.78C2.85 14.78 2 13.93 2 12.88Z"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
            Админ-панель
          </router-link>

          <router-link to="/profile" class="nav-btn profile-btn">
            <svg class="profile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M20 21C20 19.6044 20 18.9067 19.8278 18.3389C19.44 17.0605 18.4395 16.06 17.1611 15.6722C16.5933 15.5 15.8956 15.5 14.5 15.5H9.5C8.10444 15.5 7.40665 15.5 6.83886 15.6722C5.56045 16.06 4.56004 17.0605 4.17224 18.3389C4 18.9067 4 19.6044 4 21"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            Профиль
          </router-link>
          <button @click="logout" class="nav-btn logout-btn">Выйти</button>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-btn login-btn"> Войти </router-link>
        </template>
      </div>
    </div>
  </nav>
</template>

<script>
import { computed, ref, onMounted } from 'vue'

export default {
  name: 'Navbar',
  setup() {
    const userInfo = ref({})

    const isAuthenticated = computed(() => {
      return !!localStorage.getItem('token')
    })

    // ⭐ ЗАГРУЖАЕМ ИНФОРМАЦИЮ О ПОЛЬЗОВАТЕЛЕ ПРИ МОНТИРОВАНИИ
    const loadUserInfo = () => {
      const savedUserInfo = localStorage.getItem('userInfo')
      if (savedUserInfo) {
        try {
          userInfo.value = JSON.parse(savedUserInfo)
        } catch (e) {
          console.error('Error parsing userInfo:', e)
        }
      }
    }

    const logout = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      window.location.reload()
    }

    onMounted(() => {
      loadUserInfo()
    })

    return {
      isAuthenticated,
      userInfo,
      logout,
      loadUserInfo,
    }
  },
}
</script>

<style scoped>
.admin-btn {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  font-weight: 600;
}

.admin-btn:hover {
  background: rgba(251, 191, 36, 0.2);
  color: #ffffff;
  border-color: rgba(251, 191, 36, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
}

.admin-icon {
  transition: transform 0.3s ease;
}

.admin-btn:hover .admin-icon {
  transform: rotate(15deg);
}

@media (max-width: 480px) {
  .admin-btn span:last-child {
    display: none;
  }

  .admin-btn {
    padding: 8px;
  }
}
.navbar {
  background: rgba(13, 17, 28, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  height: 70px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 2rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.brand-name {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff, #a8b1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 30px;
}

.nav-link {
  color: #e2e8f0;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.nav-link.router-link-active {
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
}

.nav-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.nav-btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.3px;
}

.profile-btn {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-weight: 600;
}

.profile-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

.profile-icon {
  transition: transform 0.3s ease;
}

.profile-btn:hover .profile-icon {
  transform: scale(1.1);
}

.logout-btn {
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  font-weight: 600; /* Жирный текст */
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ffffff;
  border-color: rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

/* Стиль для кнопки входа */
.login-btn {
  color: white;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: 1px solid rgba(102, 126, 234, 0.3);
  font-weight: 600; /* Жирный текст */
}

.login-btn:hover {
  background: linear-gradient(135deg, #5a6fd8, #6a4190);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  border-color: rgba(102, 126, 234, 0.5);
}

/* Эффект свечения для активных кнопок */
.nav-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.nav-btn:hover::before {
  left: 100%;
}

/* Адаптивность */
@media (max-width: 768px) {
  .nav-links {
    gap: 15px;
  }

  .nav-link {
    padding: 6px 12px;
    font-size: 0.9rem;
  }

  .nav-actions {
    gap: 10px;
  }

  .nav-btn {
    padding: 6px 14px;
    font-size: 0.9rem;
    font-weight: 600; /* Сохраняем жирность на мобильных */
  }

  .profile-icon {
    width: 14px;
    height: 14px;
  }
}

@media (max-width: 480px) {
  .nav-container {
    flex-wrap: wrap;
    height: auto;
    padding: 10px 0;
  }

  .nav-brand {
    margin-bottom: 10px;
  }

  .nav-links {
    order: 3;
    width: 100%;
    justify-content: center;
    margin-top: 10px;
  }

  .nav-actions {
    order: 2;
  }

  .nav-btn span:last-child {
    display: none;
  }

  .nav-btn {
    padding: 8px;
    border-radius: 6px;
    font-weight: 600;
  }
}

.profile-btn {
  color: #e2e8f0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.6), rgba(114, 92, 255, 0.6));
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: 600;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.profile-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  transform: scaleX(0);
  transform-origin: 100%;
  transition: transform 0.3s ease-in-out;
  border-radius: 8px;
}

.profile-btn:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.8), rgba(114, 92, 255, 0.8));
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.profile-btn:hover::before {
  transform: scaleX(1);
}

.profile-btn:hover .profile-icon {
  transform: rotate(360deg);
}

.profile-icon {
  transition: transform 0.3s ease;
  width: 16px;
  height: 16px;
}

/* Дополнительная тень для кнопки */
.profile-btn {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.profile-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.2);
}
</style>
