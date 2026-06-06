// Romantic Biopic & Photo Gallery JS logic

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const partner1Input = document.getElementById('partner-1-input');
  const partner2Input = document.getElementById('partner-2-input');
  const daysCountEl = document.getElementById('days-together-count');
  const anniversaryDateEl = document.getElementById('anniversary-date');
  const totalMemoriesEl = document.getElementById('total-memories-count');
  const galleryGrid = document.getElementById('gallery-grid-container');
  const particlesContainer = document.getElementById('particles-container');

  // Music Player elements
  const playPauseBtn = document.getElementById('play-pause-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const vinylDisc = document.getElementById('vinyl-disc');
  const bgAudio = document.getElementById('bg-audio');

  // Form Elements
  const memoryForm = document.getElementById('memory-form');
  const memoryTitle = document.getElementById('memory-title');
  const memoryDate = document.getElementById('memory-date');
  const memoryImageInput = document.getElementById('memory-image');
  const memoryNote = document.getElementById('memory-note');
  const uploadBox = document.getElementById('upload-box');
  const uploadPreview = document.getElementById('upload-preview');
  const uploadInstructions = document.getElementById('upload-instructions');

  // Sync UI Elements
  const syncSettingsBtn = document.getElementById('sync-settings-btn');
  const syncModal = document.getElementById('sync-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const syncSettingsForm = document.getElementById('sync-settings-form');
  const syncUrlInput = document.getElementById('sync-url');
  const syncKeyInput = document.getElementById('sync-key');
  const disconnectSyncBtn = document.getElementById('disconnect-sync-btn');
  const syncStatusEl = document.getElementById('sync-status');

  // --- Default Memories Data ---
  const defaultMemories = [
    {
      id: 1,
      title: "Walk Under the Stars",
      date: "2025-10-15",
      image: "assets/starry_night.png",
      note: "Walking home under a blanket of stars, realization dawning that we are meant to be. This night was when everything shifted, and the cold air couldn't touch the warmth in my heart."
    },
    {
      id: 2,
      title: "Our First Latte",
      date: "2025-06-20",
      image: "assets/cozy_cafe.png",
      note: "Finding warmth in the winter cold, talking for hours over hot lattes. I didn't want the coffee to end because it meant saying goodbye. Lucky for us, we never had to."
    },
    {
      id: 3,
      title: "Ocean Sunset Promise",
      date: "2026-04-12",
      image: "assets/beach_sunset.png",
      note: "Watching the sun dissolve into the ocean, whispering promises for the future. The pink sky reflected in your eyes is my absolute favorite view in the universe."
    }
  ];

  // --- State Initialization ---
  let memories = [];
  let supabase = null;
  let isSyncEnabled = false;

  // Default pre-connected Supabase configuration
  const fallbackSupabaseUrl = 'https://fnzytnyxbyueeydyxqty.supabase.co';
  const fallbackSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuenl0bnl4Ynl1ZWV5ZHl4cXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTg1MDgsImV4cCI6MjA5NjMzNDUwOH0.jpLEn9-fDTSsFY6zw8r_fI3zEA6UK9MSabyFrTe8AUk';

  // --- Supabase Database Integration & Lifecycle ---
  const initSupabase = () => {
    const isDisconnected = localStorage.getItem('supabase_disconnected') === 'true';
    let url = localStorage.getItem('supabase_url');
    let key = localStorage.getItem('supabase_key');
    
    if (isDisconnected) {
      isSyncEnabled = false;
      updateSyncBadge(false);
      return;
    }
    
    if (!url || !key) {
      url = fallbackSupabaseUrl;
      key = fallbackSupabaseKey;
    }
    
    if (url && key) {
      try {
        // Instantiate the CDN-provided Supabase client
        supabase = window.supabase.createClient(url, key);
        isSyncEnabled = true;
        updateSyncBadge(true, url, key);
      } catch (err) {
        console.error("Supabase initialization failed:", err);
        isSyncEnabled = false;
        updateSyncBadge(false);
      }
    } else {
      isSyncEnabled = false;
      updateSyncBadge(false);
    }
  };

  const updateSyncBadge = (connected, activeUrl = '', activeKey = '') => {
    if (connected) {
      syncStatusEl.classList.remove('offline');
      syncStatusEl.classList.add('connected');
      syncStatusEl.querySelector('.sync-text').textContent = 'Cloud Connected';
      disconnectSyncBtn.style.display = 'block';
      syncUrlInput.value = localStorage.getItem('supabase_url') || activeUrl;
      syncKeyInput.value = localStorage.getItem('supabase_key') || activeKey;
    } else {
      syncStatusEl.classList.remove('connected');
      syncStatusEl.classList.add('offline');
      syncStatusEl.querySelector('.sync-text').textContent = 'Offline Mode';
      disconnectSyncBtn.style.display = 'none';
    }
  };

  // --- Fetching & Upload Sync Methods ---
  const loadMemories = async () => {
    if (isSyncEnabled && supabase) {
      try {
        const { data, error } = await supabase
          .from('memories')
          .select('*')
          .order('id', { ascending: false });
        
        if (error) throw error;
        memories = data || [];
      } catch (err) {
        console.warn("Could not load memories from database, using LocalStorage fallback:", err);
        loadLocalMemoriesFallback();
      }
    } else {
      loadLocalMemoriesFallback();
    }
    renderGallery();
  };

  const loadLocalMemoriesFallback = () => {
    memories = JSON.parse(localStorage.getItem('us_memories')) || [];
    if (memories.length === 0) {
      memories = [...defaultMemories];
      localStorage.setItem('us_memories', JSON.stringify(memories));
    }
  };

  const migrateLocalDataToCloud = async () => {
    if (!supabase) return;
    try {
      // Fetch cloud IDs to prevent duplicate inserts
      const { data: cloudData, error: fetchErr } = await supabase.from('memories').select('id');
      if (fetchErr) throw fetchErr;
      
      const cloudIds = new Set((cloudData || []).map(item => Number(item.id)));
      const localMemories = JSON.parse(localStorage.getItem('us_memories')) || [];
      const toUpload = localMemories.filter(m => !cloudIds.has(Number(m.id)));

      if (toUpload.length > 0) {
        const { error: uploadErr } = await supabase.from('memories').insert(toUpload);
        if (uploadErr) throw uploadErr;
        console.log(`Successfully migrated ${toUpload.length} local memories to the cloud!`);
      }

      // Migrate Settings keys
      const p1 = localStorage.getItem('partner1') || 'Sharu';
      const p2 = localStorage.getItem('partner2') || 'Maalu';
      const annDateStr = localStorage.getItem('us_anniversary') || '2025-06-07';

      await supabase.from('settings').upsert([
        { key: 'partner1', value: p1 },
        { key: 'partner2', value: p2 },
        { key: 'anniversary', value: annDateStr }
      ]);
    } catch (err) {
      console.warn("Migration failed. Please check table structure in Supabase SQL editor:", err);
    }
  };

  // --- Name Setup & Dynamic Inputs ---
  const loadNames = async () => {
    let p1 = 'Sharu';
    let p2 = 'Maalu';

    if (isSyncEnabled && supabase) {
      try {
        const { data: d1 } = await supabase.from('settings').select('value').eq('key', 'partner1').maybeSingle();
        const { data: d2 } = await supabase.from('settings').select('value').eq('key', 'partner2').maybeSingle();
        if (d1) p1 = d1.value;
        if (d2) p2 = d2.value;
      } catch (err) {
        console.warn("Failed fetching names from database, reading local:", err);
        p1 = localStorage.getItem('partner1') || 'Sharu';
        p2 = localStorage.getItem('partner2') || 'Maalu';
      }
    } else {
      p1 = localStorage.getItem('partner1') || 'Sharu';
      p2 = localStorage.getItem('partner2') || 'Maalu';
    }

    partner1Input.value = p1;
    partner2Input.value = p2;
    adjustInputSize(partner1Input);
    adjustInputSize(partner2Input);
  };

  const adjustInputSize = (input) => {
    input.size = Math.max(input.value.length || 1, 3);
  };

  const saveNames = async () => {
    const p1 = partner1Input.value;
    const p2 = partner2Input.value;
    
    localStorage.setItem('partner1', p1);
    localStorage.setItem('partner2', p2);
    adjustInputSize(partner1Input);
    adjustInputSize(partner2Input);

    if (isSyncEnabled && supabase) {
      try {
        await supabase.from('settings').upsert({ key: 'partner1', value: p1 });
        await supabase.from('settings').upsert({ key: 'partner2', value: p2 });
      } catch (err) {
        console.error("Failed saving names to cloud database:", err);
      }
    }
  };

  partner1Input.addEventListener('input', saveNames);
  partner2Input.addEventListener('input', saveNames);

  // --- Anniversary / Days Counter ---
  const computeDaysTogether = async () => {
    const annDateStr = anniversaryDateEl.value;
    localStorage.setItem('us_anniversary', annDateStr);

    if (isSyncEnabled && supabase && annDateStr) {
      try {
        await supabase.from('settings').upsert({ key: 'anniversary', value: annDateStr });
      } catch (err) {
        console.error("Failed saving anniversary date to cloud database:", err);
      }
    }
    
    if (!annDateStr) return;
    const annDate = new Date(annDateStr);
    const today = new Date();
    
    annDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - annDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    daysCountEl.textContent = diffDays >= 0 ? diffDays.toLocaleString() : "Counting down!";
  };

  const loadAnniversary = async () => {
    let savedAnn = '2025-06-07';

    if (isSyncEnabled && supabase) {
      try {
        const { data } = await supabase.from('settings').select('value').eq('key', 'anniversary').maybeSingle();
        if (data) savedAnn = data.value;
      } catch (err) {
        console.warn("Failed fetching anniversary from database, loading local:", err);
        savedAnn = localStorage.getItem('us_anniversary') || '2025-06-07';
      }
    } else {
      savedAnn = localStorage.getItem('us_anniversary') || '2025-06-07';
    }

    anniversaryDateEl.value = savedAnn;
    computeDaysTogether();
  };

  anniversaryDateEl.addEventListener('change', computeDaysTogether);

  // --- Theme Setup (Force Light Mode) ---
  const initTheme = () => {
    document.documentElement.setAttribute('data-theme', 'light');
  };

  // --- Image Upload System ---
  uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = 'var(--accent-rose)';
  });

  uploadBox.addEventListener('dragleave', () => {
    uploadBox.style.borderColor = 'var(--card-border)';
  });

  uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = 'var(--card-border)';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      memoryImageInput.files = files;
      handleFileSelected(files[0]);
    }
  });

  memoryImageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  const handleFileSelected = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      // Compress to Jpeg to limit Base64 storage payload size
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 700; // slightly smaller resolution for fast DB upload
        const scaleSize = MAX_WIDTH / img.width;
        
        canvas.width = Math.min(img.width, MAX_WIDTH);
        canvas.height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        uploadPreview.src = compressedDataUrl;
        uploadPreview.style.display = 'block';
        uploadInstructions.style.display = 'none';
      };
    };
    reader.readAsDataURL(file);
  };

  // --- Add Memory Form Submit ---
  memoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = memoryTitle.value.trim();
    const date = memoryDate.value;
    const note = memoryNote.value.trim();
    const imageSrc = uploadPreview.src;

    if (!imageSrc || uploadPreview.style.display === 'none') {
      alert('Please upload or drop an image first.');
      return;
    }

    const newMemory = {
      id: Date.now(),
      title,
      date,
      image: imageSrc,
      note
    };

    if (isSyncEnabled && supabase) {
      try {
        const { error } = await supabase.from('memories').insert([newMemory]);
        if (error) throw error;
      } catch (err) {
        alert("Failed to write to Cloud Database, writing locally instead: " + err.message);
        saveLocalMemory(newMemory);
      }
    } else {
      saveLocalMemory(newMemory);
    }
    
    // Reset Form fields
    memoryForm.reset();
    uploadPreview.style.display = 'none';
    uploadPreview.src = '';
    uploadInstructions.style.display = 'block';

    await loadMemories();
    createSparkleBurst(25);
    
    document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
  });

  const saveLocalMemory = (newMemory) => {
    memories.unshift(newMemory);
    localStorage.setItem('us_memories', JSON.stringify(memories));
  };

  // --- Edit & Delete Memories ---
  const deleteMemory = async (id) => {
    if (confirm('Are you sure you want to delete this memory?')) {
      if (isSyncEnabled && supabase) {
        try {
          const { error } = await supabase.from('memories').delete().eq('id', id);
          if (error) throw error;
        } catch (err) {
          alert("Could not delete from database: " + err.message);
          return;
        }
      } else {
        memories = memories.filter(m => m.id !== id);
        localStorage.setItem('us_memories', JSON.stringify(memories));
      }
      await loadMemories();
      createSparkleBurst(10);
    }
  };

  const startEditNote = (id, noteTextContainer) => {
    const memory = memories.find(m => m.id === id);
    if (!memory) return;

    const pEl = noteTextContainer.querySelector('.note-text');
    const textareaEl = noteTextContainer.querySelector('.note-textarea');
    const editBtn = noteTextContainer.parentElement.querySelector('.edit-btn');
    const saveBtn = noteTextContainer.parentElement.querySelector('.save-btn');

    pEl.style.display = 'none';
    textareaEl.value = memory.note;
    textareaEl.style.display = 'block';
    textareaEl.focus();

    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-flex';
  };

  const saveEditNote = async (id, noteTextContainer) => {
    const memory = memories.find(m => m.id === id);
    if (!memory) return;

    const pEl = noteTextContainer.querySelector('.note-text');
    const textareaEl = noteTextContainer.querySelector('.note-textarea');
    const editBtn = noteTextContainer.parentElement.querySelector('.edit-btn');
    const saveBtn = noteTextContainer.parentElement.querySelector('.save-btn');

    const newNoteText = textareaEl.value.trim();
    if (!newNoteText) {
      alert('Note content cannot be empty.');
      return;
    }

    if (isSyncEnabled && supabase) {
      try {
        const { error } = await supabase.from('memories').update({ note: newNoteText }).eq('id', id);
        if (error) throw error;
      } catch (err) {
        alert("Could not save edit to cloud database: " + err.message);
        return;
      }
    } else {
      memory.note = newNoteText;
      localStorage.setItem('us_memories', JSON.stringify(memories));
    }

    pEl.textContent = newNoteText;
    pEl.style.display = 'block';
    textareaEl.style.display = 'none';

    editBtn.style.display = 'inline-flex';
    saveBtn.style.display = 'none';

    await loadMemories();
    createSparkleBurst(12);
  };

  // --- Render Gallery Grid ---
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderGallery = () => {
    galleryGrid.innerHTML = '';
    totalMemoriesEl.textContent = memories.length;

    if (memories.length === 0) {
      galleryGrid.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary); width: 100%;">
          <p style="font-size: 1.2rem;">Our memory lane is currently empty. Scroll below to add your first moment!</p>
        </div>
      `;
      return;
    }

    memories.forEach(memory => {
      const card = document.createElement('article');
      card.className = 'gallery-item';
      card.id = `memory-${memory.id}`;

      card.innerHTML = `
        <div class="gallery-media">
          <div class="photo-overlay">${formatDate(memory.date)}</div>
          <img src="${memory.image}" alt="${memory.title}" loading="lazy">
        </div>
        <div class="gallery-note-section">
          <span class="note-tag">Our Memory</span>
          <h3 class="note-title">${memory.title}</h3>
          
          <div class="note-text-container">
            <p class="note-text">${memory.note}</p>
            <textarea class="note-textarea" aria-label="Edit Note Content"></textarea>
          </div>

          <div class="note-actions">
            <button class="btn-small edit-btn" title="Edit Note">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
              <span>Edit</span>
            </button>
            <button class="btn-small save-btn" title="Save Note">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              <span>Save</span>
            </button>
            <button class="btn-small delete-btn" title="Delete Memory" style="color: var(--accent-rose);">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
              <span>Delete</span>
            </button>
          </div>
        </div>
      `;

      const textContainer = card.querySelector('.note-text-container');
      const editBtn = card.querySelector('.edit-btn');
      const saveBtn = card.querySelector('.save-btn');
      const deleteBtn = card.querySelector('.delete-btn');

      editBtn.addEventListener('click', () => startEditNote(memory.id, textContainer));
      saveBtn.addEventListener('click', () => saveEditNote(memory.id, textContainer));
      deleteBtn.addEventListener('click', () => deleteMemory(memory.id));

      galleryGrid.appendChild(card);
    });
  };

  // --- Modal Config Controllers ---
  const toggleModal = (show) => {
    if (show) {
      syncModal.classList.add('active');
      syncModal.style.display = 'flex';
      createSparkleBurst(5);
    } else {
      syncModal.classList.remove('active');
      setTimeout(() => { syncModal.style.display = 'none'; }, 400);
    }
  };

  syncSettingsBtn.addEventListener('click', () => toggleModal(true));
  closeModalBtn.addEventListener('click', () => toggleModal(false));
  syncModal.addEventListener('click', (e) => {
    if (e.target === syncModal) toggleModal(false);
  });

  syncSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = syncUrlInput.value.trim();
    const key = syncKeyInput.value.trim();

    if (!url || !key) return;

    try {
      // Create temporary client and test select query
      const testClient = window.supabase.createClient(url, key);
      const { error } = await testClient.from('memories').select('id').limit(1);
      
      if (error) throw error;

      // Connection successful: store credentials
      localStorage.setItem('supabase_url', url);
      localStorage.setItem('supabase_key', key);
      localStorage.removeItem('supabase_disconnected');
      
      initSupabase();
      await migrateLocalDataToCloud();
      
      // Load all variables from cloud
      await loadNames();
      await loadAnniversary();
      await loadMemories();

      alert("Successfully connected to Supabase! Real-time syncing is now enabled. 🟢");
      toggleModal(false);
      createSparkleBurst(25);
    } catch (err) {
      alert("Database connection test failed. Please verify your URL, Anon Key, and ensure you ran the table creation script in Supabase's SQL Editor.\n\nError: " + err.message);
    }
  });

  disconnectSyncBtn.addEventListener('click', () => {
    if (confirm("Disconnect database sync? The website will revert to LocalStorage mode. No cloud data will be deleted.")) {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_key');
      localStorage.setItem('supabase_disconnected', 'true');
      
      supabase = null;
      isSyncEnabled = false;
      updateSyncBadge(false);

      // Re-trigger local page loads
      loadNames();
      loadAnniversary();
      loadMemories();

      toggleModal(false);
      createSparkleBurst(10);
    }
  });

  // --- Music Player Controller ---
  const togglePlay = () => {
    if (bgAudio.paused) {
      bgAudio.play().then(() => {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        vinylDisc.classList.add('playing');
      }).catch(err => {
        console.log("Audio play blocked by browser sandbox:", err);
      });
    } else {
      bgAudio.pause();
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      vinylDisc.classList.remove('playing');
    }
  };

  playPauseBtn.addEventListener('click', togglePlay);

  // --- Particle Effects (Sparks / Hearts) ---
  const createHeartParticle = (x, y) => {
    const particle = document.createElement('span');
    particle.className = 'particle';
    particle.innerHTML = '❤';
    
    const size = Math.random() * 20 + 10;
    const duration = Math.random() * 2 + 1.5;
    
    particle.style.left = `${x - size / 2}px`;
    particle.style.top = `${y - size / 2}px`;
    particle.style.fontSize = `${size}px`;
    particle.style.color = Math.random() > 0.4 ? 'var(--accent-rose)' : 'var(--accent-blush)';
    
    const drift = (Math.random() - 0.5) * 120;
    particle.style.setProperty('--drift', `${drift}px`);
    particle.style.animation = `floatUp ${duration}s cubic-bezier(0.25, 1, 0.5, 1) forwards`;

    particlesContainer.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, duration * 1000);
  };

  const createSparkleBurst = (count = 15) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const x = Math.random() * vw;
        const y = Math.random() * vh + (vh * 0.2);
        createHeartParticle(x, y);
      }, i * 40);
    }
  };

  window.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON' && 
        e.target.tagName !== 'INPUT' && 
        e.target.tagName !== 'TEXTAREA' && 
        e.target.tagName !== 'A' &&
        !e.target.closest('button') &&
        !e.target.closest('a')) {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          createHeartParticle(e.clientX + (Math.random() - 0.5) * 30, e.clientY + (Math.random() - 0.5) * 30);
        }, i * 50);
      }
    }
  });

  setInterval(() => {
    const x = Math.random() * window.innerWidth;
    const y = window.innerHeight + 20;
    createHeartParticle(x, y);
  }, 3500);

  // --- Scroll Trigger Timeline Animations ---
  const timelineItems = document.querySelectorAll('.timeline-item');
  const checkTimelineScroll = () => {
    const triggerBottom = window.innerHeight * 0.85;

    timelineItems.forEach(item => {
      const itemTop = item.getBoundingClientRect().top;
      if (itemTop < triggerBottom) {
        item.classList.add('visible');
      } else {
        item.classList.remove('visible');
      }
    });
  };

  window.addEventListener('scroll', checkTimelineScroll);

  // --- Initial Page Load Sequence ---
  initSupabase();
  loadNames();
  loadAnniversary();
  initTheme();
  loadMemories();
  checkTimelineScroll();

  setTimeout(() => {
    createSparkleBurst(8);
  }, 1000);
});

