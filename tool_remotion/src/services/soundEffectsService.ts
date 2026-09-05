// Dịch vụ 50 Sound Effects chuẩn Editor chuyên nghiệp sử dụng Web Audio API thuần
// Hoạt động 100% offline, không phụ thuộc internet, âm thanh chân thực tức thì!

export interface SoundEffectItem {
  id: string;
  name: string;
  category: 'transitions_whoosh' | 'pops_clicks' | 'impacts_boom' | 'notifications_money' | 'meme_funny' | 'cinematic';
  duration: number; // in seconds
  description: string;
  play: () => void;
}

// Audio Context Singleton
let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Helper: Tạo tiếng nổ tiếng ồn (White/Pink Noise)
function playNoise(duration: number, filterFreq: number, decay: number, type: BiquadFilterType = 'lowpass') {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.8, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
  noise.stop(ctx.currentTime + duration);
}

// Helper: Tạo sóng sin lướt tần số (Whoosh / Laser / Drop)
function playFrequencySweep(
  startFreq: number,
  endFreq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.5
) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), ctx.currentTime + duration);

  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(gainPeak, ctx.currentTime + duration * 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// Helper: Hợp âm / Đa âm (Ding, Bell, Chord)
function playChimes(frequencies: number[], duration: number, decay: number) {
  const ctx = getAudioContext();
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

    gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.08 + decay);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + i * 0.08);
    osc.stop(ctx.currentTime + i * 0.08 + duration);
  });
}

