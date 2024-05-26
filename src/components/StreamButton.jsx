import React, { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import styled from 'styled-components';

const StyledStreamButton = styled.div`
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

function StreamButton({title}) {
  const [streamingLinks, setStreamingLinks] = useState([]);
  const [streamingServices, setStreamingServices, removeStreamingServices] = useLocalStorage("traktor-streaming-services", null);
  useEffect(() => {
    (async () => {
      const data = await fetch(`https://home.limbe.ro/trast/traktor-streaming?title=${encodeURIComponent(title)}`).then((response) => response.json()).catch(e => []);
      setStreamingLinks(data);
   })();
  }, [title]);

  const filteredStreamingLinks = streamingLinks.filter(link => streamingServices[link.technical_name]);
  if (filteredStreamingLinks.length === 0 || streamingServices === null) {
    return null;
  }

  return <StyledStreamButton>
    {
      filteredStreamingLinks.map(link => (
        <a key={link.technical_name} href={link.url} target="_blank" rel="noopener noreferrer">
          <img src={link.icon} width={20} />
        </a>
      ))
    }
    
  </StyledStreamButton>;
}

export default StreamButton;