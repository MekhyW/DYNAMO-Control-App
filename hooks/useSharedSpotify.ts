// hooks/useSharedSpotify.ts
import { useState, useEffect, useCallback } from 'react';
import { SpotifyTrack, SpotifyPlaybackState } from '@/types/spotify';

export function useSharedSpotify() {
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<SpotifyTrack[]>([]);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [activeDevice, setActiveDevice] = useState<any | null>(null);
  const [isSpotifyAvailable, setIsSpotifyAvailable] = useState(false);

  const searchTracks = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/spotify/shared/search?q=${encodeURIComponent(query)}`);
      if (response.status === 503) {
        setIsSpotifyAvailable(false);
        setSearchResults([]);
        return;
      }
      const data = await response.json();
      setSearchResults(data.tracks?.items || []);
      setIsSpotifyAvailable(true);
    } catch (error) {
      console.error('Error searching tracks:', error);
      setSearchResults([]);
      setIsSpotifyAvailable(false);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch('/api/spotify/shared/devices');
      if (response.status === 503) {
        setIsSpotifyAvailable(false);
        setAvailableDevices([]);
        setActiveDevice(null);
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setAvailableDevices(data.devices || []);
        const active = data.devices?.find((device: any) => device.is_active);
        setActiveDevice(active || null);
        setIsSpotifyAvailable(true);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      setIsSpotifyAvailable(false);
    }
  }, []);

  const transferPlayback = useCallback(async (deviceId: string, play = false) => {
    try {
      const response = await fetch('/api/spotify/shared/transfer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_ids: [deviceId], play })
      });
      if (response.status === 503) {
        setIsSpotifyAvailable(false);
        throw new Error('Spotify not available - owner needs to authenticate first');
      }
      await fetchDevices(); // Refresh devices after transfer
      setIsSpotifyAvailable(true);
    } catch (error) {
      console.error('Error transferring playback:', error);
      throw error;
    }
  }, [fetchDevices]);

  const playTrack = useCallback(async (trackUri: string, fromQueue = false) => {
    try {
      if (!activeDevice && availableDevices.length > 0) {
        const firstDevice = availableDevices[0];
        await transferPlayback(firstDevice.id, true); 
      }
      const response = await fetch('/api/spotify/shared/play', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: [trackUri] })
      });
      if (response.status === 503) {
        setIsSpotifyAvailable(false);
        throw new Error('Spotify not available - owner needs to authenticate first');
      }
      setIsPlaying(true);
      setIsSpotifyAvailable(true);
      if (fromQueue) {
        setQueue(prev => prev.filter(track => track.uri !== trackUri));
      }
    } catch (error) {
      console.error('Error playing track:', error);
      throw error;
    }
  }, [activeDevice, availableDevices, transferPlayback]);

  const togglePlayback = useCallback(async () => {
    try {
      const endpoint = isPlaying ? '/api/spotify/shared/pause' : '/api/spotify/shared/play';
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (response.status === 503) {
        setIsSpotifyAvailable(false);
        throw new Error('Spotify not available - owner needs to authenticate first');
      }
      setIsPlaying(!isPlaying);
      setIsSpotifyAvailable(true);
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  }, [isPlaying]);

  const addToQueue = useCallback(async (track: SpotifyTrack) => {
    try {
      if (queue.some(t => t.uri === track.uri)) {
        return; // Prevent duplicate tracks
      }
      const response = await fetch('/api/spotify/shared/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: track.uri })
      });
      if (response.status === 503) {
        setIsSpotifyAvailable(false);
        throw new Error('Spotify not available - owner needs to authenticate first');
      }
      setQueue(prev => [...prev, track]);
      setIsSpotifyAvailable(true);
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  }, [queue]);

  const fetchPlaybackState = useCallback(async () => {
    try {
      const response = await fetch('/api/spotify/shared/playback-state');
      if (response.status === 503) {
        setIsSpotifyAvailable(false);
        setIsPlaying(false);
        setCurrentTrack(null);
        setActiveDevice(null);
        return;
      }
      const state: SpotifyPlaybackState = await response.json();
      setIsPlaying(state.is_playing);
      setCurrentTrack(state.item);
      if (state.device) {
        setActiveDevice(state.device);
      }
      setIsSpotifyAvailable(true);
      await fetchDevices(); // Also fetch available devices
    } catch (error) {
      console.error('Error fetching playback state:', error);
      setIsSpotifyAvailable(false);
    }
  }, [fetchDevices]);

  useEffect(() => {
    fetchPlaybackState();
    const interval = setInterval(fetchPlaybackState, 5000);
    return () => clearInterval(interval);
  }, [fetchPlaybackState]);

  const skipTrack = useCallback(async () => {
    try {
      if (queue.length > 0) {
        const nextTrack = queue[0];
        await playTrack(nextTrack.uri, true);
      } else {
        const response = await fetch('/api/spotify/shared/next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.status === 503) {
          setIsSpotifyAvailable(false);
          throw new Error('Spotify not available - owner needs to authenticate first');
        }
        setIsSpotifyAvailable(true);
      }
    } catch (error) {
      console.error('Error skipping track:', error);
    }
  }, [queue, playTrack]);

  return {
    searchResults,
    currentTrack,
    isPlaying,
    queue,
    availableDevices,
    activeDevice,
    isSpotifyAvailable,
    searchTracks,
    playTrack,
    togglePlayback,
    addToQueue,
    skipTrack,
    transferPlayback,
    fetchDevices,
  };
}