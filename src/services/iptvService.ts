import { Platform } from 'react-native';
import { Channel, Source } from '../core/types';
import { StorageService } from '../core/storage';
import { M3UParser } from '../core/parsers/m3uParser';
import { JSONParser } from '../core/parsers/jsonParser';

export class IPTVService {
  /**
   * Determina si una URL corresponde a un stream directo (Radio Shoutcast/Icecast, MP3, MP4, etc.)
   */
  public static isDirectStreamUrl(url: string): { isStream: boolean; isAudio: boolean } {
    const cleanUrl = url.trim().toLowerCase();

    // Extensiones de audio
    if (
      cleanUrl.endsWith('.mp3') ||
      cleanUrl.endsWith('.aac') ||
      cleanUrl.endsWith('.ogg') ||
      cleanUrl.endsWith('.wav') ||
      cleanUrl.endsWith('.flac') ||
      cleanUrl.endsWith('.m4a') ||
      cleanUrl.includes('/icecast') ||
      cleanUrl.includes('/shoutcast')
    ) {
      return { isStream: true, isAudio: true };
    }

    // Puertos y rutas típicas de radio streaming (ej: :10443/italopower, :8000/stream)
    const isRadioStreamPattern =
      /(:\d{4,5}\/[a-zA-Z0-9_\-]+)|(stream\.[a-zA-Z0-9.\-_]+)|(\/radio(\/|\?|$))|(\/live(\/|\?|$))/i.test(cleanUrl);

    if (isRadioStreamPattern && !cleanUrl.endsWith('.m3u') && !cleanUrl.endsWith('.m3u8') && !cleanUrl.endsWith('.json')) {
      return { isStream: true, isAudio: true };
    }

    // Extensiones de video directo
    if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mkv') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.avi')) {
      return { isStream: true, isAudio: false };
    }

    return { isStream: false, isAudio: false };
  }

  /**
   * Normaliza y resuelve URLs inteligentes (repositorios GitHub, PLAYLISTS.md, iptv-org, links blob a raw)
   */
  public static normalizeAndResolveUrl(
    url: string,
    customName?: string
  ): { resolvedUrl: string; resolvedName: string; isIptvOrg: boolean } {
    let cleanUrl = url.trim();
    let name = customName?.trim() || '';
    let isIptvOrg = false;

    const lower = cleanUrl.toLowerCase();

    // 1. Detección de repositorios o catálogos Markdown de IPTV-Org
    if (
      lower.includes('github.com/iptv-org/iptv#playlists') ||
      lower.includes('github.com/iptv-org/iptv/blob/master/playlists.md') ||
      lower.includes('raw.githubusercontent.com/iptv-org/iptv/master/playlists.md') ||
      lower === 'https://github.com/iptv-org/iptv' ||
      lower === 'https://github.com/iptv-org/iptv/' ||
      lower === 'http://github.com/iptv-org/iptv'
    ) {
      isIptvOrg = true;
      // Redirigir al índice estructurado por países oficial de IPTV-Org
      cleanUrl = 'https://iptv-org.github.io/iptv/index.country.m3u';
      if (!name) name = 'IPTV-Org Mundial (Por Países)';
    } else if (lower.includes('iptv-org.github.io/iptv/index.m3u')) {
      isIptvOrg = true;
      if (!name) name = 'IPTV-Org Global';
    } else if (lower.includes('iptv-org.github.io/iptv/countries/pe.m3u')) {
      isIptvOrg = true;
      if (!name) name = 'IPTV-Org Perú';
    } else if (lower.includes('iptv-org.github.io/iptv/regions/latam.m3u')) {
      isIptvOrg = true;
      if (!name) name = 'IPTV-Org Latinoamérica';
    }
    // 2. Conversión automática de enlaces GitHub Blob a Raw
    else if (cleanUrl.includes('github.com/') && cleanUrl.includes('/blob/')) {
      cleanUrl = cleanUrl.replace('github.com/', 'raw.githubusercontent.com/').replace('/blob/', '/');
    }

    return { resolvedUrl: cleanUrl, resolvedName: name, isIptvOrg };
  }

  /**
   * Descarga y parsea una URL M3U, JSON o Stream Directo (Radio / Video / MP3)
   */
  public static async fetchAndParse(
    url: string,
    sourceId: string,
    customName?: string
  ): Promise<{ channels: Channel[]; categories: string[]; type: 'm3u' | 'json' | 'stream' }> {
    const { resolvedUrl, resolvedName } = this.normalizeAndResolveUrl(url, customName);
    const trimmedUrl = resolvedUrl;
    const finalCustomName = resolvedName || customName;
    const streamInfo = this.isDirectStreamUrl(trimmedUrl);

    // Si es un stream directo reconocido, indexarlo inmediatamente sin descargar el flujo continuo
    if (streamInfo.isStream) {
      const channelName = customName && customName.trim()
        ? customName.trim()
        : this.extractNameFromUrl(trimmedUrl);
      const mediaType = streamInfo.isAudio ? 'radio' : 'live_tv';
      const groupTitle = streamInfo.isAudio ? 'Radio Online' : 'Streams Directos';

      const singleChannel: Channel = {
        id: `${sourceId}_ch_0`,
        sourceId,
        name: channelName,
        streamUrl: trimmedUrl,
        groupTitle,
        country: 'Online',
        ambit: groupTitle,
        tags: [streamInfo.isAudio ? 'Radio' : 'TV', 'Directo', 'Audio'],
        mediaType,
        isFavorite: false,
      };

      return {
        channels: [singleChannel],
        categories: [groupTitle],
        type: 'stream',
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const fetchHeaders: Record<string, string> = {
        Accept: '*/*',
      };
      if (Platform.OS !== 'web') {
        fetchHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      }

      const response = await fetch(trimmedUrl, {
        signal: controller.signal,
        referrerPolicy: 'no-referrer',
        headers: fetchHeaders,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: No se pudo acceder a la URL.`);
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const isM3UContent =
        contentType.includes('mpegurl') ||
        trimmedUrl.toLowerCase().includes('.m3u') ||
        trimmedUrl.toLowerCase().includes('.m3u8');

      // Solo tratar como stream directo si es binario de audio/video y NO es una playlist M3U
      if (!isM3UContent && (contentType.includes('audio/mpeg') || contentType.includes('audio/mp3') || contentType.includes('video/mp4'))) {
        const isAudio = contentType.includes('audio/');
        const channelName = finalCustomName && finalCustomName.trim() ? finalCustomName.trim() : this.extractNameFromUrl(trimmedUrl);
        const groupTitle = isAudio ? 'Radio Online' : 'Streams Directos';
        const singleChannel: Channel = {
          id: `${sourceId}_ch_0`,
          sourceId,
          name: channelName,
          streamUrl: trimmedUrl,
          groupTitle,
          country: 'Online',
          ambit: groupTitle,
          tags: [isAudio ? 'Radio' : 'TV', 'Directo'],
          mediaType: isAudio ? 'radio' : 'live_tv',
          isFavorite: false,
        };
        return { channels: [singleChannel], categories: [groupTitle], type: 'stream' };
      }

      const text = await response.text();
      const trimmed = text.trim();

      // Detección automática: Si empieza con { o [ o la url termina en .json
      if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmedUrl.toLowerCase().includes('.json')) {
        const result = JSONParser.parse(trimmed, sourceId);
        return { ...result, type: 'json' };
      } else if (trimmed.includes('#EXTM3U') || trimmed.includes('#EXTINF')) {
        // Si tiene múltiples canales con #EXTINF
        if (trimmed.includes('#EXTINF')) {
          const result = M3UParser.parse(trimmed, sourceId);
          if (result.channels.length > 0) {
            return { ...result, type: 'm3u' };
          }
        }

        // Si es un archivo HLS Master Manifest o Media Playlist (ej: #EXT-X-STREAM-INF, chunks.m3u8, etc.)
        // sin canales separados, es un stream en vivo individual directo
        const channelName = finalCustomName && finalCustomName.trim() ? finalCustomName.trim() : this.extractNameFromUrl(trimmedUrl);
        const nameOrUrl = `${channelName} ${trimmedUrl}`.toLowerCase();
        const isExplicitTv = nameOrUrl.includes('tv') || trimmedUrl.toLowerCase().includes('.m3u8') || trimmedUrl.toLowerCase().includes('.mp4');
        const isAudio = !isExplicitTv && (streamInfo.isAudio || trimmedUrl.toLowerCase().includes('radio'));
        const groupTitle = isAudio ? 'Radio Online' : 'Emisión HLS en Vivo';
        const singleChannel: Channel = {
          id: `${sourceId}_ch_0`,
          sourceId,
          name: channelName,
          streamUrl: trimmedUrl,
          groupTitle,
          country: 'Perú',
          ambit: groupTitle,
          tags: [isAudio ? 'Radio' : 'TV', 'Directo', 'HLS'],
          mediaType: isAudio ? 'radio' : 'live_tv',
          isFavorite: false,
        };
        return { channels: [singleChannel], categories: [groupTitle], type: 'stream' };
      } else {
        // Fallback: tratar como stream directo individual si la URL es válida
        const channelName = finalCustomName && finalCustomName.trim() ? finalCustomName.trim() : this.extractNameFromUrl(trimmedUrl);
        const nameOrUrl = `${channelName} ${trimmedUrl}`.toLowerCase();
        const isExplicitTv = nameOrUrl.includes('tv') || trimmedUrl.toLowerCase().includes('.m3u8') || trimmedUrl.toLowerCase().includes('.mp4');
        const isAudio = !isExplicitTv && (streamInfo.isAudio || trimmedUrl.toLowerCase().includes('radio'));
        const groupTitle = isAudio ? 'Radio Online' : 'Streams Directos';
        const singleChannel: Channel = {
          id: `${sourceId}_ch_0`,
          sourceId,
          name: channelName,
          streamUrl: trimmedUrl,
          groupTitle,
          country: 'Online',
          ambit: groupTitle,
          tags: [isAudio ? 'Radio' : 'TV', 'Directo'],
          mediaType: isAudio ? 'radio' : 'live_tv',
          isFavorite: false,
        };
        return { channels: [singleChannel], categories: [groupTitle], type: 'stream' };
      }
    } catch (err: any) {
      clearTimeout(timeoutId);

      const isM3u8OrStream =
        trimmedUrl.toLowerCase().includes('.m3u8') ||
        trimmedUrl.toLowerCase().includes('.m3u') ||
        trimmedUrl.toLowerCase().includes(':') ||
        trimmedUrl.toLowerCase().includes('/live') ||
        trimmedUrl.toLowerCase().includes('/stream') ||
        trimmedUrl.toLowerCase().includes('/playlist') ||
        trimmedUrl.toLowerCase().includes('bitel.com');

      // Si falló por 403 (restricción de Referer/Hotlink de la CDN), timeout o CORS,
      // pero la URL es un stream directo multimedia válido (.m3u8, etc.):
      if (isM3u8OrStream) {
        console.warn(`[IPTVService] Fetch directo falló (${err.message}), pero la URL es un stream multimedia válido. Se indexa como Stream Directo.`);
        const channelName = finalCustomName && finalCustomName.trim() ? finalCustomName.trim() : this.extractNameFromUrl(trimmedUrl);
        const nameOrUrl = `${channelName} ${trimmedUrl}`.toLowerCase();
        const isExplicitTv = nameOrUrl.includes('tv') || trimmedUrl.toLowerCase().includes('.m3u8') || trimmedUrl.toLowerCase().includes('.mp4');
        const isAudio = !isExplicitTv && (streamInfo.isAudio || trimmedUrl.toLowerCase().includes('radio'));
        const groupTitle = isAudio ? 'Radio Online' : 'Emisión HLS en Vivo';
        const singleChannel: Channel = {
          id: `${sourceId}_ch_0`,
          sourceId,
          name: channelName,
          streamUrl: trimmedUrl,
          groupTitle,
          country: 'Perú',
          ambit: groupTitle,
          tags: [isAudio ? 'Radio' : 'TV', 'Directo', 'HLS'],
          mediaType: isAudio ? 'radio' : 'live_tv',
          isFavorite: false,
        };
        return { channels: [singleChannel], categories: [groupTitle], type: 'stream' };
      }

      throw err;
    }
  }

  private static extractNameFromUrl(url: string): string {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.replace(/\/$/, '');
      const lastPart = pathname.substring(pathname.lastIndexOf('/') + 1);
      if (lastPart && lastPart.length > 2 && !lastPart.includes('.')) {
        return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
      }
      return parsed.hostname.replace('www.', '');
    } catch (e) {
      return 'Stream Directo';
    }
  }

  /**
   * Agrega una nueva fuente (M3U, JSON o Stream Directo)
   */
  public static async addSource(name: string, url: string): Promise<{ source: Source; channels: Channel[] }> {
    const { resolvedUrl, resolvedName } = this.normalizeAndResolveUrl(url, name);
    const sources = await StorageService.getSources();
    const sourceId = `src_${Date.now()}`;

    const { channels, type } = await this.fetchAndParse(resolvedUrl, sourceId, resolvedName || name);

    let defaultName = 'Fuente Multimedia';
    if (type === 'stream') defaultName = channels[0]?.name || 'Stream Directo';
    else if (type === 'json') defaultName = 'Lista JSON';
    else if (type === 'm3u') defaultName = resolvedName || 'Lista M3U';

    const newSource: Source = {
      id: sourceId,
      name: name.trim() || resolvedName || defaultName,
      url: resolvedUrl,
      type,
      isActive: true,
      channelCount: channels.length,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const updatedSources = [newSource, ...sources];
    await StorageService.saveSources(updatedSources);

    // Guardar canales indexados específicamente para esta fuente
    await StorageService.saveSourceChannels(sourceId, channels);

    return { source: newSource, channels };
  }

  /**
   * Refresca una fuente existente descargando su contenido nuevamente
   */
  public static async refreshSource(sourceId: string): Promise<Source> {
    const sources = await StorageService.getSources();
    const sourceIndex = sources.findIndex((s) => s.id === sourceId);
    if (sourceIndex === -1) throw new Error('Fuente no encontrada.');

    const source = sources[sourceIndex];
    const { channels, type } = await this.fetchAndParse(source.url, source.id);

    const updatedSource: Source = {
      ...source,
      type,
      channelCount: channels.length,
      lastUpdated: new Date().toISOString(),
    };

    sources[sourceIndex] = updatedSource;
    await StorageService.saveSources(sources);

    // Re-indexar canales de esta fuente en su almacenamiento aislado
    await StorageService.saveSourceChannels(sourceId, channels);

    return updatedSource;
  }

  /**
   * Elimina una fuente y sus canales indexados correspondientes
   */
  public static async deleteSource(sourceId: string): Promise<void> {
    const sources = await StorageService.getSources();
    const filteredSources = sources.filter((s) => s.id !== sourceId);
    await StorageService.saveSources(filteredSources);

    // Eliminar el índice aislado de canales de esta fuente
    await StorageService.deleteSourceChannels(sourceId);
  }

  /**
   * Renombra una fuente existente
   */
  public static async renameSource(sourceId: string, newName: string): Promise<void> {
    const sources = await StorageService.getSources();
    const updated = sources.map((s) => (s.id === sourceId ? { ...s, name: newName.trim() } : s));
    await StorageService.saveSources(updated);
  }

  /**
   * Activa o desactiva una fuente
   */
  public static async toggleSourceActive(sourceId: string): Promise<boolean> {
    const sources = await StorageService.getSources();
    let newStatus = false;
    const updated = sources.map((s) => {
      if (s.id === sourceId) {
        newStatus = !s.isActive;
        return { ...s, isActive: newStatus };
      }
      return s;
    });
    await StorageService.saveSources(updated);
    return newStatus;
  }

  /**
   * Obtiene todos los canales de las fuentes activas
   */
  public static async getActiveChannels(): Promise<Channel[]> {
    const sources = await StorageService.getSources();
    const activeSources = sources.filter((s) => s.isActive);
    const results = await Promise.all(
      activeSources.map(async (s) => {
        const chans = await StorageService.getSourceChannels(s.id);
        if (chans.length > 0) return chans;
        // Fallback si venía de versión previa en array global
        const legacyChans = await StorageService.getChannels();
        return legacyChans.filter((c) => c.sourceId === s.id);
      })
    );
    return results.flat();
  }
}
