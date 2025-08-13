// script.js

// Storage keys
const STORAGE = {
  START_DATE: "wt53_start_date",
  WORKOUT_DATE: "wt53_workout_date", 
  SELECTED_DAY: "wt53_selected_day",
  WORKOUTS: "wt53_workouts",
  CUSTOM: "wt53_custom_exercises"
};

// Exercise database (from your original file)
const EXERCISES = {
  "Lats": ["Lat Pulldown (Cable)", "Neut Lat Pulldown Close alternate full rom 1/2 rom", "Lat Prayer", "Chin-Ups"],
  "Back": ["Lat Pulldown (Cable)", "Seated Cable Rows", "Chest Supported Incline DB Row", "SMITH MACHINE DEFICIT ROW"],
  "Mid-Back": ["Seated Cable Rows", "Chest Supported Incline DB Row"],
  "Mid/Upper Back": ["SMITH MACHINE DEFICIT ROW"],
  "Chest": ["Flat Bench Press", "Bottom Half DB Flye", "Incline Bench Press", "Bayesian Cable Chest Fly", "Incline Bench Press (Dumbbell)"],
  "Upper Chest": ["BOTTOM HALF LOW INCLINE DB PRESS", "Incline Bench Press (Dumbbell)"],
  "Shoulders (Side)": ["MEADOWS INCLINE DB LATERAL RAISE", "Lateral Raise (Cable)", "Single Arm Lateral Raise (Cable)"],
  "Shoulders (Front)": ["Seated Smith Shoulder Press", "Seated Overhead Press (Dumbbell)", "DB OH Shoulder Press"],
  "Shoulders (Overall)": ["Arnold Press (Dumbbell)"],
  "Rear Delts/Traps": ["Seal Reverse DB Fly", "Rear Delt Fly (Seal Pad)", "Trap-3 Raise", "Smith Machine Shrugs", "Shrug (Smith Machine)"],
  "Triceps": ["EZ Bar Overhead Triceps Extension", "Triceps Kickback (Cable)"],
  "Biceps": ["BOTTOM HALF EZ BAR PREACHER CURL", "EZ BAR CABLE CURL", "BOTTOM HALF INCLINE DB CURL", "Bayesian Cable Curl", "Bottom Half DB Curls (Seal Pad)", "Chin-Ups"],
  "Glutes": ["Cable Leg Kickback", "Glute Cable Kickbacks", "Belt Squat", "Reverse Lunge (Dumbbell)", "Super-ROM Leg Press", "Romanian Deadlift (Barbell)", "RDL", "Cable Hip Abduction"],
  "Glutes (Side)": ["Cable Hip Abduction"],
  "Hamstrings": ["DB Romanian Deadlift", "Seated Leg Curl (Machine)", "Reverse Lunge (Dumbbell)", "Romanian Deadlift (Barbell)", "RDL", "Cable Leg Kickback"],
  "Quads": ["Belt Squat", "Reverse Lunge (Dumbbell)", "Super-ROM Leg Press", "Seated Leg Extension"],
  "Calves": ["Belt Squat Calf Raise", "Calf Press (Machine)", "Donkey Calf Raise", "Frog Calf Raise"],
  "Calves (Gastrocnemius)": ["Calf Press (Machine)", "Donkey Calf Raise"],
  "Calves (Soleus)": ["Frog Calf Raise"],
  "Tibialis Anterior": ["Tibialis Raises"],
  "Abs": ["Ab Roll Outs (Wheel)", "Kneeling Cable AB Crunch", "ROMAN CHAIR LEG RAISE"]
};

