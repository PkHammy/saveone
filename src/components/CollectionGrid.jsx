import React from 'react';
import { byId } from '../lib/catalogue.js';
import Cover from './Cover.jsx';
export default function CollectionGrid({ collection }) {
  return (
    <div className="collection-grid">
      {collection.picks.map((id) => {
        const g = byId.get(id);
        return (
          <article className="collection-card" key={id}>
            <div className="collection-art">
              <Cover game={g} />
              <span className="year-chip">{g.year}</span>
            </div>
            <h3>{g.title}</h3>
            <p>{g.genre}</p>
          </article>
        );
      })}
    </div>
  );
}
