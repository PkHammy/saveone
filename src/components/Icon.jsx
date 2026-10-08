import React from 'react';
import {
  IconTrophy,
  IconDeviceGamepad2,
  IconMoon,
  IconSun,
  IconArrowRight,
  IconShare2,
  IconArrowLeft,
  IconDownload,
  IconCopy,
  IconCheck,
  IconRefresh,
  IconLayoutGrid,
  IconChartBar,
  IconArrowUpRight,
  IconHistory,
  IconCode,
  IconLink,
  IconX,
} from '@tabler/icons-react';
const icons = {
  trophy: IconTrophy,
  game: IconDeviceGamepad2,
  moon: IconMoon,
  sun: IconSun,
  arrow: IconArrowRight,
  share: IconShare2,
  back: IconArrowLeft,
  download: IconDownload,
  copy: IconCopy,
  check: IconCheck,
  refresh: IconRefresh,
  grid: IconLayoutGrid,
  chart: IconChartBar,
  external: IconArrowUpRight,
  history: IconHistory,
  code: IconCode,
  link: IconLink,
  close: IconX,
};
export default function Icon({ name, size = 20, ...props }) {
  const Component = icons[name] || IconDeviceGamepad2;
  return <Component size={size} stroke={1.7} aria-hidden="true" {...props} />;
}
