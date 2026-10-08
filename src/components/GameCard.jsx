import React from 'react';
import { UnstyledButton, Badge } from '@mantine/core';
import { byId } from '../lib/catalogue.js';
import Cover from './Cover.jsx';
import Icon from './Icon.jsx';
export default function GameCard({ id, onPick, shortcut }) {
  const game = byId.get(id);
  return (
    <UnstyledButton
      className="game-card"
      onClick={() => onPick(id)}
      aria-label={'Choose ' + game.title}
    >
      <div className="game-card-art">
        <Cover game={game} />
        <Badge className="game-genre" variant="filled" color="dark" size="sm">
          {game.genre}
        </Badge>
        <span className="pick-overlay">
          <Icon name="check" size={18} /> Save this game
        </span>
      </div>
      <div className="game-card-caption">
        <div>
          <h3>{game.title}</h3>
          <span>{game.year}</span>
        </div>
        {shortcut ? <kbd>{shortcut}</kbd> : <Icon name="arrow" size={17} />}
      </div>
    </UnstyledButton>
  );
}
