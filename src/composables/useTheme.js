// src/composables/useTheme.js
import { ref, watch } from 'vue';

// Clé de persistance dans le localStorage
const STORAGE_KEY = 'sakina-theme';

// État global partagé par toute l'application
const theme = ref(resolveThemeInitial());

// Applique la classe `dark` sur <html> et persiste le choix
function appliquer(classe) {
  theme.value = classe;
  const root = document.documentElement;
  if (classe === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.setAttribute('data-theme', classe);
  localStorage.setItem(STORAGE_KEY, classe);
}

// Lecture initiale : localStorage > préférence système
function resolveThemeInitial() {
  if (typeof window === 'undefined') return 'light';
  const stocke = localStorage.getItem(STORAGE_KEY);
  if (stocke === 'dark' || stocke === 'light') return stocke;
  return window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

// Pour ne synchroniser la classe sur <html> qu'une seule fois, au premier usage
let synchronise = false;

export function useTheme() {
  const isDark = ref(theme.value === 'dark');

  // Synchronise isDark à chaque changement du thème partagé
  watch(theme, (valeur) => {
    isDark.value = valeur === 'dark';
  });

  // Au premier appel du composable, on applique la bonne classe sur <html>
  // (utile si le script anti-flash du index.html n'a pas pu la poser).
  if (!synchronise) {
    synchronise = true;
    const root = document.documentElement;
    if (theme.value === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  function toggleTheme() {
    appliquer(isDark.value ? 'light' : 'dark');
  }

  return {
    theme,
    isDark,
    toggleTheme,
  };
}
