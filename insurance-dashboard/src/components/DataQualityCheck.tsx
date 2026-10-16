const qualityChecks = [
  {
    number: "01",
    label: "결측치",
    value: "0",
    status: "결측치 없음",
    description:
      "Train 데이터 전체에서 결측치는 확인되지 않았습니다.",
    className: "quality-missing",
  },

  {
    number: "02",
    label: "중복되는 행",
    value: "0",
    status: "중복 없음",
    description:
      "중복된 행은 확인되지 않아 별도 제거가 필요하지 않았습니다.",
    className: "quality-duplicate",
  },

  {
    number: "03",
    label: "이상치 검토",
    value: "CLEAN",
    status: "별도 제거 없음",
    description:
      "분포 검토 결과, 별도의 이상치 제거 없이 사용했습니다.",
    className: "quality-outlier",
  },
];

export default function DataQualityCheck() {
  return (
    <div className="dashboard-panel quality-panel">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="section-heading">

        <div>

          <span className="eyebrow">
            DATA QUALITY CHECK
          </span>

          <h2>
            Initial Data Validation
          </h2>

          <p className="quality-description">
            모델링 전 결측치, 중복 데이터 및 이상치를 확인하여
            데이터 품질을 검증했습니다.
          </p>

        </div>


        <div className="quality-ready-badge">

          <span className="quality-ready-dot" />

          모델링 준비 완료

        </div>

      </div>



      {/* ========================================
          QUALITY CARDS
      ======================================== */}

      <div className="quality-grid">

        {qualityChecks.map((item) => (

          <div
            className={`quality-card ${item.className}`}
            key={item.label}
          >

            <div className="quality-card-top">

              <span className="quality-number">
                {item.number}
              </span>


              <div className="quality-check-icon">
                ✓
              </div>

            </div>


            <span className="quality-label">
              {item.label}
            </span>


            <strong className="quality-value">
              {item.value}
            </strong>


            <div className="quality-status">
              {item.status}
            </div>


            <p>
              {item.description}
            </p>

          </div>

        ))}

      </div>



      {/* ========================================
          DATA SUMMARY
      ======================================== */}

      <div className="quality-summary">

        <div>

          <span>
            학습 데이터
          </span>

          <strong>
            381,109
          </strong>

          <small>
            rows
          </small>

        </div>


        <div className="quality-summary-divider" />


        <div>

          <span>
            원본 컬럼
          </span>

          <strong>
            12
          </strong>

          <small>
            columns
          </small>

        </div>


        <div className="quality-summary-divider" />


        <div>

          <span>
            결측률
          </span>

          <strong>
            0.00%
          </strong>

        </div>


        <div className="quality-summary-divider" />


        <div>

          <span>
            데이터 상태
          </span>

          <strong className="quality-status-good">
            CLEAN
          </strong>

        </div>

      </div>

    </div>
  );
}