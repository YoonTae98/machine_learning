import {
  modelComparison,
  ensembleResult,
} from "@/data/dashboard";

import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";

export default function ModelComparison() {
  return (
    <div className="dashboard-panel">

      {/* ========================================
          TITLE
      ======================================== */}

      <div className="section-heading">

        <div>
          <span className="eyebrow">
            MODEL COMPARISON
          </span>

          <h2>
            6개 분류 모델 성능 비교
          </h2>

          <p className="model-description">
            초기 전체 Feature(Vintage 포함)를 기준으로
            각 모델의 OOF 예측 성능을 비교했습니다.
            불균형 데이터 특성을 고려해 F1, ROC-AUC, AP를 함께 평가했습니다.
          </p>
        </div>

        <span className="section-note">
          5-Fold OOF
        </span>

      </div>


      {/* ========================================
          MODEL BAR CHART
      ======================================== */}

      <div className="chart-frame">

        <BarChart
          data={modelComparison}
          xDataKey="model"
          aspectRatio="4 / 1"
          margin={{
            top: 28,
            right: 28,
            bottom: 65,
            left: 28,
          }}
          barGap={0.38}
        >

          <Grid horizontal />

          <Bar
            dataKey="f1"
            fill="var(--chart-1)"
            lineCap={14}
            fadedOpacity={0.18}
          />

          <BarXAxis
            showAllLabels
            maxLabels={6}
          />


          {/* ====================================
              CUSTOM HOVER TOOLTIP
          ==================================== */}

          <ChartTooltip
            showCrosshair={false}
            showDots={false}
            showDatePill={false}
            damping={28}
            backgroundColor="rgba(255, 255, 255, 0.80)"

            panelStyle={{
              border:
                "1px solid rgba(100, 120, 190, 0.16)",

              borderRadius: "20px",

              boxShadow:
                "0 20px 55px rgba(65, 82, 135, 0.16)",

              backdropFilter:
                "blur(20px)",

              WebkitBackdropFilter:
                "blur(20px)",

              overflow: "hidden",
            }}

            content={({ point }) => (
              <div className="model-tooltip">

                <div className="model-tooltip-top">

                  <span className="model-tooltip-dot" />

                  <strong>
                    {String(point.model)}
                  </strong>

                </div>


                <div className="model-tooltip-main">

                  <div>
                    <span>
                      F1 SCORE
                    </span>

                    <strong>
                      {Number(point.f1).toFixed(4)}
                    </strong>
                  </div>

                </div>


                <div className="model-tooltip-sub">

                  <div>
                    <span>
                      ROC-AUC
                    </span>

                    <strong>
                      {Number(point.rocAuc).toFixed(4)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      AP
                    </span>

                    <strong>
                      {Number(point.ap).toFixed(4)}
                    </strong>
                  </div>

                </div>

              </div>
            )}
          />

        </BarChart>

      </div>


      {/* ========================================
          RESULT TABLE
      ======================================== */}

      <div className="model-table">

        <div className="model-row model-header">

          <strong>
            Model
          </strong>

          <strong>
            F1
          </strong>

          <strong>
            ROC-AUC
          </strong>

          <strong>
            AP
          </strong>

        </div>


        {modelComparison.map((item) => (

          <div
            className="model-row"
            key={item.model}
          >

            <strong>
              {item.model}
            </strong>

            <span>
              {item.f1.toFixed(4)}
            </span>

            <span>
              {item.rocAuc.toFixed(4)}
            </span>

            <span>
              {item.ap.toFixed(4)}
            </span>

          </div>

        ))}

      </div>


      {/* ========================================
          MODEL SELECTION INSIGHT
      ======================================== */}

      <div
        style={{
          marginTop: "28px",
          padding: "22px 24px",
          borderRadius: "22px",
          border: "1px solid rgba(100, 120, 190, 0.14)",
          background:
            "rgba(247, 249, 255, 0.72)",
        }}
      >

        <span className="eyebrow">
          MODEL SELECTION
        </span>

        <h3
          style={{
            marginTop: "8px",
            marginBottom: "8px",
          }}
        >
          XGBoost 최종 후보 선정
        </h3>

        <p
          className="model-description"
          style={{
            margin: 0,
          }}
        >
          XGBoost, LightGBM, Gradient Boosting의 성능은 매우 유사했지만,
          XGBoost가 ROC-AUC와 AP에서 가장 높은 성능을 보여
          최종 후보 모델로 선정했습니다.
        </p>

      </div>


      {/* ========================================
          SOFT VOTING EXPERIMENT
      ======================================== */}

      <div
        style={{
          marginTop: "20px",
          padding: "24px",
          borderRadius: "22px",
          border: "1px solid rgba(100, 120, 190, 0.14)",
          background:
            "rgba(255, 255, 255, 0.72)",
        }}
      >

        <div className="section-heading">

          <div>

            <span className="eyebrow">
              ADDITIONAL EXPERIMENT
            </span>

            <h3>
              Soft Voting 앙상블
            </h3>

            <p className="model-description">
              상위 모델인 XGBoost, LightGBM,
              Gradient Boosting의 예측 확률을 결합한
              Soft Voting을 추가로 실험했습니다.
            </p>

          </div>

          <span className="section-note">
            Vintage 포함 실험
          </span>

        </div>


        <div className="model-table">

          <div className="model-row model-header">

            <strong>
              Model
            </strong>

            <strong>
              F1
            </strong>

            <strong>
              ROC-AUC
            </strong>

            <strong>
              AP
            </strong>

          </div>


          <div className="model-row">

            <strong>
              {ensembleResult.model}
            </strong>

            <span>
              {ensembleResult.f1.toFixed(4)}
            </span>

            <span>
              {ensembleResult.rocAuc.toFixed(4)}
            </span>

            <span>
              {ensembleResult.ap.toFixed(4)}
            </span>

          </div>

        </div>


        <p
          className="model-description"
          style={{
            marginTop: "18px",
            marginBottom: 0,
          }}
        >
          Soft Voting은 AP와 ROC-AUC가 소폭 상승했지만,
          개선 폭이 매우 작고 세 개 모델을 동시에 운영해야 하는
          복잡성이 증가했습니다. 따라서 최종 모델은
          단일 XGBoost로 유지했습니다.
        </p>

      </div>

    </div>
  );
}