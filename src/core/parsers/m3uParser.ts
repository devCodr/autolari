import { Channel, MediaType } from '../types';

export interface ParseM3UResult {
  channels: Channel[];
  categories: string[];
  totalCount: number;
}

export class M3UParser {
  /**
   * Parsea el contenido raw de un archivo o stream M3U / M3U8
   * Optimizado con regex y escaneo lineal para procesar 10.000+ canales en milisegundos.
   */
  public static parse(content: string, sourceId: string): ParseM3UResult {
    if (!content || !content.includes('#EXTM3U') && !content.includes('#EXTINF')) {
      throw new Error('El archivo suministrado no tiene un formato M3U o M3U8 válido.');
    }

    const lines = content.split(/\r?\n/);
    const channels: Channel[] = [];
    const categoriesSet = new Set<string>();

    let currentTvgId: string | undefined;
    let currentTvgName: string | undefined;
    let currentLogo: string | undefined;
    let currentCountry: string | undefined;
    let currentGroup: string = 'General';
    let currentName: string = '';
    let isRadio: boolean = false;

    const COUNTRY_CODES: Record<string, string> = {
      pe: 'Perú',
      es: 'España',
      mx: 'México',
      ar: 'Argentina',
      co: 'Colombia',
      cl: 'Chile',
      us: 'Estados Unidos',
      ec: 'Ecuador',
      bo: 'Bolivia',
      br: 'Brasil',
      ve: 'Venezuela',
      uy: 'Uruguay',
      py: 'Paraguay',
      cr: 'Costa Rica',
      pa: 'Panamá',
      gt: 'Guatemala',
      hn: 'Honduras',
      sv: 'El Salvador',
      ni: 'Nicaragua',
      do: 'República Dominicana',
      pr: 'Puerto Rico',
      fr: 'Francia',
      it: 'Italia',
      de: 'Alemania',
      uk: 'Reino Unido',
      ca: 'Canadá',
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) continue;

      if (line.startsWith('#EXTINF:')) {
        // Reset per-channel temp attributes
        currentTvgId = undefined;
        currentTvgName = undefined;
        currentLogo = undefined;
        currentCountry = undefined;
        currentGroup = 'General';
        currentName = '';
        isRadio = false;

        // Extraer atributos estándar
        const tvgIdMatch = line.match(/tvg-id=["']?([^"']+)["']?/i);
        if (tvgIdMatch) {
          currentTvgId = tvgIdMatch[1].trim();
          // Detectar código de país en tvg-id (ej: Canal.pe@SD -> pe -> Perú)
          const ccMatch = currentTvgId.match(/\.([a-z]{2})@/i);
          if (ccMatch) {
            const cc = ccMatch[1].toLowerCase();
            if (COUNTRY_CODES[cc]) currentCountry = COUNTRY_CODES[cc];
          }
        }

        const tvgCountryMatch = line.match(/tvg-country=["']?([^"']+)["']?/i);
        if (tvgCountryMatch) {
          const rawCc = tvgCountryMatch[1].trim().toLowerCase();
          currentCountry = COUNTRY_CODES[rawCc] || tvgCountryMatch[1].trim();
        }

        const tvgNameMatch = line.match(/tvg-name=["']?([^"']+)["']?/i);
        if (tvgNameMatch) currentTvgName = tvgNameMatch[1].trim();

        const logoMatch = line.match(/tvg-logo=["']?([^"']+)["']?/i);
        if (logoMatch) currentLogo = logoMatch[1].trim();

        const groupMatch = line.match(/group-title=["']?([^"']+)["']?/i);
        if (groupMatch && groupMatch[1].trim()) {
          currentGroup = groupMatch[1].trim();
          // Si el group-title es el nombre de un país (como en index.country.m3u de IPTV-Org)
          if (!currentCountry) {
            const grpLower = currentGroup.toLowerCase();
            for (const [code, cName] of Object.entries(COUNTRY_CODES)) {
              if (grpLower.includes(cName.toLowerCase()) || grpLower === code) {
                currentCountry = cName;
                break;
              }
            }
          }
        }

        const radioAttrMatch = line.match(/radio=["']?(true|1)["']?/i);
        if (radioAttrMatch) {
          isRadio = true;
        }

        // Nombre visible del canal (después de la última coma)
        const commaIdx = line.lastIndexOf(',');
        if (commaIdx !== -1) {
          currentName = line.substring(commaIdx + 1).trim();
        }

        if (!currentName && currentTvgName) {
          currentName = currentTvgName;
        }

        if (!currentName) {
          currentName = `Canal ${channels.length + 1}`;
        }

        // Si la categoría contiene "radio" o "audio", marcar como radio
        if (currentGroup.toLowerCase().includes('radio') || currentGroup.toLowerCase().includes('audio')) {
          isRadio = true;
        }
      } else if (!line.startsWith('#')) {
        // Es la URL del stream
        const streamUrl = line.trim();
        if (streamUrl.startsWith('http://') || streamUrl.startsWith('https://') || streamUrl.startsWith('rtmp://')) {
          const lowerUrl = streamUrl.toLowerCase();
          let mediaType: MediaType = 'live_tv';

          if (isRadio || lowerUrl.endsWith('.mp3') || lowerUrl.endsWith('.aac') || lowerUrl.endsWith('.ogg') || lowerUrl.includes('/radio')) {
            mediaType = 'radio';
          } else if (lowerUrl.includes('.mp4') || lowerUrl.includes('.mkv')) {
            mediaType = 'vod';
          } else {
            mediaType = 'live_tv';
          }

          const channelId = `${sourceId}_ch_${channels.length}_${Date.now() % 10000}`;
          const tagsList: string[] = [currentGroup, mediaType === 'radio' ? 'Radio' : 'TV'];
          if (currentCountry) {
            tagsList.push(currentCountry);
          }

          const chan: Channel = {
            id: channelId,
            sourceId,
            name: currentName || `Canal ${channels.length + 1}`,
            streamUrl,
            groupTitle: currentGroup,
            ambit: currentGroup,
            country: currentCountry || currentGroup,
            tags: tagsList,
            mediaType,
            isFavorite: false,
          };

          // Evitar propiedades undefined para almacenamiento compacto
          if (currentLogo) chan.logoUrl = currentLogo;
          if (currentTvgId) chan.tvgId = currentTvgId;
          if (currentTvgName) chan.tvgName = currentTvgName;

          channels.push(chan);
          categoriesSet.add(currentGroup);
        }
      }
    }

    return {
      channels,
      categories: Array.from(categoriesSet).sort(),
      totalCount: channels.length,
    };
  }
}
