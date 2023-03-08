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

function linkToIcon(link) {
  if (link.includes("amazon")) {
    return "icons/amazon.png";
  }
  if (link.includes("apple")) {
    return "icons/apple.jpeg";
  }
  if (link.includes("bbc.")) {
    return "icons/bbc.png";
  }
  if (link.includes("cineasterna")) {
    return "icons/cineasterna.png";
  }
  if (link.includes("cmore")) {
    return "icons/cmore.png";
  }
  if (link.includes("disneyp")) {
    return "icons/disney.png";
  }
  if (link.includes("hbom")) {
    return "icons/hbo.png";
  }
  if (link.includes("itv.")) {
    return "icons/itv.png";
  }
  if (link.includes("mubi")) {
    return "icons/mubi.png";
  }
  if (link.includes("netflix")) {
    return "icons/netflix.png";
  }
  if (link.includes("now")) {
    return "icons/nowtv.png";
  }
  if (link.includes("paramount")) {
    return "icons/paramount.png";
  }
  if (link.includes("plex.tv")) {
    return "icons/plex.png";
  }
  if (link.includes("svtpl")) {
    return "icons/svt.png";
  }
}

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
        <a href={link} target="_blank" rel="noopener noreferrer">
          <img src={linkToIcon(link)} width={20} />
        </a>
      ))
    }
    
  </StyledStreamButton>;
}

export default StreamButton;