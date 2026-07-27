import { useState, useEffect } from 'react';
import Icon from './Icon';

// The DM template services "comment DATA and I'll send the repo/pattern"
// posts. Edits are saved locally.
const DEFAULT_TEMPLATE =
  'Hey {{name}},\n\nThanks for the comment. Here is the repo/pattern from the post:\n[PASTE GITHUB OR DRIVE LINK HERE]\n\nIf you build on it or would have done it differently, I genuinely want to hear how it goes.';
const TEMPLATE_KEY = 'leadgen.engagement.template.v2';
const SESSION_KEY = 'leadgen.engagement.session.v1';

export default function EngagementPage({ showToast }) {
  const [rawInput, setRawInput] = useState('');
  const [messageTemplate, setMessageTemplate] = useState(() => {
    try { return localStorage.getItem(TEMPLATE_KEY) || DEFAULT_TEMPLATE; } catch (e) { return DEFAULT_TEMPLATE; }
  });
  // Leads + processed status survive a page refresh: losing track of who was
  // already DM'd mid-session means double-messaging prospects.
  const [leads, setLeads] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')?.leads || []; } catch (e) { return []; }
  });
  const [processedIds, setProcessedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')?.processedIds || []); } catch (e) { return new Set(); }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ leads, processedIds: [...processedIds] }));
    } catch (e) { /* storage full — leads are re-parseable, not critical */ }
  }, [leads, processedIds]);

  const exportCsv = () => {
    if (!leads.length) { showToast('No leads to export.'); return; }
    const esc = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
    const rows = [['Name', 'Comment', 'Processed'].join(',')];
    leads.forEach((l) => rows.push([esc(l.name), esc(l.comment), processedIds.has(l.id) ? 'yes' : 'no'].join(',')));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `engagement-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast(`Exported ${leads.length} leads.`);
  };

  const clearLeads = () => {
    setLeads([]);
    setProcessedIds(new Set());
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    showToast('Lead list cleared.');
  };

  const handleTemplateChange = (e) => {
    setMessageTemplate(e.target.value);
    try { localStorage.setItem(TEMPLATE_KEY, e.target.value); } catch (err) { /* quota */ }
  };

  const parseComments = () => {
    if (!rawInput.trim()) {
      showToast('Please paste some text first!');
      return;
    }

    const lines = rawInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const parsedLeads = [];
    const seenNames = new Set();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match typical LinkedIn comment timestamp indicators: e.g. "1d", "3h", "12h", "1w", "2wk", "1mo", "just now"
      const isTimestamp = /^(just now|now|\d+[mhdw]k?|1mo|2mo|1yr)$/i.test(line);

      if (isTimestamp && i > 0 && i < lines.length - 1) {
        // Comment text is the next line
        let commentText = lines[i + 1];

        // Skip standard action buttons that paste with comments
        const skipKeywords = ['like', 'reply', 'share', 'vertical ellipsis', '...', 'translate'];
        if (skipKeywords.includes(commentText.toLowerCase())) {
          continue;
        }

        // Search backward for the name.
        // LinkedIn comment blocks usually have the name 2-3 lines before the timestamp.
        let name = '';
        let j = i - 1;
        while (j >= 0) {
          const prev = lines[j];
          // Skip connection tags ("• 1st", "• 2nd", "3rd+") and empty rows
          if (prev.includes('•') || /^(1st|2nd|3rd)/i.test(prev)) {
            j--;
            continue;
          }
          // The line preceding the connection tag/headline block is the author name.
          // Let's grab the first valid line.
          name = prev;
          break;
        }

        // Clean up duplicate name pastes if they occur (e.g. "Jane Doe\nJane Doe")
        if (name && !seenNames.has(name)) {
          seenNames.add(name);
          parsedLeads.push({
            id: `lead_${Date.now()}_${parsedLeads.length}`,
            name: name,
            comment: commentText,
          });
          // Move index past the comment line to avoid double-processing
          i++;
        }
      }
    }

    if (parsedLeads.length === 0) {
      // Fallback: Try a simpler line-by-line keyword scanner if formatting is weird
      showToast('No structured comments found. Attempting basic parser...');
      let fallbackIndex = 0;
      for (let k = 0; k < lines.length - 1; k++) {
        if (/^(tax|guide|leads|pdf|yes|info|interested|send)$/i.test(lines[k + 1])) {
          const nameCandidate = lines[k].replace(/•.*/, '').trim();
          if (nameCandidate && nameCandidate.length > 2 && !seenNames.has(nameCandidate)) {
            seenNames.add(nameCandidate);
            parsedLeads.push({
              id: `lead_fb_${Date.now()}_${fallbackIndex++}`,
              name: nameCandidate,
              comment: lines[k + 1],
            });
          }
        }
      }
    }

    setLeads(parsedLeads);
    setProcessedIds(new Set());
    showToast(`Parsed ${parsedLeads.length} leads!`);
  };

  const getFirstName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    // Filter out prefixes like Dr., MD, PhD, etc.
    const namePart = parts.find((p) => !/^(dr\.?|md|ph\.?d|m\.?d\.?)$/i.test(p));
    return namePart || parts[0] || '';
  };

  const generateMessage = (fullName) => {
    const firstName = getFirstName(fullName);
    return messageTemplate.replace(/\{\{name\}\}/g, firstName);
  };

  const processLead = (lead) => {
    const msg = generateMessage(lead.name);
    navigator.clipboard.writeText(msg);
    
    // Set status to processed
    setProcessedIds((prev) => {
      const next = new Set(prev);
      next.add(lead.id);
      return next;
    });

    // Open LinkedIn Search for the profile
    const searchUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(lead.name)}`;
    window.open(searchUrl, '_blank');
    showToast(`Copied text & opened search page for ${getFirstName(lead.name)}!`);
  };

  return (
    <div className="animate-fade-in text-[var(--text-1)]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-1)] flex items-center gap-2.5">
          <Icon name="message" size={22} strokeWidth={2.2} /> Comments to DMs
        </h2>
        <p className="text-sm text-[var(--text-2)] mt-1">
          A risk-free, 100% compliant way to automate sending Lead Magnets. No browser bots or APIs needed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Input & Templates */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-[var(--text-1)] mb-3">1. Paste Post Comments</h3>
            <p className="text-xs text-[var(--text-2)] mb-3">
              Right-click and drag to select all comments on your LinkedIn post, press Copy, and paste the raw text here:
            </p>
            <textarea
              className="input-field w-full h-40 text-sm font-mono mb-3"
              placeholder="Paste LinkedIn comments here..."
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
            />
            <button className="btn-primary w-full" onClick={parseComments}>
              Parse Comment Leads
            </button>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-semibold text-[var(--text-1)] mb-3">2. Edit DM Template</h3>
            <p className="text-xs text-[var(--text-2)] mb-3">
              Use <code className="text-[var(--accent)]">{"{{name}}"}</code> to insert the prospect's first name automatically.
            </p>
            <textarea
              className="input-field w-full h-48 text-sm mb-3"
              value={messageTemplate}
              onChange={handleTemplateChange}
              placeholder="Hi {{name}}, here is the link..."
            />
            <div className="text-xs text-[var(--text-3)]">
              <strong>Preview Example:</strong>
              <div className="bg-[var(--surface-2)] p-3 rounded mt-2 border border-[var(--input-border)] font-mono text-[var(--text-2)] whitespace-pre-wrap">
                {generateMessage('Dr. Jane Doe')}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Parsed Leads & Action Station */}
        <div className="lg:col-span-7 card p-5 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--card-border)]">
            <h3 className="text-lg font-semibold text-[var(--text-1)]">
              Parsed Leads ({leads.length})
            </h3>
            {leads.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-2)]">
                  Sent: {processedIds.size} / {leads.length}
                </span>
                <button className="btn-ghost text-xs flex items-center gap-1.5" onClick={exportCsv}><Icon name="download" size={12} /> CSV</button>
                <button className="btn-ghost text-xs flex items-center gap-1.5" onClick={clearLeads}><Icon name="trash" size={12} /> Clear</button>
              </div>
            )}
          </div>

          {leads.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <span className="text-5xl mb-3 text-[var(--text-3)]">💬</span>
              <h4 className="text-base font-medium text-[var(--text-2)] mb-1">No leads loaded</h4>
              <p className="text-xs text-[var(--text-3)] max-w-sm">
                Paste raw post comments into the input panel and click "Parse" to populate this workspace.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 flex flex-col gap-3">
              {leads.map((lead) => {
                const isProcessed = processedIds.has(lead.id);
                return (
                  <div
                    key={lead.id}
                    className={`card p-4 transition-all ${
                      isProcessed ? 'bg-[var(--surface-2)] opacity-80' : 'border-[var(--accent)]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[var(--text-1)] text-sm">{lead.name}</h4>
                          <button 
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer border ${isProcessed ? 'bg-green-900/40 text-green-500 border-green-700/50' : 'bg-yellow-900/40 text-yellow-500 border-yellow-700/50'}`}
                            onClick={() => {
                              setProcessedIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(lead.id)) next.delete(lead.id);
                                else next.add(lead.id);
                                return next;
                              });
                            }}
                          >
                            {isProcessed ? '✓ Sent' : '⏳ Pending'}
                          </button>
                        </div>
                        <p className="text-xs text-[var(--text-3)] mt-1">
                          Comment: <span className="text-[var(--text-2)] font-semibold">"{lead.comment}"</span>
                        </p>
                      </div>

                      <button
                        className={`w-full sm:w-auto text-xs px-4 py-2 rounded-lg font-semibold transition-all ${
                          isProcessed
                            ? 'btn-secondary text-[var(--text-3)]'
                            : 'btn-primary shadow-md'
                        }`}
                        onClick={() => processLead(lead)}
                      >
                        Copy Msg & Open Search
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
