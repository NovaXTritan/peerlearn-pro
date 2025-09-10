export const THEMES = ['dark','light','gradient','cosmos']

export function applyTheme(theme='dark'){
  const root = document.documentElement
  THEMES.forEach(t => root.classList.remove('theme-'+t))
  root.classList.add('theme-'+theme)
}
