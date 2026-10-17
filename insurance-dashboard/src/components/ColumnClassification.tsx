const columnGroups = [
  {
    type: "Numeric",
    count: 2,
    className: "column-numeric",
    description: "연속적인 수치 정보를 가지는 변수",
    preprocessing: "Logistic → StandardScaler",
    columns: [
      "Age",
      "Annual_Premium",
    ],
  },

  {
    type: "Binary",
    count: 4,
    className: "column-binary",
    description: "0 / 1 두 가지 상태로 표현되는 변수",
    preprocessing: "Binary Encoding / Passthrough",
    columns: [
      "Gender",
      "Driving_License",
      "Previously_Insured",
      "Vehicle_Damage",
    ],
  },

  {
    type: "Categorical",
    count: 3,
    className: "column-categorical",
    description: "숫자로 보여도 순서 의미가 없는 범주형 변수",
    preprocessing: "One-Hot Encoding",
    columns: [
      "Region_Code",
      "Vehicle_Age",
      "Policy_Sales_Channel",
    ],
  },
];


export default function ColumnClassification() {
  return (
    <div className="dashboard-panel column-panel">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="section-heading">

        <div>

          <span className="eyebrow">
            DATA PREPROCESSING
          </span>

          <h2>
            Column Classification
          </h2>

          <p className="model-description">
            변수의 실제 의미를 기준으로 최종 입력 Feature를 분류하고,
            모델별 특성에 맞는 전처리 방식을 적용했습니다.
          </p>

        </div>

        <span className="section-note">
          9 Final Features
        </span>

      </div>



      {/* ========================================
          FEATURE GROUPS
      ======================================== */}

      <div className="column-grid">

        {columnGroups.map((group, index) => (

          <div
            className={`column-card ${group.className}`}
            key={group.type}
          >

            <div className="column-card-top">

              <div className="column-card-index">
                {String(index + 1).padStart(2, "0")}
              </div>


              <div className="column-card-count">

                {group.count}

                <span>
                  columns
                </span>

              </div>

            </div>


            <div className="column-card-title">

              <span className="column-type-dot" />

              <h3>
                {group.type}
              </h3>

            </div>


            <p className="column-card-description">
              {group.description}
            </p>


            <div className="column-chip-list">

              {group.columns.map((column) => (

                <span
                  className="column-chip"
                  key={column}
                >
                  {column}
                </span>

              ))}

            </div>


            <div className="column-preprocess">

              <span>
                PREPROCESSING
              </span>

              <strong>
                {group.preprocessing}
              </strong>

            </div>

          </div>

        ))}

      </div>



      {/* ========================================
          SPECIAL COLUMNS
      ======================================== */}

      <div className="special-column-grid final-special-grid">

        {/* ID */}

        <div className="special-column-card excluded-column">

          <div className="special-column-icon">
            ×
          </div>

          <div>

            <span>
              EXCLUDED
            </span>

            <strong>
              id
            </strong>

            <p>
              모든 행에서 고유한 단순 식별자이므로
              모델 입력에서 제거했습니다.
            </p>

          </div>

        </div>


        {/* VINTAGE */}

        <div className="special-column-card excluded-column">

          <div className="special-column-icon">
            ×
          </div>

          <div>

            <span>
              FEATURE REMOVED
            </span>

            <strong>
              Vintage
            </strong>

            <p>
              Phi_K 0.0045 · p-value 0.5167로
              Response와 유의한 관계가 확인되지 않아 제거했습니다.
            </p>

          </div>

        </div>


        {/* TARGET */}

        <div className="special-column-card target-column">

          <div className="special-column-icon">
            ◎
          </div>

          <div>

            <span>
              TARGET
            </span>

            <strong>
              Response
            </strong>

            <p>
              보험 관심 여부
              · 0 = 비관심 / 1 = 관심
            </p>

          </div>

        </div>

      </div>



      {/* ========================================
          FINAL DATA FLOW
      ======================================== */}

      <div className="final-column-flow">

        {/* ORIGINAL */}

        <div className="final-flow-step">

          <span>
            ORIGINAL DATA
          </span>

          <strong>
            12 Columns
          </strong>

        </div>


        <div className="final-flow-arrow">
          →
        </div>


        {/* DATA SEPARATION */}

        <div className="final-flow-step">

          <span>
            DATA SEPARATION
          </span>

          <strong>
            id 제거
          </strong>

          <small>
            Response 분리
          </small>

        </div>


        <div className="final-flow-arrow">
          →
        </div>


        {/* FEATURE SELECTION */}

        <div className="final-flow-step">

          <span>
            FEATURE SELECTION
          </span>

          <strong>
            Vintage 제거
          </strong>

        </div>


        <div className="final-flow-arrow">
          →
        </div>


        {/* FINAL INPUT */}

        <div className="final-flow-step final-input-step">

          <span>
            FINAL INPUT
          </span>

          <strong>
            9 Features
          </strong>

        </div>


        <div className="final-flow-arrow">
          →
        </div>


        {/* MODEL */}

        <div className="final-flow-step final-model-step">

          <span>
            MODEL
          </span>

          <strong>
            XGBoost
          </strong>

        </div>

      </div>

    </div>
  );
}