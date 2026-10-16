import {
  useEffect,
  useMemo,
  useState,
  type PointerEvent,
} from "react";


type CategoryPoint = {
  label: string;
  responseRate: number;
  count: number;
  value?: number;
};


type AgePoint = {
  age: number;
  responseRate: number;
  count: number;
};


type RelationshipData = {
  baseline: number;

  vehicleDamage: CategoryPoint[];
  previouslyInsured: CategoryPoint[];
  age: AgePoint[];
  vehicleAge: CategoryPoint[];

  heatmap: {
    columns: string[];
    values: number[][];
  };
};


const AGE_WIDTH = 560;
const AGE_HEIGHT = 260;

const AGE_MARGIN = {
  top: 24,
  right: 20,
  bottom: 42,
  left: 52,
};


function CategoryBars({
  items,
  maxRate = 0.32,
}: {
  items: CategoryPoint[];
  maxRate?: number;
}) {
  return (
    <div className="relationship-bars">

      {items.map((item) => {

        const pct =
          item.responseRate * 100;

        const width =
          Math.min(
            100,
            (item.responseRate / maxRate) * 100
          );

        return (
          <div
            className="relationship-bar-item"
            key={item.label}
          >

            <div className="relationship-bar-top">

              <strong>
                {item.label}
              </strong>

              <span>
                {pct.toFixed(2)}%
              </span>

            </div>


            <div className="relationship-track">

              <div
                className="relationship-fill"
                style={{
                  width: `${width}%`,
                }}
              />

            </div>


            <small>
              n = {item.count.toLocaleString()}
            </small>

          </div>
        );
      })}

    </div>
  );
}


function AgeChart({
  points,
  baseline,
}: {
  points: AgePoint[];
  baseline: number;
}) {

  const [hover,
    setHover] =
    useState<AgePoint | null>(null);


  const minAge =
    Math.min(
      ...points.map(
        (point) => point.age
      )
    );


  const maxAge =
    Math.max(
      ...points.map(
        (point) => point.age
      )
    );


  const maxRate =
    Math.max(
      ...points.map(
        (point) =>
          point.responseRate
      )
    );


  const yMax =
    Math.max(
      0.35,
      Math.ceil(
        maxRate * 10
      ) / 10
    );


  const plotWidth =
    AGE_WIDTH -
    AGE_MARGIN.left -
    AGE_MARGIN.right;


  const plotHeight =
    AGE_HEIGHT -
    AGE_MARGIN.top -
    AGE_MARGIN.bottom;


  const scaleX = (
    age: number
  ) =>
    AGE_MARGIN.left +
    (
      (age - minAge) /
      (maxAge - minAge)
    ) *
    plotWidth;


  const scaleY = (
    value: number
  ) =>
    AGE_MARGIN.top +
    (
      1 -
      value / yMax
    ) *
    plotHeight;


  const path =
    points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"} ${scaleX(point.age)} ${scaleY(point.responseRate)}`
      )
      .join(" ");


  const handlePointerMove = (
    event:
      PointerEvent<SVGSVGElement>
  ) => {

    const rect =
      event.currentTarget
        .getBoundingClientRect();


    const svgX =
      (
        (
          event.clientX -
          rect.left
        ) /
        rect.width
      ) *
      AGE_WIDTH;


    let closest =
      points[0];

    let best =
      Math.abs(
        scaleX(closest.age) -
        svgX
      );


    for (
      const point
      of points
    ) {

      const distance =
        Math.abs(
          scaleX(point.age) -
          svgX
        );


      if (distance < best) {

        closest =
          point;

        best =
          distance;

      }

    }


    setHover(
      closest
    );
  };


  const yTicks = [
    0,
    yMax / 2,
    yMax,
  ];


  return (
    <div className="age-chart-wrap">

      <svg
        viewBox={`0 0 ${AGE_WIDTH} ${AGE_HEIGHT}`}
        className="age-chart-svg"
        onPointerMove={
          handlePointerMove
        }
        onPointerLeave={() =>
          setHover(null)
        }
      >

        <defs>

          <linearGradient
            id="age-line-gradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >

            <stop
              offset="0%"
              stopColor="#6379ee"
            />

            <stop
              offset="100%"
              stopColor="#48b8d8"
            />

          </linearGradient>

        </defs>


        {yTicks.map(
          (tick) => (

            <g key={tick}>

              <line
                x1={
                  AGE_MARGIN.left
                }
                x2={
                  AGE_WIDTH -
                  AGE_MARGIN.right
                }
                y1={
                  scaleY(tick)
                }
                y2={
                  scaleY(tick)
                }
                className="relationship-grid"
              />


              <text
                x={
                  AGE_MARGIN.left - 10
                }
                y={
                  scaleY(tick) + 4
                }
                textAnchor="end"
                className="relationship-axis-number"
              >
                {(tick * 100).toFixed(0)}%
              </text>

            </g>

          )
        )}


        {/* 전체 Response 비율 */}

        <line
          x1={AGE_MARGIN.left}
          x2={
            AGE_WIDTH -
            AGE_MARGIN.right
          }
          y1={
            scaleY(baseline)
          }
          y2={
            scaleY(baseline)
          }
          className="relationship-baseline"
        />


        <path
          d={path}
          fill="none"
          stroke="url(#age-line-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />


        <text
          x={
            AGE_MARGIN.left
          }
          y={
            AGE_HEIGHT - 12
          }
          className="relationship-axis-number"
        >
          {minAge}
        </text>


        <text
          x={
            AGE_WIDTH -
            AGE_MARGIN.right
          }
          y={
            AGE_HEIGHT - 12
          }
          textAnchor="end"
          className="relationship-axis-number"
        >
          {maxAge}
        </text>


        <text
          x={AGE_WIDTH / 2}
          y={
            AGE_HEIGHT - 10
          }
          textAnchor="middle"
          className="relationship-axis-label"
        >
          Age
        </text>


        {hover && (
          <>

            <line
              x1={
                scaleX(
                  hover.age
                )
              }
              x2={
                scaleX(
                  hover.age
                )
              }
              y1={
                AGE_MARGIN.top
              }
              y2={
                AGE_MARGIN.top +
                plotHeight
              }
              className="relationship-hover-line"
            />


            <circle
              cx={
                scaleX(
                  hover.age
                )
              }
              cy={
                scaleY(
                  hover.responseRate
                )
              }
              r="6"
              className="relationship-hover-point"
            />


            <g
              transform={`
                translate(
                  ${
                    scaleX(
                      hover.age
                    ) >
                    AGE_WIDTH - 160
                      ? scaleX(
                          hover.age
                        ) - 145
                      : scaleX(
                          hover.age
                        ) + 10
                  },
                  ${
                    Math.max(
                      8,
                      scaleY(
                        hover.responseRate
                      ) - 38
                    )
                  }
                )
              `}
            >

              <rect
                width="135"
                height="60"
                rx="12"
                className="relationship-tooltip-bg"
              />


              <text
                x="12"
                y="23"
                className="relationship-tooltip-title"
              >
                Age {hover.age}
              </text>


              <text
                x="12"
                y="44"
                className="relationship-tooltip-value"
              >
                Response {(hover.responseRate * 100).toFixed(2)}%
              </text>

            </g>

          </>
        )}

      </svg>

    </div>
  );
}


