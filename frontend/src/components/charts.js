/**
 * Shared chart config + theme-aware options for Chart.js.
 */
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler);

export const CHART_COLORS = [
  '#3a5dff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export function themedOptions(theme) {
  const textColor = theme === 'dark' ? '#cbd5e1' : '#475569';
  const gridColor = theme === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.05)';
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: textColor, font: { size: 12 } } },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
        titleColor: theme === 'dark' ? '#f1f5f9' : '#0f172a',
        bodyColor: textColor,
        borderColor: gridColor,
        borderWidth: 1,
      },
    },
    scales: {
      x: { ticks: { color: textColor }, grid: { color: gridColor } },
      y: { ticks: { color: textColor }, grid: { color: gridColor } },
    },
  };
}

export const borderColorForTheme = (theme) => (theme === 'dark' ? '#0f172a' : '#fff');
