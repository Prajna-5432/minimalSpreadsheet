const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Mock the database connection
const mockPool = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn()
};

// Mock the pg module
jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPool)
}));

// Import routes after mocking
const routes = require('../routes/index');

describe('API Routes', () => {
  let app;
  let mockClient;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create Express app
    app = express();
    app.use(express.json());
    app.use(cors());
    app.use('/api', routes);

    // Mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    
    mockPool.connect.mockResolvedValue(mockClient);
  });

  describe('GET /api/columns', () => {
    it('should return all columns with options', async () => {
      const mockColumns = [
        {
          id: 1,
          column_name: 'Name',
          column_type: 'text',
          options: null
        },
        {
          id: 2,
          column_name: 'Priority',
          column_type: 'single_select',
          options: [
            { id: 1, label: 'High', value: 'high' },
            { id: 2, label: 'Medium', value: 'medium' }
          ]
        }
      ];

      mockClient.query
        .mockResolvedValueOnce({ rows: mockColumns })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/columns')
        .expect(200);

      expect(response.body).toEqual(mockColumns);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT')
      );
    });

    it('should handle database errors', async () => {
      mockClient.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/columns')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Database connection failed');
    });
  });

  describe('POST /api/columns', () => {
    it('should create a new text column', async () => {
      const newColumn = {
        name: 'Description',
        data_type: 'text'
      };

      const mockResult = {
        id: 3,
        column_name: 'Description',
        column_type: 'text',
        options: null
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockResult] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/columns')
        .send(newColumn)
        .expect(201);

      expect(response.body).toEqual(mockResult);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO columns_meta'),
        expect.arrayContaining(['Description', 'text'])
      );
    });

    it('should create a new single_select column with options', async () => {
      const newColumn = {
        name: 'Status',
        data_type: 'single_select',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' }
        ]
      };

      const mockResult = {
        id: 4,
        column_name: 'Status',
        column_type: 'single_select',
        options: [
          { id: 3, label: 'Active', value: 'active' },
          { id: 4, label: 'Inactive', value: 'inactive' }
        ]
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 4 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: mockResult.options });

      const response = await request(app)
        .post('/api/columns')
        .send(newColumn)
        .expect(201);

      expect(response.body.column_name).toBe('Status');
      expect(response.body.column_type).toBe('single_select');
      expect(response.body.options).toHaveLength(2);
    });

    it('should validate required fields', async () => {
      const invalidColumn = {
        data_type: 'text'
        // Missing name
      };

      const response = await request(app)
        .post('/api/columns')
        .send(invalidColumn)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('name is required');
    });

    it('should validate column type', async () => {
      const invalidColumn = {
        name: 'Test',
        data_type: 'invalid_type'
      };

      const response = await request(app)
        .post('/api/columns')
        .send(invalidColumn)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid column type');
    });
  });

  describe('GET /api/rows', () => {
    it('should return paginated rows with cell values', async () => {
      const mockRows = [
        {
          id: 'uuid-1',
          row_number: 1,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      ];

      const mockCells = [
        {
          column_id: 1,
          data_type: 'text',
          value: 'John Doe'
        }
      ];

      mockClient.query
        .mockResolvedValueOnce({ rows: mockRows })
        .mockResolvedValueOnce({ rows: mockCells })
        .mockResolvedValueOnce({ rows: [{ count: '25' }] });

      const response = await request(app)
        .get('/api/rows?page=1&limit=20')
        .expect(200);

      expect(response.body.rows).toHaveLength(1);
      expect(response.body.rows[0].cells).toHaveLength(1);
      expect(response.body.pagination.current_page).toBe(1);
      expect(response.body.pagination.total_rows).toBe(25);
    });

    it('should handle empty result set', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const response = await request(app)
        .get('/api/rows')
        .expect(200);

      expect(response.body.rows).toHaveLength(0);
      expect(response.body.pagination.total_rows).toBe(0);
    });
  });

  describe('POST /api/rows', () => {
    it('should create a new row at the top', async () => {
      const mockNewRow = {
        id: 'uuid-new',
        row_number: 1,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockClient.query
        .mockResolvedValueOnce({}) // Increment existing rows
        .mockResolvedValueOnce({ rows: [mockNewRow] })
        .mockResolvedValueOnce({}); // Update summary

      const response = await request(app)
        .post('/api/rows')
        .expect(201);

      expect(response.body.id).toBe('uuid-new');
      expect(response.body.row_number).toBe(1);
      expect(response.body.cells).toEqual([]);
    });

    it('should handle database errors during row creation', async () => {
      mockClient.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/rows')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Database error');
    });
  });

  describe('PATCH /api/cell', () => {
    it('should update a text cell value', async () => {
      const cellUpdate = {
        row_id: 'uuid-1',
        column_id: 1,
        value: 'Updated text'
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ column_type: 'text' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app)
        .patch('/api/cell')
        .send(cellUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE cell_values'),
        expect.arrayContaining(['Updated text', 'uuid-1', 1])
      );
    });

    it('should update a number cell value', async () => {
      const cellUpdate = {
        row_id: 'uuid-1',
        column_id: 2,
        value: 42
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ column_type: 'number' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app)
        .patch('/api/cell')
        .send(cellUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should validate number data type', async () => {
      const cellUpdate = {
        row_id: 'uuid-1',
        column_id: 2,
        value: 'not a number'
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ column_type: 'number' }] });

      const response = await request(app)
        .patch('/api/cell')
        .send(cellUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid number value');
    });

    it('should validate datetime data type', async () => {
      const cellUpdate = {
        row_id: 'uuid-1',
        column_id: 3,
        value: 'invalid date'
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ column_type: 'datetime' }] });

      const response = await request(app)
        .patch('/api/cell')
        .send(cellUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid datetime value');
    });

    it('should validate single_select data type', async () => {
      const cellUpdate = {
        row_id: 'uuid-1',
        column_id: 4,
        value: 999 // Non-existent option ID
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ column_type: 'single_select' }] })
        .mockResolvedValueOnce({ rows: [] }); // Option not found

      const response = await request(app)
        .patch('/api/cell')
        .send(cellUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid option ID');
    });

    it('should validate multi_select data type', async () => {
      const cellUpdate = {
        row_id: 'uuid-1',
        column_id: 5,
        value: [1, 2, 999] // One invalid option ID
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ column_type: 'multi_select' }] })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }); // Only 2 valid options

      const response = await request(app)
        .patch('/api/cell')
        .send(cellUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid option IDs');
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .patch('/api/cell')
        .send({ row_id: 'uuid-1' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('column_id is required');
    });
  });

  describe('GET /api/summary', () => {
    it('should return column summaries', async () => {
      const mockSummary = [
        {
          column_id: 1,
          column_name: 'Name',
          column_type: 'text',
          summary: null
        },
        {
          column_id: 2,
          column_name: 'Age',
          column_type: 'number',
          summary: { sum: 150, average: 30, count: 5 }
        }
      ];

      mockClient.query
        .mockResolvedValueOnce({ rows: mockSummary });

      const response = await request(app)
        .get('/api/summary')
        .expect(200);

      expect(response.body).toEqual(mockSummary);
    });

    it('should handle database errors in summary', async () => {
      mockClient.query.mockRejectedValue(new Error('Summary query failed'));

      const response = await request(app)
        .get('/api/summary')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Summary query failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle client connection errors', async () => {
      mockPool.connect.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/api/columns')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Connection failed');
    });

    it('should handle client release errors', async () => {
      mockClient.release.mockImplementation(() => {
        throw new Error('Release failed');
      });

      const response = await request(app)
        .get('/api/columns')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});
