import { VideoProject, Scene, SubtitleStyle } from '../types/video';

export interface RemotionVideoProps {
  project: VideoProject;
}

export interface SceneProps {
  scene: Scene;
  fps: number;
  subtitleStyle: SubtitleStyle;
  aspectRatio: '9:16' | '16:9' | '1:1';
}
