import React from 'react';
import { Tabs, Badge, Button } from '@mantine/core';
import Icon from '../components/Icon.jsx';
import SharePanel from '../components/SharePanel.jsx';
import Tournament from '../components/Tournament.jsx';
import CollectionGrid from '../components/CollectionGrid.jsx';
import GenreSummary from '../components/GenreSummary.jsx';
export default function Results({ collection, owned, undo }) {
  return (
    <section className="results-page">
      <header className="collection-heading">
        <div>
          <Badge variant="light" leftSection={<Icon name={owned ? 'check' : 'share'} size={13} />}>
            {owned ? 'Collection complete' : 'Shared collection'}
          </Badge>
          <h1>
            {collection.name}’s
            <br />
            <span>hall of fame.</span>
          </h1>
          <p className="muted">
            {collection.picks.length} games that made the cut. {collection.years[0]}—
            {collection.years.at(-1)}.
          </p>
        </div>
        <div className="collection-seal">
          <Icon name="game" size={34} />
          <strong>{collection.picks.length}</strong>
          <span>KEEPERS</span>
        </div>
      </header>
      <SharePanel collection={collection} />
      <Tabs defaultValue="collection" keepMounted className="results-tabs">
        <Tabs.List>
          <Tabs.Tab value="collection" leftSection={<Icon name="grid" size={17} />}>
            The collection
          </Tabs.Tab>
          <Tabs.Tab value="tournament" leftSection={<Icon name="trophy" size={17} />}>
            Tournament
          </Tabs.Tab>
          <Tabs.Tab value="taste" leftSection={<Icon name="chart" size={17} />}>
            Your taste
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="collection">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A GAME FOR EVERY YEAR</p>
              <h2>The ones you kept.</h2>
            </div>
            {owned && (
              <Button
                variant="subtle"
                size="sm"
                leftSection={<Icon name="history" size={16} />}
                onClick={undo}
              >
                Undo last pick
              </Button>
            )}
          </div>
          <CollectionGrid collection={collection} />
        </Tabs.Panel>
        <Tabs.Panel value="tournament">
          <Tournament collection={collection} />
        </Tabs.Panel>
        <Tabs.Panel value="taste">
          <GenreSummary collection={collection} />
        </Tabs.Panel>
      </Tabs>
    </section>
  );
}
