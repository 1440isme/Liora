# Chart.js Library

This directory contains the Chart.js library files for admin dashboard charts.

## Files to include:
- chart.min.js (or chart.js)
- chart.min.css (if available)

## CDN Alternative:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

## Usage:
```javascript
// Charts are automatically available when included
const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});
```
