import React, { useState } from 'react';
import { Button, TextInput, Select, Group, Alert, Badge } from '@mantine/core';
import { years } from '../lib/catalogue.js';
import Icon from './Icon.jsx';
export default function StartForm({ start }) {
  const [name, setName] = useState(''),
    [first, setFirst] = useState(String(years[0])),
    [last, setLast] = useState(String(years.at(-1))),
    [error, setError] = useState('');
  const data = years.map(String),
    count = Number(last) - Number(first) + 1;
  const presets = [
    ['The full journey', years[0]],
    ['90s onwards', 1990],
    ['Modern classics', 2010],
  ];
  return (
    <form
      className="setup-card"
      onSubmit={(e) => {
        e.preventDefault();
        if (count < 1) {
          setError('Choose an end year after your start year.');
          return;
        }
        start({
          v: 1,
          name: name.trim() || 'Player',
          years: years.filter((y) => y >= Number(first) && y <= Number(last)),
          picks: [],
        });
      }}
    >
      <div className="section-topline">
        <span className="eyebrow">MAKE IT YOURS</span>
        <Badge variant="light">{count > 0 ? count : 0} picks</Badge>
      </div>
      <h3>Your story starts here.</h3>
      <TextInput
        label="Your name"
        placeholder="Player"
        description="Optional — this appears on your collection."
        maxLength={40}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="preset-options">
        {presets.map(([label, year]) => (
          <Button
            key={label}
            size="compact-sm"
            variant={Number(first) === year && Number(last) === years.at(-1) ? 'light' : 'default'}
            onClick={() => {
              setFirst(String(year));
              setLast(String(years.at(-1)));
            }}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="year-fields">
        <Select label="Start year" value={first} onChange={setFirst} data={data} />
        <Select label="End year" value={last} onChange={setLast} data={data} />
      </div>
      {error && (
        <Alert color="red" role="alert">
          {error}
        </Alert>
      )}
      <Button type="submit" fullWidth rightSection={<Icon name="arrow" size={18} />}>
        Build my collection
      </Button>
      <p className="micro muted">
        Progress saves on this device. A new collection replaces your saved run.
      </p>
    </form>
  );
}
