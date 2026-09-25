/**
 * Utilidades para búsqueda e indexación de canales
 * Normaliza cadenas eliminando diacríticos/acentos, emojis y caracteres especiales.
 */

export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes (á->a, é->e, ú->u, etc.)
    .toLowerCase()
    .trim();
}

/**
 * Limpia el nombre del país separando emojis de bandera del nombre de texto.
 * Ej: "🇵🇪 Perú" -> { name: "Perú", cleanName: "Peru", flag: "🇵🇪" }
 */
export function parseCountryName(rawCountry: string | null | undefined): {
  fullName: string;
  cleanName: string;
  flag?: string;
} {
  if (!rawCountry) {
    return { fullName: '', cleanName: '' };
  }

  const trimmed = rawCountry.trim();
  // Detectar emojis de bandera (rango regional indicator o emojis estándar)
  const flagMatch = trimmed.match(/^([\uD83C][\uDDE6-\uDDFF]){2}/);
  const flag = flagMatch ? flagMatch[0] : undefined;
  const nameOnly = flag ? trimmed.replace(flag, '').trim() : trimmed;
  const cleanName = normalizeSearchText(nameOnly);

  return {
    fullName: nameOnly || trimmed,
    cleanName: cleanName || normalizeSearchText(trimmed),
    flag,
  };
}
