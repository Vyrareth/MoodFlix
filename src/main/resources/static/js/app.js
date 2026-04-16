// app.js — handles all frontend logic and talks to our Java backend

const IMG_BASE = "https://image.tmdb.org/t/p/w500";
let currentSitePage = 1;        // which "site page" we're on (each = 100 movies)
const MOVIES_PER_SITE_PAGE = 100;
const TMDB_PAGES_PER_SITE_PAGE = 5; // 5 TMDb pages x 20 movies = 100

let quizAnswers = {
    mood:       null,   // happy / sad / excited / scared / romantic / curious
    endFeel:    null,   // inspired / scared / laughing / crying / mindblown
    social:     null,   // alone / friends / partner / family
    thinking:   null,   // none / little / deep
    commitment: null,   // short / medium / long
    atmosphere: null    // action / dialogue / music / quiet
};

function showSection(name) {
    document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
    document.getElementById("random-result").classList.add("hidden");
    document.getElementById("section-" + name).classList.remove("hidden");
    if (name === "popular") loadPopularMovies();
    if (name === "quiz") updateQuizProgress();
}

//popular movies

async function loadPopularMovies() {
    document.getElementById("popular-movies").innerHTML = "<p>Loading...</p>";

    // calculate which TMDb pages to fetch for this site page
    const startTmdbPage = (currentSitePage - 1) * TMDB_PAGES_PER_SITE_PAGE + 1;
    const pages = Array.from({ length: TMDB_PAGES_PER_SITE_PAGE }, (_, i) => startTmdbPage + i);

    const responses = await Promise.all(
        pages.map(p => fetch(`/api/movies/popular?page=${p}`).then(r => r.json()))
    );

    const allMovies = responses.flatMap(data => data.results);
    displayMovies(allMovies, "popular-movies");
    updatePaginationUI();
}

let pageChanging = false;

function changePage(direction) {
    if (pageChanging) return;
    if (direction === -1 && currentSitePage === 1) return;
    if (direction === 1 && currentSitePage >= 100) return; // TMDb max is 500 pages, 5 per site page

    pageChanging = true;
    playPageTransition(direction).then(() => {
        currentSitePage += direction;
        window.scrollTo(0, 0);
        loadPopularMovies().finally(() => { pageChanging = false; });
    });
}

function playPageTransition(direction) {
    return new Promise(resolve => {
        const el = document.getElementById(direction === 1 ? 'pt-next' : 'pt-prev');
        el.classList.remove('animate-in');
        void el.offsetWidth; // force reflow so animation restarts
        el.classList.add('animate-in');
        setTimeout(() => {
            el.classList.remove('animate-in');
            resolve();
        }, 750);
    });
}

function updatePaginationUI() {
    const label = `Page ${currentSitePage}`;

    document.getElementById("page-indicator").textContent = label;
    document.getElementById("page-indicator-bottom").textContent = label;

    const pageDisplay = document.getElementById("popular-page-display");
    if (pageDisplay) pageDisplay.textContent = String(currentSitePage).padStart(2, '0');

    const prevDisabled = currentSitePage === 1;
    document.getElementById("prev-btn").disabled = prevDisabled;
    document.getElementById("prev-btn-bottom").disabled = prevDisabled;
}

async function searchByTitle() {
    const query = document.getElementById("search-input").value.trim();
    if (!query) return;

    // fetch 2 pages (up to 40 results)
    const [res1, res2] = await Promise.all([
        fetch("/api/movies/search?query=" + encodeURIComponent(query) + "&page=1"),
        fetch("/api/movies/search?query=" + encodeURIComponent(query) + "&page=2")
    ]);
    const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

    const allResults = [...(data1.results || []), ...(data2.results || [])];
    displayMovies(allResults, "search-results");
}

