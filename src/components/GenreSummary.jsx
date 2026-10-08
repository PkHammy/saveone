import React from 'react';
import { RingProgress, Progress, Badge } from '@mantine/core';
import { stats } from '../lib/catalogue.js';
const colors = ['lime', 'teal', 'cyan', 'blue', 'grape', 'orange', 'pink', 'yellow'];
export default function GenreSummary({ collection }) {
  const genres = stats(collection),
    total = collection.picks.length;
  return (
    <section className="taste-layout">
      <div className="taste-feature">
        <p className="eyebrow">YOUR GAMING DNA</p>
        <h2>
          {genres[0][0]}
          <br />
          leads the way.
        </h2>
        <p className="muted">The genres you keep coming back to, based on your saved games.</p>
        <RingProgress
          size={240}
          thickness={18}
          roundCaps
          sections={genres.map(([name, n], i) => ({
            value: (n / total) * 100,
            color: colors[i % colors.length],
            tooltip: name + ': ' + n + ' games',
          }))}
          label={
            <div className="ring-label">
              <strong>{total}</strong>
              <span>GAMES SAVED</span>
            </div>
          }
        />
        <Badge variant="light">{genres.length} genres in your collection</Badge>
      </div>
      <div className="genre-list">
        {genres.map(([name, n], i) => (
          <article className="genre-stat" key={name}>
            <div>
              <span className="genre-position">{String(i + 1).padStart(2, '0')}</span>
              <h3>{name}</h3>
              <strong>
                {Math.round((n / total) * 100)}
                <small>%</small>
              </strong>
            </div>
            <Progress
              color={colors[i % colors.length]}
              value={(n / total) * 100}
              size={6}
              radius="xl"
            />
            <p>
              {n} saved {n === 1 ? 'game' : 'games'}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
