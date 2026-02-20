import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'javachat-theme'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(STORAGE_KEY, theme)
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(getInitialTheme())

  applyTheme(theme.value)

  watch(theme, (val) => applyTheme(val))

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  const isDark = () => theme.value === 'dark'

  return { theme, toggleTheme, isDark }
})
