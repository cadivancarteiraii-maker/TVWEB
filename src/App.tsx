/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ChevronDown, 
  MoreVertical, 
  Heart, 
  Moon, 
  Share2, 
  SkipBack, 
  Pause, 
  Play,
  SkipForward, 
  Volume1, 
  Volume2, 
  VolumeX,
  Radio, 
  Library, 
  Settings,
  Tv,
  PlayCircle,
  Maximize2,
  Minimize2,
  Upload,
  Loader2,
  Compass,
  Trash2,
  Plus,
  Clock,
  User,
  ChevronRight,
  Edit2,
  X,
  GripVertical,
  CheckSquare,
  Square,
  Check,
  ChevronDown as ChevronDownIcon,
  Youtube,
  Facebook,
  Twitch,
  Twitter,
  Instagram,
  Camera,
  VideoOff,
  Video,
  Mic,
  Circle,
  Globe,
  ExternalLink,
  Code,
  Layout,
  Save,
  Scissors,
  Wand2,
  CreditCard,
  Zap,
  ShieldCheck,
  DollarSign,
  Users,
  MessageSquare,
  Send,
  Search,
  Image as LucideImage,
  Lock,
  Crown,
  List,
  Calculator,
  Calendar
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import ReactPlayer from 'react-player';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  getDoc,
  setDoc,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const CHANNELS = [
  { id: 1, name: 'TV WEB News', category: 'News', program: 'Global Update', image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1000&auto=format&fit=crop', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
  { id: 2, name: 'Sports Max', category: 'Sports', program: 'Live: Championship Finals', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { id: 3, name: 'Cinema One', category: 'Movies', program: 'The Matrix Resurrections', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { id: 4, name: 'Nature TV', category: 'Documentary', program: 'Planet Earth III', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=1000&auto=format&fit=crop', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  { id: 5, name: 'TV WEB FM', category: 'Music', program: 'Midnight City - The Midnight', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
  { id: 6, name: 'Kids Central', category: 'Kids', program: 'Cartoon Hour', image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=1000&auto=format&fit=crop', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
  { id: 7, name: 'Rádio Pentecostal Avivamento do Senhor', category: 'Gospel', program: 'Louvor e Adoração', image: 'https://images.unsplash.com/photo-1438283173091-5dbf5c5a3206?q=80&w=1000&auto=format&fit=crop', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
  { id: 101, name: 'VIP Movies 4K', category: 'Movies', program: 'Exclusive Premiere', image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', isVip: true },
  { id: 102, name: 'VIP Sports Live', category: 'Sports', program: 'Premium Match Access', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1000&auto=format&fit=crop', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackAds.mp4', isVip: true },
];

const Footer = () => (
  <footer className="w-full py-8 mt-auto border-t border-slate-800/50 flex flex-col items-center justify-center gap-4 shrink-0">
    <div className="flex gap-6">
      <a href="#" className="text-slate-400 hover:text-primary transition-colors">
        <Twitter className="w-5 h-5" />
      </a>
      <a href="#" className="text-slate-400 hover:text-primary transition-colors">
        <Facebook className="w-5 h-5" />
      </a>
      <a href="#" className="text-slate-400 hover:text-primary transition-colors">
        <Instagram className="w-5 h-5" />
      </a>
    </div>
    <p className="text-xs text-slate-500 font-medium">© 2026 Your App Name. All rights reserved.</p>
  </footer>
);

const TRANSLATIONS = {
  pt: {
    player: 'Player',
    channels: 'Canais',
    radio: 'Rádio',
    library: 'Biblioteca',
    web: 'Web',
    vip: 'VIP Area',
    tools: 'Ferramentas',
    profile: 'Perfil',
    settings: 'Configurações',
    advertise: 'Anunciar',
    payments: 'Pagamentos',
    nowPlaying: 'Tocando Agora',
    search: 'Buscar...',
    playYoutube: 'Tocar Vídeo do YouTube',
    pasteUrl: 'Cole a URL do YouTube...',
    play: 'Tocar',
    aiStudio: 'AI Studio',
    // VIP Page
    vipTitle: 'Área VIP',
    vipSubtitle: 'Acesso exclusivo a conteúdo premium e recursos avançados.',
    vipPremium: 'Plano VIP Premium',
    vipExclusive: 'Acesso à Área Exclusiva',
    vipQuality: 'Qualidade 4K Ultra HD',
    vipNoAds: 'Sem anúncios',
    vipMonth: '/mês',
    vipPayNow: 'Pagar Agora',
    // Tools Page
    toolsTitle: 'Ferramentas',
    toolsSubtitle: 'Utilitários e conversores para o seu dia a dia.',
    toolsExchange: 'Câmbio do Mercado Formal (BNA)',
    toolsCalculator: 'Calculadora de Câmbio',
    toolsAmount: 'Valor em Kwanzas (AOA)',
    toolsCalendar: 'Calendário',
    // Profile Page
    profileTitle: 'Perfil do Utilizador',
    profileSignIn: 'Entrar na Conta',
    profileSignOut: 'Terminar Sessão',
    profileEmail: 'Email',
    profileRole: 'Função',
    profileGuest: 'Convidado',
    profileUser: 'Utilizador',
    profileAdmin: 'Administrador',
  },
  en: {
    player: 'Player',
    channels: 'Channels',
    radio: 'Radio',
    library: 'Library',
    web: 'Web',
    vip: 'VIP Area',
    tools: 'Tools',
    profile: 'Profile',
    settings: 'Settings',
    advertise: 'Advertise',
    payments: 'Payments',
    nowPlaying: 'Now Playing',
    search: 'Search...',
    playYoutube: 'Play YouTube Video',
    pasteUrl: 'Paste YouTube URL...',
    play: 'Play',
    aiStudio: 'AI Studio',
    // VIP Page
    vipTitle: 'VIP Area',
    vipSubtitle: 'Exclusive access to premium content and advanced features.',
    vipPremium: 'Premium VIP Plan',
    vipExclusive: 'Exclusive Area Access',
    vipQuality: '4K Ultra HD Quality',
    vipNoAds: 'No ads',
    vipMonth: '/month',
    vipPayNow: 'Pay Now',
    // Tools Page
    toolsTitle: 'Tools',
    toolsSubtitle: 'Utilities and converters for your daily use.',
    toolsExchange: 'Formal Market Exchange (BNA)',
    toolsCalculator: 'Exchange Calculator',
    toolsAmount: 'Amount in Kwanzas (AOA)',
    toolsCalendar: 'Calendar',
    // Profile Page
    profileTitle: 'User Profile',
    profileSignIn: 'Sign In',
    profileSignOut: 'Sign Out',
    profileEmail: 'Email',
    profileRole: 'Role',
    profileGuest: 'Guest',
    profileUser: 'User',
    profileAdmin: 'Admin',
  },
  es: {
    player: 'Reproductor',
    channels: 'Canales',
    radio: 'Radio',
    library: 'Biblioteca',
    web: 'Web',
    vip: 'Área VIP',
    tools: 'Herramientas',
    profile: 'Perfil',
    settings: 'Ajustes',
    advertise: 'Anunciar',
    payments: 'Pagos',
    nowPlaying: 'Reproduciendo',
    search: 'Buscar...',
    playYoutube: 'Reproducir Video de YouTube',
    pasteUrl: 'Pegar URL de YouTube...',
    play: 'Reproducir',
    aiStudio: 'AI Studio',
    // VIP Page
    vipTitle: 'Área VIP',
    vipSubtitle: 'Acceso exclusivo a contenido premium y funciones avanzadas.',
    vipPremium: 'Plan VIP Premium',
    vipExclusive: 'Acceso al Área Exclusiva',
    vipQuality: 'Calidad 4K Ultra HD',
    vipNoAds: 'Sin anuncios',
    vipMonth: '/mes',
    vipPayNow: 'Pagar Ahora',
    // Tools Page
    toolsTitle: 'Herramientas',
    toolsSubtitle: 'Utilidades y conversores para tu día a día.',
    toolsExchange: 'Cambio del Mercado Formal (BNA)',
    toolsCalculator: 'Calculadora de Cambio',
    toolsAmount: 'Monto en Kwanzas (AOA)',
    toolsCalendar: 'Calendario',
    // Profile Page
    profileTitle: 'Perfil de Usuario',
    profileSignIn: 'Iniciar Sesión',
    profileSignOut: 'Cerrar Sesión',
    profileEmail: 'Correo',
    profileRole: 'Rol',
    profileGuest: 'Invitado',
    profileUser: 'Usuario',
    profileAdmin: 'Administrador',
  },
  fr: {
    player: 'Lecteur',
    channels: 'Chaînes',
    radio: 'Radio',
    library: 'Bibliothèque',
    web: 'Web',
    vip: 'Espace VIP',
    tools: 'Outils',
    profile: 'Profil',
    settings: 'Paramètres',
    advertise: 'Annoncer',
    payments: 'Paiements',
    nowPlaying: 'En lecture',
    search: 'Rechercher...',
    playYoutube: 'Lire la vidéo YouTube',
    pasteUrl: 'Coller l\'URL YouTube...',
    play: 'Lire',
    aiStudio: 'AI Studio',
    // VIP Page
    vipTitle: 'Espace VIP',
    vipSubtitle: 'Accès exclusif au contenu premium et aux fonctionnalités avancées.',
    vipPremium: 'Plan VIP Premium',
    vipExclusive: 'Accès à l\'Espace Exclusif',
    vipQuality: 'Qualité 4K Ultra HD',
    vipNoAds: 'Sans publicité',
    vipMonth: '/mois',
    vipPayNow: 'Payer Maintenant',
    // Tools Page
    toolsTitle: 'Outils',
    toolsSubtitle: 'Utilitaires et convertisseurs pour votre quotidien.',
    toolsExchange: 'Change du Marché Formel (BNA)',
    toolsCalculator: 'Calculatrice de Change',
    toolsAmount: 'Montant en Kwanzas (AOA)',
    toolsCalendar: 'Calendrier',
    // Profile Page
    profileTitle: 'Profil Utilisateur',
    profileSignIn: 'Se Connecter',
    profileSignOut: 'Se Déconnecter',
    profileEmail: 'Email',
    profileRole: 'Rôle',
    profileGuest: 'Invité',
    profileUser: 'Utilisateur',
    profileAdmin: 'Administrateur',
  },
  zh: {
    player: '播放器',
    channels: '频道',
    radio: '收音机',
    library: '图书馆',
    web: '网络',
    vip: '贵宾区',
    tools: '工具',
    profile: '个人资料',
    settings: '设置',
    advertise: '做广告',
    payments: '支付',
    nowPlaying: '正在播放',
    search: '搜索...',
    playYoutube: '播放YouTube视频',
    pasteUrl: '粘贴YouTube网址...',
    play: '播放',
    aiStudio: 'AI Studio',
    // VIP Page
    vipTitle: '贵宾区',
    vipSubtitle: '独家访问优质内容和高级功能。',
    vipPremium: '高级VIP计划',
    vipExclusive: '独家区域访问',
    vipQuality: '4K超高清画质',
    vipNoAds: '无广告',
    vipMonth: '/月',
    vipPayNow: '立即付款',
    // Tools Page
    toolsTitle: '工具',
    toolsSubtitle: '日常使用的实用程序和转换器。',
    toolsExchange: '正规市场汇率 (BNA)',
    toolsCalculator: '汇率计算器',
    toolsAmount: '宽扎金额 (AOA)',
    toolsCalendar: '日历',
    // Profile Page
    profileTitle: '用户资料',
    profileSignIn: '登录',
    profileSignOut: '登出',
    profileEmail: '电子邮件',
    profileRole: '角色',
    profileGuest: '访客',
    profileUser: '用户',
    profileAdmin: '管理员',
  }
};

export default function App() {
  const [language, setLanguage] = useState<'pt' | 'en' | 'es' | 'fr' | 'zh'>('pt');
  const t = TRANSLATIONS[language];
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(66);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState<'player' | 'discover' | 'library' | 'settings' | 'web' | 'radio' | 'profile' | 'ai-studio' | 'vip' | 'payment' | 'advertise' | 'admin-payments' | 'tools'>('player');
  const [webSources, setWebSources] = useState<{id: number, name: string, url: string, type: 'embed' | 'link', category: string}[]>([
    { id: 1, name: 'BBC News Live', url: 'https://www.bbc.com/news', type: 'link', category: 'News' },
    { id: 2, name: 'Radio Garden', url: 'http://radio.garden/', type: 'link', category: 'Directory' }
  ]);
  const [isEditingWebSource, setIsEditingWebSource] = useState(false);
  const [editingWebSource, setEditingWebSource] = useState<{id: number, name: string, url: string, type: 'embed' | 'link', category: string} | null>(null);
  const [activeEmbed, setActiveEmbed] = useState<{id: number, name: string, url: string, type: 'embed' | 'link', category: string} | null>(null);
  const [currentChannel, setCurrentChannel] = useState(CHANNELS[0]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [recentChannels, setRecentChannels] = useState<number[]>([]);
  const [channels, setChannels] = useState<typeof CHANNELS>(CHANNELS);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [showBulkCategory, setShowBulkCategory] = useState<boolean>(false);
  const [webSourceSearch, setWebSourceSearch] = useState('');
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const [customChannels, setCustomChannels] = useState<typeof CHANNELS>([]);
  const [userRole, setUserRole] = useState<'guest' | 'user' | 'admin'>('guest');
  const [adminView, setAdminView] = useState<'profile' | 'channels' | 'users' | 'broadcast' | 'webSources' | 'payments'>('profile');
  const [editingChannel, setEditingChannel] = useState<typeof CHANNELS[0] | null>(null);
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  // Streaming Settings
  const [streamingQuality, setStreamingQuality] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [bitrate, setBitrate] = useState(4500);
  const [resolution, setResolution] = useState('1920x1080');
  const [autoRecord, setAutoRecord] = useState(false);

  // AI Studio State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingCuts, setIsGeneratingCuts] = useState(false);
  const [aiResult, setAiResult] = useState<{title: string, start: string, end: string, description: string}[] | null>(null);

  // Payment State
  const [subscriptionPlan, setSubscriptionPlan] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('VIP');
  const [selectedAmount, setSelectedAmount] = useState(2000);
  const [selectedCurrency, setSelectedCurrency] = useState<'AOA' | 'USD' | 'EUR'>('AOA');
  const [paymentStep, setPaymentStep] = useState<'details' | 'form'>('details');
  const [paymentName, setPaymentName] = useState('');
  const [paymentWhatsapp, setPaymentWhatsapp] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [exchangeRates, setExchangeRates] = useState<{ USD: number, EUR: number } | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'none' | 'pending' | 'pago' | 'rejected'>('none');
  
  // Broadcast State
  const [connectedPlatforms, setConnectedPlatforms] = useState({
    youtube: false,
    facebook: false,
    twitch: false
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentBroadcastId, setCurrentBroadcastId] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<{id?: string, user: string, message: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [platformSettings, setPlatformSettings] = useState({
    youtube: { title: '', description: '', thumbnail: '' },
    facebook: { title: '', description: '', thumbnail: '' },
    twitch: { title: '', description: '', thumbnail: '' }
  });
  const [showPlatformSettings, setShowPlatformSettings] = useState<keyof typeof connectedPlatforms | null>(null);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  
  // Playlists
  const [playlists, setPlaylists] = useState<{id: string, name: string, items: typeof CHANNELS}[]>([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedChannelForPlaylist, setSelectedChannelForPlaylist] = useState<typeof CHANNELS[0] | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'm':
          e.preventDefault();
          setIsMuted(prev => !prev);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(prev => Math.min(100, prev + 10));
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 10));
          break;
        case 'arrowleft':
          e.preventDefault();
          if (playerRef.current) {
            playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10, 'seconds');
          }
          break;
        case 'arrowright':
          e.preventDefault();
          if (playerRef.current) {
            playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10, 'seconds');
          }
          break;
        case 'f':
          e.preventDefault();
          if (!document.fullscreenElement) {
            if (playerContainerRef.current?.requestFullscreen) {
              playerContainerRef.current.requestFullscreen();
            }
          } else {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const allChannels = useMemo(() => [...channels, ...customChannels], [channels, customChannels]);

  const SPEEDS = [0.5, 1, 1.25, 1.5, 2];

  const categories = useMemo(() => {
    const cats = new Set(allChannels.map(c => c.category));
    return Array.from(cats);
  }, [allChannels]);

  const filteredChannels = useMemo(() => {
    if (!selectedCategory) return allChannels;
    return allChannels.filter(c => c.category === selectedCategory);
  }, [selectedCategory, allChannels]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleChannelSelect = (channel: typeof CHANNELS[0]) => {
    setCurrentChannel(channel);
    setIsLoadingVideo(true);
    
    setRecentChannels(prev => {
      const filtered = prev.filter(id => id !== channel.id);
      return [channel.id, ...filtered].slice(0, 10);
    });

    if (channel.id === 7) {
      setActiveTab('radio');
    } else {
      setActiveTab('player');
    }
    setIsPlaying(true);
  };

  const handleCategorySelect = (category: string | null) => {
    setIsLoadingChannels(true);
    setSelectedCategory(category);
    // Simulate network delay for feedback
    setTimeout(() => {
      setIsLoadingChannels(false);
    }, 400);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Real-time listener for user profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserRole(userData.role || 'user');
            setIsVip(userData.isVip || false);
            setFavorites(userData.favorites || []);
            setPlaylists(userData.playlists || []);
          } else {
            // Create profile if it doesn't exist
            setDoc(userDocRef, {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              role: 'user',
              isVip: false,
              favorites: [],
              playlists: [],
              createdAt: serverTimestamp()
            }).catch(error => {
              handleFirestoreError(error, OperationType.CREATE, `users/${currentUser.uid}`);
            });
            setUserRole('user');
            setFavorites([]);
            setPlaylists([]);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        });

        // Listen to user's payments
        const q = query(
          collection(db, 'pagamentos'),
          where('uid', '==', currentUser.uid),
          orderBy('data', 'desc')
        );
        onSnapshot(q, (snapshot) => {
          const userPayments = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
          const latestVipPayment = userPayments.find((p: any) => p.plano === 'VIP');
          if (latestVipPayment) {
            setPaymentStatus(latestVipPayment.status);
          } else {
            setPaymentStatus('none');
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'pagamentos');
        });
      } else {
        setUserRole('guest');
        setIsVip(false);
        setPaymentStatus('none');
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Real-time chat listener for broadcasts
  useEffect(() => {
    if (currentBroadcastId) {
      const q = query(
        collection(db, 'broadcasts', currentBroadcastId, 'chat'),
        orderBy('timestamp', 'asc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          user: doc.data().userName,
          message: doc.data().message
        }));
        setChatMessages(messages);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `broadcasts/${currentBroadcastId}/chat`);
      });
      return () => unsubscribe();
    }
  }, [currentBroadcastId]);

  // Admin: Listen to all payments
  useEffect(() => {
    if (userRole === 'admin') {
      const q = query(collection(db, 'pagamentos'), orderBy('data', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'pagamentos');
      });
      return () => unsubscribe();
    }
  }, [userRole]);

  useEffect(() => {
    // Fetch formal market exchange rates
    const fetchRates = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/AOA');
        const data = await response.json();
        if (data && data.rates) {
          setExchangeRates({
            USD: data.rates.USD,
            EUR: data.rates.EUR
          });
        }
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
      }
    };
    fetchRates();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('player');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handlePayNow = async () => {
    if (userRole === 'guest' && !user) {
      alert("Please sign in to make a payment.");
      setActiveTab('profile');
      return;
    }
    setSelectedPlan('VIP');
    setSelectedAmount(2000);
    setPaymentStep('details');
    setPaymentName('');
    setPaymentWhatsapp('');
    setPaymentProof(null);
    setActiveTab('payment');
  };

  const handleSelectPlan = (plan: string, amount: number) => {
    if (userRole === 'guest' && !user) {
      alert("Please sign in to make a payment.");
      setActiveTab('profile');
      return;
    }
    setSelectedPlan(plan);
    setSelectedAmount(amount);
    setPaymentStep('details');
    setPaymentName('');
    setPaymentWhatsapp('');
    setPaymentProof(null);
    setActiveTab('payment');
  };

  const handleSubmitPayment = async () => {
    if (userRole === 'guest' && !user) return;
    setIsProcessingPayment(true);
    
    // Calculate final amount based on selected currency
    let finalAmount = selectedAmount;
    if (selectedCurrency === 'USD' && exchangeRates?.USD) {
      finalAmount = selectedAmount * exchangeRates.USD;
    } else if (selectedCurrency === 'EUR' && exchangeRates?.EUR) {
      finalAmount = selectedAmount * exchangeRates.EUR;
    }
    
    try {
      await addDoc(collection(db, "pagamentos"), {
        uid: user?.uid || 'mock-user-id',
        email: user?.email || 'user@tvweb.com',
        nome: paymentName || user?.displayName || user?.email || 'Mock User',
        whatsapp: paymentWhatsapp,
        plano: selectedPlan,
        valor: finalAmount,
        currency: selectedCurrency,
        status: "pending",
        data: new Date().toISOString()
      });
      setPaymentStatus('pending');
      
      const waMessage = `Olá, fiz o pagamento do plano ${selectedPlan}.%0A%0ANome: ${paymentName}%0AWhatsApp: ${paymentWhatsapp}%0AValor: ${finalAmount} ${selectedCurrency}%0A%0ASegue o meu comprovativo em anexo.`;
      window.open(`https://wa.me/244952243460?text=${waMessage}`, '_blank');

      alert("Pedido enviado! Você será redirecionado para o WhatsApp para enviar o comprovativo ao administrador.");
      setActiveTab('vip');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'pagamentos');
      alert("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleAdminConfirm = async (paymentId: string, userId: string) => {
    try {
      await updateDoc(doc(db, 'pagamentos', paymentId), {
        status: 'pago',
        confirmedAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'users', userId), {
        isVip: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `pagamentos/${paymentId} or users/${userId}`);
    }
  };

  const handleAdminReject = async (paymentId: string) => {
    try {
      await updateDoc(doc(db, 'pagamentos', paymentId), {
        status: 'rejected'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `pagamentos/${paymentId}`);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (playerContainerRef.current?.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    
    const newPlaylist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      items: selectedChannelForPlaylist ? [selectedChannelForPlaylist] : []
    };
    
    const updatedPlaylists = [...playlists, newPlaylist];
    setPlaylists(updatedPlaylists);
    
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { playlists: updatedPlaylists });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
    
    setNewPlaylistName('');
    setShowPlaylistModal(false);
    setSelectedChannelForPlaylist(null);
  };

  const handleAddToPlaylist = async (playlistId: string, channel: typeof CHANNELS[0]) => {
    const updatedPlaylists = playlists.map(p => {
      if (p.id === playlistId) {
        if (!p.items.find(item => item.id === channel.id)) {
          return { ...p, items: [...p.items, channel] };
        }
      }
      return p;
    });
    setPlaylists(updatedPlaylists);
    
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { playlists: updatedPlaylists });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
    
    setShowPlaylistModal(false);
    setSelectedChannelForPlaylist(null);
  };

  const handleRemoveFromPlaylist = async (playlistId: string, channelId: number) => {
    const updatedPlaylists = playlists.map(p => {
      if (p.id === playlistId) {
        return { ...p, items: p.items.filter(item => item.id !== channelId) };
      }
      return p;
    });
    setPlaylists(updatedPlaylists);
    
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { playlists: updatedPlaylists });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    const updatedPlaylists = playlists.filter(p => p.id !== playlistId);
    setPlaylists(updatedPlaylists);
    
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { playlists: updatedPlaylists });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const localChannel = {
        id: Date.now(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        category: 'Local Video',
        program: 'From Gallery',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop',
        videoUrl: url
      };
      setCustomChannels(prev => [...prev, localChannel]);
      handleChannelSelect(localChannel);
    }
  };

  const toggleFavorite = async (id: number) => {
    const updatedFavorites = favorites.includes(id) 
      ? favorites.filter(favId => favId !== id) 
      : [...favorites, id];
      
    setFavorites(updatedFavorites);
    
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { favorites: updatedFavorites });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (youtubeUrl.trim()) {
      const ytChannel = {
        id: Date.now(),
        name: 'YouTube Video',
        category: 'YouTube',
        program: 'Custom Stream',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop',
        videoUrl: youtubeUrl.trim()
      };
      setCustomChannels(prev => [...prev, ytChannel]);
      handleChannelSelect(ytChannel);
      setYoutubeUrl('');
      setShowYoutubeInput(false);
    }
  };

  const togglePlatform = (platform: keyof typeof connectedPlatforms) => {
    setConnectedPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  const toggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      setIsBroadcasting(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => {
            // Ignore interruption errors
            if (e.name !== 'AbortError') {
              console.error("Error playing camera stream:", e instanceof Error ? e.message : String(e));
            }
          });
        }
        setIsCameraActive(true);
      } catch (err) {
        console.error("Error accessing camera:", err instanceof Error ? err.message : String(err));
        alert("Could not access camera. Please check permissions.");
      }
    }
  };

  const toggleBroadcast = async () => {
    if (userRole !== 'admin' || !user) {
      alert("Only admins can start/stop broadcasts.");
      return;
    }
    if (isBroadcasting) {
      if (currentBroadcastId) {
        try {
          await updateDoc(doc(db, 'broadcasts', currentBroadcastId), {
            isLive: false
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `broadcasts/${currentBroadcastId}`);
        }
      }
      setIsBroadcasting(false);
      setCurrentBroadcastId(null);
      setViewerCount(0);
      setChatMessages([]);
      if (isRecording) {
        stopRecording();
      }
    } else {
      try {
        const broadcastRef = await addDoc(collection(db, 'broadcasts'), {
          uid: user.uid,
          title: "Live Stream",
          isLive: true,
          viewerCount: Math.floor(Math.random() * 500) + 50,
          startedAt: new Date().toISOString()
        });
        setCurrentBroadcastId(broadcastRef.id);
        setIsBroadcasting(true);
        // Simulate viewers and chat
        setViewerCount(Math.floor(Math.random() * 500) + 50);
        setChatMessages([
          { user: 'StreamBot', message: 'Welcome to the live stream!' },
          { user: 'Fan123', message: 'Ready for this!' }
        ]);
        
        if (autoRecord) {
          startRecording();
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'broadcasts');
        alert("Erro ao iniciar transmissão.");
      }
    }
  };

  const startRecording = () => {
    if (!videoRef.current?.srcObject) return;
    
    const stream = videoRef.current.srcObject as MediaStream;
    recordedChunksRef.current = [];
    
    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Add to custom channels (library)
        const recordingChannel = {
          id: Date.now(),
          name: `Recording - ${new Date().toLocaleString()}`,
          category: 'Recordings',
          program: 'Live Stream Recording',
          image: 'https://images.unsplash.com/photo-1492619334770-22e3993d1749?q=80&w=1000&auto=format&fit=crop',
          videoUrl: url
        };
        setCustomChannels(prev => [...prev, recordingChannel]);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err instanceof Error ? err.message : String(err));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const parseTimeToSeconds = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  };

  const handlePreviewCut = (cut: any) => {
    if (videoRef.current) {
      const startTime = parseTimeToSeconds(cut.start);
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
    }
  };

  const handleSaveAsPlaylist = () => {
    if (!aiResult) return;
    
    const playlistChannel = {
      id: Date.now(),
      name: `AI Playlist - ${new Date().toLocaleDateString()}`,
      category: 'AI Generated',
      program: `${aiResult.length} Cuts Series`,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
      videoUrl: currentChannel.videoUrl, // Use current channel as base
      isPlaylist: true,
      cuts: aiResult
    };
    
    setCustomChannels(prev => [...prev, playlistChannel]);
    alert("Playlist saved to your library!");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user || !currentBroadcastId) return;

    try {
      await addDoc(collection(db, 'broadcasts', currentBroadcastId, 'chat'), {
        uid: user.uid,
        userName: user.displayName || user.email,
        message: chatInput,
        timestamp: new Date().toISOString()
      });
      setChatInput('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `broadcasts/${currentBroadcastId}/chat`);
    }
  };

  const handleModeration = async (action: 'delete' | 'ban', user: string, messageId?: string) => {
    if (userRole !== 'admin' || !currentBroadcastId) return;
    
    if (action === 'delete' && messageId) {
      try {
        // Note: deleteDoc needs to be imported
        // await deleteDoc(doc(db, 'broadcasts', currentBroadcastId, 'chat', messageId));
        // For now, we'll just filter locally if deleteDoc isn't available or for immediate feedback
        setChatMessages(prev => prev.filter(m => m.id !== messageId));
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    } else if (action === 'ban') {
      setBannedUsers(prev => [...prev, user]);
      setChatMessages(prev => prev.filter(m => m.user !== user));
      alert(`User ${user} has been banned.`);
    }
  };

  const filteredWebSources = webSources.filter(source => 
    source.name.toLowerCase().includes(webSourceSearch.toLowerCase()) ||
    source.category.toLowerCase().includes(webSourceSearch.toLowerCase()) ||
    source.url.toLowerCase().includes(webSourceSearch.toLowerCase())
  );

  const canBroadcast = Object.values(connectedPlatforms).some(Boolean) && isCameraActive && userRole === 'admin';

  const handleGenerateCuts = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingCuts(true);
    setAiResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this video description/request and suggest 5 viral "cuts" (segments) for a series.
        Request: ${aiPrompt}
        
        Return the result as a JSON array of objects with: title, start (MM:SS), end (MM:SS), and description.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                start: { type: Type.STRING },
                end: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["title", "start", "end", "description"]
            }
          }
        }
      });

      const result = JSON.parse(response.text);
      setAiResult(result);
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Failed to generate cuts. Please try again.");
    } finally {
      setIsGeneratingCuts(false);
    }
  };

  return (
    <div className="bg-background-dark font-display text-slate-100 min-h-screen flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/50 bg-slate-900/50 shrink-0 h-screen overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tv className="w-8 h-8 text-primary" />
            TV WEB
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => {
              if (currentChannel.id === 7) {
                handleChannelSelect(CHANNELS[0]);
              } else {
                setActiveTab('player');
              }
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'player' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Tv className="w-5 h-5" /> {t.player}
          </button>
          <button 
            onClick={() => setActiveTab('discover')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'discover' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Compass className="w-5 h-5" /> {t.channels}
          </button>
          <button 
            onClick={() => handleChannelSelect(CHANNELS[6])} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'radio' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Radio className="w-5 h-5" /> {t.radio}
          </button>
          <button 
            onClick={() => {
              if (userRole === 'guest') {
                setActiveTab('profile');
                alert("Please sign in to access Library");
              } else {
                setActiveTab('library');
              }
            }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'library' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Library className="w-5 h-5" /> {t.library}
          </button>
          <button 
            onClick={() => setActiveTab('web')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'web' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Globe className="w-5 h-5" /> {t.web}
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <User className="w-5 h-5" /> {t.profile}
          </button>
          <button 
            onClick={() => {
              if (userRole === 'guest') {
                setActiveTab('profile');
                alert("Please sign in to access AI Studio");
              } else {
                setActiveTab('ai-studio');
              }
            }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'ai-studio' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Wand2 className="w-5 h-5" /> {t.aiStudio}
          </button>
          <button 
            onClick={() => setActiveTab('vip')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'vip' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <ShieldCheck className="w-5 h-5" /> {t.vip}
          </button>
          <button 
            onClick={() => setActiveTab('advertise')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'advertise' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <DollarSign className="w-5 h-5" /> {t.advertise}
          </button>
          <button 
            onClick={() => setActiveTab('tools')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'tools' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Calculator className="w-5 h-5" /> {t.tools}
          </button>
          {userRole === 'admin' && (
            <button 
              onClick={() => setActiveTab('admin-payments')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'admin-payments' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <CreditCard className="w-5 h-5" /> {t.payments}
            </button>
          )}
          {userRole === 'admin' && (
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Settings className="w-5 h-5" /> {t.settings}
            </button>
          )}
        </nav>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
      <header className="flex items-center justify-between p-6 shrink-0 relative">
        <button 
          onClick={togglePlay}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-primary"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
        </button>
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">{t.nowPlaying}</p>
          <h2 className="text-sm font-semibold text-primary">{currentChannel.category}</h2>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-primary mr-2"
          >
            <option value="pt">PT</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="fr">FR</option>
            <option value="zh">ZH</option>
          </select>
          <button 
            onClick={() => setShowYoutubeInput(!showYoutubeInput)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${showYoutubeInput ? 'bg-red-600 text-white' : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300'}`}
          >
            <Youtube className="w-5 h-5" />
          </button>
          <label className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer text-slate-300">
            <Upload className="w-5 h-5" />
            <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        {/* Youtube Input Dropdown */}
        {showYoutubeInput && (
          <div className="absolute top-20 right-6 w-72 bg-[#161e2e] p-4 rounded-2xl border border-slate-700 shadow-2xl z-50">
            <form onSubmit={handleYoutubeSubmit}>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.playYoutube}</label>
              <div className="flex gap-2">
                <input 
                  type="url" 
                  placeholder={t.pasteUrl} 
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  required
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors">
                  {t.play}
                </button>
              </div>
            </form>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 flex-col items-center justify-start px-4 sm:px-6 pb-6 overflow-y-auto ${activeTab === 'player' ? 'flex' : 'hidden'}`}>
        <div className="w-full max-w-5xl flex flex-col items-center">
          {/* Video Player */}
          <div 
            ref={playerContainerRef}
            className={`relative w-full bg-black group mt-4 overflow-hidden shadow-2xl border border-slate-800/50 ${isFullscreen ? 'h-screen flex items-center justify-center' : 'max-w-4xl aspect-video rounded-2xl'}`}
            style={!isFullscreen ? { aspectRatio: '16/9' } : {}}
          >
            <ReactPlayer
              ref={playerRef}
              key={currentChannel.id}
              src={currentChannel.videoUrl}
              playing={isPlaying && (!currentChannel.isVip || isVip)}
              volume={isMuted ? 0 : volume / 100}
              playbackRate={playbackSpeed}
              width="100%"
              height="100%"
              playsInline
              config={{
                html: {
                  attributes: {
                    style: { width: '100%', height: '100%', objectFit: 'contain' },
                    controlsList: 'nodownload'
                  }
                }
              }}
              style={{ position: 'absolute', top: 0, left: 0 }}
              onPlay={() => {
                setIsPlaying(true);
                setIsLoadingVideo(false);
              }}
              onPause={() => setIsPlaying(false)}
              onReady={() => setIsLoadingVideo(false)}
              onStart={() => setIsLoadingVideo(false)}
              onError={(e) => {
                console.error('Player Error:', e instanceof Error ? e.message : String(e));
                setIsLoadingVideo(false);
              }}
            />

            {/* VIP Lock Screen */}
            {currentChannel.isVip && !isVip && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 backdrop-blur-md p-6 text-center">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Lock className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">🔒 Área Exclusiva VIP</h3>
                <p className="text-slate-400 max-w-md mb-8">
                  Este canal está disponível apenas para membros VIP. 
                  Faça o pagamento para desbloquear acesso ilimitado a filmes 4K e esportes ao vivo.
                </p>
                <button 
                  onClick={() => {
                    setActiveTab('profile');
                    setAdminView('profile');
                  }}
                  className="px-8 py-3 bg-primary text-slate-900 font-bold rounded-xl hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg shadow-primary/20"
                >
                  👉 Pagar Agora
                </button>
              </div>
            )}
            
            {/* Loading Overlay */}
            {isLoadingVideo && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            )}
            
            {/* Live Indicator Dot */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
              <span className="text-xs font-bold tracking-wider uppercase">{isPlaying ? 'Live' : 'Paused'}</span>
            </div>

            {/* Speed Selector */}
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                const nextSpeedIndex = (SPEEDS.indexOf(playbackSpeed) + 1) % SPEEDS.length;
                setPlaybackSpeed(SPEEDS[nextSpeedIndex]);
              }}
              className={`absolute bottom-4 left-4 px-3 py-1.5 flex items-center justify-center rounded-full bg-black/50 hover:bg-primary/80 text-white text-xs font-bold backdrop-blur-md transition-all ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
            >
              {playbackSpeed}x
            </button>

            {/* Fullscreen button */}
            <button 
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              className={`absolute bottom-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-primary/80 text-white backdrop-blur-md transition-all ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Station & Track Info */}
          <div className="text-center mt-8 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{currentChannel.name}</h1>
            <p className="text-lg text-slate-400">{currentChannel.program}</p>
          </div>

          {/* Favorite & Sleep Timer Actions */}
          <div className="flex gap-8 mt-8">
            <button 
              onClick={() => toggleFavorite(currentChannel.id)}
              className={`flex flex-col items-center gap-1 transition-colors ${favorites.includes(currentChannel.id) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
            >
              <Heart className={`w-6 h-6 ${favorites.includes(currentChannel.id) ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Like</span>
            </button>
            <button 
              onClick={() => {
                setSelectedChannelForPlaylist(currentChannel);
                setShowPlaylistModal(true);
              }}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors"
            >
              <List className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Save</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors">
              <Moon className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Timer</span>
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: currentChannel.name,
                    text: `Check out ${currentChannel.name} on this app!`,
                    url: window.location.href,
                  }).catch((err) => {
                    if (err.name !== 'AbortError') {
                      console.error('Error sharing:', err instanceof Error ? err.message : String(err));
                    }
                  });
                }
              }}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors"
            >
              <Share2 className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Share</span>
            </button>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-8 mt-10 w-full max-w-sm">
            <button 
              onClick={() => {
                const currentIndex = allChannels.findIndex(c => c.id === currentChannel.id);
                const prevIndex = (currentIndex - 1 + allChannels.length) % allChannels.length;
                handleChannelSelect(allChannels[prevIndex]);
              }}
              className="text-slate-300 hover:text-primary transition-colors"
            >
              <SkipBack className="w-10 h-10 fill-current" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-10 h-10 fill-current" />
              ) : (
                <Play className="w-10 h-10 fill-current ml-2" />
              )}
            </button>
            <button 
              onClick={() => {
                const currentIndex = allChannels.findIndex(c => c.id === currentChannel.id);
                const nextIndex = (currentIndex + 1) % allChannels.length;
                handleChannelSelect(allChannels[nextIndex]);
              }}
              className="text-slate-300 hover:text-primary transition-colors"
            >
              <SkipForward className="w-10 h-10 fill-current" />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="w-full max-w-xs mt-10 flex items-center gap-4">
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className="text-slate-400 hover:text-primary transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume1 className="w-6 h-6" />}
            </button>
            <div 
              className="flex-1 h-2 bg-slate-800 rounded-full relative cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                setVolume(Math.max(0, Math.min(100, (x / rect.width) * 100)));
                if (isMuted) setIsMuted(false);
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-150"
                style={{ width: isMuted ? '0%' : `${volume}%` }}
              ></div>
              {/* Handle */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-150"
                style={{ left: `calc(${isMuted ? 0 : volume}% - 8px)` }}
              ></div>
            </div>
            <Volume2 className="w-6 h-6 text-slate-400" />
          </div>
          <Footer />
        </div>
      </main>

      {/* VIP Area */}
      <main className={`flex-1 flex-col px-6 pt-2 pb-6 overflow-y-auto ${activeTab === 'vip' ? 'flex' : 'hidden'}`}>
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white">🔒 {t.vipTitle}</h2>
              <p className="text-slate-400 mt-1">{t.vipSubtitle}</p>
            </div>
            {isVip && (
              <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full flex items-center gap-2 border border-emerald-500/30">
                <Check className="w-4 h-4" /> VIP Ativo
              </div>
            )}
          </div>

          {!isVip ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Faça pagamento para desbloquear</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Tenha acesso a transmissões exclusivas, qualidade 4K e suporte prioritário.
              </p>
              
              {paymentStatus === 'pending' ? (
                <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-2xl inline-block">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
                  <p className="text-amber-500 font-bold">Aguarde confirmação do pagamento</p>
                  <p className="text-xs text-slate-400 mt-1">Seu pedido está sendo analisado por um administrador.</p>
                </div>
              ) : (
                <button 
                  onClick={handlePayNow}
                  className="bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 transition-all hover:scale-105"
                >
                  👉 {t.vipPayNow}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allChannels.filter(c => (c as any).isVip).map(channel => (
                <div 
                  key={channel.id} 
                  onClick={() => handleChannelSelect(channel)}
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden group cursor-pointer hover:border-primary/50 transition-all"
                >
                  <div className="aspect-video bg-slate-800 relative">
                    <img 
                      src={channel.image} 
                      alt={channel.name}
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle className="w-16 h-16 text-white opacity-80 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="absolute top-4 left-4 bg-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase">VIP Live</div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-lg text-white">{channel.name}</h4>
                    <p className="text-sm text-slate-400">{channel.program}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Payment Flow */}
      <main className={`flex-1 flex-col px-6 pt-2 pb-6 overflow-y-auto ${activeTab === 'payment' ? 'flex' : 'hidden'}`}>
        <div className="max-w-2xl mx-auto w-full">
          <button onClick={() => setActiveTab('vip')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
            <SkipBack className="w-4 h-4" /> Voltar
          </button>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-primary/10 p-8 border-b border-slate-800">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-primary" />
                PAGAMENTO (MULTICAIXA)
              </h2>
            </div>
            
            <div className="p-8 space-y-8">
              {paymentStep === 'details' ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <Zap className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-400 font-medium">Multicaixa Express</p>
                          <p className="text-lg font-bold text-white">+244 952 243 460</p>
                        </div>
                      </div>
                      <button className="text-primary hover:underline text-sm font-bold">Copiar</button>
                    </div>

                    <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700 space-y-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dados Bancários</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-400">Entidade</p>
                            <p className="font-bold text-white">12345</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Referência</p>
                            <p className="font-bold text-white">67890</p>
                          </div>
                          <div className="col-span-2 pt-2 border-t border-slate-700">
                            <p className="text-xs text-slate-400">Plano Selecionado</p>
                            <p className="font-bold text-white">{selectedPlan}</p>
                          </div>
                          <div className="col-span-2 pt-2 border-t border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-slate-400">Moeda de Pagamento</p>
                              <select 
                                value={selectedCurrency}
                                onChange={(e) => setSelectedCurrency(e.target.value as 'AOA' | 'USD' | 'EUR')}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-primary"
                              >
                                <option value="AOA">AOA (Kwanza)</option>
                                <option value="USD">USD (Dólar)</option>
                                <option value="EUR">EUR (Euro)</option>
                              </select>
                            </div>
                            <p className="text-xs text-slate-400">Valor a Pagar</p>
                            <p className="text-2xl font-bold text-primary">
                              {selectedCurrency === 'AOA' 
                                ? `${selectedAmount.toLocaleString()} Kz` 
                                : selectedCurrency === 'USD' 
                                  ? `$${(selectedAmount * (exchangeRates?.USD || 0)).toFixed(2)}`
                                  : `€${(selectedAmount * (exchangeRates?.EUR || 0)).toFixed(2)}`
                              }
                            </p>
                            {selectedCurrency !== 'AOA' && exchangeRates && (
                              <p className="text-xs text-slate-500 mt-1">
                                Taxa de câmbio formal: 1 {selectedCurrency} = {(1 / exchangeRates[selectedCurrency]).toFixed(2)} Kz
                              </p>
                            )}
                          </div>
                        </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={() => setPaymentStep('form')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-3"
                    >
                      <CheckSquare className="w-6 h-6" />
                      [ Já paguei ]
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-4">
                      Ao clicar em "Já paguei", você prosseguirá para o envio do comprovativo.
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">Confirme seus dados</h3>
                    <p className="text-sm text-slate-400">Preencha os dados abaixo e anexe o comprovativo para liberar seu acesso VIP.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo</label>
                      <input 
                        type="text" 
                        value={paymentName} 
                        onChange={e => setPaymentName(e.target.value)} 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" 
                        placeholder="Seu nome completo" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">WhatsApp</label>
                      <input 
                        type="tel" 
                        value={paymentWhatsapp} 
                        onChange={e => setPaymentWhatsapp(e.target.value)} 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" 
                        placeholder="+244 9XX XXX XXX" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Comprovativo de Pagamento</label>
                      <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer relative bg-slate-800/50">
                        <input 
                          type="file" 
                          accept="image/*,.pdf" 
                          onChange={e => setPaymentProof(e.target.files?.[0] || null)} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        />
                        {paymentProof ? (
                          <div className="flex flex-col items-center">
                            <Check className="w-8 h-8 text-emerald-500 mb-2" />
                            <p className="text-emerald-500 font-bold">{paymentProof.name}</p>
                            <p className="text-xs text-slate-400 mt-1">Clique para alterar</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="w-8 h-8 text-slate-500 mb-2" />
                            <p className="text-slate-300 font-medium">Clique para anexar o comprovativo</p>
                            <p className="text-xs text-slate-500 mt-1">PNG, JPG ou PDF</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button 
                      onClick={handleSubmitPayment}
                      disabled={!paymentName || !paymentWhatsapp || !paymentProof || isProcessingPayment}
                      className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3"
                    >
                      {isProcessingPayment ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                      Enviar e Concluir
                    </button>
                    <button 
                      onClick={() => setPaymentStep('details')}
                      className="w-full text-slate-400 hover:text-white py-3 rounded-xl font-medium transition-colors"
                    >
                      Voltar aos dados bancários
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Advertise Page */}
      <main className={`flex-1 flex-col px-6 pt-2 pb-6 overflow-y-auto ${activeTab === 'advertise' ? 'flex' : 'hidden'}`}>
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">ANUNCIE CONOSCO</h2>
            <p className="text-slate-400 text-lg">Alcance milhares de espectadores em nossa rede de TV e Rádio.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col hover:border-primary/50 transition-colors">
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <LucideImage className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Banner Publicitário</h3>
                <p className="text-slate-400 text-sm mb-6 flex-1">Exibição de banners estáticos em nossa plataforma web e diretório.</p>
                <div className="text-3xl font-bold text-white mb-6">5.000 Kz <span className="text-sm text-slate-500 font-normal">/mês</span></div>
                <button 
                  onClick={() => handleSelectPlan('Banner Publicitário', 5000)}
                  className="w-full py-3 rounded-xl border border-slate-700 font-bold hover:bg-slate-800 transition-colors"
                >
                  Selecionar
                </button>
              </div>

              <div className="bg-slate-900/50 border-2 border-primary rounded-3xl p-8 flex flex-col relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Mais Popular</div>
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
                  <Video className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Vídeo Comercial</h3>
                <p className="text-slate-400 text-sm mb-6 flex-1">Inserção de vídeos comerciais de 30s durante as transmissões ao vivo.</p>
                <div className="text-3xl font-bold text-white mb-6">10.000 Kz <span className="text-sm text-slate-500 font-normal">/mês</span></div>
                <button 
                  onClick={() => handleSelectPlan('Vídeo Comercial', 10000)}
                  className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors"
                >
                  Selecionar
                </button>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col hover:border-primary/50 transition-colors">
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Radio className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Rádio + TV Full</h3>
                <p className="text-slate-400 text-sm mb-6 flex-1">Pacote completo com anúncios em áudio na rádio e vídeo na TV.</p>
                <div className="text-3xl font-bold text-white mb-6">20.000 Kz <span className="text-sm text-slate-500 font-normal">/mês</span></div>
                <button 
                  onClick={() => handleSelectPlan('Rádio + TV Full', 20000)}
                  className="w-full py-3 rounded-xl border border-slate-700 font-bold hover:bg-slate-800 transition-colors"
                >
                  Selecionar
                </button>
              </div>
          </div>

          <div className="mt-12 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center">
            <h4 className="text-xl font-bold mb-4">Precisa de um pacote personalizado?</h4>
            <p className="text-slate-400 mb-6">Entre em contato com nossa equipe comercial para soluções sob medida.</p>
            <button className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold transition-colors">Contactar Suporte</button>
          </div>
        </div>
      </main>

      {/* Tools Page */}
      <main className={`flex-1 flex-col px-6 pt-2 pb-6 overflow-y-auto ${activeTab === 'tools' ? 'flex' : 'hidden'}`}>
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4 uppercase">{t.toolsTitle}</h2>
            <p className="text-slate-400 text-lg">{t.toolsSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Exchange Rates & Calculator */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">{t.toolsCalculator}</h3>
              </div>
              
              <div className="mb-8">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{t.toolsExchange}</h4>
                {exchangeRates ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                      <p className="text-slate-400 text-sm mb-1">1 USD =</p>
                      <p className="text-2xl font-bold text-white">{(1 / exchangeRates.USD).toFixed(2)} Kz</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                      <p className="text-slate-400 text-sm mb-1">1 EUR =</p>
                      <p className="text-2xl font-bold text-white">{(1 / exchangeRates.EUR).toFixed(2)} Kz</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{t.toolsCalculator}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.toolsAmount}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        placeholder="0.00"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const usdEl = document.getElementById('calc-usd') as HTMLInputElement;
                          const eurEl = document.getElementById('calc-eur') as HTMLInputElement;
                          if (usdEl && exchangeRates) usdEl.value = (val * exchangeRates.USD).toFixed(2);
                          if (eurEl && exchangeRates) eurEl.value = (val * exchangeRates.EUR).toFixed(2);
                        }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Kz</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">USD</label>
                      <div className="relative">
                        <input 
                          id="calc-usd"
                          type="number" 
                          placeholder="0.00"
                          readOnly
                          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 focus:outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">EUR</label>
                      <div className="relative">
                        <input 
                          id="calc-eur"
                          type="number" 
                          placeholder="0.00"
                          readOnly
                          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 focus:outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">€</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Calendário</h3>
              </div>
              
              <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-white mb-2">{new Date().getDate()}</div>
                  <div className="text-2xl text-slate-400 capitalize">
                    {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </div>
                  <div className="mt-8 grid grid-cols-7 gap-2 text-center text-sm">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, index) => (
                      <div key={`${d}-${index}`} className="font-bold text-slate-500">{d}</div>
                    ))}
                    {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-2"></div>
                    ))}
                    {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }).map((_, i) => (
                      <div 
                        key={i + 1} 
                        className={`p-2 rounded-lg ${i + 1 === new Date().getDate() ? 'bg-primary text-white font-bold' : 'text-slate-300 hover:bg-slate-700'}`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Admin Payments */}
      <main className={`flex-1 flex-col px-6 pt-2 pb-6 overflow-y-auto ${activeTab === 'admin-payments' ? 'flex' : 'hidden'}`}>
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Gerenciar Pagamentos</h2>
            <div className="bg-slate-800 px-4 py-2 rounded-xl text-sm font-medium text-slate-300">
              Total: {payments.length} pedidos
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nome</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Plano</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Valor</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{payment.nome}</div>
                      <div className="text-xs text-slate-400">{payment.email}</div>
                      <div className="text-xs text-slate-500">UID: {payment.uid.slice(0, 8)}...</div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">{payment.plano}</span>
                    </td>
                    <td className="p-4 font-bold text-white">{payment.valor} Kz</td>
                    <td className="p-4 text-sm text-slate-400">{new Date(payment.data).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        payment.status === 'pago' ? 'bg-emerald-500/20 text-emerald-400' :
                        payment.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {payment.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleAdminConfirm(payment.id, payment.uid)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Confirmar
                          </button>
                          <button 
                            onClick={() => handleAdminReject(payment.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> Rejeitar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500 italic">
                      Nenhum pagamento registrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Discover Tab */}
      <main className={`flex-1 flex-col px-6 pt-2 pb-6 overflow-y-auto ${activeTab === 'discover' ? 'flex' : 'hidden'}`}>
          
          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
            <button
              onClick={() => handleCategorySelect(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === null 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category 
                    ? 'bg-primary text-white' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {isLoadingChannels ? (
            <div className="flex-1 flex items-center justify-center min-h-[200px]">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChannels.map(channel => (
                <div 
                  key={channel.id} 
                  onClick={() => handleChannelSelect(channel)}
                  className={`glass-panel p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-slate-800/50 transition-colors group ${currentChannel.id === channel.id ? 'border-primary/50 bg-primary/10' : ''}`}
                >
                  <div className="w-24 h-16 rounded-lg overflow-hidden relative shrink-0 bg-slate-800">
                    <img 
                      src={channel.image} 
                      alt={channel.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">{channel.category}</p>
                    <h3 className="text-base font-bold text-white truncate">{channel.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{channel.program}</p>
                  </div>
                  {currentChannel.id === channel.id && (
                    <div className="w-2 h-2 rounded-full bg-primary mr-2 shadow-[0_0_8px_rgba(37,106,244,0.8)]"></div>
                  )}
                </div>
              ))}
              
              {filteredChannels.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500">
                  No channels found for this category.
                </div>
              )}
            </div>
          )}
          <Footer />
        </main>

      <main className={`flex-1 flex-col items-center justify-center px-6 pb-6 overflow-y-auto ${activeTab === 'radio' ? 'flex' : 'hidden'}`}>
        <div className="w-full max-w-md flex flex-col items-center mt-8">
            {/* Radio UI */}
            <div className={`w-64 h-64 rounded-full overflow-hidden border-4 border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.5)] mb-8 transition-transform duration-700 ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`}>
              <img 
                src={currentChannel.image} 
                alt={currentChannel.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <p className="text-xs text-primary font-bold uppercase tracking-widest mb-2">Live Radio</p>
            <h2 className="text-2xl font-bold text-center mb-2 text-white">{currentChannel.name}</h2>
            <p className="text-slate-400 font-medium mb-12 text-center">{currentChannel.program}</p>

            <div className="flex items-center gap-8">
              <button 
                onClick={() => {
                  const currentIndex = allChannels.findIndex(c => c.id === currentChannel.id);
                  const prevIndex = (currentIndex - 1 + allChannels.length) % allChannels.length;
                  handleChannelSelect(allChannels[prevIndex]);
                }}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-slate-300"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-20 h-20 flex items-center justify-center rounded-full bg-primary hover:bg-primary/90 transition-colors text-white shadow-[0_0_30px_rgba(37,106,244,0.3)] relative"
              >
                {isLoadingVideo ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-2" />
                )}
              </button>
              
              <button 
                onClick={() => {
                  const currentIndex = allChannels.findIndex(c => c.id === currentChannel.id);
                  const nextIndex = (currentIndex + 1) % allChannels.length;
                  handleChannelSelect(allChannels[nextIndex]);
                }}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-slate-300"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>
            
            {/* Volume Control for Radio */}
            <div className="w-full max-w-xs mt-12 flex items-center gap-4">
              <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : volume < 50 ? <Volume1 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <div 
                className="flex-1 h-2 bg-slate-800 rounded-full relative cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                  setVolume(Math.round((x / rect.width) * 100));
                  setIsMuted(false);
                }}
              >
                <div 
                  className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-150"
                  style={{ width: isMuted ? '0%' : `${volume}%` }}
                ></div>
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transition-all duration-150 opacity-0 group-hover:opacity-100"
                  style={{ left: `calc(${isMuted ? 0 : volume}% - 6px)` }}
                ></div>
              </div>
            </div>
          </div>
          <Footer />
        </main>

      <main className={`flex-1 flex-col px-6 pt-2 pb-6 overflow-y-auto ${activeTab === 'library' ? 'flex' : 'hidden'}`}>
        <h2 className="text-2xl font-bold mb-6 text-white">Your Library</h2>
          
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                <List className="w-5 h-5" /> Your Playlists
              </h3>
              <button 
                onClick={() => setShowPlaylistModal(true)}
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-full cursor-pointer transition-colors shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>
            </div>
            {playlists.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl text-center border border-slate-800/50 border-dashed">
                <List className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No playlists created yet.</p>
                <p className="text-slate-500 text-sm mt-1">Create a playlist to organize your favorite channels.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playlists.map(playlist => (
                  <div key={playlist.id} className="glass-panel p-4 rounded-2xl border border-slate-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-bold truncate">{playlist.name}</h4>
                      <button 
                        onClick={() => handleDeletePlaylist(playlist.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mb-3">{playlist.items.length} items</p>
                    {playlist.items.length > 0 ? (
                      <div className="space-y-2">
                        {playlist.items.slice(0, 3).map(item => (
                          <div key={item.id} className="flex items-center justify-between gap-2 text-sm text-slate-300">
                            <div className="flex items-center gap-2 truncate">
                              <PlayCircle className="w-4 h-4 text-primary shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </div>
                            <button 
                              onClick={() => handleRemoveFromPlaylist(playlist.id, item.id)}
                              className="text-slate-500 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {playlist.items.length > 3 && (
                          <p className="text-xs text-slate-500 italic">+{playlist.items.length - 3} more</p>
                        )}
                        <button 
                          onClick={() => {
                            if (playlist.items.length > 0) {
                              handleChannelSelect(playlist.items[0]);
                            }
                          }}
                          className="w-full mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4" /> Play All
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Empty playlist</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-10">
            <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
              <Clock className="w-5 h-5" /> Recently Played
            </h3>
            {recentChannels.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl text-center border border-slate-800/50 border-dashed">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No recent channels.</p>
                <p className="text-slate-500 text-sm mt-1">Watch some channels to see them here.</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {recentChannels.map(id => {
                  const channel = allChannels.find(c => c.id === id);
                  if (!channel) return null;
                  return (
                    <div 
                      key={channel.id} 
                      onClick={() => handleChannelSelect(channel)}
                      className="w-40 shrink-0 glass-panel p-3 rounded-2xl cursor-pointer hover:bg-slate-800/50 transition-colors group border border-transparent hover:border-slate-700"
                    >
                      <div className="w-full aspect-video rounded-lg overflow-hidden relative bg-slate-800 mb-3">
                        <img 
                          src={channel.image} 
                          alt={channel.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayCircle className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1 truncate">{channel.category}</p>
                      <h3 className="text-sm font-bold text-white truncate">{channel.name}</h3>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-10">
            <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
              <Heart className="w-5 h-5 fill-current" /> Favorites
            </h3>
            {favorites.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl text-center border border-slate-800/50 border-dashed">
                <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No favorite channels yet.</p>
                <p className="text-slate-500 text-sm mt-1">Like channels to see them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allChannels.filter(c => favorites.includes(c.id)).map(channel => (
                  <div 
                    key={channel.id} 
                    onClick={() => handleChannelSelect(channel)}
                    className="glass-panel p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-slate-800/50 transition-colors group border border-transparent hover:border-slate-700"
                  >
                    <div className="w-20 h-14 rounded-lg overflow-hidden relative shrink-0 bg-slate-800">
                      <img 
                        src={channel.image} 
                        alt={channel.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">{channel.category}</p>
                      <h3 className="text-sm font-bold text-white truncate">{channel.name}</h3>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(channel.id); }}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                <Library className="w-5 h-5" /> Custom Channels
              </h3>
              <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-full cursor-pointer transition-colors shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" />
                <span>Add</span>
                <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            {customChannels.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl text-center border border-slate-800/50 border-dashed">
                <Upload className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No custom channels added.</p>
                <p className="text-slate-500 text-sm mt-1">Upload a video to create your own channel.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customChannels.map(channel => (
                  <div 
                    key={channel.id} 
                    onClick={() => handleChannelSelect(channel)}
                    className="glass-panel p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-slate-800/50 transition-colors group border border-transparent hover:border-slate-700"
                  >
                    <div className="w-20 h-14 rounded-lg overflow-hidden relative shrink-0 bg-slate-800">
                      <img 
                        src={channel.image} 
                        alt={channel.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">{channel.category}</p>
                      <h3 className="text-sm font-bold text-white truncate">{channel.name}</h3>
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setCustomChannels(prev => prev.filter(c => c.id !== channel.id));
                        setFavorites(prev => prev.filter(id => id !== channel.id));
                        if (currentChannel.id === channel.id) {
                          handleChannelSelect(CHANNELS[0]);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Footer />
        </main>

      <main className={`flex-1 flex-col px-6 py-8 overflow-y-auto ${activeTab === 'settings' ? 'flex' : 'hidden'}`}>
        <h2 className="text-2xl font-bold mb-8 text-white">Settings</h2>
          
          <div className="space-y-8 max-w-md w-full mx-auto">
            {/* Volume Setting */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Default Volume</h3>
                <span className="text-primary font-mono">{volume}%</span>
              </div>
              <div className="flex items-center gap-4">
                <Volume1 className="w-5 h-5 text-slate-400" />
                <div 
                  className="flex-1 h-2 bg-slate-800 rounded-full relative cursor-pointer group"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                    setVolume(Math.round((x / rect.width) * 100));
                    setIsMuted(false);
                  }}
                >
                  <div 
                    className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-150"
                    style={{ width: `${volume}%` }}
                  ></div>
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-150 opacity-0 group-hover:opacity-100"
                    style={{ left: `calc(${volume}% - 8px)` }}
                  ></div>
                </div>
                <Volume2 className="w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* Playback Speed Setting */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Playback Speed</h3>
                <span className="text-primary font-mono">{playbackSpeed}x</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      playbackSpeed === speed
                        ? 'bg-primary text-white'
                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Streaming Configuration */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-primary" /> Broadcast Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Streaming Quality</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['720p', '1080p', '4k'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setStreamingQuality(q);
                          setResolution(q === '720p' ? '1280x720' : q === '1080p' ? '1920x1080' : '3840x2160');
                          setBitrate(q === '720p' ? 2500 : q === '1080p' ? 4500 : 8000);
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition-colors ${streamingQuality === q ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                      >
                        {q.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Bitrate (kbps)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1000" 
                      max="12000" 
                      step="500"
                      value={bitrate}
                      onChange={(e) => setBitrate(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary"
                    />
                    <span className="text-sm font-mono text-primary w-16 text-right">{bitrate}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Resolution</label>
                  <select 
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  >
                    <option value="1280x720">1280 x 720 (HD)</option>
                    <option value="1920x1080">1920 x 1080 (Full HD)</option>
                    <option value="2560x1440">2560 x 1440 (2K)</option>
                    <option value="3840x2160">3840 x 2160 (4K)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Auto-Record Streams</p>
                      <p className="text-xs text-slate-400">Save broadcasts to library automatically</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAutoRecord(!autoRecord)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${autoRecord ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoRecord ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Theme Setting (Placeholder) */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">Dark Mode</h3>
                <p className="text-sm text-slate-400">Toggle application theme</p>
              </div>
              <button className="w-12 h-6 bg-primary rounded-full relative transition-colors">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </button>
            </div>
          </div>
          <Footer />
        </main>

      {/* Web Directory Area */}
      <main className={`flex-1 flex-col px-6 pt-6 pb-6 overflow-y-auto bg-[#0f141e] ${activeTab === 'web' ? 'flex' : 'hidden'}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Web Directory</h2>
            <p className="text-slate-400 mt-1">Explore external radio and TV sources</p>
          </div>
          <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20">
            <Globe className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {webSources.map(source => (
            <div key={source.id} className="glass-panel p-6 rounded-3xl border border-slate-800/50 hover:border-primary/30 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-slate-800 p-3 rounded-2xl group-hover:bg-primary/20 transition-colors">
                  {source.type === 'embed' ? <Code className="w-6 h-6 text-primary" /> : <ExternalLink className="w-6 h-6 text-primary" />}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-800 px-3 py-1 rounded-full text-slate-400">
                  {source.category}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{source.name}</h3>
              <p className="text-slate-400 text-sm mb-6 truncate">{source.url}</p>
              
              <button 
                onClick={() => {
                  if (source.type === 'embed') {
                    setActiveEmbed(source);
                  } else {
                    window.open(source.url, '_blank');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-emerald-600 text-white font-bold transition-all"
              >
                {source.type === 'embed' ? 'Open Embed' : 'Open in App'}
                <ExternalLink className="w-4 h-4" />
              </button>
              {source.type === 'link' && (
                <button 
                  onClick={() => window.open(source.url, '_blank')}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900/50 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-all border border-slate-800"
                >
                  Open in New Tab
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {webSources.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <Layout className="w-16 h-16 text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-slate-500">No web sources yet</h3>
            <p className="text-slate-600 max-w-xs mt-2">Admin can add external links and embeds from the profile settings.</p>
          </div>
        )}
        
        <Footer />
      </main>

      {/* Profile / Admin Area */}
      <main className={`flex-1 flex-col px-6 pt-6 pb-6 overflow-y-auto bg-[#0f141e] ${activeTab === 'profile' ? 'flex' : 'hidden'}`}>
        {adminView === 'profile' ? (
          <>
            <h2 className="text-3xl font-bold mb-6 text-white">{t.profileTitle}</h2>
            
            {userRole === 'guest' ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center mt-10">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-xl border border-slate-700">
                  <User className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t.profileSignIn}</h3>
                <p className="text-slate-400 mb-8 max-w-xs">Save your favorite channels, create custom playlists, and sync across devices.</p>
                
                <div className="w-full max-w-xs space-y-4">
                  <button 
                    onClick={() => setUserRole('user')}
                    className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                  >
                    Sign in as {t.profileUser}
                  </button>
                  <button 
                    onClick={() => setUserRole('admin')}
                    className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors border border-slate-700"
                  >
                    Sign in as {t.profileAdmin}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Account Card */}
                <div className="flex items-center gap-5 p-6 bg-[#161e2e] rounded-3xl border border-slate-800/50 shadow-lg relative overflow-hidden">
                  {isVip && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white px-4 py-1 rounded-bl-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-1">
                      <Crown className="w-3 h-3" /> VIP Member
                    </div>
                  )}
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center shrink-0 border-2 border-primary/30 relative">
                    <span className="text-primary text-3xl font-bold">
                      {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                    {isVip && (
                      <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full border-2 border-[#161e2e] shadow-lg">
                        <Crown className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-bold text-white truncate">
                        {user?.displayName || (userRole === 'admin' ? t.profileAdmin : t.profileUser)}
                      </h3>
                    </div>
                    <p className="text-base text-slate-400 truncate mb-2">
                      {user?.email || (userRole === 'admin' ? 'admin@tvweb.com' : 'user@tvweb.com')}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-3 py-1 bg-slate-700/50 text-[10px] rounded-md text-slate-300 uppercase tracking-widest font-bold border border-slate-600/30">
                        {userRole === 'admin' ? t.profileAdmin : userRole === 'user' ? t.profileUser : t.profileGuest}
                      </span>
                      {isVip && (
                        <span className="inline-block px-3 py-1 bg-amber-500/10 text-[10px] rounded-md text-amber-500 uppercase tracking-widest font-bold border border-amber-500/20">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Dashboard */}
                {userRole === 'admin' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-blue-500 flex items-center gap-2">
                      <Settings className="w-6 h-6" /> Admin Dashboard
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        onClick={() => setAdminView('channels')}
                        className="bg-[#161e2e] p-6 rounded-3xl border border-slate-800/50 text-center cursor-pointer hover:bg-slate-800 transition-colors flex flex-col items-center justify-center shadow-lg aspect-square"
                      >
                        <Tv className="w-10 h-10 text-slate-300 mb-4" />
                        <h4 className="font-bold text-white text-lg leading-tight mb-1">Manage<br/>Channels</h4>
                        <p className="text-sm text-slate-500">{allChannels.length} active</p>
                      </div>
                      <div 
                        onClick={() => setAdminView('users')}
                        className="bg-[#161e2e] p-6 rounded-3xl border border-slate-800/50 text-center cursor-pointer hover:bg-slate-800 transition-colors flex flex-col items-center justify-center shadow-lg aspect-square"
                      >
                        <User className="w-10 h-10 text-slate-300 mb-4" />
                        <h4 className="font-bold text-white text-lg leading-tight mb-1">Manage<br/>Users</h4>
                        <p className="text-sm text-slate-500">1,248 registered</p>
                      </div>
                      <div 
                        onClick={() => setAdminView('broadcast')}
                        className="bg-[#161e2e] p-6 rounded-3xl border border-slate-800/50 text-center cursor-pointer hover:bg-slate-800 transition-colors flex flex-col items-center justify-center shadow-lg aspect-square"
                      >
                        <Radio className="w-10 h-10 text-red-500 mb-4" />
                        <h4 className="font-bold text-white text-lg leading-tight mb-1">Live Broadcast</h4>
                        <p className="text-sm text-slate-500">Stream to social networks</p>
                      </div>
                      <div 
                        onClick={() => setAdminView('webSources')}
                        className="bg-[#161e2e] p-6 rounded-3xl border border-slate-800/50 text-center cursor-pointer hover:bg-slate-800 transition-colors flex flex-col items-center justify-center shadow-lg aspect-square"
                      >
                        <Globe className="w-10 h-10 text-emerald-500 mb-4" />
                        <h4 className="font-bold text-white text-lg leading-tight mb-1">Manage<br/>Web Sources</h4>
                        <p className="text-sm text-slate-500">{webSources.length} active sources</p>
                      </div>
                      <div 
                        onClick={() => setActiveTab('admin-payments')}
                        className="bg-[#161e2e] p-6 rounded-3xl border border-slate-800/50 text-center cursor-pointer hover:bg-slate-800 transition-colors flex flex-col items-center justify-center shadow-lg aspect-square"
                      >
                        <CreditCard className="w-10 h-10 text-amber-500 mb-4" />
                        <h4 className="font-bold text-white text-lg leading-tight mb-1">Manage<br/>Payments</h4>
                        <p className="text-sm text-slate-500">{payments.filter(p => p.status === 'pending').length} pending</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Settings */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-blue-500">Account Settings</h3>
                  <div className="bg-[#161e2e] rounded-3xl border border-slate-800/50 overflow-hidden shadow-lg">
                    <button className="w-full flex items-center justify-between p-5 hover:bg-slate-800 transition-colors border-b border-slate-800/50">
                      <span className="text-white font-semibold text-lg">Edit Profile</span>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </button>
                    <button className="w-full flex items-center justify-between p-5 hover:bg-slate-800 transition-colors">
                      <span className="text-white font-semibold text-lg">Notifications</span>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* Subscription & Payments */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-emerald-500 flex items-center gap-2">
                      <CreditCard className="w-6 h-6" /> Plano & VIP
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isVip ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-400'}`}>
                      Status: {isVip ? 'VIP ATIVO' : 'GRATUITO'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {!isVip ? (
                      <div className="glass-panel p-6 rounded-3xl border border-slate-800/50 bg-slate-900/30">
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-primary/10 p-2 rounded-xl">
                            <Zap className="w-6 h-6 text-primary" />
                          </div>
                          <span className="text-2xl font-bold text-white">2.000 Kz<span className="text-sm text-slate-500 font-normal">/mês</span></span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">Plano VIP Premium</h4>
                        <ul className="text-xs text-slate-400 space-y-2 mb-6">
                          <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> Acesso à Área Exclusiva</li>
                          <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> Qualidade 4K Ultra HD</li>
                          <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> Sem anúncios</li>
                        </ul>
                        <button 
                          onClick={() => handlePayNow()}
                          className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm transition-all shadow-lg shadow-primary/20"
                        >
                          Tornar-se VIP Agora
                        </button>
                      </div>
                    ) : (
                      <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/5">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                            <ShieldCheck className="w-8 h-8 text-emerald-500" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white">Você é VIP!</h4>
                            <p className="text-xs text-slate-400">Aproveite todo o conteúdo exclusivo.</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActiveTab('vip')}
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all"
                        >
                          Ir para Área VIP
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setUserRole('guest')}
                  className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-colors border border-red-500/20 mt-4 text-lg"
                >
                  Sign Out
                </button>
              </div>
            )}
          </>
        ) : adminView === 'channels' ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setAdminView('profile')}
                  className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="text-2xl font-bold text-white">Manage Channels</h2>
              </div>
              <button 
                onClick={() => {
                  setEditingChannel(null);
                  setIsEditingChannel(true);
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-colors"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {isEditingChannel ? (
              <div className="bg-[#161e2e] p-6 rounded-3xl border border-slate-800/50 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">{editingChannel ? 'Edit Channel' : 'New Channel'}</h3>
                  <button onClick={() => setIsEditingChannel(false)} className="text-slate-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const channelData = {
                      id: editingChannel ? editingChannel.id : Date.now(),
                      name: formData.get('name') as string,
                      category: formData.get('category') as string,
                      program: formData.get('program') as string,
                      image: formData.get('image') as string,
                      videoUrl: formData.get('videoUrl') as string,
                    };

                    if (editingChannel) {
                      setChannels(prev => prev.map(c => c.id === editingChannel.id ? channelData : c));
                    } else {
                      setChannels(prev => [...prev, channelData]);
                    }
                    setIsEditingChannel(false);
                    setEditingChannel(null);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                    <input name="name" defaultValue={editingChannel?.name} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                    <input name="category" defaultValue={editingChannel?.category} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Program</label>
                    <input name="program" defaultValue={editingChannel?.program} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Image URL</label>
                    <input name="image" defaultValue={editingChannel?.image} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Video URL</label>
                    <input name="videoUrl" defaultValue={editingChannel?.videoUrl} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">
                      Save Channel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Bulk Actions Bar */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <button 
                    onClick={() => {
                      if (selectedChannels.length === channels.length) {
                        setSelectedChannels([]);
                      } else {
                        setSelectedChannels(channels.map(c => c.id));
                      }
                    }}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                  >
                    {selectedChannels.length === channels.length ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4" />}
                    {selectedChannels.length === channels.length ? 'Deselect All' : 'Select All'}
                  </button>
                  
                  {selectedChannels.length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                      <button 
                        onClick={() => setShowBulkCategory(!showBulkCategory)}
                        className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        Category <ChevronDownIcon className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => {
                          setChannels(prev => prev.filter(c => !selectedChannels.includes(c.id)));
                          setSelectedChannels([]);
                        }}
                        className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Bulk Category Assignment */}
                {showBulkCategory && selectedChannels.length > 0 && (
                  <div className="bg-slate-800/50 p-4 rounded-2xl mb-4 border border-slate-700/50 animate-in fade-in zoom-in-95">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Assign to category:</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => {
                            setChannels(prev => prev.map(c => selectedChannels.includes(c.id) ? { ...c, category: cat } : c));
                            setSelectedChannels([]);
                            setShowBulkCategory(false);
                          }}
                          className="bg-slate-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Reorder.Group 
                  axis="y" 
                  values={channels} 
                  onReorder={setChannels}
                  className="space-y-3 overflow-y-auto pb-24 pr-1"
                >
                  {channels.map(channel => (
                    <Reorder.Item 
                      key={channel.id} 
                      value={channel}
                      className="flex items-center gap-4 bg-[#161e2e] p-4 rounded-2xl border border-slate-800/50 cursor-default select-none group active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-center gap-3">
                        <div className="cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-slate-400 transition-colors">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedChannels(prev => 
                              prev.includes(channel.id) 
                                ? prev.filter(id => id !== channel.id) 
                                : [...prev, channel.id]
                            );
                          }}
                          className="text-slate-500 hover:text-blue-500 transition-colors"
                        >
                          {selectedChannels.includes(channel.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-500" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      <img src={channel.image} alt={channel.name} className="w-12 h-12 rounded-lg object-cover" />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold truncate text-sm">{channel.name}</h4>
                        <p className="text-slate-500 text-xs truncate">{channel.category}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingChannel(channel);
                            setIsEditingChannel(true);
                          }}
                          className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setChannels(prev => prev.filter(c => c.id !== channel.id))}
                          className="p-2 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            )}
          </div>
        ) : adminView === 'broadcast' ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setAdminView('profile')}
                  className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="text-2xl font-bold text-white">Live Broadcast</h2>
              </div>
              {isBroadcasting && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-500 rounded-full border border-red-500/30 animate-pulse">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-bold">{viewerCount}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-500 rounded-full border border-emerald-500/30">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold">00:45:12</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
              {/* Main Broadcast Area */}
              <div className="lg:col-span-2 space-y-6 overflow-y-auto pb-24 pr-2">
                <div className="bg-[#161e2e] p-6 rounded-3xl border border-slate-800/50 shadow-lg space-y-6">
                  {/* Camera Preview */}
                  <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-700 flex items-center justify-center group">
                    <video 
                      ref={videoRef} 
                      playsInline 
                      muted 
                      className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                    />
                    {!isCameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                        <VideoOff className="w-12 h-12 mb-2 opacity-50" />
                        <p className="text-sm font-medium">Camera is off</p>
                      </div>
                    )}
                    {isBroadcasting && (
                      <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full" />
                        LIVE
                      </div>
                    )}
                    {isRecording && (
                      <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
                        <Circle className="w-2 h-2 bg-white rounded-full fill-white" />
                        REC
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={toggleCamera}
                        className={`p-4 rounded-2xl font-bold flex items-center gap-2 transition-colors ${isCameraActive ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-primary text-slate-900 hover:bg-primary/90'}`}
                        title={isCameraActive ? "Turn Off Camera" : "Turn On Camera"}
                      >
                        {isCameraActive ? <VideoOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
                      </button>
                      <button 
                        onClick={() => isRecording ? stopRecording() : startRecording()}
                        disabled={!isCameraActive}
                        className={`p-4 rounded-2xl font-bold flex items-center gap-2 transition-colors ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-50'}`}
                        title={isRecording ? "Stop Recording" : "Start Recording"}
                      >
                        <Circle className={`w-6 h-6 ${isRecording ? 'fill-white' : ''}`} />
                      </button>
                      <button 
                        className="p-4 rounded-2xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Microphone Settings"
                      >
                        <Mic className="w-6 h-6" />
                      </button>
                    </div>

                    <button 
                      onClick={toggleBroadcast}
                      disabled={!isCameraActive || (!connectedPlatforms.youtube && !connectedPlatforms.facebook && !connectedPlatforms.twitch)}
                      className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${isBroadcasting ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20 disabled:opacity-50 disabled:shadow-none'}`}
                    >
                      {isBroadcasting ? (
                        <><VideoOff className="w-5 h-5" /> Stop Broadcasting</>
                      ) : (
                        <><Radio className="w-5 h-5" /> Start Broadcasting</>
                      )}
                    </button>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Connected Platforms</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* YouTube */}
                      <div className={`p-4 rounded-2xl border transition-all ${connectedPlatforms.youtube ? 'bg-red-600/10 border-red-600/30' : 'bg-slate-800/50 border-slate-700'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <Youtube className={`w-6 h-6 ${connectedPlatforms.youtube ? 'text-red-500' : 'text-slate-500'}`} />
                          <button 
                            onClick={() => togglePlatform('youtube')}
                            className={`w-10 h-5 rounded-full relative transition-colors ${connectedPlatforms.youtube ? 'bg-red-500' : 'bg-slate-700'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${connectedPlatforms.youtube ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">YouTube</span>
                          {connectedPlatforms.youtube && (
                            <button 
                              onClick={() => setShowPlatformSettings('youtube')}
                              className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Facebook */}
                      <div className={`p-4 rounded-2xl border transition-all ${connectedPlatforms.facebook ? 'bg-blue-600/10 border-blue-600/30' : 'bg-slate-800/50 border-slate-700'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <Facebook className={`w-6 h-6 ${connectedPlatforms.facebook ? 'text-blue-500' : 'text-slate-500'}`} />
                          <button 
                            onClick={() => togglePlatform('facebook')}
                            className={`w-10 h-5 rounded-full relative transition-colors ${connectedPlatforms.facebook ? 'bg-blue-500' : 'bg-slate-700'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${connectedPlatforms.facebook ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Facebook</span>
                          {connectedPlatforms.facebook && (
                            <button 
                              onClick={() => setShowPlatformSettings('facebook')}
                              className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Twitch */}
                      <div className={`p-4 rounded-2xl border transition-all ${connectedPlatforms.twitch ? 'bg-purple-600/10 border-purple-600/30' : 'bg-slate-800/50 border-slate-700'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <Tv className={`w-6 h-6 ${connectedPlatforms.twitch ? 'text-purple-500' : 'text-slate-500'}`} />
                          <button 
                            onClick={() => togglePlatform('twitch')}
                            className={`w-10 h-5 rounded-full relative transition-colors ${connectedPlatforms.twitch ? 'bg-purple-500' : 'bg-slate-700'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${connectedPlatforms.twitch ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Twitch</span>
                          {connectedPlatforms.twitch && (
                            <button 
                              onClick={() => setShowPlatformSettings('twitch')}
                              className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Preview */}
              <div className="bg-[#161e2e] rounded-3xl border border-slate-800/50 shadow-lg flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/20">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-white">Live Chat</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Active</span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length > 0 ? (
                    chatMessages.map((msg, idx) => (
                      <div key={idx} className="animate-in slide-in-from-bottom-2 duration-300 flex items-center justify-between group">
                        <div>
                          <span className="text-xs font-bold text-primary mr-2">{msg.user}:</span>
                          <span className="text-xs text-slate-300">{msg.message}</span>
                        </div>
                        {userRole === 'admin' && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleModeration('delete', msg.user, msg.id)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-500"
                              title="Delete Message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleModeration('ban', msg.user)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-500"
                              title="Ban User"
                            >
                              <ShieldCheck className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                      <MessageSquare className="w-12 h-12 mb-2" />
                      <p className="text-xs">Chat will appear here when live</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-900/50 border-t border-slate-800">
                  <form onSubmit={handleSendMessage} className="relative">
                    <input 
                      type="text" 
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-primary pr-10"
                      disabled={!isBroadcasting}
                    />
                    <button 
                      type="submit"
                      disabled={!isBroadcasting || !chatInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : adminView === 'webSources' ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    if (isEditingWebSource) {
                      setIsEditingWebSource(false);
                      setEditingWebSource(null);
                    } else {
                      setAdminView('profile');
                    }
                  }}
                  className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="text-2xl font-bold text-white">
                  {isEditingWebSource ? (editingWebSource?.name ? 'Edit Web Source' : 'New Web Source') : 'Manage Web Sources'}
                </h2>
              </div>
              {!isEditingWebSource && (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search sources..." 
                      value={webSourceSearch}
                      onChange={(e) => setWebSourceSearch(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 w-64"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setEditingWebSource({ id: Date.now(), name: '', url: '', type: 'link', category: 'Other' });
                      setIsEditingWebSource(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    <Plus className="w-5 h-5" /> Add Source
                  </button>
                </div>
              )}
            </div>

            {isEditingWebSource ? (
              <div className="bg-[#161e2e] p-6 rounded-3xl border border-slate-800/50 shadow-lg animate-in fade-in zoom-in-95">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const sourceData = {
                      id: editingWebSource ? editingWebSource.id : Date.now(),
                      name: formData.get('name') as string,
                      url: formData.get('url') as string,
                      type: formData.get('type') as 'link' | 'embed',
                      category: formData.get('category') as string,
                    };

                    if (webSources.find(s => s.id === sourceData.id)) {
                      setWebSources(prev => prev.map(s => s.id === sourceData.id ? sourceData : s));
                    } else {
                      setWebSources(prev => [...prev, sourceData]);
                    }
                    setIsEditingWebSource(false);
                    setEditingWebSource(null);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                    <input name="name" defaultValue={editingWebSource?.name} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">URL / Embed Code</label>
                    <textarea name="url" defaultValue={editingWebSource?.url} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 h-32" />
                    <p className="text-[10px] text-slate-500 mt-1">For embeds, paste the full HTML code (e.g., &lt;iframe...&gt;)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                      <select name="type" defaultValue={editingWebSource?.type} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500">
                        <option value="link">External Link</option>
                        <option value="embed">HTML Embed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                      <input name="category" defaultValue={editingWebSource?.category} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsEditingWebSource(false);
                        setEditingWebSource(null);
                      }}
                      className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                      <Save className="w-5 h-5" /> Save Source
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pb-24">
                {filteredWebSources.map(source => (
                  <div key={source.id} className="bg-[#161e2e] p-5 rounded-3xl border border-slate-800/50 shadow-lg group hover:border-emerald-500/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                          {source.type === 'embed' ? <Code className="w-5 h-5 text-emerald-500" /> : <ExternalLink className="w-5 h-5 text-emerald-500" />}
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {source.category}
                          </span>
                          <h4 className="text-white font-bold text-lg mt-1">{source.name}</h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {source.type === 'link' && (
                          <button 
                            onClick={() => window.open(source.url, '_blank')}
                            className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                            title="Open in New Tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setEditingWebSource(source);
                            setIsEditingWebSource(true);
                          }}
                          className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setWebSources(prev => prev.filter(s => s.id !== source.id))}
                          className="p-2 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs truncate bg-slate-900/50 p-2 rounded-lg border border-slate-800 font-mono">{source.url}</p>
                  </div>
                ))}
                {webSources.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                      <Layout className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-white font-bold text-xl">No web sources yet</h3>
                    <p className="text-slate-500 mt-2">Add external links or embeds to the directory.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setAdminView('profile')}
                className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h2 className="text-2xl font-bold text-white">Manage Users</h2>
            </div>
            <div className="flex-1 flex items-center justify-center text-slate-400">
              User management coming soon.
            </div>
          </div>
        )}
        <Footer />
      </main>

      {/* Admin Payments Area */}
      <main className={`flex-1 flex-col px-6 pt-6 pb-6 overflow-y-auto bg-[#0f141e] ${activeTab === 'admin-payments' ? 'flex' : 'hidden'}`}>
        <div className="flex flex-col h-full max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-amber-500" />
              Manage Payments
            </h2>
            <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-700">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending:</span>
              <span className="text-amber-500 font-bold">{payments.filter(p => p.status === 'pending').length}</span>
            </div>
          </div>

          <div className="bg-[#161e2e] rounded-3xl border border-slate-800/50 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-800">
                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</th>
                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                            {payment.nome?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white font-bold">{payment.nome}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{payment.uid}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-full border border-blue-500/20 uppercase">
                          {payment.plano}
                        </span>
                      </td>
                      <td className="p-6 text-white font-bold text-lg">{payment.valor} Kz</td>
                      <td className="p-6">
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full border uppercase ${
                          payment.status === 'pago' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          payment.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="p-6 text-slate-400 text-sm">
                        {payment.data ? new Date(payment.data).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-6">
                        {payment.status === 'pending' && (
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleAdminConfirm(payment.id, payment.uid)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                            >
                              [ Confirmar ]
                            </button>
                            <button 
                              onClick={() => handleAdminReject(payment.id)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-900/20"
                            >
                              [ Rejeitar ]
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <CreditCard className="w-12 h-12 text-slate-700" />
                          <p className="text-slate-500 font-medium">Nenhum pagamento registrado no sistema.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <Footer />
      </main>

      {/* AI Studio Area */}
      <main className={`flex-1 flex-col px-6 pt-6 pb-6 overflow-y-auto bg-[#0f141e] ${activeTab === 'ai-studio' ? 'flex' : 'hidden'}`}>
        <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white">AI Studio</h2>
              <p className="text-slate-400 mt-1">Generate viral series cuts from your videos using AI</p>
            </div>
            <div className="flex items-center gap-3">
              {aiResult && (
                <button 
                  onClick={handleSaveAsPlaylist}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-sm shadow-lg shadow-emerald-600/20"
                >
                  <Save className="w-4 h-4" /> Save as Playlist
                </button>
              )}
              <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20">
                <Wand2 className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-slate-800/50 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Video Description or URL</label>
              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the video content or paste a transcript/URL here. E.g., 'A 10-minute vlog about traveling to Tokyo, focus on food and hidden spots...'"
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary h-40 resize-none"
              />
            </div>

            <button 
              onClick={handleGenerateCuts}
              disabled={isGeneratingCuts || !aiPrompt.trim()}
              className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${isGeneratingCuts ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'}`}
            >
              {isGeneratingCuts ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Analyzing Video...
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6 fill-current" />
                  Generate Series Cuts
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {aiResult && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-10 space-y-6 pb-20"
              >
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Scissors className="w-6 h-6 text-primary" /> Suggested Cuts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiResult.map((cut, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="glass-panel p-5 rounded-2xl border border-slate-800/50 hover:border-primary/30 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
                        <span className="text-4xl font-bold text-primary">0{idx + 1}</span>
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded uppercase">{cut.start} - {cut.end}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">{cut.title}</h4>
                        <p className="text-sm text-slate-400 line-clamp-2">{cut.description}</p>
                        <button 
                          onClick={() => handlePreviewCut(cut)}
                          className="mt-4 flex items-center gap-2 text-xs font-bold text-primary hover:text-white transition-colors"
                        >
                          <Play className="w-4 h-4 fill-current" /> Preview Cut
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Footer />
      </main>

      {/* Embed Modal */}
      {activeEmbed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161e2e] w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Code className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-white">{activeEmbed.name}</h3>
              </div>
              <button 
                onClick={() => setActiveEmbed(null)}
                className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-white/5 flex items-center justify-center">
              <div 
                className="w-full h-full min-h-[400px] flex items-center justify-center [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:min-h-[400px] [&>iframe]:rounded-xl"
                dangerouslySetInnerHTML={{ __html: activeEmbed.url }}
              />
            </div>
            <div className="p-4 bg-slate-900/50 flex justify-end">
               <button 
                onClick={() => setActiveEmbed(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="md:hidden glass-panel border-t border-slate-800 px-4 py-4 flex justify-between items-center rounded-t-xl shrink-0 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => {
            if (currentChannel.id === 7) {
              handleChannelSelect(CHANNELS[0]); // Switch to a video channel if going to player
            } else {
              setActiveTab('player');
            }
          }}
          className={`flex flex-col items-center gap-1 transition-colors min-w-[4rem] ${activeTab === 'player' ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
        >
          <Tv className={`w-6 h-6 ${activeTab === 'player' ? 'fill-current' : ''}`} />
          <span className="text-xs font-medium">{t.player}</span>
        </button>
        <button 
          onClick={() => setActiveTab('discover')}
          className={`flex flex-col items-center gap-1 transition-colors min-w-[4rem] ${activeTab === 'discover' ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
        >
          <Compass className={`w-6 h-6 ${activeTab === 'discover' ? 'fill-current' : ''}`} />
          <span className="text-xs font-medium">{t.channels}</span>
        </button>
        <button 
          onClick={() => handleChannelSelect(CHANNELS[6])}
          className={`flex flex-col items-center gap-1 transition-colors min-w-[4rem] ${activeTab === 'radio' ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
        >
          <Radio className={`w-6 h-6 ${activeTab === 'radio' ? 'fill-current' : ''}`} />
          <span className="text-xs font-medium">{t.radio}</span>
        </button>
        <button 
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center gap-1 transition-colors min-w-[4rem] ${activeTab === 'library' ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
        >
          <Library className={`w-6 h-6 ${activeTab === 'library' ? 'fill-current' : ''}`} />
          <span className="text-xs font-medium">{t.library}</span>
        </button>
        <button 
          onClick={() => setActiveTab('web')}
          className={`flex flex-col items-center gap-1 transition-colors min-w-[4rem] ${activeTab === 'web' ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
        >
          <Globe className={`w-6 h-6 ${activeTab === 'web' ? 'fill-current' : ''}`} />
          <span className="text-xs font-medium">{t.web}</span>
        </button>
        <button 
          onClick={() => setActiveTab('vip')}
          className={`flex flex-col items-center gap-1 transition-colors min-w-[4rem] ${activeTab === 'vip' ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
        >
          <ShieldCheck className={`w-6 h-6 ${activeTab === 'vip' ? 'fill-current' : ''}`} />
          <span className="text-xs font-medium">{t.vip}</span>
        </button>
        <button 
          onClick={() => setActiveTab('tools')}
          className={`flex flex-col items-center gap-1 transition-colors min-w-[4rem] ${activeTab === 'tools' ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
        >
          <Calculator className={`w-6 h-6 ${activeTab === 'tools' ? 'fill-current' : ''}`} />
          <span className="text-xs font-medium">{t.tools}</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-colors min-w-[4rem] ${activeTab === 'profile' ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
        >
          <User className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-current' : ''}`} />
          <span className="text-xs font-medium">{t.profile}</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 transition-colors min-w-[4rem] ${activeTab === 'settings' ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
        >
          <Settings className={`w-6 h-6 ${activeTab === 'settings' ? 'fill-current' : ''}`} />
          <span className="text-xs font-medium">{t.settings}</span>
        </button>
      </nav>
      {/* Platform Settings Modal */}
      <AnimatePresence>
        {showPlatformSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlatformSettings(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#161e2e] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    showPlatformSettings === 'youtube' ? 'bg-red-600/20 text-red-500' :
                    showPlatformSettings === 'facebook' ? 'bg-blue-600/20 text-blue-500' :
                    'bg-purple-600/20 text-purple-500'
                  }`}>
                    {showPlatformSettings === 'youtube' ? <Youtube className="w-6 h-6" /> :
                     showPlatformSettings === 'facebook' ? <Facebook className="w-6 h-6" /> :
                     <Tv className="w-6 h-6" />}
                  </div>
                  <h3 className="text-xl font-bold text-white capitalize">{showPlatformSettings} Settings</h3>
                </div>
                <button 
                  onClick={() => setShowPlatformSettings(null)}
                  className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Broadcast Title</label>
                  <input 
                    type="text" 
                    value={platformSettings[showPlatformSettings].title}
                    onChange={(e) => setPlatformSettings(prev => ({
                      ...prev,
                      [showPlatformSettings]: { ...prev[showPlatformSettings], title: e.target.value }
                    }))}
                    placeholder="Enter stream title..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                  <textarea 
                    value={platformSettings[showPlatformSettings].description}
                    onChange={(e) => setPlatformSettings(prev => ({
                      ...prev,
                      [showPlatformSettings]: { ...prev[showPlatformSettings], description: e.target.value }
                    }))}
                    placeholder="Tell your viewers about the stream..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary h-32 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Thumbnail URL</label>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={platformSettings[showPlatformSettings].thumbnail}
                      onChange={(e) => setPlatformSettings(prev => ({
                        ...prev,
                        [showPlatformSettings]: { ...prev[showPlatformSettings], thumbnail: e.target.value }
                      }))}
                      placeholder="https://..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                    />
                    <button className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
                      <LucideImage className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex gap-3">
                <button 
                  onClick={() => setShowPlatformSettings(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setShowPlatformSettings(null)}
                  className="flex-1 py-3 rounded-xl bg-primary text-slate-900 font-bold hover:bg-primary/90 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Playlist Modal */}
      <AnimatePresence>
        {showPlaylistModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowPlaylistModal(false);
                setSelectedChannelForPlaylist(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#161e2e] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <List className="w-6 h-6 text-primary" />
                  {selectedChannelForPlaylist ? 'Add to Playlist' : 'Create Playlist'}
                </h3>
                <button 
                  onClick={() => {
                    setShowPlaylistModal(false);
                    setSelectedChannelForPlaylist(null);
                  }}
                  className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {selectedChannelForPlaylist && playlists.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">Save to existing</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                      {playlists.map(playlist => {
                        const isAdded = playlist.items.some(item => item.id === selectedChannelForPlaylist.id);
                        return (
                          <button
                            key={playlist.id}
                            onClick={() => {
                              if (isAdded) {
                                handleRemoveFromPlaylist(playlist.id, selectedChannelForPlaylist.id);
                              } else {
                                handleAddToPlaylist(playlist.id, selectedChannelForPlaylist);
                              }
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${isAdded ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'}`}
                          >
                            <span className="font-medium truncate pr-4">{playlist.name}</span>
                            {isAdded ? <CheckSquare className="w-5 h-5 shrink-0" /> : <Square className="w-5 h-5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-800"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-[#161e2e] px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Or create new</span>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCreatePlaylist}>
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Playlist Name</label>
                  <input 
                    type="text" 
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="E.g., Workout Mix, Late Night..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary mb-4"
                    autoFocus
                  />
                  <button 
                    type="submit"
                    disabled={!newPlaylistName.trim()}
                    className="w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Create {selectedChannelForPlaylist ? '& Save' : 'Playlist'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  </div>
  );
}
