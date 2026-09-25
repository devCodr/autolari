import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel, FavoriteItem } from '../core/types';
import { AutoTheme } from '../core/theme';
import { FavoritesService } from '../services/favoritesService';
import { ChannelCard } from '../components/iptv/ChannelCard';
import * as Haptics from 'expo-haptics';

interface FavoritesScreenProps {
  currentChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  isCarMode?: boolean;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  currentChannel,
  onSelectChannel,
  isCarMode = false,
}) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  const loadFavorites = async () => {
    const favs = await FavoritesService.getFavorites();
    setFavorites(favs);
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleToggleFavorite = async (fav: FavoriteItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await FavoritesService.removeFavorite(fav.id);
    await loadFavorites();
  };

  const handleSelectFav = (item: FavoriteItem) => {
    const channel: Channel = {
      id: item.id,
      sourceId: 'favorites',
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
    <View style={[styles.container, isCarMode && styles.carContainer]}>
      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={54} color={AutoTheme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No tienes canales favoritos</Text>
          <Text style={styles.emptySub}>
            Toca el ícono de la estrella en cualquier canal para agregarlo a tus favoritos vehiculares.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const channel: Channel = {
              id: item.id,
              sourceId: 'favorites',
              name: item.title,
              streamUrl: item.streamUrl,
              logoUrl: item.imageUrl,
              groupTitle: item.groupTitle || 'Favoritos',
              mediaType: item.targetType,
              isFavorite: true,
            };

            return (
              <ChannelCard
                channel={channel}
                isActive={currentChannel?.id === item.id}
                isFavorite={true}
                onPress={() => handleSelectFav(item)}
                onToggleFavorite={() => handleToggleFavorite(item)}
                isCarMode={isCarMode}
              />
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AutoTheme.colors.background,
  },
  carContainer: {
    backgroundColor: AutoTheme.colors.carBg,
  },
  listContent: {
    padding: AutoTheme.spacing.lg,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: AutoTheme.spacing.xl,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
  },
  emptySub: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
