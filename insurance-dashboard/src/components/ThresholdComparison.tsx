import { operatingPointComparison } from "@/data/dashboard";

export default function ThresholdComparison() {
  const f1Optimal = operatingPointComparison[0];
  const recall95 = operatingPointComparison[1];

  const extraCandidates =
    recall95.predictedPositive - f1Optimal.predictedPositive;

  const reducedFN =
    f1Optimal.fn - recall95.fn;

  const additionalTP =
    recall95.tp - f1Optimal.tp;

  const recallGain =
    (recall95.recall - f1Optimal.recall) * 100;

  const precisionChange =
    (recall95.precision - f1Optimal.precision) * 100;

  return (
    <div className="dashboard-panel">

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
          STRATEGY CARDS
      ======================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px",
          marginTop: "24px",
        }}
      >

        {/* F1 OPTIMAL */}

        <div
          style={{
            padding: "24px",
            borderRadius: "22px",
            border:
              "1px solid rgba(100, 120, 190, 0.14)",
            background:
              "rgba(247, 249, 255, 0.72)",
          }}
        >

          <span className="eyebrow">
            BALANCED MODE
          </span>

          <h3 style={{ marginTop: "8px" }}>
            F1 Optimal
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "14px",
              marginTop: "20px",
            }}
          >

            <Metric
              label="Threshold"
              value={f1Optimal.threshold.toFixed(6)}
            />

            <Metric
              label="Precision"
              value={`${(f1Optimal.precision * 100).toFixed(2)}%`}
            />

            <Metric
              label="Recall"
              value={`${(f1Optimal.recall * 100).toFixed(2)}%`}
            />

            <Metric
              label="F1"
              value={f1Optimal.f1.toFixed(4)}
            />

          </div>

          <div
            style={{
              marginTop: "18px",
              paddingTop: "18px",
              borderTop:
                "1px solid rgba(100, 120, 190, 0.12)",
            }}
          >

            <span
              style={{
                display: "block",
                fontSize: "12px",
                opacity: 0.62,
                marginBottom: "5px",
              }}
            >
              PREDICTED POSITIVE
            </span>

            <strong
              style={{
                fontSize: "26px",
              }}
            >
              {f1Optimal.predictedPositive.toLocaleString()}명
            </strong>

          </div>

        </div>


        {/* RECALL 95 */}

        <div
          style={{
            padding: "24px",
            borderRadius: "22px",
            border:
              "1px solid rgba(100, 120, 190, 0.18)",
            background:
              "rgba(255, 255, 255, 0.82)",
          }}
        >

          <span className="eyebrow">
            HIGH CAPTURE MODE
          </span>

          <h3 style={{ marginTop: "8px" }}>
            Recall 95%
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "14px",
              marginTop: "20px",
            }}
          >

            <Metric
              label="Threshold"
              value={recall95.threshold.toFixed(6)}
            />

            <Metric
              label="Precision"
              value={`${(recall95.precision * 100).toFixed(2)}%`}
            />

            <Metric
              label="Recall"
              value={`${(recall95.recall * 100).toFixed(2)}%`}
            />

            <Metric
              label="F1"
              value={recall95.f1.toFixed(4)}
            />

          </div>

          <div
            style={{
              marginTop: "18px",
              paddingTop: "18px",
              borderTop:
                "1px solid rgba(100, 120, 190, 0.12)",
            }}
          >

            <span
              style={{
                display: "block",
                fontSize: "12px",
                opacity: 0.62,
                marginBottom: "5px",
              }}
            >
              PREDICTED POSITIVE
            </span>

            <strong
              style={{
                fontSize: "26px",
              }}
            >
              {recall95.predictedPositive.toLocaleString()}명
            </strong>

          </div>

        </div>

      </div>


      {/* ========================================
          TRADE-OFF SUMMARY
      ======================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginTop: "20px",
        }}
      >

        <Summary
          label="Recall 증가"
          value={`+${recallGain.toFixed(2)}%p`}
          text="관심 고객 탐지 범위 확대"
        />

        <Summary
          label="False Negative 감소"
          value={`-${reducedFN.toLocaleString()}명`}
          text={`${f1Optimal.fn.toLocaleString()} → ${recall95.fn.toLocaleString()}`}
        />

        <Summary
          label="추가 탐지 고객"
          value={`+${additionalTP.toLocaleString()}명`}
          text={`${f1Optimal.tp.toLocaleString()} → ${recall95.tp.toLocaleString()}`}
        />

        <Summary
          label="상담 후보 증가"
          value={`+${extraCandidates.toLocaleString()}명`}
          text={`${f1Optimal.predictedPositive.toLocaleString()} → ${recall95.predictedPositive.toLocaleString()}`}
        />

      </div>


      {/* ========================================
          BUSINESS INTERPRETATION
      ======================================== */}

      <div
        style={{
          marginTop: "22px",
          padding: "22px 24px",
          borderRadius: "22px",
          border:
            "1px solid rgba(100, 120, 190, 0.14)",
          background:
            "rgba(247, 249, 255, 0.72)",
        }}
      >

        <span className="eyebrow">
          BUSINESS INTERPRETATION
        </span>

        <h3
          style={{
            marginTop: "8px",
            marginBottom: "10px",
          }}
        >
          최적 Threshold는 하나로 고정되지 않습니다
        </h3>

        <p
          className="model-description"
          style={{
            margin: 0,
          }}
        >
          Recall 95% 전략은 F1 최적 전략보다 Recall을
          {` ${recallGain.toFixed(2)}%p `}
          높이고 놓치는 관심 고객을
          {` ${reducedFN.toLocaleString()}명 `}
          줄이는 대신, 상담 후보가
          {` ${extraCandidates.toLocaleString()}명 `}
          증가하고 Precision은
          {` ${Math.abs(precisionChange).toFixed(2)}%p `}
          감소합니다.
          따라서 실제 상담 비용, 예산, 상담 가능 인원이 주어진다면
          해당 자원 제약 안에서 최대 Recall을 확보하는 Threshold를
          운영 정책으로 선택할 수 있습니다.
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
    <div>
      <span
        style={{
          display: "block",
          fontSize: "11px",
          opacity: 0.58,
          marginBottom: "4px",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          fontSize: "20px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}


function Summary({
  label,
  value,
  text,
}: {
  label: string;
  value: string;
  text: string;
}) {
  return (
    <div
      style={{
        padding: "18px 20px",
        borderRadius: "18px",
        border:
          "1px solid rgba(100, 120, 190, 0.12)",
      }}
    >

      <span
        style={{
          display: "block",
          fontSize: "11px",
          opacity: 0.58,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: "block",
          fontSize: "22px",
          marginTop: "4px",
        }}
      >
        {value}
      </strong>

      <span
        style={{
          display: "block",
          fontSize: "12px",
          opacity: 0.62,
          marginTop: "5px",
        }}
      >
        {text}
      </span>

    </div>
  );
}
