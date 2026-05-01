import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Save,
  Cloud,
  Wallet,
  LineChart,
  Globe,
  PieChart,
  Activity,
  Download,
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  Sparkles,
  X,
} from "lucide-react";

// ==========================================
// 🚨 老闆專屬設定區：請在這裡填入您的 Gemini API 鑰匙
// ==========================================
const GEMINI_API_KEY = "AIzaSyDrZeNaGg92a3cOJ5t5AaipdDXEY8t5uaw"; // <--- 如果 Google 在台灣擋免費用戶，留空也沒關係，系統會自動啟用本地備用引擎！

// --- CTO 共用工具區 ---
const formatMoney = (num) =>
  new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(num);
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbxeFuDmvnkydI8BPwtGxJDKJccuNmjexJPYmsEyXWyIdlNE0VFxzuqm2DhTDL5V5DXW/exec";

// 🚀 CTO 升級：AI 智慧代號校正與補零器
const autoFormatTicker = (ticker, isTw) => {
  if (!ticker) return "";
  let cleanTicker = String(ticker).trim().toUpperCase();
  if (cleanTicker === "APPL") return "AAPL";
  if (isTw && !cleanTicker.includes(".")) {
    if (/^\d{2,3}$/.test(cleanTicker)) cleanTicker = "00" + cleanTicker;
    else if (/^\d{2,4}[A-Z]$/.test(cleanTicker) && cleanTicker.length < 6)
      cleanTicker = cleanTicker.padStart(6, "0");
  }
  return cleanTicker;
};

// Google Finance 專屬後端抓價引擎
const fetchPriceFromGoogleBackend = async (ticker, isTw) => {
  if (!ticker) return null;
  try {
    let symbol = ticker;
    if (isTw && !symbol.includes(":")) symbol = `TPE:${symbol}`;
    const url = `${GAS_URL}?action=quote&ticker=${encodeURIComponent(symbol)}`;
    const fetchWithTimeout = (url, ms = 8000) => {
      return Promise.race([
        fetch(url, { redirect: "follow" }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), ms)
        ),
      ]);
    };
    const res = await fetchWithTimeout(url, 8000);
    const data = await res.json();
    if (data.status === "success") return data.price;
    else return null;
  } catch (e) {
    return null;
  }
};

// 一般輸入框元件
const ControlInput = ({ label, value, onChange, icon, unit = "" }) => (
  <div className="flex flex-col">
    <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
      {icon} {label}
    </label>
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="w-full pl-2 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-semibold text-slate-800 transition-all"
        placeholder="0"
      />
      {unit && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">
          {unit}
        </span>
      )}
    </div>
  </div>
);

// 紅黃綠維持率標籤
const RatioBadge = ({ ratio }) => {
  if (ratio === "∞") {
    return (
      <span className="px-2 py-0.5 rounded font-bold bg-green-100 text-green-700">
        ∞ (無借款)
      </span>
    );
  }
  const num = Number(ratio);
  let color = "bg-green-100 text-green-700";
  let label = "✅ 安全";
  if (num < 130) {
    color = "bg-red-100 text-red-700 animate-pulse";
    label = "🔥 斷頭危險";
  } else if (num < 166) {
    color = "bg-orange-100 text-orange-700";
    label = "⚠️ 追繳警戒";
  }
  return (
    <span className={`px-2 py-0.5 rounded font-bold ${color}`}>
      {ratio}% <span className="text-xs ml-1">{label}</span>
    </span>
  );
};

