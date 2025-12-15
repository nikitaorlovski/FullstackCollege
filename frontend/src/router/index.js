import { createRouter, createWebHistory } from 'vue-router'
import RegistrationForm from '@/components/RegistrationForm.vue'
import LoginForm from '@/components/LoginForm.vue'
import Home from '@/pages/Home.vue'
import FilmsDetails from '@/pages/FilmsDetails.vue'
import { authGuard } from './guards'

const routes = [
  {
    path: '/register',
    name: 'register',
    component: RegistrationForm
  },
  {
    path: '/login',
    name: 'login',
    component: LoginForm
  },
  {
    path: '/home',
    name: 'home', 
    component: Home
  },
  {
    path: '/film/:id',
    name: 'film',
    component: FilmsDetails,
    props: true 
  },
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/booking',
    name: 'Booking',
    component: () => import('@/pages/FilmBooking.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/Profile.vue'),
    meta: { requiresAuth: true }
  },
  // Маршруты админки
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/pages/Admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/films',
    name: 'AdminFilms',
    component: () => import('@/pages/admin/AdminFilms.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/halls',
    name: 'AdminHalls',
    component: () => import('@/pages/admin/AdminHalls.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/sessions',
    name: 'AdminSessions',
    component: () => import('@/pages/admin/AdminSessions.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/bookings',
    name: 'AdminBookings',
    component: () => import('@/pages/admin/AdminBookings.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
  path: '/collections',
  name: 'Collections',
  component: () => import('@/pages/Collections.vue')
}
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Подключаем guards
router.beforeEach(authGuard)

export default router