# 🚗 AutoLari

> **Your media. Your car.**  
> Aplicación multimedia y reproductor IPTV/Radio optimizado para pantallas vehiculares (Car Mode), tablets y dispositivos móviles.

🌐 **Demo Web:** [autolari.larico.net](https://autolari.larico.net)

---

## ✨ Características

- 🏎️ **Car Mode (Modo Vehicular):**
  - Interfaz oscura OLED de alto contraste (`#000000` y Cyan `#00E5FF`).
  - Botones circulares compactos optimizados para conducción.
  - Soporte horizontal (Landscape) con prioridad al video (~72% de pantalla) y modo Cine (`FULL`/`LISTA`).
  - Pantalla siempre encendida (`KeepAwake`) durante la conducción.
- 📺 **Reproductor Universal:**
  - Soporte HLS nativo (`expo-video` en Android/iOS y `hls.js` en Web).
  - Compatible con listas M3U, M3U8, JSON y streams directos (MP3, AAC, MP4).
  - Autoplay inmediato al seleccionar canales o emisoras.
- 🔍 **Buscador Inteligente:** Filtro rápido por nombre, país o categoría.
- ⭐ **Favoritos e Historial:** Guardado local instantáneo con almacenamiento offline.
- 📱 **Diseño Seguro:** Adaptación total a barras del sistema (Safe Area Insets sin solapamientos).

---

## 🛠️ Tecnologías

- **Framework:** [Expo SDK 57](https://expo.dev) / React Native
- **Video & Streaming:** `expo-video` + `hls.js`
- **Navegación & Sistema:** `react-native-safe-area-context` + `expo-navigation-bar`
- **Persistencia:** `@react-native-async-storage/async-storage`
- **Estilos:** Dark OLED Automotive Design System

---

## 🚀 Instalación y Desarrollo

1. Clonar el repositorio e instalar dependencias:
```bash
npm install
```

2. Iniciar el entorno de desarrollo:
```bash
npx expo start
```
- Presiona `a` para abrir en emulador/dispositivo Android.
- Presiona `w` para abrir en navegador Web.

---

## 📦 Compilación y Despliegue

### 1. Versión Web (GitHub Pages / `autolari.larico.net`)
Compilar y subir a GitHub Pages en un solo comando:
```bash
npm run deploy:web
```

### 2. Generar APK para Android
Compilar APK instalable en la nube con EAS Build:
```bash
npm run build:apk
```

---

## 📄 Licencia

MIT © [AutoLari](https://autolari.larico.net)