// Day definitions (exact from your original)
const DAY_DEFS = {
  saturday: { name: "Push", slots: [
    { id: "chest1", label: "Chest", bpKey: "Chest|Upper Chest" },
    { id: "chest2", label: "Chest", bpKey: "Chest|Upper Chest" },
    { id: "shoulders1", label: "Shoulders", bpKey: "Shoulders (Overall)|Shoulders (Front)|Shoulders (Side)" },
    { id: "shoulders2", label: "Shoulders", bpKey: "Shoulders (Overall)|Shoulders (Front)|Shoulders (Side)" },
    { id: "triceps1", label: "Arms (Triceps)", bpKey: "Triceps" },
  ]},
  sunday: { name: "Pull", slots: [
    { id: "back1", label: "Back", bpKey: "Lats|Back|Mid-Back|Mid/Upper Back" },
    { id: "back2", label: "Back", bpKey: "Lats|Back|Mid-Back|Mid/Upper Back" },
    { id: "rear1", label: "Shoulders (Rear/Traps)", bpKey: "Rear Delts/Traps" },
    { id: "rear2", label: "Shoulders (Rear/Traps)", bpKey: "Rear Delts/Traps" },
    { id: "biceps1", label: "Arms (Biceps)", bpKey: "Biceps" },
  ]},
  monday: { name: "Legs", slots: [
    { id: "legs1", label: "Legs", bpKey: "Quads|Hamstrings" },
    { id: "legs2", label: "Legs", bpKey: "Quads|Hamstrings" },
    { id: "glutes1", label: "Glutes", bpKey: "Glutes|Glutes (Side)" },
    { id: "calves1", label: "Calves", bpKey: "Calves|Calves (Gastrocnemius)|Calves (Soleus)" },
    { id: "abs1", label: "Abs", bpKey: "Abs" },
  ]},
  wednesday: { name: "Upper", slots: [
    { id: "chestU", label: "Chest", bpKey: "Chest|Upper Chest" },
    { id: "backU", label: "Back", bpKey: "Lats|Back|Mid-Back|Mid/Upper Back" },
    { id: "shouldersU", label: "Shoulders", bpKey: "Shoulders (Overall)|Shoulders (Front)|Shoulders (Side)" },
    { id: "biU", label: "Arms (Biceps)", bpKey: "Biceps" },
    { id: "triU", label: "Arms (Triceps)", bpKey: "Triceps" },
  ]},
  thursday: { name: "Lower", slots: [
    { id: "legsL1", label: "Legs", bpKey: "Quads|Hamstrings" },
    { id: "legsL2", label: "Legs", bpKey: "Quads|Hamstrings" },
    { id: "glutesL", label: "Glutes", bpKey: "Glutes|Glutes (Side)" },
    { id: "calvesL", label: "Calves", bpKey: "Calves|Calves (Gastrocnemius)|Calves (Soleus)" },
    { id: "absL", label: "Abs", bpKey: "Abs" },
  ]},
};

// Global state
let workouts = {};
let customExercises = {};
let timers = {};
let audioContext = null;

