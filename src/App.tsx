import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Brawler, GameMode } from './types';
import { BRAWLERS, GAME_MODES } from './constants';
import { GemGrabGame } from './components/GemGrabGame';
import { ShowdownGame } from './components/ShowdownGame';
import { BrawlBallGame } from './components/BrawlBallGame';
import { preloadAvatars } from './utils/avatarCache';

// Hooks
import { useUser } from './hooks/useUser';
import { useStarrDrop } from './hooks/useStarrDrop';

// Components
import { AppHeader } from './components/common/AppHeader';
import { HomeView } from './components/views/HomeView';
import { TrophyRoadView } from './components/views/TrophyRoadView';
import { BrawlersView } from './components/views/BrawlersView';
import { GameModesView } from './components/views/GameModesView';

// Modals
import { BrawlerInfoModal } from './components/modals/BrawlerInfoModal';
import { CustomBrawlerModal } from './components/modals/CustomBrawlerModal';
import { MatchResultModal } from './components/modals/MatchResultModal';
import { StarrDropModal } from './components/modals/StarrDropModal';

const trophyRoadMilestones = [
  { trophies: 10, reward: 100, type: 'credits' },
  { trophies: 50, reward: 250, type: 'credits' },
  { trophies: 100, reward: 500, type: 'credits' },
  { trophies: 250, reward: 1000, type: 'credits' },
  { trophies: 500, reward: 2000, type: 'credits' },
  { trophies: 1000, reward: 5000, type: 'credits' },
];

export default function App() {
  const {
    user,
    awardWinTrophies,
    awardLossTrophies,
    awardShowdownResults,
    claimMilestone,
    unlockBrawler,
    deductDailyDrop,
    addReward,
    setSelectedBrawlerId,
    setUser,
    updateBrawlBallWin,
    customBrawler,
    updateCustomBrawlerName,
    upgradeCustomBrawlerStat
  } = useUser();

  useEffect(() => {
    // Preload first 20 brawlers to the cache
    preloadAvatars(BRAWLERS.slice(0, 20).map(b => b.name));
  }, []);

  const {
    isOpening: isOpeningDrop,
    isShuffling: isShufflingDrop,
    dropTier,
    dropAttempts,
    dropResult,
    startOpening: startDropSequence,
    rollDrop,
    finishDrop,
    closeDrop
  } = useStarrDrop(user, addReward);

  const [view, setView] = useState<'home' | 'brawlers' | 'modes' | 'game' | 'trophyRoad'>('home');
  const [selectedMode, setSelectedMode] = useState<GameMode>('Atrapagemas');
  const [searchTerm, setSearchTerm] = useState('');
  const [matchResult, setMatchResult] = useState<'win' | 'loss' | null>(null);
  const [lastRank, setLastRank] = useState<number | null>(null);
  const [rewards, setRewards] = useState<{ trophies: number, drops: number, credits: number } | null>(null);
  const [showBrawlerInfo, setShowBrawlerInfo] = useState<Brawler | null>(null);
  const [showCustomBrawlerEdit, setShowCustomBrawlerEdit] = useState(false);

  const filteredBrawlers = [customBrawler, ...BRAWLERS].filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedBrawler = [customBrawler, ...BRAWLERS].find(b => b.id === user.selectedBrawlerId) || BRAWLERS[0];

  const onGameWin = (kills: number = 0) => {
    setLastRank(null);
    setMatchResult('win');
    if (selectedMode === 'Balón Brawl') {
      updateBrawlBallWin();
    }
    const r = awardWinTrophies(kills);
    setRewards(r);
    setView('home');
  };

  const onGameLoss = (kills: number = 0) => {
    setLastRank(null);
    setMatchResult('loss');
    const r = awardLossTrophies(kills);
    setRewards(r);
    setView('home');
  };

  const onShowdownFinish = (rank: number, kills: number = 0) => {
    setLastRank(rank);
    setMatchResult(rank <= 4 ? 'win' : 'loss');
    const r = awardShowdownResults(rank, kills);
    setRewards(r);
    setView('home');
  };


  const handleStartDrop = () => {
    if (user.dailyDropsRemaining <= 0) return;
    deductDailyDrop();
    startDropSequence();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
      <AppHeader user={user} onTrophyRoad={() => setView('trophyRoad')} />

      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <HomeView 
              selectedBrawler={selectedBrawler}
              selectedMode={selectedMode}
              gameModes={GAME_MODES}
              user={user}
              onShowModes={() => setView('modes')}
              onPlay={() => setView('game')}
              onShowBrawlers={() => setView('brawlers')}
              onStartDrop={handleStartDrop}
            />
          )}

          {view === 'trophyRoad' && (
            <TrophyRoadView 
              user={user}
              milestones={trophyRoadMilestones}
              onBack={() => setView('home')}
              onClaim={(m) => claimMilestone(m.trophies, m.reward)}
            />
          )}

          {view === 'brawlers' && (
            <BrawlersView 
              user={user}
              brawlers={filteredBrawlers}
              searchTerm={searchTerm}
              onSearch={setSearchTerm}
              onBack={() => setView('home')}
              onShowBrawlerInfo={setShowBrawlerInfo}
              onUnlock={unlockBrawler}
              onEditCustomBrawler={() => setShowCustomBrawlerEdit(true)}
              onSelect={(b) => {
                setSelectedBrawlerId(b.id);
                setView('home');
              }}
            />
          )}

          {view === 'modes' && (
            <GameModesView 
              gameModes={GAME_MODES}
              onBack={() => setView('home')}
              onSelect={(modeId) => {
                setSelectedMode(modeId);
                setView('home');
              }}
            />
          )}

          {view === 'game' && selectedMode === 'Atrapagemas' && (
            <GemGrabGame 
              playerBrawler={selectedBrawler}
              onWin={onGameWin}
              onLoss={onGameLoss}
              onExit={() => setView('home')}
            />
          )}

          {view === 'game' && selectedMode === 'Supervivencia' && (
            <ShowdownGame 
              playerBrawler={selectedBrawler}
              onFinish={onShowdownFinish}
              onExit={() => setView('home')}
            />
          )}

          {view === 'game' && selectedMode === 'Balón Brawl' && (
            <BrawlBallGame 
              playerBrawler={selectedBrawler}
              brawlBallWins={user.brawlBallWins || 0}
              onWin={onGameWin}
              onLoss={onGameLoss}
              onExit={() => setView('home')}
            />
          )}
        </AnimatePresence>
      </main>

      <BrawlerInfoModal 
        brawler={showBrawlerInfo} 
        onClose={() => setShowBrawlerInfo(null)} 
      />

      <AnimatePresence>
        {showCustomBrawlerEdit && (
          <CustomBrawlerModal
            user={user}
            onClose={() => setShowCustomBrawlerEdit(false)}
            onUpdateName={updateCustomBrawlerName}
            onUpgradeStat={upgradeCustomBrawlerStat}
          />
        )}
      </AnimatePresence>

      <MatchResultModal 
        matchResult={matchResult}
        lastRank={lastRank}
        rewards={rewards}
        onContinue={() => {
          if (matchResult === 'win') {
            handleStartDrop();
          }
          setMatchResult(null);
          setRewards(null);
        }}
      />


      <StarrDropModal 
        isOpening={isOpeningDrop}
        isShuffling={isShufflingDrop}
        dropTier={dropTier}
        dropAttempts={dropAttempts}
        dropResult={dropResult}
        onRoll={rollDrop}
        onFinish={finishDrop}
        onClose={closeDrop}
      />
    </div>
  );
}
