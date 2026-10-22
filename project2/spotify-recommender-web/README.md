# SORINA — Spotify 추천 시스템 임시 웹 시각화

세 화면으로 구성된 로컬 프로토타입입니다.

1. 프로젝트 개요와 데이터 시각화
2. 실제 `popularity` 기준 Top 100 및 전체 곡 검색
3. 선택 곡 Spotify 임베드 플레이어, 코사인 KNN 유사곡 5개, 20곡 이어 듣기 목록

현재 추천 기능은 노트북의 전체 곡 KNN 기준선을 브라우저에서 재현합니다. 연속형 오디오 특성은 `StandardScaler` 방식으로 표준화하고, `key`와 `time_signature`는 원-핫 인코딩한 뒤 코사인 유사도를 계산합니다. K-Means는 개요 페이지에서 군집 탐색으로 소개되며 현재 추천 순위에는 사용하지 않습니다.

## 실행

터미널에서 `project2` 폴더로 이동해 아래 명령을 실행한 뒤 브라우저에서 `http://localhost:8000/spotify-recommender-web/`을 엽니다.

```bash
python3 -m http.server 8000
```

웹앱은 `../spotify_tracks_dataset/dataset.csv`를 브라우저에서 읽기 때문에 로컬 HTTP 서버로 열어야 합니다. 곡 상세 페이지에는 Spotify 임베드 플레이어가 표시됩니다. 임베드 재생에는 인터넷 연결이 필요하고, Spotify 서비스·계정·지역에 따라 곡별 재생 가능 여부가 달라질 수 있습니다. Spotify에서 곡 페이지를 여는 바로가기도 제공합니다.

이 앱은 임시 시각화입니다. Spotify 임베드의 기본 재생은 가능하지만, 웹앱에서 Spotify 계정에 재생목록을 저장하거나 임베드 플레이어를 별도 컨트롤로 조작하지는 않습니다.