// --- 🌟 完美客製化：絕對網格面積圖 ---
const TrendChart = ({ data }) => {
  const chartData = Array.isArray(data) && data.length > 0 ? data : [];
  const [hoveredIdx, setHoveredIdx] = React.useState(null);

  const baseAsset2025 = 40236351;

  const latestData =
    chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const latestAssets = latestData ? latestData.netAssets : 0;

  const prevAssets =
    chartData.length > 1
      ? chartData[chartData.length - 2].netAssets
      : baseAsset2025;
  const momAmt = latestAssets - prevAssets;
  const momPct = prevAssets > 0 ? (momAmt / prevAssets) * 100 : 0;
  const isMomUp = momAmt >= 0;

  const ytdAmt = latestAssets - baseAsset2025;
  const ytdPct = (ytdAmt / baseAsset2025) * 100;
  const isYtdUp = ytdAmt >= 0;

  const targetYMax = 100000000;

  const width = 1400;
  const height = 400;
  const padding = { top: 90, right: 80, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const yTicks = [];
  for (let v = 0; v <= targetYMax; v += 10000000) yTicks.push(v);

  const points = chartData
    .map((d, idx) => {
      const monthNum = parseInt(d.month.split("-")[1], 10);
      const x = padding.left + ((monthNum - 1) / 11) * chartW;
      const y = padding.top + chartH - (d.netAssets / targetYMax) * chartH;

      const prevMonthAsset =
        idx === 0 ? baseAsset2025 : chartData[idx - 1].netAssets;
      const momRate =
        prevMonthAsset > 0
          ? (((d.netAssets - prevMonthAsset) / prevMonthAsset) * 100).toFixed(1)
          : 0;

      const ytdRate = (
        ((d.netAssets - baseAsset2025) / baseAsset2025) *
        100
      ).toFixed(1);

      return {
        ...d,
        x,
        y,
        momRate: parseFloat(momRate),
        ytdRate: parseFloat(ytdRate),
        monthNum,
      };
    })
    .filter((p) => p.monthNum >= 1 && p.monthNum <= 12);

  const areaPath =
    points.length > 0
      ? `M ${points[0].x} ${padding.top + chartH} ` +
        points.map((p) => `L ${p.x} ${p.y}`).join(" ") +
        ` L ${points[points.length - 1].x} ${padding.top + chartH} Z`
      : "";
  const linePath =
    points.length > 0
      ? `M ${points[0].x} ${points[0].y} ` +
        points
          .slice(1)
          .map((p) => `L ${p.x} ${p.y}`)
          .join(" ")
      : "";

  const formatYLabel = (val) => {
    if (val === 0) return "0";
    if (val === 100000000) return "1億";
    return `${val / 10000}萬`;
  };

  return (
    <div className="w-full mt-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" /> 淨資產成長趨勢
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 ml-6 font-medium">
            *YTD = 今年以來報酬率（基準值 $40,236,351）
          </p>
        </div>

        {chartData.length > 0 && (
          <div className="flex flex-col items-end">
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              ${formatMoney(latestAssets)}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  isMomUp
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                月 {isMomUp ? "▲" : "▼"} {Math.abs(momPct).toFixed(1)}%
              </span>
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  isYtdUp
                    ? "bg-blue-100 text-blue-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                YTD {isYtdUp ? "▲" : "▼"} {Math.abs(ytdPct).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="min-w-[800px] h-[350px]">
          <svg
            className="w-full h-full"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="areaGradientFix" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {yTicks.map((val) => {
              const yPos = padding.top + chartH - (val / targetYMax) * chartH;
              return (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={width - padding.right}
                    y2={yPos}
                    stroke="#f1f5f9"
                    strokeWidth="1.5"
                  />
                  <text
                    x={width - padding.right + 15}
                    y={yPos + 4}
                    textAnchor="start"
                    fontSize="13"
                    fill="#64748b"
                    fontWeight="bold"
                  >
                    {formatYLabel(val)}
                  </text>
                </g>
              );
            })}

            {Array.from({ length: 12 }).map((_, i) => {
              const xPos = padding.left + (i / 11) * chartW;
              return (
                <g key={i}>
                  <line
                    x1={xPos}
                    y1={padding.top}
                    x2={xPos}
                    y2={padding.top + chartH}
                    stroke="#f8fafc"
                    strokeWidth="1.5"
                  />
                  <text
                    x={xPos}
                    y={padding.top + chartH + 25}
                    textAnchor="middle"
                    fontSize="14"
                    fill="#64748b"
                    fontWeight="bold"
                  >
                    {i + 1}月
                  </text>
                </g>
              );
            })}

            <path d={areaPath} fill="url(#areaGradientFix)" />
            <path
              d={linePath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((p, i) => (
              <g key={i}>
                {/* Y軸虛線 */}
                {hoveredIdx === i && (
                  <g>
                    {/* 水平虛線（Y軸方向） */}
                    <line
                      x1={padding.left}
                      y1={p.y}
                      x2={width - padding.right}
                      y2={p.y}
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      strokeDasharray="6,4"
                      opacity="0.7"
                    />
                    {/* 垂直虛線（X軸方向） */}
                    <line
                      x1={p.x}
                      y1={padding.top}
                      x2={p.x}
                      y2={padding.top + chartH}
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      strokeDasharray="6,4"
                      opacity="0.7"
                    />
                  </g>
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                <rect
                  x={p.x - 52}
                  y={p.y - 72}
                  width="104"
                  height="60"
                  rx="6"
                  fill="#ffffff"
                  stroke="#e2e8f0"
                  strokeWidth="1.5"
                  opacity="0.95"
                />

                <text
                  x={p.x}
                  y={p.y - 55}
                  textAnchor="middle"
                  fontSize="13"
                  fill="#1e293b"
                  fontWeight="900"
                >
                  ${formatMoney(p.netAssets)}
                </text>

                <text
                  x={p.x}
                  y={p.y - 38}
                  textAnchor="middle"
                  fontSize="11"
                  fill={p.momRate >= 0 ? "#16a34a" : "#dc2626"}
                  fontWeight="bold"
                >
                  月 {p.momRate >= 0 ? "▲" : "▼"} {Math.abs(p.momRate)}%
                </text>

                <text
                  x={p.x}
                  y={p.y - 21}
                  textAnchor="middle"
                  fontSize="11"
                  fill={p.ytdRate >= 0 ? "#2563eb" : "#ea580c"}
                  fontWeight="bold"
                >
                  YTD {p.ytdRate >= 0 ? "▲" : "▼"} {Math.abs(p.ytdRate)}%
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};

// --- 動態表格 ---
const PortfolioTable = ({
  prefix,
  accountName,
  data,
  metrics,
  handleInputChange,
  handleAddRow,
  handleRemoveRow,
  handleFetchSingleQuote,
}) => {
  const count = parseInt(data[`${prefix}Count`] || 1, 10);
  const rows = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <div className="mb-3 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <div className="w-full overflow-x-auto pb-1">
        <table className="w-full min-w-[700px] text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-200 text-slate-600 text-[11px] uppercase tracking-wider">
              <th className="py-2 px-2 font-semibold w-[18%]">名稱</th>
              <th className="py-2 px-2 font-semibold w-[14%] text-right">
                價位
              </th>
              <th className="py-2 px-2 font-semibold w-[14%] text-right">
                股數
              </th>
              <th className="py-2 px-2 font-semibold w-[22%] text-right">
                總金額
              </th>
              <th className="py-2 px-2 font-semibold w-[12%] text-center text-purple-700">
                曝險
              </th>
              <th className="py-2 px-2 font-semibold w-[12%] text-right">
                佔比
              </th>
              <th className="py-2 px-2 font-semibold w-[8%] text-center"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((num) => {
              const nameField = `${prefix}${num}_name`;
              const priceField = `${prefix}${num}_price`;
              const lotsField = `${prefix}${num}_lots`;
              const expRatioField = `${prefix}${num}_expRatio`;
              const addPriceField = `${prefix}${num}_addPrice`;
              const addLotsField = `${prefix}${num}_addLots`;

              const holdingAmt = metrics[`${prefix}${num}_holdingAmt`];
              const addAmt = metrics[`${prefix}${num}_addAmt`];
              const holdingExpPct = metrics[`${prefix}${num}_holdingExpRatio`];
              const addExpPct = metrics[`${prefix}${num}_addExpRatio`];

              const isFetchingPrice = data[priceField] === "抓取中...";
              const isFailed = data[priceField] === "失敗";
              const priceTextColor = isFetchingPrice
                ? "text-indigo-500 animate-pulse text-[10px]"
                : isFailed
                ? "text-red-500 text-[10px]"
                : "text-slate-800";

              return (
                <React.Fragment key={num}>
                  <tr className="border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                    <td className="p-1.5 align-middle">
                      <input
                        type="text"
                        value={data[nameField] || ""}
                        onChange={(e) =>
                          handleInputChange(
                            accountName,
                            nameField,
                            e.target.value
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleFetchSingleQuote(
                              accountName,
                              prefix,
                              num,
                              e.target.value
                            );
                          }
                        }}
                        placeholder="代碼+Enter"
                        className="w-full p-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 uppercase outline-none transition-all"
                        title="輸入代碼後按下 Enter 即可自動抓取價位"
                      />
                    </td>
                    <td className="p-1.5 align-middle">
                      <input
                        type="text"
                        value={data[priceField] ?? "0"}
                        onChange={(e) =>
                          handleInputChange(
                            accountName,
                            priceField,
                            e.target.value
                          )
                        }
                        className={`w-full p-1.5 border border-slate-200 rounded-md text-xs text-right focus:ring-2 focus:ring-blue-500 font-bold outline-none transition-all ${priceTextColor}`}
                      />
                    </td>
                    <td className="p-1.5 align-middle">
                      <input
                        type="text"
                        value={data[lotsField] ?? "0"}
                        onChange={(e) =>
                          handleInputChange(
                            accountName,
                            lotsField,
                            e.target.value
                          )
                        }
                        className="w-full p-1.5 border border-slate-200 rounded-md text-xs text-right focus:ring-2 focus:ring-blue-500 font-bold outline-none transition-all text-slate-700"
                      />
                    </td>
                    <td className="p-1.5 align-middle text-right text-xs font-black text-slate-800 pr-3">
                      ${formatMoney(holdingAmt)}
                    </td>
                    <td className="p-1.5 align-middle text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="text"
                          value={data[expRatioField] ?? "1"}
                          onChange={(e) =>
                            handleInputChange(
                              accountName,
                              expRatioField,
                              e.target.value
                            )
                          }
                          className="w-10 p-1.5 border border-slate-300 rounded-md text-xs text-center font-black text-purple-700 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        />
                        <span className="text-[10px] text-purple-500 font-bold ml-1">
                          x
                        </span>
                      </div>
                    </td>
                    <td className="p-1.5 align-middle text-right text-xs font-black text-purple-600 pr-3">
                      {holdingExpPct}%
                    </td>
                    <td
                      className="p-1.5 align-middle text-center border-l border-slate-100"
                      rowSpan={2}
                    >
                      {count > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveRow(accountName, prefix, num)
                          }
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                          title="刪除"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300 bg-slate-50/70">
                    <td className="p-1.5 align-middle text-[10px] text-slate-500 font-bold text-right pr-2">
                      ↳ 加碼
                    </td>
                    <td className="p-1.5 align-middle">
                      <input
                        type="text"
                        value={data[addPriceField] ?? "0"}
                        onChange={(e) =>
                          handleInputChange(
                            accountName,
                            addPriceField,
                            e.target.value
                          )
                        }
                        className="w-full p-1.5 border border-slate-200 rounded-md text-xs text-right bg-white focus:ring-2 focus:ring-blue-500 font-bold outline-none transition-all text-slate-600"
                      />
                    </td>
                    <td className="p-1.5 align-middle">
                      <input
                        type="text"
                        value={data[addLotsField] ?? "0"}
                        onChange={(e) =>
                          handleInputChange(
                            accountName,
                            addLotsField,
                            e.target.value
                          )
                        }
                        className="w-full p-1.5 border border-slate-200 rounded-md text-xs text-right bg-white focus:ring-2 focus:ring-blue-500 font-bold outline-none transition-all text-slate-600"
                      />
                    </td>
                    <td className="p-1.5 align-middle text-right text-xs font-black text-indigo-600 pr-3">
                      ${formatMoney(addAmt)}
                    </td>
                    <td className="p-1.5 align-middle text-center text-[10px] text-slate-400 font-medium">
                      同上
                    </td>
                    <td className="p-1.5 align-middle text-right text-xs font-black text-indigo-400 pr-3">
                      {addExpPct}%
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() => handleAddRow(accountName, prefix)}
        className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center gap-1 transition-colors border-t border-slate-200"
      >
        <Plus size={16} /> 新增一筆股票
      </button>
    </div>
  );
};

// 帳戶面板元件
const AccountPanel = ({
  title,
  accountName,
  data,
  metrics,
  handleInputChange,
  handleAddRow,
  handleRemoveRow,
  handleFetchSingleQuote,
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
    <div
      className={`px-5 py-3 text-white font-bold text-lg flex items-center gap-2 ${
        accountName === "SM" ? "bg-indigo-600" : "bg-emerald-600"
      }`}
    >
      <Wallet size={20} />
      {title} 面板
    </div>

    <div className="p-4 flex-1 flex flex-col gap-4">
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-inner">
        <ControlInput
          label="帳戶閒置現金 (不投入市場)"
          value={data.cash}
          onChange={(e) =>
            handleInputChange(accountName, "cash", e.target.value)
          }
        />
      </div>

      <div className="bg-indigo-50/20 p-4 rounded-xl border border-indigo-100">
        <h3 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
          <LineChart size={18} /> 國內部位 (含房地產)
        </h3>
        <PortfolioTable
          prefix="tw"
          accountName={accountName}
          data={data}
          metrics={metrics}
          handleInputChange={handleInputChange}
          handleAddRow={handleAddRow}
          handleRemoveRow={handleRemoveRow}
          handleFetchSingleQuote={handleFetchSingleQuote}
        />
        <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-indigo-100">
          <ControlInput
            label="房地產金額"
            value={data.tw_realEstate}
            onChange={(e) =>
              handleInputChange(accountName, "tw_realEstate", e.target.value)
            }
          />
          <ControlInput
            label="質押借款"
            value={data.tw_marginLoan}
            onChange={(e) =>
              handleInputChange(accountName, "tw_marginLoan", e.target.value)
            }
          />
          <ControlInput
            label="一般負債"
            value={data.tw_debt}
            onChange={(e) =>
              handleInputChange(accountName, "tw_debt", e.target.value)
            }
          />
          <ControlInput
            label="房貸負債"
            value={data.tw_mortgage}
            onChange={(e) =>
              handleInputChange(accountName, "tw_mortgage", e.target.value)
            }
          />
        </div>
      </div>

      <div className="bg-emerald-50/20 p-4 rounded-xl border border-emerald-100">
        <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
          <Globe size={18} /> 國外部位
        </h3>
        <PortfolioTable
          prefix="fn"
          accountName={accountName}
          data={data}
          metrics={metrics}
          handleInputChange={handleInputChange}
          handleAddRow={handleAddRow}
          handleRemoveRow={handleRemoveRow}
          handleFetchSingleQuote={handleFetchSingleQuote}
        />
        <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-emerald-100">
          <ControlInput
            label="一般負債"
            value={data.fn_debt}
            onChange={(e) =>
              handleInputChange(accountName, "fn_debt", e.target.value)
            }
          />
          <ControlInput
            label="質押借款"
            value={data.fn_marginLoan}
            onChange={(e) =>
              handleInputChange(accountName, "fn_marginLoan", e.target.value)
            }
          />
        </div>
      </div>
    </div>

    <div className="bg-slate-800 text-slate-100 p-5 mt-auto">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        <Activity size={14} /> 帳戶結算摘要
      </h4>
      <div className="space-y-3 text-sm font-medium">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <span className="text-slate-300">1. 台/外真實資產比例</span>
          <div className="flex items-center gap-2">
            <span className="text-indigo-400">🇹🇼 {metrics.twRatio}%</span>
            <span className="text-slate-500">/</span>
            <span className="text-emerald-400">🇺🇸 {metrics.foreignRatio}%</span>
          </div>
        </div>
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <span className="text-slate-300">2. 總資產 (實際市值)</span>
          <span className="text-white">
            $ {formatMoney(metrics.totalAssets)}
          </span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <span className="text-slate-300">3. 總負債</span>
          <span className="text-white">
            $ {formatMoney(metrics.liabilities)}
          </span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <span className="text-slate-300">4. 淨資產</span>
          <span className="text-blue-400 font-bold">
            $ {formatMoney(metrics.netAssets)}
          </span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <span className="text-slate-300">5. 曝險總額 (含槓桿倍數)</span>
          <span className="text-purple-400 font-bold">
            $ {formatMoney(metrics.exposure)}
          </span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <span className="text-slate-300">6. 實際槓桿比率</span>
          <span
            className={
              metrics.leverage === "⚠️ 資不抵債"
                ? "text-red-500 font-bold animate-pulse"
                : "text-orange-400 font-bold"
            }
          >
            {metrics.leverage} {metrics.leverage !== "⚠️ 資不抵債" && "倍"}
          </span>
        </div>
        <div className="flex justify-between items-center pt-1">
          <span className="text-slate-300">7. 質押維持率 (現有)</span>
          <RatioBadge ratio={metrics.mrTotalCurrent} />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-300">7. 質押維持率 (加碼後)</span>
          <RatioBadge ratio={metrics.mrTotalAfterAdd} />
        </div>
      </div>
    </div>
  </div>
);

const App = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingQuotes, setIsFetchingQuotes] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");

  const defaultHistory = [
    { month: "2026-01", date: "2026-01-31", netAssets: 48573011 },
    { month: "2026-02", date: "2026-02-28", netAssets: 55688741 },
    { month: "2026-03", date: "2026-03-31", netAssets: 49198326 },
  ];
  const [history, setHistory] = useState(defaultHistory);

  const [sm, setSm] = useState({
    cash: "500000",
    twCount: 1,
    fnCount: 1,
    tw1_name: "00631L",
    tw1_price: "180.5",
    tw1_lots: "10000",
    tw1_addPrice: "0",
    tw1_addLots: "0",
    tw1_expRatio: "2",
    tw_realEstate: "0",
    tw_debt: "0",
    tw_mortgage: "0",
    tw_marginLoan: "800000",
    fn1_name: "SP500",
    fn1_price: "45.2",
    fn1_lots: "20000",
    fn1_addPrice: "0",
    fn1_addLots: "0",
    fn1_expRatio: "1",
    fn_debt: "0",
    fn_marginLoan: "200000",
  });

  const [wl, setWl] = useState({
    cash: "200000",
    twCount: 1,
    fnCount: 1,
    tw1_name: "00631L",
    tw1_price: "180.5",
    tw1_lots: "5000",
    tw1_addPrice: "170",
    tw1_addLots: "2000",
    tw1_expRatio: "2",
    tw_realEstate: "0",
    tw_debt: "0",
    tw_mortgage: "0",
    tw_marginLoan: "500000",
    fn1_name: "SP500",
    fn1_price: "45.2",
    fn1_lots: "10000",
    fn1_addPrice: "0",
    fn1_addLots: "0",
    fn1_expRatio: "1",
    fn_debt: "0",
    fn_marginLoan: "0",
  });

  useEffect(() => {
    document.title = "SM 與 WL資產總覽";

    const metaViewport = document.createElement("meta");
    metaViewport.name = "viewport";
    metaViewport.content =
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0";
    document.head.appendChild(metaViewport);

    const metaAppleCapable = document.createElement("meta");
    metaAppleCapable.name = "apple-mobile-web-app-capable";
    metaAppleCapable.content = "yes";
    document.head.appendChild(metaAppleCapable);

    const metaAppleStatus = document.createElement("meta");
    metaAppleStatus.name = "apple-mobile-web-app-status-bar-style";
    metaAppleStatus.content = "black-translucent";
    document.head.appendChild(metaAppleStatus);

    const iconUrl =
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='128' fill='%23172554'/%3E%3Ctext x='256' y='320' font-family='Times New Roman, serif' font-size='160' font-weight='bold' fill='%23ffffff' text-anchor='middle' letter-spacing='10'%3ES|W%3C/text%3E%3Cline x1='140' y1='360' x2='372' y2='360' stroke='%23ffffff' stroke-width='8' opacity='0.5'/%3E%3C/svg%3E";

    const appleIcon = document.createElement("link");
    appleIcon.rel = "apple-touch-icon";
    appleIcon.href = iconUrl;
    document.head.appendChild(appleIcon);

    const standardIcon = document.createElement("link");
    standardIcon.rel = "icon";
    standardIcon.href = iconUrl;
    document.head.appendChild(standardIcon);
  }, []);

  const loadDataFromSheets = async (isManualClick = false) => {
    if (isManualClick) {
      setIsSaving(true);
      setSaveStatus("");
    }
    try {
      const response = await fetch(GAS_URL, {
        method: "GET",
        redirect: "follow",
      });
      const result = await response.json();

      if (result.status !== "empty" && result.sm && result.wl) {
        const processLoadedData = (loadedAcc) => {
          if (!loadedAcc) return {};
          const twC = parseInt(loadedAcc.twCount || 1, 10);
          const fnC = parseInt(loadedAcc.fnCount || 1, 10);
          const newAcc = {
            tw_mortgage: "0",
            ...loadedAcc,
            twCount: twC,
            fnCount: fnC,
          };

          for (let i = 1; i <= twC; i++) {
            if (newAcc[`tw${i}_name`])
              newAcc[`tw${i}_name`] = autoFormatTicker(
                newAcc[`tw${i}_name`],
                true
              );
          }
          for (let i = 1; i <= fnC; i++) {
            if (newAcc[`fn${i}_name`])
              newAcc[`fn${i}_name`] = autoFormatTicker(
                newAcc[`fn${i}_name`],
                false
              );
          }
          return newAcc;
        };

        if (result.sm.historyData) {
          try {
            let loadedHistory = JSON.parse(result.sm.historyData);
            if (!Array.isArray(loadedHistory)) loadedHistory = [];

            loadedHistory = loadedHistory.filter(
              (h) => !h.month.startsWith("2025")
            );

            const hasJan = loadedHistory.some((h) => h.month === "2026-01");
            const hasFeb = loadedHistory.some((h) => h.month === "2026-02");

            if (!hasJan) loadedHistory.push(defaultHistory[0]);
            if (!hasFeb) loadedHistory.push(defaultHistory[1]);

            // 強制覆蓋三月為正確金額
            const marIdx = loadedHistory.findIndex(
              (h) => h.month === "2026-03"
            );
            const marData = {
              month: "2026-03",
              date: "2026-03-31",
              netAssets: 49198326,
            };
            if (marIdx >= 0) {
              loadedHistory[marIdx] = marData;
            } else {
              loadedHistory.push(marData);
            }
            const aprIdx = loadedHistory.findIndex(
              (h) => h.month === "2026-04"
            );
            const aprData = {
              month: "2026-04",
              date: "2026-04-30",
              netAssets: 60614688,
            };
            if (aprIdx >= 0) {
              loadedHistory[aprIdx] = aprData;
            } else {
              loadedHistory.push(aprData);
            }

            loadedHistory.sort((a, b) => a.month.localeCompare(b.month));
            setHistory(loadedHistory);
          } catch (e) {
            setHistory(defaultHistory);
          }
        } else {
          setHistory(defaultHistory);
        }

        setSm((prev) => ({ ...prev, ...processLoadedData(result.sm) }));
        setWl((prev) => ({ ...prev, ...processLoadedData(result.wl) }));

        if (isManualClick) {
          setSaveStatus("load_success");
          setTimeout(() => setSaveStatus(""), 3000);
        }
      }
    } catch (error) {
      console.error("讀取失敗:", error);
      if (isManualClick) {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus(""), 3000);
      }
    } finally {
      if (isManualClick) setIsSaving(false);
      setIsAppReady(true);
    }
  };

  useEffect(() => {
    if (!document.getElementById("tailwind-cdn")) {
      const script = document.createElement("script");
      script.id = "tailwind-cdn";
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }
    loadDataFromSheets();
  }, []);

  const parseNum = (val) => {
    const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
    return isNaN(num) ? 0 : num;
  };

  const calculateMetrics = (data) => {
    const result = {};
    const cash = parseNum(data.cash);
    const twRealEstate = parseNum(data.tw_realEstate);
    const twDebt = parseNum(data.tw_debt);
    const twMortgage = parseNum(data.tw_mortgage || "0");
    const twMarginLoan = parseNum(data.tw_marginLoan);
    const fnDebt = parseNum(data.fn_debt);
    const fnMarginLoan = parseNum(data.fn_marginLoan);

    const twCount = parseInt(data.twCount || 1, 10);
    const fnCount = parseInt(data.fnCount || 1, 10);

    const processPrefix = (prefix, count) => {
      let holdingTotal = 0;
      let addTotal = 0;
      let holdingExpTotal = 0;
      let addExpTotal = 0;

      for (let i = 1; i <= count; i++) {
        const price = parseNum(data[`${prefix}${i}_price`]);
        const lots = parseNum(data[`${prefix}${i}_lots`]);
        const addPrice = parseNum(data[`${prefix}${i}_addPrice`]);
        const addLots = parseNum(data[`${prefix}${i}_addLots`]);
        const expRatio = parseNum(data[`${prefix}${i}_expRatio`] || 1);

        const holdingAmt = price * lots;
        const addAmt = addPrice * addLots;
        const holdingExpVal = holdingAmt * expRatio;
        const addExpVal = addAmt * expRatio;

        holdingTotal += holdingAmt;
        addTotal += addAmt;
        holdingExpTotal += holdingExpVal;
        addExpTotal += addExpVal;

        result[`${prefix}${i}_holdingAmt`] = holdingAmt;
        result[`${prefix}${i}_addAmt`] = addAmt;
        result[`${prefix}${i}_holdingExpValue`] = holdingExpVal;
        result[`${prefix}${i}_addExpValue`] = addExpVal;
      }
      return { holdingTotal, addTotal, holdingExpTotal, addExpTotal };
    };

    const twRes = processPrefix("tw", twCount);
    const fnRes = processPrefix("fn", fnCount);

    const twAssetsAfterAdd = twRes.holdingTotal + twRes.addTotal + twRealEstate;
    const fnAssetsAfterAdd = fnRes.holdingTotal + fnRes.addTotal;

    result.totalAssets = cash + twAssetsAfterAdd + fnAssetsAfterAdd;
    result.liabilities =
      twDebt + twMortgage + twMarginLoan + (fnDebt + fnMarginLoan);
    result.netAssets = result.totalAssets - result.liabilities;

    result.exposure =
      twRes.holdingExpTotal +
      twRes.addExpTotal +
      fnRes.holdingExpTotal +
      fnRes.addExpTotal +
      twRealEstate;

    result.leverage =
      result.netAssets > 0
        ? (result.exposure / result.netAssets).toFixed(2)
        : "⚠️ 資不抵債";

    const calcExpPct = (expVal) =>
      result.exposure > 0 ? ((expVal / result.exposure) * 100).toFixed(1) : 0;

    for (let i = 1; i <= twCount; i++) {
      result[`tw${i}_holdingExpRatio`] = calcExpPct(
        result[`tw${i}_holdingExpValue`]
      );
      result[`tw${i}_addExpRatio`] = calcExpPct(result[`tw${i}_addExpValue`]);
    }
    for (let i = 1; i <= fnCount; i++) {
      result[`fn${i}_holdingExpRatio`] = calcExpPct(
        result[`fn${i}_holdingExpValue`]
      );
      result[`fn${i}_addExpRatio`] = calcExpPct(result[`fn${i}_addExpValue`]);
    }

    const totalMarginLoan = twMarginLoan + fnMarginLoan;
    const totalCollateralCurrent = twRes.holdingTotal + fnRes.holdingTotal;
    const totalCollateralAfterAdd =
      twRes.holdingTotal +
      twRes.addTotal +
      (fnRes.holdingTotal + fnRes.addTotal);

    result.mrTotalCurrent =
      totalMarginLoan > 0
        ? ((totalCollateralCurrent / totalMarginLoan) * 100).toFixed(1)
        : "∞";
    result.mrTotalAfterAdd =
      totalMarginLoan > 0
        ? ((totalCollateralAfterAdd / totalMarginLoan) * 100).toFixed(1)
        : "∞";

    // 🆕 新增：供全局合併計算用
    result.totalCollateralCurrent = totalCollateralCurrent;
    result.totalMarginLoan = totalMarginLoan;

    const totalConfigured = twAssetsAfterAdd + fnAssetsAfterAdd;
    result.twRatio =
      totalConfigured > 0
        ? ((twAssetsAfterAdd / totalConfigured) * 100).toFixed(1)
        : 0;
    result.foreignRatio =
      totalConfigured > 0
        ? ((fnAssetsAfterAdd / totalConfigured) * 100).toFixed(1)
        : 0;

    return result;
  };

  const smMetrics = calculateMetrics(sm);
  const wlMetrics = calculateMetrics(wl);

  const globalMetrics = {
    totalAssets: smMetrics.totalAssets + wlMetrics.totalAssets,
    liabilities: smMetrics.liabilities + wlMetrics.liabilities,
    netAssets: smMetrics.netAssets + wlMetrics.netAssets,
  };

  const getGlobalTwAssets = (data, metrics) =>
    metrics.twRatio > 0
      ? (metrics.totalAssets - parseNum(data.cash)) * (metrics.twRatio / 100)
      : 0;
  const getGlobalFnAssets = (data, metrics) =>
    metrics.foreignRatio > 0
      ? (metrics.totalAssets - parseNum(data.cash)) *
        (metrics.foreignRatio / 100)
      : 0;

  const globalTw =
    getGlobalTwAssets(sm, smMetrics) + getGlobalTwAssets(wl, wlMetrics);
  const globalFn =
    getGlobalFnAssets(sm, smMetrics) + getGlobalFnAssets(wl, wlMetrics);
  const globalConfigured = globalTw + globalFn;

  globalMetrics.twRatio =
    globalConfigured > 0 ? ((globalTw / globalConfigured) * 100).toFixed(1) : 0;
  globalMetrics.foreignRatio =
    globalConfigured > 0 ? ((globalFn / globalConfigured) * 100).toFixed(1) : 0;

  // 🚀 本地端財富演算法 (斷線備用引擎)
  // ====== 改動 2：generateLocalAdvice 替換維持率計算邏輯 ======
  const generateLocalAdvice = (g, smM, wlM) => {
    const net = g.netAssets;
    const totalLev = ((smM.exposure + wlM.exposure) / net).toFixed(2);

    // ✅ 修正：兩帳戶合併計算維持率
    const combinedLoan =
      (smM.totalMarginLoan || 0) + (wlM.totalMarginLoan || 0);
    const combinedCollateral =
      (smM.totalCollateralCurrent || 0) + (wlM.totalCollateralCurrent || 0);
    const combinedMr =
      combinedLoan > 0
        ? parseFloat(((combinedCollateral / combinedLoan) * 100).toFixed(1))
        : Infinity;

    const twPct = parseFloat(g.twRatio) || 0;
    const fnPct = parseFloat(g.foreignRatio) || 0;

    let advice = "【頂級財富顧問分析報告】\n\n";

    // 整體資產評估（不變）
    advice += "📋 整體資產評估\n";
    if (net >= 100000000)
      advice += `您的淨資產已突破億元大關（$${formatMoney(
        net
      )}），正式進入超高淨值族群，資產保全與傳承規劃應列為首要議題。\n\n`;
    else if (net >= 50000000)
      advice += `您的淨資產達 $${formatMoney(
        net
      )}，屬於高淨值族群，整體財富基礎穩健，建議開始佈局多元資產配置。\n\n`;
    else if (net >= 10000000)
      advice += `您的淨資產為 $${formatMoney(
        net
      )}，財富積累已進入加速期，持續紀律投資是關鍵。\n\n`;
    else
      advice += `您的淨資產為 $${formatMoney(
        net
      )}，財富正在穩步成長，建議持續提高儲蓄率與投資紀律。\n\n`;

    // 槓桿分析（不變）
    advice += "⚖️ 槓桿風險分析\n";
    if (totalLev > 3)
      advice += `⚠️ 警告：實際槓桿高達 ${totalLev} 倍，風險極高！市場若下跌 30% 將嚴重侵蝕淨資產，強烈建議立即降低曝險部位。\n\n`;
    else if (totalLev > 2)
      advice += `注意：槓桿比率 ${totalLev} 倍，處於偏高區間。建議設立停損機制，並保留充足現金因應市場波動。\n\n`;
    else if (totalLev > 1.2)
      advice += `✅ 槓桿比率 ${totalLev} 倍，屬於健康且具成長潛力的合理範圍，請持續監控市場動態。\n\n`;
    else
      advice += `槓桿比率僅 ${totalLev} 倍，配置相對保守穩健，若風險承受度許可，可適度提升曝險以追求更高報酬。\n\n`;

    // ✅ 修正後的維持率評估（使用合併值）
    advice += "🏦 質押維持率評估\n";
    if (combinedMr === Infinity)
      advice += `✅ 目前兩帳戶均無質押借款，財務結構最為穩健，保有最大的操作彈性。\n\n`;
    else if (combinedMr < 130)
      advice += `🔥 緊急警告：合併維持率已跌破 130%（${combinedMr}%），面臨斷頭風險！請立即補繳保證金或出售部分持股降低負債。\n\n`;
    else if (combinedMr < 150)
      advice += `⚠️ 合併維持率 ${combinedMr}%，進入危險警戒區。若大盤再下跌 10-15%，將觸發追繳機制，請密切關注。\n\n`;
    else if (combinedMr < 200)
      advice += `合併維持率 ${combinedMr}%，尚在安全範圍但緩衝空間有限，建議避免再度加碼借貸。\n\n`;
    else
      advice += `✅ 合併維持率 ${combinedMr}%，資金護城河穩固，質押風險極低，財務結構健康。\n\n`;

    // 區域配置（不變）
    advice += "🌏 區域資產配置\n";
    if (twPct > 80)
      advice += `台灣資產佔比高達 ${twPct}%，過度集中單一市場。地緣政治風險可能對整體資產造成重大衝擊，建議逐步將 20-30% 資金移轉至美股分散風險。\n\n`;
    else if (twPct > 60)
      advice += `台灣資產佔 ${twPct}%，配置略為集中，建議持續增加海外部位至 40% 以上。\n\n`;
    else if (fnPct > 80)
      advice += `海外資產佔比達 ${fnPct}%，需留意長期匯率波動風險，適度保留台幣部位可降低匯兌風險。\n\n`;
    else
      advice += `✅ 台外資產比例為 ${twPct}% / ${fnPct}%，配置均衡，展現優秀的全球化分散投資策略。\n\n`;

    // 本月建議（不變）
    advice += "📌 本月操作建議\n";
    const actions = [];
    if (combinedMr < 150 && combinedMr !== Infinity)
      actions.push("優先補繳保證金或減少借貸");
    if (totalLev > 2) actions.push("逐步降低整體曝險部位");
    if (twPct > 70) actions.push("增加海外資產配置比例");
    if (actions.length === 0) actions.push("維持現有策略，定期檢視資產配置");
    actions.push("月底記得按「儲存至試算表」記錄本月淨資產");
    actions.forEach((a, i) => {
      advice += `${i + 1}. ${a}\n`;
    });

    return advice;
  };

  const handleAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiAdvice("");
    try {
      const localReport = generateLocalAdvice(
        globalMetrics,
        smMetrics,
        wlMetrics
      );
      setAiAdvice(localReport);
    } catch (error) {
      console.error("分析失敗:", error);
    } finally {
      setIsAiLoading(false);
    }
  };
  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setSaveStatus("");
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;
      const currentDate = `${currentMonth}-${String(now.getDate()).padStart(
        2,
        "0"
      )}`;

      const newHistory = [...history];
      const existingIdx = newHistory.findIndex((h) => h.month === currentMonth);

      const newPoint = {
        month: currentMonth,
        date: currentDate,
        netAssets: globalMetrics.netAssets,
      };

      if (existingIdx >= 0) {
        newHistory[existingIdx] = newPoint;
      } else {
        newHistory.push(newPoint);
      }
      setHistory(newHistory);

      const allKeys = Array.from(
        new Set([...Object.keys(sm || {}), ...Object.keys(wl || {})])
      );
      const normalizedSm = { ...sm };
      const normalizedWl = { ...wl };

      allKeys.forEach((k) => {
        if (normalizedSm[k] === undefined) normalizedSm[k] = "";
        if (normalizedWl[k] === undefined) normalizedWl[k] = "";
      });

      normalizedSm.historyData = JSON.stringify(newHistory);

      const dataToSave = {
        sm: normalizedSm,
        wl: normalizedWl,
        updatedAt: new Date().toISOString(),
      };

      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(dataToSave),
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (error) {
      console.error("儲存失敗:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoQuote = async () => {
    setIsFetchingQuotes(true);
    setSaveStatus("");

    const getFetchTasks = (accData, prefix, isTw, setter) => {
      const count = parseInt(accData[`${prefix}Count`] || 1, 10);
      const tasks = [];
      for (let i = 1; i <= count; i++) {
        const rawName = accData[`${prefix}${i}_name`];
        if (rawName) {
          const formattedTicker = autoFormatTicker(rawName, isTw);
          tasks.push(async () => {
            const price = await fetchPriceFromGoogleBackend(
              formattedTicker,
              isTw
            );
            if (price !== null) {
              setter((prev) => ({
                ...prev,
                [`${prefix}${i}_name`]: formattedTicker,
                [`${prefix}${i}_price`]: price.toString(),
              }));
              return true;
            }
            return false;
          });
        }
      }
      return tasks;
    };

    const allTasks = [
      ...getFetchTasks(sm, "tw", true, setSm),
      ...getFetchTasks(sm, "fn", false, setSm),
      ...getFetchTasks(wl, "tw", true, setWl),
      ...getFetchTasks(wl, "fn", false, setWl),
    ];

    let successCount = 0;

    for (const task of allTasks) {
      const isSuccess = await task();
      if (isSuccess) successCount++;
    }

    if (successCount > 0) {
      setSaveStatus(
        successCount === allTasks.length ? "quote_success" : "quote_partial"
      );
    } else if (allTasks.length > 0) {
      setSaveStatus("quote_error");
    }

    setIsFetchingQuotes(false);
    setTimeout(() => setSaveStatus(""), 4000);
  };

  const handleInputChange = (account, field, value) => {
    if (account === "SM") setSm({ ...sm, [field]: value });
    else setWl({ ...wl, [field]: value });
  };

  const handleAddRow = (account, prefix) => {
    const updateState = (prev) => {
      const currentCount = parseInt(prev[`${prefix}Count`] || 1, 10);
      const newCount = currentCount + 1;
      return {
        ...prev,
        [`${prefix}Count`]: newCount,
        [`${prefix}${newCount}_name`]: "",
        [`${prefix}${newCount}_price`]: "0",
        [`${prefix}${newCount}_lots`]: "0",
        [`${prefix}${newCount}_addPrice`]: "0",
        [`${prefix}${newCount}_addLots`]: "0",
        [`${prefix}${newCount}_expRatio`]: "1",
      };
    };
    if (account === "SM") setSm(updateState);
    else setWl(updateState);
  };

  const handleFetchSingleQuote = async (account, prefix, num, ticker) => {
    if (!ticker) return;
    const isTw = prefix === "tw";
    const formattedTicker = autoFormatTicker(ticker, isTw);
    const setter = account === "SM" ? setSm : setWl;

    setter((prev) => ({
      ...prev,
      [`${prefix}${num}_name`]: formattedTicker,
      [`${prefix}${num}_price`]: "抓取中...",
    }));

    const price = await fetchPriceFromGoogleBackend(formattedTicker, isTw);

    if (price !== null) {
      setter((prev) => ({
        ...prev,
        [`${prefix}${num}_price`]: price.toString(),
      }));
    } else {
      setter((prev) => ({ ...prev, [`${prefix}${num}_price`]: "失敗" }));
    }
  };

  const handleRemoveRow = (account, prefix, indexToRemove) => {
    const updateState = (prev) => {
      const count = parseInt(prev[`${prefix}Count`] || 1, 10);
      if (count <= 1) return prev;

      const newState = { ...prev };
      for (let i = indexToRemove; i < count; i++) {
        newState[`${prefix}${i}_name`] = prev[`${prefix}${i + 1}_name`];
        newState[`${prefix}${i}_price`] = prev[`${prefix}${i + 1}_price`];
        newState[`${prefix}${i}_lots`] = prev[`${prefix}${i + 1}_lots`];
        newState[`${prefix}${i}_addPrice`] = prev[`${prefix}${i + 1}_addPrice`];
        newState[`${prefix}${i}_addLots`] = prev[`${prefix}${i + 1}_addLots`];
        newState[`${prefix}${i}_expRatio`] = prev[`${prefix}${i + 1}_expRatio`];
      }

      delete newState[`${prefix}${count}_name`];
      delete newState[`${prefix}${count}_price`];
      delete newState[`${prefix}${count}_lots`];
      delete newState[`${prefix}${count}_addPrice`];
      delete newState[`${prefix}${count}_addLots`];
      delete newState[`${prefix}${count}_expRatio`];

      newState[`${prefix}Count`] = count - 1;
      return newState;
    };
    if (account === "SM") setSm(updateState);
    else setWl(updateState);
  };

  if (!isAppReady) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-xl flex flex-col items-center gap-6 max-w-sm w-full border border-slate-200">
          <Cloud className="text-blue-500 animate-pulse" size={64} />
          <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-wide">
              戰情室連線中...
            </h2>
            <p className="text-sm font-medium text-slate-500">
              正在從雲端金庫同步最新資產資料
              <br />
              請稍候片刻
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 font-sans pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* --- 頂部導航 --- */}
        <div className="bg-white rounded-2xl shadow-sm px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <PieChart size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                SM 與 WL資產總覽
              </h1>
              <p className="text-sm text-slate-500 font-medium">動態管理系統</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleAiAnalysis}
              disabled={isAiLoading || isSaving || isFetchingQuotes}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 active:scale-95 border border-purple-500/50"
            >
              <Sparkles size={18} className="text-yellow-300" />
              <span className="hidden sm:inline">✨ AI 資產健檢</span>
            </button>
            <button
              type="button"
              onClick={handleAutoQuote}
              disabled={isFetchingQuotes || isSaving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 active:scale-95"
            >
              <RefreshCw
                size={18}
                className={isFetchingQuotes ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">
                {saveStatus === "quote_success"
                  ? "報價更新完成"
                  : saveStatus === "quote_partial"
                  ? "部分報價成功"
                  : saveStatus === "quote_error"
                  ? "報價抓取失敗"
                  : isFetchingQuotes
                  ? "Google 運算中..."
                  : "⚡ 自動更新報價"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => loadDataFromSheets(true)}
              disabled={isSaving || isFetchingQuotes}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95"
            >
              <Download size={18} className="text-blue-500" />
              <span className="hidden sm:inline">
                {saveStatus === "load_success" ? "讀取完成" : "讀取雲端資料"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleSaveToCloud}
              disabled={isSaving || isFetchingQuotes}
              title="若一直顯示連線失敗，請確認 Apps Script 是否有以「新增版本」重新部署"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
                saveStatus === "success"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : saveStatus === "error"
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-slate-800 text-white hover:bg-slate-700 active:scale-95"
              }`}
            >
              {isSaving ? (
                <Cloud className="animate-pulse" size={18} />
              ) : saveStatus === "success" ? (
                <ShieldCheck size={18} />
              ) : saveStatus === "error" ? (
                <ShieldAlert size={18} />
              ) : (
                <Save size={18} />
              )}
              {isSaving
                ? "處理中..."
                : saveStatus === "success"
                ? "已安全存入"
                : saveStatus === "error"
                ? "連線失敗(請檢查部署)"
                : "💾 儲存至試算表"}
            </button>
          </div>
        </div>

        {/* --- 最高司令台：全局加總 --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-slate-700 flex flex-col justify-center">
            <p className="text-sm font-bold text-slate-500 mb-2">
              1. 台灣 / 國外配置比例
            </p>
            <div className="flex items-center justify-between font-black tracking-tight">
              <span className="text-xl text-indigo-600">
                🇹🇼 {globalMetrics.twRatio}%
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xl text-emerald-600">
                🇺🇸 {globalMetrics.foreignRatio}%
              </span>
            </div>
            <div className="w-full h-2 bg-emerald-500 rounded-full mt-2 overflow-hidden flex">
              <div
                className="bg-indigo-500 h-full"
                style={{ width: `${globalMetrics.twRatio}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-blue-500">
            <p className="text-sm font-bold text-slate-500 mb-1">2. 總資產</p>
            <p className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
              $ {formatMoney(globalMetrics.totalAssets)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-red-500">
            <p className="text-sm font-bold text-slate-500 mb-1">3. 總負債</p>
            <p className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
              $ {formatMoney(globalMetrics.liabilities)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-purple-500">
            <p className="text-sm font-bold text-slate-500 mb-1">4. 淨資產</p>
            <p className="text-2xl lg:text-3xl font-black text-blue-600 tracking-tight">
              $ {formatMoney(globalMetrics.netAssets)}
            </p>
          </div>
        </div>

        {/* --- ✨ AI 顧問分析面板 --- */}
        {(isAiLoading || aiAdvice) && (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl shadow-lg p-6 md:p-8 relative text-white border border-indigo-500/30 overflow-hidden mt-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <button
              onClick={() => {
                setAiAdvice("");
                setIsAiLoading(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
            >
              <X size={24} />
            </button>

            <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-indigo-300 relative z-10">
              <Sparkles size={24} className="text-yellow-400" /> 頂級 AI
              財富顧問分析
            </h3>

            <div className="relative z-10">
              {isAiLoading ? (
                <div className="flex items-center gap-3 text-slate-300 animate-pulse font-medium">
                  <div className="w-5 h-5 border-2 border-t-yellow-400 border-slate-500 rounded-full animate-spin"></div>
                  正在為您精密運算資產結構與風險曝險...
                </div>
              ) : (
                <div className="text-slate-200 text-[15px] leading-relaxed whitespace-pre-wrap bg-white/5 p-5 rounded-xl border border-white/10 shadow-inner">
                  {aiAdvice}
                </div>
              )}
            </div>
          </div>
        )}

        <TrendChart data={history} />

        {/* --- 帳戶控制面板區 --- */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AccountPanel
            title="SM 帳戶"
            accountName="SM"
            data={sm}
            metrics={smMetrics}
            handleInputChange={handleInputChange}
            handleAddRow={handleAddRow}
            handleRemoveRow={handleRemoveRow}
            handleFetchSingleQuote={handleFetchSingleQuote}
          />
          <AccountPanel
            title="WL 帳戶"
            accountName="WL"
            data={wl}
            metrics={wlMetrics}
            handleInputChange={handleInputChange}
            handleAddRow={handleAddRow}
            handleRemoveRow={handleRemoveRow}
            handleFetchSingleQuote={handleFetchSingleQuote}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
