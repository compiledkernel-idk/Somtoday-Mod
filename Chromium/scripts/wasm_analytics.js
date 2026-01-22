// WASM ANALYTICS ENGINE
// High-performance grade calculations, statistics, and predictions
// Provides a JavaScript bridge to the WebAssembly analytics module

// ============================================================================
// Module State
// ============================================================================

let wasmModule = null;
let wasmInitialized = false;
let wasmInitPromise = null;
let analyticsCache = new Map();
const CACHE_TTL = 60000; // 1 minute cache

// ============================================================================
// WASM Module Loader
// ============================================================================

/**
 * Initialize the WASM module
 * @returns {Promise<boolean>} True if WASM loaded successfully
 */
async function initWasmAnalytics() {
    if (wasmInitialized) {
        return true;
    }
    
    if (wasmInitPromise) {
        return wasmInitPromise;
    }
    
    wasmInitPromise = (async () => {
        try {
            // Try to load WASM module
            const wasmUrl = typeof chrome !== 'undefined' && chrome.runtime 
                ? chrome.runtime.getURL('wasm/pkg/somtoday_analytics_bg.wasm')
                : '/wasm/pkg/somtoday_analytics_bg.wasm';
            
            const response = await fetch(wasmUrl);
            
            if (!response.ok) {
                console.warn('WASM Analytics: Could not load WASM module, using JS fallback');
                wasmInitialized = false;
                return false;
            }
            
            const wasmBytes = await response.arrayBuffer();
            const wasmImports = getWasmImports();
            const { instance } = await WebAssembly.instantiate(wasmBytes, wasmImports);
            
            wasmModule = instance.exports;
            wasmInitialized = true;
            
            // Run health check
            if (wasmModule.health_check && wasmModule.health_check()) {
                console.log('WASM Analytics: Module loaded successfully, version:', getWasmVersion());
                return true;
            }
            
            console.warn('WASM Analytics: Health check failed, using JS fallback');
            wasmInitialized = false;
            return false;
        } catch (error) {
            console.warn('WASM Analytics: Failed to load module, using JS fallback:', error.message);
            wasmInitialized = false;
            return false;
        }
    })();
    
    return wasmInitPromise;
}

/**
 * Get WASM imports object
 */
function getWasmImports() {
    return {
        env: {
            memory: new WebAssembly.Memory({ initial: 256, maximum: 512 }),
            abort: () => console.error('WASM abort called'),
        },
        wbg: {
            __wbindgen_throw: (ptr, len) => {
                const message = readWasmString(ptr, len);
                throw new Error(message);
            },
            __wbindgen_string_new: (ptr, len) => readWasmString(ptr, len),
            __wbg_log_: (ptr, len) => console.log(readWasmString(ptr, len)),
        }
    };
}

/**
 * Read a string from WASM memory
 */
function readWasmString(ptr, len) {
    if (!wasmModule || !wasmModule.memory) return '';
    const bytes = new Uint8Array(wasmModule.memory.buffer, ptr, len);
    return new TextDecoder().decode(bytes);
}

/**
 * Get WASM module version
 */
function getWasmVersion() {
    if (!wasmInitialized || !wasmModule) return 'N/A';
    try {
        return wasmModule.get_version ? wasmModule.get_version() : '1.0.0';
    } catch {
        return '1.0.0';
    }
}

/**
 * Check if WASM is available
 */
function isWasmAvailable() {
    return wasmInitialized && wasmModule !== null;
}

// ============================================================================
// Caching Layer
// ============================================================================

/**
 * Get cached result or compute new one
 */
function getCached(key, computeFn) {
    const cached = analyticsCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.value;
    }
    
    const value = computeFn();
    analyticsCache.set(key, { value, timestamp: Date.now() });
    return value;
}

/**
 * Clear analytics cache
 */
function clearAnalyticsCache() {
    analyticsCache.clear();
}

/**
 * Generate cache key from arguments
 */
function cacheKey(...args) {
    return JSON.stringify(args);
}

// ============================================================================
// Grade Data Transformation
// ============================================================================

/**
 * Transform DOM grade elements to Grade objects
 * @param {NodeList|Array} elements - Grade DOM elements
 * @returns {Array} Array of Grade objects
 */
