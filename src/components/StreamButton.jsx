import React, { useEffect, useState } from 'react';
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

function StreamButton({title, username}) {
  const [streamingLinks, setStreamingLinks] = useState([]);
  useEffect(() => {
    (async () => {
      // const data = await fetch(`http://localhost:9001/traktor-streaming?title=${encodeURIComponent(title)}&username=${encodeURIComponent(username)}`).then((response) => response.json()).catch(e => []);
      const data = await fetch(`https://home.limbe.ro/trast/traktor-streaming?title=${encodeURIComponent(title)}&username=${encodeURIComponent(username)}`).then((response) => response.json()).catch(e => []);
      // const data = await fetch(`http://192.168.0.105:9001/traktor-streaming?title=${encodeURIComponent(title)}&username=${encodeURIComponent(username)}`).then((response) => response.json()).catch(e => []);
      setStreamingLinks(data);
   })();
  }, [title]);

  if (streamingLinks.length === 0) {
    return null;
  }

  return <StyledStreamButton>
    {
      streamingLinks.map(link => (
        <a href={link.url} target="_blank" rel="noopener noreferrer">
          <img src={link.icon} width={20} />
        </a>
      ))
    }
    
  </StyledStreamButton>;
}

export default StreamButton;