import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AutoTheme } from '../../core/theme';
import { IPTVService } from '../../services/iptvService';
import * as Haptics from 'expo-haptics';

interface AddSourceModalProps {
  visible: boolean;
  onClose: () => void;
  onSourceAdded: () => void;
}

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
  visible,
  onClose,
  onSourceAdded,
}) => {
  const [name, setName] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSourceUrl, setLoadingSourceUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lista de fuentes demo y oficiales sincronizadas con LISTS.md
  const DEMO_SOURCES = [
    {
      name: 'IPTV-Org Perú (190+ Canales Abiertos)',
      url: 'https://iptv-org.github.io/iptv/countries/pe.m3u',
      desc: 'Canales nacionales y regionales de Perú (América, Latina, ATV, Bitel TV, Panamericana).',
      type: 'M3U (PE)',
    },
    {
      name: 'Latina Televisión en Vivo (HLS Directo)',
      url: 'https://redirector.rudo.video/hls-video/567ffde3fa319fadf3419efda25619456231dfea/latina/latina.smil/playlist.m3u8',
      desc: 'Transmisión oficial de Latina TV Perú en directo y alta resolución.',
      type: 'STREAM (PE)',
    },
    {
      name: 'Exitosa Noticias TV (HLS Directo)',
      url: 'https://luna-4-video.mediaserver.digital/exitosatv_233b-4b49-a726-5a451262/index.m3u8',
      desc: 'Canal informativo peruano en vivo con noticias y debate en tiempo real.',
      type: 'STREAM (PE)',
    },
    {
      name: 'Teleonline TV (JSON Multi-Canal)',
      url: 'https://raw.githubusercontent.com/teleonline/listas/main/tv.json',
      desc: 'Lista estructurada en JSON con decenas de canales en vivo y categorizados.',
      type: 'JSON',
    },
    {
      name: 'TDTChannels TV (España y Abierto)',
      url: 'https://www.tdtchannels.com/lists/tv.json',
      desc: 'Formato JSON oficial con canales generalistas, autonómicos e informativos.',
      type: 'JSON',
    },
    {
      name: 'IPTV-Org Latinoamérica (2,300+ Canales)',
      url: 'https://iptv-org.github.io/iptv/regions/latam.m3u',
      desc: 'Emisiones abiertas en español de toda la región (Perú, Argentina, Colombia, México, etc.).',
      type: 'M3U (LATAM)',
    },
    {
      name: 'IPTV-Org Autos & Motor (Especial AutoLari)',
      url: 'https://iptv-org.github.io/iptv/categories/auto.m3u',
      desc: 'Programas de automovilismo, carreras y tecnología vehicular para tu pantalla en el auto.',
      type: 'M3U (AUTO)',
    },
    {
      name: 'Deeva Radio ItaloPower (Stream Radio)',
      url: 'https://stream.deevaradio.net:10443/italopower',
      desc: 'Transmisión continua de radio online en vivo (Icecast directo en alta fidelidad).',
      type: 'STREAM',
    },
    {
      name: 'IPTV-Org Música en Vivo (M3U)',
      url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
      desc: 'Más de 700 canales de videoclips, conciertos y música de todos los géneros.',
      type: 'M3U (MÚSICA)',
    },
    {
      name: 'IPTV-Org Deportes (M3U)',
      url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
      desc: 'Transmisiones deportivas abiertas de todo el mundo.',
      type: 'M3U (DEPORTES)',
    },
    {
      name: 'IPTV-Org Noticias Globales (M3U)',
      url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
      desc: 'Canales de noticias 24/7 internacionales en español e inglés.',
      type: 'M3U (NOTICIAS)',
    },
    {
      name: 'IPTV-Org Mundial Completo (M3U)',
      url: 'https://iptv-org.github.io/iptv/index.m3u',
      desc: 'Índice global oficial con más de 10,000 canales estructurados.',
      type: 'M3U (GLOBAL)',
    },
  ];

  const handleSubmit = async () => {
    if (!url.trim()) {
      setErrorMsg('Por favor introduce una URL válida (M3U, JSON o Stream directo).');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await IPTVService.addSource(name.trim() || '', url.trim());
      setName('');
      setUrl('');
      onSourceAdded();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error desconocido al procesar la fuente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (demoUrl: string, demoName: string) => {
    setName(demoName);
    setUrl(demoUrl);
    setErrorMsg(null);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddDirect = async (demoUrl: string, demoName: string) => {
    try {
      setLoading(true);
      setLoadingSourceUrl(demoUrl);
      setErrorMsg(null);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await IPTVService.addSource(demoName, demoUrl);
      setName('');
      setUrl('');
      onSourceAdded();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la fuente seleccionada.');
    } finally {
      setLoading(false);
      setLoadingSourceUrl(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons
                name="playlist-plus"
                size={26}
                color={AutoTheme.colors.primary}
              />
              <Text style={styles.title}>Añadir Fuente Multimedia</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={AutoTheme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Disclaimer Legal */}
            <View style={styles.legalBanner}>
              <Ionicons name="shield-checkmark" size={18} color={AutoTheme.colors.accentGreen} />
              <Text style={styles.legalText}>
                Admite Playlists M3U/M3U8, Listas JSON (TDTChannels) o URLs de Stream directo (Radio online, MP3, MP4, HLS).
              </Text>
            </View>

            {errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={AutoTheme.colors.accentRed} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Inputs */}
            <Text style={styles.inputLabel}>Nombre de la Fuente o Emisora</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Deeva Radio, TDT España o Mi Canal"
              placeholderTextColor={AutoTheme.colors.textTertiary}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>URL de la Fuente (M3U, JSON o Stream Directo) *</Text>
            <TextInput
              style={[styles.input, styles.urlInput]}
              placeholder="https://... (.json, .m3u8, stream de radio, mp3, mp4)"
              placeholderTextColor={AutoTheme.colors.textTertiary}
              value={url}
              onChangeText={(text) => {
                setUrl(text);
                setErrorMsg(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            {/* Banner de Detección Inteligente IPTV-Org */}
            {(url.toLowerCase().includes('github.com/iptv-org') ||
              url.toLowerCase().includes('playlists.md') ||
              url.toLowerCase().includes('iptv-org.github.io')) && (
              <View style={styles.iptvOrgBanner}>
                <Ionicons name="sparkles" size={16} color={AutoTheme.colors.primary} />
                <Text style={styles.iptvOrgBannerText}>
                  {url.toLowerCase().includes('playlists.md') || url.toLowerCase().includes('github.com/iptv-org')
                    ? '⚡ Enlace de IPTV-Org detectado: AutoLari convertirá este catálogo a la lista M3U oficial indexada por países.'
                    : '⚡ Fuente oficial de IPTV-Org detectada: Compatible con filtros por país, categoría y búsqueda instantánea.'}
                </Text>
              </View>
            )}

            {/* Sugerencias Demo Rápidas con Doble Acción */}
            <Text style={styles.sectionSubtitle}>Fuentes abiertas y canales sugeridos:</Text>
            {DEMO_SOURCES.map((demo, idx) => {
              const isThisLoading = loading && loadingSourceUrl === demo.url;
              const isPeru = demo.type.includes('PE');
              const isJson = demo.type === 'JSON';
              const isStream = demo.type.includes('STREAM');

              const badgeBg = isJson
                ? 'rgba(0, 229, 255, 0.15)'
                : isStream
                ? 'rgba(0, 230, 118, 0.15)'
                : isPeru
                ? 'rgba(255, 68, 68, 0.15)'
                : 'rgba(255, 145, 0, 0.15)';

              const badgeColor = isJson
                ? AutoTheme.colors.primary
                : isStream
                ? AutoTheme.colors.accentGreen
                : isPeru
                ? '#FF5252'
                : AutoTheme.colors.secondary;

              return (
                <View key={idx} style={styles.demoCard}>
                  <View style={styles.demoCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={[styles.demoTypeBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.demoTypeBadgeText, { color: badgeColor }]}>
                          {demo.type}
                        </Text>
                      </View>
                      <Text style={styles.demoCardTitle} numberOfLines={1}>
                        {demo.name}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.demoCardDesc}>{demo.desc}</Text>

                  {/* Dos botones de acción: Cargar vs Descargar y Procesar */}
                  <View style={styles.demoCardActions}>
                    <TouchableOpacity
                      style={styles.cardLoadBtn}
                      onPress={() => handleSelectDemo(demo.url, demo.name)}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="clipboard-outline" size={14} color={AutoTheme.colors.textSecondary} />
                      <Text style={styles.cardLoadBtnText}>Cargar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.cardDirectBtn,
                        isThisLoading && styles.cardDirectBtnLoading,
                        loading && !isThisLoading && styles.btnDisabled,
                      ]}
                      onPress={() => handleAddDirect(demo.url, demo.name)}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      {isThisLoading ? (
                        <>
                          <ActivityIndicator size="small" color="#000" />
                          <Text style={styles.cardDirectBtnText}>Procesando...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="cloud-download-outline" size={15} color="#000" />
                          <Text style={styles.cardDirectBtnText}>Descargar y procesar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Botones de Acción */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-download-outline" size={20} color="#000" />
                  <Text style={styles.saveBtnText}>Descargar y Procesar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: AutoTheme.colors.surface,
    borderTopLeftRadius: AutoTheme.borderRadius.xl,
    borderTopRightRadius: AutoTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
    maxHeight: '85%',
    padding: AutoTheme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: AutoTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AutoTheme.colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: AutoTheme.typography.sizes.lg,
    fontWeight: '800',
    color: '#FFF',
    marginLeft: 10,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    marginVertical: AutoTheme.spacing.md,
  },
  legalBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    padding: 12,
    borderRadius: AutoTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
    marginBottom: AutoTheme.spacing.md,
  },
  legalText: {
    flex: 1,
    fontSize: 11,
    color: '#D1FAE5',
    marginLeft: 8,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 51, 102, 0.12)',
    padding: 12,
    borderRadius: AutoTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: AutoTheme.colors.accentRed,
    marginBottom: AutoTheme.spacing.md,
  },
  errorText: {
    flex: 1,
    color: AutoTheme.colors.accentRed,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  iptvOrgBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderRadius: AutoTheme.borderRadius.md,
    padding: 10,
    marginBottom: AutoTheme.spacing.md,
  },
  iptvOrgBannerText: {
    color: AutoTheme.colors.primary,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
    fontWeight: '600',
  },
  inputLabel: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: AutoTheme.colors.surfaceCard,
    borderRadius: AutoTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
    color: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  urlInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },
  sectionSubtitle: {
    color: AutoTheme.colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  demoCard: {
    backgroundColor: AutoTheme.colors.surfaceElevated,
    borderRadius: AutoTheme.borderRadius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
  },
  demoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  demoTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  demoTypeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  demoCardTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  demoCardDesc: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  demoCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
    gap: 8,
  },
  cardLoadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutoTheme.colors.surfaceCard,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: AutoTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
    gap: 5,
  },
  cardLoadBtnText: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  cardDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutoTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: AutoTheme.borderRadius.sm,
    gap: 6,
  },
  cardDirectBtnLoading: {
    opacity: 0.85,
  },
  cardDirectBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: AutoTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: AutoTheme.colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
    borderRadius: AutoTheme.borderRadius.md,
    backgroundColor: AutoTheme.colors.surfaceElevated,
  },
  cancelBtnText: {
    color: AutoTheme.colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AutoTheme.colors.primary,
    paddingVertical: 14,
    borderRadius: AutoTheme.borderRadius.md,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
