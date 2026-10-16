import {
  useEffect,
  useMemo,
  useState,
  type PointerEvent,
} from "react";


type CurvePoint = {
  x: number;
  y: number;
};


type CurveData = {
  summary: {
    rocAuc: number;
    ap: number;
    baseline: number;
    threshold: number;
    precision: number;
    recall: number;
    f1: number;
    fpr: number;
    tpr: number;
  };

  roc: CurvePoint[];
  pr: CurvePoint[];
};


type ChartProps = {
  type: "roc" | "pr";
  points: CurvePoint[];
  data: CurveData;
};


const WIDTH = 560;
const HEIGHT = 370;

const MARGIN = {
  top: 25,
  right: 25,
  bottom: 60,
  left: 65,
};


const plotWidth =
  WIDTH - MARGIN.left - MARGIN.right;

const plotHeight =
  HEIGHT - MARGIN.top - MARGIN.bottom;


function scaleX(value: number) {
  return (
    MARGIN.left +
    value * plotWidth
  );
}


function scaleY(value: number) {
  return (
    MARGIN.top +
    (1 - value) * plotHeight
  );
}


function makePath(
  points: CurvePoint[]
) {
  if (!points.length) {
    return "";
  }

  return points
    .map((point, index) => {

      const x =
        scaleX(point.x);

      const y =
        scaleY(point.y);

      return `
        ${index === 0 ? "M" : "L"}
        ${x}
        ${y}
      `;

    })
    .join(" ");
}


function makeAreaPath(
  points: CurvePoint[]
) {
  if (!points.length) {
    return "";
  }

  const line =
    makePath(points);

  const first =
    points[0];

  const last =
    points[
      points.length - 1
    ];

  return `
    ${line}
    L ${scaleX(last.x)} ${scaleY(0)}
    L ${scaleX(first.x)} ${scaleY(0)}
    Z
  `;
}


