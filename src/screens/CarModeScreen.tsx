import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { Channel, FavoriteItem, HistoryItem } from '../core/types';
import { AutoTheme } from '../core/theme';
import { AutoPlayer } from '../components/player/AutoPlayer';
import { IPTVService } from '../services/iptvService';
import { FavoritesService, HistoryService } from '../services/favoritesService';
import { ChannelCard } from '../components/iptv/ChannelCard';

interface CarModeScreenProps {
  currentChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onExitCarMode: () => void;
}

type CarCategory = 'TV' | 'FAVORITOS' | 'RADIO' | 'HISTORIAL';

const CAR_TABS: {
  id: CarCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'TV', label: 'TV', icon: 'tv-outline', iconActive: 'tv' },
  { id: 'FAVORITOS', label: 'FAV', icon: 'star-outline', iconActive: 'star' },
  { id: 'RADIO', label: 'RADIO', icon: 'radio-outline', iconActive: 'radio' },
  { id: 'HISTORIAL', label: 'HIST', icon: 'time-outline', iconActive: 'time' },
];

export const CarModeScreen: React.FC<CarModeScreenProps> = ({
  currentChannel,
  onSelectChannel,
  onExitCarMode,
}) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [activeTab, setActiveTab] = useState<CarCategory>('TV');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);

  // Mantener pantalla encendida en modo auto
  useEffect(() => {
    activateKeepAwakeAsync('autolari_car_mode');
    return () => {
      deactivateKeepAwake('autolari_car_mode');
    };
  }, []);

  const loadData = async () => {
    try {
      const [chans, favs, hist] = await Promise.all([
        IPTVService.getActiveChannels(),
        FavoritesService.getFavorites(),
        HistoryService.getHistory(),
      ]);
      setChannels(chans);
      setFavorites(favs);
      setHistory(hist);
    } catch (e) {
      console.error('[CarMode] Error loading data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleTabChange = (tab: CarCategory) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    // Si estaba en cinema mode y cambia de pestaña, mostrar lista
    if (isCinemaMode) {
      setIsCinemaMode(false);
    }
  };

  const handleNextChannel = () => {
    if (!currentChannel || channels.length === 0) return;
    const currentIndex = channels.findIndex((c) => c.id === currentChannel.id);
    const nextIndex = (currentIndex + 1) % channels.length;
    onSelectChannel(channels[nextIndex]);
  };

  const handlePrevChannel = () => {
    if (!currentChannel || channels.length === 0) return;
    const currentIndex = channels.findIndex((c) => c.id === currentChannel.id);
    const prevIndex = (currentIndex - 1 + channels.length) % channels.length;
    onSelectChannel(channels[prevIndex]);
  };

  // Filtrado de acuerdo a la pestaña vehicular
  const displayItems = () => {
    switch (activeTab) {
      case 'TV':
        return channels.filter((c) => c.mediaType !== 'radio');
      case 'RADIO':
        return channels.filter((c) => c.mediaType === 'radio');
      case 'FAVORITOS':
        return favorites.map((f) => ({
          id: f.id,
          sourceId: 'fav',
          name: f.title,
          streamUrl: f.streamUrl,
          logoUrl: f.imageUrl,
          groupTitle: f.groupTitle || 'Favorito',
          mediaType: f.targetType,
          isFavorite: true,
        }));
      case 'HISTORIAL':
        return history.map((h) => ({
          id: h.targetId,
          sourceId: 'hist',
          name: h.title,
          streamUrl: h.streamUrl,
          logoUrl: h.imageUrl,
          groupTitle: h.groupTitle || 'Historial',
          mediaType: h.targetType,
        }));
      default:
        return channels;
    }
  };

  const items = displayItems();

  return (
    <View style={styles.container}>
      {/* Barra Superior Compacta Vehicular */}
      <View style={[styles.carNavBar, isLandscape && styles.carNavBarLandscape]}>
        <TouchableOpacity
          style={[styles.exitBtn, isLandscape && styles.exitBtnLandscape]}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onExitCarMode();
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#FFF" />
          <Text style={styles.exitText}>SALIR</Text>
        </TouchableOpacity>

        {/* Pestañas Compactas con Iconos */}
        <View style={styles.tabsRow}>
          {CAR_TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.compactNavTab,
                  isLandscape && styles.compactNavTabLandscape,
                  isSelected && styles.compactNavTabActive,
                ]}
                onPress={() => handleTabChange(tab.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isSelected ? tab.iconActive : tab.icon}
                  size={16}
                  color={isSelected ? '#000' : AutoTheme.colors.primary}
                />
                <Text
                  style={[
                    styles.compactNavTabText,
                    isSelected && styles.compactNavTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Botón Cinema Fullscreen en Landscape */}
        {isLandscape && currentChannel && (
          <TouchableOpacity
            style={[styles.cinemaBtn, isCinemaMode && styles.cinemaBtnActive]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsCinemaMode(!isCinemaMode);
            }}
          >
            <Ionicons
              name={isCinemaMode ? 'list' : 'expand'}
              size={16}
              color={isCinemaMode ? '#000' : AutoTheme.colors.primary}
            />
            <Text style={[styles.cinemaBtnText, isCinemaMode && styles.cinemaBtnTextActive]}>
              {isCinemaMode ? 'LISTA' : 'FULL'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contenido Vehicular (Horizontal / Vertical con prioridad al video) */}
      <View style={[styles.mainLayout, isLandscape && styles.landscapeLayout]}>
        {/* Reproductor Vehicular */}
        {currentChannel ? (
          <View
            style={[
              styles.playerSection,
              isLandscape && (isCinemaMode ? styles.cinemaPlayer : styles.landscapePlayer),
            ]}
          >
            <AutoPlayer
              key={currentChannel.id}
              channel={currentChannel}
              isCarMode={true}
              onNextChannel={channels.length > 1 ? handleNextChannel : undefined}
              onPrevChannel={channels.length > 1 ? handlePrevChannel : undefined}
            />
          </View>
        ) : (
          <View style={[styles.noPlayerCard, isLandscape && styles.noPlayerCardLandscape]}>
            <MaterialCommunityIcons
              name="steering"
              size={isLandscape ? 32 : 44}
              color={AutoTheme.colors.primary}
            />
            <Text style={styles.noPlayerTitle}>SELECCIONA UN CANAL O EMISORA</Text>
            <Text style={styles.noPlayerSub}>
              Toca un contenido en la lista para iniciar la reproducción vehicular.
            </Text>
          </View>
        )}

        {/* Lista de Contenido (Oculta en modo Cinema en horizontal) */}
        {(!isLandscape || !isCinemaMode) && (
          <View style={[styles.listSection, isLandscape && styles.landscapeList]}>
            {items.length === 0 ? (
              <View style={styles.emptyCarBox}>
                <Ionicons name="albums-outline" size={36} color={AutoTheme.colors.textTertiary} />
                <Text style={styles.emptyCarText}>NO HAY CONTENIDO EN {activeTab}</Text>
              </View>
            ) : (
              <FlatList
                data={items}
                keyExtractor={(item) => `${activeTab}_${item.id}`}
                renderItem={({ item }) => (
                  <ChannelCard
                    channel={item}
                    isActive={currentChannel?.id === item.id}
                    isCarMode={true}
                    onPress={() => onSelectChannel(item)}
                  />
                )}
                contentContainerStyle={styles.carListContent}
                initialNumToRender={10}
                maxToRenderPerBatch={15}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AutoTheme.colors.carBg,
  },
  carNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#000000',
    borderBottomWidth: 1.5,
    borderBottomColor: AutoTheme.colors.primary,
  },
  carNavBarLandscape: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutoTheme.colors.surfaceElevated,
    paddingHorizontal: 10,
    height: 38,
    borderRadius: AutoTheme.borderRadius.sm,
    marginRight: 6,
    borderWidth: 1,
    borderColor: AutoTheme.colors.carBorder,
  },
  exitBtnLandscape: {
    height: 34,
    paddingHorizontal: 8,
    marginRight: 6,
  },
  exitText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  compactNavTab: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    backgroundColor: AutoTheme.colors.carCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: AutoTheme.borderRadius.sm,
    borderWidth: 1.2,
    borderColor: AutoTheme.colors.carBorder,
    gap: 4,
  },
  compactNavTabLandscape: {
    height: 34,
  },
  compactNavTabActive: {
    backgroundColor: AutoTheme.colors.primary,
    borderColor: AutoTheme.colors.primary,
  },
  compactNavTabText: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  compactNavTabTextActive: {
    color: '#000000',
  },
  cinemaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    paddingHorizontal: 8,
    backgroundColor: AutoTheme.colors.surfaceElevated,
    borderRadius: AutoTheme.borderRadius.sm,
    borderWidth: 1.2,
    borderColor: AutoTheme.colors.primary,
    marginLeft: 6,
    gap: 4,
  },
  cinemaBtnActive: {
    backgroundColor: AutoTheme.colors.primary,
  },
  cinemaBtnText: {
    color: AutoTheme.colors.primary,
    fontSize: 10,
    fontWeight: '900',
  },
  cinemaBtnTextActive: {
    color: '#000000',
  },
  mainLayout: {
    flex: 1,
    padding: AutoTheme.spacing.sm,
  },
  landscapeLayout: {
    flexDirection: 'row',
    padding: 6,
    gap: 6,
  },
  playerSection: {
    marginBottom: AutoTheme.spacing.sm,
  },
  landscapePlayer: {
    flex: 2.5,
    marginBottom: 0,
    height: '100%',
  },
  cinemaPlayer: {
    flex: 1,
    width: '100%',
    height: '100%',
    marginBottom: 0,
  },
  listSection: {
    flex: 1,
  },
  landscapeList: {
    flex: 1,
    height: '100%',
  },
  carListContent: {
    paddingBottom: 24,
  },
  noPlayerCard: {
    backgroundColor: AutoTheme.colors.carCard,
    borderRadius: AutoTheme.borderRadius.xl,
    padding: AutoTheme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: AutoTheme.colors.carBorder,
    marginBottom: AutoTheme.spacing.sm,
  },
  noPlayerCardLandscape: {
    flex: 1,
    justifyContent: 'center',
    padding: AutoTheme.spacing.md,
    marginBottom: 0,
  },
  noPlayerTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: 0.8,
  },
  noPlayerSub: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyCarBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: AutoTheme.spacing.lg,
  },
  emptyCarText: {
    color: AutoTheme.colors.textTertiary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 0.5,
  },
});
