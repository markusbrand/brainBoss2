import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  User,
  Users,
  Layers,
  GraduationCap,
  HelpCircle,
  Eye,
  EyeOff,
  RefreshCw,
  FileText,
  ShieldCheck,
  Zap,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Volume2,
  FileCheck,
  Award,
  Key,
  Cpu,
  Globe,
  Settings2,
  ExternalLink,
  Languages,
  BookMarked,
  Target,
  Puzzle,
  MoveHorizontal,
  PenTool,
  MessageSquare,
  Search,
} from 'lucide-react';
import { ChildTask, ChildTest, CustomQuestion, KidProfile, ParentConfig, ScannedMaterialBatch, SubjectArea, TargetLearnLanguage } from '../../types';
import {
  addScannedBatchWithQuestions,
  deleteScannedBatch,
  loadCustomQuestions,
  loadScannedBatches,
  updateScannedBatchAssignment,
  saveChildTest,
  saveChildTask,
  saveParentConfig,
  loadParentConfig,
} from '../../utils/storage';
import { soundFx } from '../../utils/audio';
import { useLanguage } from '../../context/LanguageContext';
import { getLanguageDisplayName, getLanguageFlag, speakWord } from '../../utils/subjectEngines';

interface SchoolbookScannerTabProps {
  config: ParentConfig;
  onConfigChange?: (updatedConfig: ParentConfig) => void;
}

interface CuratedModelOption {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  descriptionDe: string;
  descriptionEn: string;
  recommended?: boolean;
}

const CURATED_OPENROUTER_MODELS: CuratedModelOption[] = [
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    badge: '⭐ Standard (Schnell & Günstig)',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    descriptionDe: 'Hervorragende Multimodal-Vision, extrem schnell bei Vokabeln & Tabellen, sehr niedrige Tokenkosten.',
    descriptionEn: 'High-speed multimodal OCR, great for school vocabularies at minimal cost.',
    recommended: true,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    badge: '👑 Beste Qualität & Layout',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    descriptionDe: 'Goldstandard für komplexe Schulbuch-Layouts, handschriftliche Notizen und feine deutsch-englische Vokabelnuancen.',
    descriptionEn: 'Gold standard for dense layouts, handwriting, and English/German bilingual nuances.',
    recommended: true,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    badge: '🌟 Spitzenklasse Mehrsprachig',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    descriptionDe: 'Starke Texterkennung und präzise Lückentext- und Grammatik-Generierung.',
    descriptionEn: 'Top-tier multimodal accuracy for exercises, sentence completion, and grammar.',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    badge: '💡 Alltags-Scanner',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    descriptionDe: 'Ausgezeichnetes Preis-Leistungs-Verhältnis für alltägliche Arbeitsblätter.',
    descriptionEn: 'Budget-friendly vision scanner for everyday school assignments.',
  },
  {
    id: 'qwen/qwen-2.5-vl-72b-instruct',
    name: 'Qwen 2.5 VL 72B',
    badge: '🔬 Benchmark-Leader',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    descriptionDe: 'Führendes Open-Weights-Visionmodell für Buchseiten, Diagramme und Tabellen.',
    descriptionEn: 'High-performance vision model excelling at complex document layouts.',
  },
  {
    id: 'meta-llama/llama-3.2-90b-vision-instruct',
    name: 'Llama 3.2 90B Vision',
    badge: '🦙 Open Weights Power',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    descriptionDe: 'Metas stärkstes offenes Multimodal-Modell via OpenRouter.',
    descriptionEn: 'Meta open weights multimodal flagship.',
  },
  {
    id: 'custom',
    name: 'Eigenes Modell (Custom Slug)',
    badge: '⚙️ Beliebiges Modell',
    badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
    descriptionDe: 'Gib einen beliebigen OpenRouter-Modellbezeichner ein (z.B. mistralai/pixtral-large-2411).',
    descriptionEn: 'Enter any custom OpenRouter model slug.',
  },
];

