import React, { useEffect } from 'react';
import { MantineProvider, Alert } from '@mantine/core';
import { theme as uiTheme } from './theme.js';
import { encode, decode } from './lib/sharing.js';
import useTheme from './hooks/useTheme.js';
import useHash from './hooks/useHash.js';
import useCollection from './hooks/useCollection.js';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Play from './pages/Play.jsx';
import Results from './pages/Results.jsx';
export default function App() {
  const hash = useHash(),
    [theme, setTheme] = useTheme();
  const { run, update, undo, start, storageError } = useCollection();
  useEffect(() => {
    if (hash === '#start') document.querySelector('#start')?.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [hash]);
  let collection = null,
    error = '';
  if (hash.startsWith('#collection=')) {
    try {
      collection = decode(hash.slice(12));
    } catch (e) {
      error = e.message;
    }
  }
  const complete = run && run.picks.length === run.years.length;
  return (
    <MantineProvider theme={uiTheme} forceColorScheme={theme}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header theme={theme} setTheme={setTheme} />
      <main id="main">
        {error && (
          <Alert color="red" className="page-alert" title="Could not import collection">
            {error}
          </Alert>
        )}
        {storageError && (
          <Alert color="yellow" className="page-alert">
            Progress could not be saved. Keep this tab open.
          </Alert>
        )}
        {collection ? (
          <Results key={encode(collection)} collection={collection} />
        ) : hash === '#play' && run ? (
          complete ? (
            <Results key={encode(run)} collection={run} owned undo={undo} />
          ) : (
            <Play run={run} update={update} undo={undo} />
          )
        ) : (
          <Home run={run} start={start} />
        )}
      </main>
      <Footer />
    </MantineProvider>
  );
}
