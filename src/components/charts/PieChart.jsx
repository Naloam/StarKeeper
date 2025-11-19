import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * 自然风格饼图组件
 */
export default function PieChart({ data, options: customOptions, height = 300 }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          font: {
            family: 'Inter, sans-serif',
            size: 12,
            weight: '400'
          },
          color: '#6B665F',
          usePointStyle: true,
          padding: 12,
          boxWidth: 12,
          boxHeight: 12,
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return chart.data.labels.map((label, i) => ({
              text: label,
              fillStyle: datasets[0].backgroundColor[i],
              strokeStyle: datasets[0].borderColor?.[i] || '#FAF8F3',
              lineWidth: 2,
              hidden: false,
              index: i
            }));
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(250, 248, 243, 0.95)',
        titleColor: '#2D2A26',
        bodyColor: '#6B665F',
        borderColor: '#E8E3D9',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        titleFont: {
          family: 'Inter, sans-serif',
          size: 13,
          weight: '600'
        },
        bodyFont: {
          family: 'Inter, sans-serif',
          size: 12,
          weight: '400'
        },
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const dataset = context.dataset;
            const total = dataset.data.reduce((acc, curr) => acc + curr, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 3,
        borderColor: '#FAF8F3',
        hoverBorderWidth: 4
      }
    }
  };

  const mergedOptions = {
    ...defaultOptions,
    ...customOptions,
    plugins: {
      ...defaultOptions.plugins,
      ...customOptions?.plugins
    }
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Pie data={data} options={mergedOptions} />
    </div>
  );
}