// Utility functions
function loadJSON(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getTodayISO() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const local = new Date(today.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function getWeekNumber(startDate, workoutDate) {
  if (!startDate) return 0;
  const start = new Date(startDate + "T00:00:00");
  const workout = new Date(workoutDate + "T00:00:00");
  const diffDays = Math.floor((workout - start) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 1;
  return Math.floor(diffDays / 7) + 1;
}

function getAvailableExercises(bpKey) {
  const parts = bpKey.split("|");
  const exercises = new Set();
  parts.forEach(part => {
    if (EXERCISES[part]) {
      EXERCISES[part].forEach(ex => exercises.add(ex));
    }
    if (customExercises[part]) {
      customExercises[part].forEach(ex => exercises.add(ex));
    }
  });
  return Array.from(exercises);
}

function getOrCreateWorkout(week, dayKey) {
  const key = `week${week}_${dayKey}`;
  if (!workouts[key]) {
    workouts[key] = {
      slots: DAY_DEFS[dayKey].slots.map(slot => ({
        slotId: slot.id,
        label: slot.label,
        bpKey: slot.bpKey,
        exercise: "",
        sets: [{ weight: "", reps: "", myoReps: [] }],
        notes: "",
        weakPoints: []
      })),
      workoutWeakPoints: []
    };
  }
  return workouts[key];
}

// Audio functions
function playSound(type) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    let frequency = 800, duration = 0.1;
    if (type === 'complete') { frequency = 600; duration = 0.5; }
    if (type === 'countdown') { frequency = 1200; duration = 0.1; }
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn('Audio not supported');
  }
}

// New function to get last week's workout data
function getLastWeekWorkout(currentWeek, dayKey) {
    if (currentWeek > 1) {
        const lastWeek = currentWeek - 1;
        const key = `week${lastWeek}_${dayKey}`;
        return workouts[key] || null;
    }
    return null;
}

// Main render function
function renderAll() {
  const startDate = document.getElementById('startDate').value;
  const workoutDate = document.getElementById('workoutDate').value;
  const dayKey = document.getElementById('daySelect').value;
  
  const week = getWeekNumber(startDate, workoutDate);
  document.getElementById('weekNum').textContent = week || "—";
  
  const isDeload = (week > 0 && week % 4 === 0);
  const badge = document.getElementById('deloadBadge');
  if (isDeload) {
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  const workout = getOrCreateWorkout(week, dayKey);
  renderWorkoutWeakPoints(workout);
  renderExercises(workout);
  saveWorkout();
}

function renderExercises(workout) {
  const container = document.getElementById('exercisesContainer');
  container.innerHTML = '';
  
  const currentWeek = parseInt(document.getElementById('weekNum').textContent);
  const dayKey = document.getElementById('daySelect').value;
  const lastWeekWorkout = getLastWeekWorkout(currentWeek, dayKey);

  workout.slots.forEach((slot, index) => {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    
    // Find last week's data for this specific slot
    let lastWeekData = '';
    if (lastWeekWorkout && lastWeekWorkout.slots && lastWeekWorkout.slots[index]) {
        const lastWeekSlot = lastWeekWorkout.slots[index];
        if (lastWeekSlot.exercise) {
            lastWeekData += `<span class="label">Exercise:</span> ${lastWeekSlot.exercise}\n`;
            if (lastWeekSlot.sets && lastWeekSlot.sets.length > 0) {
                lastWeekData += `<span class="label">Sets:</span>\n`;
                lastWeekSlot.sets.forEach((set, setIndex) => {
                    if (set.weight || set.reps) {
                        lastWeekData += `    Set ${setIndex + 1}: ${set.weight ? set.weight + 'kg' : ''} x ${set.reps ? set.reps + ' reps' : ''}\n`;
                    }
                });
            }
        }
    }
    if (!lastWeekData) {
      lastWeekData = "No data from last week.";
    }

    const exercises = getAvailableExercises(slot.bpKey);
    const exerciseOptions = exercises.map(ex => 
      `<option value="${ex}" ${slot.exercise === ex ? 'selected' : ''}>${ex}</option>`
    ).join('');

    card.innerHTML = `
      <div class="exercise-header">
        <div>
          <div class="exercise-title">${slot.label}</div>
          <div class="last-week-info">${lastWeekData}</div>
        </div>
        <div>
          <button class="btn btn-xs btn-primary" onclick="moveSlot(${index}, -1)">↑</button>
          <button class="btn btn-xs btn-primary" onclick="moveSlot(${index}, 1)">↓</button>
        </div>
      </div>
      
      <div class="exercise-body">
        <!-- Exercise Selection -->
        <div class="section">
          <div class="section-title">🏋️ Exercise</div>
          <select class="form-select" onchange="selectExercise(${index}, this.value)">
            <option value="">Select exercise...</option>
            ${exerciseOptions}
            <option value="__custom__">Other / Custom...</option>
          </select>
          <div id="customRow_${index}" class="form-row ${slot.exercise && !exercises.includes(slot.exercise) ? '' : 'hidden'}" style="margin-top: 0.5rem;">
            <input type="text" class="form-input" id="customInput_${index}" placeholder="Enter custom exercise name" value="${slot.exercise && !exercises.includes(slot.exercise) ? slot.exercise : ''}">
            <button class="btn btn-secondary" onclick="saveCustomExercise(${index})">Save</button>
          </div>
        </div>

        <!-- Sets -->
        <div class="section">
          <div class="section-title">
            📋 Sets
            <button class="btn btn-xs btn-secondary" onclick="addSet(${index})">+ Add Set</button>
          </div>
          <div id="setsContainer_${index}">
            ${renderSets(slot, index)}
          </div>
        </div>

        <!-- Myo-Rep Clusters -->
        <div class="myo-section">
          <div class="section-title">
            ⚡ Myo-Rep Clusters
            <button class="btn btn-xs btn-warning" onclick="addCluster(${index})">+ Add Cluster</button>
          </div>
          <div id="clustersContainer_${index}">
            ${renderClusters(slot, index)}
          </div>
          <div class="myo-instruction">
            After your last rep, rest 15s, then 3-5 reps. Repeat for 2-3 clusters.
          </div>
        </div>

        <!-- Weak Points -->
        <div class="section">
          <div class="section-title">
            🎯 Weak Points
            <button class="btn btn-xs btn-warning" onclick="addWeakPoint(${index})">+ Add</button>
          </div>
          <div id="weakPointsContainer_${index}">
            ${renderWeakPoints(slot, index)}
          </div>
        </div>

        <!-- Notes -->
        <div class="section">
          <div class="section-title">📝 Notes</div>
          <textarea class="form-input" rows="2" placeholder="Exercise notes..." 
                    onchange="updateNotes(${index}, this.value)">${slot.notes || ''}</textarea>
        </div>

        <!-- Timer -->
        <div class="timer-section">
          <div class="timer-display" id="timer_${index}">01:30</div>
          <div>
            <button class="btn btn-xs btn-secondary" onclick="startTimer(${index})">▶️</button>
            <button class="btn btn-xs btn-warning" onclick="pauseTimer(${index})">⏸️</button>
            <button class="btn btn-xs btn-danger" onclick="resetTimer(${index})">🔄</button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function renderSets(slot, slotIndex) {
  return slot.sets.map((set, setIndex) => `
    <div class="set-row">
      <span style="font-weight: 600; min-width: 40px;">Set ${setIndex + 1}:</span>
      <input type="number" class="set-input" placeholder="Weight" value="${set.weight}" 
             onchange="updateSet(${slotIndex}, ${setIndex}, 'weight', this.value)">
      <input type="number" class="set-input" placeholder="Reps" value="${set.reps}"
             onchange="updateSet(${slotIndex}, ${setIndex}, 'reps', this.value)">
      ${slot.sets.length > 1 ? `<button class="btn btn-xs btn-danger" onclick="removeSet(${slotIndex}, ${setIndex})">×</button>` : ''}
      <button class="btn btn-xs btn-secondary" onclick="addSetAfter(${slotIndex}, ${setIndex})">+ After</button>
    </div>
  `).join('');
}

function renderClusters(slot, slotIndex) {
  const lastSet = slot.sets[slot.sets.length - 1];
  if (!lastSet.myoReps || lastSet.myoReps.length === 0) {
    return '<div style="color: #64748b; font-style: italic;">No clusters added yet.</div>';
  }
  
  return lastSet.myoReps.map((reps, clusterIndex) => `
    <div class="set-row">
      <span style="font-weight: 600; min-width: 80px;">Cluster ${clusterIndex + 1}:</span>
      <input type="number" class="set-input" placeholder="Reps" value="${reps}"
             onchange="updateCluster(${slotIndex}, ${clusterIndex}, this.value)">
      <button class="btn btn-xs btn-danger" onclick="removeCluster(${slotIndex}, ${clusterIndex})">×</button>
    </div>
  `).join('');
}

function renderWeakPoints(slot, slotIndex) {
  if (!slot.weakPoints || slot.weakPoints.length === 0) {
    return '<div style="color: #64748b; font-style: italic;">No weak points added yet.</div>';
  }
  
  return slot.weakPoints.map((wp, wpIndex) => {
    const bodyParts = Object.keys(EXERCISES);
    const wpExercises = getAvailableExercises(wp.bodypart || 'Chest');
    
    return `
      <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 1rem; margin-bottom: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <strong>🎯 Weak Point</strong>
          <button class="btn btn-xs btn-danger" onclick="removeWeakPoint(${slotIndex}, ${wpIndex})">Remove</button>
        </div>
        <select class="form-select" style="margin-bottom: 0.5rem;" onchange="updateWeakPointBodypart(${slotIndex}, ${wpIndex}, this.value)">
          ${bodyParts.map(bp => `<option value="${bp}" ${wp.bodypart === bp ? 'selected' : ''}>${bp}</option>`).join('')}
        </select>
        <select class="form-select" style="margin-bottom: 0.5rem;" onchange="updateWeakPointExercise(${slotIndex}, ${wpIndex}, this.value)">
          <option value="">Select exercise...</option>
          ${wpExercises.map(ex => `<option value="${ex}" ${wp.exercise === ex ? 'selected' : ''}>${ex}</option>`).join('')}
        </select>
        ${(wp.sets || []).map((set, setIdx) => `
          <div class="set-row" style="margin-bottom: 0.5rem;">
            <span style="font-weight: 600; min-width: 40px;">Set ${setIdx + 1}:</span>
            <input type="number" class="set-input" placeholder="Weight" value="${set.weight}"
                   onchange="updateWeakPointSet(${slotIndex}, ${wpIndex}, ${setIdx}, 'weight', this.value)">
            <input type="number" class="set-input" placeholder="Reps" value="${set.reps}"
                   onchange="updateWeakPointSet(${slotIndex}, ${wpIndex}, ${setIdx}, 'reps', this.value)">
            ${wp.sets.length > 1 ? `<button class="btn btn-xs btn-danger" onclick="removeWeakPointSet(${slotIndex}, ${wpIndex}, ${setIdx})">×</button>` : ''}
          </div>
        `).join('')}
        <button class="btn btn-xs btn-secondary" onclick="addWeakPointSet(${slotIndex}, ${wpIndex})">+ Add Set</button>
      </div>
    `;
  }).join('');
}

function renderWorkoutWeakPoints(workout) {
  const container = document.getElementById('workoutWeakPoints');
  if (!workout.workoutWeakPoints || workout.workoutWeakPoints.length === 0) {
    container.innerHTML = '<div style="color: #64748b; font-style: italic;">No workout weak points added yet.</div>';
    return;
  }
  
  container.innerHTML = workout.workoutWeakPoints.map((wp, wpIndex) => {
    const bodyParts = Object.keys(EXERCISES);
    const wpExercises = getAvailableExercises(wp.bodypart || 'Chest');

    return `
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 1rem; margin-bottom: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <strong>🎯 Workout Weak Point</strong>
          <button class="btn btn-xs btn-danger" onclick="removeWorkoutWeakPoint(${wpIndex})">Remove</button>
        </div>
        <select class="form-select" style="margin-bottom: 0.5rem;" onchange="updateWorkoutWeakPointBodypart(${wpIndex}, this.value)">
          ${bodyParts.map(bp => `<option value="${bp}" ${wp.bodypart === bp ? 'selected' : ''}>${bp}</option>`).join('')}
        </select>
        <select class="form-select" style="margin-bottom: 0.5rem;" onchange="updateWorkoutWeakPointExercise(${wpIndex}, this.value)">
          <option value="">Select exercise...</option>
          ${wpExercises.map(ex => `<option value="${ex}" ${wp.exercise === ex ? 'selected' : ''}>${ex}</option>`).join('')}
        </select>
        ${(wp.sets || []).map((set, setIdx) => `
          <div class="set-row" style="margin-bottom: 0.5rem;">
            <span style="font-weight: 600; min-width: 40px;">Set ${setIdx + 1}:</span>
            <input type="number" class="set-input" placeholder="Weight" value="${set.weight}"
                   onchange="updateWorkoutWeakPointSet(${wpIndex}, ${setIdx}, 'weight', this.value)">
            <input type="number" class="set-input" placeholder="Reps" value="${set.reps}"
                   onchange="updateWorkoutWeakPointSet(${wpIndex}, ${setIdx}, 'reps', this.value)">
            ${wp.sets.length > 1 ? `<button class="btn btn-xs btn-danger" onclick="removeWorkoutWeakPointSet(${wpIndex}, ${setIdx})">×</button>` : ''}
          </div>
        `).join('')}
        <button class="btn btn-xs btn-secondary" onclick="addWorkoutWeakPointSet(${wpIndex})">+ Add Set</button>
      </div>
    `;
  }).join('');
}

// Event handlers and update functions

// Exercise-specific functions
function selectExercise(slotIndex, value) {
  const workout = getCurrentWorkout();
  if (value === "__custom__") {
    document.getElementById(`customRow_${slotIndex}`).classList.remove('hidden');
    workout.slots[slotIndex].exercise = "";
  } else {
    document.getElementById(`customRow_${slotIndex}`).classList.add('hidden');
    workout.slots[slotIndex].exercise = value;
  }
  saveWorkout();
  renderExercises(workout); // Re-render to update the last week info section
}

function saveCustomExercise(slotIndex) {
  const workout = getCurrentWorkout();
  const customInput = document.getElementById(`customInput_${slotIndex}`);
  const newExercise = customInput.value.trim();

  if (newExercise) {
    const slot = workout.slots[slotIndex];
    const bpKeys = slot.bpKey.split("|");
    // Add custom exercise to the first body part in the list
    const firstBp = bpKeys[0]; 
    if (!customExercises[firstBp]) {
      customExercises[firstBp] = [];
    }
    if (!customExercises[firstBp].includes(newExercise)) {
      customExercises[firstBp].push(newExercise);
    }
    workout.slots[slotIndex].exercise = newExercise;
    saveJSON(STORAGE.CUSTOM, customExercises);
    
    // Re-render to update dropdown
    renderAll(); 
  }
}

function addSet(slotIndex) {
  const workout = getCurrentWorkout();
  workout.slots[slotIndex].sets.push({ weight: "", reps: "", myoReps: [] });
  renderSetsContainer(slotIndex);
  saveWorkout();
}

function addSetAfter(slotIndex, setIndex) {
  const workout = getCurrentWorkout();
  workout.slots[slotIndex].sets.splice(setIndex + 1, 0, { weight: "", reps: "" });
  renderSetsContainer(slotIndex);
  saveWorkout();
}

function removeSet(slotIndex, setIndex) {
  const workout = getCurrentWorkout();
  if (workout.slots[slotIndex].sets.length > 1) {
    workout.slots[slotIndex].sets.splice(setIndex, 1);
    renderSetsContainer(slotIndex);
    saveWorkout();
  }
}

function updateSet(slotIndex, setIndex, type, value) {
  const workout = getCurrentWorkout();
  workout.slots[slotIndex].sets[setIndex][type] = value;
  saveWorkout();
}

function addCluster(slotIndex) {
  const workout = getCurrentWorkout();
  const lastSet = workout.slots[slotIndex].sets[workout.slots[slotIndex].sets.length - 1];
  if (!lastSet.myoReps) {
    lastSet.myoReps = [];
  }
  lastSet.myoReps.push("");
  renderClustersContainer(slotIndex);
  saveWorkout();
}

function updateCluster(slotIndex, clusterIndex, value) {
  const workout = getCurrentWorkout();
  const lastSet = workout.slots[slotIndex].sets[workout.slots[slotIndex].sets.length - 1];
  if (lastSet && lastSet.myoReps) {
    lastSet.myoReps[clusterIndex] = value;
  }
  saveWorkout();
}

function removeCluster(slotIndex, clusterIndex) {
  const workout = getCurrentWorkout();
  const lastSet = workout.slots[slotIndex].sets[workout.slots[slotIndex].sets.length - 1];
  if (lastSet && lastSet.myoReps) {
    lastSet.myoReps.splice(clusterIndex, 1);
  }
  renderClustersContainer(slotIndex);
  saveWorkout();
}

function addWeakPoint(slotIndex) {
  const workout = getCurrentWorkout();
  workout.slots[slotIndex].weakPoints.push({
    bodypart: "Chest",
    exercise: "",
    sets: [{ weight: "", reps: "" }]
  });
  renderWeakPointsContainer(slotIndex);
  saveWorkout();
}

function updateWeakPointBodypart(slotIndex, wpIndex, value) {
  const workout = getCurrentWorkout();
  workout.slots[slotIndex].weakPoints[wpIndex].bodypart = value;
  workout.slots[slotIndex].weakPoints[wpIndex].exercise = "";
  renderWeakPointsContainer(slotIndex);
  saveWorkout();
}

function updateWeakPointExercise(slotIndex, wpIndex, value) {
  const workout = getCurrentWorkout();
  workout.slots[slotIndex].weakPoints[wpIndex].exercise = value;
  saveWorkout();
}

function updateWeakPointSet(slotIndex, wpIndex, setIndex, type, value) {
  const workout = getCurrentWorkout();
  workout.slots[slotIndex].weakPoints[wpIndex].sets[setIndex][type] = value;
  saveWorkout();
}

function addWeakPointSet(slotIndex, wpIndex) {
  const workout = getCurrentWorkout();
  workout.slots[slotIndex].weakPoints[wpIndex].sets.push({ weight: "", reps: "" });
  renderWeakPointsContainer(slotIndex);
  saveWorkout();
}

function removeWeakPointSet(slotIndex, wpIndex, setIndex) {
  const workout = getCurrentWorkout();
  workout.slots[slotIndex].weakPoints[wpIndex].sets.splice(setIndex, 1);
  renderWeakPointsContainer(slotIndex);
  saveWorkout();
}

function removeWeakPoint(slotIndex, wpIndex) {
  const workout = getCurrentWorkout();
  workout.slots[slotIndex].weakPoints.splice(wpIndex, 1);
  renderWeakPointsContainer(slotIndex);
  saveWorkout();
}

function updateNotes(slotIndex, value) {
  const workout = getCurrentWorkout();
  workout.slots[slotIndex].notes = value;
}

// Rerender specific sections for efficiency
function renderSetsContainer(slotIndex) {
  const workout = getCurrentWorkout();
  const container = document.getElementById(`setsContainer_${slotIndex}`);
  if (container) {
    container.innerHTML = renderSets(workout.slots[slotIndex], slotIndex);
  }
}

function renderClustersContainer(slotIndex) {
  const workout = getCurrentWorkout();
  const container = document.getElementById(`clustersContainer_${slotIndex}`);
  if (container) {
    container.innerHTML = renderClusters(workout.slots[slotIndex], slotIndex);
  }
}

function renderWeakPointsContainer(slotIndex) {
  const workout = getCurrentWorkout();
  const container = document.getElementById(`weakPointsContainer_${slotIndex}`);
  if (container) {
    container.innerHTML = renderWeakPoints(workout.slots[slotIndex], slotIndex);
  }
}

function addWorkoutWeakPoint() {
  const workout = getCurrentWorkout();
  workout.workoutWeakPoints.push({
    bodypart: "Chest",
    exercise: "",
    sets: [{ weight: "", reps: "" }]
  });
  renderWorkoutWeakPoints(workout);
  saveWorkout();
}

function updateWorkoutWeakPointBodypart(wpIndex, value) {
  const workout = getCurrentWorkout();
  workout.workoutWeakPoints[wpIndex].bodypart = value;
  workout.workoutWeakPoints[wpIndex].exercise = "";
  renderWorkoutWeakPoints(workout);
  saveWorkout();
}

function updateWorkoutWeakPointExercise(wpIndex, value) {
  const workout = getCurrentWorkout();
  workout.workoutWeakPoints[wpIndex].exercise = value;
  saveWorkout();
}

function updateWorkoutWeakPointSet(wpIndex, setIndex, type, value) {
  const workout = getCurrentWorkout();
  workout.workoutWeakPoints[wpIndex].sets[setIndex][type] = value;
  saveWorkout();
}

function addWorkoutWeakPointSet(wpIndex) {
  const workout = getCurrentWorkout();
  workout.workoutWeakPoints[wpIndex].sets.push({ weight: "", reps: "" });
  renderWorkoutWeakPoints(workout);
  saveWorkout();
}

function removeWorkoutWeakPointSet(wpIndex, setIndex) {
  const workout = getCurrentWorkout();
  workout.workoutWeakPoints[wpIndex].sets.splice(setIndex, 1);
  renderWorkoutWeakPoints(workout);
  saveWorkout();
}

function removeWorkoutWeakPoint(wpIndex) {
  const workout = getCurrentWorkout();
  workout.workoutWeakPoints.splice(wpIndex, 1);
  renderWorkoutWeakPoints(workout);
  saveWorkout();
}

function moveSlot(index, direction) {
  const workout = getCurrentWorkout();
  const slots = workout.slots;
  const newIndex = index + direction;
  
  if (newIndex >= 0 && newIndex < slots.length) {
    const [movedSlot] = slots.splice(index, 1);
    slots.splice(newIndex, 0, movedSlot);
    renderAll();
    saveWorkout();
  }
}

// Timer functions
function getCurrentWorkoutKey() {
  const startDate = document.getElementById('startDate').value;
  const workoutDate = document.getElementById('workoutDate').value;
  const dayKey = document.getElementById('daySelect').value;
  const week = getWeekNumber(startDate, workoutDate);
  return `week${week}_${dayKey}`;
}

function getCurrentWorkout() {
  const key = getCurrentWorkoutKey();
  return workouts[key];
}

function startTimer(index) {
  const timerElement = document.getElementById(`timer_${index}`);
  if (!timers[index]) {
    let timeLeft = 90; // Default 90 seconds
    timers[index] = {
      interval: setInterval(() => {
        if (timeLeft <= 0) {
          clearInterval(timers[index].interval);
          timers[index] = null;
          timerElement.textContent = "00:00";
          playSound('complete');
        } else {
          if (timeLeft <= 3 && timeLeft > 0) {
            playSound('countdown');
          }
          timeLeft--;
          const minutes = Math.floor(timeLeft / 60);
          const seconds = timeLeft % 60;
          timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
      }, 1000),
      timeLeft: timeLeft
    };
  }
}

function pauseTimer(index) {
  if (timers[index]) {
    clearInterval(timers[index].interval);
    timers[index] = null;
  }
}

function resetTimer(index) {
  pauseTimer(index);
  const timerElement = document.getElementById(`timer_${index}`);
  timerElement.textContent = "01:30";
}

// Data persistence and export/import
function saveWorkout() {
  saveJSON(STORAGE.WORKOUTS, workouts);
  saveJSON(STORAGE.START_DATE, document.getElementById('startDate').value);
  saveJSON(STORAGE.WORKOUT_DATE, document.getElementById('workoutDate').value);
  saveJSON(STORAGE.SELECTED_DAY, document.getElementById('daySelect').value);
}

function exportData() {
  const data = {
    startDate: localStorage.getItem(STORAGE.START_DATE),
    workoutDate: localStorage.getItem(STORAGE.WORKOUT_DATE),
    selectedDay: localStorage.getItem(STORAGE.SELECTED_DAY),
    workouts: localStorage.getItem(STORAGE.WORKOUTS),
    customExercises: localStorage.getItem(STORAGE.CUSTOM)
  };
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workout_data_${getTodayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importData() {
  const fileInput = document.getElementById('importFile');
  fileInput.click(); // Trigger the file dialog
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          if (importedData.workouts && importedData.startDate) {
            localStorage.setItem(STORAGE.START_DATE, importedData.startDate);
            localStorage.setItem(STORAGE.WORKOUT_DATE, importedData.workoutDate);
            localStorage.setItem(STORAGE.SELECTED_DAY, importedData.selectedDay);
            localStorage.setItem(STORAGE.WORKOUTS, importedData.workouts);
            if (importedData.customExercises) {
              localStorage.setItem(STORAGE.CUSTOM, importedData.customExercises);
            }
            loadState();
            renderAll();
            // Instead of alert(), use a more user-friendly message
            console.log("Import successful! Data loaded.");
          } else {
            console.error("Invalid file format. Please import a valid workout data JSON file.");
          }
        } catch (error) {
          console.error("Error parsing file. Please ensure it's a valid JSON file.");
        }
      };
      reader.readAsText(file);
    }
  };
}

function loadState() {
  // Load from local storage
  document.getElementById('startDate').value = localStorage.getItem(STORAGE.START_DATE) || '';
  document.getElementById('workoutDate').value = localStorage.getItem(STORAGE.WORKOUT_DATE) || getTodayISO();
  document.getElementById('daySelect').value = localStorage.getItem(STORAGE.SELECTED_DAY) || 'saturday';
  workouts = loadJSON(STORAGE.WORKOUTS, {});
  customExercises = loadJSON(STORAGE.CUSTOM, {});
}

// Initialize the app
function init() {
  loadState();
  renderAll();

  // Add event listeners
  document.getElementById('startDate').addEventListener('change', renderAll);
  document.getElementById('workoutDate').addEventListener('change', renderAll);
  document.getElementById('daySelect').addEventListener('change', renderAll);
  document.getElementById('saveBtn').addEventListener('click', saveWorkout);
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', importData);
  document.getElementById('addWorkoutWeakBtn').addEventListener('click', addWorkoutWeakPoint);
}

window.onload = init;

