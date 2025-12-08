import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Music, Play, Pause, Download, 
  Maximize2, X, 
  FileMusic, Sparkles, MessageSquare, Settings, PenTool,
  ChevronDown, Moon, Sun, Cpu
} from 'lucide-react';

// --- CONFIGURATION ---
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; 

// --- HELPER: ABC PARSER & DOWNLOADER ---
const extractABCData = (abcString) => {
  // Simple regex to extract T: (Title), K: (Key), Q: (Tempo)
  const getField = (tag) => {
    const match = abcString.match(new RegExp(`^${tag}:(.*)`, 'm'));
    return match ? match[1].trim() : null;
  };

  return {
    title: getField('T') || 'Untitled Composition',
    key: getField('K') || 'Thai Scale',
    tempo: getField('Q') || 'Medium',
    abc: abcString
  };
};

const downloadMIDI = (abcString, title) => {
  if (!window.ABCJS) return;

  // Get the raw data
  let midiResult = window.ABCJS.synth.getMidiFile(abcString, { midiOutputType: 'binary' });
  
  // Unwrap if it's an array of files (e.g. [{...}]) rather than bytes
  if (Array.isArray(midiResult) && midiResult.length > 0 && typeof midiResult[0] !== 'number') {
    midiResult = midiResult[0];
  }
  
  // Convert the data to a Uint8Array (Byte Array)
  let bytes;
  if (typeof midiResult === 'string') {
    // If it's a binary string, convert each character to a byte
    const len = midiResult.length;
    bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = midiResult.charCodeAt(i);
    }
  } else if (midiResult instanceof Uint8Array || Array.isArray(midiResult)) {
    // If it's already an array or Uint8Array, ensure it's a Uint8Array
    bytes = new Uint8Array(midiResult);
  } else {
    console.error("Download failed: Unknown MIDI data format returned by ABCJS");
    return;
  }

  // Create the Blob from the byte array
  const blob = new Blob([bytes], { type: 'audio/midi' });

  // Trigger the download
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}.mid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};


// --- CONSTANTS & DATA ---

/**
 * Keyword Tags Data
 */
