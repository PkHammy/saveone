import React from 'react';
import { Button, Badge } from '@mantine/core';
import { games, years, order } from '../lib/catalogue.js';
import Cover from '../components/Cover.jsx';
import Icon from '../components/Icon.jsx';
import StartForm from '../components/StartForm.jsx';
import ImportForm from '../components/ImportForm.jsx';
export default function Home({ run, start }) {
  const featured = [order(1998)[0], order(2015)[0], order(2018)[0]];
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <Badge variant="outline" size="lg" leftSection={<span className="live-dot" />}>
            A lifetime of great games
          </Badge>
          <h1>
            Some games
            <br />
            stay with you.
            <br />
            <span>Save those.</span>
          </h1>
          <p className="hero-description">
            One favourite from every year. A collection that’s unmistakably yours. Which game takes
            the crown?
          </p>
          <div className="hero-actions">
            <Button component="a" href="#start" size="lg" rightSection={<Icon name="arrow" />}>
              Find my favourites
            </Button>
            {run && (
              <Button component="a" href="#play" size="lg" variant="default">
                Continue collection
              </Button>
            )}
          </div>
          <div className="hero-note">
            <Icon name="check" size={15} /> No account. Just your good taste.
          </div>
        </div>
        <div className="hero-gallery" aria-label="Featured games">
          <div className="gallery-orbit" />
          {featured.map((g, i) => (
            <article className={'hero-poster hero-poster-' + i} key={g.id}>
              <Cover game={g} />
              <div>
                <span>{g.year}</span>
                <strong>{g.title}</strong>
              </div>
            </article>
          ))}
          <div className="gallery-stamp">
            <Icon name="trophy" size={22} />
            <span>
              Your next
              <br />
              <strong>hall of fame.</strong>
            </span>
          </div>
        </div>
      </section>
      <div className="stat-strip">
        <div>
          <strong>{years.length}</strong>
          <span>years of memories</span>
        </div>
        <div>
          <strong>{games.length.toLocaleString()}</strong>
          <span>games to rediscover</span>
        </div>
        <div>
          <strong>01</strong>
          <span>all-time favourite</span>
        </div>
        <span className="stat-caption">
          FROM THE ARCADE
          <br />
          TO YOUR NEXT OBSESSION.
        </span>
      </div>
      <section className="setup-section" id="start">
        <div className="setup-copy">
          <p className="eyebrow">YOUR RULES. YOUR COLLECTION.</p>
          <h2>
            A little nostalgia.
            <br />A few tough calls.
          </h2>
          <p className="muted">Choose the years that shaped you. We’ll bring the games.</p>
          <ol className="steps">
            {[
              [
                'grid',
                'One game. Every year.',
                'Keep the one you couldn’t imagine leaving behind.',
              ],
              [
                'trophy',
                'Settle the big question.',
                'Your picks go head to head in a random tournament.',
              ],
              [
                'share',
                'Let your friends judge.',
                'Share your collection with a link or a tiny code.',
              ],
            ].map(([icon, title, copy], i) => (
              <li key={title}>
                <span className="step-icon">
                  <Icon name={icon} />
                </span>
                <div>
                  <small>0{i + 1}</small>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <StartForm start={start} />
      </section>
      <section className="import-section">
        <div>
          <span className="surface-icon">
            <Icon name="code" size={24} />
          </span>
          <h2>Got a friend’s collection?</h2>
          <p className="muted">Open their picks. Discover what made the cut.</p>
        </div>
        <ImportForm />
      </section>
    </div>
  );
}
