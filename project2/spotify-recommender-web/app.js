const DATASET_URL = "../spotify_tracks_dataset/dataset.csv";
const CONTINUOUS_COLUMNS = [
  "duration_ms", "danceability", "energy", "loudness", "speechiness",
  "acousticness", "instrumentalness", "liveness", "valence", "tempo"
];
const AUDIO_SUMMARY = [
  ["danceability", "댄서블"], ["energy", "에너지"], ["speechiness", "말하기"],
  ["acousticness", "어쿠스틱"], ["instrumentalness", "연주곡"],
  ["liveness", "라이브 느낌"], ["valence", "긍정적 분위기"]
];
const PAGE_SIZE = 20;
const RECOMMENDATION_COUNT = 5;
const PLAYLIST_SIZE = 20;

const state = {
  tracks: [], sortedTracks: [], normalizedFeatures: null, featureSize: 0,
  indexById: new Map(), currentPage: "overview", selectedTrackId: null,
  currentResults: [], currentResultPage: 0, activePlaylist: [], searchText: ""
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const fmt = new Intl.NumberFormat("ko-KR");

function parseCSV(text, onRow) {
  let row = [];
  let field = "";
  let quoted = false;
  let headers = null;
  const finishRow = () => {
    row.push(field);
    field = "";
    if (!headers) {
      headers = row.map((value) => value.replace(/^\uFEFF/, "").trim());
    } else if (row.length > 1) {
      onRow(headers, row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = false;
      } else field += char;
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      finishRow();
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length || row.length) finishRow();
}

function parseTrack(at, row, sourceIndex) {
  const value = (key) => (row[at[key]] ?? "").trim();
  const number = (key) => {
    const raw = value(key);
    return raw === "" ? Number.NaN : Number(raw);
  };
  const track = {
    id: value("track_id"), title: value("track_name"), artist: value("artists"),
    album: value("album_name"), popularity: number("popularity"),
    key: number("key"), mode: number("mode"), time_signature: number("time_signature"),
    sourceIndex,
  };
  for (const column of CONTINUOUS_COLUMNS) track[column] = number(column);
  const required = ["popularity", "key", "mode", "time_signature", ...CONTINUOUS_COLUMNS];
  if (!track.id || required.some((key) => !Number.isFinite(track[key]))) return null;
  if (track.duration_ms <= 0) return null;
  return track;
}

function buildTrackData(rawText) {
  const byId = new Map();
  let sourceIndex = 0;
  let columnIndex;
  parseCSV(rawText, (headers, row) => {
    columnIndex ??= Object.fromEntries(headers.map((header, i) => [header, i]));
    const track = parseTrack(columnIndex, row, sourceIndex++);
    if (!track) return;
    const previous = byId.get(track.id);
    if (!previous || track.popularity > previous.popularity) byId.set(track.id, track);
  });

  // Match notebook cleaning: keep the most popular row per track_id, then exclude
  // zero tempo/time-signature records from recommendation features.
  state.tracks = [...byId.values()].filter((track) => track.tempo > 0 && track.time_signature > 0);
  state.tracks.sort((a, b) => a.sourceIndex - b.sourceIndex);
  state.tracks.forEach((track, index) => state.indexById.set(track.id, index));
  state.sortedTracks = [...state.tracks].sort((a, b) =>
    (b.popularity - a.popularity) || a.title.localeCompare(b.title, "ko") || (a.sourceIndex - b.sourceIndex)
  );

  const keyValues = [...new Set(state.tracks.map((track) => track.key))].sort((a, b) => a - b);
  const signatureValues = [...new Set(state.tracks.map((track) => track.time_signature))].sort((a, b) => a - b);
  const stats = CONTINUOUS_COLUMNS.map((column) => {
    let sum = 0;
    for (const track of state.tracks) sum += track[column];
    const mean = sum / state.tracks.length;
    let variance = 0;
    for (const track of state.tracks) variance += (track[column] - mean) ** 2;
    const scale = Math.sqrt(variance / state.tracks.length) || 1;
    return { mean, scale };
  });

  state.featureSize = CONTINUOUS_COLUMNS.length + 1 + keyValues.length + signatureValues.length;
  state.normalizedFeatures = new Float32Array(state.tracks.length * state.featureSize);
  state.tracks.forEach((track, index) => {
    const offset = index * state.featureSize;
    let cursor = 0;
    for (let col = 0; col < CONTINUOUS_COLUMNS.length; col += 1) {
      const column = CONTINUOUS_COLUMNS[col];
      state.normalizedFeatures[offset + cursor] = (track[column] - stats[col].mean) / stats[col].scale;
      cursor += 1;
    }
    state.normalizedFeatures[offset + cursor++] = track.mode;
    for (const key of keyValues) state.normalizedFeatures[offset + cursor++] = Number(track.key === key);
    for (const signature of signatureValues) state.normalizedFeatures[offset + cursor++] = Number(track.time_signature === signature);
    let norm = 0;
    for (let col = 0; col < state.featureSize; col += 1) norm += state.normalizedFeatures[offset + col] ** 2;
    norm = Math.sqrt(norm) || 1;
    for (let col = 0; col < state.featureSize; col += 1) state.normalizedFeatures[offset + col] /= norm;
  });
}

function setDatasetStatus(message, kind = "") {
  const el = $("#dataset-state");
  el.classList.toggle("is-ready", kind === "ready");
  el.classList.toggle("is-error", kind === "error");
  $("span:last-child", el).textContent = message;
}

function hueFor(track) {
  let hash = 0;
  const text = `${track.id}${track.title}`;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return (Math.abs(hash) % 360) + "deg";
}

function coverMarkup(track, large = false) {
  const sizeClass = large ? "selected-cover" : "cover-art";
  return `<div class="${sizeClass}" style="--cover-hue:${hueFor(track)}" aria-hidden="true"><span class="${large ? "cover-label" : "cover-glyph"}">${large ? "♫" : "♪"}</span></div>`;
}

function trackName(track) { return track.title || "곡 정보 없음"; }
function trackArtist(track) { return track.artist || "아티스트 정보 없음"; }

function createTrackRow(track, rank, showPopularity = true) {
  const popularity = Math.round(track.popularity);
  return `<article class="track-row" data-track-id="${escapeHTML(track.id)}" tabindex="0" role="button" aria-label="${escapeHTML(trackName(track))} — ${escapeHTML(trackArtist(track))} 상세 보기">
    <span class="track-rank">${rank}</span>${coverMarkup(track)}
    <div class="song-main"><span class="song-name">${escapeHTML(trackName(track))}</span><span class="song-artist">${escapeHTML(trackArtist(track))}</span></div>
    <div class="song-album">${escapeHTML(track.album || "앨범 정보 없음")}</div>
    <div class="popularity-cell">${showPopularity ? `<span class="popularity-value">${popularity}<span style="color:#b3b9c4"> / 100</span></span><div class="popularity-track"><div class="popularity-fill" style="width:${Math.max(0, Math.min(100, popularity))}%"></div></div>` : `<span class="similarity">곡 상세 보기</span>`}</div>
    <span class="row-open">곡 선택 <span>→</span></span>
  </article>`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function renderOverviewCharts() {
  const bins = Array(10).fill(0);
  for (const track of state.tracks) bins[Math.min(9, Math.max(0, Math.floor(track.popularity / 10)))] += 1;
  const maxBin = Math.max(...bins);
  $("#popularity-chart").innerHTML = bins.map((count, index) => {
    const height = Math.max(2, Math.round((count / maxBin) * 125));
    return `<div class="hist-col" title="${index * 10}–${index * 10 + 9}점: ${fmt.format(count)}곡"><div class="hist-bar" style="height:${height}px"></div><span class="hist-label">${index * 10}</span></div>`;
  }).join("");
  $("#feature-chart").innerHTML = AUDIO_SUMMARY.map(([column, label]) => {
    const average = state.tracks.reduce((sum, track) => sum + track[column], 0) / state.tracks.length;
    return `<div class="feature-row"><span>${label}</span><div class="feature-track"><div class="feature-fill" style="width:${Math.max(0, Math.min(100, average * 100))}%"></div></div><span class="feature-value">${average.toFixed(2)}</span></div>`;
  }).join("");
  $("#stat-track-count").textContent = fmt.format(state.tracks.length);
}

function openPage(page, { replace = false } = {}) {
  if (page === "track" && !state.selectedTrackId) page = "top100";
  state.currentPage = page;
  $$(".page").forEach((section) => section.classList.toggle("is-visible", section.id === `page-${page}`));
  $$(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.page === page));
  if (page === "track") renderTrackPage(state.selectedTrackId);
  const hash = page === "track" ? `#track/${encodeURIComponent(state.selectedTrackId)}` : `#${page}`;
  if (replace) history.replaceState(null, "", hash);
  else if (location.hash !== hash) history.pushState(null, "", hash);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function recommend(track, count = RECOMMENDATION_COUNT) {
  const seedIndex = state.indexById.get(track.id);
  if (seedIndex === undefined || !state.normalizedFeatures) return [];
  const start = seedIndex * state.featureSize;
  const seen = new Set([`${trackName(track).toLocaleLowerCase()}\u0000${trackArtist(track).toLocaleLowerCase()}`]);
  const best = [];
  for (let index = 0; index < state.tracks.length; index += 1) {
    if (index === seedIndex) continue;
    const candidate = state.tracks[index];
    const title = trackName(candidate);
    const artist = trackArtist(candidate);
    if (!candidate.title || !candidate.artist) continue;
    const identity = `${title.toLocaleLowerCase()}\u0000${artist.toLocaleLowerCase()}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    const offset = index * state.featureSize;
    let similarity = 0;
    for (let col = 0; col < state.featureSize; col += 1) similarity += state.normalizedFeatures[start + col] * state.normalizedFeatures[offset + col];
    const candidateResult = { track: candidate, similarity };
    const insertAt = best.findIndex((item) => similarity > item.similarity);
    if (insertAt === -1) {
      if (best.length < count) best.push(candidateResult);
    } else {
      best.splice(insertAt, 0, candidateResult);
      if (best.length > count) best.pop();
    }
  }
  return best;
}

function renderTrackPage(trackId) {
  const index = state.indexById.get(String(trackId));
  if (index === undefined) {
    $("#selected-song").innerHTML = `<div class="empty-state">선택한 곡을 찾지 못했어요. 차트에서 다른 곡을 골라주세요.</div>`;
    return;
  }
  const track = state.tracks[index];
  const recommendations = recommend(track, RECOMMENDATION_COUNT);
  const playlistExtras = recommend(track, PLAYLIST_SIZE - 1);
  state.activePlaylist = [track, ...playlistExtras.map((item) => item.track)];
  const minutes = Math.floor(track.duration_ms / 60000);
  const seconds = String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, "0");
  $("#selected-song").innerHTML = `${coverMarkup(track, true)}<div class="selected-info"><span class="panel-kicker">SELECTED TRACK · ${track.popularity} POPULARITY</span><h1 id="track-title">${escapeHTML(trackName(track))}</h1><p class="selected-artist">${escapeHTML(trackArtist(track))}</p><p class="selected-album">${escapeHTML(track.album || "앨범 정보 없음")}</p><div class="selected-stats"><div class="selected-stat"><span>길이</span><b>${minutes}:${seconds}</b></div><div class="selected-stat"><span>Tempo</span><b>${track.tempo.toFixed(0)} BPM</b></div><div class="selected-stat"><span>Energy</span><b>${track.energy.toFixed(2)}</b></div><div class="selected-stat"><span>Danceability</span><b>${track.danceability.toFixed(2)}</b></div></div></div><a class="spotify-link" href="https://open.spotify.com/track/${encodeURIComponent(track.id)}" target="_blank" rel="noreferrer">Spotify에서 열기 <span>↗</span></a>`;
  const spotifyEmbedUrl = `https://open.spotify.com/embed/track/${encodeURIComponent(track.id)}?utm_source=generator`;
  $("#spotify-embed").innerHTML = `<iframe class="spotify-player" title="${escapeHTML(trackName(track))} — Spotify 플레이어" src="${spotifyEmbedUrl}" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
  $("#recommendation-count").textContent = `${recommendations.length} TRACKS`;
  $("#recommendation-list").innerHTML = recommendations.map((item, index) => `<article class="recommendation-item" data-track-id="${escapeHTML(item.track.id)}" tabindex="0" role="button"><span class="rec-rank">0${index + 1}</span>${coverMarkup(item.track)}<div><span class="song-name">${escapeHTML(trackName(item.track))}</span><span class="song-artist">${escapeHTML(trackArtist(item.track))}</span></div><span class="similarity">${(item.similarity * 100).toFixed(1)}%</span></article>`).join("") || `<div class="empty-state">추천할 곡을 찾지 못했어요.</div>`;
  $("#playlist-count").textContent = `${state.activePlaylist.length} TRACKS`;
  $("#playlist-subtitle").textContent = `${trackName(track)}에서 시작하는 믹스`;
  $("#playlist-list").innerHTML = state.activePlaylist.map((item, index) => `<article class="playlist-item ${index === 0 ? "is-seed" : ""}" data-track-id="${escapeHTML(item.id)}" tabindex="0" role="button"><span class="playlist-number">${String(index + 1).padStart(2, "0")}</span>${coverMarkup(item)}<div><span class="song-name">${escapeHTML(trackName(item))}</span><span class="song-artist">${escapeHTML(trackArtist(item))}</span></div><span class="playlist-play">${index === 0 ? "♫" : "▶"}</span></article>`).join("");
}

function setSearchResults(query = "") {
  const cleanQuery = query.trim().toLocaleLowerCase();
  state.searchText = cleanQuery;
  state.currentResultPage = 0;
  if (!cleanQuery) {
    state.currentResults = state.sortedTracks.slice(0, 100);
    $("#result-label").textContent = "인기곡 100";
  } else {
    state.currentResults = state.sortedTracks.filter((track) =>
      `${track.title} ${track.artist} ${track.album}`.toLocaleLowerCase().includes(cleanQuery)
    );
    $("#result-label").textContent = `검색 결과 ${fmt.format(state.currentResults.length)}곡`;
  }
  renderTrackList();
}

function renderTrackList() {
  const begin = state.currentResultPage * PAGE_SIZE;
  const pageTracks = state.currentResults.slice(begin, begin + PAGE_SIZE);
  const rankOffset = state.searchText ? begin : begin + 1;
  $("#track-list").innerHTML = pageTracks.length
    ? pageTracks.map((track, index) => createTrackRow(track, state.searchText ? "—" : rankOffset + index)).join("")
    : `<div class="empty-state">검색 결과가 없어요. 곡 제목이나 아티스트 이름을 확인해보세요.</div>`;
  const pageCount = Math.ceil(state.currentResults.length / PAGE_SIZE);
  const current = state.currentResultPage;
  const start = Math.max(0, Math.min(current - 2, pageCount - 5));
  const end = Math.min(pageCount, Math.max(5, start + 5));
  $("#pagination").innerHTML = pageCount <= 1 ? "" : `<button class="page-button" data-page-number="${current - 1}" ${current === 0 ? "disabled" : ""}>‹</button>${Array.from({ length: end - start }, (_, i) => start + i).map((page) => `<button class="page-button ${page === current ? "is-current" : ""}" data-page-number="${page}">${page + 1}</button>`).join("")}<button class="page-button" data-page-number="${current + 1}" ${current >= pageCount - 1 ? "disabled" : ""}>›</button>`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-shown");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-shown"), 2200);
}

async function copyPlaylist() {
  const text = state.activePlaylist.map((track, index) => `${index + 1}. ${trackName(track)} — ${trackArtist(track)}`).join("\n");
  try {
    await navigator.clipboard.writeText(text);
    showToast("플레이리스트 목록을 복사했어요.");
  } catch {
    showToast("브라우저에서 복사를 허용하지 않았어요.");
  }
}

function selectTrack(trackId) {
  state.selectedTrackId = String(trackId);
  openPage("track");
}

function wireInteractions() {
  $$('[data-page]').forEach((button) => button.addEventListener("click", () => openPage(button.dataset.page)));
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => openPage(button.dataset.go)));
  $(".text-link").addEventListener("click", (event) => {
    event.preventDefault();
    if (state.currentPage !== "overview") openPage("overview");
    window.setTimeout(() => $("#analysis").scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  });
  $("#track-search").addEventListener("input", (event) => setSearchResults(event.target.value));
  $("#track-search").addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.currentTarget.value = ""; setSearchResults(""); }
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault(); openPage("top100"); $("#track-search").focus();
    }
  });
  $("#track-list").addEventListener("click", (event) => {
    const row = event.target.closest("[data-track-id]");
    if (row) selectTrack(row.dataset.trackId);
  });
  $("#track-list").addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-track-id]")) {
      event.preventDefault(); selectTrack(event.target.dataset.trackId);
    }
  });
  $("#recommendation-list").addEventListener("click", (event) => {
    const row = event.target.closest("[data-track-id]");
    if (row) selectTrack(row.dataset.trackId);
  });
  $("#playlist-list").addEventListener("click", (event) => {
    const row = event.target.closest("[data-track-id]");
    if (row) selectTrack(row.dataset.trackId);
  });
  [$("#recommendation-list"), $("#playlist-list")].forEach((list) => list.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-track-id]")) {
      event.preventDefault(); selectTrack(event.target.dataset.trackId);
    }
  }));
  $("#pagination").addEventListener("click", (event) => {
    const button = event.target.closest("[data-page-number]");
    if (!button || button.disabled) return;
    const page = Number(button.dataset.pageNumber);
    if (page < 0 || page >= Math.ceil(state.currentResults.length / PAGE_SIZE)) return;
    state.currentResultPage = page;
    renderTrackList();
    $("#track-list").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#copy-playlist").addEventListener("click", copyPlaylist);
  window.addEventListener("popstate", applyRouteFromHash);
  window.addEventListener("hashchange", applyRouteFromHash);
}

function applyRouteFromHash() {
  const [page, trackId] = decodeURIComponent(location.hash.slice(1)).split("/");
  if (page === "track" && trackId && state.indexById.has(trackId)) {
    state.selectedTrackId = trackId;
    openPage("track", { replace: true });
  } else if (page === "analysis") {
    openPage("overview", { replace: true });
    window.setTimeout(() => $("#analysis").scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  } else if (["overview", "top100"].includes(page)) {
    openPage(page, { replace: true });
  } else {
    openPage("overview", { replace: true });
  }
}

async function init() {
  wireInteractions();
  try {
    const response = await fetch(DATASET_URL);
    if (!response.ok) throw new Error(`데이터 파일 요청 실패 (${response.status})`);
    const text = await response.text();
    buildTrackData(text);
    if (!state.tracks.length) throw new Error("전처리 후 사용할 곡이 없습니다.");
    renderOverviewCharts();
    setSearchResults("");
    setDatasetStatus(`${fmt.format(state.tracks.length)}곡 로드 완료`, "ready");
    applyRouteFromHash();
  } catch (error) {
    console.error(error);
    setDatasetStatus("데이터를 불러오지 못했어요", "error");
    $("#track-list").innerHTML = `<div class="empty-state">${escapeHTML(error.message)}<br /><br />project2 폴더에서 로컬 웹 서버를 실행했는지 확인해주세요.</div>`;
    $("#popularity-chart").innerHTML = `<div class="empty-state">데이터 로드 후 표시됩니다.</div>`;
    $("#feature-chart").innerHTML = `<div class="empty-state">데이터 로드 후 표시됩니다.</div>`;
  }
}

init();
