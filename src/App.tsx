import React, { useEffect, useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GameHeader } from './components/GameHeader';
import { GameFooter } from './components/GameFooter';
import { SantuarioView } from './components/SantuarioView';
import { QuestView } from './components/QuestView';
import { HeroesView } from './components/HeroesView';
import { GachaView } from './components/GachaView';
import { ShopView } from './components/ShopView';
import { ForgeView } from './components/ForgeView';
import { PotionShopView } from './components/PotionShopView';
import { TavernView } from './components/TavernView';
import { WorldMapView } from './components/WorldMapView';
import { CombatView } from './components/CombatView';
import { PatrolView } from './components/PatrolView';
import { InventoryView } from './components/InventoryView';
import { MailboxModal } from './components/MailboxModal';
import { OptionsModal } from './components/OptionsModal';
import { GitHubDataManagerModal } from './components/GitHubDataManagerModal';
import { PlayGamesModal } from './components/PlayGamesModal';
import { PlayGamesAchievementBanner } from './components/PlayGamesAchievementBanner';
import { AuctionHouseModal } from './components/AuctionHouseModal';
import { OrderClanView } from './components/OrderClanView';
import { StoryDialogueView } from './components/StoryDialogueView';
import { TavernKitchenView } from './components/TavernKitchenView';
import { sound } from './services/soundService';

const useResponsiveGameScale = () => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // 407 x 792 is the exact baseline dimensions of the game canvas from image_860b8583.png
      const scaleFit = Math.min(vw / 407, vh / 792);
      setScale(scaleFit);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return scale;
};

const GameContent: React.FC = () => {
  const {
    currentTab,
    goBack,
    isGitHubManagerOpen,
    setIsGitHubManagerOpen,
    isPlayGamesOpen,
    setIsPlayGamesOpen,
    selectedCombatMissionId,
    setSelectedCombatMissionId,
    navigateTo,
  } = useGame();
  const scale = useResponsiveGameScale();

  useEffect(() => {
    // Attempt BGM init safely
    try {
      sound.initBGM('/assets/audio/blades_of_the_astral_gate.mp3');
    } catch {
      // Ignored if media is restricted
    }
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-[#0a0402] flex items-center justify-center p-0 selection:bg-amber-600 selection:text-white font-sans overflow-hidden">
      {/* Game Canvas Container - Preserves exact 407x792 layout across any zoom level */}
      <div
        style={{
          width: 407,
          height: 792,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
        className="relative flex flex-col bg-[#1c0803] shadow-2xl overflow-hidden shrink-0 select-none"
      >
        {/* Full-Screen Background: Authentic Wood Cover, Shop, Inventory, Forge or Potions */}
        <img
          src={
            currentTab === 'shop'
              ? '/assets/backgrounds/FONDO_TIENDA_BACKUP.png'
              : currentTab === 'inventory'
              ? '/assets/backgrounds/fondo inventario app.png'
              : currentTab === 'forge'
              ? '/assets/backgrounds/fondo_herreria_1.png'
              : currentTab === 'potions'
              ? '/assets/aistudio/image_180f7992.png'
              : '/assets/items/recurso_8_4x.png'
          }
          alt="Fondo"
          className={`absolute inset-0 w-full h-full pointer-events-none select-none z-0 ${
            currentTab === 'potions'
              ? 'object-cover scale-[1.12] -translate-y-[5%] transform origin-center'
              : 'object-fill'
          }`}
        />

        {/* Top Wood Header with Plaque, Spoke Wheel, Gold, Crystals & Mail - Hidden on full-screen combat, story & cooking view */}
        {!['combat', 'story', 'cooking'].includes(currentTab) && <GameHeader />}

        {/* Central Dynamic View Area */}
        <main className="relative flex-1 w-full overflow-hidden flex flex-col z-10 bg-transparent">
          {(currentTab === 'santuario' || currentTab === 'camp') && <SantuarioView />}
          {currentTab === 'quest' && <QuestView />}
          {currentTab === 'heroes' && <HeroesView />}
          {(currentTab === 'draw' || currentTab === 'gacha') && <GachaView />}
          {currentTab === 'shop' && <ShopView />}
          {currentTab === 'forge' && <ForgeView />}
          {currentTab === 'potions' && <PotionShopView />}
          {currentTab === 'tavern' && <TavernView />}
          {currentTab === 'cooking' && <TavernKitchenView onClose={() => goBack()} />}
          {currentTab === 'world' && <WorldMapView />}
          {currentTab === 'combat' && <CombatView />}
          {currentTab === 'patrol' && <PatrolView />}
          {currentTab === 'inventory' && <InventoryView />}
          {currentTab === 'auction' && <AuctionHouseModal isOpen={true} onClose={() => goBack()} />}
          {(currentTab === 'order' || currentTab === 'clan') && <OrderClanView />}
          {currentTab === 'story' && (
            <StoryDialogueView
              onFinish={() => {
                const fromKitchen = selectedCombatMissionId === 'cocina_paco';
                const fromKitchenMonsters = selectedCombatMissionId === 'cocina_monstruos';
                const fromForge = selectedCombatMissionId === 'forja_goryn';
                const fromBotica = selectedCombatMissionId === 'botica_raxxar';
                setSelectedCombatMissionId(null);
                if (fromForge || fromBotica) {
                  // Vuelve al taller deshaciendo la entrada de la cinemática,
                  // para que "Volver" no reabra la historia de la misión 1.
                  goBack();
                  return;
                }
                if (fromKitchen || fromKitchenMonsters) {
                  // Vuelve al Fogón deshaciendo la entrada de la cinemática, para no
                  // dejar 'story' en el historial ("Volver" en la taberna debe ir al Santuario).
                  goBack();
                  return;
                }
                navigateTo('quest');
              }}
              onLaunchCombat={() => {
                navigateTo('combat');
              }}
            />
          )}
          {!['santuario', 'camp', 'quest', 'heroes', 'draw', 'gacha', 'shop', 'forge', 'potions', 'tavern', 'cooking', 'world', 'combat', 'patrol', 'inventory', 'auction', 'order', 'clan', 'story'].includes(currentTab) && (
            <QuestView />
          )}
        </main>

        {/* Bottom Wood Footer Bar with 6 Circular Emblems - Hidden on full-screen immersion views */}
        {!['combat', 'forge', 'potions', 'auction', 'order', 'clan', 'story', 'cooking'].includes(currentTab) && <GameFooter />}

        {/* Global Modals */}
        <MailboxModal />
        <OptionsModal />
        <PlayGamesModal
          isOpen={isPlayGamesOpen}
          onClose={() => setIsPlayGamesOpen(false)}
        />
        <PlayGamesAchievementBanner />
        <GitHubDataManagerModal
          isOpen={isGitHubManagerOpen}
          onClose={() => setIsGitHubManagerOpen(false)}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <GameContent />
      </GameProvider>
    </ErrorBoundary>
  );
}
