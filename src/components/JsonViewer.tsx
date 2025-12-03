/**
 * JsonViewer Component
 * Syntax-highlighted JSON display with copy functionality
 */

import { useState } from 'react'

interface JsonViewerProps {
  data: unknown
  collapsed?: boolean
}

export function JsonViewer({ data, collapsed = false }: JsonViewerProps) {
  const [copied, setCopied] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(collapsed)

  const jsonString = JSON.stringify(data, null, 2)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Syntax highlighting for JSON
  const highlightJson = (json: string): React.ReactNode[] => {
    const lines = json.split('\n')
    return lines.map((line, i) => {
      // Highlight different parts of JSON
      const highlighted = line
        // Keys (in quotes before colon)
        .replace(
          /"([^"]+)"(?=\s*:)/g,
          '<span class="json-key">"$1"</span>'
        )
        // String values
        .replace(
          /:\s*"([^"]*)"(,?)$/g,
          ': <span class="json-string">"$1"</span>$2'
        )
        // Numbers
        .replace(
          /:\s*(-?\d+\.?\d*)(,?)$/g,
          ': <span class="json-number">$1</span>$2'
        )
        // Booleans
        .replace(
          /:\s*(true|false)(,?)$/g,
          ': <span class="json-boolean">$1</span>$2'
        )
        // Null
        .replace(
          /:\s*(null)(,?)$/g,
          ': <span class="json-null">$1</span>$2'
        )

      return (
        <div key={i} className="leading-relaxed">
          <span
            className="select-text"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      )
    })
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-700"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {isCollapsed ? 'Expand' : 'Collapse'}
          </button>
          <span className="text-xs text-surface-400">
            {jsonString.length.toLocaleString()} characters
          </span>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
            ${
              copied
                ? 'bg-success-100 text-success-700'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }
          `}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy JSON
            </>
          )}
        </button>
      </div>

      {/* JSON Content */}
      {!isCollapsed && (
        <div className="bg-surface-800 rounded-lg p-4 overflow-x-auto">
          <pre className="font-mono text-xs text-surface-100">
            {highlightJson(jsonString)}
          </pre>
        </div>
      )}

      {/* Collapsed Preview */}
      {isCollapsed && (
        <div className="bg-surface-100 rounded-lg p-3 text-xs font-mono text-surface-500 truncate">
          {jsonString.slice(0, 100)}...
        </div>
      )}
    </div>
  )
}