function extractGradesFromDOM(elements) {
    const grades = [];
    
    if (!elements || elements.length === 0) {
        return grades;
    }
    
    for (const element of elements) {
        try {
            const gradeData = parseGradeElement(element);
            if (gradeData) {
                grades.push(gradeData);
            }
        } catch (error) {
            console.warn('Failed to parse grade element:', error);
        }
    }
    
    return grades;
}

/**
 * Parse a single grade element
 */
function parseGradeElement(element) {
    // Try to find the grade value
    const cijferElement = element.querySelector('.cijfer') || element.getElementsByClassName('cijfer')[0];
    if (!cijferElement) return null;
    
    const valueText = cijferElement.textContent || cijferElement.innerText;
    const value = parseGradeValue(valueText);
    
    if (isNaN(value)) return null;
    
    // Extract subject
    const subjectElement = element.querySelector('.titel, .vak, .subject');
    const subject = subjectElement ? subjectElement.textContent.trim() : 'Unknown';
    
    // Extract description
    const descElement = element.querySelector('.subtitel, .omschrijving, .description');
    const description = descElement ? descElement.textContent.trim() : '';
    
    // Extract weight (default to 1)
    const weightElement = element.querySelector('.weging, .weight');
    const weight = weightElement ? parseFloat(weightElement.textContent) || 1.0 : 1.0;
    
    // Extract or estimate timestamp
    const dateElement = element.querySelector('.datum, .date');
    const timestamp = dateElement ? new Date(dateElement.textContent).getTime() : Date.now();
    
    return {
        value,
        weight,
        subject,
        description,
        timestamp,
        is_passing: value >= 5.5
    };
}

/**
 * Parse a grade value from string
 * Handles Dutch format (comma) and international format (dot)
 */
function parseGradeValue(str) {
    if (!str) return NaN;
    const normalized = str.toString().trim().replace(',', '.');
    return parseFloat(normalized);
}

/**
 * Format a grade value for display
 * @param {number} value - Grade value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted grade string
 */
function formatGrade(value, decimals = 1) {
    if (isNaN(value)) return '-';
    return value.toFixed(decimals).replace('.', ',');
}

/**
 * Validate a grade value
 */
function validateGrade(value) {
    const num = parseGradeValue(value);
    return !isNaN(num) && num >= 1.0 && num <= 10.0;
}

// ============================================================================
// Analytics Functions - Grade Calculations
// ============================================================================

/**
 * Calculate simple average of grades
 * @param {Array} grades - Array of grade objects
 * @returns {number} Simple average
 */
function calculateAverage(grades) {
    if (!grades || grades.length === 0) return 0;
    
    const key = cacheKey('avg', grades);
    return getCached(key, () => {
        if (isWasmAvailable()) {
            try {
                return wasmModule.calculate_average(JSON.stringify(grades));
            } catch (e) {
                console.warn('WASM calculate_average failed:', e);
            }
        }
        
        // JavaScript fallback
        const sum = grades.reduce((acc, g) => acc + g.value, 0);
        return sum / grades.length;
    });
}

/**
 * Calculate weighted average of grades
 * @param {Array} grades - Array of grade objects with weights
 * @returns {number} Weighted average
 */
function calculateWeightedAverage(grades) {
    if (!grades || grades.length === 0) return 0;
    
    const key = cacheKey('wavg', grades);
    return getCached(key, () => {
        if (isWasmAvailable()) {
            try {
                return wasmModule.calculate_weighted_average(JSON.stringify(grades));
            } catch (e) {
                console.warn('WASM calculate_weighted_average failed:', e);
            }
        }
        
        // JavaScript fallback
        const totalWeight = grades.reduce((acc, g) => acc + (g.weight || 1), 0);
        if (totalWeight === 0) return calculateAverage(grades);
        
        const weightedSum = grades.reduce((acc, g) => acc + g.value * (g.weight || 1), 0);
        return weightedSum / totalWeight;
    });
}

/**
 * Calculate GPA from grades
 * @param {Array} grades - Array of grade objects
 * @param {Object} scale - GPA scale configuration
 * @returns {number} GPA value
 */