export const SchoolbookScannerTab: React.FC<SchoolbookScannerTabProps> = ({
  config,
  onConfigChange,
}) => {
  const { language } = useLanguage();
  const isDe = language === 'de';

  // OpenRouter & AI Provider state
  const [aiProvider, setAiProvider] = useState<'openrouter' | 'gemini'>(
    config.openRouter?.provider || 'openrouter'
  );
  const [openRouterModel, setOpenRouterModel] = useState<string>(
    config.openRouter?.selectedModel || 'google/gemini-2.0-flash-001'
  );
  const [openRouterApiKey, setOpenRouterApiKey] = useState<string>(
    config.openRouter?.apiKey || ''
  );
  const [customModelInput, setCustomModelInput] = useState<string>(
    config.openRouter?.customModelName || ''
  );
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState<boolean>(false);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Uploaded images in memory (ephemeral, deleted immediately after processing)
  const [selectedImages, setSelectedImages] = useState<Array<{ id: string; dataUrl: string; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<SubjectArea>('languages');
  const [autoCreateTest, setAutoCreateTest] = useState<boolean>(true);
  const [autoCreateTask, setAutoCreateTask] = useState<boolean>(true);
  const [bookTitle, setBookTitle] = useState<string>('');
  const [focusTopic, setFocusTopic] = useState<string>('English Book Unit 1');
  const [selectedKidId, setSelectedKidId] = useState<string>(config?.activeKidId || (config?.kids?.[0]?.id ?? 'all'));
  const [targetSchoolGrade, setTargetSchoolGrade] = useState<number>(() => {
    const activeKid = (config?.kids || []).find((k) => k && k.id === config?.activeKidId) || config?.kids?.[0];
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
  const [batchToDelete, setBatchToDelete] = useState<ScannedMaterialBatch | null>(null);
  const [activeBatchTabs, setActiveBatchTabs] = useState<Record<string, 'quizzes' | 'vocabulary'>>({});
  const [activeQuestionFilters, setActiveQuestionFilters] = useState<Record<string, string>>({});
  const [vocabSearchFilters, setVocabSearchFilters] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Save AI Config updates
  const handleUpdateAiConfig = (
    newProvider: 'openrouter' | 'gemini',
    newModel: string,
    newApiKey: string,
    newCustomModel?: string
  ) => {
    setAiProvider(newProvider);
    setOpenRouterModel(newModel);
    setOpenRouterApiKey(newApiKey);
    if (newCustomModel !== undefined) setCustomModelInput(newCustomModel);

    const updatedConfig: ParentConfig = {
      ...config,
      openRouter: {
        provider: newProvider,
        selectedModel: newModel,
        apiKey: newApiKey,
        customModelName: newCustomModel !== undefined ? newCustomModel : customModelInput,
      },
    };
    saveParentConfig(updatedConfig);
    onConfigChange?.(updatedConfig);
  };

  // Test OpenRouter Connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const effectiveModel = openRouterModel === 'custom' ? customModelInput.trim() : openRouterModel;
      const res = await fetch('/api/openrouter/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: openRouterApiKey.trim(),
          model: effectiveModel || 'google/gemini-2.0-flash-001',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || (isDe ? 'Verbindung zu OpenRouter erfolgreich!' : 'OpenRouter connection successful!'),
        });
        soundFx.playPowerUp();
      } else {
        setTestResult({
          success: false,
          message: data.error || (isDe ? 'Verbindung fehlgeschlagen.' : 'Connection failed.'),
        });
        soundFx.playWrong();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || (isDe ? 'Verbindungsfehler aufgetreten' : 'Connection error occurred'),
      });
      soundFx.playWrong();
    } finally {
      setTestingConnection(false);
    }
  };

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

  // Process Images with OpenRouter / Gemini AI Vision Endpoint
  const handleProcessScan = async () => {
    if (selectedImages.length === 0) {
      setErrorMessage(isDe ? 'Bitte mindestens ein Bild aufnehmen oder auswählen.' : 'Please take or select at least one photo.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    const effectiveModel = openRouterModel === 'custom' ? customModelInput.trim() : openRouterModel;
    const modelDisplayName = aiProvider === 'openrouter' ? effectiveModel.split('/').pop() : 'Gemini 3.8 Flash';

    setStatusMessage(
      isDe
        ? `KI (${modelDisplayName}) analysiert Schulbuchseite & extrahiert Aufgaben für 1. Test...`
        : `AI (${modelDisplayName}) analyzing textbook page & extracting questions...`
    );

    try {
      const response = await fetch('/api/gemini/scan-schoolbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: selectedImages.map((img) => img.dataUrl),
          category: selectedCategory,
          subject: selectedCategory,
          bookTitle: bookTitle.trim(),
          targetSchoolGrade,
          assignedKidId: selectedKidId,
          targetLanguage,
          notes: extraNotes.trim(),
          language,
          provider: aiProvider,
          openRouterApiKey: openRouterApiKey.trim(),
          openRouterModel: effectiveModel,
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

      const finalTopic = focusTopic.trim() || bookTitle.trim() || (selectedCategory === 'languages' ? 'English Book Unit 1' : 'Schulbuch-Thema 1');
      const finalTitle = bookTitle.trim() || finalTopic;

      const formattedQuestions: CustomQuestion[] = extractedQuestions.map((q, idx) => ({
        ...q,
        id: q.id || `scan_q_${Date.now()}_${idx}`,
        topic: finalTopic,
        subject: selectedCategory,
        targetLanguage: selectedCategory === 'languages' ? targetLanguage : undefined,
        assignedKidId: selectedKidId,
        scanBatchTitle: finalTitle,
        source: 'schoolbook_scan' as const,
        isCustom: true,
      }));

      const newBatch: ScannedMaterialBatch = {
        id: data.batchId || `scan-${Date.now()}`,
        title: finalTitle,
        topic: finalTopic,
        createdAt: new Date().toISOString(),
        assignedKidId: selectedKidId,
        subject: (data.detectedSubject as SubjectArea) || selectedCategory,
        gradeLevel: (data.schoolGrade || targetSchoolGrade) > 4 ? 'high_school' : 'primary',
        schoolGrade: data.schoolGrade || targetSchoolGrade,
        difficulty: targetSchoolGrade <= 2 ? 1 : targetSchoolGrade === 3 ? 2 : targetSchoolGrade <= 5 ? 3 : targetSchoolGrade <= 7 ? 4 : 5,
        questionCount: formattedQuestions.length,
        extractedQuestionsCount: formattedQuestions.length,
        extractedVocabularyCount: data.extractedVocabularyCount || (data.vocabularyList?.length) || (data.extractedVocabulary?.length) || 0,
        extractedVocabulary: data.vocabularyList || data.extractedVocabulary || [],
        extractedSummary: data.extractedSummary,
        sourceBookOrChapter: finalTitle,
        aiModelUsed: data.aiModelUsed || effectiveModel,
        aiProviderUsed: (data.aiProviderUsed as any) || aiProvider,
      };

      // Save batch & append custom questions
      const { batches: updatedBatches } = addScannedBatchWithQuestions(newBatch, formattedQuestions);
      setBatches(updatedBatches);
      setLastProcessedBatch(newBatch);
      setExpandedBatchId(newBatch.id);

      // Auto-create official ChildTest if selected
      if (autoCreateTest) {
        const targetKids = selectedKidId === 'all' ? config.kids.map((k) => k.id) : [selectedKidId];
        const newTest: ChildTest = {
          id: `test-scan-${Date.now()}`,
          scanBatchId: newBatch.id,
          title: `${finalTopic} (1. Schularbeit / Quiz)`,
          description: data.extractedSummary || (isDe ? `Offizieller Schultest zu ${finalTopic}` : `School test for ${finalTopic}`),
          subject: newBatch.subject,
          topic: finalTopic,
          schoolGrade: newBatch.schoolGrade,
          assignedKidIds: targetKids,
          timeLimitMinutes: Math.max(10, Math.min(30, formattedQuestions.length * 3)),
          questions: formattedQuestions,
          createdAt: new Date().toISOString(),
          createdBy: isDe ? `Scanner (${newBatch.aiModelUsed?.split('/').pop() || 'KI'})` : `Scanner (${newBatch.aiModelUsed?.split('/').pop() || 'AI'})`,
          rewardXp: 150,
          rewardCoins: 75,
        };
        saveChildTest(newTest);
      }

      // Auto-create rewarded ChildTask if selected
      if (autoCreateTask) {
        const newTask: ChildTask = {
          id: `task-scan-${Date.now()}`,
          scanBatchId: newBatch.id,
          title: `${finalTopic}: Vokabel- & Aufgaben-Training`,
          description: isDe ? `Löse alle ${formattedQuestions.length} Aufgaben aus ${finalTopic} für Belohnungen!` : `Solve all ${formattedQuestions.length} exercises from ${finalTopic}!`,
          subject: newBatch.subject,
          topic: finalTopic,
          targetCount: formattedQuestions.length,
          currentCount: 0,
          assignedKidId: selectedKidId,
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
          status: 'assigned',
          rewardXp: 100,
          rewardCoins: 50,
          createdAt: new Date().toISOString(),
        };
        saveChildTask(newTask);
      }

      // Trigger config refresh if callback provided
      if (onConfigChange) {
        onConfigChange(loadParentConfig());
      }

      // MANDATORY PRIVACY: Immediately delete image buffers from client memory
      setSelectedImages([]);
      setBookTitle('');
      setExtraNotes('');

      setStatusMessage(
        isDe
          ? `✅ ${extractedQuestions.length} Aufgaben${autoCreateTest ? ' & 1 Schultest' : ''}${autoCreateTask ? ' & 1 Lernaufgabe' : ''} mit Modell ${newBatch.aiModelUsed?.split('/').pop() || 'KI'} erfolgreich generiert!`
          : `✅ ${extractedQuestions.length} questions${autoCreateTest ? ' & 1 Quiz-Test' : ''}${autoCreateTask ? ' & 1 Reward Task' : ''} created with ${newBatch.aiModelUsed?.split('/').pop() || 'AI'}!`
      );
      soundFx.playPowerUp();
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(
        isDe
          ? 'Fehler beim Analysieren des Fotos. Bitte stelle sicher, dass der Text gut lesbar ist oder überprüfe den OpenRouter-Schlüssel.'
          : 'Error analyzing the image. Please make sure the text is clearly legible or check your OpenRouter API key.'
      );
      soundFx.playWrong();
    } finally {
      setIsProcessing(false);
    }
  };

  // Immediate 1-click test handler for user's attached example schoolbook photos
  const handleProcessSample = async (sampleNum: 1 | 2) => {
    setIsProcessing(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const effectiveModel = openRouterModel === 'custom' ? customModelInput.trim() : openRouterModel;
      const res = await fetch('/api/gemini/scan-schoolbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleExample: sampleNum,
          category: 'languages',
          targetSchoolGrade,
          assignedKidId: selectedKidId,
          targetLanguage: 'en',
          language,
          provider: aiProvider,
          openRouterApiKey: openRouterApiKey.trim(),
          openRouterModel: effectiveModel,
          bookTitle: sampleNum === 1
            ? 'More Words and Phrases - English Unit 1 (IMG_5026)'
            : 'English Textbook Unit 1 - Numbers & Colours (IMG_5027)',
          notes: sampleNum === 1
            ? 'IMG_5026: More Words and Phrases - Vollständige Extraktion aller 42 Vokabeln & mind. 2 Quizzes pro Wort'
            : 'IMG_5027: Textbook Page - Vollständige Extraktion aller Vokabeln & mind. 2 Quizzes pro Wort',
        }),
      });

      if (!res.ok) throw new Error('Fehler beim Generieren der Beispiel-Aufgaben.');
      const data = await res.json();
      const extractedQuestions: CustomQuestion[] = data.questions || [];

      if (extractedQuestions.length === 0) {
        throw new Error('Keine Aufgaben generiert.');
      }

      const finalTitle = data.batchTitle || (sampleNum === 1 ? 'More Words and Phrases - Unit 1' : 'English Textbook Unit 1');
      const finalTopic = data.detectedTopic || (sampleNum === 1 ? 'More Words & Phrases' : 'English Book Unit 1');

      const formattedQuestions: CustomQuestion[] = extractedQuestions.map((q, idx) => ({
        ...q,
        id: q.id || `sample_q_${Date.now()}_${idx}`,
        topic: finalTopic,
        subject: 'languages' as SubjectArea,
        targetLanguage: 'en' as TargetLearnLanguage,
        assignedKidId: selectedKidId,
        scanBatchTitle: finalTitle,
        source: 'schoolbook_scan' as const,
        isCustom: true,
      }));

      const newBatch: ScannedMaterialBatch = {
        id: data.batchId || `scan-sample-${Date.now()}`,
        title: finalTitle,
        topic: finalTopic,
        createdAt: new Date().toISOString(),
        assignedKidId: selectedKidId,
        subject: 'languages',
        gradeLevel: (data.schoolGrade || targetSchoolGrade) > 4 ? 'high_school' : 'primary',
        schoolGrade: data.schoolGrade || targetSchoolGrade,
        difficulty: 2,
        questionCount: formattedQuestions.length,
        extractedQuestionsCount: formattedQuestions.length,
        extractedVocabularyCount: data.extractedVocabularyCount || data.vocabularyList?.length || 0,
        extractedVocabulary: data.vocabularyList || data.extractedVocabulary || [],
        extractedSummary: data.extractedSummary,
        sourceBookOrChapter: finalTitle,
        aiModelUsed: data.aiModelUsed || 'brainboss-curriculum-v2',
        aiProviderUsed: (data.aiProviderUsed as any) || aiProvider,
      };

      const { batches: updatedBatches } = addScannedBatchWithQuestions(newBatch, formattedQuestions);
      setBatches(updatedBatches);
      setLastProcessedBatch(newBatch);
      setExpandedBatchId(newBatch.id);

      // Auto-create official ChildTest if selected
      if (autoCreateTest) {
        const targetKids = selectedKidId === 'all' ? config.kids.map((k) => k.id) : [selectedKidId];
        const newTest: ChildTest = {
          id: `test-scan-${Date.now()}`,
          scanBatchId: newBatch.id,
          title: `${finalTopic} (1. Schularbeit / Quiz)`,
          description: data.extractedSummary || (isDe ? `Offizieller Schultest zu ${finalTopic}` : `School test for ${finalTopic}`),
          subject: newBatch.subject,
          topic: finalTopic,
          schoolGrade: newBatch.schoolGrade,
          assignedKidIds: targetKids,
          timeLimitMinutes: Math.max(10, Math.min(35, formattedQuestions.length * 2)),
          questions: formattedQuestions,
          createdAt: new Date().toISOString(),
          createdBy: isDe ? `Scanner (100% Vokabel-Abdeckung)` : `Scanner (100% Vocab Coverage)`,
          rewardXp: 180,
          rewardCoins: 90,
        };
        saveChildTest(newTest);
      }

      // Auto-create rewarded ChildTask if selected
      if (autoCreateTask) {
        const newTask: ChildTask = {
          id: `task-scan-${Date.now()}`,
          scanBatchId: newBatch.id,
          title: `${finalTopic}: Vokabel- & Gamification-Training`,
          description: isDe
            ? `Löse alle ${formattedQuestions.length} Aufgaben zu den ${newBatch.extractedVocabularyCount || formattedQuestions.length} Vokabeln!`
            : `Solve all ${formattedQuestions.length} exercises from ${finalTopic}!`,
          subject: newBatch.subject,
          topic: finalTopic,
          targetCount: formattedQuestions.length,
          currentCount: 0,
          assignedKidId: selectedKidId,
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
          status: 'assigned',
          rewardXp: 150,
          rewardCoins: 75,
          createdAt: new Date().toISOString(),
        };
        saveChildTask(newTask);
      }

      if (onConfigChange) {
        onConfigChange(loadParentConfig());
      }

      setStatusMessage(
        isDe
          ? `🎉 Alle Vokabeln extrahiert! ${newBatch.extractedVocabularyCount} Vokabeln vollständig erfasst und ${formattedQuestions.length} interaktive Gamified Quizzes (mind. 2 pro Vokabel) generiert!`
          : `🎉 All vocabulary extracted! ${newBatch.extractedVocabularyCount} words transcribed and ${formattedQuestions.length} interactive gamified quizzes created (at least 2 per word)!`
      );
      soundFx.playPowerUp();
    } catch (err: any) {
      console.error('Sample scan error:', err);
      setErrorMessage(
        isDe
          ? `Fehler beim Laden des Beispiels: ${err.message || 'Unbekannter Fehler'}`
          : `Error loading sample: ${err.message || 'Unknown error'}`
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
  const handleRequestDeleteBatch = (batch: ScannedMaterialBatch) => {
    soundFx.playPop();
    setBatchToDelete(batch);
  };

  const handleConfirmDeleteBatch = () => {
    if (!batchToDelete) return;
    const batchId = batchToDelete.id;
    const { batches: updated } = deleteScannedBatch(batchId);
    setBatches(updated);
    if (lastProcessedBatch?.id === batchId) setLastProcessedBatch(null);
    setBatchToDelete(null);
    soundFx.playPop();
    setStatusMessage(isDe ? 'Schulbuch-Scan und Aufgaben wurden erfolgreich gelöscht.' : 'Scan and questions deleted successfully.');
    setTimeout(() => setStatusMessage(null), 4000);
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
              ? 'Fotografiere Buchseiten, Tests oder Hausaufgabenhefte ab. Die KI digitalisiert Übungen, Vokabeln und Grammatik gezielt für deutschsprachige Kinder (z.B. Vorbereitung auf die 1. Schularbeit in Englisch). Nach dem Prozessieren werden alle Fotos sofort gelöscht.'
              : 'Take photos of textbooks, tests, or homework sheets. AI extracts exercises, categorizes them, and assigns them to your child. Images are securely deleted after processing.'}
          </p>
        </div>

        {/* Quick AI Provider Status Chip */}
        <button
          type="button"
          onClick={() => setIsAiSettingsOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 text-xs font-bold text-indigo-200 hover:text-white transition-all shadow-md shrink-0 cursor-pointer"
        >
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>
            {aiProvider === 'openrouter'
              ? `OpenRouter: ${(openRouterModel === 'custom' ? customModelInput : openRouterModel).split('/').pop() || 'gemini-2.0-flash'}`
              : 'Google Gemini 3.8 Flash'}
          </span>
          <Settings2 className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </button>
      </div>

      {/* AI ENGINE & OPENROUTER CONFIGURATION CARD */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsAiSettingsOpen((prev) => !prev)}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  {isDe ? '🤖 KI-Vision Modell & OpenRouter Konfiguration' : '🤖 AI Vision Model & OpenRouter Setup'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/40 text-[10px] font-mono font-bold text-indigo-300">
                  {aiProvider === 'openrouter' ? 'OpenRouter Active' : 'Gemini AI Studio'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isDe
                  ? 'Wähle dein bevorzugtes KI-Vision-Modell (z.B. Gemini 2.0 Flash oder Claude 3.5 Sonnet) für optimale Erkennung von Schulbüchern.'
                  : 'Select your preferred AI vision model (e.g. Gemini 2.0 Flash or Claude 3.5 Sonnet) for textbook recognition.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isAiSettingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isAiSettingsOpen && (
          <div className="space-y-4 pt-3 border-t border-slate-800 animate-in fade-in duration-200">
            {/* Provider Switcher */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300">{isDe ? 'KI-Provider:' : 'AI Provider:'}</span>
              <div className="grid grid-cols-2 gap-2 max-w-sm">
                <button
                  type="button"
                  onClick={() => handleUpdateAiConfig('openrouter', openRouterModel, openRouterApiKey)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    aiProvider === 'openrouter'
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-900/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>OpenRouter (Empfohlen)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAiConfig('gemini', openRouterModel, openRouterApiKey)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    aiProvider === 'gemini'
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-900/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Gemini AI Studio</span>
                </button>
              </div>
            </div>

            {aiProvider === 'openrouter' && (
              <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                {/* Model Selector Cards */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isDe ? 'Dediziertes KI-Modell auswählen:' : 'Select Dedicated Model:'}</span>
                    </label>
                    <span className="text-[10px] text-indigo-400 font-mono">
                      {isDe ? 'Standard: Gemini 2.0 Flash • Empfohlen: Claude 3.5 Sonnet' : 'Default: Gemini 2.0 Flash • Recommended: Claude 3.5 Sonnet'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {CURATED_OPENROUTER_MODELS.map((m) => {
                      const isSelected = openRouterModel === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleUpdateAiConfig('openrouter', m.id, openRouterApiKey)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                            isSelected
                              ? 'bg-indigo-950/70 border-indigo-500 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-400'
                              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-xs font-bold text-white">{m.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${m.badgeColor}`}>
                                {m.badge}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                              {isDe ? m.descriptionDe : m.descriptionEn}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 pt-1 border-t border-indigo-900/60">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>{isDe ? 'Ausgewähltes Modell' : 'Active Model'}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Model Input if 'custom' is selected */}
                  {openRouterModel === 'custom' && (
                    <div className="pt-2 space-y-1">
                      <label className="text-xs font-bold text-slate-300">
                        {isDe ? 'OpenRouter Modell-Slug eintragen:' : 'Enter OpenRouter Model Slug:'}
                      </label>
                      <input
                        type="text"
                        value={customModelInput}
                        onChange={(e) => handleUpdateAiConfig('openrouter', 'custom', openRouterApiKey, e.target.value)}
                        placeholder="z.B. mistralai/pixtral-large-2411 oder deepseek/deepseek-chat"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* OpenRouter API Key Input */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isDe ? 'OpenRouter API-Schlüssel (optional / server-seitig):' : 'OpenRouter API Key:'}</span>
                    </label>
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <span>{isDe ? 'Schlüssel auf openrouter.ai erstellen' : 'Get OpenRouter Key'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={openRouterApiKey}
                        onChange={(e) => handleUpdateAiConfig('openrouter', openRouterModel, e.target.value)}
                        placeholder="sk-or-v1-..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 font-mono pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        title={showApiKey ? 'Hide' : 'Show'}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {testingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{isDe ? 'Verbindung testen' : 'Test Connection'}</span>
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                        testResult.success
                          ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                          : 'bg-red-950/70 border-red-500/40 text-red-200'
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400">
                    💡 {isDe
                      ? 'Hinweis: Wenn auf dem Server bereits ein OPENROUTER_API_KEY in der Umgebung hinterlegt ist, kann das Feld frei gelassen werden. Andernfalls füge hier deinen Schlüssel ein (wird sicher im Elternprofil gespeichert).'
                      : 'Note: If OPENROUTER_API_KEY is configured in server environment, you can leave this blank.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PEDAGOGICAL BANNER: GERMAN NATIVE LEARNERS ENGLISH 1ST TEST PREPARATION */}
      {selectedCategory === 'languages' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-orange-950/40 to-slate-900 border border-amber-500/40 space-y-2">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-amber-200 uppercase tracking-wide">
              {isDe ? '🇩🇪 ➡️ 🇬🇧 Didaktischer Fokus: Englisch für deutschsprachige Kinder (1. Schularbeit / Test)' : 'English as Foreign Language for German Native Speakers'}
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isDe
              ? 'Die KI extrahiert gezielt die im Schulbuch (z.B. More! 1, Easy 1, Red Line) gezeigten Übungen für den ersten großen Schultest:'
              : 'The AI extracts targeted curriculum exercises from your textbook for the first official school test:'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-medium text-slate-300 pt-1">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
              <span>🎒</span>
              <span>{isDe ? 'Schulsachen & Zahlen 1-20' : 'School objects & numbers'}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
              <span>✍️</span>
              <span>{isDe ? 'Artikel (a vs. an)' : 'Articles (a vs an)'}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
              <span>💬</span>
              <span>{isDe ? 'Verb ‚to be‘ (am/is/are)' : 'Verb to be (am/is/are)'}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
              <span>🔊</span>
              <span>{isDe ? 'Native Audio-Aussprache' : 'Native audio pronunciation'}</span>
            </div>
          </div>
        </div>
      )}

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
                className="p-4 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 border border-indigo-400/30 transition-transform active:scale-95 cursor-pointer"
              >
                <Camera className="w-6 h-6 text-indigo-200" />
                <span>{isDe ? 'Kamera öffnen (Handy)' : 'Open Camera (Mobile)'}</span>
              </button>

              {/* Desktop / Gallery File Upload Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex flex-col items-center justify-center gap-2 border border-slate-700 transition-colors active:scale-95 cursor-pointer"
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

            {/* Direct 1-Click Test Buttons for Attached Examples */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isDe ? '⚡ Angehängte Beispiele sofort testen:' : '⚡ Test Attached Examples:'}</span>
                </span>
                <span className="text-[10px] text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40">
                  100% Vokabeln & Quizzes
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleProcessSample(1)}
                  disabled={isProcessing}
                  className="p-3 rounded-xl bg-gradient-to-r from-amber-600/25 to-orange-600/25 hover:from-amber-600/45 hover:to-orange-600/45 border border-amber-500/50 text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50 space-y-1 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-200 flex items-center gap-1.5">
                      <span>📸 Beispiel 1: IMG_5026.JPG</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-200 border border-amber-400/50 font-black">
                      42 Vokabeln • 84+ Quizzes
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    {isDe
                      ? '„MORE Words and Phrases“: Extrahiert alle 42 Begriffe (to give, to guess, to hang up, colour, etc.) und erstellt mind. 2 kreative Quizzes pro Vokabel (Wort-Puzzles, Drag & Drop Sätze, Audio & Lücken)!'
                      : '“MORE Words and Phrases”: Extracts all 42 items with at least 2 gamified quizzes per word (puzzles, drag & drop, audio, spelling).'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleProcessSample(2)}
                  disabled={isProcessing}
                  className="p-3 rounded-xl bg-gradient-to-r from-teal-600/25 to-indigo-600/25 hover:from-teal-600/45 hover:to-indigo-600/45 border border-teal-500/50 text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50 space-y-1 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-teal-200 flex items-center gap-1.5">
                      <span>📸 Beispiel 2: IMG_5027.JPG</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-500/30 text-teal-200 border border-teal-400/50 font-black">
                      30+ Vokabeln • 60+ Quizzes
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    {isDe
                      ? 'Schulbuchseite: Extrahiert alle Vokabeln, Zahlen 1-25 und Farben und erstellt gamifizierte Quizzes mit Puzzles und Satz-Lücken!'
                      : 'Textbook page: Extracts all vocabulary, numbers 1-25 & colours, and generates gamified quizzes!'}
                  </p>
                </button>
              </div>
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
                          className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-500 shadow-md cursor-pointer"
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
              {isDe ? '2. Fachbereich, Kind & Schulstufe wählen' : '2. Choose Subject, Child & Grade'}
            </label>

            {/* Subject Area Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>{isDe ? 'Fachbereich des Buchs / Hefts:' : 'Subject Category:'}</span>
                <span className="text-[10px] text-indigo-400 font-mono">
                  {selectedCategory === 'languages' ? '🇬🇧 English / Language Academy' : selectedCategory === 'math' ? '🔢 Math' : selectedCategory === 'nature' ? '🌿 Science' : selectedCategory === 'geography' ? '🌍 Geography' : '🎨 Art'}
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'languages' as SubjectArea, label: isDe ? 'Englisch / Sprachen' : 'English / Languages', icon: '🇬🇧', color: 'from-amber-600 to-orange-600' },
                  { id: 'math' as SubjectArea, label: isDe ? 'Mathematik' : 'Math', icon: '🔢', color: 'from-blue-600 to-cyan-600' },
                  { id: 'nature' as SubjectArea, label: isDe ? 'Natur & Wissen' : 'Nature & Science', icon: '🌿', color: 'from-emerald-600 to-teal-600' },
                  { id: 'geography' as SubjectArea, label: isDe ? 'Geographie' : 'Geography', icon: '🌍', color: 'from-sky-600 to-indigo-600' },
                  { id: 'art' as SubjectArea, label: isDe ? 'Kunst & Musik' : 'Art & Music', icon: '🎨', color: 'from-purple-600 to-pink-600' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      soundFx.playPop();
                      if (cat.id === 'languages') setFocusTopic('English Book Unit 1');
                      else if (cat.id === 'math') setFocusTopic('Mathe Kapitel 1');
                      else if (cat.id === 'nature') setFocusTopic('Natur & Wissen Thema 1');
                      else if (cat.id === 'geography') setFocusTopic('Geographie Thema 1');
                      else if (cat.id === 'art') setFocusTopic('Kunst & Musik Thema 1');
                    }}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? `bg-gradient-to-br ${cat.color} text-white border-white/40 shadow-md scale-[1.02]`
                        : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-[10px] font-bold line-clamp-1">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

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
                  {(config?.kids || [])
                    .filter((kid): kid is KidProfile => Boolean(kid && kid.id && kid.name))
                    .map((kid) => (
                      <option key={kid.id} value={kid.id}>
                        {kid.avatar} {kid.name} ({kid.schoolGrade || (kid.gradeLevel === 'high_school' ? 5 : 2)}. Schulstufe)
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  {isDe
                    ? 'Nur das zugewiesene Kind bekommt diese Aufgaben in seinen Quests & Tests.'
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

            {/* Focus Topic Name (Fokus-Thema) - Visible to child in Academy */}
            <div className="space-y-2 p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/50">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isDe ? 'Fokus-Thema (Name in der Akademie):' : 'Focus Topic Name:'}</span>
                </label>
                <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40">
                  {isDe ? '🎯 Genau so sieht es das Kind' : '🎯 Visible in Child Academy'}
                </span>
              </div>
              <input
                type="text"
                value={focusTopic}
                onChange={(e) => setFocusTopic(e.target.value)}
                placeholder={selectedCategory === 'languages' ? 'English Book Unit 1' : 'z.B. Thema 1'}
                className="w-full bg-slate-950 border border-indigo-500/60 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-400"
              />
              <p className="text-[10px] text-slate-300">
                {isDe
                  ? '💡 Unter diesem Fokus-Themen-Namen (z.B. „English Book Unit 1“) findet das Kind den Schultest & die Quests direkt in der Sprachen-Akademie!'
                  : '💡 The child will find the quiz and practice questions directly under this topic name in their Academy.'}
              </p>
              {/* Quick Topic Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-400">{isDe ? 'Schnellauswahl:' : 'Presets:'}</span>
                {(selectedCategory === 'languages'
                  ? ['English Book Unit 1', 'English Book Unit 2', 'Vocabulary Test 1', 'Classroom & School', 'Grammar: to be & articles']
                  : selectedCategory === 'math'
                  ? ['Mathe Kapitel 1', 'Bruchrechnen S. 42', 'Schularbeit Vorbereitung', 'Kopfrechnen Training']
                  : ['Thema 1', 'Kapitel 1', 'Schularbeit Vorbereitung']
                ).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFocusTopic(preset)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] border transition-colors cursor-pointer ${
                      focusTopic === preset
                        ? 'bg-indigo-600 text-white border-indigo-400 font-bold'
                        : 'bg-slate-900 border-slate-700 hover:border-indigo-400 text-slate-300 hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Book / Sheet Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isDe ? 'Titel / Buchkapitel' : 'Title / Book Chapter'}</span>
              </label>
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder={
                  selectedCategory === 'languages'
                    ? (isDe ? 'z.B. More! 1 - Unit 1: School & Classroom oder Easy 1 Vorbereitung 1. Test' : 'e.g. More! 1 - Unit 1: School & Classroom')
                    : (isDe ? 'z.B. Mathematik 3 - Bruchrechnen S. 42' : 'e.g. Math 3 - Fractions p. 42')
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
                  {isDe ? 'Zusätzliche Hinweise für KI (optional)' : 'Extra AI Instructions'}
                </label>
                <input
                  type="text"
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  placeholder={isDe ? 'z.B. Fokus auf Vokabeln der Schultasche und Artikel a/an' : 'e.g. Focus on schoolbag items & articles'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Automation Options: Auto-Create Test & Task */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                {isDe ? 'Automatische Bereitstellung für das Kind:' : 'Automated Quiz & Test Setup:'}
              </span>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={autoCreateTest}
                    onChange={(e) => setAutoCreateTest(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isDe ? 'Automatisch als Schultest / Quiz anlegen (mit Timer & Benotung)' : 'Auto-create official Child Test with timer & grades'}</span>
                  </div>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={autoCreateTask}
                    onChange={(e) => setAutoCreateTask(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isDe ? 'Automatisch als Belohnungs-Hausaufgabe (XP & Münzen) einstellen' : 'Auto-assign as Homework Quest with XP & Coins'}</span>
                  </div>
                </label>
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
              className={`w-full py-3.5 px-5 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
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
                        {batch.aiModelUsed && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/40 text-purple-300 flex items-center gap-1">
                            <Cpu className="w-3 h-3 text-purple-400" />
                            <span>{batch.aiModelUsed.split('/').pop()}</span>
                          </span>
                        )}
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
                          {(config?.kids || [])
                            .filter((k): k is KidProfile => Boolean(k && k.id && k.name))
                            .map((k) => (
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
                        onClick={() => handleRequestDeleteBatch(batch)}
                        className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/50 transition-colors cursor-pointer"
                        title={isDe ? 'Scan & Aufgaben löschen' : 'Delete scan and questions'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Questions & Vocabulary View */}
                  {isExpanded && (() => {
                    const currentTab = activeBatchTabs[batch.id] || 'quizzes';
                    const activeFilter = activeQuestionFilters[batch.id] || 'all';
                    const vocabSearch = (vocabSearchFilters[batch.id] || '').toLowerCase().trim();

                    // Derive complete vocabulary list
                    const vocabList = (batch.extractedVocabulary && batch.extractedVocabulary.length > 0
                      ? batch.extractedVocabulary
                      : (() => {
                          const map = new Map<string, any>();
                          batchQuestions.forEach((q) => {
                            if (q.vocabularyItem?.term) {
                              map.set(q.vocabularyItem.term.toLowerCase(), q.vocabularyItem);
                            } else if (q.puzzleData?.targetWord) {
                              map.set(q.puzzleData.targetWord.toLowerCase(), {
                                term: q.puzzleData.targetWord,
                                translation: typeof q.correctAnswer === 'string' ? q.correctAnswer : q.question,
                                exampleSentence: q.subtext,
                              });
                            }
                          });
                          return Array.from(map.values());
                        })());

                    // Question type counts
                    const scrambleCount = batchQuestions.filter((q) => q.questionType === 'puzzle_scramble').length;
                    const dragDropCount = batchQuestions.filter((q) => q.questionType === 'drag_drop_sentence').length;
                    const missingCount = batchQuestions.filter((q) => q.questionType === 'missing_letters').length;
                    const dialogueCount = batchQuestions.filter((q) => q.questionType === 'dialogue_context').length;
                    const audioCount = batchQuestions.filter((q) => q.questionType === 'audio_challenge').length;
                    const mcCount = batchQuestions.filter((q) => !q.questionType || q.questionType === 'multiple_choice').length;

                    // Filtered questions
                    const filteredQuestions = activeFilter === 'all'
                      ? batchQuestions
                      : batchQuestions.filter((q) => (q.questionType || 'multiple_choice') === activeFilter);

                    // Filtered vocabulary
                    const filteredVocab = vocabList.filter(
                      (v) =>
                        v.term.toLowerCase().includes(vocabSearch) ||
                        v.translation.toLowerCase().includes(vocabSearch) ||
                        (v.category && v.category.toLowerCase().includes(vocabSearch))
                    );

                    return (
                      <div className="p-4 bg-slate-950/70 border-t border-slate-800 space-y-4">
                        {/* Tab Switcher: Quizzes vs Vocabulary */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                            <button
                              type="button"
                              onClick={() => {
                                soundFx.playPop();
                                setActiveBatchTabs((prev) => ({ ...prev, [batch.id]: 'quizzes' }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                currentTab === 'quizzes'
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>
                                {isDe ? '🎮 Interaktive Quizzes' : '🎮 Interactive Quizzes'} ({batchQuestions.length})
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                soundFx.playPop();
                                setActiveBatchTabs((prev) => ({ ...prev, [batch.id]: 'vocabulary' }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                currentTab === 'vocabulary'
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <BookMarked className="w-3.5 h-3.5 text-emerald-300" />
                              <span>
                                {isDe ? '📚 Vollständige Vokabelliste' : '📚 Full Vocabulary List'} ({vocabList.length})
                              </span>
                            </button>
                          </div>

                          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {isDe ? 'Mind. 2 Quizzes pro Vokabel garantiert' : 'Min. 2 quizzes per vocab guaranteed'}
                          </span>
                        </div>

                        {/* TAB 1: QUIZZES */}
                        {currentTab === 'quizzes' && (
                          <div className="space-y-3">
                            {/* Question Type Filter Pills */}
                            <div className="flex items-center gap-1.5 flex-wrap text-xs">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {isDe ? 'Filter nach Quiz-Typ:' : 'Filter Quiz Type:'}
                              </span>
                              {[
                                { id: 'all', label: isDe ? 'Alle' : 'All', count: batchQuestions.length, icon: null },
                                { id: 'puzzle_scramble', label: '🧩 Wort-Puzzle', count: scrambleCount },
                                { id: 'drag_drop_sentence', label: '🔤 Satz-Lücke', count: dragDropCount },
                                { id: 'missing_letters', label: '✏️ Rechtschreibung', count: missingCount },
                                { id: 'dialogue_context', label: '💬 Dialog', count: dialogueCount },
                                { id: 'audio_challenge', label: '🎧 Audio', count: audioCount },
                                { id: 'multiple_choice', label: '🎯 Multiple Choice', count: mcCount },
                              ].map((f) => (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => {
                                    soundFx.playPop();
                                    setActiveQuestionFilters((prev) => ({ ...prev, [batch.id]: f.id }));
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                                    activeFilter === f.id
                                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                                  }`}
                                >
                                  {f.label} ({f.count})
                                </button>
                              ))}
                            </div>

                            {filteredQuestions.length === 0 ? (
                              <p className="text-xs text-slate-500 italic py-4 text-center">
                                {isDe ? 'Keine Aufgaben für diesen Filter gefunden.' : 'No exercises found for this filter.'}
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredQuestions.map((q, qIdx) => {
                                  const qType = q.questionType || 'multiple_choice';
                                  const typeBadge =
                                    qType === 'puzzle_scramble'
                                      ? { label: '🧩 Wort-Puzzle', color: 'bg-amber-950/80 text-amber-300 border-amber-500/50' }
                                      : qType === 'drag_drop_sentence'
                                      ? { label: '🔤 Satz-Lücke (Drag & Drop)', color: 'bg-teal-950/80 text-teal-300 border-teal-500/50' }
                                      : qType === 'missing_letters'
                                      ? { label: '✏️ Lücken-Buchstaben', color: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50' }
                                      : qType === 'dialogue_context'
                                      ? { label: '💬 Dialog-Situation', color: 'bg-purple-950/80 text-purple-300 border-purple-500/50' }
                                      : qType === 'audio_challenge'
                                      ? { label: '🎧 Audio-Hör-Quiz', color: 'bg-violet-950/80 text-violet-300 border-violet-500/50' }
                                      : { label: '🎯 Multiple Choice', color: 'bg-slate-800 text-slate-300 border-slate-700' };

                                  return (
                                    <div
                                      key={q.id || qIdx}
                                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                                    >
                                      <div className="flex items-center justify-between text-[11px] gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-mono font-black text-indigo-400">#{qIdx + 1}</span>
                                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeBadge.color}`}>
                                            {typeBadge.label}
                                          </span>
                                        </div>

                                        {(q.visual?.pronounceText || q.vocabularyItem?.term || q.subject === 'languages') && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const textToSpeak = q.visual?.pronounceText || q.vocabularyItem?.term || String(q.correctAnswer);
                                              speakWord(textToSpeak, q.visual?.pronounceLang || 'en-US');
                                            }}
                                            className="px-2 py-0.5 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-white flex items-center gap-1 text-[10px] font-bold border border-indigo-500/30 cursor-pointer"
                                            title={isDe ? 'Aussprache anhören' : 'Listen to pronunciation'}
                                          >
                                            <Volume2 className="w-3 h-3 text-indigo-400" />
                                            <span>{isDe ? 'Audio' : 'Speak'}</span>
                                          </button>
                                        )}
                                      </div>

                                      {/* Vocabulary reference badge if available */}
                                      {q.vocabularyItem && (
                                        <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-amber-300/90 border border-slate-800 flex items-center justify-between">
                                          <span>📖 Vokabel: <strong>{q.vocabularyItem.term}</strong></span>
                                          <span className="text-slate-400">({q.vocabularyItem.translation})</span>
                                        </div>
                                      )}

                                      <p className="text-xs font-bold text-white leading-snug">{q.question}</p>

                                      {/* Puzzle specific clues */}
                                      {q.puzzleData?.scrambledLetters && (
                                        <div className="flex items-center gap-1 pt-0.5">
                                          <span className="text-[10px] text-slate-400">Buchstaben:</span>
                                          {q.puzzleData.scrambledLetters.map((l, lIdx) => (
                                            <span key={lIdx} className="w-5 h-5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center">
                                              {l}
                                            </span>
                                          ))}
                                        </div>
                                      )}

                                      {q.puzzleData?.missingLettersPrompt && (
                                        <div className="p-1 rounded bg-slate-950 font-mono text-xs text-amber-300 font-bold text-center border border-slate-800">
                                          {q.puzzleData.missingLettersPrompt}
                                        </div>
                                      )}

                                      {/* Options preview */}
                                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                                        {q.options?.map((opt, optIdx) => {
                                          const isCorrect = String(opt).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
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
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* TAB 2: COMPLETE VOCABULARY LIST */}
                        {currentTab === 'vocabulary' && (
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="relative flex-1 max-w-sm">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                                <input
                                  type="text"
                                  value={vocabSearchFilters[batch.id] || ''}
                                  onChange={(e) =>
                                    setVocabSearchFilters((prev) => ({ ...prev, [batch.id]: e.target.value }))
                                  }
                                  placeholder={isDe ? 'Vokabel oder Übersetzung filtern...' : 'Filter vocabulary...'}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500"
                                />
                              </div>

                              <span className="text-xs text-slate-400 font-mono">
                                {isDe ? 'Zeige' : 'Showing'} {filteredVocab.length} {isDe ? 'von' : 'of'} {vocabList.length} {isDe ? 'Vokabeln' : 'words'}
                              </span>
                            </div>

                            {filteredVocab.length === 0 ? (
                              <p className="text-xs text-slate-500 italic py-4 text-center">
                                {isDe ? 'Keine Vokabeln gefunden.' : 'No vocabulary matching search.'}
                              </p>
                            ) : (
                              <div className="overflow-x-auto rounded-xl border border-slate-800">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                                    <tr>
                                      <th className="p-2.5">#</th>
                                      <th className="p-2.5">{isDe ? 'Englische Vokabel / Phrase' : 'English Term'}</th>
                                      <th className="p-2.5">{isDe ? 'Deutsche Übersetzung' : 'German Translation'}</th>
                                      <th className="p-2.5">{isDe ? 'Kategorie' : 'Category'}</th>
                                      <th className="p-2.5">{isDe ? 'Beispielsatz aus dem Buch' : 'Example Sentence'}</th>
                                      <th className="p-2.5 text-right">{isDe ? 'Aussprache' : 'Audio'}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                                    {filteredVocab.map((v, vIdx) => (
                                      <tr key={vIdx} className="hover:bg-slate-900/50 transition-colors">
                                        <td className="p-2.5 font-mono text-slate-500">{vIdx + 1}</td>
                                        <td className="p-2.5 font-bold text-white flex items-center gap-1.5">
                                          <span>{v.term}</span>
                                        </td>
                                        <td className="p-2.5 font-semibold text-emerald-300">
                                          {v.translation}
                                        </td>
                                        <td className="p-2.5">
                                          <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono">
                                            {v.category || 'vocab'}
                                          </span>
                                        </td>
                                        <td className="p-2.5 text-slate-400 italic text-[11px] max-w-xs truncate">
                                          {v.exampleSentence || '—'}
                                        </td>
                                        <td className="p-2.5 text-right">
                                          <button
                                            type="button"
                                            onClick={() => speakWord(v.term, 'en-US')}
                                            className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-white transition-colors cursor-pointer"
                                            title={isDe ? 'Anhören' : 'Listen'}
                                          >
                                            <Volume2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Batch Deletion Confirmation Modal */}
      {batchToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">
                  {isDe ? 'Schulbuch-Scan löschen?' : 'Delete Schoolbook Scan?'}
                </h4>
                <p className="text-xs text-rose-300/80 font-medium">
                  {isDe ? 'Alle dazugehörigen generierten Aufgaben werden entfernt' : 'All generated exercises from this scan will be removed'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="font-bold text-white text-xs">{batchToDelete.title || batchToDelete.sourceBookOrChapter || (isDe ? 'Unbenannter Scan' : 'Untitled scan')}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                {batchToDelete.questionCount || 1} {isDe ? 'Aufgaben' : 'questions'} • {new Date(batchToDelete.createdAt).toLocaleDateString(isDe ? 'de-DE' : 'en-US')}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isDe
                ? 'Möchtest du diesen Scan und alle daraus erstellten Übungsaufgaben wirklich unwiderruflich löschen?'
                : 'Do you really want to permanently delete this scan and all its generated exercises?'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBatchToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {isDe ? 'Abbrechen' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBatch}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDe ? 'Scan endgültig löschen' : 'Delete Scan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

