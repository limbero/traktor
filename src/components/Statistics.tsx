import { useEffect, useState } from 'react';
import Trakt, { CalendarEpisode, HistoryEpisode, StatisticsShow } from '../apis/Trakt';

function sum(array: number[]) {
  return array.reduce(function (acc, cur) {
    return acc + cur;
  }, 0);
}

function humanTime(minutes: number) {
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

  type UnitName = "year" | "month" | "week" | "day" | "hour" | "minute";
  let minutesLeft = minutes;
  Object.entries(units).forEach(([unitName, unitSize]: [string, number]) => {
    while (minutesLeft > unitSize) {
      values[unitName as UnitName]++;
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

type StatisticsProps = {
  showIds: number[];
};

type ShowToRuntimeMap = {[key:string]: number};

const Statistics = ({ showIds }: StatisticsProps) => {
  const [shows, setShows] = useState<StatisticsShow[]>([]);
  const [historyEpisodes, setHistoryEpisodes] = useState<HistoryEpisode[]>([]);
  const [calendarEpisodes, setCalendarEpisodes] = useState<CalendarEpisode[]>([]);
  const [showToRuntimeMap, setShowToRuntimeMap] = useState<ShowToRuntimeMap>({});

  useEffect(() => {
    (async () => {
      if (shows.length > showIds.length) { return; } //finished a show, doesn't mean we need a refetch
      const fetchedShows = await Promise.all(
        showIds.map((showId) => Trakt.getShowForStatistics(showId))
      );
      setShows(fetchedShows);
      const srMap: ShowToRuntimeMap = {};
      fetchedShows.forEach((show, index) => {
        srMap[showIds[index].toString()] = show.next_episode?.runtime || show.last_episode?.runtime;
      });

      const calEpsPromise = Trakt.getCalendarDaysBack(LOOKBACK_DAYS);
      const hisEpsPromise = Trakt.getHistoryDaysBack(LOOKBACK_DAYS);

      function filterHiddenAndSpecials(arr: CalendarEpisode[]) {
        return arr.filter(
          (calendarEp) =>
            showIds.includes(calendarEp.show.ids.trakt) &&
            calendarEp.episode.season !== 0
        );
      }

      const calEps = filterHiddenAndSpecials(await calEpsPromise);
      const hisEps = await hisEpsPromise;
      setCalendarEpisodes(calEps);
      setHistoryEpisodes(hisEps);

      function unknownLengths(arr: CalendarEpisode[] | HistoryEpisode[]): number[] {
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
        srMap[unknownLengthShowIds[index]] = show.next_episode?.runtime || show.last_episode?.runtime;
      });
      setShowToRuntimeMap(srMap);
    })();
  }, [showIds]);

  const unfinishedEpisodes = sum(
    shows.map((show) => show.aired - show.completed)
  );
  const unfinishedMinutes = sum(
    shows.map(
      (show) => {
        const runtime = show.next_episode?.runtime || show.last_episode?.runtime;
        return (show.aired - show.completed) * runtime;
      }
    )
  );

  const addedMinutes = Math.round(sum(
    calendarEpisodes
      .map((ep) => showToRuntimeMap[ep.show.ids.trakt.toString()])
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