export default function FeatureRelationships() {

  const [data, setData] =
    useState<RelationshipData | null>(
      null
    );


  useEffect(() => {

    fetch(
      "/feature_relationships.json"
    )

      .then(
        (response) =>
          response.json()
      )

      .then(
        (json) =>
          setData(json)
      );

  }, []);


  const vehicleDamage =
    useMemo(
      () =>
        data?.vehicleDamage ?? [],
      [data]
    );


  if (!data) {

    return (
      <div className="dashboard-panel">
        데이터 불러오는 중...
      </div>
    );

  }


  return (
    <div className="dashboard-panel relationship-panel">

      {/* HEADER */}

      <div className="section-heading">

        <div>

          <span className="eyebrow">
            FEATURE RELATIONSHIP
          </span>

          <h2>
            주요 Feature와 Response 관계
          </h2>

          <p className="model-description">
            주요 변수별 실제 보험 관심 고객 비율을 비교하여
            Response와의 관계를 확인합니다.
          </p>

        </div>


        <div className="relationship-baseline-badge">

          <span>
            전체 Response=1
          </span>

          <strong>
            {(data.baseline * 100).toFixed(2)}%
          </strong>

        </div>

      </div>



      {/* GRID */}

      <div className="relationship-grid-layout">

        {/* VEHICLE DAMAGE */}

        <div className="relationship-card">

          <div className="relationship-card-header">

            <div>

              <span>
                FEATURE 01
              </span>

              <h3>
                Vehicle Damage
              </h3>

            </div>


            <strong className="relationship-highlight">
              23.77%
            </strong>

          </div>


          <p>
            차량 손상 여부에 따라 보험 관심률 차이가
            매우 크게 나타납니다.
          </p>


          <CategoryBars
            items={
              vehicleDamage
            }
          />

        </div>



        {/* PREVIOUSLY INSURED */}

        <div className="relationship-card">

          <div className="relationship-card-header">

            <div>

              <span>
                FEATURE 02
              </span>

              <h3>
                Previously Insured
              </h3>

            </div>


            <strong className="relationship-highlight">
              22.55%
            </strong>

          </div>


          <p>
            기존 보험이 없는 고객에서 관심률이
            훨씬 높게 나타납니다.
          </p>


          <CategoryBars
            items={
              data.previouslyInsured
            }
          />

        </div>



        {/* AGE */}

        <div className="relationship-card relationship-age-card">

          <div className="relationship-card-header">

            <div>

              <span>
                FEATURE 03
              </span>

              <h3>
                Age
              </h3>

            </div>

          </div>


          <p>
            실제 연령별 Response=1 비율 변화를
            연속적으로 확인합니다.
          </p>


          <AgeChart
            points={
              data.age
            }
            baseline={
              data.baseline
            }
          />

        </div>



        {/* VEHICLE AGE */}

        <div className="relationship-card">

          <div className="relationship-card-header">

            <div>

              <span>
                FEATURE 04
              </span>

              <h3>
                Vehicle Age
              </h3>

            </div>


            <strong className="relationship-highlight">
              29.37%
            </strong>

          </div>


          <p>
            차량 연식이 오래된 범주에서 관심률이
            더 높게 관찰됩니다.
          </p>


          <CategoryBars
            items={
              data.vehicleAge
            }
          />

        </div>

      </div>

    </div>
  );
}