async function browseByFilters() { // filter (genre + year + sort)
    const genre     = document.getElementById("genre-select").value;
    const startYear = document.getElementById("filter-start-year").value;
    const endYear   = document.getElementById("filter-end-year").value;
    const sortBy    = document.getElementById("sort-select").value;

    // validate years if either is filled in
    if (startYear || endYear) {
        const currentYear = new Date().getFullYear();
        const start = parseInt(startYear);
        const end   = parseInt(endYear);

        if (startYear && (startYear.length !== 4 || start < 1888 || start > currentYear)) {
            document.getElementById("search-results").innerHTML =
                "<p style='color:#ff4444;'>⚠️ Please enter a valid start year (e.g. 1995).</p>";
            return;
        }

        if (endYear && (endYear.length !== 4 || end < 1888 || end > currentYear)) {
            document.getElementById("search-results").innerHTML =
                "<p style='color:#ff4444;'>⚠️ Please enter a valid end year (e.g. 2010).</p>";
            return;
        }

        if (startYear && endYear && start > end) {
            document.getElementById("search-results").innerHTML =
                "<p style='color:#ff4444;'>⚠️ Start year can't be later than end year.</p>";
            return;
        }
    }

    // build query string, only include params that have values
    const params = new URLSearchParams();
    if (genre)     params.append("genreIds", genre);
    if (startYear) params.append("startYear", startYear);
    if (endYear)   params.append("endYear", endYear);
    if (sortBy)    params.append("sortBy", sortBy);

    // fetch 8 pages at once (8 x 20 = 160 movies)
    const responses = await Promise.all(
        [1, 2, 3, 4, 5, 6, 7, 8].map(p => {
            params.set("page", p);
            return fetch("/api/movies/discover?" + params.toString()).then(r => r.json());
        })
    );

    const allMovies = responses.flatMap(data => data.results || []);
    displayMovies(allMovies, "search-results");
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("search-input").addEventListener("keydown", e => {
        if (e.key === "Enter") searchByTitle();
    });
    loadPopularMovies();
});

async function browseByYear() {
    const start = document.getElementById("start-year").value;
    const end = document.getElementById("end-year").value;

    if (!start || !end) {
        alert("Please enter both a start and end year.");
        return;
    }

    const res = await fetch(`/api/movies/byyear?startYear=${start}&endYear=${end}`);
    const data = await res.json();
    displayMovies(data.results, "year-results");
}

//random movie generator

const DICE_FACES = {
    1: [[50, 50]],
    2: [[32, 32], [68, 68]],
    3: [[32, 32], [50, 50], [68, 68]],
    4: [[32, 32], [68, 32], [32, 68], [68, 68]],
    5: [[32, 32], [68, 32], [50, 50], [32, 68], [68, 68]],
    6: [[32, 32], [32, 50], [32, 68], [68, 32], [68, 50], [68, 68]]
};

function renderDiceFace(n) {
    const dots = DICE_FACES[n];
    const circles = dots.map(([cx, cy]) =>
        `<circle cx="${cx}" cy="${cy}" r="6" fill="#00e5ff"/>`
    ).join('');
    document.getElementById('dice-svg').innerHTML = `
        <rect x="6" y="6" width="88" height="88" rx="14"
              fill="rgba(0,229,255,0.05)" stroke="#00e5ff" stroke-width="2.5"/>
        ${circles}
    `;
}

function getRandomMovie() {
    document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
    document.getElementById("random-result").classList.remove("hidden");
    document.getElementById("random-movie-result").classList.add("hidden");
    renderDiceFace(Math.floor(Math.random() * 6) + 1);
}

let diceRolling = false;

async function rollDice() {
    if (diceRolling) return;
    diceRolling = true;

    const dice = document.getElementById("dice");
    const result = document.getElementById("random-movie-result");
    result.classList.add("hidden");
    dice.classList.add("rolling");

    const fetchPromise = fetch("/api/movies/random").then(r => r.json());

    // cycle faces rapidly for 1.4s to simulate rolling
    let elapsed = 0;
    const faceInterval = setInterval(() => {
        renderDiceFace(Math.floor(Math.random() * 6) + 1);
        elapsed += 80;
        if (elapsed >= 1400) clearInterval(faceInterval);
    }, 80);

    const [data] = await Promise.all([
        fetchPromise,
        new Promise(r => setTimeout(r, 1500))
    ]);

    clearInterval(faceInterval);
    dice.classList.remove("rolling");
    renderDiceFace(Math.floor(Math.random() * 6) + 1);

    const movies = data.results;
    const pick = movies[Math.floor(Math.random() * movies.length)];
    document.getElementById("random-movie-card").innerHTML = buildMovieCard(pick);

    result.classList.remove("hidden");
    result.classList.add("result-fade-in");
    setTimeout(() => result.classList.remove("result-fade-in"), 600);

    diceRolling = false;
}

