import React, { useEffect, useState } from 'react';
import Trakt from '../apis/Trakt';

function sum(array) {
  return array.reduce(function (acc, cur) {
    return acc + cur;
  }, 0);
}

function humanTime(minutes) {
  if (minutes < 0) {
    return humanTime(-minutes);
  } else if (minutes === 0) {
    return '0 minutes';
  }

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
    while (minutesLeft > unitSize) {
      values[unitName]++;
      minutesLeft -= unitSize;
    }
    if (unitName === 'minute') {
      values[unitName]++;
    }
  });

  const valueStrings = Object.entries(values)
    .filter(([, unitValue]) => unitValue > 0)
    .map(([unitName, unitValue]) => {
      return unitValue > 0
        ? `${unitValue} ${unitName}${unitValue > 1 ? 's' : ''}`
        : '';
    });

  if (valueStrings.length === 1) {
    return valueStrings[0];
  }
  return `${valueStrings.slice(0, -1).join(', ')}, and ${valueStrings.slice(
    -1
  )}`;
}

const LOOKBACK_DAYS = 30;

const Statistics = ({ showIds, includedShows }) => {
  const [shows, setShows] = useState([]);
  const [historyEpisodes, setHistoryEpisodes] = useState([]);
  const [calendarEpisodes, setCalendarEpisodes] = useState([]);
  const [showToRuntimeMap, setShowToRuntimeMap] = useState({});

  useEffect(() => {
    (async () => {
      const fetchedShows = await Promise.all(
        showIds.map((showId) => Trakt.getShowForStatistics(showId))
      );
      setShows(fetchedShows);
      const srMap = {};
      fetchedShows.forEach((show, index) => {
        srMap[showIds[index]] = show.next_episode.runtime;
      });

      const calEpsPromise = Trakt.getCalendarDaysBack(LOOKBACK_DAYS);
      const hisEpsPromise = Trakt.getHistoryDaysBack(LOOKBACK_DAYS);

      function filterHiddenAndSpecials(arr) {
        return arr.filter(
          (calendarEp) =>
            includedShows.includes(calendarEp.show.ids.trakt) &&
            calendarEp.episode.season !== 0
        );
      }

      const calEps = filterHiddenAndSpecials(await calEpsPromise);
      const hisEps = filterHiddenAndSpecials(await hisEpsPromise);
      setCalendarEpisodes(calEps);
      setHistoryEpisodes(hisEps);

      function unknownLengths(arr) {
        return arr
          .filter((ep) => !srMap[ep.show.ids.trakt])
          .map((ep) => ep.show.ids.trakt);
      }

      const unknownLengthShowIds = [
        ...new Set([...unknownLengths(hisEps), ...unknownLengths(calEps)]),
      ];

      const additionalLengths = await Promise.all(
        unknownLengthShowIds.map((showId) => Trakt.getShowForStatistics(showId))
      );
      additionalLengths.forEach((show, index) => {
        srMap[unknownLengthShowIds[index]] = show.last_episode.runtime;
      });
      setShowToRuntimeMap(srMap);
    })();
  }, [showIds]);

  const unfinishedEpisodes = sum(
    shows.map((show) => show.aired - show.completed)
  );
  const unfinishedMinutes = sum(
    shows.map(
      (show) => (show.aired - show.completed) * show.next_episode.runtime
    )
  );

  const addedMinutes = Math.round(sum(
    calendarEpisodes
      .map((ep) => showToRuntimeMap[ep.show.ids.trakt])
      .filter((ep) => typeof ep !== 'undefined')
  ) / LOOKBACK_DAYS);
  const watchedMinutes = Math.round(sum(
    historyEpisodes
      .map((ep) => showToRuntimeMap[ep.show.ids.trakt])
      .filter((ep) => typeof ep !== 'undefined')
  ) / LOOKBACK_DAYS);

  const velocity = addedMinutes - watchedMinutes;
  const sign = (() => {
    if (velocity > 0) {
      return '+';
    } else if (velocity === 0) {
      return '±';
    } else {
      return '-';
    }
  })();

  return (
    <div style={{ margin: '0 2em 50px' }}>
      <p style={{ margin: 0 }}>{shows.length} unfinished shows</p>
      <p style={{ margin: 0 }}>{unfinishedEpisodes} unfinished episodes</p>
      <p style={{ margin: 0 }}>
        {humanTime(unfinishedMinutes)} of TV left to watch
      </p>
      <p style={{ marginBottom: 0 }}>Average per day over the past month:</p>
      <p style={{ margin: 0 }}>
        {humanTime(watchedMinutes)} watched
      </p>
      <p style={{ margin: 0 }}>
        {humanTime(addedMinutes)} of new TV aired
      </p>
      <p style={{ margin: 0 }}>
        Net velocity {sign}{humanTime(velocity)} per day
      </p>
    </div>
  );
};

export default Statistics;
