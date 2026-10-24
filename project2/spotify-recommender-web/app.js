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
const LOCAL_TRACK_NOTE = "test2 전체 데이터 또는 test3 K-pop 데이터의 최종 K-Means 군집 안에서 코사인 유사도가 높은 곡을 추천해요. 유사도는 표준화된 오디오 특성과 key·박자 값의 수치적 가까움이며, 사람이 느끼는 장르·분위기 유사도와 다를 수 있습니다.";

const state = {
  tracks: [], allTracks: [], tracksByGenre: new Map(), clusterLabels: new Map(), sortedTracks: [], normalizedFeatures: null, featureSize: 0,
  featureStats: [], modeValues: [], keyValues: [], signatureValues: [],
  indexById: new Map(), currentPage: "overview", selectedTrackId: null,
  currentResults: [], currentResultPage: 0, activePlaylist: [], artistPlaylist: [], searchText: "", genreFilter: "all",
  excludeExplicit: false, recognizedTrack: null
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

function parseClusterLabels(text, scopeName) {
  const labels = new Map();
  let columnIndex;
  parseCSV(text, (headers, row) => {
    columnIndex ??= Object.fromEntries(headers.map((header, index) => [header, index]));
    const trackId = (row[columnIndex.track_id] ?? "").trim();
    const cluster = Number((row[columnIndex.cluster] ?? "").trim());
    if (!trackId || !Number.isInteger(cluster)) return;
    labels.set(trackId, cluster);
  });
  if (!labels.size) throw new Error(`${scopeName} 군집 결과 파일이 비어 있거나 형식이 올바르지 않아요.`);
  return labels;
}

function parseTrack(at, row, sourceIndex) {
  const value = (key) => (row[at[key]] ?? "").trim();
  const number = (key) => {
    const raw = value(key);
    return raw === "" ? Number.NaN : Number(raw);
  };
  const track = {
    id: value("track_id"), title: value("track_name"), artist: value("artists"),
    album: value("album_name"), genre: value("track_genre").toLocaleLowerCase(),
    explicit: value("explicit").toLocaleLowerCase() === "true", popularity: number("popularity"),
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
  const byGenreAndId = new Map();
  const addPopularityObservation = (map, key, track) => {
    const aggregate = map.get(key);
    if (aggregate) {
      aggregate.popularityTotal += track.popularity;
      aggregate.count += 1;
      if (track.popularity > aggregate.track.popularity) aggregate.track = track;
    } else {
      map.set(key, { track, popularityTotal: track.popularity, count: 1 });
    }
  };
  const averagedTracks = (map) => [...map.values()].map(({ track, popularityTotal, count }) => ({
    ...track,
    popularity: popularityTotal / count,
  }));
  let sourceIndex = 0;
  let columnIndex;
  parseCSV(rawText, (headers, row) => {
    columnIndex ??= Object.fromEntries(headers.map((header, i) => [header, i]));
    const track = parseTrack(columnIndex, row, sourceIndex++);
    if (!track) return;
    addPopularityObservation(byId, track.id, track);
    const genreTrackKey = `${track.genre}\u0000${track.id}`;
    addPopularityObservation(byGenreAndId, genreTrackKey, track);
  });

  // Match notebook cleaning: keep one feature/metadata row per ID and average
  // popularity across duplicate rows before excluding invalid audio records.
  state.allTracks = averagedTracks(byId).filter((track) => track.tempo > 0 && track.time_signature > 0);
  state.allTracks.sort((a, b) => a.sourceIndex - b.sourceIndex);

  // Keep genre-scoped deduplicated rows so a track's K-pop label is not hidden
  // when that same track has a more popular row under another genre label.
  state.tracksByGenre = new Map();
  for (const track of averagedTracks(byGenreAndId)) {
    if (track.tempo <= 0 || track.time_signature <= 0) continue;
    if (!state.tracksByGenre.has(track.genre)) state.tracksByGenre.set(track.genre, []);
    state.tracksByGenre.get(track.genre).push(track);
  }
  for (const tracks of state.tracksByGenre.values()) {
    tracks.sort((a, b) => a.sourceIndex - b.sourceIndex);
  }

  applyTrackScope();
}

function applyTrackScope() {
  const sourceTracks = state.genreFilter === "k-pop"
    ? (state.tracksByGenre.get("k-pop") || [])
    : state.allTracks;
  const labels = state.clusterLabels.get(state.genreFilter);
  const modelTracks = sourceTracks
    .filter((track) => labels?.has(track.id))
    .map((track) => ({ ...track, cluster: labels.get(track.id) }));
  // The explicit toggle only removes recommendation candidates; retain the
  // notebook's full-scope scaling statistics and one-hot feature space.
  state.tracks = state.excludeExplicit
    ? modelTracks.filter((track) => !track.explicit)
    : modelTracks;
  state.indexById = new Map();
  state.tracks.forEach((track, index) => state.indexById.set(track.id, index));
  state.sortedTracks = [...state.tracks].sort((a, b) =>
    (b.popularity - a.popularity) || a.title.localeCompare(b.title, "ko") || (a.sourceIndex - b.sourceIndex)
  );

  const modeValues = [...new Set(modelTracks.map((track) => track.mode))].sort((a, b) => a - b);
  const keyValues = [...new Set(modelTracks.map((track) => track.key))].sort((a, b) => a - b);
  const signatureValues = [...new Set(modelTracks.map((track) => track.time_signature))].sort((a, b) => a - b);
  const stats = CONTINUOUS_COLUMNS.map((column) => {
    let sum = 0;
    for (const track of modelTracks) sum += track[column];
    const mean = sum / modelTracks.length;
    let variance = 0;
    for (const track of modelTracks) variance += (track[column] - mean) ** 2;
    const scale = Math.sqrt(variance / modelTracks.length) || 1;
    return { mean, scale };
  });

  state.featureStats = stats;
  state.modeValues = modeValues;
  state.keyValues = keyValues;
  state.signatureValues = signatureValues;
  state.featureSize = CONTINUOUS_COLUMNS.length + modeValues.length + keyValues.length + signatureValues.length;
  state.normalizedFeatures = new Float32Array(state.tracks.length * state.featureSize);
  state.tracks.forEach((track, index) => {
    const offset = index * state.featureSize;
    let cursor = 0;
    for (let col = 0; col < CONTINUOUS_COLUMNS.length; col += 1) {
      const column = CONTINUOUS_COLUMNS[col];
      state.normalizedFeatures[offset + cursor] = (track[column] - stats[col].mean) / stats[col].scale;
      cursor += 1;
    }
    for (const mode of modeValues) state.normalizedFeatures[offset + cursor++] = Number(track.mode === mode);
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

function setGenreFilter(filter) {
  if (!state.allTracks.length || !["all", "k-pop"].includes(filter)) return;
  if (filter === state.genreFilter) return;
  state.genreFilter = filter;
  $$('[data-genre-filter]').forEach((button) => {
    const selected = button.dataset.genreFilter === filter;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  applyTrackScope();
  renderOverviewCharts();
  setSearchResults($("#track-search").value);
  const scopeLabel = filter === "k-pop" ? "K-pop" : "전체 데이터";
  const status = `${scopeLabel} ${fmt.format(state.tracks.length)}곡 표시${state.excludeExplicit ? " · 선정성 제외" : ""}`;
  setDatasetStatus(status, "ready");
}

function setExplicitFilter(exclude) {
  if (!state.allTracks.length || exclude === state.excludeExplicit) return;
  state.excludeExplicit = exclude;
  $$('[data-explicit-filter]').forEach((button) => {
    button.classList.toggle("is-on", exclude);
    button.setAttribute("aria-pressed", String(exclude));
    button.textContent = exclude ? "선정성 제외 중 ✓" : "선정성 제외";
  });
  applyTrackScope();
  renderOverviewCharts();
  setSearchResults($("#track-search").value);
  const scopeLabel = state.genreFilter === "k-pop" ? "K-pop" : "전체 데이터";
  setDatasetStatus(`${scopeLabel} ${fmt.format(state.tracks.length)}곡 표시${exclude ? " · 선정성 제외" : ""}`, "ready");
}

function hueFor(track) {
  let hash = 0;
  const text = `${track.id}${track.title}`;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return (Math.abs(hash) % 360) + "deg";
}

function coverMarkup(track, large = false) {
  const sizeClass = large ? "selected-cover" : "cover-art";
  const spotifyId = track.spotifyId || track.id;
  return `<div class="${sizeClass}" data-spotify-cover="${escapeHTML(spotifyId || "")}" style="--cover-hue:${hueFor(track)}" aria-hidden="true"><span class="${large ? "cover-label" : "cover-glyph"}">${large ? "♫" : "♪"}</span></div>`;
}

function loadSpotifyCovers(root = document) {
  const coverElements = root.querySelectorAll("[data-spotify-cover]");
  coverElements.forEach((element) => {
    if (element.dataset.coverLoaded === "true") return;
    element.dataset.coverLoaded = "true";
    const spotifyId = element.dataset.spotifyCover;
    const image = document.createElement("img");
    image.className = "cover-image";
    image.alt = "";
    image.loading = element.classList.contains("selected-cover") ? "eager" : "lazy";
    image.decoding = "async";
    image.addEventListener("load", () => element.classList.add("has-cover"), { once: true });
    image.addEventListener("error", () => {
      element.classList.remove("has-cover");
      image.remove();
    }, { once: true });
    image.src = `/api/spotify-cover/${encodeURIComponent(spotifyId)}`;
    element.prepend(image);
  });
}

function trackName(track) { return track.title || "곡 정보 없음"; }
function trackArtist(track) { return track.artist || "아티스트 정보 없음"; }
function formatPopularity(value) {
  const rounded = Number(value.toFixed(1));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function createTrackRow(track, rank, showPopularity = true) {
  const popularity = Number(track.popularity.toFixed(1));
  return `<article class="track-row" data-track-id="${escapeHTML(track.id)}" tabindex="0" role="button" aria-label="${escapeHTML(trackName(track))} — ${escapeHTML(trackArtist(track))} 상세 보기">
    <span class="track-rank">${rank}</span>${coverMarkup(track)}
    <div class="song-main"><span class="song-name">${escapeHTML(trackName(track))}</span><span class="song-artist">${escapeHTML(trackArtist(track))}</span></div>
    <div class="song-album">${escapeHTML(track.album || "앨범 정보 없음")}</div>
    <div class="popularity-cell">${showPopularity ? `<span class="popularity-value">${formatPopularity(track.popularity)}<span style="color:#b3b9c4"> / 100</span></span><div class="popularity-track"><div class="popularity-fill" style="width:${Math.max(0, Math.min(100, popularity))}%"></div></div>` : `<span class="similarity">곡 상세 보기</span>`}</div>
    <span class="row-open">곡 선택 <span>→</span></span>
  </article>`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function renderOverviewCharts() {
  const isKpop = state.genreFilter === "k-pop";
  const clusterLabels = state.clusterLabels.get(state.genreFilter) || new Map();
  const scopeDescription = isKpop
    ? "test3의 K-pop 장르 라벨 데이터 분포와 오디오 특성 평균입니다. popularity는 예측값이 아닌 실제 점수입니다."
    : "test2 전체 데이터의 분포와 오디오 특성 평균입니다. popularity는 예측값이 아닌 실제 점수입니다.";
  $("#overview-scope-description").textContent = state.excludeExplicit
    ? `${scopeDescription} 선정성 곡 제외 필터 적용 중입니다.`
    : scopeDescription;
  $("#stat-cluster-label").textContent = isKpop ? "test3 최종 군집" : "test2 최종 군집";
  const clusterCounts = new Map();
  for (const cluster of clusterLabels.values()) clusterCounts.set(cluster, (clusterCounts.get(cluster) || 0) + 1);
  const maxClusterCount = Math.max(1, ...clusterCounts.values());
  $("#stat-cluster-choice").textContent = `K-Means · K=${clusterCounts.size}`;
  $("#cluster-chart-summary").textContent = `${isKpop ? "test3 K-pop" : "test2 전체"} · K=${clusterCounts.size}`;
  $("#cluster-chart").innerHTML = [...clusterCounts.entries()].sort((a, b) => a[0] - b[0]).map(([cluster, count]) => {
    const percent = (count / clusterLabels.size) * 100;
    const width = (count / maxClusterCount) * 100;
    return `<div class="cluster-row" title="군집 ${cluster}: ${fmt.format(count)}곡 (${percent.toFixed(1)}%)"><div class="cluster-row-label"><b>군집 ${cluster}</b><span>${fmt.format(count)}곡 · ${percent.toFixed(1)}%</span></div><div class="cluster-track"><div class="cluster-fill" style="width:${width.toFixed(2)}%"></div></div></div>`;
  }).join("");

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
  if (page === "top100") loadSpotifyCovers($("#track-list"));
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
    if (candidate.cluster !== track.cluster) continue;
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

function profileVector(track, profile) {
  const vector = new Float64Array(state.featureSize);
  let cursor = 0;
  for (let index = 0; index < CONTINUOUS_COLUMNS.length; index += 1) {
    const column = CONTINUOUS_COLUMNS[index];
    const value = Number.isFinite(profile[column]) ? profile[column] : track[column];
    vector[cursor++] = (value - state.featureStats[index].mean) / state.featureStats[index].scale;
  }
  for (const mode of state.modeValues) vector[cursor++] = Number(track.mode === mode);
  for (const key of state.keyValues) vector[cursor++] = Number(track.key === key);
  const signature = Number.isFinite(profile.time_signature) ? profile.time_signature : track.time_signature;
  for (const value of state.signatureValues) vector[cursor++] = Number(signature === value);
  let norm = 0;
  for (const value of vector) norm += value ** 2;
  norm = Math.sqrt(norm) || 1;
  for (let index = 0; index < vector.length; index += 1) vector[index] /= norm;
  return vector;
}

function recommendForProfile(track, profile, count = RECOMMENDATION_COUNT) {
  const target = profileVector(track, profile);
  const seedIndex = state.indexById.get(track.id);
  const seen = new Set([`${trackName(track).toLocaleLowerCase()}\u0000${trackArtist(track).toLocaleLowerCase()}`]);
  const best = [];
  for (let index = 0; index < state.tracks.length; index += 1) {
    if (index === seedIndex) continue;
    const candidate = state.tracks[index];
    if (candidate.cluster !== track.cluster) continue;
    const title = trackName(candidate);
    const artist = trackArtist(candidate);
    if (!candidate.title || !candidate.artist) continue;
    const identity = `${title.toLocaleLowerCase()}\u0000${artist.toLocaleLowerCase()}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    const offset = index * state.featureSize;
    let similarity = 0;
    for (let col = 0; col < state.featureSize; col += 1) similarity += target[col] * state.normalizedFeatures[offset + col];
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

const PROFILE_CONTROLS = [
  ["tempo", "템포", "BPM"],
  ["loudness", "음량감", "dB"],
  ["danceability", "춤추기 좋은 정도", ""],
  ["valence", "밝은 분위기", ""]
];

function profileFromControls() {
  const profile = {};
  for (const [column] of PROFILE_CONTROLS) {
    profile[column] = Number($(`[data-profile-feature="${column}"]`).value);
  }
  profile.time_signature = Number($('[data-profile-feature="time_signature"]').value);
  return profile;
}

function renderSoundProfileControls(track) {
  const tempo = $('[data-profile-feature="tempo"]');
  tempo.min = String(Math.min(40, Math.floor(track.tempo)));
  tempo.max = String(Math.max(240, Math.ceil(track.tempo)));
  tempo.value = String(track.tempo);
  const loudness = $('[data-profile-feature="loudness"]');
  loudness.min = String(Math.min(-60, Math.floor(track.loudness)));
  loudness.max = String(Math.max(0, Math.ceil(track.loudness)));
  loudness.value = String(track.loudness);
  for (const [column] of PROFILE_CONTROLS.slice(2)) {
    $(`[data-profile-feature="${column}"]`).value = String(track[column]);
  }
  const signature = $('[data-profile-feature="time_signature"]');
  signature.innerHTML = state.signatureValues.map((value) => `<option value="${value}">${value}박자</option>`).join("");
  signature.value = String(track.time_signature);
  updateProfileControlValues();
  updateProfileRecommendations(track);
}

function updateProfileControlValues() {
  const tempo = Number($('[data-profile-feature="tempo"]').value);
  const loudness = Number($('[data-profile-feature="loudness"]').value);
  const danceability = Number($('[data-profile-feature="danceability"]').value);
  const valence = Number($('[data-profile-feature="valence"]').value);
  const signature = Number($('[data-profile-feature="time_signature"]').value);
  $("#profile-tempo-value").textContent = `${tempo.toFixed(tempo % 1 ? 1 : 0)} BPM`;
  $("#profile-loudness-value").textContent = `${loudness.toFixed(1)} dB`;
  $("#profile-danceability-value").textContent = danceability.toFixed(2);
  $("#profile-valence-value").textContent = valence.toFixed(2);
  $("#profile-time-signature-value").textContent = `${signature}박자`;
}

function profileChangeLabels(track, profile) {
  const changes = [];
  for (const [column, label, unit] of PROFILE_CONTROLS) {
    const difference = profile[column] - track[column];
    if (Math.abs(difference) < 0.0005) continue;
    const sign = difference > 0 ? "+" : "−";
    const amount = column === "tempo" ? Math.abs(difference).toFixed(0) : Math.abs(difference).toFixed(2);
    changes.push(`${label} ${sign}${amount}${unit ? ` ${unit}` : ""}`);
  }
  if (profile.time_signature !== track.time_signature) changes.push(`박자 ${profile.time_signature}박자로 변경`);
  return changes;
}

function updateProfileRecommendations(track = state.tracks[state.indexById.get(state.selectedTrackId)]) {
  if (!track) return;
  const profile = profileFromControls();
  const changes = profileChangeLabels(track, profile);
  const recommendations = recommendForProfile(track, profile, RECOMMENDATION_COUNT);
  const scopeName = state.genreFilter === "k-pop" ? "test3 K-pop" : "test2 전체 데이터";
  $("#recommendation-count").textContent = `${recommendations.length} TRACKS`;
  $("#recommendation-context").textContent = changes.length
    ? `${scopeName} · K-Means ${track.cluster}군집 안에서 추천 · ${changes.join(" · ")} · 나머지는 원곡 특성 유지`
    : `${scopeName} · K-Means ${track.cluster}군집 안에서 코사인 유사도가 높은 곡`;
  $("#recommendation-list").innerHTML = recommendations.map((item, index) => `<article class="recommendation-item" data-track-id="${escapeHTML(item.track.id)}" tabindex="0" role="button"><span class="rec-rank">0${index + 1}</span>${coverMarkup(item.track)}<div><span class="song-name">${escapeHTML(trackName(item.track))}</span><span class="song-artist">${escapeHTML(trackArtist(item.track))}</span></div><span class="similarity">${(item.similarity * 100).toFixed(1)}%</span></article>`).join("") || `<div class="empty-state">추천할 곡을 찾지 못했어요.</div>`;
  $("#sound-profile-summary").textContent = changes.length
    ? `군집 ${track.cluster} 안에서 조절한 사운드 특성에 가까운 곡을 표시 중 · ${recommendations.length}곡 찾음`
    : "슬라이더를 움직이면 같은 K-Means 군집 안에서 추천이 갱신돼요. 실제 음원을 편집하지는 않습니다.";
  loadSpotifyCovers($("#recommendation-list"));
}

function recommendArtistTracks(track, count = PLAYLIST_SIZE) {
  const artistNames = new Set(String(track.artist || "").split(/\s*[;,]\s*/).map((name) => name.trim().toLocaleLowerCase()).filter(Boolean));
  const matches = state.tracks
    .filter((candidate) => candidate.id !== track.id && String(candidate.artist || "").split(/\s*[;,]\s*/)
      .some((name) => artistNames.has(name.trim().toLocaleLowerCase())))
    .sort((a, b) => (b.popularity - a.popularity) || a.title.localeCompare(b.title, "ko"));
  const seen = new Set([`${trackName(track).toLocaleLowerCase()}\u0000${trackArtist(track).toLocaleLowerCase()}`]);
  const playlist = [track];
  for (const candidate of matches) {
    const identity = `${trackName(candidate).toLocaleLowerCase()}\u0000${trackArtist(candidate).toLocaleLowerCase()}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    playlist.push(candidate);
    if (playlist.length >= count) break;
  }
  return playlist.slice(0, count);
}

function setPlaylistListExpanded(listId, expanded) {
  const list = $(`#${listId}`);
  const button = $(`[data-collapse-target="${listId}"]`);
  if (!list || !button) return;
  list.hidden = !expanded;
  button.setAttribute("aria-expanded", String(expanded));
  button.textContent = expanded ? "접기 −" : "펼치기 +";
}

function renderTrackPage(trackId) {
  const index = state.indexById.get(String(trackId));
  if (index === undefined) {
    if (state.recognizedTrack?.id === String(trackId)) {
      renderRecognizedTrackPage(state.recognizedTrack);
      return;
    }
    $("#selected-song").innerHTML = `<div class="empty-state">선택한 곡을 찾지 못했어요. 차트에서 다른 곡을 골라주세요.</div>`;
    return;
  }
  state.recognizedTrack = null;
  $("#sound-profile-panel").hidden = false;
  const track = state.tracks[index];
  const playlistExtras = recommend(track, PLAYLIST_SIZE - 1);
  state.activePlaylist = [track, ...playlistExtras.map((item) => item.track)];
  state.artistPlaylist = recommendArtistTracks(track);
  const minutes = Math.floor(track.duration_ms / 60000);
  const seconds = String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, "0");
  const scopeName = state.genreFilter === "k-pop" ? "TEST3 K-POP" : "TEST2 전체";
  $("#selected-song").innerHTML = `${coverMarkup(track, true)}<div class="selected-info"><span class="panel-kicker">${scopeName} · K-MEANS 군집 ${track.cluster} · 평균 인기도 ${formatPopularity(track.popularity)}</span><h1 id="track-title">${escapeHTML(trackName(track))}</h1><p class="selected-artist">${escapeHTML(trackArtist(track))}</p><p class="selected-album">${escapeHTML(track.album || "앨범 정보 없음")}</p><div class="selected-stats"><div class="selected-stat"><span>길이</span><b>${minutes}:${seconds}</b></div><div class="selected-stat"><span>Tempo</span><b>${track.tempo.toFixed(0)} BPM</b></div><div class="selected-stat"><span>Energy</span><b>${track.energy.toFixed(2)}</b></div><div class="selected-stat"><span>Danceability</span><b>${track.danceability.toFixed(2)}</b></div></div></div><a class="spotify-link" href="https://open.spotify.com/track/${encodeURIComponent(track.id)}" target="_blank" rel="noreferrer">Spotify에서 열기 <span>↗</span></a>`;
  const spotifyEmbedUrl = `https://open.spotify.com/embed/track/${encodeURIComponent(track.id)}?utm_source=generator`;
  $("#spotify-embed").innerHTML = `<iframe class="spotify-player" title="${escapeHTML(trackName(track))} — Spotify 플레이어" src="${spotifyEmbedUrl}" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
  renderSoundProfileControls(track);
  $("#playlist-count").textContent = `${state.activePlaylist.length} TRACKS`;
  $("#playlist-subtitle").textContent = `${trackName(track)}에서 시작하는 믹스`;
  $("#playlist-list").innerHTML = state.activePlaylist.map((item, index) => `<article class="playlist-item ${index === 0 ? "is-seed" : ""}" data-track-id="${escapeHTML(item.id)}" tabindex="0" role="button"><span class="playlist-number">${String(index + 1).padStart(2, "0")}</span>${coverMarkup(item)}<div><span class="song-name">${escapeHTML(trackName(item))}</span><span class="song-artist">${escapeHTML(trackArtist(item))}</span></div><span class="playlist-play">${index === 0 ? "♫" : "▶"}</span></article>`).join("");
  $("#artist-playlist-count").textContent = `${state.artistPlaylist.length} TRACKS`;
  $("#artist-playlist-subtitle").textContent = `${trackArtist(track)} · 선택곡부터, 나머지는 인기순`;
  $("#artist-playlist-list").innerHTML = state.artistPlaylist.map((item, index) => `<article class="playlist-item ${index === 0 ? "is-seed" : ""}" data-track-id="${escapeHTML(item.id)}" tabindex="0" role="button"><span class="playlist-number">${String(index + 1).padStart(2, "0")}</span>${coverMarkup(item)}<div><span class="song-name">${escapeHTML(trackName(item))}</span><span class="song-artist">${escapeHTML(trackArtist(item))}</span></div><span class="playlist-play">${index === 0 ? "♫" : "▶"}</span></article>`).join("") || `<div class="empty-state">이 범위에서 같은 아티스트의 곡을 찾지 못했어요.</div>`;
  $("#copy-artist-playlist").disabled = state.artistPlaylist.length === 0;
  setPlaylistListExpanded("artist-playlist-list", true);
  setPlaylistListExpanded("playlist-list", true);
  $("#copy-playlist").disabled = false;
  $(".detail-footnote p").textContent = LOCAL_TRACK_NOTE;
  loadSpotifyCovers($("#selected-song"));
  loadSpotifyCovers($("#recommendation-list"));
  loadSpotifyCovers($("#artist-playlist-list"));
  loadSpotifyCovers($("#playlist-list"));
}

function renderRecognizedTrackPage(track) {
  $("#sound-profile-panel").hidden = true;
  state.activePlaylist = [];
  state.artistPlaylist = [];
  const hasDuration = Number.isFinite(track.duration_ms) && track.duration_ms > 0;
  const minutes = hasDuration ? Math.floor(track.duration_ms / 60000) : null;
  const seconds = hasDuration ? String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, "0") : null;
  const score = Number.isFinite(track.score) ? `${(track.score <= 1 ? track.score * 100 : track.score).toFixed(1)}%` : "—";
  const spotifyLink = track.spotifyId
    ? `<a class="spotify-link" href="https://open.spotify.com/track/${encodeURIComponent(track.spotifyId)}" target="_blank" rel="noreferrer">Spotify에서 열기 <span>↗</span></a>`
    : "";
  const coverTrack = { id: track.spotifyId || track.id, title: track.title };
  const recommendationStatus = track.excludedByFilter ? "필터로 제외" : "미포함";
  $("#selected-song").innerHTML = `${coverMarkup(coverTrack, true)}<div class="selected-info"><span class="panel-kicker">HUMMING RECOGNITION · ${score} MATCH</span><h1 id="track-title">${escapeHTML(track.title)}</h1><p class="selected-artist">${escapeHTML(track.artist)}</p><p class="selected-album">${escapeHTML(track.album || "앨범 정보 없음")}</p><div class="selected-stats"><div class="selected-stat"><span>인식 일치도</span><b>${score}</b></div><div class="selected-stat"><span>길이</span><b>${hasDuration ? `${minutes}:${seconds}` : "정보 없음"}</b></div><div class="selected-stat"><span>추천 데이터</span><b>${recommendationStatus}</b></div></div></div>${spotifyLink}`;
  $("#spotify-embed").innerHTML = track.spotifyId
    ? `<iframe class="spotify-player" title="${escapeHTML(track.title)} — Spotify 플레이어" src="https://open.spotify.com/embed/track/${encodeURIComponent(track.spotifyId)}?utm_source=generator" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    : `<div class="empty-state">Spotify 곡 ID를 받지 못해 임베드 플레이어를 표시할 수 없어요.</div>`;
  $("#recommendation-count").textContent = "0 TRACKS";
  $("#recommendation-list").innerHTML = track.excludedByFilter
    ? `<div class="empty-state">선정성 제외가 켜져 있어 이 곡과 선정성 곡을 추천 후보에서 제외했어요.</div>`
    : `<div class="empty-state">이 곡은 현재 분석 데이터에 없어 오디오 특성 기반 추천을 만들 수 없어요.</div>`;
  $("#playlist-count").textContent = "0 TRACKS";
  $("#playlist-subtitle").textContent = "분석 데이터에 곡이 없어요";
  $("#playlist-list").innerHTML = `<div class="empty-state">데이터에 곡이 포함되면 이어 듣기 목록을 만들 수 있어요.</div>`;
  $("#artist-playlist-count").textContent = "0 TRACKS";
  $("#artist-playlist-subtitle").textContent = "추천 데이터에서 아티스트 곡을 찾지 못했어요";
  $("#artist-playlist-list").innerHTML = `<div class="empty-state">이 곡은 분석 데이터에 없어 아티스트 플레이리스트를 만들 수 없어요.</div>`;
  $("#copy-artist-playlist").disabled = true;
  setPlaylistListExpanded("artist-playlist-list", false);
  setPlaylistListExpanded("playlist-list", false);
  $("#copy-playlist").disabled = true;
  $(".detail-footnote p").textContent = track.excludedByFilter
    ? "이 곡은 데이터셋에서 찾았지만 선정성 곡 제외 설정이 켜져 있어 추천 및 플레이리스트 후보에서 제외했어요. 필터를 끄면 전체 추천을 볼 수 있습니다."
    : "ACRCloud가 곡을 인식했지만 현재 SORINA 분석 데이터에서 찾지 못했어요. 이 페이지에서는 곡 정보와 Spotify 연결만 제공하고, 오디오 특성 기반 추천은 생략합니다.";
  loadSpotifyCovers($("#selected-song"));
}

function setSearchResults(query = "") {
  const cleanQuery = query.trim().toLocaleLowerCase();
  state.searchText = cleanQuery;
  state.currentResultPage = 0;
  const scopeLabel = `${state.genreFilter === "k-pop" ? "test3 K-pop 인기곡" : "test2 전체 인기곡"}${state.excludeExplicit ? " · 선정성 제외" : ""}`;
  if (!cleanQuery) {
    state.currentResults = state.sortedTracks.slice(0, 100);
    $("#result-label").textContent = `${scopeLabel} 100`;
  } else {
    state.currentResults = state.sortedTracks.filter((track) =>
      `${track.title} ${track.artist} ${track.album}`.toLocaleLowerCase().includes(cleanQuery)
    );
    $("#result-label").textContent = `${scopeLabel} 검색 결과 ${fmt.format(state.currentResults.length)}곡`;
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
  if (state.currentPage === "top100") loadSpotifyCovers($("#track-list"));
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-shown");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-shown"), 2200);
}

function downsampleAudio(input, inputRate, outputRate) {
  if (inputRate === outputRate) return input;
  const ratio = inputRate / outputRate;
  const output = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < output.length; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += input[j];
    output[i] = sum / Math.max(1, end - start);
  }
  return output;
}

function encodeWav(chunks, sourceRate) {
  const totalSamples = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(totalSamples);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
  const sampleRate = 16000;
  const samples = downsampleAudio(merged, sourceRate, sampleRate);
  const wav = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(wav);
  const writeText = (position, value) => [...value].forEach((character, index) => view.setUint8(position + index, character.charCodeAt(0)));
  writeText(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, value < 0 ? value * 0x8000 : value * 0x7fff, true);
  }
  return new Blob([wav], { type: "audio/wav" });
}

async function captureHumming(seconds, button) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("이 브라우저에서 마이크를 사용할 수 없어요. localhost 주소로 접속했는지 확인해주세요.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false }
  });
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error("이 브라우저는 오디오 녹음을 지원하지 않아요.");
  }

  let audioContext;
  let source;
  let processor;
  const chunks = [];
  try {
    try { audioContext = new AudioContextClass({ sampleRate: 16000 }); }
    catch { audioContext = new AudioContextClass(); }
    await audioContext.resume();
    source = audioContext.createMediaStreamSource(stream);
    processor = audioContext.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (event) => {
      chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      event.outputBuffer.getChannelData(0).fill(0);
    };
    source.connect(processor);
    processor.connect(audioContext.destination);
    for (let remaining = seconds; remaining > 0; remaining -= 1) {
      button.textContent = `🎙 녹음 중 · ${remaining}초`;
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
    }
    const sourceRate = audioContext.sampleRate;
    if (!chunks.length) throw new Error("녹음된 소리가 없어요. 마이크 권한과 입력 장치를 확인해주세요.");
    return encodeWav(chunks, sourceRate);
  } finally {
    if (processor) { processor.disconnect(); processor.onaudioprocess = null; }
    if (source) source.disconnect();
    stream.getTracks().forEach((track) => track.stop());
    if (audioContext && audioContext.state !== "closed") await audioContext.close();
  }
}

function findHummingTrack(candidate, spotifyId, tracks = state.tracks) {
  if (spotifyId) {
    const bySpotifyId = tracks.find((track) => track.id === spotifyId);
    if (bySpotifyId) return bySpotifyId;
  }
  const normalize = (value) => String(value || "").normalize("NFKD").toLocaleLowerCase().replace(/[^a-z0-9가-힣]/g, "");
  const title = normalize(candidate.title || candidate.track?.name);
  const artists = (candidate.artists || []).map((artist) => normalize(typeof artist === "string" ? artist : artist?.name)).filter(Boolean);
  if (!title) return null;
  return tracks.find((track) => normalize(track.title) === title
    && (!artists.length || artists.some((artist) => normalize(track.artist).includes(artist)))) || null;
}

function showHummingMatch(result) {
  const candidates = result.metadata?.humming || result.metadata?.music || [];
  if (!candidates.length) {
    const message = result.status?.msg && result.status.msg !== "Success"
      ? `곡을 찾지 못했어요 (${result.status.msg}). 멜로디를 더 또렷하고 길게 흥얼거려 다시 시도해보세요.`
      : "곡을 찾지 못했어요. 주변 소음을 줄이고 멜로디를 8~10초 정도 흥얼거려 다시 시도해보세요.";
    $("#humming-result").innerHTML = `<p class="humming-message">${escapeHTML(message)}</p>`;
    return;
  }

  const candidate = candidates[0];
  const title = candidate.title || candidate.track?.name || "제목 정보 없음";
  const artists = (candidate.artists || []).map((artist) => typeof artist === "string" ? artist : artist?.name).filter(Boolean).join(", ") || "아티스트 정보 없음";
  const spotifyId = candidate.external_metadata?.spotify?.track?.id || "";
  const match = findHummingTrack(candidate, spotifyId);
  const matchAnywhere = match || findHummingTrack(candidate, spotifyId, state.allTracks);
  const rawScore = Number.parseFloat(candidate.score);
  const score = Number.isFinite(rawScore) ? `${(rawScore <= 1 ? rawScore * 100 : rawScore).toFixed(1)}%` : "";
  state.recognizedTrack = {
    id: `recognized-${candidate.acrid || Date.now()}`,
    title,
    artist: artists,
    album: candidate.album?.name || "",
    duration_ms: Number.parseFloat(candidate.duration_ms),
    score: rawScore,
    spotifyId,
    candidate,
  };
  const spotifyLink = spotifyId
    ? `<a class="humming-spotify-link" href="https://open.spotify.com/track/${encodeURIComponent(spotifyId)}" target="_blank" rel="noreferrer">Spotify에서 확인 ↗</a>`
    : "";
  const actionText = match
    ? "클릭해서 SORINA 추천 보기 →"
    : matchAnywhere?.explicit && state.excludeExplicit
      ? "선정성 제외 설정으로 추천에서 제외 · 곡 상세 보기 →"
      : matchAnywhere ? "현재 필터 밖 곡 · 클릭하면 전체 데이터 추천 보기 →" : "클릭해서 곡 상세 화면 보기 →";
  $("#humming-result").innerHTML = `<div class="humming-match"><button class="humming-song-button" type="button" data-humming-select><strong>${escapeHTML(title)}${score ? ` <small>일치도 ${score}</small>` : ""}</strong><small>${escapeHTML(artists)}</small><span>${actionText}</span></button><div class="humming-match-actions">${spotifyLink}</div></div>`;
}

function openRecognizedTrack() {
  const recognized = state.recognizedTrack;
  if (!recognized) return;
  const matchAnywhere = findHummingTrack(recognized.candidate, recognized.spotifyId, state.allTracks);
  if (state.excludeExplicit && matchAnywhere?.explicit) {
    recognized.excludedByFilter = true;
    state.selectedTrackId = recognized.id;
    openPage("track");
    return;
  }
  delete recognized.excludedByFilter;
  const scopedMatch = findHummingTrack(recognized.candidate, recognized.spotifyId);
  if (scopedMatch) {
    selectTrack(scopedMatch.id);
    return;
  }
  if (matchAnywhere) {
    if (state.genreFilter === "k-pop") {
      setGenreFilter("all");
      showToast("K-pop 필터 밖 곡이라 전체 데이터에서 열었어요.");
    }
    selectTrack(matchAnywhere.id);
    return;
  }
  state.selectedTrackId = recognized.id;
  openPage("track");
}

async function handleHummingSearch() {
  const button = $("#humming-button");
  const resultArea = $("#humming-result");
  button.disabled = true;
  resultArea.innerHTML = `<p class="humming-message">마이크 권한을 허용한 뒤 10초 동안 멜로디를 흥얼거려주세요.</p>`;
  try {
    const audio = await captureHumming(10, button);
    button.textContent = "🎵 곡을 찾는 중…";
    resultArea.innerHTML = `<p class="humming-message">녹음한 소리를 ACRCloud에 보내 곡을 찾고 있어요.</p>`;
    const formData = new FormData();
    formData.append("sample", audio, "sorina-humming.wav");
    const response = await fetch("/api/recognize", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "곡 인식에 실패했어요.");
    showHummingMatch(data);
  } catch (error) {
    resultArea.innerHTML = `<p class="humming-message">${escapeHTML(error.message || "허밍 인식 중 문제가 생겼어요.")}</p>`;
  } finally {
    button.disabled = false;
    button.textContent = "🎙 허밍으로 곡 찾기";
  }
}

async function copyPlaylist(tracks = state.activePlaylist, playlistName = "플레이리스트") {
  const text = tracks.map((track, index) => `${index + 1}. ${trackName(track)} — ${trackArtist(track)}`).join("\n");
  try {
    await navigator.clipboard.writeText(text);
    showToast(`${playlistName} 목록을 복사했어요.`);
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
  $$('[data-genre-filter]').forEach((button) => button.addEventListener("click", () => {
    setGenreFilter(button.dataset.genreFilter);
  }));
  $$('[data-explicit-filter]').forEach((button) => button.addEventListener("click", () => {
    setExplicitFilter(!state.excludeExplicit);
  }));
  $$('[data-collapse-target]').forEach((button) => button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") !== "true";
    setPlaylistListExpanded(button.dataset.collapseTarget, expanded);
  }));
  $("#sound-profile-controls").addEventListener("input", updateProfileControlValues);
  $("#sound-profile-controls").addEventListener("change", () => {
    updateProfileControlValues();
    updateProfileRecommendations();
  });
  $("#profile-tempo-boost").addEventListener("click", () => {
    const tempo = $('[data-profile-feature="tempo"]');
    tempo.value = String(Math.min(Number(tempo.max), Number(tempo.value) + 10));
    updateProfileControlValues();
    updateProfileRecommendations();
  });
  $("#profile-reset").addEventListener("click", () => {
    const track = state.tracks[state.indexById.get(state.selectedTrackId)];
    if (track) renderSoundProfileControls(track);
  });
  $("#track-search").addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.currentTarget.value = ""; setSearchResults(""); }
  });
  $("#humming-button").addEventListener("click", handleHummingSearch);
  $("#humming-result").addEventListener("click", (event) => {
    if (event.target.closest("[data-humming-select]")) openRecognizedTrack();
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
  $("#artist-playlist-list").addEventListener("click", (event) => {
    const row = event.target.closest("[data-track-id]");
    if (row) selectTrack(row.dataset.trackId);
  });
  [$("#recommendation-list"), $("#playlist-list"), $("#artist-playlist-list")].forEach((list) => list.addEventListener("keydown", (event) => {
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
  $("#copy-playlist").addEventListener("click", () => copyPlaylist(state.activePlaylist, "비슷한 곡 플레이리스트"));
  $("#copy-artist-playlist").addEventListener("click", () => copyPlaylist(state.artistPlaylist, "아티스트 플레이리스트"));
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
    const [datasetResponse, test2Response, test3Response] = await Promise.all([
      fetch(DATASET_URL),
      fetch("/cluster-data/test2_clusters.csv"),
      fetch("/cluster-data/test3_clusters.csv"),
    ]);
    if (!datasetResponse.ok) throw new Error(`데이터 파일 요청 실패 (${datasetResponse.status})`);
    if (!test2Response.ok || !test3Response.ok) {
      throw new Error("test2/test3 군집 결과 파일을 찾지 못했어요. 두 노트북의 마지막 ‘웹용 군집 결과 내보내기’ 셀을 실행해주세요.");
    }
    const [text, test2Labels, test3Labels] = await Promise.all([
      datasetResponse.text(), test2Response.text(), test3Response.text(),
    ]);
    state.clusterLabels.set("all", parseClusterLabels(test2Labels, "test2 전체 데이터"));
    state.clusterLabels.set("k-pop", parseClusterLabels(test3Labels, "test3 K-pop"));
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
