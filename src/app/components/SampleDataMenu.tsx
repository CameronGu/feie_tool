import { useMemo, useState } from 'react';
import type { SampleDataset } from '../sample-data/datasets';

interface SampleDataMenuProps {
  datasets: SampleDataset[];
  onLoad(dataset: SampleDataset): void;
}

export function SampleDataMenu({ datasets, onLoad }: SampleDataMenuProps) {
  const [selectedId, setSelectedId] = useState('');

  const selectedDataset = useMemo(
    () => datasets.find(dataset => dataset.id === selectedId),
    [datasets, selectedId]
  );

  const handleLoad = () => {
    if (!selectedDataset) {
      return;
    }
    onLoad(selectedDataset);
  };

  return (
    <div className="sample-data-menu card">
      <div className="sheet-header">
        <h2>Sample data presets</h2>
      </div>
      <div className="sample-data-controls">
        <label htmlFor="sample-data-select">Pick a dataset</label>
        <div className="sample-data-row">
          <select
            id="sample-data-select"
            value={selectedId}
            onChange={event => setSelectedId(event.target.value)}
          >
            <option value="">Choose a preset to load…</option>
            {datasets.map(dataset => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name}
              </option>
            ))}
          </select>
          <button type="button" className="secondary" onClick={handleLoad} disabled={!selectedDataset}>
            Load preset
          </button>
        </div>
        {selectedDataset && <p className="help-text">{selectedDataset.description}</p>}
      </div>
    </div>
  );
}

export default SampleDataMenu;
