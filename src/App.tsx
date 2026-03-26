import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  Trophy, 
  Zap, 
  Shield, 
  Coins, 
  Gem, 
  Star, 
  Settings, 
  ShoppingBag, 
  User, 
  Bell, 
  Menu,
  X,
  ArrowUp,
  Heart,
  Skull,
  Plane,
  Building2,
  Clock,
  Gift,
  Target,
  Dna,
  Sparkles,
  Crown,
  Loader2,
  Upload,
  Map,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';

// --- Constants ---
const GRAVITY = 0.4;
const JUMP_STRENGTH = -7;
const PIPE_SPEED = 4;
const PIPE_SPAWN_RATE = 1800;
const PIPE_WIDTH = 70;
const PIPE_GAP = 200;
const PLANE_SIZE = 70;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// --- Types ---
type GameState = 'START' | 'LOADING_REALISM' | 'PLAYING' | 'GAME_OVER' | 'VICTORY' | 'TRANSCENDENCE' | 'PENTAGON' | 'FRENZY_CUTSCENE' | 'FRENZY' | 'LIBERTY_CUTSCENE' | 'BOSS_CUTSCENE' | 'BOSS_FIGHT' | 'COUNTDOWN' | 'DLC_CLT_CUTSCENE' | 'DLC_GERMANY_INTRO' | 'DLC_GERMANY_RIDE' | 'DLC_BOSS_FIGHT' | 'DLC_LEVEL_11_CUTSCENE' | 'DLC_LEVEL_20_CUTSCENE' | 'DLC_LEVEL_40_CUTSCENE' | 'DLC_FRENZY_CUTSCENE' | 'DLC_FRENZY_MODE' | 'DLC_BOSS_CUTSCENE';

interface Stat {
  name: string;
  value: number;
  max: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface Item {
  id: string;
  name: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
  price: number;
  currency: 'COINS' | 'GEMS' | 'USD';
  effect: string;
}

// --- Mock Data ---
const ITEMS: Item[] = [
  { id: '1', name: 'God Mode (1 Game)', rarity: 'MYTHIC', price: 4.99, currency: 'USD', effect: 'Infinite HP' },
  { id: '2', name: 'Nuke Pack (5x)', rarity: 'EPIC', price: 1.99, currency: 'USD', effect: 'Clear Screen' },
  { id: '3', name: 'Extra Lives (10x)', rarity: 'RARE', price: 2.99, currency: 'USD', effect: 'Revive 10x' },
  { id: '4', name: 'Infinite Energy (24h)', rarity: 'MYTHIC', price: 9.99, currency: 'USD', effect: 'Play forever' },
  { id: '5', name: 'ULTRA VALUE PACK', rarity: 'MYTHIC', price: 99.99, currency: 'USD', effect: '1000 Gems + 10k Coins + 30 SP' },
  { id: '6', name: 'Skill Boost (25 SP)', rarity: 'LEGENDARY', price: 49.99, currency: 'USD', effect: '+25 Skill Points' },
];

const ACHIEVEMENTS = [
  { id: '1', title: 'First Flight', description: 'Pass 1 tower', reward: 10 },
  { id: '2', title: 'Frequent Flyer', description: 'Pass 10 towers', reward: 50 },
  { id: '3', title: 'Sky God', description: 'Reach Level 10', reward: 100 },
];

const ARTIFACTS = [
  { id: '1', name: 'Golden Propeller', description: '+10% Coin gain', price: 100, icon: '🚁' },
  { id: '2', name: 'Cloud Compass', description: 'Towers are 5% further apart', price: 250, icon: '🧭' },
  { id: '3', name: 'Storm Shield', description: '10% chance to survive a hit', price: 500, icon: '🛡️' },
  { id: '4', name: 'Sonic Engine', description: '+20% XP gain', price: 300, icon: '🚀' },
];

const BP_REWARDS = [
  { level: 1, reward: '100 Coins', type: 'COINS', value: 100 },
  { level: 5, reward: '10 Gems', type: 'GEMS', value: 10 },
  { level: 10, reward: 'Rare Skin', type: 'SKIN', value: 'Rare Plane' },
  { level: 15, reward: '500 Coins', type: 'COINS', value: 500 },
  { level: 20, reward: '50 Gems', type: 'GEMS', value: 50 },
  { level: 30, reward: 'Legendary Artifact', type: 'ARTIFACT', value: '3' },
];

export default function App() {
  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>('START');
  const [isDlcUnlocked, setIsDlcUnlocked] = useState(true);
  const [dlcLevel, setDlcLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [dlcHighScore, setDlcHighScore] = useState(0);

  // --- Refs for High Performance Canvas ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const planeYRef = useRef(300);
  const velocityRef = useRef(0);
  const pipesRef = useRef<{ x: number; topHeight: number; id: number; scored: boolean }[]>([]);
  const frameRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const frankfurtImgRef = useRef<HTMLImageElement | null>(null);
  const towerImgRef = useRef<HTMLImageElement | null>(null);
  const planeImgRef = useRef<HTMLImageElement | null>(null);

  // --- RPG / Meta State ---
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(100);
  const [gems, setGems] = useState(10);
  const [energy, setEnergy] = useState(10);
  const [skillPoints, setSkillPoints] = useState(5);
  const [vipLevel, setVipLevel] = useState(0);
  const [petLevel, setPetLevel] = useState(1);
  const [petXp, setPetXp] = useState(0);
  const [isInvincible, setIsInvincible] = useState(false);
  const [slowMo, setSlowMo] = useState(false);
  const [feverMode, setFeverMode] = useState(false);
  const [feverCount, setFeverCount] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showGacha, setShowGacha] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [claimedAchievements, setClaimedAchievements] = useState<string[]>([]);
  const [artifacts, setArtifacts] = useState<string[]>([]);
  const [battlePassXp, setBattlePassXp] = useState(0);
  const [claimedBpRewards, setClaimedBpRewards] = useState<number[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [bossHp, setBossHp] = useState(100);
  const [bossX, setBossX] = useState(CANVAS_WIDTH + 100);
  const [isDlcBoss, setIsDlcBoss] = useState(false);
  const nextStateRef = useRef<GameState>('PLAYING');
  const towerBoundsRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const planeBoundsRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const bossProjectilesRef = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const playerProjectilesRef = useRef<{ x: number; y: number }[]>([]);
  const lastBossShotRef = useRef<number>(0);
  const previousGameStateRef = useRef<GameState>('PLAYING');
  const collectiblesRef = useRef<{ x: number; y: number; type: 'ENERGY' | 'COIN' | 'GEM'; id: number }[]>([]);
  const lastCollectibleSpawnRef = useRef<number>(0);

  // --- Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem('slop_save');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.highScore !== undefined) setHighScore(data.highScore);
        if (data.dlcHighScore !== undefined) setDlcHighScore(data.dlcHighScore);
        if (data.level !== undefined) setLevel(data.level);
        if (data.xp !== undefined) setXp(data.xp);
        if (data.coins !== undefined) setCoins(data.coins);
        if (data.gems !== undefined) setGems(data.gems);
        if (data.energy !== undefined) setEnergy(data.energy);
        if (data.artifacts !== undefined) setArtifacts(data.artifacts);
        if (data.claimedAchievements !== undefined) setClaimedAchievements(data.claimedAchievements);
        if (data.battlePassXp !== undefined) setBattlePassXp(data.battlePassXp);
        if (data.claimedBpRewards !== undefined) setClaimedBpRewards(data.claimedBpRewards);
        if (data.isDlcUnlocked !== undefined) setIsDlcUnlocked(data.isDlcUnlocked);
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
  }, []);

  useEffect(() => {
    const data = {
      highScore,
      dlcHighScore,
      level,
      xp,
      coins,
      gems,
      energy,
      artifacts,
      claimedAchievements,
      battlePassXp,
      claimedBpRewards,
      isDlcUnlocked
    };
    localStorage.setItem('slop_save', JSON.stringify(data));
  }, [highScore, dlcHighScore, level, xp, coins, gems, energy, artifacts, claimedAchievements, battlePassXp, claimedBpRewards, isDlcUnlocked]);

  const scanImage = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { x: 0, y: 0, w: img.width, h: img.height };
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = data[(y * canvas.width + x) * 4 + 3];
        const r = data[(y * canvas.width + x) * 4];
        const g = data[(y * canvas.width + x) * 4 + 1];
        const b = data[(y * canvas.width + x) * 4 + 2];
        
