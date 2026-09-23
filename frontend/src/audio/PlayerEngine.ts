export interface PlayerEngineEvents {
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onTrackNearEnd: () => void;
  onPlayStateChange: (isPlaying: boolean, isBuffering: boolean) => void;
  onError: (error: string) => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

let engineInstance: PlayerEngine | null = null;

export function getPlayerEngine(events: PlayerEngineEvents): PlayerEngine {
  if (!engineInstance) {
    engineInstance = new PlayerEngine(events);
  } else {
    engineInstance.updateEvents(events);
  }
  return engineInstance;
}

export class PlayerEngine {
  private playerA: any = null;
  private playerB: any = null;
  private isPlayerAReady = false;
  private isPlayerBReady = false;
  private activeChannel: 'A' | 'B' = 'A';

  private events: PlayerEngineEvents;
  private crossfadeDuration = 4; // seconds
  private currentVolume = 0.85; // 0 to 1
  private isNearEndDispatched = false;
  private isFading = false;
  private timeUpdateTimer: any = null;
  private fadeTimer: any = null;
  private pendingTrackId: string | null = null;
  private pendingEnableCrossfade = false;

  constructor(events: PlayerEngineEvents) {
    this.events = events;
    this.initYouTubeApi();
    this.startTimeUpdater();
  }

  public updateEvents(events: PlayerEngineEvents): void {
    this.events = events;
  }

  private initYouTubeApi(): void {
    if (typeof window === 'undefined') return;

    const setupPlayers = () => {
      this.createPlayers();
    };

    if (window.YT && window.YT.Player) {
      setupPlayers();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        setupPlayers();
      };
    }
  }

  private createPlayers(): void {
    if (!window.YT || !window.YT.Player) return;

    const slotA = document.getElementById('yt-player-slot-a');
    const slotB = document.getElementById('yt-player-slot-b');

    if (!slotA || !slotB) {
      console.warn('Player slots not found in DOM yet');
      return;
    }

    const config = (channel: 'A' | 'B') => ({
      height: '200',
      width: '200',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: (e: any) => {
          console.log(`YouTube Player ${channel} ready. loadVideoById:`, typeof e.target?.loadVideoById);
          if (channel === 'A') {
            this.playerA = e.target;
            this.isPlayerAReady = true;
          } else {
            this.playerB = e.target;
            this.isPlayerBReady = true;
          }

          try {
            if (typeof e.target?.setVolume === 'function') {
              e.target.setVolume(Math.round(this.currentVolume * 100));
            }
          } catch {}

          if (this.pendingTrackId) {
            const id = this.pendingTrackId;
            const xfade = this.pendingEnableCrossfade;
            this.pendingTrackId = null;
            this.playTrack(id, xfade);
          }
        },
        onStateChange: (event: any) => {
          this.handleStateChange(channel, event.data);
        },
        onError: (event: any) => {
          console.warn(`YouTube Player ${channel} error code:`, event.data);
          if (event.data === 150 || event.data === 101) {
            this.events.onError('This track restricts embedded playback. Skipping to next track in queue...');
            setTimeout(() => {
              this.events.onEnded();
            }, 1200);
          } else if (event.data !== 2) {
            this.events.onError(`Playback error (code ${event.data})`);
          }
        },
      },
    });

    try {
      if (!this.playerA) {
        this.playerA = new window.YT.Player('yt-player-slot-a', config('A'));
      }
      if (!this.playerB) {
        this.playerB = new window.YT.Player('yt-player-slot-b', config('B'));
      }
    } catch (e) {
      console.error('Error instantiating YT.Player:', e);
    }
  }

  private handleStateChange(channel: 'A' | 'B', state: number): void {
    if (this.activeChannel !== channel && !this.isFading) return;

    // YT.PlayerState: 0 (ENDED), 1 (PLAYING), 2 (PAUSED), 3 (BUFFERING)
    switch (state) {
      case 0: // ENDED
        if (this.activeChannel === channel && !this.isFading) {
          this.events.onEnded();
        }
        break;
      case 1: // PLAYING
        if (this.activeChannel === channel) {
          this.events.onPlayStateChange(true, false);
        }
        break;
      case 2: // PAUSED
        if (this.activeChannel === channel && !this.isFading) {
          this.events.onPlayStateChange(false, false);
        }
        break;
      case 3: // BUFFERING
        if (this.activeChannel === channel) {
          this.events.onPlayStateChange(true, true);
        }
        break;
    }
  }

  private startTimeUpdater(): void {
    if (this.timeUpdateTimer) clearInterval(this.timeUpdateTimer);
    this.timeUpdateTimer = setInterval(() => {
      const activePlayer = this.getActivePlayer();
      if (!activePlayer || typeof activePlayer.getCurrentTime !== 'function') return;

      try {
        const cur = activePlayer.getCurrentTime() || 0;
        const dur = activePlayer.getDuration() || 0;

        this.events.onTimeUpdate(cur, dur);

        const triggerTime = Math.max(1, this.crossfadeDuration + 1);
        if (dur > 0 && dur - cur <= triggerTime && !this.isNearEndDispatched && !this.isFading) {
          this.isNearEndDispatched = true;
          this.events.onTrackNearEnd();
        }
      } catch {
        // Player not ready
      }
    }, 150);
  }

  private getActivePlayer(): any {
    return this.activeChannel === 'A' ? this.playerA : this.playerB;
  }

  public unlock(): void {
    // Direct user click unlock
    const active = this.getActivePlayer();
    if (active && typeof active.playVideo === 'function') {
      try {
        active.playVideo();
      } catch {}
    }
  }

  public setCrossfadeDuration(seconds: number): void {
    this.crossfadeDuration = Math.max(0, Math.min(12, seconds));
  }

  public setVolume(volume: number): void {
    const vol = Math.max(0, Math.min(1, volume));
    this.currentVolume = vol;
    const ytVol = Math.round(vol * 100);

    try {
      if (typeof this.playerA?.setVolume === 'function') this.playerA.setVolume(ytVol);
      if (typeof this.playerB?.setVolume === 'function') this.playerB.setVolume(ytVol);
    } catch {}
  }

  public async playTrack(videoId: string, enableCrossfade = false): Promise<void> {
    // Cancel ongoing fade if active
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
      this.isFading = false;
    }

    const currentChannel = this.activeChannel;
    const otherChannel = currentChannel === 'A' ? 'B' : 'A';
    const activePlayer = this.getActivePlayer();
    const otherPlayer = otherChannel === 'A' ? this.playerA : this.playerB;

    let isOldPlaying = false;
    try {
      isOldPlaying =
        activePlayer &&
        typeof activePlayer.getPlayerState === 'function' &&
        activePlayer.getPlayerState() === 1;
    } catch {}

    const shouldCrossfade =
      enableCrossfade &&
      this.crossfadeDuration > 0 &&
      isOldPlaying &&
      otherPlayer &&
      typeof otherPlayer.loadVideoById === 'function';

    if (shouldCrossfade) {
      this.isFading = true;
      this.activeChannel = otherChannel;
      this.isNearEndDispatched = false;

      const targetVol = Math.round(this.currentVolume * 100);
      try {
        if (typeof otherPlayer.setVolume === 'function') {
          otherPlayer.setVolume(0);
        }
        otherPlayer.loadVideoById(videoId, 0);
        otherPlayer.playVideo();
      } catch (e) {
        console.error('Crossfade loadVideoById error:', e);
      }

      const startTime = Date.now();
      const fadeMs = this.crossfadeDuration * 1000;

      this.fadeTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / fadeMs);

        const oldVol = Math.round(targetVol * (1 - progress));
        const newVol = Math.round(targetVol * progress);

        try {
          if (typeof activePlayer?.setVolume === 'function') activePlayer.setVolume(oldVol);
          if (typeof otherPlayer?.setVolume === 'function') otherPlayer.setVolume(newVol);
        } catch {}

        if (progress >= 1) {
          if (this.fadeTimer) clearInterval(this.fadeTimer);
          this.fadeTimer = null;
          this.isFading = false;
          try {
            activePlayer?.stopVideo();
            if (typeof activePlayer?.setVolume === 'function') activePlayer.setVolume(targetVol);
          } catch {}
        }
      }, 50);
      return;
    }

    // Direct playback (no crossfade):
    // Use the active player if ready; otherwise if other player is ready, use it
    let targetChannel: 'A' | 'B' = currentChannel;
    let targetPlayer = activePlayer;

    const isActiveReady = activePlayer && typeof activePlayer.loadVideoById === 'function';
    const isOtherReady = otherPlayer && typeof otherPlayer.loadVideoById === 'function';

    if (!isActiveReady && isOtherReady) {
      targetChannel = otherChannel;
      targetPlayer = otherPlayer;
    }

    if (!targetPlayer || typeof targetPlayer.loadVideoById !== 'function') {
      console.log(`Neither YouTube player ready yet, queuing ${videoId}...`);
      this.pendingTrackId = videoId;
      this.pendingEnableCrossfade = enableCrossfade;
      if (!this.playerA || !this.playerB) {
        this.createPlayers();
      }
      return;
    }

    this.activeChannel = targetChannel;
    this.isNearEndDispatched = false;

    // Stop whichever player is inactive
    const inactivePlayer = targetChannel === 'A' ? this.playerB : this.playerA;
    try {
      if (typeof inactivePlayer?.stopVideo === 'function') {
        inactivePlayer.stopVideo();
      }
    } catch {}

    const targetVol = Math.round(this.currentVolume * 100);
    try {
      if (typeof targetPlayer.setVolume === 'function') {
        targetPlayer.setVolume(targetVol);
      }
      targetPlayer.loadVideoById(videoId, 0);
      targetPlayer.playVideo();
    } catch (e) {
      console.error('Error starting video playback:', e);
    }
  }

  public pause(): void {
    const active = this.getActivePlayer();
    if (active && typeof active.pauseVideo === 'function') {
      active.pauseVideo();
    }
  }

  public resume(): void {
    const active = this.getActivePlayer();
    if (active && typeof active.playVideo === 'function') {
      active.playVideo();
    }
  }

  public seek(seconds: number): void {
    const active = this.getActivePlayer();
    if (active && typeof active.seekTo === 'function') {
      active.seekTo(seconds, true);
      this.isNearEndDispatched = false;
    }
  }

  public getCurrentTime(): number {
    const active = this.getActivePlayer();
    if (active && typeof active.getCurrentTime === 'function') {
      return active.getCurrentTime() || 0;
    }
    return 0;
  }

  public getDuration(): number {
    const active = this.getActivePlayer();
    if (active && typeof active.getDuration === 'function') {
      return active.getDuration() || 0;
    }
    return 0;
  }

  public destroy(): void {
    if (this.timeUpdateTimer) clearInterval(this.timeUpdateTimer);
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    try {
      this.playerA?.destroy();
      this.playerB?.destroy();
    } catch {}
  }
}