function calculateGPA(grades, scale = {}) {
    if (!grades || grades.length === 0) return 0;
    
    const defaultScale = {
        max_grade: 10.0,
        passing_grade: 5.5,
        gpa_max: 4.0
    };
    
    const mergedScale = { ...defaultScale, ...scale };
    const key = cacheKey('gpa', grades, mergedScale);
    
    return getCached(key, () => {
        if (isWasmAvailable()) {
            try {
                return wasmModule.calculate_gpa(JSON.stringify(grades), JSON.stringify(mergedScale));
            } catch (e) {
                console.warn('WASM calculate_gpa failed:', e);
            }
        }
        
        // JavaScript fallback
        const weightedAvg = calculateWeightedAverage(grades);
        const normalized = (weightedAvg - 1) / (mergedScale.max_grade - 1);
        return Math.max(0, Math.min(mergedScale.gpa_max, normalized * mergedScale.gpa_max));
    });
}

/**
 * Calculate average for a specific subject
 * @param {Array} grades - All grades
 * @param {string} subject - Subject name
 * @returns {number} Subject average
 */
function calculateSubjectAverage(grades, subject) {
    if (!grades || grades.length === 0 || !subject) return 0;
    
    const key = cacheKey('subavg', grades, subject.toLowerCase());
    return getCached(key, () => {
        if (isWasmAvailable()) {
            try {
                return wasmModule.calculate_subject_average(JSON.stringify(grades), subject);
            } catch (e) {
                console.warn('WASM calculate_subject_average failed:', e);
            }
        }
        
        // JavaScript fallback
        const subjectGrades = grades.filter(g => 
            g.subject.toLowerCase() === subject.toLowerCase()
        );
        return calculateWeightedAverage(subjectGrades);
    });
}

/**
 * Get all unique subjects from grades
 */
function getSubjects(grades) {
    if (!grades || grades.length === 0) return [];
    
    const subjects = new Set();
    for (const grade of grades) {
        if (grade.subject) {
            subjects.add(grade.subject);
        }
    }
    return Array.from(subjects).sort();
}

/**
 * Get subject summary with all statistics
 */
function getSubjectSummary(grades, subject) {
    if (!grades || grades.length === 0 || !subject) return null;
    
    const key = cacheKey('subsummary', grades, subject.toLowerCase());
    return getCached(key, () => {
        if (isWasmAvailable()) {
            try {
                const result = wasmModule.get_subject_summary(JSON.stringify(grades), subject);
                return JSON.parse(result);
            } catch (e) {
                console.warn('WASM get_subject_summary failed:', e);
            }
        }
        
        // JavaScript fallback
        const subjectGrades = grades.filter(g => 
            g.subject.toLowerCase() === subject.toLowerCase()
        );
        
        if (subjectGrades.length === 0) {
            return {
                subject,
                average: 0,
                weighted_average: 0,
                grade_count: 0,
                total_weight: 0,
                highest: 0,
                lowest: 0,
                passing_count: 0,
                failing_count: 0,
                trend: 0,
                predicted_next: 0
            };
        }
        
        const values = subjectGrades.map(g => g.value);
        const weights = subjectGrades.map(g => g.weight || 1);
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        
        return {
            subject,
            average: values.reduce((a, b) => a + b, 0) / values.length,
            weighted_average: calculateWeightedAverage(subjectGrades),
            grade_count: subjectGrades.length,
            total_weight: totalWeight,
            highest: Math.max(...values),
            lowest: Math.min(...values),
            passing_count: subjectGrades.filter(g => g.value >= 5.5).length,
            failing_count: subjectGrades.filter(g => g.value < 5.5).length,
            trend: calculateTrendSlope(subjectGrades),
            predicted_next: predictNextGrade(subjectGrades).predicted_value
        };
    });
}

/**
 * Get all subjects with their summaries
 */
