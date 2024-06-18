import Trakt from '../apis/Trakt';
import { ZustandShowWithProgress } from '../zustand/ShowsProgressStore';

type ShowProgressBarProps = {
  show: ZustandShowWithProgress;
};

export default function ShowProgressBar({ show }: ShowProgressBarProps) {
  const episodes = show.seasons.flatMap((season) => season.episodes);
  const oneEpisodeWidth = 100 / episodes.length;
  const resetAt = Trakt.showResetAt(show);
  return episodes.map((ep, id) => (
    <div
      key={id}
      className="progress-bar"
      style={{
        width: ep.completed && Date.parse(ep.last_watched_at) > resetAt ? `calc(${oneEpisodeWidth}% + 1px)` : 0,
        left: `${oneEpisodeWidth * id}%`,
      }}
    />
  ));
}
