import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AutoTheme } from './src/core/theme';
import { Channel, MainTab, AppMode } from './src/core/types';
import { StorageService } from './src/core/storage';
import { Header } from './src/components/common/Header';
import { AutoPlayer } from './src/components/player/AutoPlayer';
import { AddSourceModal } from './src/components/iptv/AddSourceModal';

// Screens
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ChannelsScreen } from './src/screens/ChannelsScreen';
import { SourcesScreen } from './src/screens/SourcesScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { CarModeScreen } from './src/screens/CarModeScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [mode, setMode] = useState<AppMode>('mobile');
  const [currentTab, setCurrentTab] = useState<MainTab>('dashboard');
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [isAddSourceModalVisible, setIsAddSourceModalVisible] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Configurar estilo claro para iconos de barra de navegación en Android nativo
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setStyle('light');
      } catch (e) {
        // En emuladores o entornos sin soporte de API no genera fallo
      }
    }
  }, []);

  // Asegurar no-referrer en Web para evitar bloqueos por reglas de Referer en CDNs multimedia
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      let meta = document.querySelector('meta[name="referrer"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'referrer');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'no-referrer');
    }
  }, []);

  // Cargar último canal reproducido al iniciar
  useEffect(() => {
    StorageService.getLastPlayed().then((channel) => {
      if (channel) {
        setCurrentChannel(channel);
      }
    });
  }, []);

  const handleSelectChannel = (channel: Channel) => {
    setCurrentChannel(channel);
  };

  const handleTabChange = (tab: MainTab) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCurrentTab(tab);
  };

  const toggleCarMode = () => {
    setMode((prev) => (prev === 'mobile' ? 'car' : 'mobile'));
  };

  const handleSourcesUpdated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Renderizar la pantalla según el modo
  if (mode === 'car') {
    return (
      <View style={[styles.carSafeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar style="light" hidden={isLandscape} />
        <CarModeScreen
          currentChannel={currentChannel}
          onSelectChannel={handleSelectChannel}
          onExitCarMode={() => setMode('mobile')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

        {/* Header Superior con Selector de Car Mode y Marca */}
        <Header
          isCarMode={false}
          onToggleCarMode={toggleCarMode}
          onAddSource={() => setIsAddSourceModalVisible(true)}
        />

        {/* Reproductor Persistente si hay un canal activo */}
        {currentChannel && (
          <View style={styles.playerContainer}>
            <AutoPlayer
              key={currentChannel.id}
              channel={currentChannel}
              onClose={() => setCurrentChannel(null)}
            />
          </View>
        )}

        {/* Contenido Principal según Pestaña */}
        <View style={styles.mainContent}>
          {currentTab === 'dashboard' && (
            <DashboardScreen
              key={`dash_${refreshKey}`}
              onSelectChannel={handleSelectChannel}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenAddSource={() => setIsAddSourceModalVisible(true)}
            />
          )}

          {currentTab === 'channels' && (
            <ChannelsScreen
              key={`chan_${refreshKey}`}
              currentChannel={currentChannel}
              onSelectChannel={handleSelectChannel}
              onOpenAddSource={() => setIsAddSourceModalVisible(true)}
            />
          )}

          {currentTab === 'sources' && (
            <SourcesScreen
              key={`src_${refreshKey}`}
              onOpenAddSource={() => setIsAddSourceModalVisible(true)}
              onSourcesChanged={handleSourcesUpdated}
            />
          )}

          {currentTab === 'favorites' && (
            <FavoritesScreen
              key={`fav_${refreshKey}`}
              currentChannel={currentChannel}
              onSelectChannel={handleSelectChannel}
            />
          )}

          {currentTab === 'history' && (
            <HistoryScreen
              key={`hist_${refreshKey}`}
              currentChannel={currentChannel}
              onSelectChannel={handleSelectChannel}
            />
          )}
        </View>

        {/* Barra de Navegación Inferior (Mobile Tab Bar) con Insets para que el menú del sistema no la tape */}
        <View
          style={[
            styles.bottomTabBar,
            {
              paddingBottom: insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 20 : 8),
              height: 54 + (insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 20 : 8)),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handleTabChange('dashboard')}
          >
            <Ionicons
              name={currentTab === 'dashboard' ? 'grid' : 'grid-outline'}
              size={22}
              color={currentTab === 'dashboard' ? AutoTheme.colors.primary : AutoTheme.colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'dashboard' && styles.tabLabelActive,
              ]}
            >
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handleTabChange('channels')}
          >
            <MaterialCommunityIcons
              name={currentTab === 'channels' ? 'television-play' : 'television'}
              size={22}
              color={currentTab === 'channels' ? AutoTheme.colors.primary : AutoTheme.colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'channels' && styles.tabLabelActive,
              ]}
            >
              Canales
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handleTabChange('favorites')}
          >
            <Ionicons
              name={currentTab === 'favorites' ? 'star' : 'star-outline'}
              size={22}
              color={currentTab === 'favorites' ? AutoTheme.colors.secondary : AutoTheme.colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'favorites' && { color: AutoTheme.colors.secondary },
              ]}
            >
              Favoritos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handleTabChange('sources')}
          >
            <MaterialCommunityIcons
              name={currentTab === 'sources' ? 'playlist-play' : 'playlist-edit'}
              size={23}
              color={currentTab === 'sources' ? AutoTheme.colors.primary : AutoTheme.colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'sources' && styles.tabLabelActive,
              ]}
            >
              Fuentes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handleTabChange('history')}
          >
            <Ionicons
              name={currentTab === 'history' ? 'time' : 'time-outline'}
              size={22}
              color={currentTab === 'history' ? AutoTheme.colors.primary : AutoTheme.colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'history' && styles.tabLabelActive,
              ]}
            >
              Historial
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal de Agregar Fuente */}
        <AddSourceModal
          visible={isAddSourceModalVisible}
          onClose={() => setIsAddSourceModalVisible(false)}
          onSourceAdded={() => {
            handleSourcesUpdated();
            setCurrentTab('channels');
          }}
        />
      </View>
    );
  }

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AutoTheme.colors.background,
  },
  carSafeArea: {
    flex: 1,
    backgroundColor: AutoTheme.colors.carBg,
  },
  playerContainer: {
    paddingHorizontal: AutoTheme.spacing.lg,
    paddingTop: AutoTheme.spacing.sm,
    backgroundColor: AutoTheme.colors.background,
  },
  mainContent: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: AutoTheme.colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: AutoTheme.colors.border,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    color: AutoTheme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  tabLabelActive: {
    color: AutoTheme.colors.primary,
    fontWeight: '800',
  },
});
