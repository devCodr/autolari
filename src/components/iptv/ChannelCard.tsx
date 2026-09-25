import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Channel } from '../../core/types';
import { AutoTheme } from '../../core/theme';
import * as Haptics from 'expo-haptics';

interface ChannelCardProps {
  channel: Channel;
  isActive?: boolean;
  isFavorite?: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
  isCarMode?: boolean;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isActive = false,
  isFavorite = false,
  onPress,
  onToggleFavorite,
  isCarMode = false,
}) => {
  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggleFavorite?.();
  };

  const handleCardPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(isCarMode ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const isRadio = channel.mediaType === 'radio';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCarMode && styles.carCard,
        isActive && styles.activeCard,
      ]}
      onPress={handleCardPress}
      activeOpacity={0.75}
    >
      {/* Icono / Logo */}
      <View style={[styles.logoContainer, isCarMode && styles.carLogoContainer]}>
        {channel.logoUrl ? (
          <Image
            source={{ uri: channel.logoUrl }}
            style={styles.logoImage}
            resizeMode="contain"
          />
        ) : (
          <MaterialCommunityIcons
            name={isRadio ? 'radio' : 'television-play'}
            size={isCarMode ? 32 : 24}
            color={isActive ? AutoTheme.colors.primary : AutoTheme.colors.textSecondary}
          />
        )}
      </View>

      {/* Info */}
      <View style={styles.infoCol}>
        <View style={styles.topMetaRow}>
          {channel.country && (
            <View style={styles.countryTag}>
              <Text style={styles.countryTagText}>{channel.country}</Text>
            </View>
          )}
          {isRadio && (
            <View style={styles.radioTag}>
              <Text style={styles.radioTagText}>RADIO</Text>
            </View>
          )}
          <Text style={styles.groupText} numberOfLines={1}>
            {channel.ambit || channel.groupTitle || 'General'}
          </Text>
          {channel.tags && channel.tags.includes('GEO') && (
            <View style={styles.geoTag}>
              <Text style={styles.geoTagText}>GEO</Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.channelName,
            isCarMode && styles.carChannelName,
            isActive && styles.activeText,
          ]}
          numberOfLines={1}
        >
          {channel.name}
        </Text>
      </View>

      {/* Botón Favorito */}
      {onToggleFavorite && (
        <TouchableOpacity
          style={[styles.favBtn, isCarMode && styles.carFavBtn]}
          onPress={handleFavoritePress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name={isFavorite ? 'star' : 'star-outline'}
            size={isCarMode ? 30 : 22}
            color={isFavorite ? AutoTheme.colors.secondary : AutoTheme.colors.textTertiary}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutoTheme.colors.surfaceCard,
    borderRadius: AutoTheme.borderRadius.md,
    padding: AutoTheme.spacing.md,
    marginBottom: AutoTheme.spacing.sm,
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
  },
  carCard: {
    minHeight: 56,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: AutoTheme.borderRadius.md,
    marginBottom: 6,
    borderWidth: 1.5,
  },
  activeCard: {
    borderColor: AutoTheme.colors.primary,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: AutoTheme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: AutoTheme.spacing.md,
    overflow: 'hidden',
  },
  carLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  countryTag: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 6,
  },
  countryTagText: {
    color: AutoTheme.colors.primary,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  geoTag: {
    backgroundColor: 'rgba(255, 145, 0, 0.18)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 6,
  },
  geoTagText: {
    color: AutoTheme.colors.secondary,
    fontSize: 8,
    fontWeight: '900',
  },
  radioTag: {
    backgroundColor: 'rgba(124, 77, 255, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 6,
  },
  radioTagText: {
    color: '#B388FF',
    fontSize: 9,
    fontWeight: '800',
  },
  groupText: {
    color: AutoTheme.colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  channelName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  carChannelName: {
    fontSize: 18,
    fontWeight: '800',
  },
  activeText: {
    color: AutoTheme.colors.primary,
  },
  favBtn: {
    padding: 6,
    marginLeft: 8,
  },
  carFavBtn: {
    padding: 10,
    marginLeft: 12,
  },
});
