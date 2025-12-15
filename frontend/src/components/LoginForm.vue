<template>
  <div class="login-container">
    <!-- Анимированный фон -->
    <div class="animated-background">
      <div class="floating-element el1"></div>
      <div class="floating-element el2"></div>
      <div class="floating-element el3"></div>
      <div class="floating-element el4"></div>
      <div class="floating-element el5"></div>
    </div>

    <div class="login-wrapper">
      <!-- Логотип и название -->
      <div class="brand-header">
        <div class="logo">
          <div class="logo-icon">🎬</div>
        </div>
        <h1 class="brand-name">Film Viewer</h1>
      </div>

      <div class="login-card">
        <div class="card-header">
          <h2 class="title">С возвращением!</h2>
          <p class="subtitle">Войдите в свой аккаунт</p>
        </div>

        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="input-group">
            <div class="input-container">
              <p class="input-icon">📧</p>
              <input
                type="email"
                v-model="form.email"
                required
                class="form-input"
                placeholder="Введите ваш email"
              />
            </div>
          </div>

          <div class="input-group">
            <div class="input-container">
              <p class="input-icon">🔒</p>
              <input
                type="password"
                v-model="form.password"
                required
                class="form-input"
                placeholder="Введите ваш пароль"
              />
            </div>
            <div v-if="loginError" class="error-message">⚠ {{ loginError }}</div>
          </div>

          <button
            type="submit"
            class="submit-btn"
            :class="{ disabled: !isFormValid, loading: loading }"
            :disabled="!isFormValid"
          >
            <span class="btn-content">
              <span class="btn-text">Войти в аккаунт</span>
            </span>
            <div class="btn-loader" v-if="loading">
              <div class="loader-spinner"></div>
            </div>
          </button>
        </form>

        <div class="register-link">
          <p>
            Ещё нет аккаунта?
            <router-link to="/register" class="link">Зарегистрироваться</router-link>
          </p>
        </div>
      </div>

      <!-- Декоративные элементы -->
      <div class="decoration-corner corner-top-left"></div>
      <div class="decoration-corner corner-top-right"></div>
      <div class="decoration-corner corner-bottom-left"></div>
      <div class="decoration-corner corner-bottom-right"></div>
    </div>
  </div>
</template>

<script>
// В компоненте Login
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '@/api/auth'

export default {
  name: 'LoginForm',
  setup() {
    const router = useRouter()
    const form = ref({
      email: '',
      password: '',
    })

    const loading = ref(false)
    const loginError = ref('')
    const API_BASE = import.meta.env.VITE_API_URL
    const isFormValid = computed(() => {
      return form.value.email && form.value.password
    })

    // ⭐ ДОБАВЛЯЕМ ФУНКЦИЮ ДЛЯ ЗАГРУЗКИ ИНФОРМАЦИИ О ПОЛЬЗОВАТЕЛЕ
    const loadUserInfo = async (token) => {
      try {
        const response = await fetch(`${API_BASE}/views/user-info`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const userInfo = await response.json()
          localStorage.setItem('userInfo', JSON.stringify(userInfo))
          return userInfo
        }

        throw new Error('Failed to load user info')
      } catch (error) {
        console.error('Error loading user info:', error)

        const defaultUserInfo = {
          name: form.value.email.split('@')[0],
          email: form.value.email,
          role: 'user',
        }

        localStorage.setItem('userInfo', JSON.stringify(defaultUserInfo))
        return defaultUserInfo
      }
    }

    const handleSubmit = async () => {
      loading.value = true
      loginError.value = ''

      try {
        const response = await authAPI.login({
          email: form.value.email,
          password: form.value.password,
        })

        // Сохраняем токен
        const token = response.data.access_token
        localStorage.setItem('token', token)
        console.log('Успешный вход, токен:', token)

        // ⭐ ЗАГРУЖАЕМ ИНФОРМАЦИЮ О ПОЛЬЗОВАТЕЛЕ
        await loadUserInfo(token)

        // Переходим на главную страницу
        router.push('/home')
      } catch (error) {
        console.error('Login error:', error)
        if (error.response?.status === 401) {
          loginError.value = 'Неверный email или пароль'
        } else {
          loginError.value = 'Ошибка входа. Попробуйте позже.'
        }
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      loading,
      loginError,
      isFormValid,
      handleSubmit,
    }
  },
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d2d5a 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.animated-background {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.floating-element {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
  animation: float 6s ease-in-out infinite;
}

.floating-element.el1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 5%;
  animation-delay: 0s;
}

.floating-element.el2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 10%;
  animation-delay: 2s;
}

.floating-element.el3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 15%;
  animation-delay: 4s;
}

