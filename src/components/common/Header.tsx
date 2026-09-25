import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AutoTheme } from '../../core/theme';
import * as Haptics from 'expo-haptics';

interface HeaderProps {
  title?: string;
  isCarMode?: boolean;
  onToggleCarMode?: () => void;
  onOpenSettings?: () => void;
  onAddSource?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  isCarMode = false,
  onToggleCarMode,
  onOpenSettings,
  onAddSource,
}) => {
  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onToggleCarMode?.();
  };

  return (
    <View style={[styles.container, isCarMode && styles.carContainer]}>
      {/* Brand & Title */}
      <View style={styles.brandRow}>
        <View style={styles.logoBadge}>
          <MaterialCommunityIcons
            name="car-connected"
            size={isCarMode ? 28 : 22}
            color={AutoTheme.colors.primary}
          />
        </View>
        <View>
          <Text style={[styles.brandTitle, isCarMode && styles.carBrandTitle]}>
            AUTO<Text style={{ color: AutoTheme.colors.primary }}>LARI</Text>
          </Text>
          <Text style={styles.brandTagline}>Your media. Your car.</Text>
        </View>
      </View>

      {/* Acciones Superiores */}
      <View style={styles.actionsRow}>
        {onAddSource && !isCarMode && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onAddSource}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color={AutoTheme.colors.primary} />
            <Text style={styles.actionButtonText}>+ Fuente</Text>
          </TouchableOpacity>
        )}

        {/* Toggle Car Mode */}
        {onToggleCarMode && (
          <TouchableOpacity
            style={[styles.carModeToggle, isCarMode && styles.carModeToggleActive]}
            onPress={handleToggle}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isCarMode ? 'steering' : 'car'}
              size={isCarMode ? 24 : 18}
              color={isCarMode ? '#000000' : AutoTheme.colors.primary}
            />
            <Text
              style={[
                styles.carModeText,
                isCarMode && styles.carModeTextActive,
              ]}
            >
              {isCarMode ? 'MODO MÓVIL' : 'CAR MODE'}
            </Text>
          </TouchableOpacity>
        )}

        {onOpenSettings && !isCarMode && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onOpenSettings}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-sharp" size={20} color={AutoTheme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AutoTheme.spacing.lg,
    paddingVertical: AutoTheme.spacing.md,
    backgroundColor: AutoTheme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: AutoTheme.colors.border,
  },
  carContainer: {
    paddingVertical: AutoTheme.spacing.lg,
    backgroundColor: AutoTheme.colors.carBg,
    borderBottomColor: AutoTheme.colors.carBorder,
    borderBottomWidth: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: AutoTheme.colors.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  carBrandTitle: {
    fontSize: 26,
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: 10,
    color: AutoTheme.colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: -2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutoTheme.colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: AutoTheme.borderRadius.md,
    marginRight: 8,
    borderWidth: 1,
    borderColor: AutoTheme.colors.border,
  },
  actionButtonText: {
    color: AutoTheme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  carModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: AutoTheme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: AutoTheme.colors.primary,
  },
  carModeToggleActive: {
    backgroundColor: AutoTheme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  carModeText: {
    color: AutoTheme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: 0.8,
  },
  carModeTextActive: {
    color: '#000000',
    fontSize: 13,
  },
  iconButton: {
    padding: 8,
    marginLeft: 6,
    borderRadius: AutoTheme.borderRadius.full,
    backgroundColor: AutoTheme.colors.surfaceElevated,
  },
});
