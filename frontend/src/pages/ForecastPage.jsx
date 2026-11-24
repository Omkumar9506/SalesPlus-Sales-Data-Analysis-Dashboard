import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BrainCircuit,
  Info,
  Calendar,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Target,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ChartSkeleton, CardSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { salesService } from '../services/api';

const ForecastTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const isForecast = payload.some((p) => p.dataKey === 'forecast_revenue' && p.value);
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs">
        <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-800 pb-1">
          <span className="font-semibold text-slate-200">{label}</span>
          {isForecast ? (
            <span className="bg-indigo-900/80 text-indigo-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-700">
              ML Projection
            </span>
          ) : (
            <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
              Historical Actual
            </span>
          )}
        </div>

        {payload.map((entry, idx) => {
          if (entry.value === null || entry.value === undefined) return null;
          return (
            <div key={`fc-${idx}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="text-slate-400 capitalize">{entry.name}:</span>
              <span className="font-bold text-white">{formatCurrency(entry.value)}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function ForecastPage({ filterParams, refreshTrigger }) {
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState(null);
  const [error, setError] = useState(null);
  const [showFaq, setShowFaq] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchForecast = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await salesService.getForecast({
          category: filterParams.category !== 'All' ? filterParams.category : undefined,
          horizon: 3
        });
        if (isMounted) setForecastData(data);
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to generate revenue forecast.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchForecast();
    return () => { isMounted = false; };
  }, [filterParams, refreshTrigger]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton count={4} />
        </div>
        <ChartSkeleton height="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Insufficient Data for ML Forecasting</h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">{error}</p>
        <p className="text-xs text-slate-400 mt-4">
          Upload at least 3 to 6 months of historical transactions or switch to "All Categories" to train the model.
        </p>
      </div>
    );
  }

  const metrics = forecastData?.metrics || {};
  const insights = forecastData?.insights || {};
  const nextMonths = forecastData?.forecast_next_months || [];
  const chartSeries = forecastData?.chart_series || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* AI / ML Insight Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl p-5 shadow-sm border border-indigo-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-700/80 border border-indigo-500/40 text-indigo-200">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                Machine Learning Model: {forecastData?.model_type}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              {insights.summary_text}
            </h3>
            <p className="text-xs text-indigo-200/80 mt-1">
              Trained on {insights.historical_months_count} historical months • Baseline intercept: {formatCurrency(insights.baseline_intercept || 0)}
            </p>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-indigo-700/80 sm:pl-6 flex-shrink-0">
          <span className="text-[11px] text-indigo-300 font-medium block">3-Month Forecasted Sum</span>
          <span className="text-2xl font-extrabold text-white">
            {formatCurrency(insights.next_3_months_total_forecast || 0)}
          </span>
        </div>
      </div>

      {/* Model Performance & Evaluation Metrics (MAE, RMSE, R², MAPE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MAE (Mean Absolute Error)</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <h4 className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.mae !== null ? formatCurrency(metrics.mae) : 'N/A'}
          </h4>
          <p className="text-[11px] text-slate-500 mt-1">
            Average absolute monthly deviation between predicted and actual values.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">RMSE (Root Mean Squared)</span>
            <BarChart2 className="w-4 h-4 text-blue-600" />
          </div>
          <h4 className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.rmse !== null ? formatCurrency(metrics.rmse) : 'N/A'}
          </h4>
          <p className="text-[11px] text-slate-500 mt-1">
            Penalizes larger forecast variances; reflects standard error of regression.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Historical Months</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <h4 className="text-2xl font-bold text-slate-900 mt-2">
            {insights.historical_months_count} Months
          </h4>
          <p className="text-[11px] text-slate-500 mt-1">
            Split: {metrics.train_months} train / {metrics.test_months} test holdout validation.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Drift Slope</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <h4 className="text-2xl font-bold text-slate-900 mt-2">
            {insights.monthly_slope >= 0 ? `+${formatCurrency(insights.monthly_slope)}` : formatCurrency(insights.monthly_slope)}
          </h4>
          <p className="text-[11px] text-slate-500 mt-1">
            Estimated velocity of revenue increase per forward calendar month.
          </p>
        </div>
      </div>

      {/* Next 3 Months Forecast Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Upcoming 3 Months Revenue Predictions (with 80% Estimation Intervals)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nextMonths.map((month, index) => (
            <div
              key={month.period}
              className="bg-white rounded-xl border border-indigo-100 p-5 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-xl group-hover:bg-indigo-100/50 transition-all" />
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                  Month +{index + 1}: {month.month_name}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Estimated</span>
              </div>

              <div className="mt-4">
                <div className="text-2xl font-extrabold text-slate-900">
                  {formatCurrency(month.forecast_revenue)}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Confidence Range:</span>
                <span className="font-semibold text-slate-700">
                  {formatCurrency(month.lower_bound)} - {formatCurrency(month.upper_bound)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Forecast Chart: Historical Actuals vs Model Trend vs Future Forecast */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Historical vs Fitted Trend vs Forward 3-Month Forecast
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Solid line reflects verified revenue ledger; dashed line represents Scikit-learn predictive trajectory.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-900" /> Historical Actuals
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-600 border-b border-dashed border-indigo-600" /> Regression Fit / Forecast
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-indigo-100/70 rounded" /> Confidence Band
            </span>
          </div>
        </div>

        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartSeries} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastBandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month_name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ForecastTooltip />} />

              {/* Shaded upper / lower bound area for forecast points */}
              <Area
                type="monotone"
                dataKey="upper_bound"
                name="Confidence Range Upper"
                stroke="transparent"
                fill="url(#forecastBandGrad)"
              />

              {/* Historical actual revenue */}
              <Line
                type="monotone"
                dataKey="actual_revenue"
                name="Actual Revenue"
                stroke="#0f172a"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#0f172a' }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />

              {/* Fitted trend + forward forecast */}
              <Line
                type="monotone"
                dataKey="trend_revenue"
                name="Linear Model Fit / Forecast"
                stroke="#4f46e5"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: '#4f46e5' }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">Estimation & Forecast Disclaimer: </span>
          {forecastData?.disclaimer} External market disruptions, supply chain bottlenecks, promotional campaigns, and macroeconomic shifts are not accounted for by ordinary least-squares extrapolation.
        </div>
      </div>

      {/* Educational Accordion: Methodology & Explanations */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <button
          onClick={() => setShowFaq(!showFaq)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-slate-900">
              Understanding the Machine Learning Architecture & Evaluation Metrics
            </span>
          </div>
          {showFaq ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showFaq && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 text-xs text-slate-600 leading-relaxed">
            <div>
              <h5 className="font-bold text-slate-900 mb-1">1. Scikit-learn Linear Regression (OLS)</h5>
              <p>
                The model fits a linear equation <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">y = m · x + b</code> to historical monthly revenues, minimizing the residual sum of squares between observed and predicted values. Here, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">x</code> represents elapsed calendar periods, and <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">m</code> denotes the estimated monthly growth velocity.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-1">2. Mean Absolute Error (MAE)</h5>
              <p>
                Calculates the average magnitude of prediction errors: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">MAE = (1/n) · Σ |y_actual - y_pred|</code>. Because all errors are weighted equally, MAE is robust against single-month holiday outliers.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-1">3. Root Mean Squared Error (RMSE)</h5>
              <p>
                Computed as <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">RMSE = √((1/n) · Σ (y_actual - y_pred)²)</code>. Squaring residuals gives higher weight to large discrepancies, making RMSE particularly valuable for financial risk and inventory stockout planning.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-1">4. Chronological Holdout Validation</h5>
              <p>
                To avoid future data leakage in time-series forecasting, traditional random K-Fold cross validation is not used. Instead, earlier chronological months form the training partition, while recent months serve as the holdout test set to evaluate real-world predictive accuracy.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