export const SOUND_EFFECTS_LIST: SoundEffectItem[] = [
  // ==========================================
  // NHÓM 1: WHOOSH & TRANSITIONS (VỤT GIÓ)
  // ==========================================
  {
    id: 'sfx_fast_whoosh',
    name: '1. Fast Whoosh (Vụt Gió Cực Nhanh)',
    category: 'transitions_whoosh',
    duration: 0.3,
    description: 'Âm thanh chuyển cảnh chớp nhoáng của TikTok',
    play: () => playNoise(0.35, 1800, 0.3, 'bandpass')
  },
  {
    id: 'sfx_deep_whoosh',
    name: '2. Deep Whoosh (Gió Trầm Dày)',
    category: 'transitions_whoosh',
    duration: 0.5,
    description: 'Vụt gió âm trầm điện ảnh uy lực',
    play: () => playFrequencySweep(350, 60, 0.45, 'triangle', 0.6)
  },
  {
    id: 'sfx_air_swish',
    name: '3. Air Swish (Gió Lướt Nhẹ)',
    category: 'transitions_whoosh',
    duration: 0.25,
    description: 'Lướt gió êm dịu khi hiện chữ',
    play: () => playNoise(0.25, 3000, 0.2, 'highpass')
  },
  {
    id: 'sfx_reverse_whoosh',
    name: '4. Reverse Whoosh (Gió Vút Ngược)',
    category: 'transitions_whoosh',
    duration: 0.6,
    description: 'Âm thanh hút ngược trước khi nổ bùng',
    play: () => playFrequencySweep(80, 800, 0.5, 'sine', 0.5)
  },
  {
    id: 'sfx_whip_pan',
    name: '5. Whip Pan (Quay Phim Quất Roi)',
    category: 'transitions_whoosh',
    duration: 0.3,
    description: 'Chuyển góc máy giật nảy',
    play: () => playFrequencySweep(1200, 150, 0.25, 'sawtooth', 0.4)
  },
  {
    id: 'sfx_cinematic_swoosh',
    name: '6. Cinematic Swoosh (Bom Tấn)',
    category: 'transitions_whoosh',
    duration: 0.7,
    description: 'Gió phim bom tấn Hollywood',
    play: () => {
      playNoise(0.6, 1200, 0.5, 'bandpass');
      playFrequencySweep(250, 40, 0.6, 'sine', 0.7);
    }
  },
  {
    id: 'sfx_laser_whoosh',
    name: '7. Laser Whoosh (Tia Laser Xé Gió)',
    category: 'transitions_whoosh',
    duration: 0.4,
    description: 'Vụt gió viễn tưởng sci-fi',
    play: () => playFrequencySweep(2200, 200, 0.35, 'sawtooth', 0.35)
  },
  {
    id: 'sfx_flyby',
    name: '8. Jet Flyby (Phản Lực Bay Qua)',
    category: 'transitions_whoosh',
    duration: 0.8,
    description: 'Âm thanh vật thể phóng qua màn hình',
    play: () => playFrequencySweep(600, 90, 0.8, 'triangle', 0.5)
  },

  // ==========================================
  // NHÓM 2: POPS, CLICKS & UI (BẬT NÚT, GÕ PHÍM)
  // ==========================================
  {
    id: 'sfx_bubble_pop',
    name: '9. Bubble Pop (Bong Bóng Bóc)',
    category: 'pops_clicks',
    duration: 0.15,
    description: 'Tiếng nổ bóc cực vui khi sticker xuất hiện',
    play: () => playFrequencySweep(400, 1100, 0.12, 'sine', 0.8)
  },
  {
    id: 'sfx_mouse_click',
    name: '10. Mouse Click (Bấm Chuột Máy Tính)',
    category: 'pops_clicks',
    duration: 0.1,
    description: 'Tiếng click chuột dứt khoát',
    play: () => playFrequencySweep(1500, 300, 0.05, 'square', 0.3)
  },
  {
    id: 'sfx_keyboard_typing',
    name: '11. Keyboard Tap (Gõ Phím Cơ)',
    category: 'pops_clicks',
    duration: 0.1,
    description: 'Tiếng gõ phím lách cách typewriter',
    play: () => playNoise(0.08, 4000, 0.05, 'highpass')
  },
  {
    id: 'sfx_cork_pop',
    name: '12. Bottle Cork Pop (Bật Nắp Chai)',
    category: 'pops_clicks',
    duration: 0.2,
    description: 'Tiếng nổ bật nắp vang nhẹ',
    play: () => playFrequencySweep(200, 850, 0.15, 'sine', 0.9)
  },
  {
    id: 'sfx_wooden_click',
    name: '13. Wooden Block (Gõ Mõ Gỗ)',
    category: 'pops_clicks',
    duration: 0.15,
    description: 'Tiếng cốc cốc mộc mạc',
    play: () => playFrequencySweep(650, 200, 0.1, 'triangle', 0.7)
  },
  {
    id: 'sfx_toggle_switch',
    name: '14. Toggle Switch (Bật Công Tắc)',
    category: 'pops_clicks',
    duration: 0.12,
    description: 'Tiếng gạt công tắc điện',
    play: () => {
      playFrequencySweep(800, 1200, 0.04, 'square', 0.25);
      setTimeout(() => playFrequencySweep(1200, 600, 0.05, 'square', 0.3), 50);
    }
  },
  {
    id: 'sfx_snap_finger',
    name: '15. Finger Snap (Búng Tay)',
    category: 'pops_clicks',
    duration: 0.15,
    description: 'Tiếng búng tay tách một phát',
    play: () => playNoise(0.1, 2500, 0.08, 'bandpass')
  },
  {
    id: 'sfx_camera_shutter',
    name: '16. Camera Shutter (Tách Chụp Ảnh)',
    category: 'pops_clicks',
    duration: 0.3,
    description: 'Tiếng màn trập máy ảnh cơ cực chân thực',
    play: () => {
      playNoise(0.08, 2000, 0.06, 'highpass');
      setTimeout(() => playNoise(0.12, 1500, 0.1, 'bandpass'), 70);
    }
  },

  // ==========================================
  // NHÓM 3: IMPACTS & BOOM (BASS BÙM, VA CHẠM)
  // ==========================================
  {
    id: 'sfx_vine_boom',
    name: '17. Vine Boom (Trống Nổ Meme Huyền Thoại)',
    category: 'impacts_boom',
    duration: 0.8,
    description: 'Tiếng BOOM tạo kịch tính giật mình nổi tiếng',
    play: () => {
      playFrequencySweep(160, 25, 0.7, 'triangle', 0.9);
      playNoise(0.3, 400, 0.25, 'lowpass');
    }
  },
  {
    id: 'sfx_heavy_thud',
    name: '18. Heavy Thud (Va Đập Nện Bàn)',
    category: 'impacts_boom',
    duration: 0.4,
    description: 'Tiếng nện đồ vật nặng xuống sàn',
    play: () => playFrequencySweep(120, 30, 0.3, 'sine', 0.8)
  },
  {
    id: 'sfx_bass_drop',
    name: '19. Bass Drop (Thả Bass Rung Lắc)',
    category: 'impacts_boom',
    duration: 1.2,
    description: 'Tiếng sub-bass hạ tần số rung rinh',
    play: () => playFrequencySweep(90, 20, 1.1, 'sine', 0.9)
  },
  {
    id: 'sfx_metal_hit',
    name: '20. Metal Hit (Keng Sắt Thép)',
    category: 'impacts_boom',
    duration: 0.5,
    description: 'Tiếng va chạm kim loại đanh thép',
    play: () => {
      playFrequencySweep(900, 450, 0.3, 'square', 0.3);
      playChimes([1200, 1850], 0.4, 0.3);
    }
  },
  {
    id: 'sfx_punch_hit',
    name: '21. Punch Impact (Cú Đấm Hành Động)',
    category: 'impacts_boom',
    duration: 0.3,
    description: 'Cú đấm hành động dứt khoát',
    play: () => {
      playFrequencySweep(250, 50, 0.2, 'sawtooth', 0.6);
      playNoise(0.15, 800, 0.12, 'lowpass');
    }
  },
  {
    id: 'sfx_glass_shatter',
    name: '22. Glass Shatter (Vỡ Kính Xoảng)',
    category: 'impacts_boom',
    duration: 0.6,
    description: 'Tiếng kính cửa sổ bị đập vỡ',
    play: () => playNoise(0.5, 6000, 0.4, 'highpass')
  },
  {
    id: 'sfx_sub_boom',
    name: '23. Sub Boom (Sóng Xung Kích)',
    category: 'impacts_boom',
    duration: 1.0,
    description: 'Sóng xung kích nổ sâu hoành tráng',
    play: () => playFrequencySweep(75, 18, 0.9, 'sine', 1.0)
  },

  // ==========================================
  // NHÓM 4: NOTIFICATIONS & MONEY (TING TIỀN, CHUÔNG)
  // ==========================================
  {
    id: 'sfx_ka_ching',
    name: '24. Ka-Ching (Máy Đếm Tiền Nổ Số)',
    category: 'notifications_money',
    duration: 0.6,
    description: 'Âm thanh ting tiền về tài khoản',
    play: () => {
      playFrequencySweep(800, 1600, 0.08, 'triangle', 0.5);
      setTimeout(() => playChimes([1760, 2637], 0.5, 0.4), 100);
    }
  },
  {
    id: 'sfx_ding_bell',
    name: '25. Ding Bell (Ting Chuông Báo)',
    category: 'notifications_money',
    duration: 0.5,
    description: 'Chuông báo ting trong vắt',
    play: () => playChimes([1567], 0.6, 0.5)
  },
  {
    id: 'sfx_coin_pickup',
    name: '26. Mario Coin (Ăn Tiền Vàng Mario)',
    category: 'notifications_money',
    duration: 0.4,
    description: 'Tiếng ăn đồng xu 8-bit kinh điển',
    play: () => {
      playFrequencySweep(987, 1318, 0.25, 'sine', 0.6);
    }
  },
  {
    id: 'sfx_success_chime',
    name: '27. Success Chord (Hợp Âm Chiến Thắng)',
    category: 'notifications_money',
    duration: 0.8,
    description: '3 nốt nhạc thành công Đô - Mi - Sol',
    play: () => playChimes([523, 659, 783, 1046], 0.8, 0.6)
  },
  {
    id: 'sfx_cash_register',
    name: '28. Cash Register (Két Sắt Mở)',
    category: 'notifications_money',
    duration: 0.7,
    description: 'Kéo ngăn kéo két sắt kim loại',
    play: () => {
      playFrequencySweep(500, 900, 0.1, 'square', 0.3);
      setTimeout(() => playChimes([1318, 2093], 0.5, 0.4), 120);
    }
  },
  {
    id: 'sfx_iphone_sent',
    name: '29. Message Swoosh (Gửi Tin Nhắn)',
    category: 'notifications_money',
    duration: 0.3,
    description: 'Tiếng vút gió gửi tin nhắn iPhone',
    play: () => playFrequencySweep(350, 1400, 0.22, 'sine', 0.5)
  },
  {
    id: 'sfx_error_buzz',
    name: '30. Error Buzz (Tít Sai / Cảnh Báo)',
    category: 'notifications_money',
    duration: 0.35,
    description: 'Tiếng buzz còi báo lỗi thất bại',
    play: () => {
      playFrequencySweep(150, 140, 0.3, 'sawtooth', 0.4);
    }
  },
  {
    id: 'sfx_censor_beep',
    name: '31. Censor Bleep (Bíp Kiểm Duyệt 1000Hz)',
    category: 'notifications_money',
    duration: 0.4,
    description: 'Tiếng bíp bíp che từ nhạy cảm trong TV',
    play: () => playFrequencySweep(1000, 1000, 0.35, 'sine', 0.6)
  },

  // ==========================================
  // NHÓM 5: MEME & FUNNY (HÀI HƯỚC TRIỆU VIEW)
  // ==========================================
  {
    id: 'sfx_cartoon_boing',
    name: '32. Cartoon Boing (Lò Xo Tưng Tưng)',
    category: 'meme_funny',
    duration: 0.4,
    description: 'Tiếng nhảy lò xo hoạt hình Tom & Jerry',
    play: () => playFrequencySweep(200, 750, 0.3, 'triangle', 0.7)
  },
  {
    id: 'sfx_bruh_tone',
    name: '33. Bruh Sound (Meme Bất Lực Bruh)',
    category: 'meme_funny',
    duration: 0.5,
    description: 'Âm trầm bất lực ngao ngán',
    play: () => playFrequencySweep(110, 85, 0.45, 'sawtooth', 0.5)
  },
  {
    id: 'sfx_fart_prank',
    name: '34. Funny Rip (Troll Bựa Vui Nhộn)',
    category: 'meme_funny',
    duration: 0.3,
    description: 'Tiếng xì hơi troll hài hước',
    play: () => playNoise(0.25, 220, 0.2, 'lowpass')
  },
  {
    id: 'sfx_quack_toy',
    name: '35. Rubber Duck (Vịt Cao Su Kêu Cạc)',
    category: 'meme_funny',
    duration: 0.25,
    description: 'Bóp vịt cao su kêu chít chít',
    play: () => playFrequencySweep(1200, 700, 0.18, 'triangle', 0.6)
  },
  {
    id: 'sfx_slide_whistle',
    name: '36. Slide Whistle Up (Còi Hút Gió Lên)',
    category: 'meme_funny',
    duration: 0.6,
    description: 'Còi huýt sáo kéo cao trào hài hước',
    play: () => playFrequencySweep(300, 1400, 0.5, 'sine', 0.5)
  },
  {
    id: 'sfx_slide_whistle_down',
    name: '37. Slide Whistle Down (Còi Tụt Hứng Xuống)',
    category: 'meme_funny',
    duration: 0.6,
    description: 'Còi huýt sáo rơi tự do thất vọng',
    play: () => playFrequencySweep(1400, 250, 0.5, 'sine', 0.5)
  },
  {
    id: 'sfx_cricket_silence',
    name: '38. Awkward Crickets (Tiếng Dế Kêu Ngượng)',
    category: 'meme_funny',
    duration: 0.8,
    description: 'Dế kêu chíp chíp khi không ai cười',
    play: () => {
      playFrequencySweep(4500, 4800, 0.08, 'sine', 0.2);
      setTimeout(() => playFrequencySweep(4500, 4800, 0.08, 'sine', 0.2), 120);
      setTimeout(() => playFrequencySweep(4500, 4800, 0.08, 'sine', 0.2), 240);
    }
  },
  {
    id: 'sfx_record_scratch',
    name: '39. Record Scratch (Dừng Đĩa Than Bất Ngờ)',
    category: 'meme_funny',
    duration: 0.4,
    description: 'Kim đĩa than quẹt xẹt dừng bài hát đột ngột',
    play: () => playNoise(0.35, 1200, 0.28, 'bandpass')
  },
  {
    id: 'sfx_punchline_rimshot',
    name: '40. Ba-Dum-Tss (Trống Tấu Hài)',
    category: 'meme_funny',
    duration: 0.7,
    description: 'Tiếng gõ trống tấu hài sau câu nói đùa',
    play: () => {
      playFrequencySweep(180, 50, 0.1, 'sine', 0.7);
      setTimeout(() => playFrequencySweep(220, 60, 0.1, 'sine', 0.7), 120);
      setTimeout(() => playNoise(0.3, 5000, 0.25, 'highpass'), 240);
    }
  },

  // ==========================================
  // NHÓM 6: CINEMATIC & GLITCH (ĐIỆN ẢNH & NHIỄU SÓNG)
  // ==========================================
  {
    id: 'sfx_glitch_static',
    name: '41. Glitch Static (Nhiễu Sóng Tivi Xẹt Xẹt)',
    category: 'cinematic',
    duration: 0.35,
    description: 'Tiếng nhiễu sóng tivi gián đoạn hình ảnh',
    play: () => playNoise(0.3, 3500, 0.2, 'bandpass')
  },
  {
    id: 'sfx_cinematic_riser',
    name: '42. Tension Riser (Dồn Dập Hồi Hộp Tăng Dần)',
    category: 'cinematic',
    duration: 1.5,
    description: 'Âm thanh đẩy cảm xúc nghẹt thở trước cao trào',
    play: () => playFrequencySweep(60, 1600, 1.4, 'sawtooth', 0.4)
  },
  {
    id: 'sfx_heartbeat_slow',
    name: '43. Slow Heartbeat (Tiếng Tim Đập Kịch Tính)',
    category: 'cinematic',
    duration: 0.6,
    description: 'Thình thịch hồi hộp nghẹt thở',
    play: () => {
      playFrequencySweep(70, 30, 0.15, 'sine', 0.8);
      setTimeout(() => playFrequencySweep(80, 35, 0.15, 'sine', 0.6), 180);
    }
  },
  {
    id: 'sfx_time_ticking',
    name: '44. Clock Ticking (Kim Đồng Hồ Tích Tắc)',
    category: 'cinematic',
    duration: 0.4,
    description: 'Tiếng đếm ngược thời gian gấp gáp',
    play: () => playNoise(0.04, 3200, 0.03, 'highpass')
  },
  {
    id: 'sfx_thunder_crack',
    name: '45. Thunder Strike (Sấm Sét Rền Vang)',
    category: 'cinematic',
    duration: 1.2,
    description: 'Sấm sét giáng xuống chân trời',
    play: () => {
      playNoise(0.2, 5000, 0.1, 'highpass');
      setTimeout(() => playNoise(1.0, 300, 0.8, 'lowpass'), 50);
    }
  },
  {
    id: 'sfx_sci_fi_hum',
    name: '46. Sci-Fi Power Up (Khởi Động Năng Lượng)',
    category: 'cinematic',
    duration: 0.9,
    description: 'Nạp năng lượng tàu vũ trụ tương lai',
    play: () => playFrequencySweep(100, 950, 0.8, 'sine', 0.5)
  },
  {
    id: 'sfx_rewind_tape',
    name: '47. Tape Rewind (Tua Nhanh Băng Cassette)',
    category: 'cinematic',
    duration: 0.5,
    description: 'Tiếng tua ngược thời gian vù vù',
    play: () => playFrequencySweep(1800, 400, 0.4, 'triangle', 0.4)
  },
  {
    id: 'sfx_magic_sparkle',
    name: '48. Magic Sparkle (Phép Thuật Lấp Lánh)',
    category: 'cinematic',
    duration: 0.7,
    description: 'Tiếng rắc bụi tiên kỳ diệu',
    play: () => playChimes([1318, 1567, 1975, 2349, 2793], 0.7, 0.5)
  },
  {
    id: 'sfx_radar_beep',
    name: '49. Radar Ping (Quét Sóng Sonar Tàu Ngầm)',
    category: 'cinematic',
    duration: 0.8,
    description: 'Tiếng ping quét radar xa xôi',
    play: () => playFrequencySweep(1800, 1800, 0.6, 'sine', 0.3)
  },
  {
    id: 'sfx_cinematic_hit_braam',
    name: '50. Inception Horn Braam (Kèn Điện Ảnh Bom Tấn)',
    category: 'cinematic',
    duration: 1.4,
    description: 'Tiếng rống Inception Horn chấn động phòng vé',
    play: () => {
      playFrequencySweep(80, 40, 1.3, 'sawtooth', 0.8);
      playFrequencySweep(160, 80, 1.3, 'triangle', 0.6);
    }
  }
];

