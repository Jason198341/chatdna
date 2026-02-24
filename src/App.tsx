import { useState } from 'react';
import { useChatStore } from '@/stores/chatStore';
import Header from '@/components/layout/Header';
import FileUpload from '@/components/upload/FileUpload';
import AnalysisView from '@/components/analysis/AnalysisView';
import DNAProfile from '@/components/profile/DNAProfile';
import Toast from '@/components/common/Toast';

type View = 'landing' | 'analysis' | 'profile';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const analysis = useChatStore((s) => s.analysis);

  return (
    <div className="min-h-screen bg-bg">
      <Header onReset={() => { useChatStore.getState().reset(); setView('landing'); }} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {view === 'landing' && (
          <FileUpload onAnalyzed={() => setView('analysis')} />
        )}
        {view === 'analysis' && analysis && (
          <AnalysisView
            analysis={analysis}
            onViewProfile={() => setView('profile')}
          />
        )}
        {view === 'profile' && analysis && (
          <DNAProfile
            analysis={analysis}
            onBack={() => setView('analysis')}
          />
        )}
      </main>
      <Toast />
    </div>
  );
}