.floating-element.el4 {
  width: 120px;
  height: 120px;
  top: 30%;
  right: 20%;
  animation-delay: 1s;
}

.floating-element.el5 {
  width: 80px;
  height: 80px;
  bottom: 10%;
  right: 5%;
  animation-delay: 3s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.login-wrapper {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 440px;
}

.brand-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 16px;
  margin-bottom: 12px;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.logo-icon {
  font-size: 1.8rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.brand-name {
  font-size: 2.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff, #a8b1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.login-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  padding: 40px 35px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.card-header {
  text-align: center;
  margin-bottom: 35px;
}

.title {
  font-size: 1.6rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #a8b1ff;
  font-size: 0.95rem;
  margin: 0;
  font-weight: 400;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  font-size: 1.1rem;
  z-index: 2;
}

.form-input {
  width: 100%;
  padding: 14px 14px 14px 45px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #ffffff;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  outline: none;
}

.form-input::placeholder {
  color: #a8b1ff;
  opacity: 0.7;
}

.form-input:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.error-message {
  color: #ff6b6b;
  font-size: 0.8rem;
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.forgot-password {
  text-align: right;
  margin-top: -10px;
}

.forgot-link {
  color: #a8b1ff;
  font-size: 0.85rem;
  text-decoration: none;
  transition: color 0.3s ease;
}

.forgot-link:hover {
  color: #667eea;
  text-decoration: underline;
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  margin-top: 10px;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.submit-btn:hover:not(.disabled):not(.loading) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

.submit-btn:active:not(.disabled):not(.loading) {
  transform: translateY(-1px);
}

.submit-btn.disabled {
  background: #4a5568;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.submit-btn.loading {
  cursor: not-allowed;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-icon {
  font-size: 1.1rem;
  transition: transform 0.3s ease;
}

.submit-btn:hover:not(.disabled):not(.loading) .btn-icon {
  transform: translateX(2px);
}

.btn-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.loader-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.register-link {
  text-align: center;
  margin-top: 25px;
  color: #a8b1ff;
  font-size: 0.9rem;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.link:hover {
  color: #a8b1ff;
  text-decoration: underline;
}

.decoration-corner {
  position: absolute;
  width: 80px;
  height: 80px;
  border: 2px solid rgba(102, 126, 234, 0.3);
  pointer-events: none;
}

.corner-top-left {
  top: -15px;
  left: -15px;
  border-right: none;
  border-bottom: none;
  border-radius: 15px 0 0 0;
}

.corner-top-right {
  top: -15px;
  right: -15px;
  border-left: none;
  border-bottom: none;
  border-radius: 0 15px 0 0;
}

.corner-bottom-left {
  bottom: -15px;
  left: -15px;
  border-right: none;
  border-top: none;
  border-radius: 0 0 0 15px;
}

.corner-bottom-right {
  bottom: -15px;
  right: -15px;
  border-left: none;
  border-top: none;
  border-radius: 0 0 15px 0;
}

/* Адаптивность */
@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }

  .brand-name {
    font-size: 1.8rem;
  }

  .logo {
    width: 50px;
    height: 50px;
  }

  .logo-icon {
    font-size: 1.5rem;
  }

  .title {
    font-size: 1.4rem;
  }
}
</style>