const ALL_TAGS_DATA = [
  // 1. Joy & Celebration
  { 
    id: 'emotion-happy', category: 'emotion', group: 'Joy & Celebration', english_label: 'happy', thai_label: 'เบิกบาน', description: '', 
    related_ids: ['emotion-joyful'], 
    conflict_ids: ['emotion-sad', 'emotion-mournful', 'emotion-angry', 'emotion-fierce', 'emotion-uncanny-eerie', 'emotion-nostalgic'], 
    metadata: {} 
  },
  { 
    id: 'emotion-joyful', category: 'emotion', group: 'Joy & Celebration', english_label: 'joyful', thai_label: 'สดใส', description: '', 
    related_ids: ['emotion-happy'], 
    conflict_ids: ['emotion-sad', 'emotion-mournful', 'emotion-angry', 'emotion-fierce', 'emotion-uncanny-eerie', 'emotion-wistful'], 
    metadata: {} 
  },
  { 
    id: 'emotion-cheerful', category: 'emotion', group: 'Joy & Celebration', english_label: 'cheerful', thai_label: 'ร่าเริง', description: '', 
    related_ids: ['emotion-playful'], 
    conflict_ids: ['emotion-sad', 'emotion-mournful', 'emotion-angry', 'emotion-fierce', 'emotion-uncanny-eerie', 'emotion-meditative'], 
    metadata: {} 
  },
  { 
    id: 'emotion-playful', category: 'emotion', group: 'Joy & Celebration', english_label: 'playful', thai_label: 'คึกคัก', description: '', 
    related_ids: ['emotion-cheerful'], 
    conflict_ids: ['emotion-sad', 'emotion-mournful', 'emotion-angry', 'emotion-calm', 'emotion-meditative', 'emotion-sacred', 'emotion-reverent'], 
    metadata: {} 
  },
  { 
    id: 'emotion-spirited', category: 'emotion', group: 'Joy & Celebration', english_label: 'spirited', thai_label: 'ฮึกเหิม', description: '', 
    related_ids: ['emotion-triumphant'], 
    conflict_ids: ['emotion-calm', 'emotion-peaceful', 'emotion-sad', 'emotion-mournful', 'emotion-wistful'], 
    metadata: {} 
  },
  { 
    id: 'emotion-festive', category: 'emotion', group: 'Joy & Celebration', english_label: 'festive', thai_label: 'ครึกครื้น', description: '', 
    related_ids: ['emotion-joyful'], 
    conflict_ids: ['emotion-sad', 'emotion-mournful', 'emotion-calm', 'emotion-meditative', 'emotion-mysterious', 'emotion-uncanny-eerie'], 
    metadata: {} 
  },
  { 
    id: 'emotion-triumphant', category: 'emotion', group: 'Joy & Celebration', english_label: 'triumphant', thai_label: 'เกรียงไกร', description: '', 
    related_ids: ['emotion-majestic'], 
    conflict_ids: ['emotion-sad', 'emotion-mournful', 'emotion-weak', 'emotion-wistful'], 
    metadata: {} 
  },

  // 2. Romance & Warmth
  { 
    id: 'emotion-tenderness', category: 'emotion', group: 'Romance & Warmth', english_label: 'tenderness', thai_label: 'นุ่มนวล', description: '', 
    related_ids: ['emotion-affection'], 
    conflict_ids: ['emotion-angry', 'emotion-fierce', 'emotion-spirited', 'emotion-festive'], 
    metadata: {} 
  },
  { 
    id: 'emotion-affection', category: 'emotion', group: 'Romance & Warmth', english_label: 'affection', thai_label: 'หวาน', description: '', 
    related_ids: ['emotion-love'], 
    conflict_ids: ['emotion-angry', 'emotion-fierce', 'emotion-uncanny-eerie'], 
    metadata: {} 
  },
  { 
    id: 'emotion-love', category: 'emotion', group: 'Romance & Warmth', english_label: 'love', thai_label: 'รัก', description: '', 
    related_ids: ['emotion-affection'], 
    conflict_ids: ['emotion-angry', 'emotion-fierce', 'emotion-uncanny-eerie'], 
    metadata: {} 
  },

  // 3. Peace & Serenity
  { 
    id: 'emotion-calm', category: 'emotion', group: 'Peace & Serenity', english_label: 'calm', thai_label: 'สงบ', description: '', 
    related_ids: ['emotion-peaceful'], 
    conflict_ids: ['emotion-spirited', 'emotion-festive', 'emotion-playful', 'emotion-angry', 'emotion-fierce'], 
    metadata: {} 
  },
  { 
    id: 'emotion-peaceful', category: 'emotion', group: 'Peace & Serenity', english_label: 'peaceful', thai_label: 'ผ่อนคลาย', description: '', 
    related_ids: ['emotion-calm'], 
    conflict_ids: ['emotion-spirited', 'emotion-festive', 'emotion-angry', 'emotion-fierce', 'emotion-uncanny-eerie'], 
    metadata: {} 
  },
  { 
    id: 'emotion-meditative', category: 'emotion', group: 'Peace & Serenity', english_label: 'meditative', thai_label: 'สำรวม', description: '', 
    related_ids: ['emotion-calm'], 
    conflict_ids: ['emotion-playful', 'emotion-festive', 'emotion-cheerful', 'emotion-angry'], 
    metadata: {} 
  },
  { 
    id: 'emotion-ethereal', category: 'emotion', group: 'Peace & Serenity', english_label: 'ethereal', thai_label: 'ฟุ้งฝัน', description: '', 
    related_ids: ['emotion-mysterious'], 
    conflict_ids: ['emotion-grounded', 'emotion-fierce', 'emotion-playful'], 
    metadata: {} 
  },

  // 4. Sadness & Nostalgia
  { 
    id: 'emotion-nostalgic', category: 'emotion', group: 'Sadness & Nostalgia', english_label: 'nostalgic', thai_label: 'คิดถึง', description: '', 
    related_ids: ['emotion-wistful'], 
    conflict_ids: ['emotion-angry', 'emotion-fierce'], 
    metadata: {} 
  },
  { 
    id: 'emotion-wistful', category: 'emotion', group: 'Sadness & Nostalgia', english_label: 'wistful', thai_label: 'หวานปนเศร้า', description: '', 
    related_ids: ['emotion-nostalgic'], 
    conflict_ids: ['emotion-joyful', 'emotion-cheerful', 'emotion-festive'], 
    metadata: {} 
  },
  { 
    id: 'emotion-sad', category: 'emotion', group: 'Sadness & Nostalgia', english_label: 'sad', thai_label: 'เศร้า', description: '', 
    related_ids: ['emotion-mournful'], 
    conflict_ids: ['emotion-happy', 'emotion-joyful', 'emotion-cheerful', 'emotion-playful', 'emotion-festive', 'emotion-spirited'], 
    metadata: {} 
  },
  { 
    id: 'emotion-mournful', category: 'emotion', group: 'Sadness & Nostalgia', english_label: 'mournful', thai_label: 'โศก', description: '', 
    related_ids: ['emotion-sad'], 
    conflict_ids: ['emotion-happy', 'emotion-joyful', 'emotion-cheerful', 'emotion-playful', 'emotion-festive', 'emotion-spirited', 'emotion-triumphant'], 
    metadata: {} 
  },

  // 5. Majesty & Sacred
  { 
    id: 'emotion-majestic', category: 'emotion', group: 'Majesty & Sacred', english_label: 'majestic', thai_label: 'สง่า', description: '', 
    related_ids: ['emotion-triumphant'], 
    conflict_ids: ['emotion-playful', 'emotion-wistful', 'emotion-uncanny-eerie'], 
    metadata: {} 
  },
  { 
    id: 'emotion-auspicious', category: 'emotion', group: 'Majesty & Sacred', english_label: 'auspicious', thai_label: 'มงคล', description: '', 
    related_ids: [], 
    conflict_ids: ['emotion-sad', 'emotion-mournful', 'emotion-uncanny-eerie', 'emotion-angry'], 
    metadata: {} 
  },
  { 
    id: 'emotion-reverent', category: 'emotion', group: 'Majesty & Sacred', english_label: 'reverent', thai_label: 'ศรัทธา', description: '', 
    related_ids: ['emotion-sacred'], 
    conflict_ids: ['emotion-playful', 'emotion-fierce'], 
    metadata: {} 
  },
  { 
    id: 'emotion-sacred', category: 'emotion', group: 'Majesty & Sacred', english_label: 'sacred', thai_label: 'ขลัง', description: '', 
    related_ids: ['emotion-reverent'], 
    conflict_ids: ['emotion-playful', 'emotion-cheerful', 'emotion-fierce'], 
    metadata: {} 
  },
  { 
    id: 'emotion-devout', category: 'emotion', group: 'Majesty & Sacred', english_label: 'devout', thai_label: 'ทำนองเสนาะ', description: '', 
    related_ids: ['emotion-reverent'], 
    conflict_ids: ['emotion-playful', 'emotion-angry'], 
    metadata: {} 
  },

  // 6. Mystery & Tension
  { 
    id: 'emotion-mysterious', category: 'emotion', group: 'Mystery & Tension', english_label: 'mysterious', thai_label: 'ลี้ลับ', description: '', 
    related_ids: ['emotion-ethereal'], 
    conflict_ids: ['emotion-festive', 'emotion-cheerful', 'emotion-happy'], 
    metadata: {} 
  },
  { 
    id: 'emotion-uncanny-eerie', category: 'emotion', group: 'Mystery & Tension', english_label: 'eerie', thai_label: 'วังเวง', description: '', 
    related_ids: ['emotion-mysterious'], 
    conflict_ids: ['emotion-happy', 'emotion-joyful', 'emotion-cheerful', 'emotion-peaceful', 'emotion-affection', 'emotion-love', 'emotion-auspicious'], 
    metadata: {} 
  },
  { 
    id: 'emotion-fierce', category: 'emotion', group: 'Mystery & Tension', english_label: 'fierce', thai_label: 'กร้าว', description: '', 
    related_ids: ['emotion-angry'], 
    conflict_ids: ['emotion-calm', 'emotion-peaceful', 'emotion-tenderness', 'emotion-affection', 'emotion-playful'], 
    metadata: {} 
  },
  { 
    id: 'emotion-angry', category: 'emotion', group: 'Mystery & Tension', english_label: 'angry', thai_label: 'ดุดัน', description: '', 
    related_ids: ['emotion-fierce'], 
    conflict_ids: ['emotion-calm', 'emotion-peaceful', 'emotion-happy', 'emotion-joyful', 'emotion-love', 'emotion-tenderness'], 
    metadata: {} 
  },
];

