"use client"; // Ensure this file is client-side

import React from 'react';
import { scaleLinear } from 'd3-scale';
import { motion } from 'framer-motion';

interface MetricBarChartProps {
  metrics: { label: string; value: number }[];
}

const MetricBarChart: React.FC<MetricBarChartProps> = ({ metrics }) => {
  // Determine the maximum value to scale the bar heights
  const maxValue = Math.max(...metrics.map(metric => metric.value));
  const valueToHeight = scaleLinear().domain([0, maxValue]).range([0, 150]);

  return (
    <div className="md:max-w-[452px] max-w-[calc(100dvw-80px)] w-full pb-6 flex flex-col gap-4">
      <div className="flex flex-col">
        <div className="text-zinc-500 text-sm">Average Value</div>
        <div className="font-semibold">
          {`${(metrics.reduce((acc, metric) => acc + metric.value, 0) / metrics.length).toFixed(2)}`}
        </div>
      </div>

      <div className="flex flex-row justify-center  w-full h-[150px] items-end">
        {metrics.map((metric) => (
          <div key={metric.label} className="text-sm flex flex-col items-center gap-1">
            <motion.div
              className="rounded-md"
              initial={{ height: 0 }}
              animate={{ height: valueToHeight(metric.value) }}
              transition={{ delay: 0.1 }}
              style={{
                height: valueToHeight(metric.value),
                width: '8px', // Make bars skinnier
                backgroundColor: '#3B82F6', // Set to your specific blue color
                marginBottom: 'auto'
              }}
            />
            <div className="text-xs text-white font-semibold">
              {metric.value.toFixed(2)} {/* Show the value of each bar */}
            </div>
            <motion.div
              className="text-xs text-zinc-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {metric.label} {/* Use course code as label */}
            </motion.div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-row gap-2 items-center">
        </div>
      </div>
    </div>
  );
};

export default MetricBarChart;
