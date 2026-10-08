import React, { useState } from 'react';
import { Modal, Accordion, Button, Badge } from '@mantine/core';
import Match from './Match.jsx';
export default function TournamentHistory({ opened, onClose, bracket }) {
  const [expanded, setExpanded] = useState([]);
  return (
    <Modal
      closeButtonProps={{ 'aria-label': 'Close dialog' }}
      opened={opened}
      onClose={onClose}
      title="Every matchup"
      size="xl"
    >
      <p className="muted history-description">
        Trace the winners from the opening round to the final.
      </p>
      <div className="history-actions">
        <Button
          size="xs"
          variant="default"
          onClick={() => setExpanded(bracket.rounds.map((_, i) => String(i)))}
        >
          Expand all
        </Button>
        <Button size="xs" variant="subtle" onClick={() => setExpanded([])}>
          Collapse all
        </Button>
      </div>
      <Accordion multiple value={expanded} onChange={setExpanded} variant="separated">
        {bracket.rounds.map((matches, round) => {
          const title = round === bracket.rounds.length - 1 ? 'Final' : 'Round ' + (round + 1);
          return (
            <Accordion.Item key={round} value={String(round)}>
              <Accordion.Control>
                <span className="history-round-title">
                  {title}
                  <Badge size="sm" variant="light">
                    {matches.filter((m) => m.winner).length} / {matches.length}
                  </Badge>
                </span>
              </Accordion.Control>
              <Accordion.Panel>
                <div className="match-records">
                  {matches.map((match, i) => (
                    <Match key={i} match={match} round={title} number={i} />
                  ))}
                </div>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </Modal>
  );
}
