import React, { useState } from 'react';
import {
  GraduationCap,
  ClipboardList,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Calendar,
  Award,
  BookOpen,
  Sparkles,
  User,
  AlertCircle,
  FileCheck,
  ChevronRight,
  TrendingUp,
  Percent,
} from 'lucide-react';
import {
  ChildTask,
  ChildTest,
  KidProfile,
  ParentConfig,
  ProblemItem,
  SubjectArea,
  TestSubmission,
} from '../../types';
import {
  saveChildTask,
  deleteChildTask,
  saveChildTest,
  deleteChildTest,
  recordTestSubmission,
} from '../../utils/storage';
import { soundFx } from '../../utils/audio';

interface TasksAndTestsTabProps {
  config: ParentConfig;
  onUpdateConfig: (config: ParentConfig) => void;
}

export const TasksAndTestsTab: React.FC<TasksAndTestsTabProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [subTab, setSubTab] = useState<'tasks' | 'tests' | 'submissions'>('tasks');

  // --- Task Form State ---
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskSubject, setTaskSubject] = useState<SubjectArea>('math');
  const [taskTargetCount, setTaskTargetCount] = useState<number>(10);
  const [taskAssignedKid, setTaskAssignedKid] = useState<string>('all');
  const [taskDueDate, setTaskDueDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [taskRewardXp, setTaskRewardXp] = useState<number>(50);
  const [taskRewardCoins, setTaskRewardCoins] = useState<number>(25);

  // --- Test Form State ---
  const [showAddTest, setShowAddTest] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testDesc, setTestDesc] = useState('');
  const [testSubject, setTestSubject] = useState<SubjectArea>('math');
  const [testSchoolGrade, setTestSchoolGrade] = useState<number>(3);
  const [testTimeLimit, setTestTimeLimit] = useState<number>(15);
  const [testDueDate, setTestDueDate] = useState<string>(
    new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0]
  );
  const [testAssignedKid, setTestAssignedKid] = useState<string>('all');
  const [testQuestions, setTestQuestions] = useState<ProblemItem[]>([
    {
      id: 'q_custom_1',
      subject: 'math',
      topic: 'addition_subtraction',
      gradeLevel: 'primary',
      schoolGrade: 3,
      difficulty: 2,
      question: '64 + 29 = ?',
      options: [83, 93, 91, 95],
      correctAnswer: 93,
      explanation: '64 + 29 = 93',
      xp: 25,
      coins: 10,
    },
    {
      id: 'q_custom_2',
      subject: 'math',
      topic: 'multiplication_division',
      gradeLevel: 'primary',
      schoolGrade: 3,
      difficulty: 3,
      question: '8 × 7 = ?',
      options: [48, 54, 56, 64],
      correctAnswer: 56,
      explanation: '8 mal 7 ist gleich 56',
      xp: 30,
      coins: 15,
    },
  ]);

  // Question editing for test
  const [tempQText, setTempQText] = useState('');
  const [tempQOpt1, setTempQOpt1] = useState('');
  const [tempQOpt2, setTempQOpt2] = useState('');
  const [tempQOpt3, setTempQOpt3] = useState('');
  const [tempQOpt4, setTempQOpt4] = useState('');
  const [tempQCorrectIdx, setTempQCorrectIdx] = useState(0);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    soundFx.playPop();
    const newTask: ChildTask = {
      id: `task_${Date.now()}`,
      title: taskTitle.trim(),
      description: taskDesc.trim() || undefined,
      subject: taskSubject,
      targetCount: Number(taskTargetCount) || 10,
      currentCount: 0,
      assignedKidId: taskAssignedKid,
      dueDate: taskDueDate,
      status: 'assigned',
      rewardXp: Number(taskRewardXp) || 50,
      rewardCoins: Number(taskRewardCoins) || 25,
      createdAt: new Date().toISOString(),
    };

    const updated = saveChildTask(newTask);
    onUpdateConfig(updated);
    soundFx.playCorrect();

    // Reset Form
    setTaskTitle('');
    setTaskDesc('');
    setShowAddTask(false);
  };

  const handleDeleteTask = (taskId: string) => {
    soundFx.playPop();
    const updated = deleteChildTask(taskId);
    onUpdateConfig(updated);
  };

  const handleAddQuestionToTest = () => {
    if (!tempQText.trim() || !tempQOpt1.trim() || !tempQOpt2.trim()) return;

    const opts = [tempQOpt1.trim(), tempQOpt2.trim()];
    if (tempQOpt3.trim()) opts.push(tempQOpt3.trim());
    if (tempQOpt4.trim()) opts.push(tempQOpt4.trim());

    const correctAns = opts[tempQCorrectIdx] || opts[0];

    const newQ: ProblemItem = {
      id: `q_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subject: testSubject,
      topic: 'general_curriculum',
      gradeLevel: testSchoolGrade > 4 ? 'high_school' : 'primary',
      schoolGrade: testSchoolGrade,
      difficulty: testSchoolGrade <= 2 ? 1 : testSchoolGrade <= 4 ? 2 : 3,
      question: tempQText.trim(),
      options: opts,
      correctAnswer: correctAns,
      hint: 'Lies die Aufgabe aufmerksam durch und wähle die passendste Antwort.',
      explanation: `Richtig: ${correctAns}`,
      xp: 25,
      coins: 10,
    };

    setTestQuestions([...testQuestions, newQ]);
    setTempQText('');
    setTempQOpt1('');
    setTempQOpt2('');
    setTempQOpt3('');
    setTempQOpt4('');
    soundFx.playPop();
  };

  const handleRemoveQuestionFromTest = (qId: string) => {
    setTestQuestions(testQuestions.filter((q) => q.id !== qId));
    soundFx.playPop();
  };

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || testQuestions.length === 0) {
      soundFx.playWrong();
      return;
    }

    soundFx.playPop();
    const newTest: ChildTest = {
      id: `test_${Date.now()}`,
      title: testTitle.trim(),
      description: testDesc.trim() || undefined,
      subject: testSubject,
      schoolGrade: Number(testSchoolGrade) || 3,
      assignedKidIds: testAssignedKid === 'all' ? ['all'] : [testAssignedKid],
      timeLimitMinutes: Number(testTimeLimit) || 15,
      dueDate: testDueDate,
      questions: testQuestions,
      createdAt: new Date().toISOString(),
      createdBy: 'Eltern / Lehrkraft',
    };

    const updated = saveChildTest(newTest);
    onUpdateConfig(updated);
    soundFx.playCorrect();

    // Reset Form
    setTestTitle('');
    setTestDesc('');
    setShowAddTest(false);
  };

  const handleDeleteTest = (testId: string) => {
    soundFx.playPop();
    const updated = deleteChildTest(testId);
    onUpdateConfig(updated);
  };

  const tasksList = config?.tasks || [];
  const testsList = config?.tests || [];
  const submissionsList = config?.testSubmissions || [];

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => {
            soundFx.playPop();
            setSubTab('tasks');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            subTab === 'tasks'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
          <span>Hausaufgaben & Aufgaben ({tasksList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFx.playPop();
            setSubTab('tests');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            subTab === 'tests'
              ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
          <span>Tests & Schularbeiten ({testsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFx.playPop();
            setSubTab('submissions');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            subTab === 'submissions'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 text-emerald-300" />
          <span>Ergebnisse & Noten ({submissionsList.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. TASKS TAB */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white text-sm">Aufgaben für Kinder</h4>
              <p className="text-xs text-slate-400">
                Stelle gezielte Aufgaben mit Belohnungen (XP & Münzen) ein.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFx.playPop();
                setShowAddTask(!showAddTask);
              }}
              className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddTask ? 'Abbrechen' : 'Neue Aufgabe erstellen'}</span>
            </button>
          </div>

          {/* Add Task Form */}
          {showAddTask && (
            <form onSubmit={handleCreateTask} className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn">
              <h5 className="font-bold text-white text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Aufgabendetails definieren</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Titel der Aufgabe *</label>
                  <input
                    type="text"
                    required
                    placeholder="z. B. 10x Malreihen üben für die Schularbeit"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Fachgebiet</label>
                  <select
                    value={taskSubject}
                    onChange={(e) => setTaskSubject(e.target.value as SubjectArea)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="math">Mathematik & Logik</option>
                    <option value="nature">Natur & Wissenschaft</option>
                    <option value="geography">Geographie & Länder</option>
                    <option value="art">Kunst & Kultur</option>
                    <option value="languages">Sprachen & Vokabeln</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Ziel-Aufgabenanzahl</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={taskTargetCount}
                    onChange={(e) => setTaskTargetCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Zuweisen an Kind</label>
                  <select
                    value={taskAssignedKid}
                    onChange={(e) => setTaskAssignedKid(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">Alle Kinder ({config.kids.length})</option>
                    {config.kids.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.avatar} {k.name} ({k.schoolClass || `${k.schoolGrade || 2}. Schulstufe`})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Fälligkeitsdatum</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Belohnung: XP</label>
                  <input
                    type="number"
                    min={10}
                    step={10}
                    value={taskRewardXp}
                    onChange={(e) => setTaskRewardXp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Belohnung: Münzen</label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={taskRewardCoins}
                    onChange={(e) => setTaskRewardCoins(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md"
                >
                  Aufgabe speichern
                </button>
              </div>
            </form>
          )}

          {/* Tasks List */}
          {tasksList.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center text-xs text-slate-500">
              Noch keine Aufgaben angelegt. Klicke oben auf "Neue Aufgabe erstellen".
            </div>
          ) : (
            <div className="space-y-2.5">
              {tasksList.map((task) => {
                const assignedKidObj = config.kids.find((k) => k.id === task.assignedKidId);
                const isCompleted = task.status === 'completed' || task.currentCount >= task.targetCount;
                const progressPct = Math.round(
                  Math.min(100, (task.currentCount / (task.targetCount || 1)) * 100)
                );

                return (
                  <div
                    key={task.id}
                    className={`bg-slate-950/70 border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                      isCompleted ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-xs sm:text-sm">{task.title}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {isCompleted ? 'Erledigt' : 'Aktiv'}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                          {assignedKidObj ? `${assignedKidObj.avatar} ${assignedKidObj.name}` : 'Alle Kinder'}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-400">{task.description}</p>
                      )}

                      {/* Progress Bar */}
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex-1 max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-cyan-400 to-indigo-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-300">
                          {task.currentCount} / {task.targetCount} ({progressPct}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right text-xs">
                        <div className="text-amber-400 font-bold">+{task.rewardXp} XP</div>
                        <div className="text-amber-300 text-[10px]">+{task.rewardCoins} Münzen</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                        title="Aufgabe löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TESTS & EXAMS TAB */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white text-sm">Schularbeiten & Lernziel-Kontrollen</h4>
              <p className="text-xs text-slate-400">
                Erstelle strukturierte Tests mit Zeitlimit und automatischer Auswertung.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFx.playPop();
                setShowAddTest(!showAddTest);
              }}
              className="py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddTest ? 'Abbrechen' : 'Neuen Test anlegen'}</span>
            </button>
          </div>

          {/* Add Test Form */}
          {showAddTest && (
            <form onSubmit={handleCreateTest} className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn">
              <h5 className="font-bold text-white text-xs flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>Test-Parameter konfigurieren</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Titel der Schularbeit / Test *</label>
                  <input
                    type="text"
                    required
                    placeholder="z. B. 1. Mathematik-Schularbeit: Klasse 3"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Schulstufe (1 - 8)</label>
                  <select
                    value={testSchoolGrade}
                    onChange={(e) => setTestSchoolGrade(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                      <option key={g} value={g}>
                        {g}. Schulstufe / Klasse
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Fachgebiet</label>
                  <select
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value as SubjectArea)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="math">Mathematik</option>
                    <option value="nature">Naturkunde / Biologie</option>
                    <option value="geography">Geographie</option>
                    <option value="art">Kunst / Kultur</option>
                    <option value="languages">Englisch / Sprachen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Zeitlimit (Minuten)</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={testTimeLimit}
                    onChange={(e) => setTestTimeLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Kind zuweisen</label>
                  <select
                    value={testAssignedKid}
                    onChange={(e) => setTestAssignedKid(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">Alle Kinder</option>
                    {config.kids.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.avatar} {k.name} ({k.schoolClass || `${k.schoolGrade || 2}. Schulstufe`})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Questions in Test */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-300">
                    Testfragen ({testQuestions.length} Fragen im Test)
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {testQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="text-amber-400 font-bold mr-2">Frage {idx + 1}:</span>
                        <span className="text-white font-medium">{q.question}</span>
                        <span className="text-slate-400 ml-2 text-[10px]">
                          (Antwort: <strong className="text-emerald-400">{String(q.correctAnswer)}</strong>)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestionFromTest(q.id)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Quick Question to Test */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400">Frage hinzufügen:</span>
                  <input
                    type="text"
                    placeholder="Frage / Rechenaufgabe..."
                    value={tempQText}
                    onChange={(e) => setTempQText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Option 1 (Richtig)"
                      value={tempQOpt1}
                      onChange={(e) => setTempQOpt1(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Option 2"
                      value={tempQOpt2}
                      onChange={(e) => setTempQOpt2(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Option 3 (optional)"
                      value={tempQOpt3}
                      onChange={(e) => setTempQOpt3(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Option 4 (optional)"
                      value={tempQOpt4}
                      onChange={(e) => setTempQOpt4(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddQuestionToTest}
                    className="py-1.5 px-3 rounded-lg bg-indigo-600/40 hover:bg-indigo-600/70 border border-indigo-500/40 text-indigo-200 text-xs font-semibold"
                  >
                    + Frage zum Test hinzufügen
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTest(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold text-xs shadow-md"
                >
                  Test freigeben & speichern
                </button>
              </div>
            </form>
          )}

          {/* Tests List */}
          {testsList.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center text-xs text-slate-500">
              Noch keine Tests angelegt. Klicke oben auf "Neuen Test anlegen".
            </div>
          ) : (
            <div className="space-y-2.5">
              {testsList.map((test) => (
                <div
                  key={test.id}
                  className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{test.title}</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                        {test.schoolGrade}. Schulstufe
                      </span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                        {test.questions.length} Fragen
                      </span>
                    </div>

                    {test.description && (
                      <p className="text-xs text-slate-400">{test.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        {test.timeLimitMinutes > 0 ? `${test.timeLimitMinutes} Min.` : 'Kein Zeitlimit'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        Fällig: {test.dueDate || 'Keine Frist'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteTest(test.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                      title="Test löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. TEST SUBMISSIONS & SCORECARDS */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'submissions' && (
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-white text-sm">Abgaben & Schularbeits-Ergebnisse</h4>
            <p className="text-xs text-slate-400">
              Detaillierte Einsicht in die Test-Ergebnisse deiner Kinder.
            </p>
          </div>

          {submissionsList.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center text-xs text-slate-500">
              Noch keine Test-Abgaben vorhanden. Sobald ein Kind einen Test im Kinder-Portal abschließt,
              erscheint hier die detaillierte Auswertung.
            </div>
          ) : (
            <div className="space-y-3">
              {submissionsList.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{sub.testTitle}</span>
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full">
                          {sub.kidName}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Abgegeben am {new Date(sub.completedAt).toLocaleString('de-DE')} • Bearbeitungszeit:{' '}
                        {Math.round(sub.timeSpentSeconds / 60)} Min.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`text-sm font-extrabold px-3 py-1 rounded-xl border ${
                          sub.accuracy >= 80
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : sub.accuracy >= 50
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {sub.accuracy}% ({sub.correctCount} / {sub.totalQuestions} richtig)
                      </div>
                    </div>
                  </div>

                  {/* Question details dropdown/list */}
                  <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400">Antworten-Übersicht:</span>
                    <div className="space-y-1.5">
                      {sub.answers.map((ans, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/60"
                        >
                          <span className="text-slate-300 font-medium truncate max-w-sm">
                            {idx + 1}. {ans.question}
                          </span>
                          <span
                            className={`font-bold font-mono text-[11px] ${
                              ans.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {ans.isCorrect ? '✓ Richtig' : `✗ Falsch (${ans.selectedAnswer})`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