// quiz: answers

function setAnswer(key, value, btn) {
    btn.closest(".quiz-options").querySelectorAll(".quiz-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    quizAnswers[key] = value;
    updateQuizProgress();
}

function updateQuizProgress() {
    const answered = Object.values(quizAnswers).filter(v => v !== null).length;
    const pct = (answered / 6) * 100;
    document.getElementById("quiz-progress-bar").style.width = pct + "%";
    document.getElementById("quiz-answered").textContent = answered;
}

// quiz algorithm
// Each answer adds points to TMDb genre IDs.
// At the end we pick the top scoring genres and call the discover endpoint.

function calculateGenresFromQuiz() {
    const scores = {};

    function add(genreId, points) {
        scores[genreId] = (scores[genreId] || 0) + points;
    }

    // TMDb genre IDs used:
    // 28=Action, 12=Adventure, 16=Animation, 35=Comedy, 80=Crime,
    // 99=Documentary, 18=Drama, 10751=Family, 14=Fantasy, 36=History,
    // 27=Horror, 10402=Music, 9648=Mystery, 10749=Romance, 878=Sci-Fi,
    // 53=Thriller, 10752=War, 37=Western

    // Q1: Current mood
    const moodMap = {
        happy:    { 35: 3, 16: 2, 12: 1, 14: 2 },           // Fantasy added — happy = escapism
        sad:      { 18: 3, 10749: 2 },
        excited:  { 28: 3, 12: 2, 53: 1, 14: 2, 10752: 2 }, // Fantasy + War added — excitement fits both
        scared:   { 27: 3, 53: 2, 9648: 1 },
        romantic: { 10749: 3, 18: 2 },
        curious:  { 878: 3, 99: 2, 9648: 1, 36: 2, 10752: 1 } // History + War added — curiosity drives both
    };
    if (quizAnswers.mood) Object.entries(moodMap[quizAnswers.mood] || {}).forEach(([g, p]) => add(g, p));

    // Q2: What to feel at the end
    const endFeelMap = {
        inspired:  { 99: 3, 18: 2, 878: 1, 36: 2, 10752: 2 }, // History + War added — both are inspiring/educational
        scared:    { 27: 3, 53: 2 },
        laughing:  { 35: 3, 16: 2 },
        crying:    { 18: 3, 10749: 2 },
        mindblown: { 878: 3, 9648: 2, 53: 1, 14: 2, 10752: 1 } // Fantasy + War — both can be mind-blowing
    };
    if (quizAnswers.endFeel) Object.entries(endFeelMap[quizAnswers.endFeel] || {}).forEach(([g, p]) => add(g, p));

    // Q3: Social context
    const socialMap = {
        alone:   { 27: 2, 53: 1, 18: 1, 14: 1 },         // Fantasy added — solo fantasy binging is real
        friends: { 35: 2, 28: 2, 12: 1 },
        partner: { 10749: 3, 18: 1 },
        family:  { 10751: 3, 16: 2, 12: 1, 14: 2 }        // Fantasy added — family-friendly fantasy (LOTR, Narnia)
    };
    if (quizAnswers.social) Object.entries(socialMap[quizAnswers.social] || {}).forEach(([g, p]) => add(g, p));

    // Q4: Thinking level
    const thinkingMap = {
        none:   { 35: 2, 28: 2, 16: 1, 14: 1 },           // Fantasy added — low-effort fantasy exists (comfort watch)
        little: { 53: 2, 80: 2, 12: 1, 10752: 2 },        // War added — war films need some attention but aren't always deep
        deep:   { 18: 2, 99: 2, 878: 2, 36: 3, 10752: 2 } // History + War added — both reward deep thinking
    };
    if (quizAnswers.thinking) Object.entries(thinkingMap[quizAnswers.thinking] || {}).forEach(([g, p]) => add(g, p));

    // Q5: look down for a seperate function that handles q5

    // Q6: Atmosphere
    const atmosphereMap = {
        action:    { 28: 2, 53: 1, 10752: 2, 14: 1 },     // War + Fantasy added — both are action-heavy
        dialogue:  { 18: 2, 80: 1, 36: 2 },                // History added — history films are very dialogue/story driven
        music:     { 10402: 3, 35: 1 },
        quiet:     { 18: 2, 9648: 2, 36: 1 }               // History added — quiet reflective mood fits historical dramas
    };
    if (quizAnswers.atmosphere) Object.entries(atmosphereMap[quizAnswers.atmosphere] || {}).forEach(([g, p]) => add(g, p));

    // sort genres by score, take top 2 — joined with | (OR logic, not AND)
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    return sorted.slice(0, 2).map(([g]) => g).join("|");
}

function getRuntimeParams() { // this is for question 5, seperate function
    switch (quizAnswers.commitment) {
        case "short":  return { max: "90" };
        case "medium": return { min: "90", max: "120" };
        case "long":   return { min: "120" };
        default:       return {};
    }
}

async function submitQuiz() {
    // check all questions answered
    const missing = Object.entries(quizAnswers).find(([, v]) => v === null);
    if (missing) {
        alert("Please answer all questions before submitting.");
        return;
    }

    const genreIds = calculateGenresFromQuiz();
    const runtime = getRuntimeParams();

    let baseUrl = `/api/movies/discover?genreIds=${encodeURIComponent(genreIds)}`;
    if (runtime.min) baseUrl += `&minRuntime=${runtime.min}`;
    if (runtime.max) baseUrl += `&maxRuntime=${runtime.max}`;

    // fetch 2 random pages so results are different each time
    const randomPage1 = Math.floor(Math.random() * 8) + 1;
    const randomPage2 = randomPage1 === 8 ? 1 : randomPage1 + 1;

    const [res1, res2] = await Promise.all([
        fetch(baseUrl + `&page=${randomPage1}`),
        fetch(baseUrl + `&page=${randomPage2}`)
    ]);
    const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

    // combine both pages, shuffle, take 15
    const combined = [...(data1.results || []), ...(data2.results || [])];
    const shuffled = combined.sort(() => Math.random() - 0.5);
    const top15 = shuffled.slice(0, 15);
    displayMovies(top15, "quiz-results");

    // scroll down to results
    document.getElementById("quiz-results").scrollIntoView({ behavior: "smooth" });
}

// ─── MOVIE DETAIL MODAL ───────────────────────────────────────────────────────

async function openMovieDetail(movieId) {
    const [detailRes, videoRes, creditsRes] = await Promise.all([
        fetch(`/api/movies/${movieId}/details`),
        fetch(`/api/movies/${movieId}/videos`),
        fetch(`/api/movies/${movieId}/credits`)
    ]);

    const movie = await detailRes.json();
    const videoData = await videoRes.json();
    const creditsData = await creditsRes.json();

    const backdrop = movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : null;

    const poster = movie.poster_path
        ? IMG_BASE + movie.poster_path
        : "https://placehold.co/200x300?text=No+Poster";

    const genres = movie.genres ? movie.genres.map(g => g.name).join(" · ") : "N/A";
    const runtime = movie.runtime ? movie.runtime + " min" : "N/A";
    const year = movie.release_date ? movie.release_date.substring(0, 4) : "N/A";
    const releaseDate = movie.release_date || "N/A";
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
    const voteCount = movie.vote_count ? movie.vote_count.toLocaleString() : "N/A";
    const tagline = movie.tagline ? `<p class="modal-tagline">"${movie.tagline}"</p>` : "";

    // find the first YouTube trailer
    const trailer = videoData.results
        ? videoData.results.find(v => v.site === "YouTube" && v.type === "Trailer")
        : null;

    const director = creditsData.crew
        ? creditsData.crew.find(c => c.job === "Director")
        : null;

    const cast = creditsData.cast ? creditsData.cast.slice(0, 8) : [];

    const castHTML = cast.map(person => {
        const photo = person.profile_path
            ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
            : "https://placehold.co/80x120?text=N/A";
        return `
            <div class="cast-card">
                <img src="${photo}" alt="${person.name}" />
                <div class="cast-name">${person.name}</div>
                <div class="cast-character">${person.character || ""}</div>
            </div>
        `;
    }).join("");

    const trailerHTML = trailer
        ? `<div class="modal-trailer">
               <h3>🎬 Trailer</h3>
               <iframe src="https://www.youtube.com/embed/${trailer.key}" allowfullscreen></iframe>
           </div>`
        : "";

    const backdropHTML = backdrop
        ? `<div class="modal-backdrop" style="background-image: url('${backdrop}')">
               <div class="modal-backdrop-overlay">
                   <img class="modal-poster" src="${poster}" alt="${movie.title}" />
                   <div class="modal-hero-info">
                       <h2>${movie.title}</h2>
                       ${tagline}
                       <div class="modal-rating">⭐ ${rating} <span class="vote-count">(${voteCount} votes)</span></div>
                       <div class="modal-meta">${year} &bull; ${runtime}</div>
                   </div>
               </div>
           </div>`
        : `<div class="modal-no-backdrop">
               <img class="modal-poster" src="${poster}" alt="${movie.title}" />
               <div class="modal-hero-info">
                   <h2>${movie.title}</h2>
                   ${tagline}
                   <div class="modal-rating">⭐ ${rating}</div>
                   <div class="modal-meta">${year} &bull; ${runtime}</div>
               </div>
           </div>`;

    document.getElementById("modal-content").innerHTML = `
        ${backdropHTML}
        <div class="modal-details-section">
            <div class="modal-section">
                <h3>Overview</h3>
                <p class="modal-overview">${movie.overview || "No description available."}</p>
            </div>
            <div class="modal-section">
                <h3>Details</h3>
                <table class="modal-details-table">
                    <tr><td>Director</td><td>${director ? director.name : "N/A"}</td></tr>
                    <tr><td>Release Date</td><td>${releaseDate}</td></tr>
                    <tr><td>Runtime</td><td>${runtime}</td></tr>
                    <tr><td>Genres</td><td>${genres}</td></tr>
                    <tr><td>Rating</td><td>⭐ ${rating} / 10</td></tr>
                    <tr><td>Votes</td><td>${voteCount}</td></tr>
                    ${movie.budget ? `<tr><td>Budget</td><td>$${movie.budget.toLocaleString()}</td></tr>` : ""}
                    ${movie.revenue ? `<tr><td>Revenue</td><td>$${movie.revenue.toLocaleString()}</td></tr>` : ""}
                </table>
            </div>
            ${cast.length > 0 ? `
            <div class="modal-section">
                <h3>Cast</h3>
                <div class="cast-grid">${castHTML}</div>
            </div>` : ""}
            ${trailerHTML}
        </div>
    `;

    document.getElementById("modal-overlay").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("modal-overlay").classList.add("hidden");
    document.getElementById("modal-content").innerHTML = "";
}

function displayMovies(movies, containerId) {
    const container = document.getElementById(containerId);

    if (!movies || movies.length === 0) {
        container.innerHTML = "<p>No movies found.</p>";
        return;
    }

    container.innerHTML = movies.map(movie => buildMovieCard(movie)).join("");
}

function buildMovieCard(movie) {
    const poster = movie.poster_path
        ? IMG_BASE + movie.poster_path
        : "https://placehold.co/180x270?text=No+Poster";

    const title = movie.title || "Unknown Title";
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
    const year = movie.release_date ? movie.release_date.substring(0, 4) : "N/A";

    return `
        <div class="movie-card" onclick="openMovieDetail(${movie.id})">
            <img src="${poster}" alt="${title}" />
            <div class="movie-info">
                <div class="movie-title">${title}</div>
                <div class="movie-rating">⭐ ${rating}</div>
                <div class="movie-year">${year}</div>
            </div>
        </div>
    `;
}
