import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel } from '../core/types';
import { AutoTheme } from '../core/theme';
import { IPTVService } from '../services/iptvService';
import { FavoritesService } from '../services/favoritesService';
import { ChannelCard } from '../components/iptv/ChannelCard';
import { normalizeSearchText } from '../core/utils/search';
import * as Haptics from 'expo-haptics';

interface ChannelsScreenProps {
  currentChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onOpenAddSource: () => void;
  isCarMode?: boolean;
}

export const ChannelsScreen: React.FC<ChannelsScreenProps> = ({
  currentChannel,
  onSelectChannel,
  onOpenAddSource,
  isCarMode = false,
}) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [loading, setLoading] = useState<boolean>(true);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const [activeChannels, favs] = await Promise.all([
        IPTVService.getActiveChannels(),
        FavoritesService.getFavorites(),
      ]);
      setChannels(activeChannels);
      setFavoriteIds(new Set(favs.map((f) => f.id)));
    } catch (e) {
      console.error('[ChannelsScreen] Error loading channels:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  // Extraer categorías y países únicos para los chips de filtrado
  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => {
      if (c.groupTitle) set.add(c.groupTitle);
      if (c.country && c.country !== 'General') set.add(c.country);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [channels]);

  // Canales filtrados por búsqueda multi-campo e insensible a tildes (Nombre, País, Categoría, Tags, Calidad)
  const filteredChannels = useMemo(() => {
    const rawQuery = searchQuery.trim();
    const normalizedQuery = normalizeSearchText(rawQuery);
    const queryTerms = normalizedQuery ? normalizedQuery.split(/\s+/).filter(Boolean) : [];

    return channels.filter((c) => {
      // Coincidencia de categoría / país
      const matchesCategory =
        selectedCategory === 'TODAS' ||
        c.groupTitle === selectedCategory ||
        c.country === selectedCategory ||
        c.ambit === selectedCategory ||
        normalizeSearchText(c.groupTitle) === normalizeSearchText(selectedCategory) ||
        normalizeSearchText(c.country) === normalizeSearchText(selectedCategory);

      if (!matchesCategory) return false;
      if (queryTerms.length === 0) return true;

      // Unificar todos los términos buscables del canal y normalizarlos
      const channelSearchBlob = normalizeSearchText([
        c.name,
        c.groupTitle,
        c.country,
        c.ambit,
        c.tvgId,
        c.mediaType === 'radio' ? 'radio audio stream' : 'tv en vivo stream',
        ...(c.tags || []),
      ]
        .filter(Boolean)
        .join(' '));

      // Cada término de la búsqueda debe estar presente en el blob normalizado
      return queryTerms.every((term) => channelSearchBlob.includes(term));
    });
  }, [channels, selectedCategory, searchQuery]);

  const handleToggleFavorite = async (channel: Channel) => {
    const isNowFav = await FavoritesService.toggleFavorite(channel);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isNowFav) {
        next.add(channel.id);
      } else {
        next.delete(channel.id);
      }
      return next;
    });
  };

  const handleSelectCategory = (cat: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(cat);
  };

  return (
    <View style={[styles.container, isCarMode && styles.carContainer]}>
      {/* Buscador */}
      <View style={[styles.searchBar, isCarMode && styles.carSearchBar]}>
        <Ionicons name="search" size={isCarMode ? 24 : 18} color={AutoTheme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, isCarMode && styles.carSearchInput]}
          placeholder="Buscar canales o emisoras..."
          placeholderTextColor={AutoTheme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={AutoTheme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Selector de Categorías Horizontal */}
      {categories.length > 1 && (
        <View style={styles.categoriesWrapper}>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item;
              return (
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    isCarMode && styles.carCategoryChip,
                    isSelected && styles.categoryChipSelected,
                  ]}
                  onPress={() => handleSelectCategory(item)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isCarMode && styles.carCategoryChipText,
                      isSelected && styles.categoryChipTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.categoriesContent}
          />
        </View>
      )}

      {/* Lista de Canales */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={AutoTheme.colors.primary} />
          <Text style={styles.loadingText}>Cargando canales...</Text>
        </View>
      ) : filteredChannels.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="tv-outline" size={54} color={AutoTheme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No hay canales disponibles</Text>
          <Text style={styles.emptySubtitle}>
            {channels.length === 0
              ? 'Añade una lista M3U para empezar a ver televisión y escuchar radios.'
              : 'No se encontraron resultados con ese criterio de búsqueda.'}
          </Text>
          {channels.length === 0 && (
            <TouchableOpacity style={styles.addBtn} onPress={onOpenAddSource}>
              <Ionicons name="add" size={20} color="#000" />
              <Text style={styles.addBtnText}>Añadir Lista M3U</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredChannels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChannelCard
              channel={item}
              isActive={currentChannel?.id === item.id}
              isFavorite={favoriteIds.has(item.id)}
              onPress={() => onSelectChannel(item)}
              onToggleFavorite={() => handleToggleFavorite(item)}
              isCarMode={isCarMode}
            />
          )}
          contentContainerStyle={styles.listContent}
          initialNumToRender={20}
          maxToRenderPerBatch={30}
          windowSize={10}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutoTheme.colors.surfaceCard,
    borderRadius: AutoTheme.borderRadius.md,
    marginHorizontal: AutoTheme.spacing.lg,
    marginVertical: AutoTheme.spacing.sm,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
  },
  carSearchBar: {
    height: 56,
    borderRadius: AutoTheme.borderRadius.lg,
    borderColor: AutoTheme.colors.carBorder,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    marginLeft: 8,
  },
  carSearchInput: {
    fontSize: 18,
  },
  categoriesWrapper: {
    marginBottom: AutoTheme.spacing.sm,
  },
  categoriesContent: {
    paddingHorizontal: AutoTheme.spacing.lg,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: AutoTheme.borderRadius.full,
    backgroundColor: AutoTheme.colors.surfaceCard,
    marginRight: 8,
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
  },
  carCategoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: AutoTheme.borderRadius.lg,
  },
  categoryChipSelected: {
    backgroundColor: AutoTheme.colors.primary,
    borderColor: AutoTheme.colors.primary,
  },
  categoryChipText: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  carCategoryChipText: {
    fontSize: 16,
  },
  categoryChipTextSelected: {
    color: '#000',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: AutoTheme.spacing.lg,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: AutoTheme.spacing.xl,
  },
  loadingText: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: AutoTheme.colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutoTheme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: AutoTheme.borderRadius.md,
  },
  addBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
    marginLeft: 6,
  },
});
