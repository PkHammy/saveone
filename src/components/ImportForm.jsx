import React, { useState } from 'react';
import { Textarea, Button, Alert } from '@mantine/core';
import { decode, encode } from '../lib/sharing.js';
import Icon from './Icon.jsx';
export default function ImportForm() {
  const [code, setCode] = useState(''),
    [error, setError] = useState('');
  return (
    <form
      className="import-form"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          location.hash = '#collection=' + encode(decode(code));
          setError('');
        } catch (err) {
          setError(err.message);
        }
      }}
    >
      <Textarea
        label="Collection code or link"
        placeholder="Paste a friend's code…"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        minRows={2}
        maxRows={4}
        autosize
        maxLength={2000}
        required
      />
      {error && (
        <Alert color="red" role="alert">
          {error}
        </Alert>
      )}
      <Button variant="default" type="submit" rightSection={<Icon name="arrow" size={16} />}>
        Open collection
      </Button>
    </form>
  );
}
