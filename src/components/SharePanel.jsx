import React, { useState } from 'react';
import { Button, TextInput, Modal, Textarea, ActionIcon, Tooltip, Stack } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { encode } from '../lib/sharing.js';
import { poster } from '../lib/poster.js';
import Icon from './Icon.jsx';
export default function SharePanel({ collection }) {
  const code = encode(collection),
    clipboard = useClipboard({ timeout: 1800 }),
    [opened, setOpened] = useState(false);
  const url = new URL(location.href);
  url.hash = 'collection=' + code;
  return (
    <>
      <div className="share-strip">
        <div className="share-label">
          <Icon name="code" size={18} />
          <span>Your collection code</span>
        </div>
        <TextInput
          id="share-code"
          aria-label="Your collection code"
          readOnly
          value={code}
          onFocus={(e) => e.target.select()}
          className="compact-code"
          rightSection={
            <Tooltip label={clipboard.copied ? 'Copied' : 'Copy code'}>
              <ActionIcon
                variant="subtle"
                aria-label="Copy code"
                onClick={() => clipboard.copy(code)}
              >
                <Icon name={clipboard.copied ? 'check' : 'copy'} size={16} />
              </ActionIcon>
            </Tooltip>
          }
        />
        <Button
          variant="default"
          leftSection={<Icon name="share" size={17} />}
          onClick={() => setOpened(true)}
        >
          Share collection
        </Button>
      </div>
      {clipboard.error && (
        <p role="status" className="micro muted">
          Select your code and use your device’s copy command.
        </p>
      )}
      <span className="sr-only" role="status">
        {clipboard.copied ? 'Copied to clipboard.' : ''}
      </span>
      <Modal
        closeButtonProps={{ 'aria-label': 'Close dialog' }}
        opened={opened}
        onClose={() => setOpened(false)}
        title="Good taste deserves company."
      >
        <Stack gap="lg">
          <p className="muted">
            Send your picks to a friend. Your collection is stored inside the code.
          </p>
          <Textarea
            label="Collection link"
            value={url.href}
            readOnly
            autosize
            minRows={3}
            onFocus={(e) => e.target.select()}
          />
          <Button
            leftSection={<Icon name={clipboard.copied ? 'check' : 'link'} />}
            onClick={() => clipboard.copy(url.href)}
          >
            {clipboard.copied ? 'Copied' : 'Copy collection link'}
          </Button>
          <Button
            variant="default"
            leftSection={<Icon name="download" />}
            onClick={() => poster(collection)}
          >
            Download collection poster
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