/**
 * Presets Data
 */
const PRESETS = [
    {
        id: 'preset-1',
        name: 'Solemn Funeral',
        name_th: 'พิธีศพอันสงบ',
        description: 'For traditional Thai funeral ceremonies. Evokes a sense of reverence, sorrow, and otherworldly calm.',
        description_th: 'สำหรับพิธีศพแบบไทยดั้งเดิม ให้ความรู้สึกสงบสำรวม ความโศกเศร้า และความสงบเหนือโลก',
        selected_tag_ids: ['emotion-mournful', 'emotion-sacred', 'emotion-uncanny-eerie']
    },
    {
        id: 'preset-2',
        name: 'Grand Royal Ceremony',
        name_th: 'พระราชพิธีอันโอ่โถง',
        description: 'Music for courtly events, conveying majesty, auspiciousness, and dignified grandeur.',
        description_th: 'ดนตรีสำหรับงานในราชสำนัก สื่อถึงความสง่าผ่าเผย ความเป็นสิริมงคล และความยิ่งใหญ่',
        selected_tag_ids: ['emotion-majestic', 'emotion-auspicious']
    },
    {
        id: 'preset-3',
        name: 'Lively Folk Festival',
        name_th: 'เทศกาลพื้นบ้านอันคึกคัก',
        description: 'Upbeat and spirited music for a rural celebration, full of joy, energy, and rustic charm.',
        description_th: 'ดนตรีจังหวะสนุกสนานสำหรับงานเฉลิมฉลองในชนบท เต็มไปด้วยความสุข พลัง และเสน่ห์แบบลูกทุ่ง',
        selected_tag_ids: ['emotion-joyful', 'emotion-playful', 'emotion-festive']
    },
    {
        id: 'preset-4',
        name: 'Intimate Mahori Evening',
        name_th: 'ค่ำคืนกับวงมโหรี',
        description: 'Gentle, sweet, and nostalgic chamber music perfect for a relaxed and affectionate atmosphere.',
        description_th: 'ดนตรีวงเล็กที่อ่อนโยน หวานซึ้ง และชวนให้คิดถึง เหมาะสำหรับบรรยากาศที่ผ่อนคลายและอบอุ่น',
        selected_tag_ids: ['emotion-tenderness', 'emotion-nostalgic', 'emotion-affection']
    },
    {
        id: 'preset-5',
        name: 'Wai Khru Reverence',
        name_th: 'จิตศรัทธาในพิธีไหว้ครู',
        description: 'Sacred and respectful music for the teacher reverence ceremony, filled with devotion.',
        description_th: 'ดนตรีอันศักดิ์สิทธิ์และแสดงความเคารพสำหรับพิธีไหว้ครู เปี่ยมด้วยความศรัทธา',
        selected_tag_ids: ['emotion-devout', 'emotion-reverent']
    },
    {
        id: 'preset-6',
        name: 'Muay Thai Ritual Power',
        name_th: 'พลังแห่งพิธีมวยไทย',
        description: 'Intense, driving, and ceremonial music for the pre-fight ritual, building energy and focus.',
        description_th: 'ดนตรีที่เข้มข้น เร้าใจ และเป็นพิธีการสำหรับการไหว้ครูมวยไทย สร้างพลังและสมาธิ',
        selected_tag_ids: ['emotion-fierce', 'emotion-spirited']
    },
    {
        id: 'preset-7',
        name: 'Joyful Wedding Celebration',
        name_th: 'ฉลองมงคลสมรส',
        description: 'Happy and romantic music for a wedding, filled with warmth and auspicious blessings.',
        description_th: 'ดนตรีที่สนุกสนานและโรแมนติกสำหรับงานแต่งงาน เต็มไปด้วยความอบอุ่นและคำอวยพรมงคล',
        selected_tag_ids: ['emotion-love', 'emotion-happy', 'emotion-affection']
    },
    {
        id: 'preset-8',
        name: 'Dreamlike Khon Scene',
        name_th: 'ฉากละครโขนชวนฝัน',
        description: 'Ethereal and mysterious music to accompany a dramatic scene in Khon masked theater.',
        description_th: 'ดนตรีที่ฟุ้งฝันและลี้ลับเพื่อประกอบฉากการแสดงอันน่าทึ่งในโขน',
        selected_tag_ids: ['emotion-ethereal', 'emotion-mysterious']
    },
];

const GROUPED_TAGS = ALL_TAGS_DATA.reduce((acc, tag) => {
  const groupName = tag.group || 'Other';
  if (!acc[groupName]) acc[groupName] = [];
  acc[groupName].push(tag);
  return acc;
}, {});

