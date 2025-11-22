'use client';

import React from 'react';
import MapView from './MapView';
import { useMapContext } from '../state/MapContext';
import TodoList from './TodoList';
import { useUiContext, TAB, type TabKey } from '../state/UiContext';

const tabs: { key: TabKey; label: string }[] = [
  { key: TAB.MAP, label: 'Map' },
  { key: TAB.FLOOR, label: 'Floor Planner' },
  { key: TAB.TODOS, label: 'To Dos' },
];

const Tabs = () => {
  const ui = useUiContext();
  const active = ui.state.activeTab;
  // Client no longer triggers floorPlanner_render; only the agent should decide.

  return (
    <div className="tabs">
      <div className="tab-list">
        {tabs.map((tab) => {
          const selected = active === tab.key;
          return (
            <button
              key={tab.key}
              className={`tab ${selected ? 'active' : ''}`}
              onClick={() => ui.setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => {
        const selected = active === tab.key;
        return (
          <div
            key={tab.key}
            hidden={!selected}
            className={`tab-panel${tab.key === TAB.TODOS ? ' todos-panel' : ''}`}
          >
            {tab.key === TAB.MAP && <MapPanel />}
            {tab.key === TAB.FLOOR && <FloorPlannerPanel />}
            {tab.key === TAB.TODOS && <TodosPanel />}
          </div>
        );
      })}
    </div>
  );
};

export default Tabs;

const MapPanel = () => {
  const mapCtx = useMapContext();
  return (
    <div className="map-panel">
      <MapView lat={mapCtx.lat} lon={mapCtx.lon} zoom={mapCtx.zoom} />
    </div>
  );
};

const TodosPanel = () => <TodoList />;

const FloorPlannerPanel = () => {
  const Planner = require('./FloorPlanner').default;
  return (
    <div className="panel-box" style={{ height: '100%' }}>
      <Planner />
    </div>
  );
};
