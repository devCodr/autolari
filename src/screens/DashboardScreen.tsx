import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Channel, FavoriteItem, HistoryItem, Source } from '../core/types';
import { AutoTheme } from '../core/theme';
import { StorageService } from '../core/storage';
import { FavoritesService, HistoryService } from '../services/favoritesService';
import { IPTVService } from '../services/iptvService';

interface DashboardScreenProps {
  onSelectChannel: (channel: Channel) => void;
  onNavigateTab: (tab: any) => void;
  onOpenAddSource: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onSelectChannel,
  onNavigateTab,
  onOpenAddSource,
}) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [lastPlayed, setLastPlayed] = useState<Channel | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [channelsCount, setChannelsCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [srcs, last, favs, hist, activeChans] = await Promise.all([
        StorageService.getSources(),
        HistoryService.getLastPlayed(),
        FavoritesService.getFavorites(),
        HistoryService.getHistory(),
        IPTVService.getActiveChannels(),
      ]);

      setSources(srcs);
      setLastPlayed(last);
      setFavorites(favs);
      setHistory(hist.slice(0, 8));
      setChannelsCount(activeChans.length);
    } catch (e) {
      console.error('[Dashboard] Error loading data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePlayHistory = (item: HistoryItem) => {
    const channel: Channel = {
      id: item.targetId,
      sourceId: 'history',
      name: item.title,
      streamUrl: item.streamUrl,
      logoUrl: item.imageUrl,
      groupTitle: item.groupTitle || 'Historial',
      mediaType: item.targetType,
    };
    onSelectChannel(channel);
  };

  const handlePlayFavorite = (item: FavoriteItem) => {
    const channel: Channel = {
      id: item.id,
      sourceId: 'favorite',
      name: item.title,
      streamUrl: item.streamUrl,
      logoUrl: item.imageUrl,
      groupTitle: item.groupTitle || 'Favoritos',
      mediaType: item.targetType,
      isFavorite: true,
    };
    onSelectChannel(channel);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={AutoTheme.colors.primary}
        />
      }
    >
      {/* Hero: Continuar viendo / Último contenido */}
      {lastPlayed ? (
        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => onSelectChannel(lastPlayed)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#1A2538', '#0E1420']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="play" size={12} color="#000" />
              <Text style={styles.heroBadgeText}>CONTINUAR REPRODUCCIÓN</Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {lastPlayed.name}
            </Text>
            <Text style={styles.heroSubtitle}>
              {lastPlayed.groupTitle || 'Canal en vivo'} • Toque para reanudar al instante
            </Text>
          </View>
          <View style={styles.heroPlayIcon}>
            <Ionicons name="play" size={26} color="#000" />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.welcomeBanner}>
          <LinearGradient
            colors={['#161F30', '#0B101A']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.welcomeIconCircle}>
            <MaterialCommunityIcons name="car-speed-limiter" size={32} color={AutoTheme.colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.welcomeTitle}>Bienvenido a AutoLari</Text>
            <Text style={styles.welcomeSub}>
              Configura tus listas M3U y disfruta de TV, streams y radio en tu automóvil.
            </Text>
          </View>
        </View>
      )}

      {/* Grid de Accesos Rápidos */}
      <Text style={styles.sectionTitle}>ACCESOS RÁPIDOS</Text>
      <View style={styles.quickGrid}>
        {/* IPTV / Canales en Vivo */}
        <TouchableOpacity
          style={[styles.quickCard, { borderColor: AutoTheme.colors.primary }]}
          onPress={() => onNavigateTab('channels')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(0, 229, 255, 0.15)' }]}>
            <MaterialCommunityIcons name="television-classic" size={26} color={AutoTheme.colors.primary} />
          </View>
          <Text style={styles.quickTitle}>TV en Vivo</Text>
          <Text style={styles.quickCount}>{channelsCount} Canales</Text>
        </TouchableOpacity>

        {/* Favoritos */}
        <TouchableOpacity
          style={[styles.quickCard, { borderColor: AutoTheme.colors.secondary }]}
          onPress={() => onNavigateTab('favorites')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(255, 145, 0, 0.15)' }]}>
            <Ionicons name="star" size={26} color={AutoTheme.colors.secondary} />
          </View>
          <Text style={styles.quickTitle}>Favoritos</Text>
          <Text style={styles.quickCount}>{favorites.length} Guardados</Text>
        </TouchableOpacity>

        {/* Radio & Audio */}
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => onNavigateTab('channels')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(124, 77, 255, 0.15)' }]}>
            <MaterialCommunityIcons name="radio-tower" size={26} color="#B388FF" />
          </View>
          <Text style={styles.quickTitle}>Radio Online</Text>
          <Text style={styles.quickCount}>Streams Audio</Text>
        </TouchableOpacity>

        {/* Fuentes */}
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => onNavigateTab('sources')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
            <MaterialCommunityIcons name="playlist-play" size={26} color={AutoTheme.colors.accentGreen} />
          </View>
          <Text style={styles.quickTitle}>Fuentes</Text>
          <Text style={styles.quickCount}>{sources.length} Activas</Text>
        </TouchableOpacity>
      </View>

      {/* Sección Favoritos */}
      {favorites.length > 0 && (
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>CANALES FAVORITOS</Text>
            <TouchableOpacity onPress={() => onNavigateTab('favorites')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {favorites.map((fav) => (
              <TouchableOpacity
                key={fav.id}
                style={styles.favCard}
                onPress={() => handlePlayFavorite(fav)}
                activeOpacity={0.8}
              >
                <View style={styles.favIconBox}>
                  {fav.imageUrl ? (
                    <Image source={{ uri: fav.imageUrl }} style={styles.favImage} resizeMode="contain" />
                  ) : (
                    <MaterialCommunityIcons
                      name={fav.targetType === 'radio' ? 'radio' : 'television'}
                      size={24}
                      color={AutoTheme.colors.secondary}
                    />
                  )}
                </View>
                <Text style={styles.favTitle} numberOfLines={1}>
                  {fav.title}
                </Text>
                <Text style={styles.favSub} numberOfLines={1}>
                  {fav.groupTitle || 'Canal'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Últimos Contenidos Utilizados (Historial) */}
      {history.length > 0 && (
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>VISTOS RECIENTEMENTE</Text>
            <TouchableOpacity onPress={() => onNavigateTab('history')}>
              <Text style={styles.seeAllText}>Historial</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.historyList}>
            {history.slice(0, 4).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyItemRow}
                onPress={() => handlePlayHistory(item)}
                activeOpacity={0.75}
              >
                <View style={styles.historyItemIcon}>
                  <Ionicons
                    name={item.targetType === 'radio' ? 'radio-outline' : 'play-circle-outline'}
                    size={20}
                    color={AutoTheme.colors.primary}
                  />
                </View>
                <View style={styles.historyItemMeta}>
                  <Text style={styles.historyItemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.historyItemSub} numberOfLines={1}>
                    {item.groupTitle || 'Stream'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={AutoTheme.colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Si no hay fuentes, mostrar CTA llamativo */}
      {sources.length === 0 && (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="playlist-plus" size={44} color={AutoTheme.colors.primary} />
          <Text style={styles.emptyTitle}>Comienza agregando tu primera fuente multimedia</Text>
          <Text style={styles.emptyDesc}>
            AutoLari admite listas M3U/M3U8, JSON de TDTChannels o URLs de streaming directo de radio y video.
          </Text>
          <TouchableOpacity style={styles.addSourceBtn} onPress={onOpenAddSource}>
            <Ionicons name="add-circle-outline" size={20} color="#000" />
            <Text style={styles.addSourceBtnText}>Añadir Fuente Ahora</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AutoTheme.colors.background,
  },
  content: {
    padding: AutoTheme.spacing.lg,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: AutoTheme.borderRadius.lg,
    overflow: 'hidden',
    padding: AutoTheme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: AutoTheme.colors.borderLight,
    marginBottom: AutoTheme.spacing.xl,
  },
  heroContent: {
    flex: 1,
    marginRight: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutoTheme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AutoTheme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 4,
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 12,
  },
  heroPlayIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AutoTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeBanner: {
    borderRadius: AutoTheme.borderRadius.lg,
    padding: AutoTheme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
    marginBottom: AutoTheme.spacing.xl,
    overflow: 'hidden',
  },
  welcomeIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: AutoTheme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  welcomeSub: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  sectionTitle: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  sectionWrapper: {
    marginBottom: AutoTheme.spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllText: {
    color: AutoTheme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: AutoTheme.spacing.xl,
  },
  quickCard: {
    width: '48%',
    backgroundColor: AutoTheme.colors.surfaceCard,
    borderRadius: AutoTheme.borderRadius.md,
    padding: AutoTheme.spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  quickCount: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  horizontalScroll: {
    marginHorizontal: -AutoTheme.spacing.lg,
    paddingHorizontal: AutoTheme.spacing.lg,
  },
  favCard: {
    width: 120,
    backgroundColor: AutoTheme.colors.surfaceCard,
    borderRadius: AutoTheme.borderRadius.md,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
  },
  favIconBox: {
    width: '100%',
    height: 60,
    backgroundColor: AutoTheme.colors.surfaceElevated,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  favImage: {
    width: '90%',
    height: '90%',
  },
  favTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  favSub: {
    color: AutoTheme.colors.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
  historyList: {
    backgroundColor: AutoTheme.colors.surfaceCard,
    borderRadius: AutoTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
    overflow: 'hidden',
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: AutoTheme.colors.border,
  },
  historyItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: AutoTheme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyItemMeta: {
    flex: 1,
  },
  historyItemTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  historyItemSub: {
    color: AutoTheme.colors.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: AutoTheme.colors.surfaceCard,
    borderRadius: AutoTheme.borderRadius.lg,
    padding: AutoTheme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
    marginTop: 10,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 14,
    textAlign: 'center',
  },
  emptyDesc: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 18,
  },
  addSourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutoTheme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: AutoTheme.borderRadius.md,
  },
  addSourceBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },
});
