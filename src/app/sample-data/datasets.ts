import type { Interval } from '../../domain/types';
import type { SampleDatasetPayload } from '../hooks/useCalculator';

export interface SampleDataset extends SampleDatasetPayload {
  id: string;
  name: string;
  description: string;
}

const travelHistory2016to2025: Interval[] = [
  { start_date: '2016-05-28', end_date: '2016-06-13' },
  { start_date: '2016-11-06', end_date: '2016-11-20' },
  { start_date: '2017-01-07', end_date: '2017-02-13' },
  { start_date: '2017-08-06', end_date: '2017-08-29' },
  { start_date: '2017-11-19', end_date: '2017-12-02' },
  { start_date: '2018-05-26', end_date: '2018-07-12' },
  { start_date: '2018-11-18', end_date: '2018-12-11' },
  { start_date: '2019-06-21', end_date: '2019-06-29' },
  { start_date: '2020-12-06', end_date: '2020-12-28' },
  { start_date: '2021-03-19', end_date: '2021-03-30' },
  { start_date: '2021-08-28', end_date: '2021-09-05' },
  { start_date: '2022-01-07', end_date: '2022-01-16' },
  { start_date: '2022-05-06', end_date: '2022-05-11' },
  { start_date: '2022-12-13', end_date: '2023-01-01' },
  { start_date: '2023-08-10', end_date: '2023-09-09' },
  { start_date: '2024-10-30', end_date: '2024-12-09' },
  { start_date: '2025-05-31', end_date: '2025-06-29' }
];

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'us-presence-archive',
    name: 'Long-term US visits history',
    description:
      'Original travel log with exact Arrive/Depart USA intervals from 2016 through mid-2025. Coverage is broadened so none of the stays are dropped.',
    mode: 'US_PERIODS',
    taxYear: 2024,
    usPeriods: travelHistory2016to2025
  },
  {
    id: 'foreign-deployments',
    name: 'Two-year foreign contract',
    description:
      'Primary work happens abroad with only short returns to the US. Demonstrates a clearly qualifying 330-day window.',
    mode: 'FOREIGN_PERIODS',
    taxYear: 2024,
    foreignPeriods: [
      { start_date: '2023-01-04', end_date: '2023-08-17' },
      { start_date: '2023-09-03', end_date: '2024-03-15' },
      { start_date: '2024-04-02', end_date: '2024-10-01' },
      { start_date: '2024-10-20', end_date: '2024-12-31' }
    ]
  },
  {
    id: 'frequent-us-breaks',
    name: 'Foreign assignments with frequent US resets',
    description:
      'Shows how repeated long trips back to the US can break qualification. The foreign stays are substantial but rarely cover 330 days.',
    mode: 'FOREIGN_PERIODS',
    taxYear: 2023,
    foreignPeriods: [
      { start_date: '2022-07-12', end_date: '2022-11-05' },
      { start_date: '2023-01-09', end_date: '2023-04-14' },
      { start_date: '2023-05-22', end_date: '2023-07-29' },
      { start_date: '2023-09-01', end_date: '2023-11-18' }
    ]
  },
  {
    id: 'us-heavy-year',
    name: 'US-heavy sabbatical year',
    description:
      'Taxpayer spends most of the coverage window inside the US with scattered short foreign trips. Useful when testing disqualification messaging.',
    mode: 'US_PERIODS',
    taxYear: 2022,
    usPeriods: [
      { start_date: '2021-10-05', end_date: '2022-01-15' },
      { start_date: '2022-02-20', end_date: '2022-04-02' },
      { start_date: '2022-04-18', end_date: '2022-07-08' },
      { start_date: '2022-07-22', end_date: '2022-09-30' },
      { start_date: '2022-10-05', end_date: '2022-12-31' }
    ]
  }
];
