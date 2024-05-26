import { useState } from 'react'

type LoadedPercentage = {
  current: number;
  previous: number;
};

export default function useLoading(initialValue: LoadedPercentage = {
  current: 0,
  previous: 0,
}): [LoadedPercentage, (increment: number) => void] {
  const [loadedPercentage, setLoadedPercentage] = useState<LoadedPercentage>(initialValue);

  const incrementLoadedPercentage = (increment: number): void => {
    setLoadedPercentage((prevLoadedPercentage: LoadedPercentage) => ({
      current: prevLoadedPercentage.current + increment,
      previous: prevLoadedPercentage.current,
    }));
  };

  return [loadedPercentage, incrementLoadedPercentage];
}