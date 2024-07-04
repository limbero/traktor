import styled from 'styled-components';
import { StreamingLocation } from '../apis/TraktorStreaming';
import { useLocalStorage } from 'usehooks-ts';
import { streamingServicesMap } from './StreamingServices';

const StyledStreamButtons = styled.div`
  position: absolute;
  top: 40px;
  left: 5px;

  background-color: rgba(255,255,255, 0.7);
  padding: 3px 3px 0px;
  border-radius: 5px;

  & img {
    margin: 3px 3px 0;
  }
`;

type StreamButtonsProps = {
  showStreamingLocations: StreamingLocation[];
};

function StreamButtons({ showStreamingLocations }: StreamButtonsProps) {
  const [streamingServices] = useLocalStorage<streamingServicesMap | null>("traktor-streaming-services", null);
  const userStreamingServices = Object.keys(streamingServices || {}).filter(key => (streamingServices || {})[key]);

  if (userStreamingServices.length === 0 || showStreamingLocations.length === 0) {
    return null;
  }

  const filteredStreamingServices: StreamingLocation[] = (showStreamingLocations || []).filter(link => userStreamingServices.includes(link.technical_name));
  if (filteredStreamingServices.length === 0) {
    return null;
  }

  return <StyledStreamButtons>
    {
      filteredStreamingServices.map(link => (
        <a key={link.technical_name} href={link.url} target="_blank" rel="noopener noreferrer">
          <img src={link.icon} width={20} />
        </a>
      ))
    }
  </StyledStreamButtons>;
}

export default StreamButtons;