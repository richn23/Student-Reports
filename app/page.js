'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Moon, Sun, Copy, Check, FileText, Sparkles, RotateCcw, Loader2, Clock, CheckCircle2 } from 'lucide-react';

const CLASS_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'A1' },
  { value: 'elementary', label: 'Elementary', description: 'A2' },
  { value: 'pre-intermediate', label: 'Pre-Intermediate', description: 'A2+' },
  { value: 'intermediate', label: 'Intermediate', description: 'B1' },
  { value: 'upper-intermediate', label: 'Upper Intermediate', description: 'B2' },
  { value: 'advanced', label: 'Advanced', description: 'C1' },
];

const DAD_JOKES = [
  "Why don't eggs tell jokes? They'd crack each other up.",
  "I'm reading a book about anti-gravity. It's impossible to put down.",
  "Why did the scarecrow win an award? He was outstanding in his field.",
  "I used to hate facial hair, but then it grew on me.",
  "What do you call a fake noodle? An impasta.",
  "Why don't scientists trust atoms? Because they make up everything.",
  "I only know 25 letters of the alphabet. I don't know Y.",
  "What did the ocean say to the beach? Nothing, it just waved.",
  "Why do bees have sticky hair? Because they use honeycombs.",
  "I'm afraid for the calendar. Its days are numbered.",
  "What do you call a bear with no teeth? A gummy bear.",
  "Why did the bicycle fall over? Because it was two-tired.",
  "What do you call cheese that isn't yours? Nacho cheese.",
  "Why can't your nose be 12 inches long? Because then it would be a foot.",
  "What did the grape say when it got stepped on? Nothing, it just let out a little wine.",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "Why do chicken coops only have two doors? Because if they had four, they'd be chicken sedans.",
  "What do you call a dinosaur that crashes their car? Tyrannosaurus Wrecks.",
  "I used to play piano by ear, but now I use my hands.",
  "What do you call a fish without eyes? A fsh.",
  "Why did the coffee file a police report? It got mugged.",
  "What's orange and sounds like a parrot? A carrot.",
  "Why did the golfer bring two pairs of pants? In case he got a hole in one.",
  "I got hit in the head with a can of Coke today. Don't worry, I'm fine. It was a soft drink.",
  "What do you call a lazy kangaroo? A pouch potato.",
];

function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    data.push(row);
  }
  
  return data;
}

function normalizeData(data) {
  return data.map(row => {
    const normalized = {};
    Object.keys(row).forEach(key => {
      const lowerKey = key.toLowerCase().trim();
      if (lowerKey.includes('name')) normalized.name = String(row[key] || '');
      else if (lowerKey.includes('good') || lowerKey.includes('strength')) normalized.good = String(row[key] || '');
      else if (lowerKey.includes('bad') || lowerKey.includes('weak')) normalized.bad = String(row[key] || '');
      else if (lowerKey.includes('suggest')) normalized.suggestion = String(row[key] || '');
      else if (lowerKey.includes('extra')) normalized.extra = String(row[key] || '');
    });
    return normalized;
  }).filter(s => s.name && s.name.trim());
}

