export default function PreprocessingStrategy() {
  return (
    <div className="dashboard-panel preprocessing-strategy-panel">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="section-heading">

        <div>

          <span className="eyebrow">
            PREPROCESSING STRATEGY
          </span>

          <h2>
            Encoding & Leakage Control
          </h2>

          <p className="preprocessing-description">
            변수의 의미에 맞는 Encoding을 적용하고,
            Pipeline과 Cross Validation을 사용해
            데이터 누수를 방지하면서 일반화 성능을 검증했습니다.
          </p>

        </div>

      </div>



      {/* ========================================
          01. ENCODING STRATEGY
      ======================================== */}

      <div className="encoding-title-row">

        <span className="encoding-section-number">
          01
        </span>

        <div>

          <h3>
            Encoding Strategy
          </h3>

          <p>
            숫자의 크기 자체가 의미를 갖지 않는 변수는
            모델이 잘못된 순서 관계를 학습하지 않도록 변환했습니다.
          </p>

        </div>

      </div>



      {/* ========================================
          ENCODING CARDS
      ======================================== */}

      <div className="encoding-grid">

        {/* ========================================
            BINARY ENCODING
        ======================================== */}

        <div className="encoding-card binary-encoding-card">

          <div className="encoding-card-header">

            <div>

              <span>
                BINARY ENCODING
              </span>

              <h3>
                Binary Features
              </h3>

            </div>


            <div className="encoding-count">

              4

              <small>
                features
              </small>

            </div>

          </div>


          <p className="encoding-card-description">
            두 가지 상태를 가지는 변수는 0과 1로 표현합니다.
          </p>



          {/* Gender */}

          <div className="binary-demo">

            <div className="binary-feature-name">
              Gender
            </div>


            <div className="binary-map-row">

              <span className="encoding-source">
                Female
              </span>

              <span className="encoding-arrow">
                →
              </span>

              <strong className="binary-value">
                0
              </strong>

            </div>


            <div className="binary-map-row">

              <span className="encoding-source">
                Male
              </span>

              <span className="encoding-arrow">
                →
              </span>

              <strong className="binary-value">
                1
              </strong>

            </div>

          </div>



          {/* Vehicle Damage */}

          <div className="binary-demo">

            <div className="binary-feature-name">
              Vehicle_Damage
            </div>


            <div className="binary-map-row">

              <span className="encoding-source">
                No
              </span>

              <span className="encoding-arrow">
                →
              </span>

              <strong className="binary-value">
                0
              </strong>

            </div>


            <div className="binary-map-row">

              <span className="encoding-source">
                Yes
              </span>

              <span className="encoding-arrow">
                →
              </span>

              <strong className="binary-value">
                1
              </strong>

            </div>

          </div>



          {/* Already Binary */}

          <div className="encoding-note">

            <span>
              PASSTHROUGH
            </span>

            <strong>
              Driving_License · Previously_Insured
            </strong>

            <p>
              이미 0 / 1 형태이므로 추가 변환 없이 사용했습니다.
            </p>

          </div>

        </div>



        {/* ========================================
            ONE-HOT ENCODING
        ======================================== */}

        <div className="encoding-card onehot-encoding-card">

          <div className="encoding-card-header">

            <div>

              <span>
                ONE-HOT ENCODING
              </span>

              <h3>
                Categorical Features
              </h3>

            </div>


            <div className="encoding-count">

              3

              <small>
                features
              </small>

            </div>

          </div>


          <p className="encoding-card-description">
            범주별로 독립적인 컬럼을 생성해
            임의의 숫자 순서 관계가 생기지 않도록 합니다.
          </p>



          {/* Vehicle Age Example */}

          <div className="onehot-demo">

            <div className="onehot-demo-head">

              <strong>
                Vehicle_Age
              </strong>

              <span>
                Encoding Example
              </span>

            </div>


            <div className="onehot-table">

              {/* HEADER */}

              <div className="onehot-row onehot-header-row">

                <span>
                  Category
                </span>

                <span>
                  &lt;1
                </span>

                <span>
                  1–2
                </span>

                <span>
                  &gt;2
                </span>

              </div>



              {/* < 1 Year */}

              <div className="onehot-row">

                <strong>
                  &lt; 1 Year
                </strong>

                <b className="onehot-active">
                  1
                </b>

                <b>
                  0
                </b>

                <b>
                  0
                </b>

              </div>



              {/* 1-2 Year */}

              <div className="onehot-row">

                <strong>
                  1-2 Year
                </strong>

                <b>
                  0
                </b>

                <b className="onehot-active">
                  1
                </b>

                <b>
                  0
                </b>

              </div>



              {/* > 2 Years */}

              <div className="onehot-row">

                <strong>
                  &gt; 2 Years
                </strong>

                <b>
                  0
                </b>

                <b>
                  0
                </b>

                <b className="onehot-active">
                  1
                </b>

              </div>

            </div>

          </div>



          {/* Other Categorical Features */}

          <div className="encoding-note onehot-note">

            <span>
              SAME STRATEGY
            </span>

            <strong>
              Region_Code · Policy_Sales_Channel
            </strong>

            <p>
              숫자로 저장되어 있지만 순서와 크기에 의미가 없는
              범주형 코드이므로 One-Hot Encoding을 적용했습니다.
            </p>

          </div>

        </div>

      </div>



      {/* ========================================
          02. LEAKAGE & OVERFITTING CONTROL
      ======================================== */}

      <div className="leakage-section">

        <div className="encoding-title-row">

          <span className="encoding-section-number leakage-number">
            02
          </span>

          <div>

            <h3>
              Leakage & Overfitting Control
            </h3>

            <p>
              평가 데이터의 정보가 학습 과정에 들어가지 않도록 분리하고,
              교차검증과 OOF 예측으로 일반화 성능을 확인했습니다.
            </p>

          </div>

        </div>



        {/* ========================================
            MAIN FLOW
        ======================================== */}

        <div className="leakage-flow">

          {/* ORIGINAL */}

          <div className="leakage-step leakage-data-step">

            <span>
              ORIGINAL DATA
            </span>

            <strong>
              381,109
            </strong>

            <small>
              rows
            </small>

          </div>


          <div className="leakage-arrow">
            →
          </div>



          {/* SPLIT */}

          <div className="leakage-step leakage-split-step">

            <span>
              STRATIFIED SPLIT
            </span>

            <strong>
              80 : 20
            </strong>

            <small>
              Response 비율 유지
            </small>

          </div>


          <div className="leakage-arrow">
            →
          </div>



          {/* TRAIN */}

          <div className="leakage-step leakage-train-step">

            <span>
              TRAIN
            </span>

            <strong>
              304,887
            </strong>

            <small>
              rows
            </small>

          </div>


          <div className="leakage-arrow">
            →
          </div>



          {/* PIPELINE */}

          <div className="leakage-step leakage-pipeline-step">

            <span>
              PIPELINE
            </span>

            <strong>
              Preprocess + Model
            </strong>

            <small>
              Train Fold에서만 Fit
            </small>

          </div>


          <div className="leakage-arrow">
            →
          </div>



          {/* CV */}

          <div className="leakage-step leakage-cv-step">

            <span>
              STRATIFIED CV
            </span>

            <strong>
              5-Fold
            </strong>

            <small>
              일반화 성능 검증
            </small>

          </div>

        </div>



        {/* ========================================
            CV VISUAL
        ======================================== */}

        <div className="cv-visual">

          <div className="cv-title">

            <span>
              각 Fold에서 반복
            </span>

            <strong>
              Validation Fold는 전처리 Fit에 사용하지 않음
            </strong>

          </div>



          {/* FOLD */}

          <div className="cv-folds">

            <div className="cv-fold">

              <span className="fold-train">
                TRAIN
              </span>

              <span className="fold-train">
                TRAIN
              </span>

              <span className="fold-train">
                TRAIN
              </span>

              <span className="fold-train">
                TRAIN
              </span>

              <span className="fold-valid">
                VALID
              </span>

            </div>



            <div className="cv-down">
              ↓
            </div>



            {/* PIPELINE FLOW */}

            <div className="cv-pipeline-box">

              <div>

                <span>
                  FIT
                </span>

                <strong>
                  ColumnTransformer
                </strong>

                <small>
                  Train Fold only
                </small>

              </div>


              <div className="cv-pipeline-arrow">
                →
              </div>


              <div>

                <span>
                  TRANSFORM
                </span>

                <strong>
                  Validation Fold
                </strong>

                <small>
                  fitted transformer 사용
                </small>

              </div>


              <div className="cv-pipeline-arrow">
                →
              </div>


              <div>

                <span>
                  MODEL
                </span>

                <strong>
                  XGBoost
                </strong>

                <small>
                  Validation Prediction
                </small>

              </div>

            </div>

          </div>

        </div>



        {/* ========================================
            CONTROL SUMMARY
        ======================================== */}

        <div className="control-grid">

          {/* PIPELINE */}

          <div className="control-card">

            <span className="control-number">
              01
            </span>

            <strong>
              Pipeline
            </strong>

            <p>
              Scaling과 One-Hot Encoder가
              학습 Fold에서만 Fit되도록 구성했습니다.
            </p>

            <div className="control-tag">
              Leakage Prevention
            </div>

          </div>



          {/* STRATIFIED KFOLD */}

          <div className="control-card">

            <span className="control-number">
              02
            </span>

            <strong>
              StratifiedKFold
            </strong>

            <p>
              각 Fold에서 Response 비율을 유지하며
              5회 반복 검증했습니다.
            </p>

            <div className="control-tag">
              Generalization Check
            </div>

          </div>



          {/* OOF */}

          <div className="control-card">

            <span className="control-number">
              03
            </span>

            <strong>
              OOF Threshold
            </strong>

            <p>
              각 샘플을 학습하지 않은 모델의 예측값으로
              F1 최적 Threshold를 결정했습니다.
            </p>

            <div className="control-tag">
              Threshold 0.2285
            </div>

          </div>



          {/* HOLDOUT */}

          <div className="control-card">

            <span className="control-number">
              04
            </span>

            <strong>
              Hold-out Validation
            </strong>

            <p>
              결정된 Threshold를 고정한 후
              76,222개 Validation 데이터에서 평가했습니다.
            </p>

            <div className="control-tag">
              Final Evaluation
            </div>

          </div>

        </div>



        {/* ========================================
            FINAL GENERALIZATION CHECK
        ======================================== */}

        <div className="leakage-final-message">

          <span className="leakage-check">
            ✓
          </span>


          <div>

            <strong>
              Train 정보만으로 학습 · Validation은 평가에만 사용
            </strong>

            <p>
              XGBoost의 OOF F1 0.4592와
              Hold-out Validation F1 0.4605가 거의 동일하게 나타나
              큰 일반화 성능 저하는 확인되지 않았습니다.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}