// Quản lý Custom SFX do người dùng tải lên (lưu trữ trong localStorage)
const STORAGE_KEY_CUSTOM_SFX = 'remotion_custom_sfx_list';

export interface CustomSfxItem {
  id: string;
  name: string;
  url: string; // Base64 Data URL hoặc link mp3
  duration: number;
}

export function getCustomSoundEffects(): CustomSfxItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_SFX);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomSoundEffect(name: string, url: string, duration: number = 1.0): CustomSfxItem {
  const list = getCustomSoundEffects();
  const newItem: CustomSfxItem = {
    id: `custom_sfx_${Date.now()}`,
    name,
    url,
    duration
  };
  const nextList = [newItem, ...list];
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_SFX, JSON.stringify(nextList));
  } catch (e) {
    console.warn('Không thể lưu SFX vào localStorage:', e);
  }
  return newItem;
}

export function deleteCustomSoundEffect(id: string) {
  const list = getCustomSoundEffects().filter((s) => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_SFX, JSON.stringify(list));
  } catch (e) {
    console.warn('Lỗi khi xóa SFX:', e);
  }
}

export function getSoundEffectById(id?: string): SoundEffectItem | undefined {
  if (!id) return undefined;
  
  const found = SOUND_EFFECTS_LIST.find((s) => s.id === id);
  if (found) return found;

  // Tìm trong Custom SFX
  const customList = getCustomSoundEffects();
  const customFound = customList.find((c) => c.id === id);
  if (customFound) {
    return {
      id: customFound.id,
      name: customFound.name,
      category: 'pops_clicks',
      duration: customFound.duration,
      description: 'Âm thanh tùy chỉnh của bạn',
      play: () => {
        const audio = new Audio(customFound.url);
        audio.play().catch((err) => console.warn('Lỗi phát âm thanh custom:', err));
      }
    };
  }

  // Nếu là đường dẫn URL hoặc Data URL trực tiếp
  if (id.startsWith('data:audio/') || id.startsWith('http://') || id.startsWith('https://') || id.startsWith('blob:')) {
    return {
      id,
      name: 'Custom Sound MP3',
      category: 'pops_clicks',
      duration: 1.0,
      description: 'Âm thanh tải lên',
      play: () => {
        const audio = new Audio(id);
        audio.play().catch((err) => console.warn('Lỗi phát âm thanh:', err));
      }
    };
  }

  return undefined;
}

export function playSoundEffectById(id?: string) {
  const item = getSoundEffectById(id);
  if (item) {
    try {
      item.play();
    } catch (e) {
      console.warn('Lỗi phát SFX:', e);
    }
  }
}

