import AsyncStorage from '@react-native-async-storage/async-storage';
import { Source, Channel, FavoriteItem, HistoryItem } from '../types';

const STORAGE_KEYS = {
  SOURCES: '@autolari_sources_v1',
  CHANNELS: '@autolari_channels_v1',
  FAVORITES: '@autolari_favorites_v1',
  HISTORY: '@autolari_history_v1',
  LAST_PLAYED: '@autolari_last_played_v1',
  SETTINGS: '@autolari_settings_v1',
  ACTIVE_SOURCE_ID: '@autolari_active_source_v1',
};

export interface AppSettings {
  carModeEnabled: boolean;
  autoSwitchCarModeOnLandscape: boolean;
  keepScreenAwakeInCarMode: boolean;
  hapticFeedbackEnabled: boolean;
  preferredQuality: 'auto' | '1080p' | '720p' | '480p';
  bufferSeconds: number;
}

export const defaultSettings: AppSettings = {
  carModeEnabled: false,
  autoSwitchCarModeOnLandscape: true,
  keepScreenAwakeInCarMode: true,
  hapticFeedbackEnabled: true,
  preferredQuality: 'auto',
  bufferSeconds: 6,
};

export const StorageService = {
  // Sources
  async getSources(): Promise<Source[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SOURCES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[Storage] Error reading sources:', e);
      return [];
    }
  },

  async saveSources(sources: Source[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(sources));
    } catch (e) {
      console.error('[Storage] Error saving sources:', e);
    }
  },

  // Channels indexados por fuente individual
  async saveSourceChannels(sourceId: string, channels: Channel[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`@autolari_src_chans_${sourceId}`, JSON.stringify(channels));
    } catch (e: any) {
      console.warn(`[Storage] Cuota excedida o error al guardar ${channels.length} canales para la fuente ${sourceId}:`, e);
      // En Web con cuota de 5MB, almacenar un subconjunto de 2500 canales para mantener el sistema operativo
      try {
        const trimmed = channels.slice(0, 2500);
        await AsyncStorage.setItem(`@autolari_src_chans_${sourceId}`, JSON.stringify(trimmed));
        console.info(`[Storage] Fallback exitoso: se guardaron los primeros ${trimmed.length} canales.`);
      } catch (fallbackErr) {
        console.error(`[Storage] Fallback de almacenamiento también falló:`, fallbackErr);
      }
    }
  },

  async getSourceChannels(sourceId: string): Promise<Channel[]> {
    try {
      const data = await AsyncStorage.getItem(`@autolari_src_chans_${sourceId}`);
      if (!data) return [];
      const channels: Channel[] = JSON.parse(data);
      // Auto-reparar canales que tienen "tv" o ".m3u8" pero se guardaron previamente como "radio"
      return channels.map((ch) => {
        const text = `${ch.name} ${ch.streamUrl}`.toLowerCase();
        if (ch.mediaType === 'radio' && (text.includes('tv') || text.includes('.m3u8'))) {
          return { ...ch, mediaType: 'live_tv' };
        }
        return ch;
      });
    } catch (e) {
      console.error(`[Storage] Error reading channels for source ${sourceId}:`, e);
      return [];
    }
  },

  async deleteSourceChannels(sourceId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`@autolari_src_chans_${sourceId}`);
    } catch (e) {
      console.error(`[Storage] Error removing channels for source ${sourceId}:`, e);
    }
  },

  // Legacy & Global Channels
  async getChannels(): Promise<Channel[]> {
    try {
      const sources = await this.getSources();
      const activeSources = sources.filter((s) => s.isActive);
      const results = await Promise.all(activeSources.map((s) => this.getSourceChannels(s.id)));
      const combined = results.flat();
      if (combined.length > 0) return combined;

      // Fallback a almacenamiento legado si no hay canales indexados por fuente
      const legacyData = await AsyncStorage.getItem(STORAGE_KEYS.CHANNELS);
      return legacyData ? JSON.parse(legacyData) : [];
    } catch (e) {
      console.error('[Storage] Error reading channels:', e);
      return [];
    }
  },

  async saveChannels(channels: Channel[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(channels));
    } catch (e) {
      console.error('[Storage] Error saving channels:', e);
    }
  },

  // Favorites
  async getFavorites(): Promise<FavoriteItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[Storage] Error reading favorites:', e);
      return [];
    }
  },

  async saveFavorites(favorites: FavoriteItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.error('[Storage] Error saving favorites:', e);
    }
  },

  // History
  async getHistory(): Promise<HistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[Storage] Error reading history:', e);
      return [];
    }
  },

  async saveHistory(history: HistoryItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('[Storage] Error saving history:', e);
    }
  },

  // Last Played Channel
  async getLastPlayed(): Promise<Channel | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_PLAYED);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  async saveLastPlayed(channel: Channel): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_PLAYED, JSON.stringify(channel));
    } catch (e) {
      console.error('[Storage] Error saving last played:', e);
    }
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('[Storage] Error saving settings:', e);
    }
  },
};