export default function Home() {
  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [classLevel, setClassLevel] = useState('pre-intermediate');
  const [currentJoke, setCurrentJoke] = useState('');

  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    let interval;
    let jokeInterval;
    
    if (loading) {
      setElapsedTime(0);
      setCurrentJoke(DAD_JOKES[Math.floor(Math.random() * DAD_JOKES.length)]);
      
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      jokeInterval = setInterval(() => {
        setCurrentJoke(DAD_JOKES[Math.floor(Math.random() * DAD_JOKES.length)]);
      }, 8000);
    }
    
    return () => {
      clearInterval(interval);
      clearInterval(jokeInterval);
    };
  }, [loading]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const processFile = (file) => {
    setError('');
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = parseCSV(e.target.result);
          handleData(data);
        } catch (err) {
          setError('Could not read CSV file. Please check the format.');
        }
      };
      reader.readAsText(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          handleData(data);
        } catch (err) {
          setError('Could not read Excel file. Please check the format.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
    }
  };

  const handleData = (data) => {
    if (data.length === 0) {
      setError('The file appears to be empty.');
      return;
    }
    if (data.length > 50) {
      setError('Maximum 50 students allowed. Please reduce the number of rows.');
      return;
    }
    
    const normalized = normalizeData(data);
    
    if (normalized.length === 0) {
      setError('No valid student names found. Make sure you have a "Name" column.');
      return;
    }

    setStudents(normalized);
  };

  const generateReports = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students, classLevel })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate reports');
      }

      const data = await response.json();
      setReports(data.reports);
    } catch (err) {
      setError(err.message || 'Error generating reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const copyReport = (index) => {
    navigator.clipboard.writeText(reports[index].report);
    setCopied(index);
    setTimeout(() => setCopied(null), 1500);
  };

  const copyAll = () => {
    const allReports = reports.map(r => `${r.name}\n\n${r.report}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(allReports);
    setCopied('all');
    setTimeout(() => setCopied(null), 1500);
  };

  const reset = () => {
    setStudents([]);
    setReports([]);
    setError('');
    setElapsedTime(0);
  };

  const selectedLevel = CLASS_LEVELS.find(l => l.value === classLevel);

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* Falling Pattern Background */}
      <div className="falling-pattern" />

      {/* Header */}
      <header className="relative glass-header sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
              <FileText className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">Report Generator</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">AI-powered student feedback</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-500" strokeWidth={2.5} />
            ) : (
              <Moon className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-12 z-10">
        {/* Upload Section */}
        {students.length === 0 && (
          <div className="glass-card rounded-3xl p-10 animate-fade-in">
            {/* Class Level Selector */}
            <div className="mb-10">
              <label className="block text-base font-semibold text-slate-800 dark:text-white mb-3">
                Select Class Level
              </label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="custom-select w-full md:w-80 px-5 py-4 pr-14 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-lg font-semibold shadow-sm focus:outline-none focus:border-indigo-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-purple-500/20 transition-all cursor-pointer"
              >
                {CLASS_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label} ({level.description})
                  </option>
                ))}
              </select>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-indigo-300 dark:border-purple-500/50 rounded-3xl p-16 text-center hover:border-indigo-500 dark:hover:border-purple-400 hover:bg-indigo-50/50 dark:hover:bg-purple-500/5 transition-all duration-300 cursor-pointer group"
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
              />
              <label htmlFor="fileInput" className="cursor-pointer">
                <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-indigo-500/25">
                  <Upload className="w-12 h-12 text-white" strokeWidth={2} />
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Drop your spreadsheet here</p>
                <p className="text-base text-slate-600 dark:text-slate-400 font-medium">CSV or Excel file · Maximum 50 students</p>
              </label>
            </div>
            
            <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-5">Required Columns</p>
              <div className="flex flex-wrap gap-3">
                {['Name', 'Strength', 'Weakness', 'Suggestion', 'Extra'].map((col) => (
                  <span 
                    key={col} 
                    className="px-5 py-2.5 rounded-full text-sm font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ready to Generate */}
        {students.length > 0 && reports.length === 0 && (
          <div className="glass-card rounded-3xl p-10 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                  <CheckCircle2 className="w-9 h-9 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">{students.length} students</p>
                  <p className="text-base text-slate-600 dark:text-slate-300 font-medium">
                    Level: <span className="font-bold text-indigo-600 dark:text-purple-400">{selectedLevel?.label}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={reset}
                  disabled={loading}
                  className="px-6 py-3.5 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw className="w-5 h-5" strokeWidth={2.5} />
                  Cancel
                </button>
                <button
                  onClick={generateReports}
                  disabled={loading}
                  className="btn-primary px-8 py-4 rounded-2xl text-white font-bold shadow-xl disabled:opacity-50 flex items-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" strokeWidth={2.5} />
                      <span>Generate Reports</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {loading && (
              <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <Loader2 className="w-6 h-6 text-indigo-600 dark:text-purple-400 animate-spin" strokeWidth={2.5} />
                    <span className="text-lg font-bold text-slate-800 dark:text-white">Creating reports with AI...</span>
                  </div>
                  <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" strokeWidth={2.5} />
                    <span className="font-mono font-bold text-slate-700 dark:text-white">{formatTime(elapsedTime)}</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full progress-bar rounded-full" style={{ width: '100%' }} />
                </div>
                
                {/* Dad Joke Section */}
                <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-3">
                    🤓 Here's a dad joke while you wait...
                  </p>
                  <p className="text-lg text-slate-700 dark:text-slate-200 italic font-medium">
                    "{currentJoke}"
                  </p>
                </div>
                
                <p className="text-base text-slate-600 dark:text-slate-300 mt-5 text-center font-medium">
                  This may take a minute or two. Please wait...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reports Generated */}
        {reports.length > 0 && (
          <>
            <div className="glass-card rounded-3xl p-8 mb-8 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{reports.length} reports ready</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Level: {selectedLevel?.label}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={reset}
                    className="px-5 py-3 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" strokeWidth={2.5} />
                    Start Over
                  </button>
                  <button
                    onClick={copyAll}
                    className="btn-success px-6 py-3.5 rounded-2xl text-white font-bold shadow-lg flex items-center gap-2"
                  >
                    {copied === 'all' ? (
                      <>
                        <Check className="w-5 h-5" strokeWidth={2.5} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" strokeWidth={2.5} />
                        <span>Copy All</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {reports.map((item, index) => (
                <div 
                  key={index} 
                  className="glass-card rounded-2xl overflow-hidden card-lift animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{item.name}</h2>
                    <button
                      onClick={() => copyReport(index)}
                      className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-white hover:text-indigo-600 dark:hover:text-purple-400 border-2 border-slate-300 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-400 dark:hover:border-purple-500 transition-all flex items-center gap-2"
                    >
                      {copied === index ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" strokeWidth={2.5} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="px-6 py-6">
                    <p className="text-lg text-slate-800 dark:text-white leading-relaxed whitespace-pre-wrap">{item.report}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/50 rounded-2xl animate-fade-in">
            <p className="text-red-700 dark:text-red-300 font-bold">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}