// AutoLari Design System — "Your media. Your car."
// Automotive Cyberpunk / High-Contrast Cockpit Aesthetic

export const AutoTheme = {
  colors: {
    // Deep OLED Backgrounds (Preserva batería y evita encandilamiento nocturno)
    background: '#080A0E',
    surface: '#11141D',
    surfaceCard: '#161B26',
    surfaceElevated: '#1D2433',
    surfaceHighlight: '#262F43',
    surfaceGlass: 'rgba(22, 27, 38, 0.85)',
    
    // Borders & Dividers
    border: '#232A3B',
    borderLight: '#303B52',
    borderFocus: '#00E5FF',

    // Functional Accents
    primary: '#00E5FF',        // Electric Cyan — foco visual y reproducción activa
    primaryGlow: 'rgba(0, 229, 255, 0.25)',
    secondary: '#FF9100',      // Racing Amber — favoritos y alertas
    secondaryGlow: 'rgba(255, 145, 0, 0.25)',
    accentRed: '#FF3366',       // Live stream badge / Danger
    accentGreen: '#00E676',     // Online status / Connected
    accentPurple: '#7C4DFF',    // YouTube / Multimedia

    // Text & Content Hierarchy
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textMuted: '#475569',
    textDark: '#0B0F17',

    // Car Mode High-Contrast Overrides
    carBg: '#000000',
    carSurface: '#0E1117',
    carCard: '#161922',
    carPrimary: '#00F0FF',
    carSecondary: '#FFA500',
    carBorder: '#2A3346',
  },

  typography: {
    fontFamily: 'System',
    sizes: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 18,
      xl: 22,
      xxl: 28,
      carHeader: 32,
      carHero: 38,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      black: '900' as const,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    carTouch: 20,
  },

  carMode: {
    minTouchSize: 72,          // Tamaño mínimo para pulsación vehicular segura
    bigButtonHeight: 82,       // Botón masivo para Car Mode
    fontSizeTitle: 24,
    fontSizeSub: 16,
    iconSize: 34,
  },

  borderRadius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },
};
