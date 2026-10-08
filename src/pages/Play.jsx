import React, { useState, useEffect } from 'react';
import { Button, Progress, Badge } from '@mantine/core';
import { order } from '../lib/catalogue.js';
import { https } from '../lib/urls.js';
import GameCard from '../components/GameCard.jsx';
import Icon from '../components/Icon.jsx';
export default function Play({ run, update, undo }) {
  const [more, setMore] = useState(false);
  const index = run.picks.length,
    year = run.years[index],
    choices = order(year);
  const pick = (id) => update({ ...run, picks: [...run.picks, id] });
  useEffect(() => {
    setMore(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [year]);
  useEffect(() => {
    const key = (e) => {
      if (
        /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName) ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.repeat
      )
        return;
      if (/^[1-9]$/.test(e.key) && choices[Number(e.key) - 1]) pick(choices[Number(e.key) - 1].id);
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [run, year]);
  return (
    <section className="play-page">
      <div className="play-toolbar">
        <Button
          component="a"
          href="#home"
          variant="subtle"
          size="sm"
          leftSection={<Icon name="back" size={16} />}
        >
          Take a break
        </Button>
        <span>{run.name}’s collection</span>
        <Badge variant="light">
          {index + 1} / {run.years.length} years
        </Badge>
      </div>
      <Progress
        value={(index / run.years.length) * 100}
        size={4}
        radius="xl"
        aria-label="Years completed"
      />
      <div className="year-heading">
        <div>
          <p className="eyebrow">ONE YEAR. ONE KEEPER.</p>
          <h1>
            {year}
            <span>Which one stays?</span>
          </h1>
        </div>
        <div>
          <p className="muted">{choices.length} games. One spot in your collection.</p>
          {index > 0 && (
            <Button
              variant="default"
              size="xs"
              leftSection={<Icon name="history" size={14} />}
              onClick={undo}
            >
              Undo last pick
            </Button>
          )}
        </div>
      </div>
      <div className="game-grid">
        {choices.slice(0, more ? choices.length : 12).map((g, i) => (
          <div className="game-option" key={g.id}>
            <GameCard id={g.id} onPick={pick} shortcut={i < 9 ? i + 1 : null} />
            <div className="game-sources">
              <a href={https(g.source_url)} target="_blank" rel="noopener noreferrer">
                Game info
              </a>
              <span>·</span>
              <a href={https(g.image_source_url)} target="_blank" rel="noopener noreferrer">
                Image credits
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="more-games">
        <Button
          variant="default"
          size="md"
          aria-expanded={more}
          onClick={() => setMore(!more)}
          rightSection={<Icon name="grid" size={17} />}
        >
          {more ? 'Show fewer games' : 'Show all available games'}
        </Button>
        <p className="micro muted">
          {more ? choices.length : Math.min(12, choices.length)} of {choices.length} games · Use
          keys 1–9 to pick
        </p>
      </div>
    </section>
  );
}
