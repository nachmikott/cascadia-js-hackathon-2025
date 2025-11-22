'use client';

import { useRef } from 'react';
import { useFloorPlannerContext } from '../state/FloorPlannerContext';

const FloorPlanner = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const planner = useFloorPlannerContext();

  return (
    <div ref={containerRef} className="panel-box" style={{ height: '100%', overflow: 'auto', position: 'relative' }}>
      <div className="floor-canvas" aria-label="Floor planner canvas">
        <div dangerouslySetInnerHTML={{ __html: planner.svgMarkup || '' }} />
      </div>
      {planner.loading && (
        <div className="overlay-loading">
          <div className="spinner" aria-label="Loading" />
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>Rendering updated floor plan…</div>
        </div>
      )}
    </div>
  );
};

export default FloorPlanner;
