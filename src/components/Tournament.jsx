import React, { useState } from 'react';
import { Button, Badge, Progress, Alert } from '@mantine/core';
import useTournament from '../hooks/useTournament.js';
import GameCard from './GameCard.jsx';
import Icon from './Icon.jsx';
import Champion from './Champion.jsx';
import TournamentHistory from './TournamentHistory.jsx';
export default function Tournament({ collection }) {
  const { state, saved, restart, pick, undo, bracket, current } = useTournament(collection);
  const [history, setHistory] = useState(false);
  if (!state)
    return (
      <section className="tournament-intro">
        <div className="trophy-orbit">
          <Icon name="trophy" size={56} />
        </div>
        <p className="eyebrow">THE FINAL CHALLENGE</p>
        <h2>
          Great games.
          <br />
          Only one champion.
        </h2>
        <p className="muted">
          Your {collection.picks.length} picks enter a random knockout tournament.
          <br />
          Choose a winner from each pair. Find your all-time favourite.
        </p>
        <Button size="lg" onClick={restart} rightSection={<Icon name="arrow" />}>
          Start the tournament
        </Button>
        <span className="micro muted">
          Odd rounds give one game a bye. Every choice saves automatically.
        </span>
      </section>
    );
  const champion = bracket.champion,
    total = collection.picks.length - 1;
  return (
    <section className="tournament-view">
      <div className="tournament-toolbar">
        <Badge
          variant="light"
          color={champion ? 'yellow' : 'lime'}
          leftSection={<Icon name="trophy" size={13} />}
        >
          {champion ? 'Tournament complete' : 'Round ' + current.round}
        </Badge>
        <span className="micro muted">
          {state.choices.length} / {total} matches decided
        </span>
      </div>
      {champion ? (
        <Champion bracket={bracket} />
      ) : (
        <>
          <div className="duel-heading">
            <p className="eyebrow">TRUST YOUR GUT</p>
            <h2>Which one stays?</h2>
            <p className="muted">The winner moves on. The other becomes a memory.</p>
          </div>
          <div className="duel">
            <GameCard id={current.contenders[current.match]} onPick={pick} />
            <span className="duel-vs">VS</span>
            <GameCard id={current.contenders[current.match + 1]} onPick={pick} />
          </div>
          <Progress
            size={4}
            value={total ? (state.choices.length / total) * 100 : 100}
            aria-label="Tournament progress"
          />
        </>
      )}
      <div className="tournament-tools">
        <div>
          {state.choices.length > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={undo}
              leftSection={<Icon name="history" size={16} />}
            >
              Undo match
            </Button>
          )}
          <Button
            variant="subtle"
            size="sm"
            onClick={restart}
            leftSection={<Icon name="refresh" size={16} />}
          >
            Shuffle again
          </Button>
        </div>
        {bracket.rounds.length > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setHistory(true)}
            leftSection={<Icon name="grid" size={16} />}
          >
            View every matchup
          </Button>
        )}
      </div>
      {!saved && <Alert color="yellow">Progress could not be saved. Keep this tab open.</Alert>}
      <p className="micro muted tournament-note">
        This tournament saves on your device. Your shared code contains your yearly picks.
      </p>
      <TournamentHistory opened={history} onClose={() => setHistory(false)} bracket={bracket} />
    </section>
  );
}
