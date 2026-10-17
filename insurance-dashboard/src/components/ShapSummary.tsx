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
            Grouped SHAP Summary
          </h2>

          <p className="model-description">
            One-Hot Encoding으로 확장된 SHAP 값을
            원래 9개 Feature 단위로 다시 통합해
            예측 기여 방향과 영향도를 분석했습니다.
          </p>

        </div>

        <span className="section-note">
          3,000 Sample · 9 Features
        </span>

      </div>


      {/* ========================================
          SHAP GRAPH
      ======================================== */}

      <div className="shap-visual">

        <img
          src="/shap_summary_dashboard.png"
          alt="Final XGBoost Grouped SHAP Summary Plot"
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
            Grouped Mean |SHAP| 기준 64.15%로
            가장 큰 예측 기여도를 보였습니다.
            SHAP 값은 주로 음의 방향에 분포해
            Response = 0 방향 예측에 크게 기여합니다.
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
            Grouped Mean |SHAP| 기준 13.20%로
            두 번째로 높은 영향도를 보이며,
            보험 관심 고객 예측에 중요한 변수로 나타났습니다.
          </p>

        </div>


        <div className="shap-insight-card">

          <div className="shap-insight-header">

            <span className="shap-insight-number">
              03
            </span>

            <strong>
              Policy Sales Channel
            </strong>

          </div>

          <p>
            Grouped Mean |SHAP| 기준 8.27%로
            세 번째로 높은 예측 기여도를 보였습니다.
            범주형 변수이므로 코드값의 크기를
            높고 낮음의 의미로 해석하지 않습니다.
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


      {/* ========================================
          INTERPRETATION NOTE
      ======================================== */}

      <p
        className="model-description"
        style={{
          marginTop: "22px",
          marginBottom: 0,
        }}
      >
        SHAP 값은 모델 예측에 대한 기여도를 나타내며
        변수와 보험 관심 여부 사이의 인과관계를 의미하지 않습니다.
        또한 서로 연관된 변수는 기여도가 나누어질 수 있으므로
        Total Gain과 SHAP의 순위가 반드시 동일할 필요는 없습니다.
      </p>

    </div>
  );
}