function getAllSubjectSummaries(grades) {
    if (!grades || grades.length === 0) return [];
    
    const key = cacheKey('allsummaries', grades);
    return getCached(key, () => {
        if (isWasmAvailable()) {
            try {
                const result = wasmModule.get_all_subjects(JSON.stringify(grades));
                return JSON.parse(result);
            } catch (e) {
                console.warn('WASM get_all_subjects failed:', e);
            }
        }
        
        // JavaScript fallback
        const subjects = getSubjects(grades);
        return subjects.map(s => getSubjectSummary(grades, s));
    });
}

// ============================================================================
// Analytics Functions - Statistics
// ============================================================================

/**
 * Calculate comprehensive statistics
 * @param {Array} data - Array of numeric values
 * @returns {Object} Statistics object
 */
function calculateStatistics(data) {
    if (!data || data.length === 0) {
        return {
            count: 0, sum: 0, mean: 0, median: 0, mode: [],
            min: 0, max: 0, range: 0, variance: 0, std_deviation: 0,
            percentile_25: 0, percentile_50: 0, percentile_75: 0, percentile_90: 0,
            iqr: 0, skewness: 0, kurtosis: 0
        };
    }
    
    const key = cacheKey('stats', data);
    return getCached(key, () => {
        if (isWasmAvailable()) {
            try {
                const result = wasmModule.calculate_statistics(JSON.stringify(data));
                return JSON.parse(result);
            } catch (e) {
                console.warn('WASM calculate_statistics failed:', e);
            }
        }
        
        // JavaScript fallback
        return calculateStatisticsJS(data);
    });
}

/**
 * JavaScript fallback for statistics calculation
 */
function calculateStatisticsJS(data) {
    const sorted = [...data].sort((a, b) => a - b);
    const n = data.length;
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    
    // Median
    const median = n % 2 === 0 
        ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
        : sorted[Math.floor(n/2)];
    
    // Mode
    const frequency = {};
    data.forEach(v => frequency[v] = (frequency[v] || 0) + 1);
    const maxFreq = Math.max(...Object.values(frequency));
    const mode = maxFreq > 1 
        ? Object.entries(frequency).filter(([_, f]) => f === maxFreq).map(([v]) => parseFloat(v))
        : [];
    
    // Variance and std deviation
    const variance = n > 1 
        ? data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1)
        : 0;
    const std_deviation = Math.sqrt(variance);
    
    // Percentiles
    const percentile = (p) => {
        const index = (p / 100) * (n - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    };
    
    const p25 = percentile(25);
    const p50 = percentile(50);
    const p75 = percentile(75);
    const p90 = percentile(90);
    
    // Skewness
    const skewness = n >= 3 && std_deviation > 0
        ? (n / ((n-1) * (n-2))) * data.reduce((acc, v) => acc + Math.pow((v - mean) / std_deviation, 3), 0)
        : 0;
    
    // Kurtosis
    const kurtosis = n >= 4 && std_deviation > 0
        ? (n * (n+1) / ((n-1) * (n-2) * (n-3))) * 
          data.reduce((acc, v) => acc + Math.pow((v - mean) / std_deviation, 4), 0) -
          (3 * Math.pow(n-1, 2)) / ((n-2) * (n-3))
        : 0;
    
    return {
        count: n,
        sum,
        mean,
        median,
        mode,
        min: sorted[0],
        max: sorted[n-1],
        range: sorted[n-1] - sorted[0],
        variance,
        std_deviation,
        percentile_25: p25,
        percentile_50: p50,
        percentile_75: p75,
        percentile_90: p90,
        iqr: p75 - p25,
        skewness,
        kurtosis
    };
}

/**
 * Calculate percentile of a value in a dataset
 */
