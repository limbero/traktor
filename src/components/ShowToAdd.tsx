import styled from 'styled-components';

import TheMovieDb from '../apis/TheMovieDb';
import CircularButton from './elements/CircularButton';
import { TraktShow } from '../apis/Trakt';
import { useEffect, useState } from 'react';
import StreamButtons from './StreamButtons';

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

type ShowToAddProps = {
  addShow: Function;
  show: TraktShow;
  alreadyPresent: boolean;
};

function ShowToAdd({ addShow, show, alreadyPresent }: ShowToAddProps) {
  const [image, setImage] = useState<string>("");
  async function fetchImage() {
    const image = await TheMovieDb.getImage(show.ids.tmdb.toString());
    setImage(image);
  }
  useEffect(() => {
    fetchImage();
  }, [show]);

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
          <StreamButtons showStreamingLocations={show?.streaming_locations || []} />
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