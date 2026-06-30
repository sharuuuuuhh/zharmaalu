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
  const memoryLinksInput = document.getElementById('memory-links');
  const uploadBox = document.getElementById('upload-box');
  const uploadPreviewGrid = document.getElementById('upload-preview-grid');
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
  const clearAllMemoriesBtn = document.getElementById('clear-all-memories-btn');
  
  // Tab Elements
  const tabMoment = document.getElementById('tab-moment');
  const tabChapter = document.getElementById('tab-chapter');
  const chapterForm = document.getElementById('chapter-form');

  // --- Default Chapters Data ---
  const defaultChapters = [
    {
      id: 1,
      date: "Chapter 1 — The First Meet",
      title: "How They Met",
      note: "They first met at college. When they met, they didn't know about all the things waiting for them."
    },
    {
      id: 2,
      date: "Chapter 2 — The Friendship",
      title: "The Friendship Stage",
      note: "They became thick friends randomly. He started messaging her, she responded, and they secretly started falling in love."
    },
    {
      id: 3,
      date: "Chapter 3 — Our Relation",
      title: "The Proposal",
      note: "It happened on 10th May 2026. Sharu called her in a bad mood, she comforted him, and they both realized they loved each other, entering into a beautiful relation."
    }
  ];

  // --- State Initialization ---
  let memories = [];
  let chapters = [];
  let supabase = null;
  let isSyncEnabled = false;
  let currentUploadedMedia = []; // In-memory array for uploading multiple items

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
    const isCleared = localStorage.getItem('us_memories_cleared') === 'true';
    memories = JSON.parse(localStorage.getItem('us_memories')) || [];
    if (memories.length === 0 && !isCleared) {
      localStorage.setItem('us_memories', JSON.stringify([]));
    }
  };

  // --- Timeline Chapters Methods & Rendering ---
  const loadChapters = async () => {
    if (isSyncEnabled && supabase) {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'chapters')
          .maybeSingle();

        if (data && data.value) {
          chapters = JSON.parse(data.value);
        } else {
          chapters = [...defaultChapters];
          await supabase.from('settings').upsert({ key: 'chapters', value: JSON.stringify(chapters) });
        }
      } catch (err) {
        console.warn("Could not load chapters from database, using LocalStorage fallback:", err);
        loadLocalChaptersFallback();
      }
    } else {
      loadLocalChaptersFallback();
    }
    renderTimeline();
  };

  const loadLocalChaptersFallback = () => {
    chapters = JSON.parse(localStorage.getItem('us_chapters')) || [];
    if (chapters.length === 0) {
      chapters = [...defaultChapters];
      localStorage.setItem('us_chapters', JSON.stringify(chapters));
    }
  };

  const saveChapters = async () => {
    localStorage.setItem('us_chapters', JSON.stringify(chapters));
    if (isSyncEnabled && supabase) {
      try {
        await supabase.from('settings').upsert({ key: 'chapters', value: JSON.stringify(chapters) });
      } catch (err) {
        console.error("Failed saving chapters to cloud database:", err);
      }
    }
  };

  const deleteChapter = async (id) => {
    if (confirm('Are you sure you want to delete this story chapter?')) {
      chapters = chapters.filter(c => c.id !== id);
      await saveChapters();
      await loadChapters();
      createSparkleBurst(10);
    }
  };

  const renderTimeline = () => {
    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) return;

    timelineContainer.innerHTML = '';

    if (chapters.length === 0) {
      timelineContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary); width: 100%;">
          <p style="font-size: 1.2rem;">Our story is empty. Use the form below to add your first chapter!</p>
        </div>
      `;
      return;
    }

    chapters.forEach((chapter, index) => {
      const isLeft = index % 2 === 0;
      const item = document.createElement('div');
      item.className = `timeline-item ${isLeft ? 'left' : 'right'} visible`;

      item.innerHTML = `
        <div class="timeline-content" style="position: relative;">
          <div class="timeline-date">${chapter.date}</div>
          <h3 style="padding-right: 24px;">${chapter.title}</h3>
          <p>${chapter.note}</p>
          <button class="btn-small delete-chapter-btn" data-id="${chapter.id}" style="position: absolute; top: 12px; right: 12px; padding: 6px; border: none; background: transparent; color: var(--accent-rose); opacity: 0.5; cursor: pointer; transition: opacity 0.2s; display: inline-flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      `;

      const deleteBtn = item.querySelector('.delete-chapter-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteChapter(chapter.id);
      });

      item.addEventListener('mouseenter', () => { deleteBtn.style.opacity = '1'; });
      item.addEventListener('mouseleave', () => { deleteBtn.style.opacity = '0.5'; });

      timelineContainer.appendChild(item);
    });

    checkTimelineScroll();
  };

  const migrateLocalDataToCloud = async () => {
    if (!supabase) return;
    try {
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

      const p1 = localStorage.getItem('partner1') || 'Sharu';
      const p2 = localStorage.getItem('partner2') || 'Maalu';
      const annDateStr = localStorage.getItem('us_anniversary') || '2025-06-07';
      const localChapters = localStorage.getItem('us_chapters');

      const settingsUpserts = [
        { key: 'partner1', value: p1 },
        { key: 'partner2', value: p2 },
        { key: 'anniversary', value: annDateStr }
      ];

      if (localChapters) {
        settingsUpserts.push({ key: 'chapters', value: localChapters });
      }

      await supabase.from('settings').upsert(settingsUpserts);
    } catch (err) {
      console.warn("Migration failed:", err);
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

    updateCountdownOrb();

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

  // --- Theme Setup ---
  const initTheme = () => {
    const savedTheme = localStorage.getItem('us_theme') || 'dark'; // Dark Velvet Midnight by default
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeSun = document.getElementById('theme-sun');
    const themeMoon = document.getElementById('theme-moon');
    
    if (themeSun && themeMoon) {
      if (savedTheme === 'light') {
        themeSun.style.display = 'block';
        themeMoon.style.display = 'none';
      } else {
        themeSun.style.display = 'none';
        themeMoon.style.display = 'block';
      }
    }
  };

  document.getElementById('theme-toggle').addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('us_theme', newTheme);
    
    const themeSun = document.getElementById('theme-sun');
    const themeMoon = document.getElementById('theme-moon');
    if (themeSun && themeMoon) {
      if (newTheme === 'light') {
        themeSun.style.display = 'block';
        themeMoon.style.display = 'none';
      } else {
        themeSun.style.display = 'none';
        themeMoon.style.display = 'block';
      }
    }
    createSparkleBurst(25);
  });

  // --- Multiple Image/Video Upload System ---
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
      handleMultipleFilesSelected(files);
    }
  });

  memoryImageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleMultipleFilesSelected(e.target.files);
    }
  });

  const handleMultipleFilesSelected = (files) => {
    Array.from(files).forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (!isImage && !isVideo) {
        alert('File format not supported. Please select images or videos.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const fileDataUrl = e.target.result;
        
        if (isImage) {
          // Compress image base64 size slightly to fit storage policies
          const img = new Image();
          img.src = fileDataUrl;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 700;
            const scaleSize = MAX_WIDTH / img.width;
            
            canvas.width = Math.min(img.width, MAX_WIDTH);
            canvas.height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const compressed = canvas.toDataURL('image/jpeg', 0.7);
            addMediaToPreviewList('image', compressed);
          };
        } else {
          // Videos are stored directly (warn for size limit)
          if (file.size > 2.5 * 1024 * 1024) {
            alert('Video file is slightly large. Direct uploads work best with clips under 2.5MB. For longer videos, please paste the video URL below.');
          }
          addMediaToPreviewList('video', fileDataUrl);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const addMediaToPreviewList = (type, url) => {
    currentUploadedMedia.push({ type, url });
    renderUploadPreviewGrid();
  };

  const removeMediaFromPreviewList = (index) => {
    currentUploadedMedia.splice(index, 1);
    renderUploadPreviewGrid();
  };

  const renderUploadPreviewGrid = () => {
    uploadPreviewGrid.innerHTML = '';
    
    if (currentUploadedMedia.length === 0) {
      uploadInstructions.style.display = 'block';
      return;
    }

    uploadInstructions.style.display = 'none';

    currentUploadedMedia.forEach((media, index) => {
      const item = document.createElement('div');
      item.className = 'upload-preview-item';
      
      if (media.type === 'video') {
        item.innerHTML = `
          <video src="${media.url}" muted></video>
          <button type="button" class="upload-preview-delete">&times;</button>
        `;
      } else {
        item.innerHTML = `
          <img src="${media.url}" alt="Preview">
          <button type="button" class="upload-preview-delete">&times;</button>
        `;
      }

      item.querySelector('.upload-preview-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        removeMediaFromPreviewList(index);
      });

      uploadPreviewGrid.appendChild(item);
    });
  };

  // --- Add Memory Form Submit ---
  memoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = memoryTitle.value.trim();
    const date = memoryDate.value;
    const note = memoryNote.value.trim();
    
    // Parse links from textarea
    const rawLinks = memoryLinksInput.value.trim();
    let parsedLinks = [];
    if (rawLinks) {
      parsedLinks = rawLinks.split(/[,\n]/)
        .map(link => link.trim())
        .filter(link => link.length > 0)
        .map(link => {
          const isVideoUrl = link.match(/\.(mp4|webm|ogg|mov|avi)(\?|$)/i) || link.includes('youtube.com') || link.includes('youtu.be') || link.includes('vimeo.com');
          return {
            type: isVideoUrl ? 'video' : 'image',
            url: link
          };
        });
    }

    // Merge uploaded local files and pasted external URLs
    const finalMedia = [...currentUploadedMedia, ...parsedLinks];

    if (finalMedia.length === 0) {
      alert('Please upload files or paste links to media first.');
      return;
    }

    // Store the JSON string array in 'image' field for backwards compatibility with database text schemas
    const newMemory = {
      id: Date.now(),
      title,
      date,
      image: JSON.stringify(finalMedia),
      note
    };

    if (isSyncEnabled && supabase) {
      try {
        const { error } = await supabase.from('memories').insert([newMemory]);
        if (error) throw error;
        localStorage.removeItem('us_memories_cleared');
      } catch (err) {
        alert("Failed to write to Cloud Database, writing locally instead: " + err.message);
        saveLocalMemory(newMemory);
      }
    } else {
      saveLocalMemory(newMemory);
    }

    // Reset Form fields
    memoryForm.reset();
    currentUploadedMedia = [];
    renderUploadPreviewGrid();

    await loadMemories();
    createSparkleBurst(25);

    document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
  });

  const saveLocalMemory = (newMemory) => {
    localStorage.removeItem('us_memories_cleared');
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

  // Temporary store for active media edits
  let activeEdits = {};

  const renderEditMediaSection = (id, container) => {
    container.innerHTML = `
      <div class="edit-media-title">Manage Photos/Videos</div>
      <div class="edit-media-grid"></div>
      
      <div class="form-group" style="margin-bottom: 8px;">
        <label style="font-size: 0.75rem; margin-bottom: 2px;">Add files (Images/Videos)</label>
        <input type="file" class="edit-media-file-input" accept="image/*,video/*" multiple style="font-size: 0.8rem; width: 100%;">
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label style="font-size: 0.75rem; margin-bottom: 2px;">Or paste URLs (comma/newline separated)</label>
        <textarea class="edit-media-links-input" placeholder="https://example.com/extra.jpg" style="height: 40px; font-size: 0.75rem; width: 100%; border-radius: 8px; border: 1px solid var(--card-border); background: rgba(0,0,0,0.1); padding: 5px; color: var(--text-primary);"></textarea>
      </div>
    `;

    const grid = container.querySelector('.edit-media-grid');
    const mediaArray = activeEdits[id] || [];

    mediaArray.forEach((media, index) => {
      const item = document.createElement('div');
      item.className = 'edit-media-item';
      if (media.type === 'video') {
        item.innerHTML = `
          <video src="${media.url}" muted></video>
          <button type="button" class="edit-media-delete">&times;</button>
        `;
      } else {
        item.innerHTML = `
          <img src="${media.url}" alt="Edit Preview">
          <button type="button" class="edit-media-delete">&times;</button>
        `;
      }

      item.querySelector('.edit-media-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        mediaArray.splice(index, 1);
        renderEditMediaSection(id, container);
      });

      grid.appendChild(item);
    });

    const fileInput = container.querySelector('.edit-media-file-input');
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        Array.from(e.target.files).forEach(file => {
          const isVideo = file.type.startsWith('video/');
          const isImage = file.type.startsWith('image/');
          if (!isImage && !isVideo) return;

          const reader = new FileReader();
          reader.onload = (fileEvent) => {
            const fileDataUrl = fileEvent.target.result;
            if (isImage) {
              const img = new Image();
              img.src = fileDataUrl;
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 700;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = Math.min(img.width, MAX_WIDTH);
                canvas.height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const compressed = canvas.toDataURL('image/jpeg', 0.7);
                mediaArray.push({ type: 'image', url: compressed });
                renderEditMediaSection(id, container);
              };
            } else {
              mediaArray.push({ type: 'video', url: fileDataUrl });
              renderEditMediaSection(id, container);
            }
          };
          reader.readAsDataURL(file);
        });
      }
    });
  };

  const startEditNote = (id, noteTextContainer) => {
    const memory = memories.find(m => m.id === id);
    if (!memory) return;

    const pEl = noteTextContainer.querySelector('.note-text');
    const textareaEl = noteTextContainer.querySelector('.note-textarea');
    const editMediaContainer = noteTextContainer.querySelector('.edit-media-container');
    const editBtn = noteTextContainer.parentElement.querySelector('.edit-btn');
    const saveBtn = noteTextContainer.parentElement.querySelector('.save-btn');

    pEl.style.display = 'none';
    textareaEl.value = memory.note;
    textareaEl.style.display = 'block';
    textareaEl.focus();

    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-flex';

    // Parse media with backwards compatibility
    let mediaArray = [];
    if (memory.image) {
      try {
        const parsed = JSON.parse(memory.image);
        if (Array.isArray(parsed)) {
          mediaArray = parsed;
        } else {
          throw new Error();
        }
      } catch (e) {
        mediaArray = [{ type: 'image', url: memory.image }];
      }
    } else {
      mediaArray = [{ type: 'image', url: 'assets/starry_night.png' }];
    }

    // Copy to temp
    activeEdits[id] = [...mediaArray];

    renderEditMediaSection(id, editMediaContainer);
    editMediaContainer.style.display = 'block';
  };

  const saveEditNote = async (id, noteTextContainer) => {
    const memory = memories.find(m => m.id === id);
    if (!memory) return;

    const pEl = noteTextContainer.querySelector('.note-text');
    const textareaEl = noteTextContainer.querySelector('.note-textarea');
    const editMediaContainer = noteTextContainer.querySelector('.edit-media-container');
    const editBtn = noteTextContainer.parentElement.querySelector('.edit-btn');
    const saveBtn = noteTextContainer.parentElement.querySelector('.save-btn');

    const newNoteText = textareaEl.value.trim();
    if (!newNoteText) {
      alert('Note content cannot be empty.');
      return;
    }

    const linksInput = editMediaContainer.querySelector('.edit-media-links-input');
    const rawLinks = linksInput.value.trim();
    let parsedLinks = [];
    if (rawLinks) {
      parsedLinks = rawLinks.split(/[,\n]/)
        .map(link => link.trim())
        .filter(link => link.length > 0)
        .map(link => {
          const isVideoUrl = link.match(/\.(mp4|webm|ogg|mov|avi)(\?|$)/i) || link.includes('youtube.com') || link.includes('youtu.be') || link.includes('vimeo.com');
          return {
            type: isVideoUrl ? 'video' : 'image',
            url: link
          };
        });
    }

    const finalMedia = [...(activeEdits[id] || []), ...parsedLinks];

    if (finalMedia.length === 0) {
      alert('A memory must have at least one image or video.');
      return;
    }

    const updatedMediaString = JSON.stringify(finalMedia);

    if (isSyncEnabled && supabase) {
      try {
        const { error } = await supabase.from('memories').update({ 
          note: newNoteText,
          image: updatedMediaString
        }).eq('id', id);
        if (error) throw error;
      } catch (err) {
        alert("Could not save edit to cloud database: " + err.message);
        return;
      }
    } else {
      memory.note = newNoteText;
      memory.image = updatedMediaString;
      localStorage.setItem('us_memories', JSON.stringify(memories));
    }

    delete activeEdits[id];
    editMediaContainer.style.display = 'none';

    await loadMemories();
    createSparkleBurst(12);
  };

  // --- Render Gallery Grid with Carousel and Backward Compatibility ---
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
      // Parse media files with backward compatibility fallback
      let mediaArray = [];
      if (memory.image) {
        try {
          const parsed = JSON.parse(memory.image);
          if (Array.isArray(parsed)) {
            mediaArray = parsed;
          } else {
            throw new Error();
          }
        } catch (e) {
          mediaArray = [{ type: 'image', url: memory.image }];
        }
      } else {
        mediaArray = [{ type: 'image', url: 'assets/starry_night.png' }];
      }

      const card = document.createElement('article');
      card.className = 'gallery-item';
      card.id = `memory-${memory.id}`;

      // Build media markup
      let mediaMarkup = '';
      if (mediaArray.length === 1) {
        const m = mediaArray[0];
        mediaMarkup = m.type === 'video'
          ? `<video src="${m.url}" controls class="gallery-img"></video>`
          : `<img src="${m.url}" alt="${memory.title}" class="gallery-img" loading="lazy">`;
      } else {
        // Build interactive Carousel
        mediaMarkup = `
          <div class="carousel-container">
            <div class="carousel-track">
              ${mediaArray.map(m => `
                <div class="carousel-slide">
                  ${m.type === 'video' 
                    ? `<video src="${m.url}" controls></video>` 
                    : `<img src="${m.url}" alt="${memory.title}" loading="lazy">`}
                </div>
              `).join('')}
            </div>
            <button type="button" class="carousel-btn prev" aria-label="Previous">&lt;</button>
            <button type="button" class="carousel-btn next" aria-label="Next">&gt;</button>
            <div class="carousel-dots">
              ${mediaArray.map((_, i) => `<span class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="gallery-media">
          <div class="photo-overlay">${formatDate(memory.date)}</div>
          ${mediaMarkup}
        </div>
        <div class="gallery-note-section">
          <span class="note-tag">Our Memory</span>
          <h3 class="note-title">${memory.title}</h3>
          
          <div class="note-text-container">
            <p class="note-text">${memory.note}</p>
            <textarea class="note-textarea" aria-label="Edit Note Content"></textarea>
            <div class="edit-media-container" style="display: none; margin-top: 15px;"></div>
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

      // Assign event listeners
      const textContainer = card.querySelector('.note-text-container');
      const editBtn = card.querySelector('.edit-btn');
      const saveBtn = card.querySelector('.save-btn');
      const deleteBtn = card.querySelector('.delete-btn');

      editBtn.addEventListener('click', () => startEditNote(memory.id, textContainer));
      saveBtn.addEventListener('click', () => saveEditNote(memory.id, textContainer));
      deleteBtn.addEventListener('click', () => deleteMemory(memory.id));

      galleryGrid.appendChild(card);
    });

    // Initialize carousels handlers
    initializeCarousels();
  };

  const initializeCarousels = () => {
    const carousels = galleryGrid.querySelectorAll('.carousel-container');
    carousels.forEach(carousel => {
      const track = carousel.querySelector('.carousel-track');
      const slides = carousel.querySelectorAll('.carousel-slide');
      const prevBtn = carousel.querySelector('.carousel-btn.prev');
      const nextBtn = carousel.querySelector('.carousel-btn.next');
      const dots = carousel.querySelectorAll('.carousel-dot');
      let index = 0;

      const slideTo = (idx) => {
        index = (idx + slides.length) % slides.length;
        track.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((dot, dIdx) => {
          dot.classList.toggle('active', dIdx === index);
        });
      };

      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        slideTo(index - 1);
      });

      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        slideTo(index + 1);
      });

      dots.forEach((dot, dIdx) => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          slideTo(dIdx);
        });
      });
    });
  };

  // --- Form Tab Switching ---
  tabMoment.addEventListener('click', () => {
    tabMoment.classList.add('active');
    tabMoment.style.background = 'var(--accent-rose)';
    tabMoment.style.color = 'white';
    tabMoment.style.border = 'none';

    tabChapter.classList.remove('active');
    tabChapter.style.background = 'transparent';
    tabChapter.style.color = 'var(--text-primary)';
    tabChapter.style.border = '1px solid var(--card-border)';

    memoryForm.style.display = 'block';
    chapterForm.style.display = 'none';
  });

  tabChapter.addEventListener('click', () => {
    tabChapter.classList.add('active');
    tabChapter.style.background = 'var(--accent-rose)';
    tabChapter.style.color = 'white';
    tabChapter.style.border = 'none';

    tabMoment.classList.remove('active');
    tabMoment.style.background = 'transparent';
    tabMoment.style.color = 'var(--text-primary)';
    tabMoment.style.border = '1px solid var(--card-border)';

    chapterForm.style.display = 'block';
    memoryForm.style.display = 'none';
  });

  // --- Add Chapter Form Submit ---
  const chapterDateInput = document.getElementById('chapter-date');
  const chapterTitleInput = document.getElementById('chapter-title');
  const chapterNoteInput = document.getElementById('chapter-note');

  chapterForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const date = chapterDateInput.value.trim();
    const title = chapterTitleInput.value.trim();
    const note = chapterNoteInput.value.trim();

    const newChapter = {
      id: Date.now(),
      date,
      title,
      note
    };

    chapters.push(newChapter);
    await saveChapters();

    chapterForm.reset();
    await loadChapters();
    createSparkleBurst(25);

    document.getElementById('biopic').scrollIntoView({ behavior: 'smooth' });
  });

  // --- Modal Settings Controllers ---
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
      const testClient = window.supabase.createClient(url, key);
      const { error } = await testClient.from('memories').select('id').limit(1);

      if (error) throw error;

      localStorage.setItem('supabase_url', url);
      localStorage.setItem('supabase_key', key);
      localStorage.removeItem('supabase_disconnected');

      initSupabase();
      await migrateLocalDataToCloud();

      await loadNames();
      await loadAnniversary();
      await loadMemories();
      await loadChapters();

      alert("Successfully connected to Supabase! Real-time syncing is now enabled. 🟢");
      toggleModal(false);
      createSparkleBurst(25);
    } catch (err) {
      alert("Database connection test failed. Please verify credentials.\n\nError: " + err.message);
    }
  });

  disconnectSyncBtn.addEventListener('click', () => {
    if (confirm("Disconnect database sync? Reverting to LocalStorage mode.")) {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_key');
      localStorage.setItem('supabase_disconnected', 'true');

      supabase = null;
      isSyncEnabled = false;
      updateSyncBadge(false);

      loadNames();
      loadAnniversary();
      loadMemories();
      loadChapters();

      toggleModal(false);
      createSparkleBurst(10);
    }
  });

  clearAllMemoriesBtn.addEventListener('click', async () => {
    if (confirm("Are you sure you want to delete ALL memories? This will permanently delete every photo and note.")) {
      if (confirm("Double Confirmation: This action is irreversible. Are you absolutely sure?")) {
        if (isSyncEnabled && supabase) {
          try {
            const { error } = await supabase.from('memories').delete().gt('id', 0);
            if (error) throw error;
          } catch (err) {
            alert("Failed to delete memories from Cloud Database: " + err.message);
            return;
          }
        }

        localStorage.setItem('us_memories_cleared', 'true');
        localStorage.removeItem('us_memories');
        memories = [];
        renderGallery();

        alert("All memories have been deleted!");
        toggleModal(false);
      }
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
  const checkTimelineScroll = () => {
    const timelineItems = document.querySelectorAll('.timeline-item');
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

  // --- 3D Interactive Card Tilting ---
  galleryGrid.addEventListener('mousemove', (e) => {
    const card = e.target.closest('.gallery-item');
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((centerY - y) / centerY) * 12;
    const rotateY = ((x - centerX) / centerX) * 12;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  });

  galleryGrid.addEventListener('mouseleave', (e) => {
    const card = e.target.closest('.gallery-item');
    if (!card) return;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
  }, true);

  // --- Sparkle Mouse Follower Trail ---
  let lastSparkleTime = 0;
  window.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastSparkleTime < 80) return;
    lastSparkleTime = now;

    const sparkle = document.createElement('span');
    sparkle.className = 'cursor-sparkle';

    const symbols = ['💖', '✨', '💝', '⭐', '🎈', '❤️'];
    sparkle.innerHTML = symbols[Math.floor(Math.random() * symbols.length)];

    sparkle.style.left = `${e.clientX}px`;
    sparkle.style.top = `${e.clientY}px`;

    const scale = Math.random() * 0.6 + 0.6;
    const rotation = Math.random() * 360;
    sparkle.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`;

    document.body.appendChild(sparkle);

    setTimeout(() => {
      sparkle.remove();
    }, 900);
  });

  // --- Floating Anniversary Countdown Orb ---
  const updateCountdownOrb = () => {
    const annDateStr = anniversaryDateEl.value || localStorage.getItem('us_anniversary') || '2025-06-07';
    const daysTextEl = document.getElementById('countdown-days');
    if (!daysTextEl) return;

    if (!annDateStr) {
      daysTextEl.textContent = '??';
      return;
    }

    const annDate = new Date(annDateStr);
    const today = new Date();

    let nextAnniversary = new Date(today.getFullYear(), annDate.getMonth(), annDate.getDate());

    if (today.getTime() > nextAnniversary.getTime()) {
      nextAnniversary.setFullYear(today.getFullYear() + 1);
    }

    today.setHours(0, 0, 0, 0);
    nextAnniversary.setHours(0, 0, 0, 0);

    const diffTime = nextAnniversary.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    daysTextEl.textContent = diffDays;
  };

  // --- Initial Page Load Sequence ---
  initSupabase();
  loadNames();
  loadAnniversary();
  initTheme();
  loadMemories();
  loadChapters();
  checkTimelineScroll();

  setTimeout(() => {
    createSparkleBurst(8);
  }, 1000);
});
