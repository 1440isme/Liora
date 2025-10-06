# DataTables Library

This directory contains the DataTables library files for enhanced table functionality.

## Files to include:
- jquery.dataTables.min.js
- dataTables.bootstrap5.min.js
- dataTables.bootstrap5.min.css
- dataTables.responsive.min.js
- dataTables.responsive.min.css

## CDN Alternative:
```html
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css">
<script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>
```

## Usage:
```javascript
$(document).ready(function() {
    $('#example').DataTable({
        responsive: true,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/vi.json'
        }
    });
});
```
