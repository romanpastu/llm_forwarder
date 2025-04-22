'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [expandedEntry, setExpandedEntry] = useState(null);

  useEffect(() => {
    async function fetchEntries() {
      try {
        const res = await fetch('http://localhost:4000/entries');
        const data = await res.json();
        console.log('Fetched entries:', data); // Debug log
        setEntries(data.reverse()); // Newest first
      } catch (error) {
        console.error('Failed to fetch entries:', error);
      }
    }

    fetchEntries();
  }, []);

  const openModal = (entry) => setExpandedEntry(entry);
  const closeModal = () => setExpandedEntry(null);

  return (
    <main className="min-h-screen bg-[#f5f7fa] p-8">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">
        📸 AI Screenshot Insights
      </h1>

      <div className="flex flex-col gap-8">
        {entries.map((entry) => (
          <div
            key={entry.timestamp}
            className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
            onClick={() => openModal(entry)}
          >
            <img
              src={`http://localhost:4000/images/${entry.screenshot}`}
              alt="Screenshot"
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-2">
                {new Date(entry.timestamp).toLocaleString()}
              </p>
              <p className="text-gray-700 text-base leading-relaxed line-clamp-2">
                {entry.problemDescription ? entry.problemDescription.substring(0, 200) + '...' : 'No description available'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {expandedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white w-[90vw] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Fixed Close Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 text-xl"
                onClick={closeModal}
              >
                ✖
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-8">
              <img
                src={`http://localhost:4000/images/${expandedEntry.screenshot}`}
                alt="Full Screenshot"
                className="w-full h-auto object-contain rounded-lg mb-6"
              />

              <div className="space-y-4 text-gray-700 text-base leading-relaxed">
                {parseStructuredText(expandedEntry.problemDescription)}
                <div className="mt-8">
                  <h2 className="text-2xl font-bold text-gray-800">Solution</h2>
                  {parseStructuredText(expandedEntry.solution)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// 🛠️ Function to parse structured markdown-ish text
function parseStructuredText(text) {
  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockContent = [];

  lines.forEach((line, index) => {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <pre key={`code-${index}`} className="bg-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm my-4">
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start of code block
        inCodeBlock = true;
      }
    } else if (inCodeBlock) {
      codeBlockContent.push(line);
    } else if (line.startsWith('**') && line.endsWith('**')) {
      // Bold titles
      elements.push(
        <h2 key={index} className="text-2xl font-bold mt-6 mb-2 text-gray-800">
          {line.replace(/\*\*/g, '')}
        </h2>
      );
    } else if (line.startsWith('* ')) {
      // Bullet points
      elements.push(
        <li key={index} className="list-disc list-inside ml-6 text-gray-600">
          {line.replace('* ', '')}
        </li>
      );
    } else if (line.trim()) {
      elements.push(
        <p key={index} className="text-gray-700">
          {line}
        </p>
      );
    }
  });

  return elements;
}
