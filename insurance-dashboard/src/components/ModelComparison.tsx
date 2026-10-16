import { modelComparison } from "@/data/dashboard";

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
            모델별 Validation F1 Score
          </h2>

          <p className="model-description">
            각 모델별 최적 Threshold를 적용한
            Hold-out Validation 성능 비교
          </p>
        </div>

        <span className="section-note">
          Optimized Threshold
        </span>

      </div>


      {/* ========================================
          BKLIT BAR CHART
      ======================================== */}

      <div className="chart-frame">

        <BarChart
          data={modelComparison}
          xDataKey="model"
          aspectRatio="4 / 1"
          margin={{
            top: 28,
            right: 28,
            bottom: 55,
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
            maxLabels={4}
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

                {/* 모델 이름 */}

                <div className="model-tooltip-top">

                  <span className="model-tooltip-dot" />

                  <strong>
                    {String(point.model)}
                  </strong>

                </div>


                {/* F1 */}

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


                {/* 세부 지표 */}

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

    </div>
  );
}