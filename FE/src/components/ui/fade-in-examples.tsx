"use client";

import React from 'react';
import PageFadeIn from './page-fade-in';
import FadeInWrapper from './fade-in-wrapper';

const FadeInExamples: React.FC = () => {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Fade-In Animation System</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This system provides smooth fade-in animations throughout the platform with easy opt-out capabilities.
        </p>
      </div>

      {/* Basic Usage */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Basic Usage</h3>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <pre className="text-sm">
{`// Using PageFadeIn (respects global settings)
<PageFadeIn delay={300} direction="up">
  <YourComponent />
</PageFadeIn>

// Using FadeInWrapper (direct control)
<FadeInWrapper delay={200} direction="left" disabled={false}>
  <YourComponent />
</FadeInWrapper>`}
          </pre>
        </div>
      </div>

      {/* Direction Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Direction Examples</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PageFadeIn delay={0} direction="up">
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg text-center">
              <p className="font-medium">From Up</p>
            </div>
          </PageFadeIn>
          
          <PageFadeIn delay={100} direction="down">
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg text-center">
              <p className="font-medium">From Down</p>
            </div>
          </PageFadeIn>
          
          <PageFadeIn delay={200} direction="left">
            <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg text-center">
              <p className="font-medium">From Left</p>
            </div>
          </PageFadeIn>
          
          <PageFadeIn delay={300} direction="right">
            <div className="bg-orange-100 dark:bg-orange-900 p-4 rounded-lg text-center">
              <p className="font-medium">From Right</p>
            </div>
          </PageFadeIn>
        </div>
      </div>

      {/* Staggered Children */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Staggered Children</h3>
        <PageFadeIn staggerChildren staggerDelay={150} delay={400}>
          <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg mb-2">
            <p>First item (appears first)</p>
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg mb-2">
            <p>Second item (150ms delay)</p>
          </div>
          <div className="bg-indigo-100 dark:bg-indigo-900 p-4 rounded-lg">
            <p>Third item (300ms delay)</p>
          </div>
        </PageFadeIn>
      </div>

      {/* Opt-out Instructions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">How to Control Animations</h3>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg space-y-2">
          <p><strong>Component disable:</strong> Set <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">disabled={`{true}`}</code> prop</p>
          <p><strong>Programmatic control:</strong> Use the <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">useFadeIn()</code> hook</p>
          <div className="mt-3 bg-gray-200 dark:bg-gray-700 p-3 rounded">
            <pre className="text-sm">
{`const { isDisabled, disable, enable } = useFadeIn();

// Disable animations
disable();

// Re-enable animations  
enable();`}
            </pre>
          </div>
        </div>
      </div>

      {/* API Reference */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Props Reference</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-4 py-2 text-left">Prop</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Default</th>
                <th className="px-4 py-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2 font-mono text-sm">delay</td>
                <td className="px-4 py-2">number</td>
                <td className="px-4 py-2">300</td>
                <td className="px-4 py-2">Delay before animation starts (ms)</td>
              </tr>
              <tr className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2 font-mono text-sm">duration</td>
                <td className="px-4 py-2">number</td>
                <td className="px-4 py-2">500</td>
                <td className="px-4 py-2">Animation duration (ms)</td>
              </tr>
              <tr className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2 font-mono text-sm">direction</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">'up'</td>
                <td className="px-4 py-2">Animation direction: 'up', 'down', 'left', 'right', 'none'</td>
              </tr>
              <tr className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2 font-mono text-sm">disabled</td>
                <td className="px-4 py-2">boolean</td>
                <td className="px-4 py-2">false</td>
                <td className="px-4 py-2">Disable animation completely</td>
              </tr>
              <tr className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2 font-mono text-sm">staggerChildren</td>
                <td className="px-4 py-2">boolean</td>
                <td className="px-4 py-2">false</td>
                <td className="px-4 py-2">Animate children with staggered delays</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FadeInExamples; 