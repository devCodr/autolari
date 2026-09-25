import { Channel, MediaType } from '../types';
import { normalizeSearchText, parseCountryName } from '../utils/search';

export interface ParseJSONResult {
  channels: Channel[];
  categories: string[];
  totalCount: number;
}

export class JSONParser {
  /**
   * Parsea contenido JSON de fuentes de televisión y radio como TDTChannels,
   * Teleonline o listas abiertas estructuradas.
   * Indexa el 100% de los canales con URLs disponibles.
   */
  public static parse(content: string, sourceId: string): ParseJSONResult {
    let data: any;
    try {
      data = JSON.parse(content);
    } catch (e: any) {
      throw new Error('El archivo no contiene un formato JSON válido.');
    }

    const channels: Channel[] = [];
    const categoriesSet = new Set<string>();

    // 1. Estructura de TDTChannels / Teleonline (countries -> ambits -> channels -> options)
    if (data && Array.isArray(data.countries)) {
      for (const country of data.countries) {
        const countryRaw = country.name || '';
        const { fullName: countryName, cleanName: countryClean, flag: countryFlag } = parseCountryName(countryRaw);
        const ambits = Array.isArray(country.ambits) ? country.ambits : [];

        for (const ambit of ambits) {
          const ambitRaw = ambit.name ? ambit.name.trim() : '';
          // Si el ámbito es vacío, la categoría es el país (ej. "Perú")
          const groupTitle = ambitRaw || countryName || 'General';
          const chanList = Array.isArray(ambit.channels) ? ambit.channels : [];

          for (const item of chanList) {
            const options = Array.isArray(item.options) ? item.options : [];

            // Aceptar cualquier opción que tenga una URL http/https válida
            // Prioridad: 1) m3u8 directo, 2) stream/mp4, 3) primera opción válida
            const validOption =
              options.find((opt: any) => opt && opt.url && typeof opt.url === 'string' && (opt.format === 'm3u8' || opt.url.toLowerCase().includes('.m3u8'))) ||
              options.find((opt: any) => opt && opt.url && typeof opt.url === 'string' && opt.url.startsWith('http')) ||
              null;

            if (validOption && validOption.url) {
              const streamUrl = validOption.url.trim();
              const lowerUrl = streamUrl.toLowerCase();
              let mediaType: MediaType = 'live_tv';

              if (
                validOption.format === 'mp3' ||
                validOption.format === 'aac' ||
                lowerUrl.endsWith('.mp3') ||
                lowerUrl.endsWith('.aac') ||
                lowerUrl.includes('/radio') ||
                groupTitle.toLowerCase().includes('radio')
              ) {
                mediaType = 'radio';
              }

              // Generar tags completos para que el buscador encuentre sin importar acentos o mayúsculas
              const tagsList: string[] = [];
              if (countryName) {
                tagsList.push(countryName);
                if (countryClean && countryClean !== countryName.toLowerCase()) {
                  tagsList.push(countryClean);
                }
              }
              if (countryFlag) tagsList.push(countryFlag);
              if (countryRaw) tagsList.push(countryRaw);

              if (ambitRaw) tagsList.push(ambitRaw);
              if (groupTitle && groupTitle !== countryName) tagsList.push(groupTitle);

              if (Array.isArray(item.extra_info)) {
                item.extra_info.forEach((tag: any) => {
                  if (typeof tag === 'string' && tag.trim()) tagsList.push(tag.trim());
                });
              }

              if (validOption.lang) tagsList.push(validOption.lang.toUpperCase());
              if (validOption.res) tagsList.push(`${validOption.res}p`);
              tagsList.push(mediaType === 'radio' ? 'Radio' : 'TV');

              // Añadir versión normalizada del nombre del canal para búsqueda infalible
              if (item.name) {
                tagsList.push(normalizeSearchText(item.name));
              }

              const channelId = `${sourceId}_ch_${channels.length}_${Date.now() % 10000}`;

              channels.push({
                id: channelId,
                sourceId,
                name: item.name ? item.name.trim() : `Canal ${channels.length + 1}`,
                streamUrl,
                logoUrl: item.logo || undefined,
                groupTitle,
                country: countryName || undefined,
                ambit: ambitRaw || groupTitle,
                tags: Array.from(new Set(tagsList.filter(Boolean))),
                tvgId: item.epg_id || undefined,
                mediaType,
                isFavorite: false,
              });

              categoriesSet.add(groupTitle);
            }
          }
        }
      }
    }
    // 2. Estructura de objeto con propiedad "channels" plana: { channels: [...] }
    else if (data && Array.isArray(data.channels)) {
      this.parseFlatArray(data.channels, sourceId, channels, categoriesSet);
    }
    // 3. Array plano directo: [ { name, url, ... } ]
    else if (Array.isArray(data)) {
      this.parseFlatArray(data, sourceId, channels, categoriesSet);
    } else {
      throw new Error('Estructura JSON no reconocida. Asegúrate de usar formato TDTChannels o lista de canales estándar.');
    }

    if (channels.length === 0) {
      throw new Error('No se encontraron canales con URLs de reproducción válidas en el JSON.');
    }

    return {
      channels,
      categories: Array.from(categoriesSet).sort(),
      totalCount: channels.length,
    };
  }

  private static parseFlatArray(
    items: any[],
    sourceId: string,
    channels: Channel[],
    categoriesSet: Set<string>
  ) {
    for (const item of items) {
      const url = item.url || item.streamUrl || item.stream || (Array.isArray(item.options) && item.options[0]?.url);
      if (url && typeof url === 'string') {
        const streamUrl = url.trim();
        const groupTitle = item.groupTitle || item.category || item.group || 'General';
        const lowerUrl = streamUrl.toLowerCase();
        let mediaType: MediaType = 'live_tv';

        if (
          lowerUrl.endsWith('.mp3') ||
          lowerUrl.endsWith('.aac') ||
          lowerUrl.includes('/radio') ||
          item.type === 'radio' ||
          groupTitle.toLowerCase().includes('radio')
        ) {
          mediaType = 'radio';
        }

        const { fullName: countryName, cleanName: countryClean } = parseCountryName(item.country);
        const tagsList: string[] = [];
        if (countryName) {
          tagsList.push(countryName);
          if (countryClean) tagsList.push(countryClean);
        }
        if (groupTitle && groupTitle !== 'General') tagsList.push(groupTitle);
        if (Array.isArray(item.tags)) {
          item.tags.forEach((t: any) => typeof t === 'string' && tagsList.push(t));
        }
        if (item.language) tagsList.push(item.language.toUpperCase());
        tagsList.push(mediaType === 'radio' ? 'Radio' : 'TV');
        if (item.name) tagsList.push(normalizeSearchText(item.name));

        const channelId = `${sourceId}_ch_${channels.length}_${Date.now() % 10000}`;

        channels.push({
          id: channelId,
          sourceId,
          name: item.name || item.title || `Canal ${channels.length + 1}`,
          streamUrl,
          logoUrl: item.logo || item.logoUrl || item.icon || undefined,
          groupTitle,
          country: countryName || undefined,
          ambit: item.ambit || groupTitle,
          tags: Array.from(new Set(tagsList.filter(Boolean))),
          tvgId: item.epg_id || item.tvgId || undefined,
          mediaType,
          isFavorite: false,
        });

        categoriesSet.add(groupTitle);
      }
    }
  }
}
