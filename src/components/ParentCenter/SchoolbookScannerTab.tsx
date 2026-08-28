import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  User,
  Users,
  Layers,
  GraduationCap,
  HelpCircle,
  Eye,
  RefreshCw,
  FileText,
  ShieldCheck,
  Zap,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CustomQuestion, KidProfile, ParentConfig, ScannedMaterialBatch, SubjectArea, TargetLearnLanguage } from '../../types';
import {
  addScannedBatchWithQuestions,
  deleteScannedBatch,
  loadCustomQuestions,
  loadScannedBatches,
  updateScannedBatchAssignment,
} from '../../utils/storage';
import { soundFx } from '../../utils/audio';
import { useLanguage } from '../../context/LanguageContext';
import { getLanguageDisplayName, getLanguageFlag } from '../../utils/subjectEngines';

interface SchoolbookScannerTabProps {
  config: ParentConfig;
  onConfigChange?: (updatedConfig: ParentConfig) => void;
}

export const SchoolbookScannerTab: React.FC<SchoolbookScannerTabProps> = ({
  config,
}) => {
  const { language } = useLanguage();
  const isDe = language === 'de';

  // Uploaded images in memory (ephemeral, deleted immediately after processing)
  const [selectedImages, setSelectedImages] = useState<Array<{ id: string; dataUrl: string; name: string }>>([]);
  const [bookTitle, setBookTitle] = useState<string>('');
  const [selectedKidId, setSelectedKidId] = useState<string>(config.activeKidId || (config.kids[0]?.id ?? 'all'));
  const [targetSchoolGrade, setTargetSchoolGrade] = useState<number>(() => {
    const activeKid = config.kids.find((k) => k.id === config.activeKidId) || config.kids[0];
    return activeKid?.schoolGrade || (activeKid?.gradeLevel === 'high_school' ? 5 : 3);
  });
  const [targetLanguage, setTargetLanguage] = useState<TargetLearnLanguage>('en');
  const [extraNotes, setExtraNotes] = useState<string>('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastProcessedBatch, setLastProcessedBatch] = useState<ScannedMaterialBatch | null>(null);

  // Batches history
  const [batches, setBatches] = useState<ScannedMaterialBatch[]>(() => loadScannedBatches());
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync school grade when selected kid changes
  const handleKidSelect = (kidId: string) => {
    setSelectedKidId(kidId);
    if (kidId !== 'all') {
      const kid = config.kids.find((k) => k.id === kidId);
      if (kid) {
        setTargetSchoolGrade(kid.schoolGrade || (kid.gradeLevel === 'high_school' ? 5 : 3));
        if (kid.targetLanguage) setTargetLanguage(kid.targetLanguage);
      }
    }
  };

  // Convert File to Base64 dataUrl
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setErrorMessage(isDe ? 'Bitte nur Bilddateien (JPG, PNG, WebP) hochladen.' : 'Please upload image files only.');
        return;
      }

      // Check max size (15MB per image)
      if (file.size > 15 * 1024 * 1024) {
        setErrorMessage(isDe ? 'Bild ist zu groß (max. 15MB).' : 'Image is too large (max 15MB).');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setSelectedImages((prev) => [
            ...prev,
            {
              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              dataUrl: result,
              name: file.name,
            },
          ]);
          soundFx.playPop();
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== id));
    soundFx.playPop();
  };

  // Process Images with AI Vision Endpoint
  const handleProcessScan = async () => {
    if (selectedImages.length === 0) {
      setErrorMessage(isDe ? 'Bitte mindestens ein Bild aufnehmen oder auswählen.' : 'Please take or select at least one photo.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage(isDe ? 'KI analysiert Schulbuchseite & extrahiert Aufgaben...' : 'AI is analyzing textbook page & extracting questions...');

    try {
      const response = await fetch('/api/gemini/scan-schoolbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: selectedImages.map((img) => img.dataUrl),
          bookTitle: bookTitle.trim(),
          targetSchoolGrade,
          assignedKidId: selectedKidId,
          targetLanguage,
          notes: extraNotes.trim(),
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Server responded with an error during OCR processing');
      }

      const data = await response.json();
      const extractedQuestions: CustomQuestion[] = data.questions || [];

      if (extractedQuestions.length === 0) {
        throw new Error('No questions could be extracted.');
      }

      const newBatch: ScannedMaterialBatch = {
        id: data.batchId || `scan-${Date.now()}`,
        title: data.batchTitle || bookTitle || (isDe ? `Schulbuch-Scan (${new Date().toLocaleDateString('de-DE')})` : `Book Scan (${new Date().toLocaleDateString()})`),
        createdAt: new Date().toISOString(),
        assignedKidId: selectedKidId,
        subject: (data.detectedSubject as SubjectArea) || 'math',
        topic: data.detectedTopic || 'general_scan',
        gradeLevel: (data.schoolGrade || targetSchoolGrade) > 4 ? 'high_school' : 'primary',
        schoolGrade: data.schoolGrade || targetSchoolGrade,
        difficulty: targetSchoolGrade <= 2 ? 1 : targetSchoolGrade === 3 ? 2 : targetSchoolGrade <= 5 ? 3 : targetSchoolGrade <= 7 ? 4 : 5,
        questionCount: extractedQuestions.length,
        extractedSummary: data.extractedSummary,
        sourceBookOrChapter: bookTitle || undefined,
      };

      // Save batch & append custom questions
      const { batches: updatedBatches } = addScannedBatchWithQuestions(newBatch, extractedQuestions);
      setBatches(updatedBatches);
      setLastProcessedBatch(newBatch);
      setExpandedBatchId(newBatch.id);

      // MANDATORY PRIVACY: Immediately delete image buffers from client memory
      setSelectedImages([]);
      setBookTitle('');
      setExtraNotes('');

      setStatusMessage(
        isDe
          ? `✅ ${extractedQuestions.length} Aufgaben erfolgreich generiert & kategorisiert! Die Fotos wurden aus Datenschutzgründen gelöscht.`
          : `✅ ${extractedQuestions.length} questions successfully generated & assigned! Photos were securely deleted.`
      );
      soundFx.playPowerUp();
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(
        isDe
          ? 'Fehler beim Analysieren des Fotos. Bitte stelle sicher, dass der Text gut lesbar ist.'
          : 'Error analyzing the image. Please make sure the text is clearly legible.'
      );
      soundFx.playWrong();
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-assign batch to another child
  const handleReassignBatch = (batchId: string, newKidId: string) => {
    const { batches: updated } = updateScannedBatchAssignment(batchId, newKidId);
    setBatches(updated);
    soundFx.playPop();
  };

  // Delete a scanned batch
  const handleDeleteBatch = (batchId: string) => {
    if (
      window.confirm(
        isDe
          ? 'Möchtest du diesen Schulbuch-Scan und alle dazugehörigen Aufgaben wirklich löschen?'
          : 'Do you really want to delete this scan and all its generated questions?'
      )
    ) {
      const { batches: updated } = deleteScannedBatch(batchId);
      setBatches(updated);
      if (lastProcessedBatch?.id === batchId) setLastProcessedBatch(null);
      soundFx.playPop();
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-white tracking-wide">
              {isDe ? 'Schulbuch- & Aufgabenheft-Scanner (KI-Vision)' : 'Schoolbook & Homework Scanner (AI Vision)'}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
              {isDe ? '🔒 Auto-Löschung nach Scan' : '🔒 Auto-Delete on Process'}
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            {isDe
              ? 'Fotografiere Buchseiten, Tests oder Hausaufgabenhefte mit dem Handy ab oder lade Scans hoch. Die KI erstellt automatisch interaktive Übungen und ordnet sie dem gewählten Kind & Schulstufe zu. Nach dem Prozessieren werden die Fotos sofort gelöscht.'
              : 'Take photos of textbooks, tests, or homework sheets. AI extracts exercises, categorizes them automatically, and assigns them to your child. Images are securely deleted after processing.'}
          </p>
        </div>
      </div>

      {/* Main Scanner Card */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Image Capture & Upload Area (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>{isDe ? '1. Foto aufnehmen / hochladen' : '1. Capture / Upload Photo'}</span>
              <span className="text-[11px] font-normal text-slate-400">
                {selectedImages.length} {isDe ? 'Bilder gewählt' : 'selected'}
              </span>
            </label>

            {/* Upload / Camera Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {/* Mobile Camera Trigger */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-4 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 border border-indigo-400/30 transition-transform active:scale-95"
              >
                <Camera className="w-6 h-6 text-indigo-200" />
                <span>{isDe ? 'Kamera öffnen (Handy)' : 'Open Camera (Mobile)'}</span>
              </button>

              {/* Desktop / Gallery File Upload Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex flex-col items-center justify-center gap-2 border border-slate-700 transition-colors active:scale-95"
              >
                <Upload className="w-6 h-6 text-slate-400" />
                <span>{isDe ? 'Dateien wählen / Scan' : 'Choose Files / Scan'}</span>
              </button>

              {/* Hidden Inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFiles(e.dataTransfer.files);
              }}
              className="p-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 bg-slate-950/40 text-center space-y-2 cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="w-6 h-6 mx-auto text-slate-500" />
              <p className="text-xs text-slate-400">
                {isDe ? 'Oder Fotos hierher ziehen (z.B. Arbeitsblätter, Schulbuchseiten)' : 'Or drag & drop worksheet or textbook photos here'}
              </p>
              <p className="text-[10px] text-slate-500">JPG, PNG, WebP (max. 15MB)</p>
            </div>

            {/* Selected Images Preview Thumbnails */}
            {selectedImages.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{isDe ? 'Vorschau der Seiten:' : 'Page previews:'}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {isDe ? '🔒 Nach Verarbeitung sofort gelöscht' : '🔒 Deleted right after processing'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {selectedImages.map((img, idx) => (
                    <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-[3/4]">
                      <img src={img.dataUrl} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-500 shadow-md"
                          title={isDe ? 'Entfernen' : 'Remove'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                        S. {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Target Assignment & Metadata (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <label className="text-xs font-black uppercase tracking-wider text-slate-300">
              {isDe ? '2. Kind & Schulstufe zuweisen' : '2. Assign to Child & Grade'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Child Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isDe ? 'Content zuweisen an Kind' : 'Assign to Child'}</span>
                </label>
                <select
                  value={selectedKidId}
                  onChange={(e) => handleKidSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">{isDe ? '👥 Alle Kinder (Gemeinsamer Pool)' : '👥 All Children (Shared Pool)'}</option>
                  {config.kids.map((kid) => (
                    <option key={kid.id} value={kid.id}>
                      {kid.avatar} {kid.name} ({kid.schoolGrade || (kid.gradeLevel === 'high_school' ? 5 : 2)}. Schulstufe)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  {isDe
                    ? 'Nur das zugewiesene Kind bekommt diese Aufgaben in den Quests.'
                    : 'Only the assigned child will receive these problems in quests.'}
                </p>
              </div>

              {/* School Grade Setting */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isDe ? 'Schulstufe / Jahrgang' : 'School Grade'}</span>
                </label>
                <select
                  value={targetSchoolGrade}
                  onChange={(e) => setTargetSchoolGrade(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                >
                  <optgroup label={isDe ? '🎒 Grundstufe (1.-4. Schulstufe)' : '🎒 Primary (Grades 1-4)'}>
                    <option value={1}>1. Schulstufe (Volksschule / Grundschule)</option>
                    <option value={2}>2. Schulstufe</option>
                    <option value={3}>3. Schulstufe</option>
                    <option value={4}>4. Schulstufe</option>
                  </optgroup>
                  <optgroup label={isDe ? '🎓 Mittelschule (5.-8. Schulstufe)' : '🎓 Middle School (Grades 5-8)'}>
                    <option value={5}>5. Schulstufe (1. Klasse Mittelschule / Gymnasium)</option>
                    <option value={6}>6. Schulstufe (2. Klasse Mittelschule)</option>
                    <option value={7}>7. Schulstufe (3. Klasse Mittelschule)</option>
                    <option value={8}>8. Schulstufe (4. Klasse Mittelschule)</option>
                  </optgroup>
                </select>
                <p className="text-[10px] text-slate-400">
                  {isDe ? 'Vom Elternteil fest vorgegeben (für das Kind nicht verstellbar).' : 'Set by parents, child cannot override.'}
                </p>
              </div>
            </div>

            {/* Book / Sheet Title (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isDe ? 'Titel / Heftbezeichnung (optional)' : 'Title / Workbook Name (optional)'}</span>
              </label>
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder={
                  isDe
                    ? 'z.B. Mathematik 3 - Kapitel Brüche S. 42 oder Englisch Grammatikheft Unit 5'
                    : 'e.g. Math 3 - Fractions p. 42 or English Grammar Workbook'
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500"
              />
            </div>

            {/* Extra Notes & Target Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {isDe ? 'Zielsprache (bei Sprachheften)' : 'Target Language'}
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value as TargetLearnLanguage)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                >
                  <option value="en">🇬🇧 {getLanguageDisplayName('en', language)}</option>
                  <option value="fr">🇫🇷 {getLanguageDisplayName('fr', language)}</option>
                  <option value="es">🇪🇸 {getLanguageDisplayName('es', language)}</option>
                  <option value="it">🇮🇹 {getLanguageDisplayName('it', language)}</option>
                  <option value="de">🇩🇪 {getLanguageDisplayName('de', language)}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {isDe ? 'Besondere Hinweise für KI (optional)' : 'Extra AI Instructions'}
                </label>
                <input
                  type="text"
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  placeholder={isDe ? 'z.B. Nur Aufgaben 1-4 oder Fokus auf Grammatik' : 'e.g. Focus on exercises 1-4'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Feedback Messages */}
            {statusMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Trigger Button */}
            <button
              type="button"
              onClick={handleProcessScan}
              disabled={isProcessing || selectedImages.length === 0}
              className={`w-full py-3.5 px-5 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg ${
                isProcessing || selectedImages.length === 0
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-emerald-950/50 border border-emerald-400/40 active:scale-[0.99]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>{isDe ? 'KI analysiert Buchseite & generiert Aufgaben...' : 'AI Processing Textbook Pages...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {isDe
                      ? `Buchseiten scannen & Aufgaben generieren (${selectedImages.length} ${selectedImages.length === 1 ? 'Seite' : 'Seiten'})`
                      : `Scan & Generate Interactive Tasks (${selectedImages.length} pages)`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scanned Material Batches List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-black text-white">
              {isDe ? 'Gescannte Schulbuch-Einheiten & Zuweisungen' : 'Scanned Material Batches & Assignments'}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
              {batches.length} {isDe ? 'Einheiten' : 'Batches'}
            </span>
          </div>
        </div>

        {batches.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold">{isDe ? 'Noch keine Schulbuch-Scans vorhanden.' : 'No scanned textbooks yet.'}</p>
            <p className="text-xs text-slate-500">
              {isDe
                ? 'Nimm oben ein Foto eines Schulbuchs auf, um automatisch personalisierte Übungsaufgaben für deine Kinder zu erstellen.'
                : 'Take a photo of a textbook above to automatically generate personalized exercises for your children.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => {
              const assignedKid = config.kids.find((k) => k.id === batch.assignedKidId);
              const isExpanded = expandedBatchId === batch.id;
              const allCustom = loadCustomQuestions();
              const batchQuestions = allCustom.filter((q) => q.scanBatchId === batch.id);

              return (
                <div
                  key={batch.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden hover:border-slate-700 transition-all"
                >
                  {/* Batch Header */}
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-500/50 text-indigo-300 uppercase">
                          📖 {batch.subject}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/40 text-amber-300">
                          🎓 {batch.schoolGrade}. Schulstufe
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {batchQuestions.length || batch.questionCount} {isDe ? 'Aufgaben' : 'Questions'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(batch.createdAt).toLocaleDateString(isDe ? 'de-DE' : 'en-US', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white tracking-wide">{batch.title}</h4>
                      {batch.extractedSummary && (
                        <p className="text-xs text-slate-400 italic">„{batch.extractedSummary}“</p>
                      )}
                    </div>

                    {/* Right: Child Assignment Dropdown & Controls */}
                    <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                      <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700 rounded-xl px-2.5 py-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[11px] text-slate-400">{isDe ? 'Zugewiesen an:' : 'Assigned to:'}</span>
                        <select
                          value={batch.assignedKidId || 'all'}
                          onChange={(e) => handleReassignBatch(batch.id, e.target.value)}
                          className="bg-transparent text-xs font-bold text-indigo-300 focus:outline-none cursor-pointer"
                        >
                          <option value="all" className="bg-slate-900 text-white">
                            👥 {isDe ? 'Alle Kinder' : 'All Children'}
                          </option>
                          {config.kids.map((k) => (
                            <option key={k.id} value={k.id} className="bg-slate-900 text-white">
                              {k.avatar} {k.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Expand / Preview toggle */}
                      <button
                        type="button"
                        onClick={() => setExpandedBatchId(isExpanded ? null : batch.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                        title={isExpanded ? (isDe ? 'Einklappen' : 'Collapse') : (isDe ? 'Aufgaben anzeigen' : 'Show questions')}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {/* Delete batch button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/50 transition-colors cursor-pointer"
                        title={isDe ? 'Scan & Aufgaben löschen' : 'Delete scan and questions'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Questions View */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-950/60 border-t border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>{isDe ? 'Aus dem Schulbuch generierte Aufgaben:' : 'Generated exercises:'}</span>
                        <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {isDe ? 'Aktiv in Quests & Tests' : 'Active in Quests & Tests'}
                        </span>
                      </div>

                      {batchQuestions.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">{isDe ? 'Keine aktiven Aufgaben für diesen Scan gefunden.' : 'No active exercises found for this scan.'}</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {batchQuestions.map((q, qIdx) => (
                            <div
                              key={q.id || qIdx}
                              className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-mono font-bold text-indigo-400">#{qIdx + 1}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {q.subtext || q.topic}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-white">{q.question}</p>
                              <div className="grid grid-cols-2 gap-1.5 pt-1">
                                {q.options?.map((opt, optIdx) => {
                                  const isCorrect = opt === q.correctAnswer;
                                  return (
                                    <div
                                      key={optIdx}
                                      className={`px-2 py-1 rounded text-[11px] font-mono flex items-center justify-between border ${
                                        isCorrect
                                          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200 font-bold'
                                          : 'bg-slate-950 border-slate-800 text-slate-400'
                                      }`}
                                    >
                                      <span className="truncate">{opt}</span>
                                      {isCorrect && <Check className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />}
                                    </div>
                                  );
                                })}
                              </div>
                              {q.explanation && (
                                <p className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 italic">
                                  💡 {q.explanation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