// --- HELPER FUNCTIONS ---

const getTagsByCategory = (tags, category) => {
  return tags.filter(tag => tag.category === category);
};

const composeCompactPrompt = (selectedTags, language) => {
  if (language === 'TH') {
    const emotionLabels = getTagsByCategory(selectedTags, 'emotion').map(t => t.thai_label);
    const keywordString = emotionLabels.join(', ');
    if (!keywordString) return "";
    return `สร้างทำนองเพลงไทยด้วยคำสำคัญ: ${keywordString}`;
  }

  const emotionsEn = getTagsByCategory(selectedTags, 'emotion').map(t => t.english_label);
  const keywordString = emotionsEn.join(', ');
  if (!keywordString) return "";
  
  const prompt = `Create a thai melody about... ${keywordString}`;
  return prompt.length > 220 ? prompt.substring(0, 217) + '...' : prompt;
};

// --- LOCALIZATION ---
const TRANSLATIONS = {
  EN: {
    title: 'Thai Music Assistant',
    conversationMode: 'Conversation Mode',
    chat: 'Chat',
    compose: 'Compose',
    generationModel: 'Generation Model',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    placeholderChat: 'Ask about Thai music...',
    placeholderCompose: 'Describe the melody...',
    thinking: 'Thinking',
    composing: 'Composing',
    play: 'Play',
    stop: 'Stop',
    pause: 'Pause',
    listen: 'Listen',
    download: 'Download options',
    fullscreen: 'Fullscreen',
    promptAssistant: 'Prompt Assistant',
    promptAssistantTooltip: 'Only available in Compose mode',
    keywords: 'Keywords',
    presets: 'Presets',
    usePrompt: 'Use Prompt',
    clearAll: 'Clear All',
    currentPrompt: 'Current Prompt',
    conflictWarning: 'Conflict detected with:',
    limitWarning: 'You can select up to 5 keywords.',
    close: 'Close',
    selected: 'Selected',
    remove: 'Remove',
    noTagsSelected: 'No keywords selected',
  },
  TH: {
    title: 'Thai Music Assistant',
    conversationMode: 'โหมดการสนทนา',
    chat: 'พูดคุย',
    compose: 'ประพันธ์เพลง',
    generationModel: 'โมเดลปัญญาประดิษฐ์',
    darkMode: 'โหมดมืด',
    lightMode: 'โหมดสว่าง',
    placeholderChat: 'ถามเกี่ยวกับดนตรีไทย...',
    placeholderCompose: 'อธิบายทำนองเพลง...',
    thinking: 'กำลังประมวลผล',
    composing: 'กำลังประพันธ์เพลง',
    play: 'เล่นเพลง',
    stop: 'หยุด',
    pause: 'หยุดชั่วคราว',
    listen: 'ลองฟัง',
    download: 'ตัวเลือกดาวน์โหลด',
    fullscreen: 'ขยายเต็มจอ',
    promptAssistant: 'ตัวช่วยสร้างคำสั่ง',
    promptAssistantTooltip: 'ใช้งานได้เฉพาะในโหมดประพันธ์เพลง',
    keywords: 'คำสำคัญ',
    presets: 'ชุดคำสั่งสำเร็จรูป',
    usePrompt: 'ใช้คำสั่งนี้',
    clearAll: 'ล้างทั้งหมด',
    currentPrompt: 'คำสั่งปัจจุบัน',
    conflictWarning: 'ไม่สามารถเลือกได้เนื่องจากขัดแย้งกับ:',
    limitWarning: 'คุณสามารถเลือกคำสำคัญได้สูงสุด 5 คำ',
    close: 'ปิด',
    selected: 'เลือกแล้ว',
    remove: 'ลบ',
    noTagsSelected: 'ยังไม่ได้เลือกคำสำคัญ',
  }
};

// --- COMPONENTS ---

