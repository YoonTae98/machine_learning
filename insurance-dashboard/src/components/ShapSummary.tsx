export default function ShapSummary() {
  return (
    <div className="dashboard-panel shap-panel">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="section-heading">

        <div>

          <span className="eyebrow">
            MODEL EXPLAINABILITY
          </span>

          <h2>
            SHAP Summary Plot
          </h2>

          <p className="model-description">
            각 변수가 보험 관심 고객 예측에 미치는 방향과
            영향도를 SHAP Value로 분석합니다.
          </p>

        </div>

        <span className="section-note">
          3,000 Sample
        </span>

      </div>


      {/* ========================================
          SHAP GRAPH
      ======================================== */}

      <div className="shap-visual">

        <img
          src="/shap_summary_dashboard.svg"
          alt="XGBoost SHAP Summary Plot"
        />

      </div>


      {/* ========================================
          INSIGHTS
      ======================================== */}

      <div className="shap-insights">

        <div className="shap-insight-card">

          <div className="shap-insight-header">

            <span className="shap-insight-number">
              01
            </span>

            <strong>
              Previously Insured
            </strong>

          </div>

          <p>
            기존 보험 가입 여부는 모델 예측에서
            큰 영향력을 가지며, SHAP 값이 주로
            음의 방향에 분포합니다.
          </p>

        </div>


        <div className="shap-insight-card">

          <div className="shap-insight-header">

            <span className="shap-insight-number">
              02
            </span>

            <strong>
              Vehicle Damage
            </strong>

          </div>

          <p>
            차량 손상 정보는 보험 관심 고객 예측에서
            강한 영향력을 보이며, SHAP 값이
            양의 방향에 크게 형성됩니다.
          </p>

        </div>


        <div className="shap-insight-card">

          <div className="shap-insight-header">

            <span className="shap-insight-number">
              03
            </span>

            <strong>
              Age
            </strong>

          </div>

          <p>
            연령은 고객별 값에 따라 예측 방향이 달라지며,
            양쪽 방향에 걸쳐 비교적 넓은
            SHAP 분포를 보입니다.
          </p>

        </div>

      </div>


      {/* ========================================
          DIRECTION GUIDE
      ======================================== */}

      <div className="shap-legend">

        <div>

          <span className="shap-negative">
            ← Negative SHAP
          </span>

          <span>
            Response = 0 방향
          </span>

        </div>


        <div>

          <span className="shap-positive">
            Positive SHAP →
          </span>

          <span>
            Response = 1 방향
          </span>

        </div>

      </div>

    </div>
  );
}