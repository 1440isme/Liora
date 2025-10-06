/**
 * Chart Component
 * Handles various chart types for admin dashboard
 */

class ChartComponent {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            type: 'line',
            responsive: true,
            maintainAspectRatio: false,
            ...options
        };

        this.chart = null;
        this.data = null;
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Chart container not found');
            return;
        }

        this.createChart();
    }

    /**
     * Create chart
     */
    createChart() {
        if (!window.Chart) {
            console.error('Chart.js library not loaded');
            return;
        }

        const ctx = this.container.getContext ? this.container : this.container.querySelector('canvas');
        if (!ctx) {
            console.error('Canvas element not found');
            return;
        }

        this.chart = new Chart(ctx, {
            type: this.options.type,
            data: this.options.data || this.getDefaultData(),
            options: this.getChartOptions()
        });
    }

    /**
     * Get default data
     */
    getDefaultData() {
        return {
            labels: [],
            datasets: []
        };
    }

    /**
     * Get chart options
     */
    getChartOptions() {
        const defaultOptions = {
            responsive: this.options.responsive,
            maintainAspectRatio: this.options.maintainAspectRatio,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: true
                    }
                },
                y: {
                    display: true,
                    grid: {
                        display: true
                    },
                    beginAtZero: true
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        };

        return { ...defaultOptions, ...this.options.chartOptions };
    }

    /**
     * Update chart data
     */
    updateData(newData) {
        if (!this.chart) return;

        this.data = newData;
        this.chart.data = newData;
        this.chart.update();
    }

    /**
     * Update chart options
     */
    updateOptions(newOptions) {
        if (!this.chart) return;

        Object.assign(this.chart.options, newOptions);
        this.chart.update();
    }

    /**
     * Add dataset
     */
    addDataset(dataset) {
        if (!this.chart) return;

        this.chart.data.datasets.push(dataset);
        this.chart.update();
    }

    /**
     * Remove dataset
     */
    removeDataset(index) {
        if (!this.chart) return;

        this.chart.data.datasets.splice(index, 1);
        this.chart.update();
    }

    /**
     * Show dataset
     */
    showDataset(index) {
        if (!this.chart) return;

        this.chart.setDatasetVisibility(index, true);
        this.chart.update();
    }

    /**
     * Hide dataset
     */
    hideDataset(index) {
        if (!this.chart) return;

        this.chart.setDatasetVisibility(index, false);
        this.chart.update();
    }

    /**
     * Resize chart
     */
    resize() {
        if (!this.chart) return;

        this.chart.resize();
    }

    /**
     * Destroy chart
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    /**
     * Get chart instance
     */
    getChart() {
        return this.chart;
    }
}

/**
 * Line Chart Component
 */
class LineChart extends ChartComponent {
    constructor(container, options = {}) {
        super(container, {
            type: 'line',
            ...options
        });
    }

    /**
     * Create line chart with default configuration
     */
    createChart() {
        this.options.chartOptions = {
            ...this.options.chartOptions,
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: true
                    }
                },
                y: {
                    display: true,
                    grid: {
                        display: true
                    },
                    beginAtZero: true
                }
            },
            elements: {
                line: {
                    tension: 0.4
                }
            }
        };

        super.createChart();
    }
}

/**
 * Bar Chart Component
 */
class BarChart extends ChartComponent {
    constructor(container, options = {}) {
        super(container, {
            type: 'bar',
            ...options
        });
    }

    /**
     * Create bar chart with default configuration
     */
    createChart() {
        this.options.chartOptions = {
            ...this.options.chartOptions,
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    grid: {
                        display: true
                    },
                    beginAtZero: true
                }
            }
        };

        super.createChart();
    }
}

/**
 * Doughnut Chart Component
 */
class DoughnutChart extends ChartComponent {
    constructor(container, options = {}) {
        super(container, {
            type: 'doughnut',
            ...options
        });
    }

    /**
     * Create doughnut chart with default configuration
     */
    createChart() {
        this.options.chartOptions = {
            ...this.options.chartOptions,
            cutout: '50%',
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        };

        super.createChart();
    }
}

/**
 * Pie Chart Component
 */
class PieChart extends ChartComponent {
    constructor(container, options = {}) {
        super(container, {
            type: 'pie',
            ...options
        });
    }

    /**
     * Create pie chart with default configuration
     */
    createChart() {
        this.options.chartOptions = {
            ...this.options.chartOptions,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        };

        super.createChart();
    }
}

/**
 * Area Chart Component
 */
class AreaChart extends ChartComponent {
    constructor(container, options = {}) {
        super(container, {
            type: 'line',
            ...options
        });
    }

    /**
     * Create area chart with default configuration
     */
    createChart() {
        this.options.chartOptions = {
            ...this.options.chartOptions,
            elements: {
                line: {
                    tension: 0.4
                }
            },
            plugins: {
                filler: {
                    propagate: false
                }
            }
        };

        super.createChart();
    }

    /**
     * Update data for area chart
     */
    updateData(newData) {
        // Ensure all datasets have fill property
        if (newData && newData.datasets) {
            newData.datasets.forEach(dataset => {
                if (!dataset.hasOwnProperty('fill')) {
                    dataset.fill = true;
                }
            });
        }

        super.updateData(newData);
    }
}

/**
 * Chart Factory
 */
class ChartFactory {
    static create(type, container, options = {}) {
        switch (type.toLowerCase()) {
            case 'line':
                return new LineChart(container, options);
            case 'bar':
                return new BarChart(container, options);
            case 'doughnut':
                return new DoughnutChart(container, options);
            case 'pie':
                return new PieChart(container, options);
            case 'area':
                return new AreaChart(container, options);
            default:
                return new ChartComponent(container, { type, ...options });
        }
    }
}

/**
 * Chart Manager
 */
class ChartManager {
    constructor() {
        this.charts = new Map();
    }

    /**
     * Create chart
     */
    create(id, type, container, options = {}) {
        const chart = ChartFactory.create(type, container, options);
        this.charts.set(id, chart);
        return chart;
    }

    /**
     * Get chart
     */
    get(id) {
        return this.charts.get(id);
    }

    /**
     * Update chart data
     */
    updateData(id, data) {
        const chart = this.charts.get(id);
        if (chart) {
            chart.updateData(data);
        }
    }

    /**
     * Update chart options
     */
    updateOptions(id, options) {
        const chart = this.charts.get(id);
        if (chart) {
            chart.updateOptions(options);
        }
    }

    /**
     * Resize all charts
     */
    resizeAll() {
        this.charts.forEach(chart => chart.resize());
    }

    /**
     * Destroy chart
     */
    destroy(id) {
        const chart = this.charts.get(id);
        if (chart) {
            chart.destroy();
            this.charts.delete(id);
        }
    }

    /**
     * Destroy all charts
     */
    destroyAll() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    }
}

// Global chart manager instance
window.chartManager = new ChartManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ChartComponent,
        LineChart,
        BarChart,
        DoughnutChart,
        PieChart,
        AreaChart,
        ChartFactory,
        ChartManager
    };
}