const AVAILABLE_MODELS = [
  { 
    provider: 'OpenAI',
    models: [
      { id: 'gpt-5-mini', name: 'GPT-5 Mini' },
      { id: 'gpt-5', name: 'GPT-5' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
      { id: 'gpt-4.1', name: 'GPT-4.1' },
    ]
  },
  { 
    provider: 'Google',
    models: [
      { id: 'gemini-3-pro', name: 'Gemini 3 Pro' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    ]
  },
  { 
    provider: 'Anthropic',
    models: [
      { id: 'claude-haiku-4.5', name: 'Claude 4.5 Haiku' },
      { id: 'claude-sonnet-4.5', name: 'Claude 4.5 Sonnet' },
      { id: 'claude-opus-4.5', name: 'Claude 4.5 Opus' },
    ]
  },
  { 
    provider: 'Other',
    models: [
      { id: 'deepseek', name: 'DeepSeek-V3' },
    ]
  }
];

const SheetMusic = ({ abcString, title, musicKey, tempo, uniqueId, isDarkMode, lang }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [abcjs, setAbcjs] = useState(null);
  const notationRef = useRef(null);
  const synthRef = useRef(null);
  const downloadRef = useRef(null);
  
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (window.ABCJS) {
      setAbcjs(window.ABCJS);
      return;
    }
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/abcjs/6.2.2/abcjs-basic-min.js";
    script.async = true;
    script.onload = () => setAbcjs(window.ABCJS);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (downloadRef.current && !downloadRef.current.contains(event.target)) {
        setIsDownloadOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Updated useEffect to handle cleanup thoroughly
  useEffect(() => {
    const el = notationRef.current;
    
    // Clear existing content to prevent duplication
    if (el) {
      el.innerHTML = '';
    }

    if (abcjs && el) {
      const renderParams = {
        responsive: 'resize', 
        add_classes: true,
        paddingbottom: 30,
        paddingtop: 30,
        paddingright: 20,
        paddingleft: 20,
      };

      const visualObj = abcjs.renderAbc(el, abcString, renderParams);

      if (abcjs.synth.supportsAudio()) {
        const synth = new abcjs.synth.CreateSynth();
        synth.init({ visualObj: visualObj[0] }).then(() => {
          synthRef.current = synth;
        }).catch(console.warn);
      }
    }

    // Cleanup function
    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
      }
      // Explicitly clear DOM on unmount/re-render to prevent stacking
      if (el) {
        el.innerHTML = '';
      }
    };
  }, [abcjs, abcString, isFullscreen]); 

  const togglePlay = async () => {
    if (!synthRef.current) return;
    
    if (isPlaying) {
      synthRef.current.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      await synthRef.current.init({
        visualObj: abcjs.renderAbc(notationRef.current, abcString, { 
          responsive: 'resize'
        })[0]
      });
      await synthRef.current.prime();
      synthRef.current.start();
    }
  };

  const toggleFullscreen = () => {
    if (synthRef.current) {
      synthRef.current.stop();
      setIsPlaying(false);
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
     downloadMIDI(abcString, title);
     setIsDownloadOpen(false);
  };

  if (isFullscreen) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col backdrop-blur-sm animate-in fade-in duration-200 ${isDarkMode ? 'bg-slate-950/95' : 'bg-slate-50/95'}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${isDarkMode ? 'bg-teal-600' : 'bg-teal-600'}`}>
               <Music size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">{title || "Untitled Composition"}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={togglePlay}
                className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all shadow-md ${
                  isPlaying 
                    ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                    : isDarkMode ? 'bg-teal-500 hover:bg-teal-600 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                <span>{isPlaying ? t.stop : t.play}</span>
              </button>
            <button 
              onClick={toggleFullscreen}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
          <div className={`rounded-lg shadow-2xl p-8 min-h-[500px] w-full max-w-6xl border ${isDarkMode ? 'bg-white border-slate-700' : 'bg-white border-slate-200'}`}>
             <div 
               key="fullscreen-paper" 
               ref={notationRef} 
               className="w-full text-slate-900"
             ></div>
          </div>
        </div>
      </div>
    );
  }

  const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const headerBg = isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200';
  const iconBg = isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-teal-50 text-teal-700';
  const textTitle = isDarkMode ? 'text-slate-200' : 'text-slate-800';
  const dropdownBg = isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700';
  const hoverBg = isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50';

  return (
    <div className={`relative mt-4 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-visible w-full max-w-xl ${cardBg}`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between rounded-t-2xl ${headerBg}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <Music size={18} />
          </div>
          <div>
             <h3 className={`font-bold text-sm ${textTitle}`}>{title}</h3>
          </div>
        </div>
        
        <div className="relative" ref={downloadRef}>
           <button 
             onClick={() => setIsDownloadOpen(!isDownloadOpen)}
             className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}
             title={t.download}
           >
              <Download size={16} />
           </button>
           
           {isDownloadOpen && (
             <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl z-20 overflow-hidden ${dropdownBg}`}>
               <button 
                 onClick={handleDownload}
                 className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${hoverBg}`}
               >
                 <FileMusic size={16} />
                 <span>Download MIDI</span>
               </button>
             </div>
           )}
        </div>
      </div>

      <div className="p-4 bg-white relative min-h-[160px] flex items-center justify-center">
        <div 
          key="inline-paper"
          ref={notationRef} 
          className="w-full text-slate-900 overflow-x-auto" 
        ></div>
        {!abcjs && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50">
             <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2"></div>
             <span className="text-xs text-slate-500">Rendering score...</span>
          </div>
        )}
      </div>

      <div className={`px-4 py-3 border-t flex items-center justify-between rounded-b-2xl ${isDarkMode ? 'bg-slate-900/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
         <button 
           onClick={(e) => { e.stopPropagation(); togglePlay(); }}
           className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
             isPlaying 
             ? 'bg-slate-700 text-white hover:bg-slate-600' 
             : isDarkMode ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-900/20' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-200'
           }`}
         >
           {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
           <span>{isPlaying ? t.pause : t.listen}</span>
         </button>

         <div className="flex items-center gap-3 text-slate-400">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} 
              className={`hover:text-teal-500 transition-colors ${isDarkMode ? 'text-slate-500' : ''}`}
              title={t.fullscreen}
            >
              <Maximize2 size={16} />
            </button>
         </div>
      </div>
    </div>
  );
};

const ChatMessage = ({ message, isDarkMode, lang }) => {
  const isUser = message.role === 'user';
  const userBubble = 'bg-teal-600 text-white';
  const aiBubble = isDarkMode 
    ? 'bg-slate-800 border border-slate-700 text-slate-200 shadow-sm' 
    : 'bg-white border border-slate-200 text-slate-700 shadow-sm';
  const aiAvatar = 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white';

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
        {!isUser && (
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${aiAvatar}`}>
            <Music size={20} />
          </div>
        )}

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
          <div className={`relative px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm ${isUser ? `${userBubble} rounded-tr-none` : `${aiBubble} rounded-tl-none`}`}>
            {message.content && !message.musicData && <p className="whitespace-pre-wrap">{message.content}</p>}
            
            {message.musicData && (
              <SheetMusic 
                abcString={message.musicData.abc} 
                title={message.musicData.title}
                musicKey={message.musicData.key}
                tempo={message.musicData.tempo}
                uniqueId={message.id} 
                isDarkMode={isDarkMode}
                lang={lang}
              />
            )}
          </div>
          <span className={`text-[10px] mt-2 px-1 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {message.timestamp}
          </span>
        </div>
      </div>
    </div>
  );
};

const CustomSelect = ({ groups, value, onChange, label, isDarkMode, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const allOptions = groups.flatMap(g => g.models);
  const selectedOption = allOptions.find(o => o.id === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const baseClasses = isDarkMode 
    ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750" 
    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50";

  const dropdownClasses = isDarkMode
    ? "bg-slate-800 border-slate-700 shadow-xl"
    : "bg-white border-slate-200 shadow-xl";

  const optionClasses = (isSelected) => isDarkMode
    ? isSelected ? "bg-teal-900/30 text-teal-300" : "text-slate-300 hover:bg-slate-700"
    : isSelected ? "bg-teal-50 text-teal-900" : "text-slate-700 hover:bg-slate-50";

  return (
    <div className="relative" ref={wrapperRef}>
      {label && <div className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        {Icon && <Icon size={14} />}
        <span>{label}</span>
      </div>}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${baseClasses}`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="text-left truncate">
            <div className="text-sm font-semibold truncate">{selectedOption?.name || 'Select Model'}</div>
          </div>
        </div>
        <ChevronDown size={16} className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 w-full mt-2 rounded-xl border max-h-80 overflow-y-auto custom-scrollbar ${dropdownClasses}`}>
          <div className="p-2">
            {groups.map((group, groupIdx) => (
              <div key={groupIdx} className="mb-2 last:mb-0">
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 px-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {group.provider}
                </div>
                {group.models.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => { onChange(option.id); setIsOpen(false); }}
                    className={`w-full text-left p-2 rounded-lg mb-0.5 flex items-center gap-3 transition-colors ${optionClasses(option.id === value)}`}
                  >
                    <div className="text-sm font-medium">{option.name}</div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PromptAssistantModal = ({ isOpen, onClose, onConfirm, isDarkMode, lang }) => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [activeTab, setActiveTab] = useState('presets'); 
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    // Real-time prompt generation
    const prompt = composeCompactPrompt(selectedTags, lang);
    setCurrentPrompt(prompt);
  }, [selectedTags, lang]);

  const checkConflict = (tagToCheck) => {
    const conflictingIds = tagToCheck.conflict_ids || [];
    const foundConflict = selectedTags.find(t => conflictingIds.includes(t.id));
    return foundConflict;
  };

  const handleTagClick = (tag) => {
    // If already selected, remove it
    if (selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
      return;
    }

    // Check conflict
    const conflict = checkConflict(tag);
    if (conflict) {
      alert(`${t.conflictWarning} ${lang === 'TH' ? conflict.thai_label : conflict.english_label}`);
      return;
    }
    
    // Check Limit (5)
    if (selectedTags.length >= 5) {
      alert(t.limitWarning);
      return;
    }

    setSelectedTags(prev => [...prev, tag]);
  };

  const handlePresetClick = (preset) => {
    // Find all tag objects from IDs
    const newTags = [];
    preset.selected_tag_ids.forEach(id => {
      const foundTag = ALL_TAGS_DATA.find(t => t.id === id);
      if (foundTag) newTags.push(foundTag);
    });
    setSelectedTags(newTags);
  };

  if (!isOpen) return null;

  const bgClass = isDarkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900";
  const mutedText = isDarkMode ? "text-slate-400" : "text-slate-500";
  const cardBg = isDarkMode ? "bg-slate-800" : "bg-slate-50";
  const hoverBg = isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100";
  const activeTabClass = isDarkMode ? "border-teal-500 text-teal-400" : "border-teal-600 text-teal-700";
  const inactiveTabClass = isDarkMode ? "border-transparent text-slate-500 hover:text-slate-300" : "border-transparent text-slate-500 hover:text-slate-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${bgClass}`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
           <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
                <Sparkles size={20} />
             </div>
             <h2 className="text-xl font-bold">{t.promptAssistant}</h2>
           </div>
           <button onClick={onClose} className={`p-2 rounded-full transition-colors ${hoverBg}`}>
             <X size={20} />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Selection Area */}
          <div className="flex-1 flex flex-col border-r overflow-hidden relative">
            
            {/* Tabs */}
            <div className={`flex px-6 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
               <button 
                 onClick={() => setActiveTab('presets')}
                 className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'presets' ? activeTabClass : inactiveTabClass}`}
               >
                 {t.presets}
               </button>
               <button 
                 onClick={() => setActiveTab('keywords')}
                 className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'keywords' ? activeTabClass : inactiveTabClass}`}
               >
                 {t.keywords}
               </button>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
               
               {/* Presets Tab */}
               {activeTab === 'presets' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {PRESETS.map(preset => (
                     <button
                       key={preset.id}
                       onClick={() => handlePresetClick(preset)}
                       className={`text-left p-4 rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99] ${cardBg} ${isDarkMode ? 'border-slate-700 hover:border-teal-500/50' : 'border-slate-200 hover:border-teal-500/50'}`}
                     >
                       <div className="font-bold text-base mb-1 text-teal-600">
                         {lang === 'TH' ? preset.name_th : preset.name}
                       </div>
                       <p className={`text-xs leading-relaxed ${mutedText}`}>
                         {lang === 'TH' ? preset.description_th : preset.description}
                       </p>
                     </button>
                   ))}
                 </div>
               )}

               {/* Keywords Tab */}
               {activeTab === 'keywords' && (
                 <div className="space-y-6">
                   {Object.entries(GROUPED_TAGS).map(([groupName, tags]) => (
                     <div key={groupName}>
                       <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${mutedText}`}>{groupName}</h3>
                       <div className="flex flex-wrap gap-2">
                         {tags.map(tag => {
                           const isSelected = selectedTags.some(t => t.id === tag.id);
                           const isConflicted = !isSelected && checkConflict(tag);
                           
                           let chipClass = isDarkMode 
                              ? "bg-slate-800 border-slate-700 hover:bg-slate-700" 
                              : "bg-white border-slate-200 hover:bg-slate-50";
                           
                           if (isSelected) {
                              chipClass = "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/20";
                           } else if (isConflicted) {
                              chipClass = `opacity-40 cursor-not-allowed ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'}`;
                           }

                           return (
                             <button
                               key={tag.id}
                               onClick={() => handleTagClick(tag)}
                               disabled={!!isConflicted && !isSelected}
                               className={`px-3 py-1.5 rounded-full text-sm border transition-all flex items-center gap-1.5 ${chipClass}`}
                               title={isConflicted ? `${t.conflictWarning} ${lang === 'TH' ? isConflicted.thai_label : isConflicted.english_label}` : ''}
                             >
                               {lang === 'TH' ? tag.thai_label : tag.english_label}
                             </button>
                           );
                         })}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>

          {/* Right Panel: Live Preview & Actions */}
          <div className={`w-80 flex flex-col ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50/50'}`}>
            <div className="flex-1 p-6 overflow-y-auto">
               <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>{t.selected} ({selectedTags.length})</h3>
                  {selectedTags.length > 0 && (
                    <button 
                      onClick={() => setSelectedTags([])}
                      className="text-xs text-rose-500 hover:underline flex items-center gap-1"
                    >
                      <X size={12} /> {t.clearAll}
                    </button>
                  )}
               </div>

               {selectedTags.length === 0 ? (
                 <div className={`text-sm italic p-4 rounded-lg border border-dashed text-center ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
                   {t.noTagsSelected}
                 </div>
               ) : (
                 <div className="space-y-2 mb-6">
                   {selectedTags.map(tag => (
                     <div key={tag.id} className={`flex items-center justify-between p-2 rounded-lg text-sm ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                       <span>{lang === 'TH' ? tag.thai_label : tag.english_label}</span>
                       <button onClick={() => handleTagClick(tag)} className="text-slate-400 hover:text-rose-500">
                         <X size={14} />
                       </button>
                     </div>
                   ))}
                 </div>
               )}

               <div className="mt-6">
                 <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${mutedText}`}>{t.currentPrompt}</h3>
                 <div className={`p-4 rounded-xl text-sm leading-relaxed border ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                   {currentPrompt || <span className="opacity-50">...</span>}
                 </div>
               </div>
            </div>

            <div className={`p-6 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                onClick={() => {
                  if (currentPrompt) {
                    onConfirm(currentPrompt);
                    onClose();
                  }
                }}
                disabled={!currentPrompt}
                className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                  !currentPrompt 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20 active:scale-[0.98]'
                }`}
              >
                <Sparkles size={18} />
                {t.usePrompt}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---

