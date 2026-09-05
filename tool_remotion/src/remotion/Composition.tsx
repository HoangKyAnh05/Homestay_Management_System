import React from 'react';
import { AbsoluteFill, Series, Audio, useVideoConfig, staticFile } from 'remotion';
import { RemotionVideoProps } from './types';
import { SceneItem } from './components/SceneItem';
import { ProgressBar } from './components/ProgressBar';
import { Watermark } from './components/Watermark';
import { AudioVisualizer } from './components/AudioVisualizer';
import { CinematicOverlay } from './components/CinematicOverlay';

const WHOOSH_SFX_URL = 'audio/whoosh.wav';

export const MainComposition: React.FC<RemotionVideoProps> = ({ project }) => {
  const { fps } = useVideoConfig();

  const scenes = project.scenes || [];
  const subtitleStyle = project.subtitleStyle;

  // Resolve audio URL safely (supports staticFile for relative paths, or direct data / file / http URLs)
  const resolveAudioSource = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('/audio/') || url.startsWith('audio/')) {
      try {
        return staticFile(url.replace(/^\//, ''));
      } catch (e) {
        return url;
      }
    }
    return url;
  };

  const bgmUrl = resolveAudioSource(project.bgm?.url);
  const whooshUrl = resolveAudioSource(WHOOSH_SFX_URL);

  const showAudioVisualizer = project.showAudioVisualizer ?? true;
  const showCinematicParticles = project.showCinematicParticles ?? true;
  const showCameraShake = project.showCameraShake ?? true;
  const enableDynamicEmojis = project.enableDynamicEmojis ?? true;

  return (
    <AbsoluteFill className="bg-black">
      {/* Background Music with Audio Ducking */}
      {bgmUrl && (
        <Audio
          src={bgmUrl}
          volume={project.bgm?.duckingVolume ?? 0.15}
          loop
        />
      )}

      {/* Sequential Scenes */}
      <Series>
        {scenes.map((scene, index) => {
          const durationInFrames = Math.max(
            Math.round((scene.audioDuration || 4) * fps),
            Math.round(2 * fps)
          );

          return (
            <Series.Sequence
              key={scene.id || index}
              durationInFrames={durationInFrames}
            >
              <SceneItem
                scene={scene}
                durationInFrames={durationInFrames}
                subtitleStyle={subtitleStyle}
                enableCameraShake={showCameraShake}
                enableDynamicEmojis={enableDynamicEmojis}
              />

              {/* Sound FX: Whoosh on Scene Transition (Only if scene has no custom transition audio) */}
              {project.soundFx?.enableWhoosh && index > 0 && !scene.transitionAudioUrl && (
                <Audio
                  src={whooshUrl}
                  volume={project.soundFx.volume ?? 0.3}
                  startFrom={0}
                />
              )}
            </Series.Sequence>
          );
        })}
      </Series>

      {/* Cinematic Floating Particles / Light Leak Overlay */}
      {showCinematicParticles && (
        <CinematicOverlay />
      )}

      {/* Audio Reactive Waveform Visualizer */}
      {showAudioVisualizer && (
        <AudioVisualizer color={subtitleStyle.highlightColor || '#22D3EE'} />
      )}

      {/* Brand Watermark / Logo Overlay */}
      {project.watermark && (
        <Watermark watermark={project.watermark} />
      )}

      {/* Bottom Progress Bar */}
      {project.showProgressBar && (
        <ProgressBar />
      )}
    </AbsoluteFill>
  );
};
