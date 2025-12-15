// src/stores/films.js
import { defineStore } from 'pinia'
import { filmsAPI } from '@/api/auth' // путь к api

export const useFilmsStore = defineStore('films', {
  state: () => ({
    byId: {},        // { [id]: Film }
    loading: {},     // { [id]: boolean }
    errors: {},      // { [id]: string | null }
    selectedSession: null   // ✅ храним выбранный сеанс
  }),

  actions: {
    seed(film) {
      if (film?.id) this.byId[film.id] = film
    },

    setSelectedSession(session) {
      this.selectedSession = session   // ✅
    },

    clearSelectedSession() {
      this.selectedSession = null      // ✅
    },

    async fetchById(id) {
      if (!id) return null

      if (this.byId[id]) return this.byId[id]

      try {
        this.loading[id] = true
        const { data } = await filmsAPI.getFilm(id)
        this.byId[id] = data
        this.errors[id] = null
        return data
      } catch (e) {
        this.errors[id] = e?.response?.data?.detail || 'Failed to load film'
        throw e
      } finally {
        this.loading[id] = false
      }
    },

    async refreshById(id) {
      try {
        this.loading[id] = true
        const { data } = await filmsAPI.getFilm(id)
        this.byId[id] = data
        this.errors[id] = null
        return data
      } catch (e) {
        this.errors[id] = e?.response?.data?.detail || 'Failed to refresh film'
        return this.byId[id] || null
      } finally {
        this.loading[id] = false
      }
    }
  }
})