export default function App() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings State
  const [selectedModel, setSelectedModel] = useState('gpt-5-mini');
  const [conversationMode, setConversationMode] = useState('chat');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // New States
  const [language, setLanguage] = useState('EN');
  const [isPromptAssistantOpen, setIsPromptAssistantOpen] = useState(false);

  // Initial State: Empty messages
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const t = TRANSLATIONS[language];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Prepare chat history in the format expected by backend
      const chat_history = [...messages, userMsg].map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.musicData ? msg.musicData.abc : msg.content 
      }));

      // 2. Determine mode and model string
      const modeString = conversationMode === 'compose' ? 'Compose' : 'Chat'; 
      
      const allModels = AVAILABLE_MODELS.flatMap(g => g.models);
      const selectedModelObj = allModels.find(m => m.id === selectedModel);
      const modelName = selectedModelObj ? selectedModelObj.id : "gpt-5-mini";

      // 3. Fetch from Backend
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: modeString.toLowerCase(),
          model: modelName,
          chat_history: chat_history
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // 4. Process Response
      let aiContent = data.content;
      let musicData = null;

      if (modeString === 'Compose') {
        musicData = extractABCData(aiContent);
      }

      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        content: aiContent,
        musicData: musicData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error("Error:", error);
      const errorMsg = {
        id: Date.now() + 1,
        role: 'ai',
        content: "Sorry, I encountered an error connecting to the server. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const openPromptAssistant = () => {
    if (conversationMode === 'compose') {
      setIsPromptAssistantOpen(true);
    }
  };

  // Styles based on Theme
  const mainBg = isDarkMode ? 'bg-slate-950' : 'bg-slate-50';
  const sidebarBg = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textPrimary = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const headerBorder = isDarkMode ? 'border-slate-800' : 'border-slate-200';

  return (
    <div className={`flex h-screen font-sans transition-colors duration-200 ${mainBg} ${textPrimary} selection:bg-teal-500 selection:text-white`}>
      {/* Prompt Assistant Overlay */}
      <PromptAssistantModal 
        isOpen={isPromptAssistantOpen}
        onClose={() => setIsPromptAssistantOpen(false)}
        onConfirm={(promptText) => setInput(promptText)}
        isDarkMode={isDarkMode}
        lang={language}
      />

      {/* Sidebar (Desktop only) */}
      <div className={`hidden md:flex w-80 flex-col border-r shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 ${sidebarBg}`}>
        <div className={`px-4 py-6 border-b ${headerBorder}`}>
          <div className="flex items-center gap-3">
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-gradient-to-br from-teal-600 to-emerald-700 shadow-lg shadow-teal-900/50' : 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-200/50'}`}>
                <Music size={16} className="text-white" />
             </div>
             <h1 className={`font-bold text-lg tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${textPrimary}`}>
               Thai Music Assistant
             </h1>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">
          
          {/* Conversation Mode */}
          <div>
            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              <Settings size={14} />
              <span>{t.conversationMode}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setConversationMode('chat')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  conversationMode === 'chat' 
                    ? isDarkMode ? 'bg-slate-800 border-teal-500 text-teal-300 shadow-sm' : 'bg-teal-50 border-teal-300 text-teal-900 shadow-sm' 
                    : isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-500 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <MessageSquare size={18} className="mb-1" />
                <span className="text-xs font-semibold">{t.chat}</span>
              </button>
              <button 
                onClick={() => setConversationMode('compose')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  conversationMode === 'compose' 
                    ? isDarkMode ? 'bg-slate-800 border-teal-500 text-teal-300 shadow-sm' : 'bg-teal-50 border-teal-300 text-teal-900 shadow-sm' 
                    : isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-500 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <PenTool size={18} className="mb-1" />
                <span className="text-xs font-semibold">{t.compose}</span>
              </button>
            </div>
          </div>

          {/* Settings Group */}
          <div className="space-y-6">
            <CustomSelect 
              label={t.generationModel}
              groups={AVAILABLE_MODELS}
              value={selectedModel}
              onChange={setSelectedModel}
              isDarkMode={isDarkMode}
              icon={Cpu}
            />
          </div>

        </div>

        {/* Footer Settings */}
        <div className={`p-4 border-t space-y-3 ${headerBorder} ${isDarkMode ? '' : 'bg-white'}`}>
           {/* Dark Mode Toggle */}
           <button 
             onClick={() => setIsDarkMode(!isDarkMode)}
             className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 border border-transparent text-slate-300 hover:bg-slate-750' : 'bg-white border border-slate-200 text-slate-600 hover:bg-white/80'}`}
           >
              <div className="flex items-center gap-2 text-sm font-medium">
                {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                <span>{isDarkMode ? t.darkMode : t.lightMode}</span>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-teal-600' : 'bg-slate-300'}`}>
                 <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isDarkMode ? 'left-4.5' : 'left-0.5'}`} style={{ left: isDarkMode ? '18px' : '2px' }}></div>
              </div>
           </button>
           
           {/* Language Toggle */}
           <div className={`flex p-1 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
             <button 
               onClick={() => setLanguage('EN')}
               className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${language === 'EN' ? (isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-teal-900') : 'text-slate-400 hover:text-slate-500'}`}
             >
               EN
             </button>
             <button 
               onClick={() => setLanguage('TH')}
               className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${language === 'TH' ? (isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-teal-900') : 'text-slate-400 hover:text-slate-500'}`}
             >
               TH
             </button>
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className={`md:hidden p-4 border-b flex items-center gap-3 sticky top-0 z-10 shadow-sm ${sidebarBg} ${headerBorder}`}>
           <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-teal-600 to-emerald-700' : 'bg-gradient-to-br from-teal-500 to-emerald-600'}`}>
              <Music className="text-white" size={16} />
            </div>
            <div className="flex flex-col justify-center overflow-hidden">
              <h1 className={`font-bold text-lg tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${textPrimary}`}>Thai Music Assistant</h1>
            </div>
        </div>

        {/* Chat Stream */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-10 space-y-4 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
          <div className="max-w-4xl mx-auto w-full min-h-[50vh] flex flex-col">
            {messages.length === 0 ? (
              // Empty State (Blank)
              null
            ) : (
              messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} isDarkMode={isDarkMode} lang={language} />
              ))
            )}
            
            {isLoading && (
              <div className="flex w-full mb-8 justify-start">
                <div className="flex max-w-[85%] gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${isDarkMode ? 'bg-teal-600' : 'bg-gradient-to-br from-teal-500 to-emerald-600'}`}>
                    <Music size={20} className="text-white animate-bounce" />
                  </div>
                  <div className={`border px-6 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <span className={`text-sm font-medium ${textSecondary}`}>
                      {conversationMode === 'compose' ? t.composing : t.thinking}
                    </span>
                    <span className="flex gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-teal-400' : 'bg-teal-400'}`} style={{ animationDelay: '0ms' }}></span>
                      <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-teal-400' : 'bg-teal-400'}`} style={{ animationDelay: '150ms' }}></span>
                      <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-teal-400' : 'bg-teal-400'}`} style={{ animationDelay: '300ms' }}></span>
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={`border-t p-6 md:p-8 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] ${sidebarBg} ${headerBorder}`}>
          <div className="max-w-4xl mx-auto w-full relative flex gap-3">
             
             {/* Prompt Assistant Button */}
             <div className="relative group">
                <button
                  type="button"
                  onClick={openPromptAssistant}
                  disabled={conversationMode !== 'compose'}
                  className={`p-4 rounded-2xl border transition-all ${
                    conversationMode === 'compose'
                      ? isDarkMode 
                        ? 'bg-slate-800 border-teal-500/50 text-teal-400 hover:bg-slate-700 hover:text-teal-300' 
                        : 'bg-white border-teal-200 text-teal-600 hover:bg-teal-50'
                      : `opacity-40 cursor-not-allowed ${
                          isDarkMode 
                            ? 'bg-slate-800 border-slate-700 text-slate-500' 
                            : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`
                  }`}
                >
                  <Sparkles size={20} />
                </button>
                {/* Tooltip for disabled state */}
                {conversationMode !== 'compose' && (
                  <div className="absolute bottom-full left-0 mb-2 w-max px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {t.promptAssistantTooltip}
                  </div>
                )}
             </div>

            <form onSubmit={handleSend} className="flex-1 relative flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  conversationMode === 'compose' 
                    ? t.placeholderCompose 
                    : t.placeholderChat
                }
                className={`flex-1 text-base rounded-2xl block w-full p-4 pl-5 transition-all shadow-inner placeholder:text-slate-400 ${
                  isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-500 focus:bg-slate-800' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:border-teal-500'
                }`}
              />
              
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className={`absolute right-3 p-2.5 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg ${
                  isDarkMode 
                  ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-900/30' 
                  : 'bg-teal-600 hover:bg-teal-700 shadow-teal-200'
                }`}
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
