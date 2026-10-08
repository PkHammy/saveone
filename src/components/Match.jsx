import React from 'react';
import { byId } from '../lib/catalogue.js';
import Cover from './Cover.jsx';

export default function Match({ match, round, number }) {
  return (
    <article className="match-record">
      <div className="match-meta">
        <span>
          {round} · {String(number + 1).padStart(2, '0')}
        </span>
        <span>{match.bye ? 'Bye' : match.winner ? 'Complete' : 'Pending'}</span>
      </div>
      {match.pair.map((entry, i) => {
        const game = byId.get(entry.id);
        const won = match.winner === entry.id && entry.id;
        return (
          <div
            key={i}
            className={
              'match-row' + (won ? ' match-row--won' : match.winner ? ' match-row--lost' : '')
            }
          >
            {game && <Cover game={game} small />}
            <span className="match-name">
              {game?.title || entry.source}
              <small>{game?.year || 'Awaiting previous round'}</small>
            </span>
            <span className="match-verdict">{won ? 'WIN' : match.winner ? 'OUT' : '—'}</span>
          </div>
        );
      })}
    </article>
  );
}
