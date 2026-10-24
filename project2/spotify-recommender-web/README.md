# SORINA — Spotify 추천 시스템 임시 웹 시각화

세 화면으로 구성된 로컬 프로토타입입니다.

1. 프로젝트 개요와 데이터 시각화
2. 중복 `track_id`의 평균 `popularity` 기준 Top 100 및 데이터 범위별 곡 검색
3. 선택 곡 Spotify 임베드 플레이어, 같은 K-Means 군집 내 코사인 KNN 유사곡, 아티스트 곡 모음, 유사곡 믹스

첫 화면의 요약 차트와 인기 차트에서 `전체 · test2` 또는 `K-pop · test3` 데이터 범위를 선택할 수 있습니다. K-pop 범위는 `track_genre == "k-pop"` 라벨을 기준으로 하며, 한국 가수 국적을 보장하지 않습니다. `선정성 제외` 토글은 두 범위 모두에서 explicit 곡을 차트·검색·요약 통계·추천 후보에서 제외합니다. 노트북의 최종 군집 설정은 test2 전체 데이터에서 K-Means K=6, test3 K-pop 데이터에서 K-Means K=3입니다.

중복 `track_id`가 있으면 대표 행은 기존처럼 하나만 유지하지만, 그 행의 popularity를 남기지 않고 중복 행들의 평균으로 대체합니다. 따라서 Top 100과 상세 화면에는 평균 인기도가 표시됩니다.

추천의 군집 라벨은 `test2.ipynb`의 전체 데이터 K-Means K=6 결과와 `test3.ipynb`의 K-pop subset K-Means K=3 결과를 사용합니다. 각 노트북 마지막의 **웹용 군집 결과 내보내기** 셀이 `cluster-data/test2_clusters.csv`, `cluster-data/test3_clusters.csv`를 만듭니다. 첫 화면에는 이 결과에서 계산한 군집별 곡 수와 비율도 표시됩니다. 웹은 선택 곡과 같은 군집에 속한 후보만 남긴 다음, 표준화된 오디오 특성 및 원-핫 `key`·`mode`·`time_signature`의 코사인 유사도로 순위를 정합니다. 최종 K를 바꿨다면 해당 노트북과 웹을 함께 갱신해야 합니다. 군집이 작거나 `선정성 제외`가 켜져 있으면 추천 수는 5곡보다 적을 수 있습니다.

선택 곡 상세 화면의 **아티스트 곡 모음**은 추천 모델이 아니라 같은 아티스트의 데이터 곡을 모은 별도 목록입니다. 그 아래 **비슷한 곡 이어 듣기**는 같은 K-Means 군집 내 코사인 KNN 후보로 구성됩니다. 두 목록은 각각 접거나 펼칠 수 있습니다. 노트북과 동일하게 추천 특성은 연속형 StandardScaler와 `key`·`mode`·`time_signature` 원-핫 인코딩을 사용하고, `duration_ms` 원본과 `log1p` 버전을 비교한 뒤 현재 최종 군집은 원본 길이 버전으로 학습합니다.

## 실행

### 처음 한 번

ACRCloud 프로젝트의 Host, Access Key, Secret을 `spotify-recommender-web/.env` 파일에 입력합니다. `.env`는 Git에서 제외되어 있습니다. Secret을 `app.js`, `index.html` 또는 다른 브라우저 코드에 넣지 마세요.

```env
ACRCLOUD_HOST=identify-ap-southeast-1.acrcloud.com
ACRCLOUD_ACCESS_KEY=여기에_프로젝트_Access_Key
ACRCLOUD_ACCESS_SECRET=여기에_프로젝트_Secret
```

`project2` 폴더에서 가상환경을 만들고 필요한 패키지를 설치합니다. 가상환경 폴더는 Git에서 제외됩니다.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r spotify-recommender-web/requirements.txt
```

### 실행할 때마다

터미널에서 `project2` 폴더로 이동해 가상환경을 활성화하고 Python 서버를 실행한 다음, 브라우저에서 `http://127.0.0.1:8000/`을 엽니다. 기존의 `python3 -m http.server` 대신 아래 서버를 실행해야 허밍 API 연결이 동작합니다.

```bash
source .venv/bin/activate
python3 spotify-recommender-web/server.py
```

웹에 군집 기반 추천을 연결하기 전에 `test2.ipynb`와 `test3.ipynb`를 실행해 마지막 내보내기 셀에서 각각의 CSV를 생성해야 합니다. 두 CSV는 노트북에서 계산한 최종 군집 라벨을 담으며, 웹 서버는 이 파일만 허용된 경로에서 제공합니다. `test1`은 가이드라인/베이스라인으로 남고 웹 군집 라벨 입력에는 사용하지 않습니다.

인기 차트에서 **허밍으로 곡 찾기**를 누르면 마이크로 10초를 녹음해 ACRCloud에 전송합니다. 인식 결과의 곡 제목을 누르면 세 번째 상세 페이지가 열립니다. 곡이 추천 데이터에 있으면 현재 범위의 K-Means 군집 안에서 코사인 KNN 추천이 표시되고, K-pop 필터 밖에만 있으면 전체 데이터로 전환합니다. 추천 데이터에 없는 곡도 상세 화면에서 확인할 수 있지만, 오디오 특성이 없어 유사곡 추천은 제공하지 않습니다. 오디오는 이 앱의 서버에 저장하지 않고 인식 요청으로 전달합니다.

브라우저의 마이크 권한이 필요합니다. `localhost`에서 실행해야 마이크를 쓸 수 있으며, 마이크 권한을 허용해 주세요. 곡 상세 페이지의 Spotify 임베드 재생에는 인터넷 연결이 필요하고, Spotify 서비스·계정·지역에 따라 곡별 재생 가능 여부가 달라질 수 있습니다. Spotify에서 곡 페이지를 여는 바로가기도 제공합니다.

곡 커버는 로컬 서버가 Spotify oEmbed 썸네일을 가져와 표시합니다. Spotify에 커버가 없거나 인터넷 요청이 실패하면 대체 커버를 표시합니다. 이미지 로드에는 인터넷 연결이 필요합니다.

이 앱은 로컬 프로토타입입니다. `server.py`는 개인 컴퓨터에서만 실행하도록 묶여 있어 외부에 공개하지 마세요. Spotify 임베드의 기본 재생은 가능하지만, 웹앱에서 Spotify 계정에 재생목록을 저장하거나 임베드 플레이어를 별도 컨트롤로 조작하지는 않습니다.