function calculatePercentile(data, percentile) {
    if (!data || data.length === 0) return 0;
    
    if (isWasmAvailable()) {
        try {
            return wasmModule.calculate_percentile(JSON.stringify(data), percentile);
        } catch (e) {
            console.warn('WASM calculate_percentile failed:', e);
        }
    }
    
    // JavaScript fallback
    const sorted = [...data].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate trend from time series data
 */
function calculateTrend(timeSeries) {
    if (!timeSeries || timeSeries.length < 2) {
        return {
            slope: 0, intercept: 0, r_squared: 0,
            direction: 'stable', strength: 'none',
            predicted_values: []
        };
    }
    
    const key = cacheKey('trend', timeSeries);
    return getCached(key, () => {
        if (isWasmAvailable()) {
            try {
                const result = wasmModule.calculate_trend(JSON.stringify(timeSeries));
                return JSON.parse(result);
            } catch (e) {
                console.warn('WASM calculate_trend failed:', e);
            }
        }
        
        // JavaScript fallback
        return calculateTrendJS(timeSeries);
    });
}

/**
 * JavaScript fallback for trend calculation
 */
function calculateTrendJS(timeSeries) {
    const n = timeSeries.length;
    const minTime = Math.min(...timeSeries.map(([t]) => t));
    const normalized = timeSeries.map(([t, v]) => [t - minTime, v]);
    
    const sumX = normalized.reduce((acc, [x]) => acc + x, 0);
    const sumY = normalized.reduce((acc, [_, y]) => acc + y, 0);
    const sumXY = normalized.reduce((acc, [x, y]) => acc + x * y, 0);
    const sumX2 = normalized.reduce((acc, [x]) => acc + x * x, 0);
    const sumY2 = normalized.reduce((acc, [_, y]) => acc + y * y, 0);
    
    const denominator = n * sumX2 - sumX * sumX;
    if (Math.abs(denominator) < 1e-10) {
        return {
            slope: 0, intercept: sumY / n, r_squared: 0,
            direction: 'stable', strength: 'none',
            predicted_values: normalized.map(() => sumY / n)
        };
    }
    
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    
    const meanY = sumY / n;
    const ssTot = normalized.reduce((acc, [_, y]) => acc + Math.pow(y - meanY, 2), 0);
    const ssRes = normalized.reduce((acc, [x, y]) => acc + Math.pow(y - (slope * x + intercept), 2), 0);
    const r_squared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
    
    const direction = Math.abs(slope) < 0.001 ? 'stable' : slope > 0 ? 'improving' : 'declining';
    const strength = r_squared < 0.1 ? 'none' : r_squared < 0.3 ? 'weak' : r_squared < 0.6 ? 'moderate' : 'strong';
    
    return {
        slope,
        intercept,
        r_squared,
        direction,
        strength,
        predicted_values: normalized.map(([x]) => slope * x + intercept)
    };
}

/**
 * Helper to calculate just the trend slope from grades
 */
function calculateTrendSlope(grades) {
    if (!grades || grades.length < 2) return 0;
    
    const timeSeries = grades
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(g => [g.timestamp, g.value]);
    
    return calculateTrend(timeSeries).slope;
}

// ============================================================================
// Analytics Functions - Predictions
// ============================================================================

/**
 * Predict grade needed to achieve target average
 */
function predictGradeNeeded(currentAverage, currentTotalWeight, targetAverage, newGradeWeight) {
    if (isWasmAvailable()) {
        try {
            return wasmModule.predict_grade_needed(currentAverage, currentTotalWeight, targetAverage, newGradeWeight);
        } catch (e) {
            console.warn('WASM predict_grade_needed failed:', e);
        }
    }
    
    // JavaScript fallback
    const totalWeight = currentTotalWeight + newGradeWeight;
    return (targetAverage * totalWeight - currentAverage * currentTotalWeight) / newGradeWeight;
}

/**
 * Predict next grade based on history
 */
function predictNextGrade(grades) {
    if (!grades || grades.length === 0) {
        return {
            predicted_value: 0,
            confidence: 0,
            lower_bound: 0,
            upper_bound: 0,
            method: 'none'
        };
    }
    
    const key = cacheKey('predict', grades);
    return getCached(key, () => {
        if (isWasmAvailable()) {
            try {
                const result = wasmModule.predict_next_grade(JSON.stringify(grades));
                return JSON.parse(result);
            } catch (e) {
                console.warn('WASM predict_next_grade failed:', e);
            }
        }
        
        // JavaScript fallback - simple weighted average of recent grades
        const sorted = [...grades].sort((a, b) => a.timestamp - b.timestamp);
        let weightedSum = 0;
        let totalWeight = 0;
        
        for (let i = 0; i < sorted.length; i++) {
            const weight = Math.pow(i + 1, 2); // Quadratic weighting
            weightedSum += sorted[i].value * weight;
            totalWeight += weight;
        }
        
        const predicted = weightedSum / totalWeight;
        const values = sorted.map(g => g.value);
        const stats = calculateStatisticsJS(values);
        
        return {
            predicted_value: Math.max(1, Math.min(10, predicted)),
            confidence: Math.max(0.1, Math.min(0.9, 1 - stats.std_deviation / 5)),
            lower_bound: Math.max(1, predicted - 2 * stats.std_deviation),
            upper_bound: Math.min(10, predicted + 2 * stats.std_deviation),
            method: 'weighted_average'
        };
    });
}

/**
 * Calculate what-if scenario
 */
function calculateWhatIf(grades, hypotheticalGrades) {
    if (!grades && !hypotheticalGrades) {
        return {
            current_average: 0,
            new_average: 0,
            change: 0,
            change_percent: 0,
            grades_needed_for_target: [],
            impact_analysis: []
        };
    }
    
    const key = cacheKey('whatif', grades, hypotheticalGrades);
    return getCached(key, () => {
        if (isWasmAvailable()) {
            try {
                const result = wasmModule.calculate_whatif(
                    JSON.stringify(grades || []),
                    JSON.stringify(hypotheticalGrades || [])
                );
                return JSON.parse(result);
            } catch (e) {
                console.warn('WASM calculate_whatif failed:', e);
            }
        }
        
        // JavaScript fallback
        return calculateWhatIfJS(grades || [], hypotheticalGrades || []);
    });
}

/**
 * JavaScript fallback for what-if calculation
 */
function calculateWhatIfJS(grades, hypothetical) {
    const currentAvg = calculateWeightedAverage(grades);
    const currentWeight = grades.reduce((acc, g) => acc + (g.weight || 1), 0);
    
    const allGrades = [...grades, ...hypothetical];
    const newAvg = calculateWeightedAverage(allGrades);
    const newWeight = allGrades.reduce((acc, g) => acc + (g.weight || 1), 0);
    
    const change = newAvg - currentAvg;
    const changePercent = currentAvg > 0 ? (change / currentAvg) * 100 : 0;
    
    const defaultWeight = hypothetical.length > 0 ? (hypothetical[0].weight || 1) : 1;
    const targets = [5.5, 6.0, 6.5, 7.0, 7.5, 8.0];
    
    const gradesNeeded = targets.map(target => {
        const gradeNeeded = predictGradeNeeded(newAvg, newWeight, target, defaultWeight);
        return {
            target_average: target,
            grade_needed: gradeNeeded,
            weight: defaultWeight,
            achievable: gradeNeeded >= 1 && gradeNeeded <= 10
        };
    });
    
    const impactAnalysis = [];
    for (let g = 1; g <= 10; g += 0.5) {
        const resultingAvg = (newAvg * newWeight + g * defaultWeight) / (newWeight + defaultWeight);
        impactAnalysis.push({
            hypothetical_grade: g,
            resulting_average: resultingAvg,
            impact: resultingAvg - newAvg
        });
    }
    
    return {
        current_average: currentAvg,
        new_average: newAvg,
        change,
        change_percent: changePercent,
        grades_needed_for_target: gradesNeeded,
        impact_analysis: impactAnalysis
    };
}

/**
 * Generate impact analysis
 */
function generateImpactAnalysis(grades, subject, weight) {
    if (isWasmAvailable()) {
        try {
            const result = wasmModule.generate_impact_analysis(JSON.stringify(grades), subject, weight);
            return JSON.parse(result);
        } catch (e) {
            console.warn('WASM generate_impact_analysis failed:', e);
        }
    }
    
    // JavaScript fallback
    const subjectGrades = grades.filter(g => g.subject.toLowerCase() === subject.toLowerCase());
    const currentAvg = calculateWeightedAverage(subjectGrades);
    const currentWeight = subjectGrades.reduce((acc, g) => acc + (g.weight || 1), 0);
    
    const analysis = [];
    for (let g = 1; g <= 10; g += 0.5) {
        const resultingAvg = (currentAvg * currentWeight + g * weight) / (currentWeight + weight);
        analysis.push({
            hypothetical_grade: g,
            resulting_average: resultingAvg,
            impact: resultingAvg - currentAvg
        });
    }
    
    return analysis;
}

/**
 * Calculate grades needed for various targets
 */
function calculateGradesForTargets(grades, subject, weight, targets) {
    if (isWasmAvailable()) {
        try {
            const result = wasmModule.calculate_grades_for_targets(
                JSON.stringify(grades),
                subject,
                weight,
                JSON.stringify(targets)
            );
            return JSON.parse(result);
        } catch (e) {
            console.warn('WASM calculate_grades_for_targets failed:', e);
        }
    }
    
    // JavaScript fallback
    const subjectGrades = grades.filter(g => g.subject.toLowerCase() === subject.toLowerCase());
    const currentAvg = calculateWeightedAverage(subjectGrades);
    const currentWeight = subjectGrades.reduce((acc, g) => acc + (g.weight || 1), 0);
    
    return targets.map(target => {
        const gradeNeeded = predictGradeNeeded(currentAvg, currentWeight, target, weight);
        return {
            target_average: target,
            grade_needed: gradeNeeded,
            weight,
            achievable: gradeNeeded >= 1 && gradeNeeded <= 10
        };
    });
}

// ============================================================================
// Full Analytics
// ============================================================================

/**
 * Perform complete analytics on all grades
 */
function analyzeAllGrades(grades) {
    if (!grades || grades.length === 0) {
        return {
            overall_average: 0,
            weighted_average: 0,
            gpa: 0,
            total_grades: 0,
            passing_grades: 0,
            failing_grades: 0,
            pass_rate: 0,
            subjects: [],
            statistics: calculateStatistics([]),
            trend: { slope: 0, intercept: 0, r_squared: 0, direction: 'stable', strength: 'none', predicted_values: [] },
            predictions: []
        };
    }
    
    const key = cacheKey('analyzeAll', grades);
    return getCached(key, () => {
        if (isWasmAvailable()) {
            try {
                const result = wasmModule.analyze_all_grades(JSON.stringify(grades));
                return JSON.parse(result);
            } catch (e) {
                console.warn('WASM analyze_all_grades failed:', e);
            }
        }
        
        // JavaScript fallback
        const values = grades.map(g => g.value);
        const passingGrades = grades.filter(g => g.value >= 5.5);
        const subjects = getAllSubjectSummaries(grades);
        
        const timeSeries = grades
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(g => [g.timestamp, g.value]);
        
        return {
            overall_average: calculateAverage(grades),
            weighted_average: calculateWeightedAverage(grades),
            gpa: calculateGPA(grades),
            total_grades: grades.length,
            passing_grades: passingGrades.length,
            failing_grades: grades.length - passingGrades.length,
            pass_rate: (passingGrades.length / grades.length) * 100,
            subjects,
            statistics: calculateStatistics(values),
            trend: calculateTrend(timeSeries),
            predictions: subjects.map(s => predictNextGrade(grades.filter(g => g.subject === s.subject)))
        };
    });
}

// ============================================================================
// Export
// ============================================================================

// Initialize WASM on load
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        initWasmAnalytics().catch(console.error);
    });
}

// Export functions for use in other scripts
window.SomtodayAnalytics = {
    // Initialization
    init: initWasmAnalytics,
    isReady: () => wasmInitialized,
    isWasmAvailable,
    getVersion: getWasmVersion,
    clearCache: clearAnalyticsCache,
    
    // Data transformation
    extractGradesFromDOM,
    parseGradeValue,
    formatGrade,
    validateGrade,
    
    // Grade calculations
    calculateAverage,
    calculateWeightedAverage,
    calculateGPA,
    calculateSubjectAverage,
    getSubjects,
    getSubjectSummary,
    getAllSubjectSummaries,
    
    // Statistics
    calculateStatistics,
    calculatePercentile,
    calculateTrend,
    
    // Predictions
    predictGradeNeeded,
    predictNextGrade,
    calculateWhatIf,
    generateImpactAnalysis,
    calculateGradesForTargets,
    
    // Full analytics
    analyzeAllGrades
};
