import React from 'react';
import { ActionIcon, Button, Tooltip } from '@mantine/core';
import Icon from './Icon.jsx';
export default function Header({ theme, setTheme }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#home" aria-label="Save One home">
          <span className="brand-symbol">
            <Icon name="game" size={23} />
          </span>
          <span>
            save<span className="brand-accent">one</span>
            <small>YOUR PERSONAL HALL OF FAME</small>
          </span>
        </a>
        <nav aria-label="Main">
          <a className="nav-link" href="#home">
            Discover
          </a>
          <Button
            component="a"
            href="#start"
            variant="subtle"
            size="sm"
            rightSection={<Icon name="arrow" size={16} />}
          >
            New collection
          </Button>
          <Tooltip label={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            <ActionIcon
              size="lg"
              variant="default"
              radius="xl"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </ActionIcon>
          </Tooltip>
        </nav>
      </div>
    </header>
  );
}
