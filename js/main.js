/**
 * NOUN GAMBIT | Minimalist SPA Logic
 * Features: LocalStorage Persistence, Standings, Multi-view Navigation, Random Pairings
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Initialization ---
    let state = JSON.parse(localStorage.getItem('noun_gambit_spa_state')) || {
        players: [],
        pairings: [],
        view: 'home' // Default view changed to 'home'
    };

    // --- DOM Elements ---
    const homeSection = document.getElementById('home-section');
    const publicSection = document.getElementById('public-section');
    const adminSection = document.getElementById('admin-section');
    const standingsBody = document.getElementById('standings-body');
    const noPlayersMsg = document.getElementById('no-players-msg');
    const playerListChips = document.getElementById('player-list-chips');
    const addPlayerForm = document.getElementById('add-player-form');
    const playerNameInput = document.getElementById('player-name-input');
    const pairingsList = document.getElementById('pairings-list');
    const generatePairingsBtn = document.getElementById('generate-pairings-btn');
    const resetDataBtn = document.getElementById('reset-data-btn');
    const navLinks = document.querySelectorAll('.nav-link');
    const logoHome = document.getElementById('logo-home');

    // --- Slider Elements ---
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    let currentSlide = 0;
    let sliderInterval;

    // --- Persistence ---
    const saveState = () => {
        localStorage.setItem('noun_gambit_spa_state', JSON.stringify(state));
        render();
    };

    // --- Actions ---
    const setView = (viewName) => {
        state.view = viewName;
        saveState();
    };

    const addPlayer = (name) => {
        if (!name.trim()) return;
        state.players.push({
            id: Date.now(),
            name: name.trim(),
            points: 0
        });
        saveState();
    };

    const removePlayer = (id) => {
        state.players = state.players.filter(p => p.id !== id);
        saveState();
    };

    const generatePairings = () => {
        if (state.players.length < 2) {
            alert("Need at least 2 players to start pairings.");
            return;
        }

        const shuffled = [...state.players].sort(() => 0.5 - Math.random());
        const newPairings = [];

        for (let i = 0; i < shuffled.length; i += 2) {
            if (shuffled[i + 1]) {
                newPairings.push({
                    white: shuffled[i],
                    black: shuffled[i + 1],
                    result: null
                });
            } else {
                newPairings.push({
                    white: shuffled[i],
                    black: { name: 'BYE', id: -1 },
                    result: '1-0'
                });
            }
        }
        state.pairings = newPairings;
        saveState();
    };

    const updateResult = (pairIndex, result) => {
        const pairing = state.pairings[pairIndex];
        if (!pairing || pairing.result === result) return;

        if (pairing.result) {
            adjustPoints(pairing, pairing.result, -1);
        }

        pairing.result = result;
        adjustPoints(pairing, result, 1);
        saveState();
    };

    const adjustPoints = (pairing, result, multiplier) => {
        const p1 = state.players.find(p => p.id === pairing.white.id);
        const p2 = state.players.find(p => p.id === pairing.black.id);

        if (result === '1-0') {
            if (p1) p1.points += (1 * multiplier);
        } else if (result === '0-1') {
            if (p2) p2.points += (1 * multiplier);
        } else if (result === '0.5-0.5') {
            if (p1) p1.points += (0.5 * multiplier);
            if (p2) p2.points += (0.5 * multiplier);
        }
    };

    // --- Slider Actions ---
    const showSlide = (index) => {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
            dots[i].classList.toggle('active', i === index);
        });
        currentSlide = index;
    };

    const nextSlide = () => {
        let next = (currentSlide + 1) % slides.length;
        showSlide(next);
    };

    const prevSlide = () => {
        let prev = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prev);
    };

    const startAutoPlay = () => {
        stopAutoPlay();
        sliderInterval = setInterval(nextSlide, 5000);
    };

    const stopAutoPlay = () => {
        if (sliderInterval) clearInterval(sliderInterval);
    };

    // --- Rendering ---
    const renderStandings = () => {
        standingsBody.innerHTML = '';
        const sorted = [...state.players].sort((a, b) => b.points - a.points);

        if (sorted.length === 0) {
            noPlayersMsg.classList.remove('hidden');
        } else {
            noPlayersMsg.classList.add('hidden');
            sorted.forEach((player, index) => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-white/5 hover:bg-white/5 transition-colors';
                tr.innerHTML = `
                    <td class="p-4 text-white/40 font-bold">#${index + 1}</td>
                    <td class="p-4 font-medium">${player.name}</td>
                    <td class="p-4 text-right font-bold gold-text">${player.points.toFixed(1)}</td>
                `;
                standingsBody.appendChild(tr);
            });
        }
    };

    const renderPlayerList = () => {
        playerListChips.innerHTML = '';
        state.players.forEach(player => {
            const chip = document.createElement('div');
            chip.className = 'bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-2 text-sm';
            chip.innerHTML = `
                <span>${player.name}</span>
                <button class="text-white/20 hover:text-red-500 transition-colors" data-id="${player.id}">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>
            `;
            chip.querySelector('button').onclick = () => removePlayer(player.id);
            playerListChips.appendChild(chip);
        });
        lucide.createIcons();
    };

    const renderPairings = () => {
        pairingsList.innerHTML = '';
        if (state.pairings.length === 0) {
            pairingsList.innerHTML = '<p class="text-white/10 italic text-center py-8">No pairings generated yet.</p>';
            return;
        }

        state.pairings.forEach((pair, index) => {
            const div = document.createElement('div');
            div.className = 'flex flex-col md:flex-row items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg gap-4';
            div.innerHTML = `
                <div class="flex-grow flex items-center justify-center md:justify-start gap-4">
                    <span class="font-bold text-white/80">${pair.white.name}</span>
                    <span class="text-xs gold-text font-bold">VS</span>
                    <span class="font-bold text-white/80">${pair.black.name}</span>
                </div>
                <div class="flex items-center gap-2">
                    <button class="res-btn px-3 py-1 text-xs font-bold rounded border border-white/10 hover:border-gold ${pair.result === '1-0' ? 'gold-bg text-charcoal border-gold' : ''}" data-res="1-0">1-0</button>
                    <button class="res-btn px-3 py-1 text-xs font-bold rounded border border-white/10 hover:border-gold ${pair.result === '0.5-0.5' ? 'gold-bg text-charcoal border-gold' : ''}" data-res="0.5-0.5">½-½</button>
                    <button class="res-btn px-3 py-1 text-xs font-bold rounded border border-white/10 hover:border-gold ${pair.result === '0-1' ? 'gold-bg text-charcoal border-gold' : ''}" data-res="0-1">0-1</button>
                </div>
            `;

            div.querySelectorAll('.res-btn').forEach(btn => {
                btn.onclick = () => updateResult(index, btn.getAttribute('data-res'));
            });

            pairingsList.appendChild(div);
        });
    };

    const render = () => {
        // Section Visibility
        const sections = {
            home: homeSection,
            public: publicSection,
            admin: adminSection
        };

        Object.keys(sections).forEach(key => {
            if (key === state.view) {
                sections[key].classList.remove('hidden-section');
                sections[key].classList.add('animate-in', 'fade-in', 'duration-500');
            } else {
                sections[key].classList.add('hidden-section');
            }
        });

        // Active Nav State
        navLinks.forEach(link => {
            if (link.getAttribute('data-view') === state.view) {
                link.classList.add('text-gold');
                link.classList.remove('text-white/40');
            } else {
                link.classList.remove('text-gold');
                link.classList.add('text-white/40');
            }
        });

        renderStandings();
        renderPlayerList();
        renderPairings();
        lucide.createIcons();
    };

    // --- Events ---
    navLinks.forEach(link => {
        link.onclick = () => setView(link.getAttribute('data-view'));
    });

    logoHome.onclick = () => setView('home');

    addPlayerForm.onsubmit = (e) => {
        e.preventDefault();
        addPlayer(playerNameInput.value);
        playerNameInput.value = '';
    };

    generatePairingsBtn.onclick = generatePairings;

    resetDataBtn.onclick = () => {
        if (confirm("Are you sure you want to delete all players and scores?")) {
            state = { players: [], pairings: [], view: 'admin' };
            saveState();
        }
    };

    // Slider Events
    if (nextBtn) nextBtn.onclick = () => {
        nextSlide();
        startAutoPlay();
    };

    if (prevBtn) prevBtn.onclick = () => {
        prevSlide();
        startAutoPlay();
    };

    dots.forEach((dot, i) => {
        dot.onclick = () => {
            showSlide(i);
            startAutoPlay();
        };
    });

    // Start auto play initially
    startAutoPlay();

    // Initial Render
    render();
});
