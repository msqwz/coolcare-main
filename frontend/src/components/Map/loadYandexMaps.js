import { YANDEX_MAPS_KEY } from '../../constants'

let isLoading = false
let loadPromise = null

export function loadYandexMaps() {
  if (window.ymaps) {
    return Promise.resolve()
  }
  
  if (isLoading && loadPromise) {
    return loadPromise
  }
  
  isLoading = true
  loadPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAPS_KEY}&lang=ru_RU`
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.ymaps && window.ymaps.ready) {
        window.ymaps.ready(() => resolve())
      } else {
        resolve()
      }
    }
    script.onerror = () => {
      console.error('Failed to load Yandex Maps API')
      resolve()
    }
    document.head.appendChild(script)
  })
  
  return loadPromise
}
