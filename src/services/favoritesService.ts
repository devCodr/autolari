import { Channel, FavoriteItem, HistoryItem } from '../core/types';
import { StorageService } from '../core/storage';

export class FavoritesService {
  public static async getFavorites(): Promise<FavoriteItem[]> {
    return StorageService.getFavorites();
  }

  public static async isFavorite(channelId: string): Promise<boolean> {
    const favorites = await StorageService.getFavorites();
    return favorites.some((f) => f.id === channelId);
  }

  public static async toggleFavorite(channel: Channel): Promise<boolean> {
    const favorites = await StorageService.getFavorites();
    const existingIndex = favorites.findIndex((f) => f.id === channel.id);

    if (existingIndex !== -1) {
      // Remover
      const updated = favorites.filter((f) => f.id !== channel.id);
      await StorageService.saveFavorites(updated);
      return false;
    } else {
      // Agregar al inicio
      const newFav: FavoriteItem = {
        id: channel.id,
        targetType: channel.mediaType,
        title: channel.name,
        subtitle: channel.groupTitle,
        streamUrl: channel.streamUrl,
        imageUrl: channel.logoUrl,
        groupTitle: channel.groupTitle,
        addedAt: new Date().toISOString(),
      };
      await StorageService.saveFavorites([newFav, ...favorites]);
      return true;
    }
  }

  public static async removeFavorite(channelId: string): Promise<void> {
    const favorites = await StorageService.getFavorites();
    const updated = favorites.filter((f) => f.id !== channelId);
    await StorageService.saveFavorites(updated);
  }
}

export class HistoryService {
  private static readonly MAX_HISTORY_ITEMS = 40;

  public static async getHistory(): Promise<HistoryItem[]> {
    return StorageService.getHistory();
  }

  public static async recordPlayback(channel: Channel): Promise<void> {
    try {
      const history = await StorageService.getHistory();
      // Eliminar ocurrencias previas para ponerlo arriba
      const filtered = history.filter((h) => h.streamUrl !== channel.streamUrl);

      const newItem: HistoryItem = {
        id: `hist_${Date.now()}`,
        targetId: channel.id,
        targetType: channel.mediaType,
        title: channel.name,
        streamUrl: channel.streamUrl,
        imageUrl: channel.logoUrl,
        groupTitle: channel.groupTitle,
        lastPlayedAt: new Date().toISOString(),
      };

      const updated = [newItem, ...filtered].slice(0, this.MAX_HISTORY_ITEMS);
      await StorageService.saveHistory(updated);
      await StorageService.saveLastPlayed(channel);
    } catch (e) {
      console.error('[HistoryService] Error saving history:', e);
    }
  }

  public static async getLastPlayed(): Promise<Channel | null> {
    return StorageService.getLastPlayed();
  }

  public static async clearHistory(): Promise<void> {
    await StorageService.saveHistory([]);
  }
}
