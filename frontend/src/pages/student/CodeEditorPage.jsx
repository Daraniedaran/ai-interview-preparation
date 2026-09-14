import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { codingService } from '../../services'
import Editor from '@monaco-editor/react'
import { useTheme } from '../../context/ThemeContext'
import toast from 'react-hot-toast'
import {
  RiPlayFill, RiSendPlaneFill, RiLightbulbLine,
  RiArrowLeftLine, RiCheckLine, RiCloseLine, RiTerminalBoxLine,
  RiTimeLine, RiLoader4Line, RiCodeLine, RiKeyboardLine,
  RiFlashlightLine,
} from 'react-icons/ri'

const defaultCodeTemplates = {
  python: `def solution(input_data):
    # Write your solution here
    pass

import sys
if __name__ == "__main__":
    lines = sys.stdin.read().splitlines()
    if lines:
        print(solution(lines[0]))
`,
  javascript: `function solution(inputData) {
    // Write your solution here
    return inputData;
}

const fs = require('fs');
const input = fs.readFileSync('/dev/stdin', 'utf-8').trim();
console.log(solution(input));
`,
  cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    if (cin >> s) {
        cout << s;
    }
    return 0;
}
`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNext()) {
            System.out.println(scanner.next());
        }
    }
}
`,
  sql: `-- Write your SQL query here
SELECT * FROM table_name LIMIT 10;
`,
  c: `#include <stdio.h>

int main() {
    char buf[1024];
    if (scanf("%1023s", buf) == 1) {
        printf("%s", buf);
    }
    return 0;
}
`,
  csharp: `using System;

class Program {
    static void Main() {
        var line = Console.ReadLine();
        if (line != null) Console.WriteLine(line);
    }
}
`,
  go: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    if scanner.Scan() {
        fmt.Println(scanner.Text())
    }
}
`,
}

// Status badge config
const STATUS_CONFIG = {
  accepted:             { label: 'Accepted',              color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' },
  wrong_answer:         { label: 'Wrong Answer',          color: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' },
  runtime_error:        { label: 'Runtime Error',         color: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800' },
  compilation_error:    { label: 'Compilation Error',     color: 'text-yellow-600 dark:text-yellow-400',   bg: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800' },
  time_limit_exceeded:  { label: 'Time Limit Exceeded',   color: 'text-purple-600 dark:text-purple-400',   bg: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800' },
}

// Single test case result card
const TestCaseCard = ({ tc, index, isActive, onClick }) => {
  const passed = tc.passed
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
        isActive
          ? passed
            ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 text-emerald-700 dark:text-emerald-300'
            : 'bg-red-100 dark:bg-red-900/40 border-red-400 text-red-700 dark:text-red-300'
          : passed
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:border-emerald-400'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:border-red-400'
      }`}
    >
      {passed
        ? <RiCheckLine className="text-sm" />
        : <RiCloseLine className="text-sm" />
      }
      Case {index + 1}{tc.is_sample ? '' : ' 🔒'}
    </button>
  )
}

