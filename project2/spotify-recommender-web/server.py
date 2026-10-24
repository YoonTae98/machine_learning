"""Local SORINA web server and secure ACRCloud recognition proxy."""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import re
import time
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request, send_file, send_from_directory


APP_DIR = Path(__file__).resolve().parent
PROJECT2_DIR = APP_DIR.parent
DATASET_PATH = PROJECT2_DIR / "spotify_tracks_dataset" / "dataset.csv"
load_dotenv(APP_DIR / ".env")

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024

SITE_FILES = {"app.js", "style.css", "favicon.svg"}
CLUSTER_FILES = {"test2_clusters.csv", "test3_clusters.csv"}


@app.get("/")
@app.get("/spotify-recommender-web/")
def index():
    return send_from_directory(APP_DIR, "index.html")


@app.get("/<path:requested_path>")
def site_files(requested_path: str):
    # An allowlist prevents this local server from serving .env or arbitrary files.
    if requested_path in SITE_FILES:
        return send_from_directory(APP_DIR, requested_path)
    if requested_path == "spotify-recommender-web/index.html":
        return send_from_directory(APP_DIR, "index.html")
    if requested_path.startswith("spotify-recommender-web/"):
        filename = requested_path.removeprefix("spotify-recommender-web/")
        if filename in SITE_FILES:
            return send_from_directory(APP_DIR, filename)
    if requested_path == "spotify_tracks_dataset/dataset.csv" and DATASET_PATH.is_file():
        return send_file(DATASET_PATH, mimetype="text/csv", conditional=True)
    if requested_path.startswith("cluster-data/"):
        filename = requested_path.removeprefix("cluster-data/")
        if filename in CLUSTER_FILES:
            return send_from_directory(APP_DIR / "cluster-data", filename, mimetype="text/csv")
    if requested_path.startswith("spotify-recommender-web/cluster-data/"):
        filename = requested_path.removeprefix("spotify-recommender-web/cluster-data/")
        if filename in CLUSTER_FILES:
            return send_from_directory(APP_DIR / "cluster-data", filename, mimetype="text/csv")
    return jsonify({"error": "Not found"}), 404


@app.post("/api/recognize")
def recognize_humming():
    access_key = os.getenv("ACRCLOUD_ACCESS_KEY", "").strip()
    access_secret = os.getenv("ACRCLOUD_ACCESS_SECRET", "").strip()
    host = os.getenv("ACRCLOUD_HOST", "").strip().removeprefix("https://").removeprefix("http://").rstrip("/")

    if not access_key or not access_secret or not host:
        return jsonify({"error": "ACRCloud 설정이 비어 있어요. .env에 Host, Access Key, Secret을 입력해주세요."}), 503
    if not re.fullmatch(r"[A-Za-z0-9.-]+", host):
        return jsonify({"error": "ACRCloud Host 형식이 올바르지 않아요."}), 500

    audio = request.files.get("sample")
    if audio is None:
        return jsonify({"error": "녹음된 오디오 파일을 받지 못했어요."}), 400

    sample = audio.read()
    if len(sample) < 1000:
        return jsonify({"error": "녹음이 너무 짧아요. 8~10초 정도 다시 녹음해주세요."}), 400
    if len(sample) > 1_500_000:
        return jsonify({"error": "녹음 파일이 너무 커요. 10초 이내로 다시 녹음해주세요."}), 413

    timestamp = str(int(time.time()))
    data_type = "audio"
    signature_version = "1"
    string_to_sign = "\n".join(
        ("POST", "/v1/identify", access_key, data_type, signature_version, timestamp)
    )
    signature = base64.b64encode(
        hmac.new(access_secret.encode("utf-8"), string_to_sign.encode("utf-8"), hashlib.sha1).digest()
    ).decode("ascii")

    form_data = {
        "access_key": access_key,
        "sample_bytes": str(len(sample)),
        "timestamp": timestamp,
        "signature": signature,
        "data_type": data_type,
        "signature_version": signature_version,
    }
    try:
        response = requests.post(
            f"https://{host}/v1/identify",
            data=form_data,
            files={"sample": ("sorina-humming.wav", sample, "audio/wav")},
            timeout=(5, 25),
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.Timeout:
        return jsonify({"error": "ACRCloud 응답 시간이 초과됐어요. 잠시 후 다시 시도해주세요."}), 504
    except requests.RequestException:
        return jsonify({"error": "ACRCloud에 연결하지 못했어요. Host와 인터넷 연결을 확인해주세요."}), 502
    except ValueError:
        return jsonify({"error": "ACRCloud에서 읽을 수 없는 응답을 받았어요."}), 502


@lru_cache(maxsize=400)
def fetch_spotify_cover(track_id: str) -> tuple[bytes, str] | None:
    """Fetch and cache a Spotify cover through the local server."""
    metadata = requests.get(
        "https://open.spotify.com/oembed",
        params={"url": f"https://open.spotify.com/track/{track_id}"},
        timeout=(4, 10),
    )
    metadata.raise_for_status()
    image_url = metadata.json().get("thumbnail_url", "")
    parsed_url = urlparse(image_url)
    if parsed_url.scheme != "https" or not (
        parsed_url.hostname
        and (parsed_url.hostname.endswith(".spotifycdn.com") or parsed_url.hostname.endswith(".scdn.co"))
    ):
        return None

    image_response = requests.get(image_url, timeout=(4, 12))
    image_response.raise_for_status()
    content_type = image_response.headers.get("Content-Type", "").split(";", 1)[0].lower()
    if not content_type.startswith("image/") or len(image_response.content) > 2_000_000:
        return None
    return image_response.content, content_type


@app.get("/api/spotify-cover/<track_id>")
def spotify_cover(track_id: str):
    if not re.fullmatch(r"[A-Za-z0-9]{22}", track_id):
        return jsonify({"error": "Spotify 곡 ID 형식이 올바르지 않아요."}), 400
    try:
        cover = fetch_spotify_cover(track_id)
    except (requests.RequestException, ValueError, TypeError):
        cover = None
    if cover is None:
        return jsonify({"error": "Spotify 커버 이미지를 찾지 못했어요."}), 404
    image_bytes, content_type = cover
    response = Response(image_bytes, mimetype=content_type)
    response.headers["Cache-Control"] = "public, max-age=86400"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({"error": "녹음 파일이 너무 커요. 10초 이내로 다시 녹음해주세요."}), 413


if __name__ == "__main__":
    print("SORINA is running at http://127.0.0.1:8000/")
    print("Credentials are read from the ignored .env file; do not share it or expose this server publicly.")
    app.run(host="127.0.0.1", port=8000, debug=False)