function CurveChart({
  type,
  points,
  data,
}: ChartProps) {

  const [hoverPoint, setHoverPoint] =
    useState<CurvePoint | null>(null);


  const path =
    useMemo(
      () =>
        makePath(points),
      [points]
    );


  const areaPath =
    useMemo(
      () =>
        makeAreaPath(points),
      [points]
    );


  const isROC =
    type === "roc";


  const operatingPoint =
    isROC
      ? {
          x: data.summary.fpr,
          y: data.summary.tpr,
        }
      : {
          x: data.summary.recall,
          y: data.summary.precision,
        };


  const handlePointerMove = (
    event:
      PointerEvent<SVGSVGElement>
  ) => {

    if (!points.length) {
      return;
    }


    const rect =
      event
        .currentTarget
        .getBoundingClientRect();


    const svgX =
      (
        (
          event.clientX -
          rect.left
        ) /
        rect.width
      ) *
      WIDTH;


    const dataX =
      Math.max(
        0,
        Math.min(
          1,
          (
            svgX -
            MARGIN.left
          ) /
          plotWidth
        )
      );


    let closest =
      points[0];


    let minDistance =
      Math.abs(
        closest.x -
        dataX
      );


    for (
      const point
      of points
    ) {

      const distance =
        Math.abs(
          point.x -
          dataX
        );


      if (
        distance <
        minDistance
      ) {

        closest =
          point;

        minDistance =
          distance;

      }

    }


    setHoverPoint(
      closest
    );
  };


  const ticks = [
    0,
    0.25,
    0.5,
    0.75,
    1,
  ];


  return (
    <div className="curve-card">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="curve-header">

        <div>

          <span className="curve-label">

            {isROC
              ? "ROC CURVE"
              : "PRECISION–RECALL"}

          </span>


          <h3>

            {isROC
              ? "Receiver Operating Characteristic"
              : "Precision–Recall Curve"}

          </h3>

        </div>


        <div
          className={
            isROC
              ? "curve-score roc-score"
              : "curve-score pr-score"
          }
        >

          <span>

            {isROC
              ? "ROC-AUC"
              : "AP"}

          </span>


          <strong>

            {isROC
              ? data.summary.rocAuc.toFixed(4)
              : data.summary.ap.toFixed(4)}

          </strong>

        </div>

      </div>



      {/* =====================================
          GRAPH
      ===================================== */}

      <div className="curve-svg-wrapper">

        <svg
          className="curve-svg"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={
            isROC
              ? "ROC Curve"
              : "Precision Recall Curve"
          }
          onPointerMove={
            handlePointerMove
          }
          onPointerLeave={() =>
            setHoverPoint(null)
          }
        >

          <defs>

            {/* ROC / PR LINE */}

            <linearGradient
              id={`${type}-line-gradient`}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >

              <stop
                offset="0%"
                stopColor={
                  isROC
                    ? "#6377ee"
                    : "#7d62df"
                }
              />

              <stop
                offset="100%"
                stopColor={
                  isROC
                    ? "#48b8dd"
                    : "#e25b91"
                }
              />

            </linearGradient>


            {/* AREA */}

            <linearGradient
              id={`${type}-area-gradient`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >

              <stop
                offset="0%"
                stopColor={
                  isROC
                    ? "#647aee"
                    : "#c765ce"
                }
                stopOpacity="0.20"
              />

              <stop
                offset="100%"
                stopColor={
                  isROC
                    ? "#647aee"
                    : "#db6aa4"
                }
                stopOpacity="0.01"
              />

            </linearGradient>

          </defs>



          {/* =================================
              GRID
          ================================= */}

          {ticks.map(
            (tick) => (

              <g
                key={`grid-${tick}`}
              >

                <line
                  x1={
                    scaleX(tick)
                  }
                  y1={
                    scaleY(0)
                  }
                  x2={
                    scaleX(tick)
                  }
                  y2={
                    scaleY(1)
                  }
                  className="curve-grid"
                />


                <line
                  x1={
                    scaleX(0)
                  }
                  y1={
                    scaleY(tick)
                  }
                  x2={
                    scaleX(1)
                  }
                  y2={
                    scaleY(tick)
                  }
                  className="curve-grid"
                />

              </g>

            )
          )}



          {/* =================================
              BASELINE
          ================================= */}

          {isROC ? (

            <line
              x1={
                scaleX(0)
              }
              y1={
                scaleY(0)
              }
              x2={
                scaleX(1)
              }
              y2={
                scaleY(1)
              }
              className="roc-baseline"
            />

          ) : (

            <line
              x1={
                scaleX(0)
              }
              y1={
                scaleY(
                  data.summary.baseline
                )
              }
              x2={
                scaleX(1)
              }
              y2={
                scaleY(
                  data.summary.baseline
                )
              }
              className="pr-baseline"
            />

          )}



          {/* =================================
              AREA
          ================================= */}

          <path
            d={areaPath}
            fill={`url(#${type}-area-gradient)`}
          />



          {/* =================================
              CURVE
          ================================= */}

          <path
            d={path}
            fill="none"
            stroke={`url(#${type}-line-gradient)`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />



          {/* =================================
              FINAL OPERATING POINT
          ================================= */}

          <circle
            cx={
              scaleX(
                operatingPoint.x
              )
            }
            cy={
              scaleY(
                operatingPoint.y
              )
            }
            r="10"
            className={
              isROC
                ? "operating-halo roc-operating-halo"
                : "operating-halo pr-operating-halo"
            }
          />


          <circle
            cx={
              scaleX(
                operatingPoint.x
              )
            }
            cy={
              scaleY(
                operatingPoint.y
              )
            }
            r="5"
            className={
              isROC
                ? "operating-point roc-operating-point"
                : "operating-point pr-operating-point"
            }
          />



          {/* =================================
              HOVER
          ================================= */}

          {hoverPoint && (
            <>

              <line
                x1={
                  scaleX(
                    hoverPoint.x
                  )
                }
                y1={
                  MARGIN.top
                }
                x2={
                  scaleX(
                    hoverPoint.x
                  )
                }
                y2={
                  scaleY(0)
                }
                className="curve-hover-line"
              />


              <circle
                cx={
                  scaleX(
                    hoverPoint.x
                  )
                }
                cy={
                  scaleY(
                    hoverPoint.y
                  )
                }
                r="5"
                className={
                  isROC
                    ? "curve-hover-point roc-hover-point"
                    : "curve-hover-point pr-hover-point"
                }
              />


              <g
                transform={`
                  translate(
                    ${
                      scaleX(
                        hoverPoint.x
                      ) >
                      WIDTH - 180

                        ? scaleX(
                            hoverPoint.x
                          ) - 155

                        : scaleX(
                            hoverPoint.x
                          ) + 12
                    },

                    ${
                      Math.max(
                        20,
                        scaleY(
                          hoverPoint.y
                        ) - 38
                      )
                    }
                  )
                `}
              >

                <rect
                  width="145"
                  height="62"
                  rx="13"
                  className={
                    isROC
                      ? "curve-tooltip-bg roc-tooltip-bg"
                      : "curve-tooltip-bg pr-tooltip-bg"
                  }
                />


                <text
                  x="12"
                  y="24"
                  className="curve-tooltip-label"
                >

                  {isROC
                    ? `FPR ${hoverPoint.x.toFixed(3)}`
                    : `Recall ${hoverPoint.x.toFixed(3)}`}

                </text>


                <text
                  x="12"
                  y="46"
                  className={
                    isROC
                      ? "curve-tooltip-value roc-tooltip-value"
                      : "curve-tooltip-value pr-tooltip-value"
                  }
                >

                  {isROC
                    ? `TPR ${hoverPoint.y.toFixed(3)}`
                    : `Precision ${hoverPoint.y.toFixed(3)}`}

                </text>

              </g>

            </>
          )}



          {/* =================================
              AXIS TICKS
          ================================= */}

          {ticks.map(
            (tick) => (

              <g
                key={`tick-${tick}`}
              >

                <text
                  x={
                    scaleX(tick)
                  }
                  y={
                    HEIGHT - 33
                  }
                  textAnchor="middle"
                  className="curve-axis-number"
                >
                  {tick.toFixed(2)}
                </text>


                <text
                  x={
                    MARGIN.left - 15
                  }
                  y={
                    scaleY(tick) + 4
                  }
                  textAnchor="end"
                  className="curve-axis-number"
                >
                  {tick.toFixed(2)}
                </text>

              </g>

            )
          )}



          {/* =================================
              AXIS LABEL
          ================================= */}

          <text
            x={
              MARGIN.left +
              plotWidth / 2
            }
            y={
              HEIGHT - 7
            }
            textAnchor="middle"
            className="curve-axis-label"
          >

            {isROC
              ? "False Positive Rate"
              : "Recall"}

          </text>


          <text
            transform={`
              translate(
                18,
                ${
                  MARGIN.top +
                  plotHeight / 2
                }
              )
              rotate(-90)
            `}
            textAnchor="middle"
            className="curve-axis-label"
          >

            {isROC
              ? "True Positive Rate"
              : "Precision"}

          </text>

        </svg>

      </div>



      {/* =====================================
          FOOTER / LEGEND
      ===================================== */}

      <div className="curve-footer">

        {isROC ? (

          <>
            <div>

              <span className="curve-key curve-key-random" />

              <span>
                Random classifier
              </span>

            </div>


            <div>

              <span className="curve-key curve-key-point roc-key-point" />

              <span>
                Final threshold{" "}
                {data.summary.threshold.toFixed(4)}
              </span>

            </div>
          </>

        ) : (

          <>
            <div>

              <span className="curve-key curve-key-baseline" />

              <span>
                Positive baseline{" "}
                {(data.summary.baseline * 100).toFixed(2)}%
              </span>

            </div>


            <div>

              <span className="curve-key curve-key-point pr-key-point" />

              <span>
                P{" "}
                {data.summary.precision.toFixed(3)}
                {" · "}
                R{" "}
                {data.summary.recall.toFixed(3)}
              </span>

            </div>
          </>

        )}

      </div>

    </div>
  );
}



export default function PerformanceCurves() {

  const [data, setData] =
    useState<CurveData | null>(
      null
    );


  const [error, setError] =
    useState(false);



  useEffect(() => {

    fetch(
      "/model_curves.json"
    )

      .then(
        (response) => {

          if (
            !response.ok
          ) {

            throw new Error(
              "Curve data load failed"
            );

          }


          return (
            response.json()
          );

        }
      )


      .then(
        (json) => {

          setData(
            json
          );

        }
      )


      .catch(
        () => {

          setError(
            true
          );

        }
      );

  }, []);



  if (error) {

    return (
      <div className="dashboard-panel">

        <span className="eyebrow">
          MODEL PERFORMANCE
        </span>

        <h2>
          ROC & Precision–Recall
        </h2>

        <p className="panel-description">
          model_curves.json을 불러오지 못했습니다.
        </p>

      </div>
    );

  }



  if (!data) {

    return (
      <div className="dashboard-panel curves-loading">

        <span>
          ROC / PR Curve 불러오는 중...
        </span>

      </div>
    );

  }



  return (
    <div className="dashboard-panel performance-panel">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="section-heading">

        <div>

          <span className="eyebrow">
            MODEL PERFORMANCE
          </span>


          <h2>
            ROC & Precision–Recall Curves
          </h2>


          <p className="model-description">
            Hold-out Validation에서 최종 XGBoost의
            판별 능력과 불균형 데이터 성능을 평가합니다.
          </p>

        </div>


        <span className="section-note">
          Validation · 76,222
        </span>

      </div>



      {/* =====================================
          CURVES
      ===================================== */}

      <div className="performance-grid">

        <CurveChart
          type="roc"
          points={
            data.roc
          }
          data={
            data
          }
        />


        <CurveChart
          type="pr"
          points={
            data.pr
          }
          data={
            data
          }
        />

      </div>



      {/* =====================================
          FINAL OPERATING POINT
      ===================================== */}

      <div className="performance-summary">

        <div>

          <span>
            FINAL THRESHOLD
          </span>

          <strong>
            {data.summary.threshold.toFixed(4)}
          </strong>

        </div>


        <div>

          <span>
            PRECISION
          </span>

          <strong>
            {(data.summary.precision * 100).toFixed(1)}%
          </strong>

        </div>


        <div>

          <span>
            RECALL
          </span>

          <strong>
            {(data.summary.recall * 100).toFixed(1)}%
          </strong>

        </div>


        <div>

          <span>
            F1
          </span>

          <strong>
            {data.summary.f1.toFixed(4)}
          </strong>

        </div>

      </div>

    </div>
  );
}