import styled from 'styled-components';

import TheMovieDb from '../apis/TheMovieDb';
import CircularButton from './elements/CircularButton';
import { TraktShow } from '../apis/Trakt';
import { useEffect, useState } from 'react';

const StyledShowToAdd = styled.div`
  & button {
    position: absolute;
    right: 13px;
    top: 0;
  }
  &:hover button {
    top: -18px;
  }
`;

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

type AppProps = {
  addShow: Function;
  show: TraktShow;
  alreadyPresent: boolean;
  streamingServices: string[];
};

function ShowToAdd({ addShow, show, alreadyPresent, streamingServices }: AppProps) {
  const [image, setImage] = useState<string>("");
  async function fetchImage() {
    const image = await TheMovieDb.getImage(show.ids.tmdb.toString());
    setImage(image);
  }
  useEffect(() => {
    fetchImage();
  }, [show]);

  const myStreamingLocations = (show?.streaming_locations || []).filter(link => streamingServices.includes(link.technical_name));
  return (
    <StyledShowToAdd
      className="show"
      style={{ backgroundImage: image ? `url(${image})` : 'none' }}
    >
      <div>
        <div className="show-top-area">
          <p className="title">
            <a
              style={{textDecoration: "none", color: "#FFF"}}
              href={`https://trakt.tv/shows/${show.ids.slug}`}
            >
              {show.title}
            </a>
          </p>
          {
            myStreamingLocations.length > 0 ? (
              <StyledStreamButtons>
                {
                  (show?.streaming_locations || []).filter(link => streamingServices.includes(link.technical_name)).map(link => (
                    <a key={link.technical_name} href={link.url} target="_blank" rel="noopener noreferrer">
                      <img src={link.icon} width={20} />
                    </a>
                  ))
                }
              </StyledStreamButtons>
            ) : null
          }
        </div>
        <div className="next-episode">
          <p className="success-0">Add show</p>
          <CircularButton
            onClick={() => addShow(show)}
            disabled={alreadyPresent}
          >
            <span>+</span>
          </CircularButton>
        </div>
      </div>
    </StyledShowToAdd>
  );
}

export default ShowToAdd;