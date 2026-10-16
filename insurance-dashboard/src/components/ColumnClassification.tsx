const columnGroups = [
  {
    type: "Numeric",
    count: 3,
    className: "column-numeric",
    description: "연속적인 수치 정보를 가지는 변수",
    preprocessing: "Logistic → StandardScaler",
    columns: [
      "Age",
      "Annual_Premium",
      "Vintage",
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
            데이터 타입이 아닌 변수의 실제 의미를 기준으로
            입력 컬럼의 역할과 전처리 방식을 구분했습니다.
          </p>

        </div>


        <span className="section-note">
          12 Original Columns
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

            {/* CARD TOP */}

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



            {/* TITLE */}

            <div className="column-card-title">

              <span className="column-type-dot" />

              <h3>
                {group.type}
              </h3>

            </div>



            {/* DESCRIPTION */}

            <p className="column-card-description">
              {group.description}
            </p>



            {/* COLUMN LIST */}

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



            {/* PREPROCESSING */}

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

      <div className="special-column-grid">

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
              단순 식별자이므로 모델 입력에서 제거
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
              보험 관심 여부 · 0 = 비관심 / 1 = 관심
            </p>

          </div>

        </div>

      </div>



      {/* ========================================
          DATA FLOW
      ======================================== */}

      <div className="column-flow">

        {/* ORIGINAL */}

        <div className="column-flow-step">

          <span className="column-flow-label">
            ORIGINAL DATA
          </span>

          <strong>
            12 Columns
          </strong>

        </div>


        <div className="flow-arrow">
          →
        </div>



        {/* EXCLUDE */}

        <div className="column-flow-step">

          <span className="column-flow-label">
            EXCLUDE
          </span>

          <strong>
            id 제거
          </strong>

        </div>


        <div className="flow-arrow">
          →
        </div>



        {/* TARGET SPLIT */}

        <div className="column-flow-step target-flow-step">

          <span className="column-flow-label">
            TARGET SPLIT
          </span>

          <strong>
            Response 분리
          </strong>

        </div>


        <div className="flow-arrow">
          →
        </div>



        {/* INPUT + TARGET */}

        <div className="column-flow-result">

          <div>

            <span>
              INPUT
            </span>

            <strong>
              10 Features
            </strong>

          </div>


          <div className="column-flow-plus">
            +
          </div>


          <div>

            <span>
              TARGET
            </span>

            <strong>
              Response
            </strong>

          </div>

        </div>


        <div className="flow-arrow">
          →
        </div>



        {/* MODEL */}

        <div className="column-flow-model">

          <span>
            MODEL
          </span>

          <strong>
            Training Input
          </strong>

        </div>

      </div>

    </div>
  );
}