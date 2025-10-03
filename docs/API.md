# 🔌 API Documentation

## Base URL
```
http://localhost:3001
```

## Authentication
Currently no authentication required. All endpoints are public.

## Endpoints

### Health Check

#### GET /health
Check server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

---

### Columns API

#### GET /api/columns
Get all columns with their options.

**Response:**
```json
[
  {
    "id": 1,
    "column_name": "Name",
    "column_type": "text",
    "options": null
  },
  {
    "id": 2,
    "column_name": "Age",
    "column_type": "number",
    "options": null
  },
  {
    "id": 3,
    "column_name": "Priority",
    "column_type": "single_select",
    "options": [
      {
        "id": 1,
        "label": "High",
        "value": "high"
      },
      {
        "id": 2,
        "label": "Medium",
        "value": "medium"
      }
    ]
  }
]
```

#### POST /api/columns
Create a new column.

**Request Body:**
```json
{
  "name": "Priority",
  "data_type": "single_select",
  "options": [
    {
      "label": "High",
      "value": "high"
    },
    {
      "label": "Medium", 
      "value": "medium"
    }
  ]
}
```

**Response:**
```json
{
  "id": 3,
  "column_name": "Priority",
  "column_type": "single_select",
  "options": [
    {
      "id": 1,
      "label": "High",
      "value": "high"
    },
    {
      "id": 2,
      "label": "Medium",
      "value": "medium"
    }
  ]
}
```

---

### Rows API

#### GET /api/rows
Get paginated rows with their cell values.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "rows": [
    {
      "id": "uuid-123",
      "row_number": 1,
      "cells": [
        {
          "column_id": 1,
          "data_type": "text",
          "value": "John Doe"
        },
        {
          "column_id": 2,
          "data_type": "number", 
          "value": 25
        },
        {
          "column_id": 3,
          "data_type": "multi_select",
          "value": [1, 2, 3]
        }
      ],
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_rows": 100,
    "has_next": true,
    "has_prev": false
  }
}
```

#### POST /api/rows
Create a new row. New rows appear at the top of the table.

**Response:**
```json
{
  "id": "uuid-456",
  "row_number": 1,
  "cells": [],
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

---

### Cell API

#### PATCH /api/cell
Update a cell value with type-specific validation.

**Request Body:**
```json
{
  "row_id": "uuid-123",
  "column_id": 1,
  "value": "New Value"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cell updated successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid data type for column"
}
```

---

### Summary API

#### GET /api/summary
Get column statistics and summaries.

**Response:**
```json
[
  {
    "column_id": 1,
    "column_name": "Name",
    "column_type": "text",
    "summary": null
  },
  {
    "column_id": 2,
    "column_name": "Age", 
    "column_type": "number",
    "summary": {
      "sum": 150,
      "average": 30,
      "count": 5
    }
  },
  {
    "column_id": 3,
    "column_name": "Priority",
    "column_type": "single_select", 
    "summary": {
      "most_frequent": "High",
      "count": 3
    }
  },
  {
    "column_id": 4,
    "column_name": "Skills",
    "column_type": "multi_select",
    "summary": {
      "most_frequent": ["JavaScript", "React"],
      "count": 4
    }
  }
]
```

---

## Data Types

### Text
- **Input**: Any string
- **Validation**: No restrictions
- **Storage**: `value_text` field

### Number  
- **Input**: Numeric values
- **Validation**: Must be a valid number
- **Storage**: `value_number` field

### DateTime
- **Input**: ISO 8601 date string
- **Validation**: Must be valid ISO date
- **Storage**: `value_datetime` field

### Single Select
- **Input**: Option ID (integer)
- **Validation**: Option must exist in dropdown_options
- **Storage**: `value_single_select` field

### Multi Select
- **Input**: Array of option IDs
- **Validation**: All option IDs must exist
- **Storage**: `multi_select_values` table (many-to-many)

---

## Error Handling

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **404**: Not Found
- **500**: Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

### Common Errors

#### Validation Errors
```json
{
  "success": false,
  "error": "Invalid data type for column",
  "details": "Column expects number but received text"
}
```

#### Database Errors
```json
{
  "success": false,
  "error": "Database connection failed",
  "details": "Connection timeout"
}
```

#### Not Found Errors
```json
{
  "success": false,
  "error": "Row not found",
  "details": "Row with ID uuid-123 does not exist"
}
```

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding for production use.

## CORS

CORS is enabled for all origins in development. Configure for production:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));
```

## Content Types

All endpoints accept and return `application/json`.

## Pagination

Rows endpoint supports pagination:
- **Default**: 20 items per page
- **Maximum**: 100 items per page
- **Page numbering**: Starts from 1

## Timestamps

All timestamps are in ISO 8601 format (UTC):
```
2024-01-15T10:30:00.000Z
```
