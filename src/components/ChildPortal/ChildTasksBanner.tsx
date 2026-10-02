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
import { getSkinTheme } from '../../utils/skins';

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
  const currentKid = (profile && profile.id ? profile : (kid && kid.id ? kid : null));
  if (!currentKid) return null;

  const skin = getSkinTheme(currentKid.skinId);
  const activeConfig = config || loadParentConfig();
  const allTasks = activeConfig?.tasks || [];
  const allTests = activeConfig?.tests || [];

  // Filter tasks assigned to this kid or 'all'
  const activeTasks = allTasks.filter(
    (t) => t && (t.assignedKidId === 'all' || t.assignedKidId === currentKid.id) && t.status !== 'completed'
  );

  // Filter tests assigned to this kid or 'all'
  const activeTests = allTests.filter(
    (t) => t && (t.assignedKidIds?.includes('all') || t.assignedKidIds?.includes(currentKid.id))
  );

  if (activeTasks.length === 0 && activeTests.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-6 space-y-3">
      {/* Active Tests Section */}
      {activeTests.length > 0 && (
        <div className="space-y-2.5">
          {activeTests.map((test) => (
            <div
              key={test.id}
              className="border rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md transition-all"
              style={{
                background: skin.heroGradient,
                borderColor: skin.heroBorder,
                boxShadow: `0 0 25px ${skin.glowRgba}`,
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 text-base"
                    style={{
                      backgroundColor: skin.badgeBg,
                      borderColor: skin.badgeText,
                      color: skin.badgeText,
                    }}
                  >
                    {test.subject === 'languages' ? '🇬🇧' : test.subject === 'math' ? '🔢' : '🏆'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-white text-sm sm:text-base">
                        {test.title}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: skin.badgeBg,
                          borderColor: skin.badgeText,
                          color: skin.badgeText,
                        }}
                      >
                        {test.questions?.length || 0} Fragen
                      </span>
                      {test.topic && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-500/40 text-indigo-300">
                          {test.topic}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" style={{ color: skin.highlightAccent }} />
                        {test.timeLimitMinutes > 0 ? `${test.timeLimitMinutes} Min.` : 'Kein Zeitlimit'}
                      </span>
                      {test.dueDate && (
                        <span className="flex items-center gap-1 text-amber-300/80">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          Fällig: {test.dueDate}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  id={`btn_start_assigned_test_${test.id}`}
                  type="button"
                  onClick={() => {
                    soundFx.playPop();
                    onStartTest(test);
                  }}
                  style={{
                    background: skin.primaryButtonGradient,
                    color: skin.primaryButtonText,
                    borderColor: skin.primaryButtonBorder,
                    boxShadow: skin.primaryButtonGlow,
                  }}
                  className="py-2.5 px-5 rounded-xl border font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer self-stretch sm:self-auto shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Test jetzt starten!</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Tasks / Homework Section */}
      {activeTasks.length > 0 && (
        <div
          className="border rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md space-y-3 transition-all"
          style={{
            backgroundColor: skin.cardBg,
            borderColor: skin.cardBorder,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" style={{ color: skin.highlightAccent }} />
              <span className="font-extrabold text-white text-xs sm:text-sm">
                Deine aktuellen Aufgaben ({activeTasks.length})
              </span>
            </div>
            <span className="text-[11px] text-slate-300/80">
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
                  style={{
                    backgroundColor: skin.modeCardBg,
                    borderColor: skin.modeCardBorder,
                  }}
                  className="border rounded-xl p-3 flex items-center justify-between gap-3 hover:scale-[1.01] transition-all"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="font-bold text-white text-xs block truncate">{task.title}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-slate-950/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            background: skin.tabActiveGradient,
                            width: `${progressPct}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {task.currentCount}/{task.targetCount}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: skin.badgeBg,
                        borderColor: skin.badgeText,
                        color: skin.badgeText,
                      }}
                    >
                      +{task.rewardXp} XP
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playPop();
                        if (onStartTask) onStartTask(task);
                      }}
                      style={{
                        background: skin.primaryButtonGradient,
                        color: skin.primaryButtonText,
                      }}
                      className="p-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
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
