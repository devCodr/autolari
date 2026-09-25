import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Source } from '../core/types';
import { AutoTheme } from '../core/theme';
import { StorageService } from '../core/storage';
import { IPTVService } from '../services/iptvService';
import { DialogUtils } from '../core/utils/dialog';
import * as Haptics from 'expo-haptics';

interface SourcesScreenProps {
  onOpenAddSource: () => void;
  onSourcesChanged?: () => void;
}

export const SourcesScreen: React.FC<SourcesScreenProps> = ({
  onOpenAddSource,
  onSourcesChanged,
}) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const loadSources = async () => {
    const data = await StorageService.getSources();
    setSources(data);
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleToggleActive = async (sourceId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await IPTVService.toggleSourceActive(sourceId);
    await loadSources();
    onSourcesChanged?.();
  };

  const handleRefreshSource = async (source: Source) => {
    try {
      setRefreshingId(source.id);
      await IPTVService.refreshSource(source.id);
      await loadSources();
      onSourcesChanged?.();
      DialogUtils.alert(
        'Lista Actualizada',
        `Se actualizaron los canales de "${source.name}".`
      );
    } catch (e: any) {
      DialogUtils.alert('Error', e.message || 'No se pudo actualizar la lista.');
    } finally {
      setRefreshingId(null);
    }
  };

  const handleRenameSource = (source: Source) => {
    DialogUtils.prompt(
      'Renombrar Lista',
      source.name,
      async (newName) => {
        if (newName && newName !== source.name) {
          await IPTVService.renameSource(source.id, newName);
          await loadSources();
          onSourcesChanged?.();
        }
      }
    );
  };

  const handleDeleteSource = (source: Source) => {
    DialogUtils.confirm(
      'Eliminar Lista',
      `¿Estás seguro de eliminar "${source.name || 'esta lista'}" y todos sus canales asociados?`,
      async () => {
        await IPTVService.deleteSource(source.id);
        await loadSources();
        onSourcesChanged?.();
      }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topInfoBar}>
        <Text style={styles.sourcesCountText}>
          {sources.length} {sources.length === 1 ? 'Fuente configurada' : 'Fuentes configuradas'}
        </Text>
        <TouchableOpacity style={styles.addBtn} onPress={onOpenAddSource}>
          <Ionicons name="add" size={18} color="#000" />
          <Text style={styles.addBtnText}>Añadir Lista</Text>
        </TouchableOpacity>
      </View>

      {sources.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="playlist-remove" size={60} color={AutoTheme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No tienes listas añadidas</Text>
          <Text style={styles.emptySub}>
            Agrega enlaces M3U, M3U8 o JSON de TDTChannels para cargar tus canales y emisoras.
          </Text>
          <TouchableOpacity style={styles.bigAddBtn} onPress={onOpenAddSource}>
            <Ionicons name="add-circle" size={22} color="#000" />
            <Text style={styles.bigAddBtnText}>Añadir Primera Lista</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sources}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isRefreshing = refreshingId === item.id;
            const displayName = item.name && item.name.trim() ? item.name : (item.type === 'json' ? 'Lista JSON / TDT' : 'Lista M3U');

            return (
              <View style={[styles.sourceCard, !item.isActive && styles.sourceCardInactive]}>
                <View style={styles.sourceHeader}>
                  <View style={styles.sourceTitleCol}>
                    <Text style={styles.sourceName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={styles.sourceUrl} numberOfLines={1}>
                      {item.url}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}
                    onPress={() => handleToggleActive(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.statusText, item.isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                      {item.isActive ? 'ACTIVA' : 'PAUSADA'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Metadatos */}
                <View style={styles.sourceMetaRow}>
                  <View
                    style={{
                      backgroundColor:
                        item.type === 'stream'
                          ? 'rgba(124, 77, 255, 0.2)'
                          : item.type === 'json'
                          ? 'rgba(0, 229, 255, 0.15)'
                          : 'rgba(255, 145, 0, 0.15)',
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 4,
                      marginRight: 10,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          item.type === 'stream'
                            ? '#B388FF'
                            : item.type === 'json'
                            ? AutoTheme.colors.primary
                            : AutoTheme.colors.secondary,
                        fontSize: 10,
                        fontWeight: '800',
                      }}
                    >
                      {item.type ? item.type.toUpperCase() : 'M3U'}
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Ionicons name="tv-outline" size={14} color={AutoTheme.colors.textSecondary} />
                    <Text style={styles.metaText}>{item.channelCount} Canales</Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={AutoTheme.colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Barra de Acciones: Renombrar, Actualizar, Eliminar */}
                <View style={styles.actionsBar}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleRenameSource(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil-outline" size={15} color={AutoTheme.colors.textSecondary} />
                    <Text style={[styles.actionBtnText, { color: AutoTheme.colors.textSecondary }]}>
                      Editar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleRefreshSource(item)}
                    disabled={isRefreshing}
                    activeOpacity={0.7}
                  >
                    {isRefreshing ? (
                      <ActivityIndicator size="small" color={AutoTheme.colors.primary} />
                    ) : (
                      <>
                        <Ionicons name="sync" size={15} color={AutoTheme.colors.primary} />
                        <Text style={styles.actionBtnText}>Actualizar</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteSource(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={15} color={AutoTheme.colors.accentRed} />
                    <Text style={[styles.actionBtnText, { color: AutoTheme.colors.accentRed }]}>
                      Eliminar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  topInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AutoTheme.spacing.lg,
    paddingVertical: AutoTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AutoTheme.colors.border,
  },
  sourcesCountText: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutoTheme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: AutoTheme.borderRadius.md,
  },
  addBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  listContent: {
    padding: AutoTheme.spacing.lg,
    paddingBottom: 40,
  },
  sourceCard: {
    backgroundColor: AutoTheme.colors.surfaceCard,
    borderRadius: AutoTheme.borderRadius.lg,
    padding: AutoTheme.spacing.md,
    marginBottom: AutoTheme.spacing.md,
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
  },
  sourceCardInactive: {
    opacity: 0.6,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sourceTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  sourceName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sourceUrl: {
    color: AutoTheme.colors.textTertiary,
    fontSize: 12,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: AutoTheme.borderRadius.sm,
  },
  statusActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  statusInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: AutoTheme.colors.accentGreen,
  },
  statusTextInactive: {
    color: AutoTheme.colors.textTertiary,
  },
  sourceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: AutoTheme.colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 12,
    marginLeft: 6,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutoTheme.colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: AutoTheme.borderRadius.md,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
  },
  deleteBtn: {
    borderColor: 'rgba(255, 51, 102, 0.3)',
    backgroundColor: 'rgba(255, 51, 102, 0.08)',
  },
  actionBtnText: {
    color: AutoTheme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: AutoTheme.spacing.xl,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 14,
  },
  emptySub: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  bigAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutoTheme.colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: AutoTheme.borderRadius.md,
  },
  bigAddBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 8,
  },
});