        // Consider non-transparent and non-white as content
        if (alpha > 10 && (r < 250 || g < 250 || b < 250)) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }

    if (!found) return { x: 0, y: 0, w: img.width, h: img.height };
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  };

  const [stats, setStats] = useState<Stat[]>([
    { name: 'Thrust', value: 10, max: 100, icon: <Zap size={12} />, color: 'text-yellow-400', bgColor: 'bg-yellow-400' },
    { name: 'Handling', value: 15, max: 100, icon: <Target size={12} />, color: 'text-blue-400', bgColor: 'bg-blue-400' },
    { name: 'Durability', value: 5, max: 100, icon: <Shield size={12} />, color: 'text-red-400', bgColor: 'bg-red-400' },
    { name: 'Faith', value: 1, max: 100, icon: <Crown size={12} />, color: 'text-purple-400', bgColor: 'bg-purple-400' },
  ]);

  // --- UI State ---
  const [planeBase64, setPlaneBase64] = useState<string | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showBattlePass, setShowBattlePass] = useState(false);
  const [showLootbox, setShowLootbox] = useState(false);
  const [showVip, setShowVip] = useState(false);
  const [showDaily, setShowDaily] = useState(true);
  const [showPets, setShowPets] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [showGuilds, setShowGuilds] = useState(false);
  const [guild, setGuild] = useState<string | null>(null);
  const [lootboxResult, setLootboxResult] = useState<Item | null>(null);
  const [showOffer, setShowOffer] = useState(false);
  const [ccTarget, setCcTarget] = useState<any>('ULTRA_VALUE');
  const [skipTarget, setSkipTarget] = useState<number>(11);
  const [showSettings, setShowSettings] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [mapTab, setMapTab] = useState<'NORMAL' | 'DLC'>('NORMAL');
  const [useAiRealism, setUseAiRealism] = useState(() => {
    const saved = localStorage.getItem('aviation_use_ai');
    return saved === 'true'; // Default to false
  });
  const [ccNumber, setCcNumber] = useState('');
  const [ccError, setCcError] = useState('');
  const [offerTimer, setOfferTimer] = useState(300);
  const [chatMessages, setChatMessages] = useState<{id: number, user: string, msg: string}[]>([
    { id: 1, user: "xX_NoobSlayer_Xx", msg: "Just got the Mythic skin! POG" },
    { id: 2, user: "Whale_King", msg: "VIP 15 is worth it guys." },
    { id: 3, user: "F2P_Warrior", msg: "How do I pass level 2 without gems??" },
    { id: 4, user: "System", msg: "Player 'SlopLord' just pulled a MYTHIC Divine Shield!" },
    { id: 5, user: "GamerGirl99", msg: "Anyone want to trade gems?" },
  ]);
  const chatCounter = useRef(100);

  // --- Image Generation ---
  const generateRealism = async (force = false, retryCount = 0) => {
    if (!force) {
      const cached = localStorage.getItem('aviation_realism_assets');
      if (cached) {
        try {
          const { bg, tower, plane } = JSON.parse(cached);
          const loadImg = (data: string) => new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.src = data;
            img.onload = () => resolve(img);
            img.onerror = reject;
          });
          
          const [bgImg, towerImg, planeImg] = await Promise.all([
            loadImg(bg),
            loadImg(tower),
            loadImg(plane)
          ]);
          
          bgImgRef.current = bgImg;
          towerImgRef.current = towerImg;
          planeImgRef.current = planeImg;
          
          towerBoundsRef.current = scanImage(towerImg);
          planeBoundsRef.current = scanImage(planeImg);
          
          startGame();
          return;
        } catch (e) {
          console.error("Failed to load cached assets", e);
          localStorage.removeItem('aviation_realism_assets');
        }
      }
    }

    if (!useAiRealism) {
      try {
        const loadImg = (path: string) => new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.src = path;
          img.onload = () => resolve(img);
          img.onerror = reject;
        });
        
        const [bgImg, towerImg, planeImg, frankfurtImg] = await Promise.all([
          loadImg('/assets/bg.png').catch(() => null),
          loadImg('/assets/tower.png').catch(() => null),
          loadImg('/assets/plane.png').catch(() => null),
          loadImg('/assets/frankfurt.png').catch(() => null)
        ]);
        
        if (bgImg) bgImgRef.current = bgImg;
        if (frankfurtImg) {
          console.log("Frankfurt background loaded successfully!");
          frankfurtImgRef.current = frankfurtImg;
        } else {
          console.log("Frankfurt background not found or failed to load, using dark city fallback.");
        }
        if (towerImg) {
          towerImgRef.current = towerImg;
          towerBoundsRef.current = scanImage(towerImg);
        }
        if (planeImg) {
          planeImgRef.current = planeImg;
          planeBoundsRef.current = scanImage(planeImg);
        }
      } catch (e) {
        console.log("No local assets found in /assets/, using placeholders.");
      }
      startGame();
      return;
    }

    setGameState('LOADING_REALISM');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Generate Background
      const bgPromise = ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: 'A highly realistic, cinematic wide shot of the Twin Towers in New York City on a clear blue sky morning, professional photography, 8k resolution, historical accuracy.' }],
        },
        config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
      });

      // Generate Tower Texture
      const towerPromise = ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: 'A single, realistic skyscraper tower centered in the frame, vertical orientation, detailed facade with many windows, modern architecture, sharp detail, 8k, isolated against a simple background.' }],
        },
        config: { imageConfig: { aspectRatio: "9:16", imageSize: "1K" } }
      });

      // Generate Plane Texture
      const planePromise = ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: 'A realistic commercial airplane, Boeing 767, side view, white fuselage, detailed wings and engines, isolated on white background, 8k.' }],
        },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "512px" } }
      });

      const [bgRes, towerRes, planeRes] = await Promise.all([bgPromise, towerPromise, planePromise]);

      const getBase64 = (res: any) => {
        const part = res.candidates[0].content.parts.find((p: any) => p.inlineData);
        return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
      };

      const bgData = getBase64(bgRes);
      const towerData = getBase64(towerRes);
      const planeData = getBase64(planeRes);

      const loadImg = (data: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.src = data;
        img.onload = () => resolve(img);
        img.onerror = reject;
      });

      if (bgData) bgImgRef.current = await loadImg(bgData);
      if (towerData) {
        const img = await loadImg(towerData);
        towerImgRef.current = img;
        towerBoundsRef.current = scanImage(img);
      }
      if (planeData) {
        setPlaneBase64(planeData);
        const img = await loadImg(planeData);
        planeImgRef.current = img;
        planeBoundsRef.current = scanImage(img);
      }

      if (bgData && towerData && planeData) {
        try {
          localStorage.setItem('aviation_realism_assets', JSON.stringify({
            bg: bgData,
            tower: towerData,
            plane: planeData
          }));
        } catch (e) {
          console.warn("Failed to cache assets in localStorage (likely size limit)", e);
        }
      }

      startGame();
    } catch (error) {
      console.error("Realism generation failed:", error);
      
      if (retryCount < 2) {
        console.log(`Retrying generation... (${retryCount + 1}/2)`);
        setTimeout(() => generateRealism(force, retryCount + 1), 1000);
        return;
      }

      // Fallback to high-res placeholder
      const fallback = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80";
      const img = new Image();
      img.src = fallback;
      img.onload = () => {
        bgImgRef.current = img;
        startGame();
      };
      img.onerror = () => startGame();
    }
  };

  // --- Optimized Game Loop (Canvas) ---
  const update = useCallback((time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const isFrenzy = gameState === 'FRENZY' || gameState === 'DLC_FRENZY_MODE';
    const isBoss = gameState === 'BOSS_FIGHT' || gameState === 'DLC_BOSS_FIGHT';
    const isCountdown = gameState === 'COUNTDOWN';

    // If not in an active state, stop
    if (!isCountdown && gameState !== 'PLAYING' && gameState !== 'DLC_GERMANY_RIDE' && !isFrenzy && !isBoss) return;

    // Physics & Logic (only if not countdown)
    if (!isCountdown) {
      const currentHandling = stats[1].value;
      const effectiveGravity = Math.max(0.1, GRAVITY - (currentHandling - 15) * 0.005);
      velocityRef.current += (slowMo ? effectiveGravity * 0.3 : effectiveGravity);
      planeYRef.current += velocityRef.current;

      if (planeYRef.current < 0 || planeYRef.current > CANVAS_HEIGHT) {
        handleGameOver();
        return;
      }

      // Spawn Pipes
      if (!isBoss) {
        const hasCloudCompass = artifacts.includes('2');
        const spawnRate = hasCloudCompass ? PIPE_SPAWN_RATE * 1.05 : PIPE_SPAWN_RATE;
        const effectiveSpawnRate = isFrenzy ? spawnRate * 0.7 : spawnRate;
        if (time - lastSpawnRef.current > effectiveSpawnRate) {
          pipesRef.current.push({
            x: CANVAS_WIDTH,
            topHeight: Math.random() * 300 + 50,
            id: Date.now(),
            scored: false
          });
          lastSpawnRef.current = time;
        }

        // Spawn Collectibles
        if (time - lastCollectibleSpawnRef.current > 2000) {
          const typeRand = Math.random();
          const currentFaith = stats[3].value;
          const faithChance = currentFaith * 0.01;
          
          let type: 'ENERGY' | 'COIN' | 'GEM' = 'COIN';
          if (typeRand < 0.1) type = 'ENERGY';
          else if (typeRand < 0.2 + faithChance) type = 'GEM';
          
          collectiblesRef.current.push({
            x: CANVAS_WIDTH,
            y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
            type,
            id: Date.now()
          });
          lastCollectibleSpawnRef.current = time;
        }
      }

      // Move Pipes
      const speed = slowMo ? PIPE_SPEED * 0.5 : (isFrenzy ? PIPE_SPEED * 1.2 : PIPE_SPEED);
      pipesRef.current = pipesRef.current
        .map(p => ({ ...p, x: p.x - speed }))
        .filter(p => p.x + PIPE_WIDTH > -100);

      // Move Collectibles
      collectiblesRef.current = collectiblesRef.current
        .map(c => ({ ...c, x: c.x - speed }))
        .filter(c => c.x > -50);

      // Boss Logic
      if (isBoss) {
        setBossX(prev => {
          const next = prev > CANVAS_WIDTH - 200 ? prev - 1 : prev;
          return next;
        });

        // Boss Shooting
        if (time - lastBossShotRef.current > 1500) {
          // Shoot from the tip
          bossProjectilesRef.current.push({
            x: bossX + 50,
            y: 50,
            vx: -4,
            vy: (planeYRef.current - 50) / 150 // Aim at player
          });
          lastBossShotRef.current = time;
        }

        // Update Projectiles
        bossProjectilesRef.current = bossProjectilesRef.current
          .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy }))
          .filter(p => p.x > -50);

        playerProjectilesRef.current = playerProjectilesRef.current
          .map(p => ({ ...p, x: p.x + 12 }))
          .filter(p => p.x < CANVAS_WIDTH + 50);

        // Projectile Collisions
        playerProjectilesRef.current.forEach((p, idx) => {
          // Obelisk collision (approximate)
          if (p.x > bossX && p.x < bossX + 100) {
            setBossHp(prev => {
              if (prev <= 0) return prev;
              const next = prev - 3;
              if (next <= 0) {
                handleVictory();
              }
              return next;
            });
            playerProjectilesRef.current.splice(idx, 1);
          }
        });

        bossProjectilesRef.current.forEach(p => {
          if (!isInvincible && Math.abs(p.x - 100) < 20 && Math.abs(p.y - planeYRef.current) < 20) {
            handleGameOver();
          }
        });
      }
    }

    // Collision & Scoring
    if (!isCountdown) {
      // Collectibles Collision
      collectiblesRef.current.forEach((c, idx) => {
        const dist = Math.hypot(c.x - 100, c.y - planeYRef.current);
        if (dist < 40) {
          if (c.type === 'ENERGY') setEnergy(prev => Math.min(10, prev + 1));
          if (c.type === 'COIN') setCoins(prev => prev + 20);
          if (c.type === 'GEM') setGems(prev => prev + 2);
          collectiblesRef.current.splice(idx, 1);
          
          const audio = new Audio('https://www.myinstants.com/media/sounds/coin-sound-effect.mp3');
          audio.play().catch(() => {});
        }
      });
    }

    let planeRect = { x: 100, y: planeYRef.current, w: PLANE_SIZE, h: PLANE_SIZE };
    if (planeImgRef.current && planeBoundsRef.current.w > 0) {
      const img = planeImgRef.current;
      const bounds = planeBoundsRef.current;
      const scaleX = PLANE_SIZE / img.width;
      const scaleY = PLANE_SIZE / img.height;
      
      // Account for horizontal flip
      const flippedX = img.width - (bounds.x + bounds.w);
      
      planeRect = {
        x: 100 + flippedX * scaleX,
        y: planeYRef.current + bounds.y * scaleY,
        w: bounds.w * scaleX,
        h: bounds.h * scaleY
      };
    }

    // Boss Collision
    if (gameState === 'BOSS_FIGHT') {
      const bossRect = { x: bossX, y: 0, w: 100, h: CANVAS_HEIGHT };
      if (!isInvincible && (planeRect.x < bossRect.x + bossRect.w && planeRect.x + planeRect.w > bossRect.x && planeRect.y < bossRect.y + bossRect.h && planeRect.y + planeRect.h > bossRect.y)) {
        handleGameOver();
      }
      // Boss takes damage over time if close
      if (planeRect.x + planeRect.w > bossX - 50) {
        setBossHp(prev => {
          if (prev <= 0) return prev;
          const next = prev - 0.2;
          if (next <= 0) {
            handleVictory();
          }
          return next;
        });
      }
    }

    pipesRef.current.forEach(p => {
      const topRect = { x: p.x, y: 0, w: PIPE_WIDTH, h: p.topHeight };
      const bottomRect = { x: p.x, y: p.topHeight + PIPE_GAP, w: PIPE_WIDTH, h: CANVAS_HEIGHT };

      if (!isInvincible && (
        (planeRect.x < topRect.x + topRect.w && planeRect.x + planeRect.w > topRect.x && planeRect.y < topRect.y + topRect.h && planeRect.y + planeRect.h > topRect.y) ||
        (planeRect.x < bottomRect.x + bottomRect.w && planeRect.x + planeRect.w > bottomRect.x && planeRect.y < bottomRect.y + bottomRect.h && planeRect.y + planeRect.h > bottomRect.y)
      )) {
        const hasStormShield = artifacts.includes('3');
        const currentDurability = stats[2].value;
        const armorChance = (currentDurability - 5) * 0.02;
        if ((hasStormShield && Math.random() < 0.1) || Math.random() < armorChance) {
          // Survived!
          setIsInvincible(true);
          setTimeout(() => setIsInvincible(false), 1000);
        } else {
          handleGameOver();
        }
      }

      if (!p.scored && p.x + PIPE_WIDTH < 100) {
        p.scored = true;
        
        // Always increment score
        setScore(s => {
          const next = s + 1;
          // Normal mode cutscenes
          if (!(gameState === 'DLC_GERMANY_RIDE' || gameState === 'DLC_FRENZY_MODE')) {
            if (next === 11) { setGameState('TRANSCENDENCE'); planeYRef.current = 300; velocityRef.current = 0; }
            if (next === 20) { setGameState('PENTAGON'); planeYRef.current = 300; velocityRef.current = 0; }
            if (next === 30) { setGameState('FRENZY_CUTSCENE'); planeYRef.current = 300; velocityRef.current = 0; }
            if (next === 40) { setGameState('LIBERTY_CUTSCENE'); planeYRef.current = 300; velocityRef.current = 0; }
            if (next === 50) { setGameState('BOSS_CUTSCENE'); planeYRef.current = 300; velocityRef.current = 0; setBossHp(100); setBossX(CANVAS_WIDTH + 100); }
          }
          return next;
        });

        if (gameState === 'DLC_GERMANY_RIDE' || gameState === 'DLC_FRENZY_MODE') {
          setDlcLevel(l => {
            const next = l + 1;
            if (next === 11) { setGameState('DLC_LEVEL_11_CUTSCENE'); planeYRef.current = 300; velocityRef.current = 0; }
            if (next === 20) { setGameState('DLC_LEVEL_20_CUTSCENE'); planeYRef.current = 300; velocityRef.current = 0; }
            if (next === 30) { setGameState('DLC_FRENZY_CUTSCENE'); planeYRef.current = 300; velocityRef.current = 0; }
            if (next === 40) { setGameState('DLC_LEVEL_40_CUTSCENE'); planeYRef.current = 300; velocityRef.current = 0; }
            if (next === 50) { 
              setGameState('DLC_BOSS_CUTSCENE'); 
              planeYRef.current = 300; 
              velocityRef.current = 0; 
              setBossHp(200); 
              setBossX(CANVAS_WIDTH + 100); 
              setIsDlcBoss(true); 
            }
            return next;
          });
        }
        setXp(prev => {
          const hasSonicEngine = artifacts.includes('4');
          const gain = (feverMode ? 40 : 20) * (hasSonicEngine ? 1.2 : 1);
          setBattlePassXp(bp => bp + gain);
          return prev + gain;
        });
        setCoins(prev => {
          const hasGoldenPropeller = artifacts.includes('1');
          const gain = (feverMode ? 10 : 5) * (hasGoldenPropeller ? 1.1 : 1);
          return prev + Math.floor(gain);
        });
        setFeverCount(c => c + 1);
      }
    });

    // Draw
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Background
    if (gameState.startsWith('DLC_') && frankfurtImgRef.current) {
      ctx.drawImage(frankfurtImgRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (gameState.startsWith('DLC_')) {
      // Frankfurt Skyline (Mainhattan)
      ctx.fillStyle = '#1a1a2e'; // Dark blue sky
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw some distant skyscrapers
      ctx.fillStyle = '#16213e';
      const time = Date.now();
      for (let i = 0; i < 10; i++) {
        const x = (i * 150 - (time / 50) % 1500 + 1500) % 1500 - 200;
        const h = 200 + Math.sin(i * 1.5) * 100;
        ctx.fillRect(x, CANVAS_HEIGHT - h, 80, h);
        // Windows
        ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
        for (let wy = CANVAS_HEIGHT - h + 20; wy < CANVAS_HEIGHT; wy += 30) {
          for (let wx = x + 10; wx < x + 70; wx += 20) {
            // Deterministic window pattern to prevent flashing
            if ((Math.floor(wx) + Math.floor(wy)) % 7 !== 0) ctx.fillRect(wx, wy, 10, 15);
          }
        }
        ctx.fillStyle = '#16213e';
      }
    } else if (bgImgRef.current) {
      ctx.drawImage(bgImgRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#0a1a2f';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Pipes (Realistic Buildings)
    pipesRef.current.forEach(p => {
      if (towerImgRef.current) {
        const img = towerImgRef.current;
        const topH = p.topHeight;
        const bottomY = p.topHeight + PIPE_GAP;
        const bottomH = CANVAS_HEIGHT - bottomY;
        const bounds = towerBoundsRef.current;

        // Use scanned bounds for perfect cropping
        const sx = bounds.x;
        const sy = bounds.y;
        const sw = bounds.w;
        const sh = bounds.h;

        // Top Tower (Flipped Vertically)
        ctx.save();
        ctx.translate(p.x + PIPE_WIDTH / 2, topH / 2);
        ctx.scale(1, -1);
        ctx.drawImage(img, sx, sy, sw, sh, -PIPE_WIDTH / 2, -topH / 2, PIPE_WIDTH, topH);
        ctx.restore();

        // Bottom Tower
        ctx.drawImage(img, sx, sy, sw, sh, p.x, bottomY, PIPE_WIDTH, bottomH);
        
        // Add some shading/border
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, 0, PIPE_WIDTH, topH);
        ctx.strokeRect(p.x, bottomY, PIPE_WIDTH, bottomH);
      } else {
        ctx.fillStyle = '#2a2a2a';
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 4;
        
        // Top
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topHeight);
        ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.topHeight);
        
        // Windows
        ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
        for(let i=0; i<PIPE_WIDTH; i+=15) {
          for(let j=0; j<p.topHeight; j+=15) {
            ctx.fillRect(p.x + i + 2, j + 2, 10, 10);
          }
        }

        // Bottom
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(p.x, p.topHeight + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT);
        ctx.strokeRect(p.x, p.topHeight + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT);
        
        ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
        for(let i=0; i<PIPE_WIDTH; i+=15) {
          for(let j=p.topHeight + PIPE_GAP; j<CANVAS_HEIGHT; j+=15) {
            ctx.fillRect(p.x + i + 2, j + 2, 10, 10);
          }
        }
      }
    });

    // Collectibles
    collectiblesRef.current.forEach(c => {
      ctx.save();
      if (c.type === 'ENERGY') { ctx.fillStyle = '#3b82f6'; ctx.shadowColor = '#3b82f6'; }
      else if (c.type === 'COIN') { ctx.fillStyle = '#fbbf24'; ctx.shadowColor = '#fbbf24'; }
      else { ctx.fillStyle = '#ec4899'; ctx.shadowColor = '#ec4899'; }
      
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Boss (Washington Monument or Brandenburg Gate)
    if (isBoss || (isCountdown && (nextStateRef.current === 'BOSS_FIGHT' || nextStateRef.current === 'DLC_BOSS_FIGHT'))) {
      ctx.save();
      ctx.fillStyle = '#ccc';
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 4;
      
      // Boss
      if (isDlcBoss) {
        // Brandenburg Gate (Portão de Brandemburgo)
        ctx.fillStyle = '#e5e5e5';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        // 6 Pillars
        for (let i = 0; i < 6; i++) {
          ctx.fillRect(bossX + i * 25, 120, 15, 480);
          ctx.strokeRect(bossX + i * 25, 120, 15, 480);
        }
        
        // Top beam
        ctx.fillRect(bossX - 10, 80, 160, 40);
        ctx.strokeRect(bossX - 10, 80, 160, 40);
        
        // Quadriga (Horse carriage)
        ctx.fillStyle = 'gold';
        ctx.fillRect(bossX + 50, 20, 40, 60);
        ctx.strokeRect(bossX + 50, 20, 40, 60);
        
        // Text
        ctx.fillStyle = 'black';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText("DESTINO FINAL", bossX + 15, 340);
      } else {
        // Obelisk shape
        ctx.beginPath();
        ctx.moveTo(bossX, CANVAS_HEIGHT);
        ctx.lineTo(bossX + 20, 100);
        ctx.lineTo(bossX + 50, 50); // Tip
        ctx.lineTo(bossX + 80, 100);
        ctx.lineTo(bossX + 100, CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Windows or details
        ctx.fillStyle = '#666';
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(bossX + 45, 150 + i * 80, 10, 20);
        }
      }

      // Projectiles
      ctx.fillStyle = '#ff4444';
      bossProjectilesRef.current.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'red';
      });
      ctx.shadowBlur = 0;

      // Player Projectiles
      ctx.fillStyle = '#ffff00';
      playerProjectilesRef.current.forEach(p => {
        ctx.fillRect(p.x, p.y, 15, 5);
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'yellow';
      });
      ctx.restore();
    }

    // Plane
    ctx.save();
    ctx.translate(100 + PLANE_SIZE/2, planeYRef.current + PLANE_SIZE/2);
    ctx.rotate(Math.min(Math.PI/4, Math.max(-Math.PI/4, velocityRef.current * 0.1)));
    ctx.scale(-1, 1);
    
    if (isInvincible) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'cyan';
    }
    if (feverMode) {
      ctx.shadowBlur = 30;
      ctx.shadowColor = 'red';
    }

    if (planeImgRef.current) {
      ctx.drawImage(planeImgRef.current, -PLANE_SIZE/2, -PLANE_SIZE/2, PLANE_SIZE, PLANE_SIZE);
    } else {
      // Simple Plane Shape
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.ellipse(0, 0, PLANE_SIZE/2, PLANE_SIZE/4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'blue';
      ctx.fillRect(-PLANE_SIZE/4, -PLANE_SIZE/2, PLANE_SIZE/10, PLANE_SIZE);
      ctx.fillRect(PLANE_SIZE/4, -PLANE_SIZE/3, PLANE_SIZE/10, PLANE_SIZE/1.5);
    }

    // Bigodinho Passenger (DLC ONLY)
    if (gameState.startsWith('DLC_')) {
      ctx.save();
      ctx.scale(-1, 1); // Flip back to draw him facing forward
      ctx.fillStyle = '#fdb';
      ctx.beginPath();
      ctx.arc(0, -15, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // The Mustache
      ctx.fillStyle = 'black';
      ctx.fillRect(-6, -10, 12, 3);
      ctx.restore();
    }
    
    ctx.restore();

    // Countdown Overlay (Drawn LAST so it's on top)
    if (isCountdown) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 150px italic';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.ceil(countdown).toString(), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      
      setCountdown(prev => {
        const next = prev - 0.016; // Approx 60fps
        if (next <= 0) setGameState(nextStateRef.current);
        return next;
      });
    }

    frameRef.current = requestAnimationFrame(update);
  }, [gameState, isInvincible, slowMo, feverMode, bossX, bossHp, countdown]);

  // --- Lifecycle ---
  useEffect(() => {
    // Load local assets on mount so they are ready for DLC even if normal game hasn't started
    const loadLocalAssets = async () => {
      try {
        const loadImg = (path: string) => new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.src = path;
          img.onload = () => resolve(img);
          img.onerror = reject;
        });
        
        const [bgImg, towerImg, planeImg, frankfurtImg] = await Promise.all([
          loadImg('/assets/bg.png').catch(() => null),
          loadImg('/assets/tower.png').catch(() => null),
          loadImg('/assets/plane.png').catch(() => null),
          loadImg('/assets/frankfurt.png').catch(() => null)
        ]);
        
        if (bgImg) bgImgRef.current = bgImg;
        if (frankfurtImg) {
          console.log("Frankfurt background loaded successfully!");
          frankfurtImgRef.current = frankfurtImg;
        } else {
          console.log("Frankfurt background not found or failed to load, using dark city fallback.");
        }
        if (towerImg) {
          towerImgRef.current = towerImg;
          towerBoundsRef.current = scanImage(towerImg);
        }
        if (planeImg) {
          planeImgRef.current = planeImg;
          planeBoundsRef.current = scanImage(planeImg);
        }
      } catch (e) {
        console.log("Error pre-loading local assets", e);
      }
    };
    loadLocalAssets();
  }, []);

  useEffect(() => {
    const activeStates: GameState[] = ['PLAYING', 'FRENZY', 'BOSS_FIGHT', 'COUNTDOWN', 'DLC_GERMANY_RIDE', 'DLC_FRENZY_MODE', 'DLC_BOSS_FIGHT'];
    if (activeStates.includes(gameState)) {
      frameRef.current = requestAnimationFrame(update);
      return () => cancelAnimationFrame(frameRef.current);
    }
  }, [gameState, update]);

  // --- Handlers ---
  const buyEnergy = () => {
    if (gems >= 10) {
      setGems(g => g - 10);
      setEnergy(10);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#f97316']
      });
    } else {
      alert("NOT ENOUGH GEMS! BUY MORE WITH YOUR CREDIT CARD!");
      setShowOffer(true);
    }
  };

  const handleJump = () => {
    const isDlcActive = gameState === 'DLC_GERMANY_RIDE' || gameState === 'DLC_FRENZY_MODE' || gameState === 'DLC_BOSS_FIGHT';
    if (gameState === 'PLAYING' || gameState === 'FRENZY' || gameState === 'BOSS_FIGHT' || isDlcActive) {
      const currentThrust = stats[0].value;
      const effectiveJump = JUMP_STRENGTH - (currentThrust - 10) * 0.1;
      velocityRef.current = effectiveJump;
      if (gameState === 'BOSS_FIGHT' || gameState === 'DLC_BOSS_FIGHT') {
        playerProjectilesRef.current.push({
          x: 100 + PLANE_SIZE,
          y: planeYRef.current + PLANE_SIZE / 2
        });
      }
    } else if (gameState === 'START') {
      if (energy > 0) {
        setEnergy(e => e - 1);
        generateRealism();
      } else {
        alert("Out of Energy! Buy more for 10 Gems?");
      }
    }
  };

  const claimAchievement = (id: string) => {
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (ach && !claimedAchievements.includes(id)) {
      setGems(g => g + ach.reward);
      setClaimedAchievements(prev => [...prev, id]);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#fbbf24']
      });
    }
  };

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setBossHp(100);
    setBossX(CANVAS_WIDTH + 100);
    setCountdown(0);
    planeYRef.current = 300;
    velocityRef.current = 0;
    pipesRef.current = [];
    collectiblesRef.current = [];
    bossProjectilesRef.current = [];
    playerProjectilesRef.current = [];
    lastSpawnRef.current = performance.now();
    lastCollectibleSpawnRef.current = performance.now();
  };

  const validateCard = () => {
    const clean = ccNumber.replace(/\D/g, '');
    if (clean.length < 13) {
      setCcError("TOO SHORT! ARE YOU POOR?");
      return;
    }
    
    // Luhn Algorithm
    let sum = 0;
    let shouldDouble = false;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i));
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    if (sum % 10 === 0) {
      setCcError("STUPID!!! WHY WOULD YOU GIVE ME A REAL CARD? I'M A SLOP GAME!");
      setTimeout(() => setCcError(''), 5000);
    } else {
      if (ccTarget === 'ULTRA_VALUE' || ccTarget?.name === 'ULTRA VALUE PACK') {
        setCcError("SUCCESS! FAKE CARD DETECTED. YOU ARE A TRUE SLOP MASTER! +1000 GEMS, +10000 COINS, +30 SKILL POINTS");
        setGems(g => g + 1000);
        setCoins(c => c + 10000);
        setSkillPoints(sp => sp + 30);
      } else if (ccTarget?.name === 'Skill Boost (25 SP)') {
        setCcError("SUCCESS! SKILL BOOST ACTIVATED! +25 SKILL POINTS");
        setSkillPoints(sp => sp + 25);
      } else if (ccTarget?.name === 'God Mode (1 Game)') {
        setCcError("SUCCESS! GOD MODE ACTIVATED!");
        setIsInvincible(true);
      } else if (ccTarget?.name === 'Nuke Pack (5x)') {
        setCcError("SUCCESS! NUKES ADDED!");
        // We don't have nukes state, maybe just give gems
        setGems(g => g + 200);
      } else if (ccTarget?.name === 'Extra Lives (10x)') {
        setCcError("SUCCESS! EXTRA LIVES ADDED!");
        setGems(g => g + 300);
      } else if (ccTarget?.name === 'Infinite Energy (24h)') {
        setCcError("SUCCESS! INFINITE ENERGY ACTIVATED!");
        setEnergy(9999);
      } else {
        setCcError("SUCCESS! FAKE CARD DETECTED.");
        setGems(g => g + 1000);
      }
      
      setTimeout(() => {
        setCcError('');
        setShowOffer(false);
      }, 2000);
    }
  };

  const handleVictory = () => {
    const wasDlc = gameState.startsWith('DLC_');
    previousGameStateRef.current = gameState;
    setIsDlcBoss(false);
    setGameState('VICTORY');
    setCountdown(0);
    cancelAnimationFrame(frameRef.current);
    
    if (wasDlc) {
      if (dlcLevel > dlcHighScore) setDlcHighScore(dlcLevel);
      setCoins(c => c + 10000);
      setGems(g => g + 100);
    } else {
      if (score > highScore) setHighScore(score);
      setCoins(c => c + 5000);
      setGems(g => g + 50);
      setIsDlcUnlocked(true);
    }
    
    confetti({ 
      particleCount: 200, 
      spread: 100, 
      origin: { y: 0.6 },
      colors: wasDlc ? ['#000000', '#ff0000', '#ffcc00'] : undefined // German flag colors for DLC
    });
  };

  const handleGameOver = () => {
    previousGameStateRef.current = gameState;
    setIsDlcBoss(false);
    setIsDlcUnlocked(true); // Unlock DLC button on start screen after game over
    setGameState('GAME_OVER');
    setCountdown(0);
    cancelAnimationFrame(frameRef.current);
    const isDlc = previousGameStateRef.current?.startsWith('DLC_');
    if (isDlc) {
      if (dlcLevel > dlcHighScore) setDlcHighScore(dlcLevel);
    } else {
      if (score > highScore) setHighScore(score);
    }
    const audio = new Audio('https://www.myinstants.com/media/sounds/allahu-akbar.mp3');
    audio.play().catch(() => {});
  };

  const handleLevelUp = () => {
    if (xp >= 100) {
      setLevel(l => {
        const newLevel = l + 1;
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
        return newLevel;
      });
      setXp(0);
      setSkillPoints(s => s + 3);
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
      });
    }
  };

  useEffect(() => {
    handleLevelUp();
  }, [xp]);

  useEffect(() => {
    if (feverCount >= 5) {
      setFeverMode(true);
      setFeverCount(0);
      confetti({
        particleCount: 50,
        spread: 60,
        colors: ['#ff0000', '#ffff00', '#ff00ff']
      });
      setTimeout(() => setFeverMode(false), 10000);
    }
  }, [feverCount]);

  useEffect(() => {
    const chatInterval = setInterval(() => {
      const users = ["Whale_King", "NoobSlayer", "GamerGirl99", "System", "SlopLord"];
      const msgs = [
        "Just spent $500, feeling good!",
        "This game is so realistic...",
        "I love the pay-to-win mechanics!",
        "New limited offer just dropped!",
        "Level 50 reached! F2P btw (not really)",
        "Anyone seen the Burj Khalifa yet?",
      ];
      setChatMessages(prev => [
        ...prev.slice(-4),
        { id: chatCounter.current++, user: users[Math.floor(Math.random() * users.length)], msg: msgs[Math.floor(Math.random() * msgs.length)] }
      ]);
    }, 5000);
    return () => clearInterval(chatInterval);
  }, []);

  useEffect(() => {
    const offerInterval = setInterval(() => {
      if (Math.random() > 0.7 && gameState === 'START') {
        setShowOffer(true);
      }
    }, 30000);
    return () => clearInterval(offerInterval);
  }, [gameState]);

  // --- Render Helpers ---
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-screen bg-black overflow-hidden font-sans text-white select-none text-[11px]">
      {/* --- AAA Slop Header (Smaller) --- */}
      <div className="absolute top-0 left-0 w-full z-50 p-1 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <div className="relative cursor-pointer" onClick={() => setShowVip(true)}>
              <div className="w-6 h-6 rounded-full border border-yellow-500 bg-gray-800 flex items-center justify-center overflow-hidden">
                <User size={12} className="text-gray-400" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 text-black text-[7px] font-bold px-0.5 rounded leading-none">LV {level}</div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Captain Slop</span>
                <Crown size={7} className="text-yellow-500" />
              </div>
              <div className="w-16 h-1 bg-gray-700 rounded-full mt-0.5 overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" 
                  initial={{ width: 0 }}
                  animate={{ width: `${xp}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <div className="bg-black/50 backdrop-blur-md px-1 py-0.5 rounded flex items-center gap-1 border border-white/10">
              <Coins size={8} className="text-yellow-400" />
              <span className="text-[9px] font-mono">{coins}</span>
            </div>
            <div className="bg-black/50 backdrop-blur-md px-1 py-0.5 rounded flex items-center gap-1 border border-white/10">
              <Gem size={8} className="text-blue-400" />
              <span className="text-[9px] font-mono">{gems}</span>
            </div>
            <button 
              onClick={buyEnergy}
              className="bg-black/50 backdrop-blur-md px-1 py-0.5 rounded flex items-center gap-1 border border-white/10 hover:bg-orange-500/20 transition-colors group"
            >
              <Zap size={8} className="text-orange-400 group-hover:scale-125 transition-transform" />
              <span className="text-[9px] font-mono">{energy}/10</span>
              <span className="text-[7px] bg-orange-500 text-black px-0.5 rounded font-bold ml-1">+</span>
            </button>
          </div>
        </div>

        <div className="flex gap-1.5">
          <div className="flex flex-col items-end">
            <button onClick={() => { setCcTarget('ULTRA_VALUE'); setShowOffer(true); }} className="bg-red-600 hover:bg-red-700 px-1.5 py-0.5 rounded text-[8px] font-bold animate-pulse">HOT DEAL</button>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <Settings size={12} />
          </button>
        </div>
      </div>

      {/* --- Main Game Area --- */}
      <div 
        className={cn(
          "relative w-full h-full flex items-center justify-center bg-[#0a1a2f] cursor-pointer",
          gameState === 'LOADING_REALISM' && "cursor-wait"
        )}
        onClick={handleJump}
      >
        <canvas 
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="max-w-full max-h-full shadow-2xl border-4 border-white/10"
        />

        {/* Loading Realism Overlay */}
        <AnimatePresence>
          {gameState === 'LOADING_REALISM' && (
            <motion.div 
              key="loading-realism-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-4"
            >
              <Loader2 size={48} className="text-blue-500 animate-spin" />
              <div className="text-xl font-black italic uppercase tracking-widest animate-pulse">
                GENERATING REALISM...
              </div>
              <div className="text-[10px] text-gray-500 font-bold uppercase">
                Consulting historical archives via Gemini AI
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Cutscenes --- */}
        <AnimatePresence>
          {gameState === 'TRANSCENDENCE' && (
            <motion.div 
              key="transcendence-cutscene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-4"
            >
              <div className="relative w-full max-w-[800px] aspect-[4/3] border-4 md:border-8 border-black bg-white overflow-hidden shadow-2xl">
                <svg viewBox="0 0 800 600" className="w-full h-full">
                  <rect x="0" y="0" width="800" height="600" fill="#87CEEB" />
                  <text x="50" y="50" className="text-2xl md:text-4xl font-bold fill-red-600" style={{ fontFamily: 'Comic Sans MS' }}>OMG HE DODGED IT!!</text>
                  <motion.path 
                    d="M 600 550 L 620 100 L 640 550 Z" 
                    fill="gray" stroke="black" strokeWidth="5"
                    animate={{ scaleY: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  />
                  <motion.g
                    initial={{ x: -100, y: 300 }}
                    animate={{ x: [0, 200, 400, 610], y: [300, 250, 350, 150], rotate: [0, -10, 10, -45] }}
                    transition={{ duration: 4, ease: "linear" }}
                    onAnimationComplete={() => {
                      const audio = new Audio('https://www.myinstants.com/media/sounds/level-up-sound-effect.mp3');
                      audio.play().catch(() => {});
                      setTimeout(() => {
                        nextStateRef.current = 'PLAYING';
                        setCountdown(3);
                        setGameState('COUNTDOWN');
                      }, 1000);
                    }}
                  >
                    <ellipse cx="50" cy="20" rx="40" ry="10" fill="white" stroke="black" strokeWidth="3" />
                    <path d="M 30 20 L 10 0 L 20 20 Z" fill="blue" stroke="black" />
                    <path d="M 70 20 L 90 0 L 80 20 Z" fill="blue" stroke="black" />
                    <text x="40" y="25" className="text-[10px] fill-black">BOEING</text>
                  </motion.g>
                </svg>
                <div className="absolute bottom-2 right-2 bg-yellow-400 text-black p-1 font-bold border-2 border-black rotate-3">
                  TRANSCENDING REALITY...
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'PENTAGON' && (
            <motion.div 
              key="pentagon-cutscene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-4"
            >
              <div className="relative w-full max-w-[800px] aspect-[4/3] border-4 border-black bg-white overflow-hidden shadow-2xl">
                <svg viewBox="0 0 800 600" className="w-full h-full">
                  <rect x="0" y="0" width="800" height="600" fill="#87CEEB" />
                  <text x="50" y="50" className="text-4xl font-bold fill-red-600" style={{ fontFamily: 'Comic Sans MS' }}>NEXT TARGET: PENTAGON!!</text>
                  {/* Pentagon Shape */}
                  <polygon points="400,100 700,300 600,600 200,600 100,300" fill="#555" stroke="black" strokeWidth="10" />
                  <motion.g
                    initial={{ x: -100, y: 300 }}
                    animate={{ x: [0, 300, 600], y: [300, 350, 200], rotate: [0, 10, -20] }}
                    transition={{ duration: 3, ease: "linear" }}
                    onAnimationComplete={() => {
                      const audio = new Audio('https://www.myinstants.com/media/sounds/level-up-sound-effect.mp3');
                      audio.play().catch(() => {});
                      setTimeout(() => {
                        nextStateRef.current = 'PLAYING';
                        setCountdown(3);
                        setGameState('COUNTDOWN');
                      }, 1000);
                    }}
                  >
                    <ellipse cx="50" cy="20" rx="40" ry="10" fill="white" stroke="black" strokeWidth="3" />
                    <path d="M 30 20 L 10 0 L 20 20 Z" fill="blue" stroke="black" />
                    <path d="M 70 20 L 90 0 L 80 20 Z" fill="blue" stroke="black" />
                  </motion.g>
                </svg>
              </div>
            </motion.div>
          )}

          {gameState === 'FRENZY_CUTSCENE' && (
            <motion.div 
              key="frenzy-cutscene"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-red-600 flex flex-col items-center justify-center p-4"
            >
              <h2 className="text-9xl font-black italic text-white animate-bounce uppercase tracking-tighter">FRENZY MODE!!</h2>
              <p className="text-2xl font-bold text-yellow-400 uppercase">SPEED X2 | XP X2 | NO MERCY</p>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                onAnimationComplete={() => {
                  const audio = new Audio('https://www.myinstants.com/media/sounds/level-up-sound-effect.mp3');
                  audio.play().catch(() => {});
                  nextStateRef.current = 'FRENZY';
                  setCountdown(3);
                  setGameState('COUNTDOWN');
                }}
                className="mt-8 text-white font-bold"
              >
                GET READY...
              </motion.div>
            </motion.div>
          )}

          {gameState === 'LIBERTY_CUTSCENE' && (
            <motion.div 
              key="liberty-cutscene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-4"
            >
              <div className="relative w-full max-w-[800px] aspect-[4/3] border-4 border-black bg-white overflow-hidden shadow-2xl">
                <svg viewBox="0 0 800 600" className="w-full h-full">
                  <rect x="0" y="0" width="800" height="600" fill="#87CEEB" />
                  <text x="50" y="50" className="text-4xl font-bold fill-red-600" style={{ fontFamily: 'Comic Sans MS' }}>LADY LIBERTY IS WATCHING!!</text>
                  
                  {/* Statue of Liberty (Simplified Paint Style) */}
                  <rect x="350" y="200" width="100" height="400" fill="#4fd1c5" stroke="black" strokeWidth="5" />
                  <circle cx="400" cy="180" r="40" fill="#4fd1c5" stroke="black" strokeWidth="5" />
                  <path d="M 360 160 L 340 120 L 380 150 Z" fill="#4fd1c5" stroke="black" />
                  <path d="M 400 140 L 400 100 L 410 140 Z" fill="#4fd1c5" stroke="black" />
                  <path d="M 440 160 L 460 120 L 420 150 Z" fill="#4fd1c5" stroke="black" />
                  <rect x="440" y="100" width="20" height="100" fill="#4fd1c5" stroke="black" strokeWidth="3" />
                  <circle cx="450" cy="90" r="15" fill="yellow" stroke="orange" strokeWidth="2" />
                  
                  <motion.g
                    initial={{ x: -100, y: 300 }}
                    animate={{ x: [0, 300, 600], y: [300, 250, 350], rotate: [0, -10, 10] }}
                    transition={{ duration: 3, ease: "linear" }}
                    onAnimationComplete={() => {
                      const audio = new Audio('https://www.myinstants.com/media/sounds/level-up-sound-effect.mp3');
                      audio.play().catch(() => {});
                      setTimeout(() => {
                        nextStateRef.current = 'PLAYING';
                        setCountdown(3);
                        setGameState('COUNTDOWN');
                      }, 1000);
                    }}
                  >
                    <ellipse cx="50" cy="20" rx="40" ry="10" fill="white" stroke="black" strokeWidth="3" />
                    <path d="M 30 20 L 10 0 L 20 20 Z" fill="blue" stroke="black" />
                    <path d="M 70 20 L 90 0 L 80 20 Z" fill="blue" stroke="black" />
                  </motion.g>
                </svg>
              </div>
            </motion.div>
          )}

          {gameState === 'BOSS_CUTSCENE' && (
            <motion.div 
              key="boss-cutscene"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4"
            >
              <h2 className="text-7xl font-black italic text-red-600 animate-pulse uppercase tracking-tighter text-center">FINAL BOSS:<br/>WASHINGTON MONUMENT</h2>
              <p className="text-xl font-bold text-white mt-4 uppercase">THE ULTIMATE OBELISK AWAITS</p>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
                onAnimationComplete={() => {
                  const audio = new Audio('https://www.myinstants.com/media/sounds/level-up-sound-effect.mp3');
                  audio.play().catch(() => {});
                  nextStateRef.current = 'BOSS_FIGHT';
                  setCountdown(3);
                  setGameState('COUNTDOWN');
                }}
                className="mt-8 text-white font-bold"
              >
                PREPARE FOR IMPACT...
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boss HP Bar */}
        {(gameState === 'BOSS_FIGHT' || gameState === 'DLC_BOSS_FIGHT') && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-4 bg-gray-800 border-2 border-red-500 rounded-full overflow-hidden z-[50]">
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: `${isDlcBoss ? (bossHp / 200) * 100 : bossHp}%` }}
              className="h-full bg-red-600"
            />
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white uppercase">
              {isDlcBoss ? 'Brandenburg Gate' : 'Washington Monument'}
            </div>
          </div>
        )}

        {/* --- UI Overlays --- */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          {gameState === 'START' && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto bg-black/80 backdrop-blur-xl p-8 rounded-3xl border-2 border-white/20 flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-red-500 uppercase">
                Avoid 9/11
              </h1>
              <p className="text-gray-400 font-bold tracking-widest text-sm">CIVIL AVIATION SIMULATOR 2026</p>
              
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={handleJump}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 py-4 rounded-xl font-black text-2xl shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-1 active:shadow-none transition-all"
                >
                  TAP TO THRUST
                </button>

                {isDlcUnlocked && (
                  <button 
                    onClick={() => {
                      planeYRef.current = 300;
                      velocityRef.current = 0;
                      pipesRef.current = [];
                      setGameState('DLC_CLT_CUTSCENE');
                    }}
                    className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-xl font-black text-lg shadow-[0_4px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all border-2 border-yellow-400"
                  >
                    INICIAR DLC: LIXO DE LADO
                  </button>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (coins >= 1000) {
                        setCoins(c => c - 1000);
                        setGems(g => g + 10);
                        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                      } else {
                        alert("Need 1000 Coins for 10 Gems!");
                      }
                    }}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black py-2 rounded-lg font-black text-[10px] uppercase shadow-[0_2px_0_rgb(161,98,7)] active:translate-y-0.5 active:shadow-none"
                  >
                    1000C ➔ 10G
                  </button>
                  <button 
                    onClick={() => {
                      if (gems >= 10) {
                        setGems(g => g - 10);
                        setCoins(c => c + 500);
                        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                      } else {
                        alert("Need 10 Gems for 500 Coins!");
                      }
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-400 text-white py-2 rounded-lg font-black text-[10px] uppercase shadow-[0_2px_0_rgb(30,64,175)] active:translate-y-0.5 active:shadow-none"
                  >
                    10G ➔ 500C
                  </button>
                </div>
                <p className="text-center text-[10px] text-gray-500 font-bold uppercase animate-pulse">
                  Find Blue Orbs in-game for Energy!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <button onClick={() => setShowStats(true)} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-xl flex items-center justify-center gap-2 border border-white/5">
                  <Dna size={18} className="text-purple-400" />
                  <span className="font-bold text-xs">SKILLS</span>
                </button>
                <motion.button 
                  onClick={() => setShowShop(true)} 
                  animate={{ x: [0, -2, 2, -2, 2, 0], y: [0, -2, 2, -2, 2, 0] }}
                  transition={{ repeat: Infinity, duration: 0.00000000000001 }}
                  className="bg-gray-800 hover:bg-gray-700 p-3 rounded-xl flex items-center justify-center gap-2 border border-white/5"
                >
                  <ShoppingBag size={18} className="text-yellow-400" />
                  <span className="font-bold text-xs">SHOP</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {(gameState === 'PLAYING' || gameState === 'BOSS_FIGHT' || gameState === 'FRENZY' || gameState.startsWith('DLC_')) && (
            <>
              <div className="absolute top-32 text-8xl font-black italic opacity-20 select-none pointer-events-none">
                {score}
              </div>

              {gameState.startsWith('DLC_') && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 text-4xl font-black italic text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                  LEVEL {dlcLevel}
                </div>
              )}
              
              {/* Pay-to-Win Mid-game UI */}
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto z-50">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (gems >= 10) {
                      setGems(g => g - 10);
                      setIsInvincible(true);
                      setTimeout(() => setIsInvincible(false), 5000);
                    } else {
                      alert("NOT ENOUGH GEMS!");
                    }
                  }}
                  className="bg-blue-600/80 backdrop-blur-md px-4 py-2 rounded-xl border-2 border-blue-400 flex flex-col items-center gap-1 hover:scale-105 transition-transform"
                >
                  <Shield size={20} />
                  <span className="text-[8px] font-black uppercase">SHIELD (10G)</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (gems >= 5) {
                      setGems(g => g - 5);
                      setSlowMo(true);
                      setTimeout(() => setSlowMo(false), 8000);
                    } else {
                      alert("NOT ENOUGH GEMS!");
                    }
                  }}
                  className="bg-purple-600/80 backdrop-blur-md px-4 py-2 rounded-xl border-2 border-purple-400 flex flex-col items-center gap-1 hover:scale-105 transition-transform"
                >
                  <Clock size={20} />
                  <span className="text-[8px] font-black uppercase">SLOWMO (5G)</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (gems >= 20) {
                      setGems(g => g - 20);
                      pipesRef.current = [];
                      bossProjectilesRef.current = [];
                    } else {
                      alert("NOT ENOUGH GEMS!");
                    }
                  }}
                  className="bg-red-600/80 backdrop-blur-md px-4 py-2 rounded-xl border-2 border-red-400 flex flex-col items-center gap-1 hover:scale-105 transition-transform"
                >
                  <Skull size={20} />
                  <span className="text-[8px] font-black uppercase">NUKE (20G)</span>
                </button>
              </div>
            </>
          )}

          {gameState === 'DLC_CLT_CUTSCENE' && (
            <motion.div 
              key="dlc-clt-cutscene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-4"
            >
              <div className="relative w-full max-w-[800px] aspect-[4/3] border-4 border-black bg-white overflow-hidden shadow-2xl">
                <svg viewBox="0 0 800 600" className="w-full h-full">
                  <rect x="0" y="0" width="800" height="600" fill="white" />
                  
                  {/* Actual Plane Image (Lixo de Lado) */}
                  <motion.g
                    initial={{ x: 100, y: 300 }}
                    animate={{ x: [100, 110, 100], y: [300, 310, 300] }}
                    transition={{ repeat: Infinity, duration: 0.1 }}
                  >
                    <ellipse cx="50" cy="20" rx="40" ry="15" fill="white" stroke="black" strokeWidth="3" />
                    <circle cx="70" cy="15" r="5" fill="cyan" stroke="black" />
                    <text x="30" y="25" className="text-[8px] fill-black font-bold bg-white/50">LIXO DE LADO</text>
                    
                    {/* Blue stripe */}
                    <rect x="20" y="10" width="15" height="10" fill="#004dcf" stroke="black" />

                    {/* Sweat drops */}
                    <motion.circle 
                      cx="80" cy="10" r="2" fill="blue"
                      animate={{ y: [0, 20], opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    />
                  </motion.g>

                  {/* Tower approaching */}
                  <motion.rect 
                    x={800} y={100} width={100} height={500} fill="gray" stroke="black" strokeWidth="5"
                    animate={{ x: [800, 150] }}
                    transition={{ duration: 2, ease: "linear" }}
                  />

                  {/* THE CLT CARD hitting the plane */}
                  <motion.g
                    initial={{ x: 800, y: -100, rotate: 0 }}
                    animate={{ x: 150, y: 300, rotate: 720 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                  >
                    <rect x="-30" y="-45" width="60" height="90" fill="#004dcf" stroke="black" strokeWidth="3" />
                    <rect x="-25" y="-40" width="50" height="10" fill="white" />
                    <text x="-20" y="-32" className="text-[10px] fill-black font-bold">CLT</text>
                    <rect x="-25" y="-20" width="50" height="5" fill="white" />
                    <rect x="-25" y="-10" width="50" height="5" fill="white" />
                    <rect x="-25" y="0" width="50" height="5" fill="white" />
                  </motion.g>

                  {/* Bigodinho asking for a ride */}
                  <motion.g
                    initial={{ x: 400, y: 700 }}
                    animate={{ y: 400 }}
                    transition={{ delay: 2, duration: 1, type: "spring" }}
                  >
                    <circle cx="0" cy="0" r="50" fill="#fdb" stroke="black" strokeWidth="3" />
                    <path d="M -30 10 Q 0 30 30 10" fill="black" stroke="black" strokeWidth="2" />
                    <path d="M -30 10 L -20 20 L 0 15 L 20 20 L 30 10 Z" fill="black" />
                    <rect x="-40" y="-60" width="80" height="30" fill="white" stroke="black" />
                    <text x="0" y="-40" textAnchor="middle" className="text-[10px] fill-black font-bold">ME LEVA?</text>
                  </motion.g>

                  <motion.text 
                    x="400" y="100" className="text-5xl font-bold fill-red-600" 
                    style={{ fontFamily: 'Comic Sans MS' }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2.5 }}
                  >
                    UBER DE AVIÃO!!!
                  </motion.text>

                  {/* Teleportation Flash */}
                  <motion.rect 
                    x="0" y="0" width="800" height="600" fill="white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ delay: 3, duration: 0.5 }}
                    onAnimationComplete={() => setGameState('DLC_GERMANY_INTRO')}
                  />
                </svg>
              </div>
            </motion.div>
          )}

          {gameState === 'DLC_GERMANY_INTRO' && (
            <motion.div 
              key="dlc-germany-intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-4"
            >
              <div className="relative w-full max-w-[800px] aspect-[4/3] border-4 border-black bg-white overflow-hidden shadow-2xl">
                <svg viewBox="0 0 800 600" className="w-full h-full">
                  {/* Background */}
                  <rect x="0" y="0" width="800" height="600" fill="white" />
                  
                  <text x="400" y="100" textAnchor="middle" className="text-6xl font-black fill-black" style={{ fontFamily: 'Impact' }}>FRANKFURT!</text>
                  <text x="400" y="160" textAnchor="middle" className="text-2xl font-bold fill-red-600 italic">CARONA</text>
                  
                  {/* Bigodinho (The Mustache Guy) */}
                  <motion.g
                    initial={{ y: 600 }}
                    animate={{ y: 300 }}
                    transition={{ duration: 1, type: "spring" }}
                  >
                    <circle cx="400" cy="0" r="100" fill="#fdb" stroke="black" strokeWidth="5" />
                    {/* The Iconic Mustache */}
                    <path d="M 340 20 Q 400 60 460 20" fill="black" stroke="black" strokeWidth="2" />
                    <path d="M 340 20 L 320 40 L 400 30 L 480 40 L 460 20 Z" fill="black" />
                    <text x="400" y="-20" textAnchor="middle" className="text-2xl font-bold fill-black">BIGODÃO</text>
                  </motion.g>

                  <motion.g
                    initial={{ x: -200, y: 300 }}
                    animate={{ x: 800 }}
                    transition={{ delay: 2, duration: 3 }}
                    onAnimationComplete={() => {
                      setDlcLevel(1);
                      nextStateRef.current = 'DLC_GERMANY_RIDE';
                      setCountdown(3);
                      setGameState('COUNTDOWN');
                    }}
                  >
                    <ellipse cx="50" cy="20" rx="40" ry="15" fill="white" stroke="black" strokeWidth="3" />
                    <text x="30" y="25" className="text-[8px] fill-black font-bold">LIXO DE LADO</text>
                  </motion.g>

                  <text x="400" y="550" textAnchor="middle" className="text-2xl font-bold fill-black animate-pulse">DANDO UMA VOLTINHA...</text>
                </svg>
              </div>
            </motion.div>
          )}

          {gameState === 'DLC_LEVEL_11_CUTSCENE' && (
            <motion.div 
              key="dlc-level-11-cutscene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-4"
            >
              <div className="relative w-full max-w-[800px] aspect-[4/3] border-4 border-black bg-white overflow-hidden shadow-2xl">
                <svg viewBox="0 0 800 600" className="w-full h-full">
                  <rect x="0" y="0" width="800" height="600" fill="white" />
                  <text x="50" y="50" className="text-4xl font-bold fill-red-600" style={{ fontFamily: 'Comic Sans MS' }}>COLOGNE CATHEDRAL!!</text>
                  
                  {/* Cologne Cathedral (Simplified) */}
                  <path d="M 300 600 L 300 100 L 350 50 L 400 100 L 400 600" fill="#444" stroke="black" strokeWidth="5" />
                  <path d="M 400 600 L 400 100 L 450 50 L 500 100 L 500 600" fill="#444" stroke="black" strokeWidth="5" />
                  <rect x="350" y="200" width="100" height="400" fill="#333" stroke="black" strokeWidth="3" />
                  
                    <motion.g
                      initial={{ x: -100, y: 300 }}
                      animate={{ x: [0, 300, 600], y: [300, 250, 350], rotate: [0, -10, 10] }}
                      transition={{ duration: 3, ease: "linear" }}
                      onAnimationComplete={() => {
                        setTimeout(() => {
                          nextStateRef.current = 'DLC_GERMANY_RIDE';
                          setCountdown(3);
                          setGameState('COUNTDOWN');
                        }, 1000);
                      }}
                    >
                      <ellipse cx="50" cy="20" rx="40" ry="15" fill="white" stroke="black" strokeWidth="3" />
                      <circle cx="70" cy="15" r="5" fill="cyan" stroke="black" />
                      <text x="30" y="25" className="text-[8px] fill-black font-bold bg-white/50">LIXO DE LADO</text>
                    </motion.g>
                </svg>
              </div>
            </motion.div>
          )}

          {gameState === 'DLC_LEVEL_20_CUTSCENE' && (
            <motion.div 
              key="dlc-level-20-cutscene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-4"
            >
              <div className="relative w-full max-w-[800px] aspect-[4/3] border-4 border-black bg-white overflow-hidden shadow-2xl">
                <svg viewBox="0 0 800 600" className="w-full h-full">
                  <rect x="0" y="0" width="800" height="600" fill="white" />
                  <text x="50" y="50" className="text-4xl font-bold fill-red-600" style={{ fontFamily: 'Comic Sans MS' }}>NEUSCHWANSTEIN CASTLE!!</text>
                  
                  {/* Castle (Simplified) */}
                  <rect x="300" y="300" width="200" height="300" fill="#eee" stroke="black" strokeWidth="3" />
                  <rect x="280" y="200" width="40" height="400" fill="#eee" stroke="black" strokeWidth="3" />
                  <rect x="480" y="200" width="40" height="400" fill="#eee" stroke="black" strokeWidth="3" />
                  <path d="M 280 200 L 300 150 L 320 200 Z" fill="blue" stroke="black" />
                  <path d="M 480 200 L 500 150 L 520 200 Z" fill="blue" stroke="black" />
                  
                    <motion.g
                      initial={{ x: -100, y: 300 }}
                      animate={{ x: [0, 300, 600], y: [300, 350, 250], rotate: [0, 10, -10] }}
                      transition={{ duration: 3, ease: "linear" }}
                      onAnimationComplete={() => {
                        setTimeout(() => {
                          nextStateRef.current = 'DLC_GERMANY_RIDE';
                          setCountdown(3);
                          setGameState('COUNTDOWN');
                        }, 1000);
                      }}
                    >
                      <ellipse cx="50" cy="20" rx="40" ry="15" fill="white" stroke="black" strokeWidth="3" />
                      <circle cx="70" cy="15" r="5" fill="cyan" stroke="black" />
                      <text x="30" y="25" className="text-[8px] fill-black font-bold bg-white/50">LIXO DE LADO</text>
                    </motion.g>
                </svg>
              </div>
            </motion.div>
          )}

          {gameState === 'DLC_FRENZY_CUTSCENE' && (
            <motion.div 
              key="dlc-frenzy-cutscene"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-4"
            >
              <h2 className="text-9xl font-black italic text-red-600 animate-bounce uppercase tracking-tighter">SCHNELLER!!</h2>
              <p className="text-2xl font-bold text-black uppercase">FASTER | HARDER | GERMAN POWER</p>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                onAnimationComplete={() => {
                  nextStateRef.current = 'DLC_FRENZY_MODE';
                  setCountdown(3);
                  setGameState('COUNTDOWN');
                }}
                className="mt-8 text-black font-bold"
              >
                BEREIT MACHEN...
              </motion.div>
            </motion.div>
          )}

          {gameState === 'DLC_LEVEL_40_CUTSCENE' && (
            <motion.div 
              key="dlc-level-40-cutscene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-4"
            >
              <div className="relative w-full max-w-[800px] aspect-[4/3] border-4 border-black bg-white overflow-hidden shadow-2xl">
                <svg viewBox="0 0 800 600" className="w-full h-full">
                  <rect x="0" y="0" width="800" height="600" fill="white" />
                  <text x="50" y="50" className="text-4xl font-bold fill-red-600" style={{ fontFamily: 'Comic Sans MS' }}>BERLIN TV TOWER!!</text>
                  
                  {/* TV Tower (Simplified) */}
                  <rect x="395" y="100" width="10" height="500" fill="#999" stroke="black" strokeWidth="2" />
                  <circle cx="400" cy="200" r="40" fill="#ccc" stroke="black" strokeWidth="3" />
                  <rect x="398" y="50" width="4" height="50" fill="red" />
                  
                    <motion.g
                      initial={{ x: -100, y: 300 }}
                      animate={{ x: [0, 300, 600], y: [300, 200, 400], rotate: [0, -20, 20] }}
                      transition={{ duration: 3, ease: "linear" }}
                      onAnimationComplete={() => {
                        setTimeout(() => {
                          nextStateRef.current = 'DLC_GERMANY_RIDE';
                          setCountdown(3);
                          setGameState('COUNTDOWN');
                        }, 1000);
                      }}
                    >
                      <ellipse cx="50" cy="20" rx="40" ry="15" fill="white" stroke="black" strokeWidth="3" />
                      <circle cx="70" cy="15" r="5" fill="cyan" stroke="black" />
                      <text x="30" y="25" className="text-[8px] fill-black font-bold bg-white/50">LIXO DE LADO</text>
                    </motion.g>
                </svg>
              </div>
            </motion.div>
          )}

          {gameState === 'DLC_BOSS_CUTSCENE' && (
            <motion.div 
              key="dlc-boss-cutscene"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-4"
            >
              <h2 className="text-7xl font-black italic text-red-600 animate-pulse uppercase tracking-tighter text-center">DLC BOSS:<br/>PORTÃO DE BRANDEMBURGO</h2>
              <p className="text-xl font-bold text-black mt-4 uppercase">CHEGUE A TEMPO!</p>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
                onAnimationComplete={() => {
                  nextStateRef.current = 'DLC_BOSS_FIGHT';
                  setCountdown(3);
                  setGameState('COUNTDOWN');
                }}
                className="mt-8 text-black font-bold"
              >
                ENTREGA FINAL!
              </motion.div>
            </motion.div>
          )}

          {gameState === 'GAME_OVER' && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="pointer-events-auto bg-red-950/90 backdrop-blur-2xl p-8 rounded-3xl border-4 border-red-500/50 flex flex-col items-center gap-4 max-w-sm w-full"
            >
              <Skull size={64} className="text-red-500 animate-bounce" />
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Mission Failed</h2>
              
              <div className="bg-black/50 w-full p-4 rounded-2xl border border-white/10 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold text-xs uppercase">Score</span>
                  <span className="text-2xl font-black text-white">{score}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold text-xs uppercase">Best</span>
                  <span className="text-xl font-black text-yellow-500">{highScore}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-white/10 flex justify-center">
                  <span className="text-red-500 font-black text-2xl animate-pulse">{(score * 2996).toLocaleString()} KILL!</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={() => {
                    if (gems >= 5) {
                      setGems(g => g - 5);
                      setGameState(previousGameStateRef.current);
                      planeYRef.current = 300;
                      velocityRef.current = 0;
                      if (previousGameStateRef.current !== 'BOSS_FIGHT') {
                        pipesRef.current = [];
                      } else {
                        bossProjectilesRef.current = [];
                      }
                    } else {
                      alert("Not enough Gems!");
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_0_rgb(30,64,175)] active:translate-y-1 active:shadow-none"
                >
                  <Gem size={18} />
                  REVIVE (5 GEMS)
                </button>
                <div className="flex gap-2 w-full">
                  <select 
                    value={skipTarget}
                    onChange={(e) => setSkipTarget(Number(e.target.value))}
                    className="bg-gray-800 border border-white/20 rounded-xl px-2 py-3 text-sm font-bold text-white outline-none flex-1"
                  >
                    {previousGameStateRef.current?.startsWith('DLC_') ? (
                      <>
                        <option value={11}>DLC Phase 11 (Cologne)</option>
                        <option value={20}>DLC Phase 20 (Berlin)</option>
                        <option value={30}>DLC Phase 30 (Frenzy)</option>
                        <option value={40}>DLC Phase 40 (Munich)</option>
                        <option value={50}>DLC Phase 50 (Boss)</option>
                      </>
                    ) : (
                      <>
                        <option value={11}>Phase 11 (Cutscene)</option>
                        <option value={20}>Phase 20 (Pentagon)</option>
                        <option value={30}>Phase 30 (Frenzy)</option>
                        <option value={40}>Phase 40 (Liberty)</option>
                        <option value={50}>Phase 50 (Boss)</option>
                      </>
                    )}
                  </select>
                  <button 
                    onClick={() => {
                      if (gems >= 50) {
                        setGems(g => g - 50);
                        const isDlc = previousGameStateRef.current?.startsWith('DLC_');
                        if (isDlc) {
                          setDlcLevel(skipTarget);
                          if (skipTarget === 11) setGameState('DLC_LEVEL_11_CUTSCENE');
                          else if (skipTarget === 20) setGameState('DLC_LEVEL_20_CUTSCENE');
                          else if (skipTarget === 30) setGameState('DLC_FRENZY_CUTSCENE');
                          else if (skipTarget === 40) setGameState('DLC_LEVEL_40_CUTSCENE');
                          else if (skipTarget === 50) {
                            setGameState('DLC_BOSS_CUTSCENE');
                            setIsDlcBoss(true);
                          }
                          setBossHp(200);
                        } else {
                          setScore(skipTarget);
                          if (skipTarget === 11) setGameState('TRANSCENDENCE');
                          else if (skipTarget === 20) setGameState('PENTAGON');
                          else if (skipTarget === 30) setGameState('FRENZY_CUTSCENE');
                          else if (skipTarget === 40) setGameState('LIBERTY_CUTSCENE');
                          else if (skipTarget === 50) setGameState('BOSS_CUTSCENE');
                          setBossHp(100);
                        }
                        planeYRef.current = 300;
                        velocityRef.current = 0;
                        pipesRef.current = [];
                        setBossX(CANVAS_WIDTH + 100);
                      } else {
                        alert("Not enough Gems!");
                      }
                    }}
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_0_rgb(161,98,7)] active:translate-y-1 active:shadow-none"
                  >
                    <Sparkles size={18} />
                    TP (50G)
                  </button>
                </div>
                <button 
                  onClick={() => setGameState('START')}
                  className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-bold"
                >
                  BACK TO HANGAR
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'VICTORY' && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "pointer-events-auto backdrop-blur-2xl p-8 rounded-3xl border-4 flex flex-col items-center gap-4 max-w-sm w-full",
                previousGameStateRef.current?.startsWith('DLC_') ? "bg-red-950/90 border-yellow-500/50" : "bg-green-950/90 border-green-500/50"
              )}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <Crown size={64} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                <h1 className={cn(
                  "text-5xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b drop-shadow-sm",
                  previousGameStateRef.current?.startsWith('DLC_') ? "from-yellow-300 to-red-600" : "from-green-300 to-green-600"
                )}>
                  {previousGameStateRef.current?.startsWith('DLC_') ? "DLC CLEAR!" : "VICTORY!"}
                </h1>
                <p className="text-white/80 font-bold text-sm uppercase">
                  {previousGameStateRef.current?.startsWith('DLC_') ? "UBER ENTREGUE COM SUCESSO!" : "YOU SAVED THE WORLD!"}
                </p>
              </div>

              <div className="bg-black/40 w-full p-4 rounded-2xl flex flex-col items-center gap-2 border border-white/10">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  {previousGameStateRef.current?.startsWith('DLC_') ? "DLC Level" : "Final Score"}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">
                    {previousGameStateRef.current?.startsWith('DLC_') ? dlcLevel : score}
                  </span>
                  <span className="text-xl font-black text-yellow-500">PB: {highScore}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-white/10 flex justify-center w-full">
                  <span className="text-yellow-400 font-black text-xl animate-pulse">
                    {previousGameStateRef.current?.startsWith('DLC_') ? "+10000 COINS! +100 GEMS!" : "+5000 COINS! +50 GEMS!"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={() => {
                    setGameState('START');
                  }}
                  className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-black text-xl shadow-[0_6px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none uppercase"
                >
                  CLAIM REWARDS
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* --- AAA Slop Sidebar (Smaller) --- */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1.5">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          onClick={() => setShowLeaderboard(true)}
          className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-700 rounded-lg flex items-center justify-center shadow-lg border border-white/20"
        >
          <Trophy size={14} className="text-white" />
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          onClick={() => setShowBattlePass(true)}
          className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg border border-white/20"
        >
          <Crown size={14} className="text-white" />
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          onClick={() => setShowLootbox(true)}
          className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg border border-white/20"
        >
          <Gift size={14} className="text-white" />
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          onClick={() => setShowPets(true)}
          className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center shadow-lg border border-white/20"
        >
          <Heart size={14} className="text-white" />
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          onClick={() => setShowArtifacts(true)}
          className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg border border-white/20"
        >
          <Sparkles size={14} className="text-white" />
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          onClick={() => setShowGuilds(true)}
          className="w-8 h-8 bg-gradient-to-br from-gray-600 to-slate-800 rounded-lg flex items-center justify-center shadow-lg border border-white/20"
        >
          <Building2 size={14} className="text-white" />
        </motion.button>
      </div>

      {/* --- Global Chat (Smaller) --- */}
      <div className="absolute bottom-14 left-1.5 w-40 h-16 bg-black/40 backdrop-blur-sm rounded-lg border border-white/5 p-1 overflow-hidden pointer-events-none z-40">
        <div className="text-[6px] font-black text-blue-400 mb-0.5 uppercase tracking-widest">Global Chat</div>
        <div className="flex flex-col gap-0.5">
          {chatMessages.map((m) => (
            <div key={m.id} className="text-[6px] leading-tight truncate">
              <span className="font-black text-yellow-500">{m.user}: </span>
              <span className="text-gray-300">{m.msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- Modals --- */}
      <AnimatePresence>
        {/* Artifacts Modal */}
        {showArtifacts && (
          <motion.div 
            key="artifacts-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 w-full max-w-md rounded-3xl border-2 border-indigo-500/30 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-indigo-600/20 to-transparent">
                <h2 className="text-lg font-black italic uppercase flex items-center gap-2">
                  <Sparkles className="text-indigo-400" />
                  Ancient Artifacts
                </h2>
                <button onClick={() => setShowArtifacts(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {ARTIFACTS.map(art => {
                  const isOwned = artifacts.includes(art.id);
                  return (
                    <div key={art.id} className="bg-gray-800 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
                      <div className="text-2xl text-center">{art.icon}</div>
                      <div className="flex flex-col text-center">
                        <span className="font-bold text-xs">{art.name}</span>
                        <span className="text-[8px] text-gray-400">{art.description}</span>
                      </div>
                      {isOwned ? (
                        <div className="bg-indigo-500/20 text-indigo-400 py-1 rounded text-[8px] font-bold text-center uppercase">Equipped</div>
                      ) : (
                        <button 
                          onClick={() => {
                            if (gems >= art.price) {
                              setGems(g => g - art.price);
                              setArtifacts(a => [...a, art.id]);
                              confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                            } else {
                              alert("Not enough Gems!");
                            }
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 py-1 rounded text-[8px] font-bold flex items-center justify-center gap-1"
                        >
                          <Gem size={8} /> {art.price}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Battle Pass Modal */}
        {showBattlePass && (
          <motion.div 
            key="battle-pass-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 w-full max-w-md rounded-3xl border-2 border-purple-500/30 overflow-hidden flex flex-col h-[70vh]">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-purple-600/20 to-transparent">
                <h2 className="text-lg font-black italic uppercase flex items-center gap-2">
                  <Crown className="text-purple-400" />
                  Season 1: Slop Skies
                </h2>
                <button onClick={() => setShowBattlePass(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
              </div>
              <div className="p-4 bg-purple-900/20 border-b border-white/5 flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <span>Progress</span>
                  <span>{battlePassXp} XP</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, (battlePassXp / 3000) * 100)}%` }} />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {BP_REWARDS.map(reward => {
                  const isUnlocked = battlePassXp >= reward.level * 100;
                  const isClaimed = claimedBpRewards.includes(reward.level);
                  return (
                    <div key={reward.level} className={cn(
                      "bg-gray-800 p-3 rounded-xl border flex justify-between items-center",
                      isUnlocked ? "border-purple-500/50" : "border-white/5 opacity-50"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-900/40 rounded flex items-center justify-center font-black text-xs">
                          {reward.level}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{reward.reward}</span>
                          <span className="text-[8px] text-gray-500 uppercase">Level {reward.level} Reward</span>
                        </div>
                      </div>
                      {isClaimed ? (
                        <div className="text-green-500 text-[8px] font-black uppercase">Claimed</div>
                      ) : isUnlocked ? (
                        <button 
                          onClick={() => {
                            setClaimedBpRewards(prev => [...prev, reward.level]);
                            if (reward.type === 'COINS') setCoins(c => c + (reward.value as number));
                            if (reward.type === 'GEMS') setGems(g => g + (reward.value as number));
                            if (reward.type === 'ARTIFACT') setArtifacts(a => [...a, reward.value as string]);
                            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                          }}
                          className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-[8px] font-black uppercase"
                        >
                          Claim
                        </button>
                      ) : (
                        <Lock size={12} className="text-gray-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
        {/* Level Up Popup */}
        {showLevelUp && (
          <motion.div 
            key="level-up-popup"
              initial={{ scale: 0, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 2, opacity: 0 }}
              className="fixed inset-0 z-[1000] pointer-events-none flex flex-col items-center justify-center"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 -m-20 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 blur-3xl opacity-50 rounded-full"
                />
                <h2 className="text-9xl font-black italic text-white uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] relative z-10">
                  LEVEL UP!
                </h2>
                <div className="text-center text-4xl font-black text-yellow-500 uppercase tracking-[0.5em] mt-4 relative z-10">
                  REACHED LEVEL {level}
                </div>
              </div>
            </motion.div>
          )}

        {/* Missions Modal */}
        {showAchievements && (
          <motion.div 
            key="missions-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 w-full max-w-md rounded-3xl border-2 border-emerald-500/30 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-emerald-600/20 to-transparent">
                <h2 className="text-lg font-black italic uppercase flex items-center gap-2">
                  <Target className="text-emerald-500" />
                  Flight Missions
                </h2>
                <button onClick={() => setShowAchievements(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {ACHIEVEMENTS.map(ach => {
                  const isCompleted = (ach.id === '1' && highScore >= 1) || 
                                     (ach.id === '2' && highScore >= 10) || 
                                     (ach.id === '3' && level >= 10);
                  const isClaimed = claimedAchievements.includes(ach.id);

                  return (
                    <div key={ach.id} className="bg-gray-800 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{ach.title}</span>
                        <span className="text-[10px] text-gray-400">{ach.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-yellow-500">+{ach.reward} GEMS</span>
                        {isClaimed ? (
                          <div className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-[8px] font-bold">CLAIMED</div>
                        ) : isCompleted ? (
                          <button 
                            onClick={() => claimAchievement(ach.id)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1 rounded text-[8px] font-bold animate-pulse"
                          >
                            CLAIM
                          </button>
                        ) : (
                          <div className="bg-gray-700 text-gray-500 px-2 py-1 rounded text-[8px] font-bold">LOCKED</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Pet Modal */}
        {showPets && (
          <motion.div 
            key="pet-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 w-full max-w-md rounded-3xl border-2 border-pink-500/30 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-pink-600/20 to-transparent">
                <h2 className="text-lg font-black italic uppercase flex items-center gap-2">
                  <Heart className="text-pink-500" />
                  Pet Sanctuary
                </h2>
                <button onClick={() => setShowPets(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
              </div>
              <div className="p-6 flex flex-col items-center gap-4">
                <div className="w-24 h-24 bg-pink-500/10 rounded-full flex items-center justify-center border-2 border-pink-500 animate-bounce">
                  <Plane size={40} className="text-pink-400 rotate-45" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold">Lil' Boeing</h3>
                  <p className="text-xs text-gray-400">Level {petLevel} Companion</p>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500" style={{ width: `${petXp}%` }} />
                </div>
                <button className="w-full bg-pink-600 py-3 rounded-xl font-bold hover:bg-pink-500 transition-colors">
                  FEED PET (50 COINS)
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Guilds Modal */}
        {showGuilds && (
          <motion.div 
            key="guilds-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 w-full max-w-md rounded-3xl border-2 border-slate-500/30 overflow-hidden flex flex-col h-[60vh]">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-slate-600/20 to-transparent">
                <h2 className="text-lg font-black italic uppercase flex items-center gap-2">
                  <Building2 className="text-slate-400" />
                  Aviation Guilds
                </h2>
                <button onClick={() => setShowGuilds(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {[
                  { name: "Sky High Elites", members: 48, level: 15, tag: "SHE" },
                  { name: "Boeing Bandits", members: 32, level: 12, tag: "BB" },
                  { name: "Slop Squad", members: 50, level: 20, tag: "SLP" },
                  { name: "Cloud Chasers", members: 15, level: 5, tag: "CC" },
                ].map(g => (
                  <div key={g.name} className="bg-gray-800 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center font-black text-xl">
                        {g.name[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">[{g.tag}] {g.name}</span>
                        <span className="text-[10px] text-gray-500 uppercase">{g.members}/50 Members • LVL {g.level}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (level >= 5) {
                          setGuild(g.tag);
                          alert(`Joined ${g.name}!`);
                        } else {
                          alert("Requires Level 5!");
                        }
                      }}
                      className={cn(
                        "px-3 py-1 rounded text-[8px] font-black uppercase",
                        guild === g.tag ? "bg-green-600 text-white" : "bg-slate-700 hover:bg-slate-600"
                      )}
                    >
                      {guild === g.tag ? "Joined" : "Join"}
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-white/5 text-center">
                <p className="text-[8px] text-gray-500 uppercase font-black">Reach Level 20 to create your own guild!</p>
              </div>
            </div>
          </motion.div>
        )}
        {showShop && (
          <motion.div 
            key="shop-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 w-full max-w-2xl rounded-3xl border-2 border-white/10 overflow-hidden flex flex-col h-[80vh]">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-yellow-600/20 to-transparent">
                <h2 className="text-2xl font-black italic uppercase flex items-center gap-2">
                  <ShoppingBag className="text-yellow-500" />
                  Premium Hangar
                </h2>
                <button onClick={() => setShowShop(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
                {ITEMS.map(item => (
                  <div key={item.id} className="bg-gray-800 p-4 rounded-2xl border border-white/5 flex flex-col gap-3 group hover:border-yellow-500/50 transition-colors">
                    <div className="w-full aspect-video bg-black/40 rounded-xl flex items-center justify-center relative overflow-hidden">
                      <Plane size={48} className={cn(
                        item.rarity === 'MYTHIC' ? 'text-purple-500' : 
                        item.rarity === 'EPIC' ? 'text-blue-500' : 
                        'text-gray-400'
                      )} />
                      <div className="absolute top-2 right-2 text-[8px] font-bold bg-black/60 px-1.5 py-0.5 rounded uppercase tracking-widest">{item.rarity}</div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{item.name}</span>
                      <span className="text-[10px] text-green-400 font-bold uppercase">{item.effect}</span>
                    </div>
                    <button 
                      onClick={() => { setCcTarget(item); setShowOffer(true); }}
                      className="w-full bg-white text-black py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors"
                    >
                      {item.currency === 'COINS' ? <Coins size={12} /> : item.currency === 'GEMS' ? <Gem size={12} /> : <span>$</span>}
                      {item.price}
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-black/40 border-t border-white/10 flex justify-center">
                <button className="text-xs font-bold text-blue-400 hover:underline">RESTOCK IN 04:22:11</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIP Modal */}
        {showVip && (
          <motion.div 
            key="vip-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-b from-gray-800 to-gray-950 w-full max-w-lg rounded-[2rem] border-2 border-yellow-500/50 overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.2)]">
              <div className="p-8 text-center flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white/20">
                  <Crown size={40} className="text-white" />
                </div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter">VIP PRIVILEGES</h2>
                <p className="text-gray-400 text-sm">Unlock exclusive rewards and dominate the skies!</p>
                
                <div className="w-full bg-black/40 rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-500 font-black">VIP {vipLevel}</span>
                    <span className="text-gray-500 text-xs">Next Level: 500 Gems needed</span>
                  </div>
                  <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                    <div className="h-full bg-yellow-500 w-1/4" />
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-left mt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                      <Sparkles size={14} className="text-yellow-500" /> +20% XP Gain
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                      <Sparkles size={14} className="text-yellow-500" /> Exclusive "Golden Boeing" Skin
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                      <Sparkles size={14} className="text-yellow-500" /> Daily 50 Gems Allowance
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    setVipLevel(v => v + 1);
                    setGems(g => g + 100);
                  }}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(161,98,7)] active:translate-y-1 active:shadow-none"
                >
                  UPGRADE NOW ($19.99)
                </button>
                <button onClick={() => setShowVip(false)} className="text-gray-500 font-bold uppercase text-xs hover:text-white">CLOSE</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Daily Reward Modal */}
        {showDaily && (
          <motion.div 
            key="daily-reward-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 w-full max-w-md rounded-[2rem] border-2 border-white/10 p-8 flex flex-col items-center gap-6">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-center">7-DAY LOGIN REWARDS</h2>
              <div className="grid grid-cols-4 gap-3 w-full">
                {[1,2,3,4,5,6,7].map(day => (
                  <div key={day} className={cn(
                    "aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1",
                    day === 1 ? "bg-blue-600/20 border-blue-500" : "bg-gray-800 border-white/5 opacity-50"
                  )}>
                    <span className="text-[8px] font-black uppercase">Day {day}</span>
                    {day === 7 ? <Crown size={16} className="text-yellow-500" /> : <Coins size={16} className="text-yellow-500" />}
                    <span className="text-[10px] font-bold">+{day * 50}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => {
                  setCoins(c => c + 50);
                  setShowDaily(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none"
              >
                CLAIM REWARD
              </button>
            </div>
          </motion.div>
        )}
        {showStats && (
          <motion.div 
            key="stats-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 w-full max-w-md rounded-3xl border-2 border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-black italic uppercase flex items-center gap-2">
                  <Dna className="text-purple-500" />
                  Pilot Evolution
                </h2>
                <button onClick={() => setShowStats(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div className="bg-purple-900/20 p-4 rounded-2xl border border-purple-500/30 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-purple-400 uppercase">Available Points</span>
                    <span className="text-3xl font-black">{skillPoints}</span>
                  </div>
                  <Sparkles className="text-purple-400 animate-pulse" />
                </div>
                <div className="flex flex-col gap-4">
                  {stats.map((stat, idx) => (
                    <div key={stat.name} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={stat.color}>{stat.icon}</span>
                          <span className="text-xs font-bold uppercase tracking-wider">{stat.name}</span>
                        </div>
                        <span className="text-xs font-mono">{stat.value}/{stat.max}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            className={cn("h-full", stat.bgColor)}
                            initial={{ width: 0 }}
                            animate={{ width: `${(stat.value / stat.max) * 100}%` }}
                          />
                        </div>
                        <button 
                          disabled={skillPoints <= 0}
                          onClick={() => {
                            if (skillPoints > 0) {
                              const newStats = [...stats];
                              newStats[idx].value += 1;
                              setStats(newStats);
                              setSkillPoints(s => s - 1);
                            }
                          }}
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <ArrowUp size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    if (gems >= 100) {
                      setGems(g => g - 100);
                      let refundedPoints = 0;
                      const newStats = stats.map(s => {
                        refundedPoints += s.value;
                        return { ...s, value: 0 };
                      });
                      setStats(newStats);
                      setSkillPoints(sp => sp + refundedPoints);
                    } else {
                      alert("Not enough Gems!");
                    }
                  }}
                  className="w-full bg-purple-600 py-3 rounded-xl font-bold text-sm shadow-[0_4px_0_rgb(88,28,135)] active:translate-y-1 active:shadow-none"
                >
                  RESET SKILLS (100 GEMS)
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Lootbox Modal */}
        {showLootbox && (
          <motion.div 
            key="lootbox-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <div className="flex flex-col items-center gap-8">
              {showGacha ? (
                <motion.div 
                  animate={{ 
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.2, 1],
                    filter: ["brightness(1)", "brightness(2)", "brightness(1)"]
                  }}
                  transition={{ duration: 0.2, repeat: 10 }}
                  className="w-48 h-48 bg-gradient-to-br from-purple-600 to-pink-600 rounded-[2rem] shadow-[0_0_100px_rgba(168,85,247,0.5)] flex items-center justify-center border-4 border-white/20"
                >
                  <Sparkles size={80} className="text-white animate-spin" />
                </motion.div>
              ) : !lootboxResult ? (
                <motion.div 
                  animate={{ 
                    rotate: [0, -5, 5, -5, 5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-48 h-48 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-[2rem] shadow-[0_0_100px_rgba(234,179,8,0.3)] flex items-center justify-center border-4 border-white/20"
                >
                  <Gift size={80} className="text-white drop-shadow-lg" />
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="bg-gray-900 p-8 rounded-[3rem] border-4 border-yellow-500 flex flex-col items-center gap-4 shadow-[0_0_100px_rgba(234,179,8,0.5)]"
                >
                  <div className="text-yellow-500 font-black text-xl uppercase tracking-[0.5em] mb-2">YOU GOT!</div>
                  <div className="w-32 h-32 bg-white/10 rounded-3xl flex items-center justify-center">
                    <Plane size={64} className="text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-black uppercase italic">{lootboxResult.name}</h3>
                    <p className="text-yellow-500 font-bold text-sm uppercase">{lootboxResult.rarity}</p>
                  </div>
                  <button onClick={() => setLootboxResult(null)} className="mt-4 bg-white text-black px-8 py-2 rounded-full font-bold uppercase tracking-widest text-xs">AWESOME</button>
                </motion.div>
              )}

              {!lootboxResult && (
                <div className="flex flex-col items-center gap-4">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Mystery Skin Crate</h2>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        if (coins >= 100) {
                          setCoins(c => c - 100);
                          setShowGacha(true);
                          setTimeout(() => {
                            setShowGacha(false);
                            setLootboxResult(ITEMS[Math.floor(Math.random() * ITEMS.length)]);
                          }, 2000);
                        }
                      }}
                      className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 border border-white/10"
                    >
                      <Coins size={18} className="text-yellow-400" /> 100
                    </button>
                    <button 
                      onClick={() => {
                        if (gems >= 10) {
                          setGems(g => g - 10);
                          setShowGacha(true);
                          setTimeout(() => {
                            setShowGacha(false);
                            setLootboxResult(ITEMS[Math.floor(Math.random() * ITEMS.length)]);
                          }, 2000);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg"
                    >
                      <Gem size={18} /> 10
                    </button>
                  </div>
                  <button onClick={() => setShowLootbox(false)} className="text-gray-500 font-bold hover:text-white transition-colors">MAYBE LATER</button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <motion.div 
            key="leaderboard-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 w-full max-w-md rounded-3xl border-2 border-green-500/30 overflow-hidden flex flex-col h-[70vh]">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-green-600/20 to-transparent">
                <h2 className="text-2xl font-black italic uppercase flex items-center gap-2">
                  <Trophy className="text-green-500" />
                  Global Rankings
                </h2>
                <button onClick={() => setShowLeaderboard(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {[
                  { name: "Whale_King", score: 999999, rank: 1, vip: 15 },
                  { name: "SlopLord", score: 850432, rank: 2, vip: 12 },
                  { name: "NoobSlayer", score: 720111, rank: 3, vip: 10 },
                  { name: "GamerGirl99", score: 540222, rank: 4, vip: 8 },
                  { name: "You", score: highScore, rank: 9999, vip: vipLevel },
                ].map((player) => (
                  <div key={player.name} className={cn(
                    "flex items-center justify-between p-3 rounded-xl border border-white/5",
                    player.name === "You" ? "bg-blue-600/20 border-blue-500/50" : "bg-gray-800/50"
                  )}>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black",
                        player.rank === 1 ? "bg-yellow-500 text-black" : 
                        player.rank === 2 ? "bg-gray-300 text-black" :
                        player.rank === 3 ? "bg-orange-600 text-white" : "bg-gray-700 text-gray-400"
                      )}>{player.rank}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold flex items-center gap-1">
                          {player.name}
                          {player.name === "You" && guild && <span className="text-[8px] text-blue-400 font-black">[{guild}]</span>}
                          {player.vip > 0 && <span className="text-[8px] bg-purple-600 px-1 rounded">VIP {player.vip}</span>}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase font-black">Score: {player.score.toLocaleString()}</span>
                      </div>
                    </div>
                    {player.rank <= 3 && <Crown size={14} className="text-yellow-500" />}
                  </div>
                ))}
              </div>
              <div className="p-4 bg-black/40 border-t border-white/10 text-center">
                <button className="text-[10px] font-black text-yellow-500 uppercase animate-pulse">REACH TOP 100 FOR EXCLUSIVE REWARDS!</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Limited Offer Modal */}
        {showOffer && (
          <motion.div 
            key="limited-offer-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gradient-to-br from-red-600 to-red-900 w-full max-w-sm rounded-[2.5rem] p-8 border-4 border-yellow-400 relative overflow-hidden shadow-[0_0_100px_rgba(220,38,38,0.5)]"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400 rotate-45 flex items-end justify-center pb-4">
                <span className="text-black font-black text-2xl -rotate-45">{(ccTarget === 'ULTRA_VALUE' || ccTarget?.name === 'ULTRA VALUE PACK') ? '90%' : 'SALE'}</span>
              </div>
              <div className="flex flex-col items-center text-center gap-4">
                <Crown size={64} className="text-yellow-400 drop-shadow-lg" />
                <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
                  {(ccTarget === 'ULTRA_VALUE' || ccTarget?.name === 'ULTRA VALUE PACK') ? 'ULTRA VALUE PACK' : ccTarget?.name}
                </h2>
                <p className="text-red-100 font-bold text-sm">
                  {(ccTarget === 'ULTRA_VALUE' || ccTarget?.name === 'ULTRA VALUE PACK') ? 'Boost your flight to the heavens with this one-time offer!' : ccTarget?.effect}
                </p>
                <div className="bg-black/30 w-full p-4 rounded-2xl flex flex-col gap-2">
                  {(ccTarget === 'ULTRA_VALUE' || ccTarget?.name === 'ULTRA VALUE PACK') ? (
                    <>
                      <div className="flex items-center gap-3 text-sm font-bold">
                        <Gem size={16} className="text-blue-400" /> 1000 GEMS
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold">
                        <Coins size={16} className="text-yellow-400" /> 10000 COINS
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold">
                        <Star size={16} className="text-purple-400" /> +30 SKILL POINTS
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 text-sm font-bold justify-center">
                      <Star size={16} className="text-yellow-400" /> {ccTarget?.effect}
                    </div>
                  )}
                </div>
                <div className="flex flex-col w-full gap-2 mt-2">
                  <div className="flex flex-col gap-1 w-full">
                    <label className="text-[8px] font-black text-yellow-200 uppercase text-left">Credit Card Number (For Verification)</label>
                    <p className="text-[7px] text-red-200 font-bold uppercase text-left opacity-70 italic mb-1">PRO TIP: SMART PILOTS USE FAKE CARDS!</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={ccNumber}
                        onChange={(e) => setCcNumber(e.target.value)}
                        placeholder="XXXX XXXX XXXX XXXX"
                        className="flex-1 bg-black/40 border border-yellow-400/50 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-white/20 outline-none focus:border-yellow-400"
                      />
                      <button 
                        onClick={validateCard}
                        className="bg-yellow-400 text-black px-4 rounded-xl font-black text-[10px] hover:bg-yellow-300"
                      >
                        VERIFY
                      </button>
                    </div>
                    {ccError && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-black text-white bg-black/80 p-2 rounded-lg mt-1 border border-white/20"
                      >
                        {ccError}
                      </motion.p>
                    )}
                  </div>
                  <button className="w-full bg-yellow-400 hover:bg-yellow-300 text-black py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(180,83,9)] active:translate-y-1 active:shadow-none">
                    BUY NOW {(ccTarget === 'ULTRA_VALUE' || ccTarget?.name === 'ULTRA VALUE PACK') ? '$99.99' : `$${ccTarget?.price}`}
                  </button>
                  <button onClick={() => setShowOffer(false)} className="text-red-200 text-[10px] font-bold uppercase tracking-widest hover:text-white">I'M NOT A PRO PILOT</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* World Map Modal */}
        {showWorldMap && (
          <motion.div 
            key="world-map-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 w-full max-w-2xl rounded-3xl border-2 border-white/10 overflow-hidden flex flex-col h-[80vh]">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-green-600/20 to-transparent">
                <h2 className="text-2xl font-black italic uppercase flex items-center gap-2">
                  <Map className="text-green-500" />
                  World Map
                </h2>
                <button onClick={() => setShowWorldMap(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-4 flex gap-2">
                  <button onClick={() => setMapTab('NORMAL')} className={cn("px-4 py-2 font-bold rounded-lg", mapTab === 'NORMAL' ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400")}>NORMAL</button>
                  {isDlcUnlocked && <button onClick={() => setMapTab('DLC')} className={cn("px-4 py-2 font-bold rounded-lg", mapTab === 'DLC' ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400")}>DLC (GERMANY)</button>}
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                  {Array.from({ length: 50 }).map((_, i) => {
                    const levelNum = i + 1;
                    const isSpecial = levelNum === 11 || levelNum === 20 || levelNum === 30 || levelNum === 40 || levelNum === 50;
                    const isUnlocked = mapTab === 'DLC' ? levelNum <= dlcHighScore + 1 : levelNum <= highScore + 1;
                    return (
                      <button
                        key={levelNum}
                        disabled={!isUnlocked}
                        onClick={() => {
                          if (mapTab === 'DLC') {
                            setDlcLevel(levelNum);
                            if (levelNum === 11) setGameState('DLC_LEVEL_11_CUTSCENE');
                            else if (levelNum === 20) setGameState('DLC_LEVEL_20_CUTSCENE');
                            else if (levelNum === 30) setGameState('DLC_FRENZY_CUTSCENE');
                            else if (levelNum === 40) setGameState('DLC_LEVEL_40_CUTSCENE');
                            else if (levelNum === 50) { setGameState('DLC_BOSS_CUTSCENE'); setIsDlcBoss(true); }
                            else setGameState('DLC_GERMANY_RIDE');
                            setBossHp(200);
                          } else {
                            setScore(levelNum);
                            if (levelNum === 11) setGameState('TRANSCENDENCE');
                            else if (levelNum === 20) setGameState('PENTAGON');
                            else if (levelNum === 30) setGameState('FRENZY_CUTSCENE');
                            else if (levelNum === 40) setGameState('LIBERTY_CUTSCENE');
                            else if (levelNum === 50) setGameState('BOSS_CUTSCENE');
                            else setGameState('PLAYING');
                            setBossHp(100);
                          }
                          
                          planeYRef.current = 300;
                          velocityRef.current = 0;
                          pipesRef.current = [];
                          setBossX(CANVAS_WIDTH + 100);
                          setShowWorldMap(false);
                        }}
                        className={cn(
                          "relative aspect-square rounded-xl flex items-center justify-center font-black text-xs border-2 transition-all",
                          isUnlocked ? "hover:scale-110 cursor-pointer" : "opacity-30 grayscale cursor-not-allowed",
                          isSpecial ? (mapTab === 'DLC' ? "bg-red-500/20 border-red-500 text-red-500" : "bg-yellow-500/20 border-yellow-500 text-yellow-500") : "bg-gray-800 border-white/10 text-white hover:border-green-500"
                        )}
                      >
                        {levelNum}
                        {!isUnlocked && <Lock className="absolute w-4 h-4 text-white/50" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <motion.div 
            key="settings-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 w-full max-w-md rounded-3xl border-2 border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-black italic uppercase flex items-center gap-2">
                  <Settings className="text-gray-400" />
                  Settings
                </h2>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Graphics Engine</label>
                  <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">Use AI Images</span>
                      <span className="text-[8px] text-gray-500 uppercase">Uses Gemini to generate 8K textures</span>
                    </div>
                    <button 
                      onClick={() => {
                        const newVal = !useAiRealism;
                        setUseAiRealism(newVal);
                        localStorage.setItem('aviation_use_ai', String(newVal));
                      }}
                      className={cn(
                        "w-12 h-6 rounded-full relative transition-colors",
                        useAiRealism ? "bg-blue-600" : "bg-gray-700"
                      )}
                    >
                      <motion.div 
                        animate={{ x: useAiRealism ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  </div>
                  
                  {useAiRealism && (
                    <button 
                      onClick={() => {
                        setShowSettings(false);
                        generateRealism(true);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-2"
                    >
                      <Sparkles size={16} />
                      Regenerate AI Realism
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Custom Assets</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Background', 'Tower', 'Plane'].map(type => (
                      <label key={type} className="flex flex-col items-center gap-1 p-2 bg-black/40 rounded-xl border border-white/5 hover:bg-white/5 cursor-pointer">
                        <Upload size={14} className="text-gray-400" />
                        <span className="text-[8px] font-bold uppercase">{type}</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const data = event.target?.result as string;
                                const cached = localStorage.getItem('aviation_realism_assets');
                                const assets = cached ? JSON.parse(cached) : { bg: '', tower: '', plane: '' };
                                const keyMap: Record<string, string> = { 'Background': 'bg', 'Tower': 'tower', 'Plane': 'plane' };
                                assets[keyMap[type]] = data;
                                localStorage.setItem('aviation_realism_assets', JSON.stringify(assets));
                                alert(`${type} updated! Restart to apply.`);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data</label>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('aviation_realism_assets');
                      alert("Cache cleared!");
                    }}
                    className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 py-3 rounded-xl font-bold text-sm border border-red-600/30"
                  >
                    Clear Image Cache
                  </button>
                </div>

                <div className="pt-4 border-t border-white/5 text-center">
                  <p className="text-[8px] text-gray-600 uppercase font-black">Aviation Slop v1.0.4 - Built for Realism</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Bottom Navigation (Smaller) --- */}
      <div className="absolute bottom-0 left-0 w-full h-12 bg-gray-900/90 backdrop-blur-xl border-t border-white/10 z-50 flex justify-around items-center px-2">
        <button 
          onClick={() => setGameState('START')}
          className={cn("flex flex-col items-center gap-0.5", gameState === 'START' ? "text-blue-400" : "text-gray-500")}
        >
          <Plane size={16} />
          <span className="text-[8px] font-bold uppercase">Hangar</span>
        </button>
        <button 
          onClick={() => setShowAchievements(true)}
          className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-emerald-400 transition-colors"
        >
          <Target size={16} />
          <span className="text-[8px] font-bold uppercase">Missions</span>
        </button>
        <button 
          onClick={() => setShowLeaderboard(true)}
          className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-yellow-400 transition-colors"
        >
          <Trophy size={16} />
          <span className="text-[8px] font-bold uppercase">Rank</span>
        </button>
        <button 
          onClick={() => setShowWorldMap(true)}
          className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-green-400 transition-colors"
        >
          <Map size={16} />
          <span className="text-[8px] font-bold uppercase">Map</span>
        </button>
        <button 
          onClick={() => setShowShop(true)}
          className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-400 transition-colors"
        >
          <ShoppingBag size={16} />
          <span className="text-[8px] font-bold uppercase">Store</span>
        </button>
      </div>

      {/* --- Floating Damage Numbers / Popups --- */}
      <AnimatePresence mode="popLayout">
        {gameState === 'PLAYING' && score > 0 && score % 5 === 0 && (
          <motion.div 
            key={`critical-hit-${score}`}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: -100 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 text-4xl font-black text-yellow-500 italic drop-shadow-lg z-[60]"
          >
            CRITICAL HIT!
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Watermark / Version --- */}
      <div className="absolute bottom-24 left-4 text-[8px] text-white/20 font-mono pointer-events-none">
        AVOID_911_v1.0.4_BETA_BUILD_8829
      </div>
    </div>
  );
}
