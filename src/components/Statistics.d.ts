import { ZustandShowWithProgress } from "../zustand/ShowsProgressStore";

type StatisticsProps = {
  showIds: number[];
  includedShows: ZustandShowWithProgress[];
};
declare const Statistics: React.FunctionComponent<StatisticsProps>;

export default Statistics;