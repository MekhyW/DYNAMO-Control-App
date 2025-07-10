// hooks/useSpotify.ts
import { useState, useEffect, useCallback } from 'react';
import { SpotifyTrack, SpotifyPlaybackState } from '@/types/spotify';

export function useSpotify() {
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<SpotifyTrack[]>([]);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [activeDevice, setActiveDevice] = useState<any | null>(null);

  const searchTracks = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.tracks?.items || []);
    } catch (error) {
      console.error('Error searching tracks:', error);
      setSearchResults([]);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch('/api/spotify/devices');
      if (response.ok) {
        const data = await response.json();
        setAvailableDevices(data.devices || []);
        const active = data.devices?.find((device: any) => device.is_active);
        setActiveDevice(active || null);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  }, []);

  const transferPlayback = useCallback(async (deviceId: string, play = false) => {
    try {
      await fetch('/api/spotify/transfer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_ids: [deviceId], play })
      });
      await fetchDevices(); // Refresh devices after transfer
    } catch (error) {
      console.error('Error transferring playback:', error);
      throw error;
    }
  }, [fetchDevices]);

  const playTrack = useCallback(async (trackUri: string, fromQueue = false) => {
    try {
      if (!activeDevice && availableDevices.length > 0) { // If no active device, try to activate the first available device
        const firstDevice = availableDevices[0];
        await transferPlayback(firstDevice.id, true); 
      }
      await fetch('/api/spotify/play', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: [trackUri] })
      });
      setIsPlaying(true);
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
      await fetch(`/api/spotify/${isPlaying ? 'pause' : 'play'}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  }, [isPlaying]);

  const addToQueue = useCallback(async (track: SpotifyTrack) => {
    try {
      if (queue.some(t => t.uri === track.uri)) {
        return; // Prevent duplicate tracks
      }
      await fetch('/api/spotify/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: track.uri })
      });
      setQueue(prev => [...prev, track]);
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  }, [queue]);

  const fetchQueue = useCallback(async () => {
    try {
      const response = await fetch('/api/spotify/queue-state');
      if (response.ok) {
        const queueData = await response.json();
        setQueue(queueData.queue || []); // Update local queue to match Spotify's queue
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  }, []);

  const fetchPlaybackState = useCallback(async () => {
    try {
      const response = await fetch('/api/spotify/playback-state');
      const state: SpotifyPlaybackState = await response.json();
      setIsPlaying(state.is_playing);
      setCurrentTrack(state.item);
      if (state.device) {
        setActiveDevice(state.device);
      }
      await fetchQueue(); // Also fetch and sync the queue
      await fetchDevices(); // Also fetch available devices
    } catch (error) {
      console.error('Error fetching playback state:', error);
    }
  }, [fetchQueue, fetchDevices]);

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
        await fetch('/api/spotify/next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
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
    searchTracks,
    playTrack,
    togglePlayback,
    addToQueue,
    skipTrack,
    transferPlayback,
    fetchDevices,
  };
}