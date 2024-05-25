import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import TraktorStreaming, { StreamingService } from '../apis/TraktorStreaming';

export interface streamingServicesMap {
  [key: string]: boolean;
};

function Watchlist() {
  const [streamingServices, setStreamingServices] = useState<StreamingService[] | null>(null);
  const [checkBoxes, setCheckBoxes, removeCheckBoxes] = useLocalStorage<streamingServicesMap | null>("traktor-streaming-services", null);
  useEffect(() => {
    (async () => {
      const streamers: StreamingService[] = await TraktorStreaming.getAllServices();
      setStreamingServices(streamers);
    })();
  }, []);
  useEffect(() => {
    if (streamingServices === null) return;
    if (checkBoxes === null) {
      const services: streamingServicesMap = {};
      streamingServices.forEach(service => services[service.technical_name] = false);
      setCheckBoxes(services);
    } else {
      const newCheckBoxes = {...checkBoxes};
      streamingServices.forEach(service => {
        if (Object.hasOwn(newCheckBoxes, service.technical_name)) {
          return;
        }
        newCheckBoxes[service.technical_name] = false;
      });
      Object.keys(newCheckBoxes).forEach(techname => {
        if (streamingServices.find(service => service.technical_name === techname)) {
          return;
        }
        delete newCheckBoxes[techname];
      });
    }
  }, [streamingServices]);

  if (streamingServices === null || checkBoxes === null) {
    return null;
  }

  return (<>
    {streamingServices.map(streamingService => (
      <div key={streamingService.technical_name}>
        <input
          type="checkbox"
          id={streamingService.technical_name}
          onChange={() => {
            const newCheckBoxes = {...checkBoxes};
            newCheckBoxes[streamingService.technical_name] = !newCheckBoxes[streamingService.technical_name];
            setCheckBoxes(newCheckBoxes);
          }} checked={checkBoxes[streamingService.technical_name]}
        />
        <label htmlFor={streamingService.technical_name}>
          <img src={streamingService.icon} width={20} style={{verticalAlign: "sub"}} /> {streamingService.clear_name}
        </label>
      </div>
    ))}
  </>);
}

export default Watchlist;