// Detail view of a single test case
const TestCaseDetail = ({ tc }) => (
  <div className="space-y-2 text-xs font-mono">
    {tc.is_sample ? (
      <>
        <div>
          <div className="text-gray-400 mb-0.5 font-sans font-semibold uppercase tracking-wider text-[10px]">Input</div>
          <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-2 whitespace-pre-wrap text-gray-800 dark:text-gray-200">
            {tc.input_data || '(empty)'}
          </div>
        </div>
        <div>
          <div className="text-gray-400 mb-0.5 font-sans font-semibold uppercase tracking-wider text-[10px]">Expected Output</div>
          <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-2 whitespace-pre-wrap text-gray-800 dark:text-gray-200">
            {tc.expected_output || '(empty)'}
          </div>
        </div>
        <div>
          <div className={`mb-0.5 font-sans font-semibold uppercase tracking-wider text-[10px] ${tc.passed ? 'text-emerald-500' : 'text-red-500'}`}>
            Your Output {tc.passed ? '✓' : '✗'}
          </div>
          <div className={`rounded-lg p-2 whitespace-pre-wrap ${
            tc.passed
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}>
            {tc.actual_output || '(no output)'}
          </div>
        </div>
        {tc.error && (
          <div>
            <div className="text-orange-500 mb-0.5 font-sans font-semibold uppercase tracking-wider text-[10px]">Error</div>
            <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 rounded-lg p-2 whitespace-pre-wrap border border-orange-200 dark:border-orange-800">
              {tc.error}
            </div>
          </div>
        )}
      </>
    ) : (
      <div className="flex flex-col items-center justify-center py-4 text-center text-gray-400 gap-2">
        <RiKeyboardLine className="text-2xl" />
        <div className="font-sans text-xs">
          This is a <strong>hidden test case</strong>.<br />Input and expected output are not shown.
        </div>
        <div className={`font-sans font-bold text-sm ${tc.passed ? 'text-emerald-500' : 'text-red-500'}`}>
          {tc.passed ? '✓ Passed' : '✗ Failed'}
        </div>
        {tc.error && (
          <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 rounded-lg p-2 w-full text-left border border-orange-200 dark:border-orange-800">
            {tc.error}
          </div>
        )}
      </div>
    )}
    {tc.execution_time_ms != null && (
      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-sans">
        <RiTimeLine /> {tc.execution_time_ms} ms
      </div>
    )}
  </div>
)

// Console panel content
const ConsoleContent = ({ output, isRunning, isSubmitting, customInput, setCustomInput, consoleTab }) => {
  const [activeTestCase, setActiveTestCase] = useState(0)

  // Reset active test case when output changes
  useEffect(() => { setActiveTestCase(0) }, [output])

  const isLoading = isRunning || isSubmitting

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
        <RiLoader4Line className="text-2xl animate-spin text-primary-500" />
        <span className="text-xs font-medium">
          {isSubmitting ? 'Running all test cases...' : 'Executing your code...'}
        </span>
      </div>
    )
  }

  // Run output (no test cases)
  if (consoleTab === 'output' && output && !output.test_results) {
    return (
      <div className="space-y-3 p-3 text-xs font-mono h-full overflow-y-auto">
        {output.output != null && (
          <div>
            <div className="text-gray-400 mb-1 font-sans font-semibold uppercase tracking-wider text-[10px]">Output</div>
            <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-2.5 whitespace-pre-wrap text-gray-800 dark:text-gray-200 min-h-[40px]">
              {output.output || '(no output)'}
            </div>
          </div>
        )}
        {output.error && (
          <div>
            <div className="text-red-500 mb-1 font-sans font-semibold uppercase tracking-wider text-[10px]">Error</div>
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg p-2.5 whitespace-pre-wrap border border-red-200 dark:border-red-800">
              {output.error}
            </div>
          </div>
        )}
        {output.execution_time_ms != null && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-sans">
            <RiTimeLine /> {output.execution_time_ms} ms
          </div>
        )}
      </div>
    )
  }

  // Submit output (with test cases)
  if (consoleTab === 'output' && output?.test_results) {
    const status = output.status
    const statusCfg = STATUS_CONFIG[status] || { label: status, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' }
    const testResults = output.test_results || []

    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Status banner */}
        <div className={`flex items-center justify-between px-3 py-2 border-b ${statusCfg.bg} border-gray-100 dark:border-dark-700`}>
          <div className={`flex items-center gap-2 font-bold text-sm ${statusCfg.color}`}>
            {status === 'accepted' ? <RiCheckLine /> : <RiCloseLine />}
            {statusCfg.label}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="font-semibold">
              {output.test_cases_passed}/{output.total_test_cases} tests passed
            </span>
            {output.execution_time_ms != null && (
              <span className="flex items-center gap-1"><RiTimeLine />{output.execution_time_ms} ms</span>
            )}
            {output.score != null && (
              <span className="flex items-center gap-1"><RiFlashlightLine />{Math.round(output.score)}%</span>
            )}
          </div>
        </div>

        {/* Error message for compilation/runtime */}
        {output.error_message && !output.test_results?.some(t => t.error) && (
          <div className="px-3 py-2 text-xs font-mono text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-orange-500 block mb-1">Error</span>
            {output.error_message}
          </div>
        )}

        {testResults.length > 0 ? (
          <div className="flex flex-col min-h-0 flex-1">
            {/* Test case tabs */}
            <div className="flex gap-1.5 px-3 py-2 border-b border-gray-100 dark:border-dark-700 overflow-x-auto flex-shrink-0">
              {testResults.map((tc, i) => (
                <TestCaseCard
                  key={i}
                  tc={tc}
                  index={i}
                  isActive={activeTestCase === i}
                  onClick={() => setActiveTestCase(i)}
                />
              ))}
            </div>
            {/* Active test case detail */}
            <div className="flex-1 overflow-y-auto p-3">
              {testResults[activeTestCase] && (
                <TestCaseDetail tc={testResults[activeTestCase]} />
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-400 text-xs">
            No test case results available
          </div>
        )}
      </div>
    )
  }

  // Custom input tab
  if (consoleTab === 'input') {
    return (
      <div className="p-3 flex flex-col gap-2 h-full">
        <div className="text-[10px] font-sans font-semibold uppercase tracking-wider text-gray-400">
          Custom Input (used when clicking Run)
        </div>
        <textarea
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          className="flex-1 resize-none bg-gray-100 dark:bg-dark-700 rounded-lg p-2.5 font-mono text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-transparent focus:border-primary-400"
          placeholder="Enter custom input here..."
          spellCheck={false}
        />
      </div>
    )
  }

  // Default empty state
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
      <RiTerminalBoxLine className="text-2xl" />
      <span className="text-xs">Run your code or submit to see output here.</span>
    </div>
  )
}

const CodeEditorPage = () => {
  const { id } = useParams()
  const { isDark } = useTheme()
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(defaultCodeTemplates.python)
  const [codeByLang, setCodeByLang] = useState({ python: defaultCodeTemplates.python })
  const [activeTab, setActiveTab] = useState('description')
  const [consoleTab, setConsoleTab] = useState('output')
  const [customInput, setCustomInput] = useState('')
  const [output, setOutput] = useState(null)
  const [aiHint, setAiHint] = useState(null)
  const [consoleHeight, setConsoleHeight] = useState(220)

  const { data: problem, isLoading } = useQuery({
    queryKey: ['coding-problem', id],
    queryFn: () => codingService.getById(id),
  })

  const { data: submissions, refetch: refetchSubmissions } = useQuery({
    queryKey: ['my-submissions', id],
    queryFn: () => codingService.getMySubmissions(id),
  })

  const handleLanguageChange = (next) => {
    setCodeByLang((prev) => ({ ...prev, [language]: code }))
    setLanguage(next)
    setCode(codeByLang[next] ?? defaultCodeTemplates[next] ?? '')
  }

  // Pre-fill custom input with first sample test case (supports both input/input_data keys)
  useEffect(() => {
    const firstInput = problem?.sample_test_cases?.[0]?.input
      ?? problem?.sample_test_cases?.[0]?.input_data ?? ''
    if (firstInput && !customInput) {
      setCustomInput(firstInput)
    }
  }, [problem, customInput])

  const runMutation = useMutation({
    mutationFn: codingService.run,
    onSuccess: (data) => {
      setOutput(data)
      setConsoleTab('output')
      toast.success('Code executed!')
    },
    onError: (err) => {
      const msg = err?.response?.data?.detail || 'Code execution failed'
      toast.error(msg)
    },
  })

  const submitMutation = useMutation({
    mutationFn: codingService.submit,
    onSuccess: (data) => {
      setOutput({
        status: data.status,
        score: data.score,
        test_cases_passed: data.test_cases_passed,
        total_test_cases: data.total_test_cases,
        execution_time_ms: data.execution_time_ms,
        error_message: data.error_message,
        test_results: data.test_results || [],
      })
      setConsoleTab('output')
      refetchSubmissions()
      if (data.status === 'accepted') {
        toast.success('🎉 Solution Accepted!')
      } else {
        const statusMap = {
          wrong_answer: 'Wrong Answer',
          runtime_error: 'Runtime Error',
          compilation_error: 'Compilation Error',
          time_limit_exceeded: 'Time Limit Exceeded',
        }
        toast.error(statusMap[data.status] || data.status)
      }
    },
    onError: () => toast.error('Submission failed'),
  })

  const hintMutation = useMutation({
    mutationFn: codingService.getHint,
    onSuccess: (data) => {
      setAiHint(data.hint)
      toast.success('AI hint generated!')
    },
  })

  const handleRun = () => {
    runMutation.mutate({
      code,
      language,
      input_data: customInput || problem?.sample_test_cases?.[0]?.input || '',
    })
  }

  const handleSubmit = () => {
    submitMutation.mutate({
      question_id: Number(id),
      code,
      language,
    })
  }

  const handleGetHint = () => {
    hintMutation.mutate({
      question_id: Number(id),
      code,
      language,
      error_message: output?.error_message || null,
    })
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  const isRunning = runMutation.isPending
  const isSubmitting = submitMutation.isPending

  return (
    <div className="h-[calc(100vh-96px)] flex flex-col gap-3 -m-4 sm:-m-6 lg:-m-8 p-4">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white dark:bg-dark-800 p-3 rounded-xl border border-gray-100 dark:border-dark-700">
        <div className="flex items-center gap-3">
          <Link to="/coding" className="btn-icon text-gray-500">
            <RiArrowLeftLine />
          </Link>
          <h2 className="font-bold text-gray-900 dark:text-white text-base">
            {problem?.title}
          </h2>
          <span className={`badge ${problem?.difficulty === 'Easy' ? 'badge-success' : problem?.difficulty === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>
            {problem?.difficulty?.toLowerCase()}
          </span>
        </div>

        {/* Language selector & actions */}
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="input w-36 py-1.5 text-xs font-mono"
          >
            {(problem?.supported_languages?.length ? problem.supported_languages : Object.keys(defaultCodeTemplates)).map((lang) => (
              <option key={lang} value={lang}>
                {lang === 'python' ? 'Python 3' : lang === 'javascript' ? 'JavaScript' : lang === 'cpp' ? 'C++' : lang === 'csharp' ? 'C#' : lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>

          <button
            onClick={handleGetHint}
            disabled={hintMutation.isPending}
            className="btn-secondary btn-sm text-yellow-600 dark:text-yellow-400"
          >
            <RiLightbulbLine /> {hintMutation.isPending ? 'Asking AI...' : 'AI Hint'}
          </button>

          <button
            onClick={() => { setConsoleTab('input'); }}
            className="btn-secondary btn-sm text-blue-600 dark:text-blue-400"
            title="Edit custom input"
          >
            <RiCodeLine /> Input
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className="btn-secondary btn-sm"
          >
            {isRunning
              ? <RiLoader4Line className="animate-spin text-green-500" />
              : <RiPlayFill className="text-green-500" />
            }
            {isRunning ? 'Running...' : 'Run'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="btn-primary btn-sm"
          >
            {isSubmitting
              ? <RiLoader4Line className="animate-spin" />
              : <RiSendPlaneFill />
            }
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Main Grid: Problem Left, Editor Right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
        {/* Left Pane: Description & Submissions */}
        <div className="card p-0 flex flex-col min-h-0 overflow-hidden border border-gray-100 dark:border-dark-700">
          {/* Sub-tabs */}
          <div className="flex border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900 px-3">
            {[
              { id: 'description', label: 'Problem' },
              { id: 'submissions', label: `Submissions (${submissions?.length || 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400 bg-white dark:bg-dark-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 prose-custom text-sm space-y-4">
            {activeTab === 'description' && (
              <>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                    {problem?.problem_statement}
                  </p>
                </div>

                {problem?.examples?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-xs uppercase tracking-wider mb-2">Examples</h4>
                    {problem.examples.map((ex, i) => (
                      <div key={i} className="code-block text-xs mb-2 space-y-1">
                        <div><span className="text-gray-400">Input:</span> {ex.input}</div>
                        <div><span className="text-gray-400">Output:</span> {ex.output}</div>
                        {ex.explanation && <div><span className="text-gray-400">Explanation:</span> {ex.explanation}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {problem?.constraints && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-xs uppercase tracking-wider mb-1">Constraints</h4>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-dark-900 p-2 rounded-lg font-mono">
                      {problem.constraints}
                    </pre>
                  </div>
                )}

                {aiHint && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                    <div className="flex items-center gap-2 font-bold mb-1 text-xs">
                      <RiLightbulbLine /> AI Hint
                    </div>
                    <p className="text-xs leading-relaxed">{aiHint}</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'submissions' && (
              <div className="space-y-2">
                {submissions?.length === 0 && (
                  <div className="text-center text-gray-400 text-xs py-6">No submissions yet. Write your solution and click Submit!</div>
                )}
                {submissions?.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-700">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${s.status === 'accepted' ? 'badge-success' : 'badge-danger'}`}>
                          {s.status?.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-gray-500">{s.language}</span>
                      </div>
                      <span className="text-gray-400">
                        {new Date(s.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                    {s.test_cases_passed != null && (
                      <div className="mt-1 text-[10px] text-gray-400 flex gap-3">
                        <span>{s.test_cases_passed}/{s.total_test_cases} tests passed</span>
                        {s.execution_time_ms != null && <span>{s.execution_time_ms}ms</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Code Editor & Console Output */}
        <div className="flex flex-col min-h-0 rounded-xl overflow-hidden border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800">
          {/* Code Editor — takes available space */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              theme={isDark ? 'vs-dark' : 'light'}
              value={code}
              onChange={(v) => setCode(v || '')}
              options={{
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          {/* Bottom Console Panel */}
          <div
            className="border-t border-gray-100 dark:border-dark-700 flex flex-col bg-gray-50 dark:bg-dark-900"
            style={{ height: consoleHeight }}
          >
            {/* Console header with tabs */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 dark:border-dark-700 flex-shrink-0">
              <div className="flex items-center gap-0">
                <button
                  onClick={() => setConsoleTab('output')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    consoleTab === 'output'
                      ? 'bg-white dark:bg-dark-700 text-gray-800 dark:text-gray-200 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <RiTerminalBoxLine /> Output
                  {/* Badge showing pass count when there are test results */}
                  {output?.test_results?.length > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      output.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    }`}>
                      {output.test_cases_passed}/{output.total_test_cases}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setConsoleTab('input')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    consoleTab === 'input'
                      ? 'bg-white dark:bg-dark-700 text-gray-800 dark:text-gray-200 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <RiKeyboardLine /> Custom Input
                </button>
              </div>

              {/* Resize controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setConsoleHeight(h => Math.max(140, h - 60))}
                  className="text-gray-400 hover:text-gray-600 text-xs px-1.5 py-0.5 rounded"
                  title="Shrink console"
                >−</button>
                <button
                  onClick={() => setConsoleHeight(h => Math.min(480, h + 60))}
                  className="text-gray-400 hover:text-gray-600 text-xs px-1.5 py-0.5 rounded"
                  title="Expand console"
                >+</button>
              </div>
            </div>

            {/* Console body */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ConsoleContent
                output={output}
                isRunning={isRunning}
                isSubmitting={isSubmitting}
                customInput={customInput}
                setCustomInput={setCustomInput}
                consoleTab={consoleTab}
                setConsoleTab={setConsoleTab}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodeEditorPage
