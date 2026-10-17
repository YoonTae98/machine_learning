import { operatingPointComparison } from "@/data/dashboard";


export default function ThresholdComparison() {

  const f1Optimal =
    operatingPointComparison[0];

  const recall95 =
    operatingPointComparison[1];


  const extraCandidates =
    recall95.predictedPositive -
    f1Optimal.predictedPositive;


  const reducedFN =
    f1Optimal.fn -
    recall95.fn;


  const additionalTP =
    recall95.tp -
    f1Optimal.tp;


  const recallGain =
    (
      recall95.recall -
      f1Optimal.recall
    ) * 100;


  const precisionDrop =
    (
      f1Optimal.precision -
      recall95.precision
    ) * 100;


  return (
    <div className="dashboard-panel threshold-panel">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="section-heading">

        <div>

          <span className="eyebrow">
            OPERATING STRATEGY
          </span>

          <h2>
            Threshold 운영 전략 비교
          </h2>

          <p className="model-description">
            동일한 최종 XGBoost 모델에서 Threshold를 조정해
            균형적인 F1 최적 운영과 관심 고객 탐지를 우선하는
            Recall 95% 운영 전략을 비교했습니다.
          </p>

        </div>

        <span className="section-note">
          F1 Optimal vs Recall 95%
        </span>

      </div>



      {/* ========================================
          STRATEGY COMPARISON
      ======================================== */}

      <div className="threshold-strategy-grid">

        {/* ====================================
            F1 OPTIMAL
        ==================================== */}

        <div className="threshold-strategy-card threshold-balanced">

          <div className="threshold-card-top">

            <span className="threshold-mode-label">
              BALANCED MODE
            </span>

            <span className="threshold-badge threshold-badge-balanced">
              균형 운영
            </span>

          </div>


          <h3>
            F1 Optimal
          </h3>


          <div className="threshold-main-metric">

            <span>
              RECALL
            </span>

            <strong>
              {(f1Optimal.recall * 100).toFixed(2)}
              <small>%</small>
            </strong>

            <p>
              Precision과 Recall의 균형을 고려한
              F1 최대 지점
            </p>

          </div>


          <div className="threshold-metric-grid">

            <Metric
              label="Threshold"
              value={f1Optimal.threshold.toFixed(6)}
            />

            <Metric
              label="Precision"
              value={`${(f1Optimal.precision * 100).toFixed(2)}%`}
            />

            <Metric
              label="F1 Score"
              value={f1Optimal.f1.toFixed(4)}
            />

          </div>


          <div className="threshold-candidate-box">

            <div>

              <span>
                PREDICTED POSITIVE
              </span>

              <strong>
                {f1Optimal.predictedPositive.toLocaleString()}
                <small>명</small>
              </strong>

            </div>

            <p>
              상담 후보 고객
            </p>

          </div>

        </div>



        {/* ====================================
            VS
        ==================================== */}

        <div className="threshold-vs">
          VS
        </div>



        {/* ====================================
            RECALL 95
        ==================================== */}

        <div className="threshold-strategy-card threshold-high-capture">

          <div className="threshold-card-top">

            <span className="threshold-mode-label">
              HIGH CAPTURE MODE
            </span>

            <span className="threshold-badge threshold-badge-recall">
              탐지 우선
            </span>

          </div>


          <h3>
            Recall 95%
          </h3>


          <div className="threshold-main-metric">

            <span>
              RECALL
            </span>

            <strong>
              {(recall95.recall * 100).toFixed(2)}
              <small>%</small>
            </strong>

            <p>
              관심 고객을 최대한 놓치지 않는
              고탐지 운영 지점
            </p>

          </div>


          <div className="threshold-metric-grid">

            <Metric
              label="Threshold"
              value={recall95.threshold.toFixed(6)}
            />

            <Metric
              label="Precision"
              value={`${(recall95.precision * 100).toFixed(2)}%`}
            />

            <Metric
              label="F1 Score"
              value={recall95.f1.toFixed(4)}
            />

          </div>


          <div className="threshold-candidate-box">

            <div>

              <span>
                PREDICTED POSITIVE
              </span>

              <strong>
                {recall95.predictedPositive.toLocaleString()}
                <small>명</small>
              </strong>

            </div>

            <p>
              상담 후보 고객
            </p>

          </div>

        </div>

      </div>



      {/* ========================================
          RECALL CHANGE
      ======================================== */}

      <div className="threshold-recall-flow">

        <div>

          <span>
            F1 Optimal Recall
          </span>

          <strong>
            {(f1Optimal.recall * 100).toFixed(2)}%
          </strong>

        </div>


        <div className="threshold-flow-line">

          <span>
            +{recallGain.toFixed(2)}%
          </span>

          <div>
            <i />
          </div>

        </div>


        <div>

          <span>
            Recall 95% Strategy
          </span>

          <strong>
            {(recall95.recall * 100).toFixed(2)}%
          </strong>

        </div>

      </div>



      {/* ========================================
          TRADE-OFF SUMMARY
      ======================================== */}

      <div className="threshold-summary-grid">

        <Summary
          type="recall"
          label="Recall 증가"
          value={`+${recallGain.toFixed(2)}%p`}
          text="관심 고객 탐지 범위 확대"
        />

        <Summary
          type="fn"
          label="False Negative 감소"
          value={`-${reducedFN.toLocaleString()}명`}
          text={`${f1Optimal.fn.toLocaleString()} → ${recall95.fn.toLocaleString()}`}
        />

        <Summary
          type="tp"
          label="추가 탐지 고객"
          value={`+${additionalTP.toLocaleString()}명`}
          text={`${f1Optimal.tp.toLocaleString()} → ${recall95.tp.toLocaleString()}`}
        />

        <Summary
          type="candidate"
          label="상담 후보 증가"
          value={`+${extraCandidates.toLocaleString()}명`}
          text={`${f1Optimal.predictedPositive.toLocaleString()} → ${recall95.predictedPositive.toLocaleString()}`}
        />

      </div>



      {/* ========================================
          TRADE OFF BANNER
      ======================================== */}

      <div className="threshold-tradeoff-banner">

        <div className="threshold-tradeoff-side">

          <span>
            BENEFIT
          </span>

          <strong>
            FN {reducedFN.toLocaleString()}명 감소
          </strong>

          <p>
            실제 관심 고객을 놓치는 위험 감소
          </p>

        </div>


        <div className="threshold-tradeoff-center">
          ↔
        </div>


        <div className="threshold-tradeoff-side">

          <span>
            COST
          </span>

          <strong>
            후보 {extraCandidates.toLocaleString()}명 증가
          </strong>

          <p>
            추가 상담·마케팅 자원 필요
          </p>

        </div>

      </div>



      {/* ========================================
          BUSINESS INTERPRETATION
      ======================================== */}

      <div className="threshold-business-note">

        <div>

          <span className="eyebrow">
            BUSINESS INTERPRETATION
          </span>

          <h3>
            최적 Threshold는 하나로 고정되지 않습니다
          </h3>

        </div>


        <p>
          Recall 95% 전략은 Recall을
          <strong>
            {" "}+{recallGain.toFixed(2)}%{" "}
          </strong>
          높이고 False Negative를
          <strong>
            {" "}{reducedFN.toLocaleString()}명{" "}
          </strong>
          줄이는 대신, 상담 후보가
          <strong>
            {" "}+{extraCandidates.toLocaleString()}명{" "}
          </strong>
          증가하고 Precision은
          <strong>
            {" "}-{precisionDrop.toFixed(2)}%{" "}
          </strong>
          감소합니다.
          실제 상담 비용, 예산, 상담 가능 인원이 주어진다면
          해당 자원 제약 안에서 최대 Recall을 확보하는
          Threshold를 운영 정책으로 선택할 수 있습니다.
        </p>

      </div>

    </div>
  );
}



function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div className="threshold-small-metric">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}



function Summary({
  type,
  label,
  value,
  text,
}: {
  type: string;
  label: string;
  value: string;
  text: string;
}) {

  return (
    <div
      className={`threshold-summary-card threshold-summary-${type}`}
    >

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <p>
        {text}
      </p>

    </div>
  );
}