import { type TrackReference, VideoTrack } from '@livekit/components-react';
import { cn } from '@/lib/utils';

interface AgentAudioTileProps {
  videoTrack: TrackReference;
  className?: string;
}

export const AvatarTile = ({
  videoTrack,
  className,
  ref,
}: React.ComponentProps<'div'> & AgentAudioTileProps) => {
  return (
    <div ref={ref} className={cn('flex items-center justify-center', className)}>
      <VideoTrack
        trackRef={videoTrack}
        width={videoTrack?.publication.dimensions?.width ?? 0}
        height={videoTrack?.publication.dimensions?.height ?? 0}
        className="max-h-[70vh] w-auto rounded-md object-contain"
      />
    </div>
  );
};
