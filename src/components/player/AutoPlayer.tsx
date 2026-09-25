import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  useWindowDimensions,
  Platform,
  Animated,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Channel } from '../../core/types';
import { AutoTheme } from '../../core/theme';
import { FavoritesService, HistoryService } from '../../services/favoritesService';

interface AutoPlayerProps {
  channel: Channel;
  isCarMode?: boolean;
  onClose?: () => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
}

export const AutoPlayer: React.FC<AutoPlayerProps> = ({
  channel,
  isCarMode = false,
  onClose,
  onNextChannel,
  onPrevChannel,
}) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [hasError, setHasError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<any>(null);
  const isRadio = channel.mediaType === 'radio';

  // Referencias para reproducción Hls.js y Audio en Web
  const webVideoRef = useRef<any>(null);
  const webAudioRef = useRef<any>(null);
  const hlsRef = useRef<any>(null);
  const [isPlayingWeb, setIsPlayingWeb] = useState<boolean>(true);

  // Animación para el visualizador de audio en modo radio
  const waveAnim = useRef(new Animated.Value(0.4)).current;

  // Inicializar expo-video player para iOS / Android
  const player = useVideoPlayer(channel.streamUrl, (p) => {
    p.loop = true;
    p.play();
  });

  // Reproductor HLS web optimizado con hls.js para navegadores (Chrome, Edge, Firefox, etc.)
  useEffect(() => {
    if (Platform.OS !== 'web' || channel.mediaType === 'radio') return;

    const video = webVideoRef.current;
    if (!video) return;

    const streamUrl = channel.streamUrl;
    setHasError(null);

    // Destruir instancia previa de Hls si existe
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch (e) {}
      hlsRef.current = null;
    }

    let HlsModule: any = null;
    try {
      HlsModule = require('hls.js');
      if (HlsModule && HlsModule.default) HlsModule = HlsModule.default;
    } catch (e) {
      console.warn('[AutoPlayer] Error cargando hls.js:', e);
    }

    const isHls = streamUrl.toLowerCase().includes('.m3u8') || streamUrl.toLowerCase().includes('.m3u');

    if (isHls && HlsModule && HlsModule.isSupported && HlsModule.isSupported()) {
      const hls = new HlsModule({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
        video.play().catch((playErr: any) => {
          console.log('[AutoPlayer Web] Autoplay bloqueado por el navegador. Intentando en silencio...', playErr);
          video.muted = true;
          video.play().catch(() => {});
        });
      });

      hls.on(HlsModule.Events.ERROR, (event: any, data: any) => {
        if (data.fatal) {
          console.warn('[AutoPlayer Web] HLS fatal error:', data.type, data.details);
          switch (data.type) {
            case HlsModule.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case HlsModule.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setHasError('Error al decodificar la señal HLS.');
              try { hls.destroy(); } catch (e) {}
              break;
          }
        }
      });
    } else if (video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari nativo macOS / iOS Web
      video.src = streamUrl;
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    } else {
      // Archivo de video directo (MP4, WebM)
      video.src = streamUrl;
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    }

    const onPlay = () => setIsPlayingWeb(true);
    const onPause = () => setIsPlayingWeb(false);
    const onError = () => setHasError('No se pudo reproducir este flujo de video.');

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('error', onError);
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (e) {}
        hlsRef.current = null;
      }
    };
  }, [channel.streamUrl, channel.mediaType, retryCount]);

  // Reproductor nativo HTML5 Audio en Web para radios en vivo (Icecast, Shoutcast, MP3, AAC)
  useEffect(() => {
    if (Platform.OS !== 'web' || channel.mediaType !== 'radio') return;

    const audio = webAudioRef.current;
    if (!audio) return;

    setHasError(null);
    audio.src = channel.streamUrl;
    audio.load();
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlayingWeb(true))
        .catch((playErr: any) => {
          console.log('[AutoPlayer Web Audio] Autoplay bloqueado por navegador:', playErr);
          setIsPlayingWeb(false);
        });
    }

    const onPlay = () => setIsPlayingWeb(true);
    const onPause = () => setIsPlayingWeb(false);
    const onError = () => setHasError('No se pudo conectar a la transmisión de radio.');

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      try {
        audio.pause();
        audio.src = '';
      } catch (e) {}
    };
  }, [channel.streamUrl, channel.mediaType, retryCount]);

  // Animación de onda de radio (useNativeDriver solo en nativo, no en web)
  useEffect(() => {
    if (channel.mediaType === 'radio') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(waveAnim, {
            toValue: 0.3,
            duration: 700,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      ).start();
    }
  }, [channel.mediaType]);

  // Cargar estado de favorito, registrar en historial y activar autoplay inmediato
  useEffect(() => {
    FavoritesService.isFavorite(channel.id).then(setIsFavorite);
    HistoryService.recordPlayback(channel);
    setHasError(null);
    setRetryCount(0);

    // Auto-reproducir inmediatamente en expo-video (iOS / Android)
    if (Platform.OS !== 'web') {
      try {
        player.replace(channel.streamUrl);
        player.play();
      } catch (e) {
        console.log('[AutoPlayer] Autoplay error:', e);
      }
    }
  }, [channel]);

  // Auto-ocultar controles después de 4.5 segundos solo en modo video (en radio se mantienen siempre visibles)
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (!isCarMode && !isRadio) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 4500);
    }
  };

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isCarMode, isRadio]);

  const togglePlay = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (Platform.OS === 'web') {
      const media = channel.mediaType === 'radio' ? webAudioRef.current : webVideoRef.current;
      if (media) {
        if (media.paused) {
          media.play().catch(() => {});
          setIsPlayingWeb(true);
        } else {
          media.pause();
          setIsPlayingWeb(false);
        }
      }
      return;
    }
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const toggleFavorite = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const newStatus = await FavoritesService.toggleFavorite(channel);
    setIsFavorite(newStatus);
  };

  const handleRetry = () => {
    setHasError(null);
    setRetryCount((prev) => prev + 1);
    if (Platform.OS === 'web') {
      const media = channel.mediaType === 'radio' ? webAudioRef.current : webVideoRef.current;
      if (media) {
        media.src = channel.streamUrl;
        media.load();
        media.play().catch(() => {});
      }
      return;
    }
    player.replace(channel.streamUrl);
    player.play();
  };

  const isPlaying = Platform.OS === 'web' ? isPlayingWeb : player.playing;

  return (
    <View style={[styles.container, isCarMode && (isLandscape ? styles.carContainerLandscape : styles.carContainer)]}>
      {/* Video View o Audio Visualizer */}
      {!isRadio ? (
        <TouchableOpacity
          activeOpacity={1}
          onPress={resetControlsTimer}
          style={styles.videoWrapper}
        >
          {Platform.OS === 'web' ? (
            <video
              ref={webVideoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: '#000',
              }}
              autoPlay
              playsInline
              controls
            />
          ) : (
            <VideoView
              player={player}
              style={styles.video}
              fullscreenOptions={{ enable: true }}
              allowsPictureInPicture
              contentFit="contain"
            />
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={togglePlay}
          style={styles.radioVisualizerContainer}
        >
          <LinearGradient
            colors={['#0F172A', '#080A0E']}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            style={[
              styles.radioPulseCircle,
              {
                transform: [{ scale: waveAnim }],
                opacity: waveAnim.interpolate({
                  inputRange: [0.3, 1],
                  outputRange: [0.5, 0.9],
                }),
              },
            ]}
          >
            <MaterialCommunityIcons
              name="radio-tower"
              size={isCarMode ? 72 : 54}
              color={AutoTheme.colors.primary}
            />
          </Animated.View>
          <Text style={styles.radioBadge}>STREAM DE AUDIO EN VIVO</Text>
        </TouchableOpacity>
      )}

      {/* Elemento de audio HTML5 para reproducción web de radio */}
      {Platform.OS === 'web' && (
        <audio
          ref={webAudioRef}
          playsInline
          style={{ display: 'none' }}
        />
      )}

      {/* Superposición de Error */}
      {hasError && (
        <View style={styles.errorOverlay}>
          <Ionicons name="alert-circle" size={48} color={AutoTheme.colors.accentRed} />
          <Text style={styles.errorTitle}>Error al reproducir el stream</Text>
          <Text style={styles.errorSub}>{hasError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Ionicons name="refresh" size={20} color="#000" />
            <Text style={styles.retryText}>Reintentar conexión ({retryCount})</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Controles del Reproductor (Permanentes en Radio o Car Mode, auto-ocultables en Video) */}
      {(showControls || isCarMode || isRadio) && (
        <LinearGradient
          colors={['rgba(0,0,0,0.85)', 'transparent', 'rgba(0,0,0,0.92)']}
          style={[styles.controlsOverlay, isCarMode && styles.carControlsOverlay]}
        >
          {/* Header de Controles */}
          <View style={styles.topBar}>
            <View style={styles.channelMeta}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>
                  {isRadio ? 'AUDIO LIVE' : 'EN VIVO'}
                </Text>
              </View>
              <Text
                style={[styles.channelTitle, isCarMode && styles.carChannelTitle]}
                numberOfLines={1}
              >
                {channel.name}
              </Text>
              <Text style={styles.categorySubtitle} numberOfLines={1}>
                {channel.groupTitle || 'General'}
              </Text>
            </View>

            <View style={styles.topRightActions}>
              <TouchableOpacity
                onPress={toggleFavorite}
                style={[styles.iconButton, isCarMode && styles.carIconButton]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isFavorite ? 'star' : 'star-outline'}
                  size={20}
                  color={isFavorite ? AutoTheme.colors.secondary : '#FFF'}
                />
              </TouchableOpacity>

              {onClose && (
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.iconButton, isCarMode && styles.carIconButton]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={20} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Barra Central / Inferior de Reproducción: Compacta y Solo Iconos */}
          <View style={[styles.bottomBar, isCarMode && styles.carBottomBar]}>
            {onPrevChannel && (
              <TouchableOpacity
                onPress={onPrevChannel}
                style={[styles.navStepButton, isCarMode && styles.carNavStepButton]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="play-skip-back"
                  size={isCarMode ? 20 : 18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={togglePlay}
              style={[styles.playPauseButton, isCarMode && styles.carPlayPauseButton]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={isCarMode ? 24 : 22}
                color="#000000"
              />
            </TouchableOpacity>

            {onNextChannel && (
              <TouchableOpacity
                onPress={onNextChannel}
                style={[styles.navStepButton, isCarMode && styles.carNavStepButton]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="play-skip-forward"
                  size={isCarMode ? 20 : 18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: AutoTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
  },
  carContainer: {
    height: 240,
    borderRadius: AutoTheme.borderRadius.xl,
    borderColor: AutoTheme.colors.primary,
    borderWidth: 1.5,
  },
  carContainerLandscape: {
    flex: 1,
    height: '100%',
    borderRadius: AutoTheme.borderRadius.xl,
    borderColor: AutoTheme.colors.primary,
    borderWidth: 1.5,
  },
  videoWrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  radioVisualizerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  radioPulseCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: AutoTheme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AutoTheme.colors.primary,
  },
  radioBadge: {
    marginTop: 16,
    color: AutoTheme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    padding: AutoTheme.spacing.md,
  },
  carControlsOverlay: {
    padding: AutoTheme.spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  channelMeta: {
    flex: 1,
    marginRight: AutoTheme.spacing.md,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AutoTheme.colors.accentRed,
    marginRight: 6,
  },
  liveText: {
    color: AutoTheme.colors.accentRed,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  channelTitle: {
    color: '#FFF',
    fontSize: AutoTheme.typography.sizes.lg,
    fontWeight: '700',
  },
  carChannelTitle: {
    fontSize: AutoTheme.typography.sizes.xl,
    fontWeight: '800',
    color: AutoTheme.colors.carPrimary,
  },
  categorySubtitle: {
    color: AutoTheme.colors.textSecondary,
    fontSize: AutoTheme.typography.sizes.sm,
    marginTop: 2,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 6,
    borderRadius: AutoTheme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  carIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
    gap: 14,
  },
  carBottomBar: {
    paddingBottom: 8,
    justifyContent: 'center',
    gap: 16,
  },
  navStepButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carNavStepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: AutoTheme.colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: AutoTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carPlayPauseButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: AutoTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AutoTheme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: AutoTheme.spacing.lg,
  },
  errorTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  errorSub: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutoTheme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: AutoTheme.borderRadius.md,
  },
  retryText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 8,
  },
});
