import React from "react";

export default function ShowProgressBar({show}) {
  const episodes = show.seasons.flatMap(season => season.episodes);
  const oneEpisodeWidth = 100 / episodes.length;
  return episodes.map((ep, id) => (
    <div
      key={id}
      className="progress-bar"
      style={{
        width: `${ep.completed ? oneEpisodeWidth : 0}%`,
        left: `${oneEpisodeWidth * id}%`,
      }}
    />
  ));
}