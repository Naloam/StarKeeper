import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * 自然风格折线图组件
 */
export default function LineChart({ data, options: customOptions, height = 300 }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            family: 'Inter, sans-serif',
            size: 12,
            weight: '400'
          },
          color: '#6B665F',
          usePointStyle: true,
          padding: 16,
          boxWidth: 8,
          boxHeight: 8
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
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(232, 227, 217, 0.4)',
          lineWidth: 1,
          drawBorder: false
        },
        ticks: {
          font: {
            family: 'Inter, sans-serif',
            size: 11,
            weight: '400'
          },
          color: '#9B968E',
          padding: 8
        }
      },
      y: {
        grid: {
          display: true,
          color: 'rgba(232, 227, 217, 0.4)',
          lineWidth: 1,
          drawBorder: false
        },
        ticks: {
          font: {
            family: 'Inter, sans-serif',
            size: 11,
            weight: '400'
          },
          color: '#9B968E',
          padding: 8
        },
        beginAtZero: true
      }
    },
    elements: {
      line: {
        borderWidth: 2,
        tension: 0.3
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        hoverBorderWidth: 3
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
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
      <Line data={data} options={mergedOptions} />
    </div>
  );
}
