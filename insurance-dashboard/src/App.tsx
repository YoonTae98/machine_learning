import "./index.css";

import HeroScene from "@/components/HeroScene";
import MetricCard from "@/components/MetricCard";

import ColumnClassification from "@/components/ColumnClassification";
import PreprocessingStrategy from "@/components/PreprocessingStrategy";
import DataQualityCheck from "@/components/DataQualityCheck";

import FeatureRelationships from "@/components/FeatureRelationships";
import FeatureHeatmap from "@/components/FeatureHeatmap";

import ModelComparison from "@/components/ModelComparison";
import PerformanceCurves from "@/components/PerformanceCurves";
import ThresholdComparison from "@/components/ThresholdComparison";
import ConfusionMatrix from "@/components/ConfusionMatrix";

import FeatureImportance from "@/components/FeatureImportance";
import ShapSummary from "@/components/ShapSummary";

import {
  confusionMatrix,
  finalResult,
  metrics,
  targetDistribution,
} from "@/data/dashboard";


function App() {

  const actualPositive =
    confusionMatrix.tp +
    confusionMatrix.fn;


  return (
    <main className="app">

      {/* ========================================
          HERO
      ======================================== */}

      <section className="hero">

        <HeroScene />

        <div className="hero-glow" />


        <div className="hero-content">

          <span className="hero-kicker">
            MACHINE LEARNING PROJECT · 2026
          </span>


          <h1>
            Insurance
            <br />
            Interest Prediction
          </h1>


          <p className="hero-description">
            보험 관심 고객을 예측해 제한된 상담 자원을
            관심 가능성이 높은 고객에게 우선 배정합니다.
          </p>


          <div className="hero-result">

            <span>
              FINAL MODEL
            </span>

            <strong>
              {finalResult.model}
            </strong>


            <span className="hero-divider" />


            <span>
              Threshold
            </span>

            <strong>
              {finalResult.threshold}
            </strong>

          </div>

        </div>

      </section>



      {/* ========================================
          KPI
      ======================================== */}

      <section className="metrics-section">

        <div className="metrics-grid">

          {metrics.map((metric) => (

            <MetricCard
              key={metric.label}
              {...metric}
            />

          ))}

        </div>

      </section>



      {/* ========================================
          COLUMN CLASSIFICATION
      ======================================== */}

      <section className="content-section">

        <ColumnClassification />

      </section>



      {/* ========================================
          ENCODING / LEAKAGE CONTROL
      ======================================== */}

      <section className="content-section">

        <PreprocessingStrategy />

      </section>



      {/* ========================================
          DATA QUALITY
      ======================================== */}

      <section className="content-section">

        <DataQualityCheck />

      </section>



      {/* ========================================
          FEATURE → RESPONSE
      ======================================== */}

      <section className="content-section">

        <FeatureRelationships />

      </section>



      {/* ========================================
          PHI-K HEATMAP
      ======================================== */}

      <section className="content-section">

        <FeatureHeatmap />

      </section>



      {/* ========================================
          TARGET DISTRIBUTION
      ======================================== */}

      <section className="content-section">

        <div className="dashboard-panel target-panel">

          <div>

            <span className="eyebrow">
              TARGET DISTRIBUTION
            </span>


            <h2>
              Class Imbalance
            </h2>


            <p className="panel-description">
              보험 관심 고객인 Response=1은 전체 데이터의
              약 12.26%로 클래스 불균형이 존재합니다.
              따라서 Accuracy보다 F1, ROC-AUC,
              Average Precision을 중심으로 평가했습니다.
            </p>

          </div>



          <div className="target-bars">

            {targetDistribution.map((item) => (

              <div
                className="target-item"
                key={item.label}
              >

                <div className="target-label">

                  <span>
                    {item.label}
                  </span>

                  <strong>
                    {item.value}%
                  </strong>

                </div>


                <div className="target-track">

                  <div
                    className={`target-fill ${
                      item.label === "Response 1"
                        ? "positive"
                        : ""
                    }`}
                    style={{
                      width:
                        `${item.value}%`,
                    }}
                  />

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>



      {/* ========================================
          MODEL COMPARISON
      ======================================== */}

      <section className="content-section">

        <ModelComparison />

      </section>



      {/* ========================================
          ROC / PR CURVE
      ======================================== */}

      <section className="content-section">

        <PerformanceCurves />

      </section>


      {/* ========================================
          THRESHOLD OPERATING STRATEGY
      ======================================== */}

      <section className="content-section">

        <ThresholdComparison />

      </section>



      {/* ========================================
          CONFUSION MATRIX + FINAL MODEL
      ======================================== */}

      <section className="content-section two-column">

        <ConfusionMatrix />


        <div className="dashboard-panel final-result-panel">

          <span className="eyebrow">
            FINAL OPERATING POINT
          </span>


          <h2>
            Final XGBoost
          </h2>


          <div className="final-score">

            <strong>
              {(finalResult.recall * 100)
                .toFixed(2)}
              %
            </strong>

            <span>
              실제 관심 고객 탐지율
            </span>

          </div>



          <div className="result-stats">

            <div>

              <span>
                Precision
              </span>

              <strong>
                {finalResult.precision
                  .toFixed(4)}
              </strong>

            </div>


            <div>

              <span>
                Recall
              </span>

              <strong>
                {finalResult.recall
                  .toFixed(4)}
              </strong>

            </div>


            <div>

              <span>
                ROC-AUC
              </span>

              <strong>
                {finalResult.rocAuc
                  .toFixed(4)}
              </strong>

            </div>


            <div>

              <span>
                AP
              </span>

              <strong>
                {finalResult.ap
                  .toFixed(4)}
              </strong>

            </div>

          </div>


          <p className="result-explanation">
            실제 보험 관심 고객{" "}
            {actualPositive.toLocaleString()}명 중{" "}
            {confusionMatrix.tp.toLocaleString()}명을
            관심 고객으로 탐지했습니다.
          </p>

        </div>

      </section>



      {/* ========================================
          FEATURE IMPORTANCE
      ======================================== */}

      <section className="content-section">

        <FeatureImportance />

      </section>



      {/* ========================================
          SHAP
      ======================================== */}

      <section className="content-section">

        <ShapSummary />

      </section>



      {/* ========================================
          BUSINESS INSIGHT
      ======================================== */}

      <section className="content-section">

        <div className="dashboard-panel conclusion-panel">

          <span className="eyebrow">
            BUSINESS INSIGHT
          </span>


          <h2>
            상담원을 모든 고객에게
            동일하게 배정할 필요는 없습니다.
          </h2>


          <p>
            본 모델은 보험 가입 여부를 자동 결정하는 모델이 아니라,
            관심 가능성이 높은 고객을 우선 선별하여
            상담 자원의 우선순위 결정을 지원하는 모델입니다.
          </p>



          <div className="limitation-grid">

            <div>

              <span>
                LIMITATION 01
              </span>

              <strong>
                Precision 33.1%
              </strong>

              <p>
                관심 고객 탐지율을 높이는 과정에서
                False Positive가 함께 증가했습니다.
              </p>

            </div>



            <div>

              <span>
                LIMITATION 02
              </span>

              <strong>
                고객 행동정보 부족
              </strong>

              <p>
                소득, 직업, 상담 이력, 기존 보험 상품 등
                실제 고객 행동을 설명할 추가 Feature가 필요합니다.
              </p>

            </div>



            <div>

              <span>
                NEXT STEP
              </span>

              <strong>
                상담 우선순위 시스템
              </strong>

              <p>
                예측 확률을 활용해 고객을 Ranking하고
                상담 대상의 우선순위를 결정할 수 있습니다.
              </p>

            </div>

          </div>

        </div>

      </section>



      {/* ========================================
          FOOTER
      ======================================== */}

      <footer>
        Insurance Interest Prediction · XGBoost
      </footer>

    </main>
  );
}


export default App;