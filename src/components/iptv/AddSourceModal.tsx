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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lista de fuentes demo y oficiales recomendadas (M3U, JSON, IPTV-Org y Streams Directos)
  const DEMO_SOURCES = [
    {
      name: 'IPTV-Org Perú (190+ Canales Abiertos)',
      url: 'https://iptv-org.github.io/iptv/countries/pe.m3u',
      desc: 'Canales nacionales y regionales de Perú (América, Latina, ATV, Bitel TV, Panamericana).',
      type: 'M3U (PE)',
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
      name: 'Deeva Radio ItaloPower (Stream Radio Directo)',
      url: 'https://stream.deevaradio.net:10443/italopower',
      desc: 'Transmisión continua de radio online en vivo (Icecast / Shoutcast directo en alta fidelidad).',
      type: 'STREAM',
    },
    {
      name: 'TDTChannels TV (España / Abierto)',
      url: 'https://www.tdtchannels.com/lists/tv.json',
      desc: 'Formato JSON oficial con canales generalistas, autonómicos e informativos en abierto.',
      type: 'JSON',
    },
    {
      name: 'IPTV-Org Música en Vivo (M3U)',
      url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
      desc: 'Más de 700 canales de videoclips, conciertos y música de todos los géneros.',
      type: 'M3U',
    },
    {
      name: 'IPTV-Org Mundial por Países (M3U)',
      url: 'https://iptv-org.github.io/iptv/index.country.m3u',
      desc: 'Índice global oficial con más de 10,000 canales estructurados por país.',
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

            {/* Sugerencias Demo Rápidas */}
            <Text style={styles.sectionSubtitle}>O probar con fuentes abiertas:</Text>
            {DEMO_SOURCES.map((demo, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.demoCard}
                onPress={() => handleSelectDemo(demo.url, demo.name)}
                activeOpacity={0.7}
              >
                <View style={styles.demoCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View
                      style={{
                        backgroundColor: demo.type === 'JSON' ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 145, 0, 0.2)',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        marginRight: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: demo.type === 'JSON' ? AutoTheme.colors.primary : AutoTheme.colors.secondary,
                          fontSize: 10,
                          fontWeight: '800',
                        }}
                      >
                        {demo.type}
                      </Text>
                    </View>
                    <Text style={styles.demoCardTitle} numberOfLines={1}>
                      {demo.name}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={20} color={AutoTheme.colors.primary} />
                </View>
                <Text style={styles.demoCardDesc}>{demo.desc}</Text>
              </TouchableOpacity>
            ))}
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
    marginBottom: 4,
  },
  demoCardTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  demoCardDesc: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
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
