import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel, HistoryItem } from '../core/types';
import { AutoTheme } from '../core/theme';
import { HistoryService } from '../services/favoritesService';
import { ChannelCard } from '../components/iptv/ChannelCard';
import { DialogUtils } from '../core/utils/dialog';

interface HistoryScreenProps {
  currentChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  isCarMode?: boolean;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  currentChannel,
  onSelectChannel,
  isCarMode = false,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = async () => {
    const hist = await HistoryService.getHistory();
    setHistory(hist);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = () => {
    DialogUtils.confirm(
      'Borrar Historial',
      '¿Deseas vaciar el historial de reproducción?',
      async () => {
        await HistoryService.clearHistory();
        setHistory([]);
      }
    );
  };

  const handleSelectHist = (item: HistoryItem) => {
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

  return (
    <View style={[styles.container, isCarMode && styles.carContainer]}>
      {history.length > 0 && !isCarMode && (
        <View style={styles.topBar}>
          <Text style={styles.countText}>{history.length} reproducidos recientemente</Text>
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Ionicons name="trash-bin-outline" size={16} color={AutoTheme.colors.accentRed} />
            <Text style={styles.clearText}>Vaciar</Text>
          </TouchableOpacity>
        </View>
      )}

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={54} color={AutoTheme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>Sin historial reciente</Text>
          <Text style={styles.emptySub}>
            Los canales y emisiones que sintonices aparecerán aquí para que puedas continuar de inmediato.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const channel: Channel = {
              id: item.targetId,
              sourceId: 'history',
              name: item.title,
              streamUrl: item.streamUrl,
              logoUrl: item.imageUrl,
              groupTitle: item.groupTitle || 'Historial',
              mediaType: item.targetType,
            };

            return (
              <ChannelCard
                channel={channel}
                isActive={currentChannel?.id === item.targetId}
                onPress={() => handleSelectHist(item)}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AutoTheme.spacing.lg,
    paddingVertical: AutoTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AutoTheme.colors.border,
  },
  countText: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearText: {
    color: AutoTheme.colors.accentRed,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
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
