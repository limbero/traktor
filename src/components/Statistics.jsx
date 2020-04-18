import React, { useEffect, useState } from "react";
import Trakt from "../apis/Trakt";

function sum(array) {
  return array.reduce(function (acc, cur) {
    return acc + cur
  }, 0);
}

function humanTime(minutes) {
  if (minutes === 0) { return 'No TV left to watch'; }
  
  const minute = 1;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  const units = {
    year,
    month,
    week,
    day,
    hour,
    minute,
  };

  const values = {
    year: 0,
    month: 0,
    week: 0,
    day: 0,
    hour: 0,
    minute: 0,
  };

  let minutesLeft = minutes;
  Object.entries(units).forEach(([unitName, unitSize]) => {
    while(minutesLeft > unitSize) {
      values[unitName]++;
      minutesLeft -= unitSize;
    }
  });

  const valueStrings = Object.entries(values)
    .filter(([, unitValue]) => unitValue > 0)
    .map(([unitName, unitValue]) => {
      return unitValue > 0 ? `${unitValue} ${unitName}${unitValue > 1 ? 's' : ''}` : '';
    });
  
  return `${valueStrings.slice(0, -1).join(', ')}, and ${valueStrings.slice(-1)} of TV left to watch`;
}

const Statistics = ({showIds}) => {
  const [shows, setShows] = useState([]);

  useEffect(() => {
    (async () => {
      setShows(await Promise.all(showIds.map(showId => Trakt.getShowForStatistics(showId))));
    })();
  }, [showIds]);

  const unfinishedEpisodes = sum(shows.map(show => show.aired - show.completed));
  const unfinishedMinutes = sum(shows.map(show => (show.aired - show.completed) * show.next_episode.runtime));

  return (
    <div style={{ marginBottom: '50px' }}>
      <p style={{ margin: 0 }}>{shows.length} unfinished shows</p>
      <p style={{ margin: 0 }}>{unfinishedEpisodes} unfinished episodes</p>
      <p style={{ margin: 0 }}>{humanTime(unfinishedMinutes)}</p>
    </div>
  );
};

export default Statistics;