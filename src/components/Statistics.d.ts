import { ShowWithProgress } from "../zustand/ShowsProgressStore";

type StatisticsProps = {
  showIds: number[];
  includedShows: ShowWithProgress[];
};
declare const Statistics: React.FunctionComponent<StatisticsProps>;

export default Statistics;