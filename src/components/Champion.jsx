import React from 'react';
import { Badge } from '@mantine/core';
import { byId } from '../lib/catalogue.js';
import Cover from './Cover.jsx';
import Icon from './Icon.jsx';
export default function Champion({ bracket }) {
  const game = byId.get(bracket.champion);
  const victories = bracket.rounds.flatMap((matches, round) =>
    matches
      .filter((m) => m.winner === game.id && !m.bye)
      .map((m) => ({ round, opponent: byId.get(m.pair.find((e) => e.id !== game.id).id) })),
  );
  return (
    <>
      <div className="champion-feature">
        <div className="champion-art">
          <Cover game={game} />
          <span className="champion-crown">
            <Icon name="trophy" size={30} />
          </span>
        </div>
        <div>
          <Badge color="yellow" variant="light" leftSection={<Icon name="trophy" size={14} />}>
            Your all-time favourite
          </Badge>
          <h2>{game.title}</h2>
          <p className="muted">
            {game.year} · {game.genre}
          </p>
          <div className="champion-statement">
            Every round. Every tough call.
            <br />
            <strong>This is the one you kept.</strong>
          </div>
        </div>
      </div>
      <div className="champion-path">
        <div className="section-heading">
          <h3>Road to the title</h3>
          <span className="micro muted">{victories.length} victories</span>
        </div>
        {victories.length ? (
          <ol>
            {victories.map(({ round, opponent }) => (
              <li key={round}>
                <span className="path-round">
                  {round === bracket.rounds.length - 1 ? 'FINAL' : 'ROUND ' + (round + 1)}
                </span>
                <div>
                  <Cover game={opponent} small />
                  <span>
                    <small>Beat</small>
                    <strong>{opponent.title}</strong>
                  </span>
                  <Icon name="check" size={16} />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">The only game in your collection takes the title.</p>
        )}
      </div>
    </>
  );
}
