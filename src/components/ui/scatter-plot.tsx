"use client";

import React from 'react';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface ScatterPlotProps {
  xMetric: string;
  yMetric: string;
  data: Array<{ x: number; y: number; label: string }>;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({ xMetric, yMetric, data }) => {
  const chartData = {
    datasets: [{
      label: `${xMetric} vs ${yMetric}`,
      data: data,
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      pointRadius: 6,
      pointHoverRadius: 8,
    }]
  };

  const options = {
    scales: {
      x: {
        title: {
          display: true,
          text: xMetric.replace(/_/g, ' ')
        },
        min: 0,   // Set minimum x-axis value
        max: 100, // Set maximum x-axis value
      },
      y: {
        title: {
          display: true,
          text: yMetric.replace(/_/g, ' ')
        },
        min: 0,   // Set minimum y-axis value
        max: 100, // Set maximum y-axis value
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const point = context.raw as { x: number; y: number; label: string };
            return `${point.label}: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
          }
        }
      }
    }
  };

  return (
    <div className="w-full h-96 p-10">
      <h3 className="text-lg font-semibold mb-4">Scatter Plot: {xMetric.replace(/_/g, ' ')} vs {yMetric.replace(/_/g, ' ')}</h3>
      <Scatter data={chartData} options={options} />
    </div>
  );
};

export default ScatterPlot;
