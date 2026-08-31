import React from 'react';
import {
  ClipboardList,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { ChildTask, ChildTest, KidProfile, ParentConfig } from '../../types';
import { loadParentConfig } from '../../utils/storage';
import { soundFx } from '../../utils/audio';

interface ChildTasksBannerProps {
  profile?: KidProfile;
  kid?: KidProfile;
  config?: ParentConfig;
  onStartTask?: (task: ChildTask) => void;
  onStartTest: (test: ChildTest) => void;
}

export const ChildTasksBanner: React.FC<ChildTasksBannerProps> = ({
  profile,
  kid,
  config,
  onStartTask,
  onStartTest,
}) => {
  const currentKid = profile || kid;
  if (!currentKid) return null;

  const activeConfig = config || loadParentConfig();
  const allTasks = activeConfig?.tasks || [];
  const allTests = activeConfig?.tests || [];

  // Filter tasks assigned to this kid or 'all'
  const activeTasks = allTasks.filter(
    (t) => (t.assignedKidId === 'all' || t.assignedKidId === currentKid.id) && t.status !== 'completed'
  );

  // Filter tests assigned to this kid or 'all'
  const activeTests = allTests.filter(
    (t) => t.assignedKidIds?.includes('all') || t.assignedKidIds?.includes(currentKid.id)
  );

  if (activeTasks.length === 0 && activeTests.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-6 space-y-3">
      {/* Active Tests Section */}
      {activeTests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/70 via-purple-950/70 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <GraduationCap className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-sm sm:text-base">
                    Aktueller Test: {activeTests[0].title}
                  </span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                    {activeTests[0].questions.length} Fragen
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {activeTests[0].timeLimitMinutes > 0 ? `${activeTests[0].timeLimitMinutes} Min.` : 'Kein Zeitlimit'}
                  </span>
                  {activeTests[0].dueDate && (
                    <span className="flex items-center gap-1 text-amber-300/80">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      Fällig: {activeTests[0].dueDate}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              id="btn_start_assigned_test"
              type="button"
              onClick={() => {
                soundFx.playPop();
                onStartTest(activeTests[0]);
              }}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer self-stretch sm:self-auto"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Test jetzt starten!</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Tasks / Homework Section */}
      {activeTasks.length > 0 && (
        <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-cyan-400" />
              <span className="font-extrabold text-white text-xs sm:text-sm">
                Deine aktuellen Aufgaben ({activeTasks.length})
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Klasse {currentKid.schoolClass || `${currentKid.schoolGrade || 2}. Stufe`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activeTasks.slice(0, 4).map((task) => {
              const progressPct = Math.round(
                Math.min(100, (task.currentCount / (task.targetCount || 1)) * 100)
              );

              return (
                <div
                  key={task.id}
                  className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="font-bold text-white text-xs block truncate">{task.title}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {task.currentCount}/{task.targetCount}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                      +{task.rewardXp} XP
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playPop();
                        if (onStartTask) onStartTask(task);
                      }}
                      className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
                      title="Aufgabe starten"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
