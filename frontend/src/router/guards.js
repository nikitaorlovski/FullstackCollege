export const authGuard = (to, from, next) => {
  const token = localStorage.getItem('token')
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  
  // Если маршрут требует авторизации, но токена нет
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }
  
  // Если маршрут требует прав админа, но пользователь не админ
  if (to.meta.requiresAdmin && userInfo.role !== 'admin') {
    alert('Доступ запрещен. Требуются права администратора.')
    next('/home')
    return
  }
  
  // Все проверки пройдены
  next()
}