import { useEffect, useState } from 'react';
import Trakt from '../apis/Trakt';
import { ZustandShowWithProgress } from '../zustand/ShowsProgressStore';

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
  shows: ZustandShowWithProgress[];
};

type ShowToRuntimeMap = { [key: string]: number | undefined };

const Statistics = ({ shows }: StatisticsProps) => {
  const snMap: ShowToRuntimeMap = {};
  shows.forEach(show => {
    snMap[show.ids.slug] = show.aired - show.completed;
  });

  const [watchedMinutes, setWatchedMinutes] = useState<number>(0);
  const [airedMinutes, setAiredMinutes] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const showIds = shows.map(show => show.ids.trakt);
      const calEps = (await Trakt.getCalendarDaysBack(LOOKBACK_DAYS)).filter(
        (calendarEp) =>
          showIds.includes(calendarEp.show.ids.trakt) &&
          calendarEp.episode.season !== 0
      );
      const hisEps = await Trakt.getHistoryDaysBack(LOOKBACK_DAYS);

      setWatchedMinutes(
        Math.round(
          sum(
            hisEps.map(hisEp => hisEp.episode.runtime)
          ) / LOOKBACK_DAYS
        )
      );
      setAiredMinutes(
        Math.round(
          sum(
            calEps.map(calEp => calEp.episode.runtime)
          ) / LOOKBACK_DAYS
        )
      );
    })();
  }, []);

  const unfinishedEpisodesList = shows.map((show) => show.aired - show.completed);
  const unfinishedEpisodes = sum(unfinishedEpisodesList);
  const unfinishedMinutes = sum(unfinishedEpisodesList.map((eps, idx) => eps * (shows[idx].runtime || 20)))
  const velocity = airedMinutes - watchedMinutes;
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
        {humanTime(airedMinutes)} of new TV aired
      </p>
      <p style={{ margin: 0 }}>
        Net velocity {sign}{humanTime(velocity)} per day
      </p>
    </div>
  );
};

export default Statistics;
