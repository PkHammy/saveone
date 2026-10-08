import React, { useState } from 'react';
import { https } from '../lib/urls.js';

export default function Cover({ game, small = false }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const failed = failedUrl === game.cover_url;
  return small ? (
    <div className="match-thumbnail">
      {!failed && https(game.cover_url) && (
        <img
          src={https(game.cover_url)}
          alt=""
          loading="lazy"
          onError={() => setFailedUrl(game.cover_url)}
        />
      )}
    </div>
  ) : (
    <div className={'cover' + (!failed && https(game.cover_url) ? ' cover--image' : '')}>
      {!failed && https(game.cover_url) && (
        <img
          className="game-cover-image"
          src={https(game.cover_url)}
          alt={`${game.title} game artwork`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(game.cover_url)}
        />
      )}
      <div className="cover-title">{game.title}</div>
    </div>
  );
}
