import { useState, useEffect } from 'react';
import Icon from './Icon';
import { parseBuildQueue } from '../utils/excelParser';

// The app's answer to "what do I do next?".
//
// Reads the sequenced sprint queue from the workbook and shows exactly one
// sprint with one next action, instead of leaving the user to choose between
// nine equal nav items. Progress is local: which sprint is current, and
// whether its build is done.
const PROGRESS_KEY = 'leadgen.sprintProgress.v1';

const loadProgress = () => {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null') || { current: 1, built: false };
  } catch (e) {
    return { current: 1, built: false };
  }
};

export default function ThisWeekPanel({ onUseIdea, showToast }) {
  const [queue, setQueue] = useState([]);
  const [progress, setProgress] = useState(loadProgress);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/Databricks Ideas.xlsx');
        if (!res.ok) throw new Error('not found');
        setQueue(await parseBuildQueue(await res.arrayBuffer()));
      } catch (e) {
        setLoadError(true);
      }
    })();
  }, []);

  const save = (next) => {
    setProgress(next);
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch (e) { /* quota */ }
  };

  if (loadError || queue.length === 0) return null;

  const sprint = queue.find((q) => q.sprint === progress.current) || queue[0];
  const isLast = sprint.sprint >= queue[queue.length - 1].sprint;

  // One sprint, one next action.
  const step = progress.built
    ? {
        label: 'Next: turn your build notes into this week\'s posts',
        detail: 'Paste the notes you took during the build into Generate. Architecture Teardown and UI Showcase are written from those notes only.',
        cta: 'Send to Generate',
        icon: 'zap',
      }
    : {
        label: 'Next: build it on Databricks Free Edition',
        detail: 'Open the dataset, build bronze to gold, then the frontend. Jot rough notes as you go: what broke, row counts, runtime, the actual finding.',
        cta: 'Copy the brief',
        icon: 'code',
      };

  const brief = `SPRINT ${sprint.sprint} (${sprint.industry})
Question: ${sprint.question}
Dataset: ${sprint.dataset}${sprint.datasetUrl ? ` (${sprint.datasetUrl})` : ''}
Backend: ${sprint.backend}
Frontend: ${sprint.frontend}
Post angle: ${sprint.postAngle}

Write your real notes below as you build, then paste this whole thing into Generate.
NOTES:
- What I built:
- What broke:
- Numbers (rows, runtime, cost):
- What surprised me:`;

  const act = () => {
    if (progress.built) {
      onUseIdea && onUseIdea({
        topic: sprint.question,
        industry: sprint.industry,
        postAngle: sprint.postAngle,
        notes: brief,
      });
      showToast && showToast('Sent to Generate. Replace the NOTES section with what actually happened.');
    } else {
      navigator.clipboard.writeText(brief);
      showToast && showToast('Brief copied. Keep it open while you build and fill in the notes.');
    }
  };

  return (
    <div className="card p-5 mb-6" style={{ borderLeft: '3px solid var(--accent)' }}>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-1">
            <Icon name="clock" size={13} strokeWidth={2.4} />
            This week: sprint {sprint.sprint} of {queue[queue.length - 1].sprint}
            <span className="text-[var(--text-3)] font-medium normal-case tracking-normal">
              · {sprint.industry}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white leading-snug max-w-2xl">{sprint.question}</h3>
        </div>
        <div className="flex items-center gap-2">
          {progress.built && (
            <span className="badge text-xs bg-green-900/40 text-green-300 border border-green-700">Build done</span>
          )}
          <button
            className="btn-ghost text-xs"
            onClick={() => save({ current: progress.built ? (isLast ? 1 : sprint.sprint + 1) : sprint.sprint, built: !progress.built })}
            title={progress.built ? 'Move on to the next sprint' : 'Mark this build as finished'}
          >
            {progress.built ? (isLast ? 'Start over' : 'Next sprint') : 'Mark build done'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-xs">
        <div className="bg-[var(--surface-2)] rounded-lg p-3">
          <div className="font-semibold text-[var(--text-2)] mb-1">Dataset</div>
          <div className="text-[var(--text-3)] mb-2">{sprint.dataset}</div>
          {/^https?:\/\//i.test(sprint.datasetUrl) && (
            <a href={sprint.datasetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--accent)] font-semibold">
              Open <Icon name="external" size={11} />
            </a>
          )}
        </div>
        <div className="bg-[var(--surface-2)] rounded-lg p-3">
          <div className="font-semibold text-[var(--text-2)] mb-1">Backend</div>
          <div className="text-[var(--text-3)]">{sprint.backend}</div>
        </div>
        <div className="bg-[var(--surface-2)] rounded-lg p-3">
          <div className="font-semibold text-[var(--text-2)] mb-1">Frontend</div>
          <div className="text-[var(--text-3)]">{sprint.frontend}</div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap pt-3 border-t border-[var(--card-border)]">
        <div className="max-w-2xl">
          <div className="text-sm font-semibold text-white mb-0.5">{step.label}</div>
          <div className="text-xs text-[var(--text-3)]">{step.detail}</div>
        </div>
        <button className="btn-primary text-sm whitespace-nowrap" onClick={act}>
          <span className="inline-flex items-center gap-1.5"><Icon name={step.icon} size={14} /> {step.cta}</span>
        </button>
      </div>
    </div>
  );
}
