// AutoLari Core Types & Interfaces

export type MediaType = 'live_tv' | 'radio' | 'vod' | 'stream' | 'youtube';

export interface Channel {
  id: string;
  sourceId: string;
  name: string;
  streamUrl: string;
  logoUrl?: string;
  groupTitle: string;
  country?: string;
  ambit?: string;
  tags?: string[];
  tvgId?: string;
  tvgName?: string;
  mediaType: MediaType;
  isFavorite?: boolean;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  type: 'm3u' | 'json' | 'stream' | 'xtream' | 'custom';
  isActive: boolean;
  channelCount: number;
  lastUpdated: string;
  createdAt: string;
}

export interface FavoriteItem {
  id: string; // targetId (channel id or stream id)
  targetType: MediaType;
  title: string;
  subtitle?: string;
  streamUrl: string;
  imageUrl?: string;
  groupTitle?: string;
  addedAt: string;
}

export interface HistoryItem {
  id: string;
  targetId: string;
  targetType: MediaType;
  title: string;
  streamUrl: string;
  imageUrl?: string;
  groupTitle?: string;
  lastPlayedAt: string;
}

export interface PlaybackState {
  currentChannel: Channel | null;
  isPlaying: boolean;
  isBuffering: boolean;
  isMuted: boolean;
  volume: number;
  error: string | null;
  isFullscreen: boolean;
  isPictureInPicture: boolean;
  quality: string;
}

export type AppMode = 'mobile' | 'car';

export type MainTab = 'dashboard' | 'channels' | 'sources' | 'favorites' | 'history' | 'youtube' | 'settings';
