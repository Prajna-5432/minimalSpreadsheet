# 🗑️ Delete Functionality Documentation

## Overview

The spreadsheet application includes comprehensive delete functionality for both columns and rows. This document covers the implementation, usage, and safety features of the delete operations.

## Features

### Column Deletion
- **Complete removal**: Deletes column and all associated data
- **Cascade deletion**: Removes all cell values, dropdown options, and multi-select values
- **Confirmation required**: Prevents accidental deletions
- **Visual feedback**: Clear indication of what will be deleted

### Row Deletion
- **Complete removal**: Deletes row and all cell data
- **Row renumbering**: Automatically updates row numbers of remaining rows
- **Summary updates**: Updates row count statistics
- **Confirmation required**: Prevents accidental deletions

## User Interface

### Delete Buttons
- **Location**: Column headers and row number cells
- **Appearance**: Small gray circular buttons with "×" symbol
- **Visibility**: Appear on hover over column/row
- **Styling**: Subtle gray color, no red highlighting

### Confirmation Modal
- **Warning icon**: Clear visual indication of destructive action
- **Item identification**: Shows exactly what will be deleted
- **Consequence explanation**: Describes what data will be lost
- **Loading state**: Shows progress during deletion
- **Cancel option**: Easy way to abort the operation

## API Endpoints

### Delete Column
```
DELETE /api/columns/:id
```

**Parameters:**
- `id` (path): Column ID to delete

**Response:**
```json
{
  "success": true,
  "message": "Column deleted successfully"
}
```

**What gets deleted:**
- Column definition from `columns_meta` table
- All cell values for this column from `cell_values` table
- All multi-select values from `multi_select_values` table
- All dropdown options from `dropdown_options` table

### Delete Row
```
DELETE /api/rows/:id
```

**Parameters:**
- `id` (path): Row ID to delete

**Response:**
```json
{
  "success": true,
  "message": "Row deleted successfully",
  "deleted_row_number": 3
}
```

**What gets deleted:**
- Row marked as inactive in `data_rows` table
- All cell values for this row from `cell_values` table
- All multi-select values from `multi_select_values` table
- Row numbers of remaining rows are automatically updated

## Frontend Implementation

### TablePage Component

**Delete State Management:**
```javascript
const [deleteModal, setDeleteModal] = useState({
  isOpen: false,
  type: null, // 'column' or 'row'
  item: null,
  isLoading: false
});
```

**Delete Functions:**
```javascript
const handleDeleteColumn = (column) => {
  setDeleteModal({
    isOpen: true,
    type: 'column',
    item: column,
    isLoading: false
  });
};

const handleDeleteRow = (row) => {
  setDeleteModal({
    isOpen: true,
    type: 'row',
    item: row,
    isLoading: false
  });
};
```

**Confirmation Handler:**
```javascript
const confirmDelete = async () => {
  if (!deleteModal.item) return;

  setDeleteModal(prev => ({ ...prev, isLoading: true }));

  try {
    if (deleteModal.type === 'column') {
      await columnsApi.deleteColumn(deleteModal.item.id);
      await refetchColumns();
      await refetchSummary();
    } else if (deleteModal.type === 'row') {
      await rowsApi.deleteRow(deleteModal.item.id);
      window.location.reload();
    }
    
    setDeleteModal({
      isOpen: false,
      type: null,
      item: null,
      isLoading: false
    });
  } catch (error) {
    console.error('Delete error:', error);
    setDeleteModal(prev => ({ ...prev, isLoading: false }));
    alert('Failed to delete. Please try again.');
  }
};
```

### DeleteConfirmModal Component

**Props:**
- `isOpen` - Modal visibility state
- `onClose` - Close modal callback
- `onConfirm` - Confirm deletion callback
- `title` - Modal title
- `message` - Warning message
- `itemName` - Name of item being deleted
- `itemType` - Type of item
- `isLoading` - Loading state

**Usage:**
```jsx
<DeleteConfirmModal
  isOpen={deleteModal.isOpen}
  onClose={cancelDelete}
  onConfirm={confirmDelete}
  title={deleteModal.type === 'column' ? 'Delete Column' : 'Delete Row'}
  message={deleteModal.type === 'column' 
    ? 'Are you sure you want to delete this column? This will permanently remove the column and all its data.'
    : 'Are you sure you want to delete this row? This will permanently remove the row and all its data.'
  }
  itemName={deleteModal.item?.column_name || `Row ${deleteModal.item?.row_number}`}
  itemType={deleteModal.type === 'column' ? 'Column' : 'Row'}
  isLoading={deleteModal.isLoading}
/>
```

## Safety Features

### Confirmation Required
- **Modal dialog**: Users must explicitly confirm deletions
- **Clear messaging**: Explains exactly what will be deleted
- **Item identification**: Shows the specific column/row name
- **Consequence explanation**: Describes data loss implications

### Visual Safety
- **Subtle buttons**: Delete buttons are not prominently colored
- **Hover activation**: Buttons only appear on hover
- **Loading states**: Clear indication during deletion process
- **Error handling**: Graceful error messages if deletion fails

### Data Integrity
- **Transaction safety**: Database operations use transactions
- **Cascade deletion**: All related data is properly cleaned up
- **Row renumbering**: Maintains consistent row numbering
- **Summary updates**: Statistics are automatically updated

## Error Handling

### Client-Side Errors
- **Network failures**: Graceful error messages
- **Validation errors**: Clear feedback on invalid operations
- **Loading states**: Prevents multiple simultaneous operations

### Server-Side Errors
- **Not found**: Clear error when item doesn't exist
- **Database errors**: Proper error logging and user feedback
- **Transaction rollback**: Ensures data consistency on failure

## Accessibility

### Keyboard Navigation
- **Tab order**: Delete buttons are in logical tab sequence
- **Enter key**: Confirms deletion in modal
- **Escape key**: Cancels deletion operation

### Screen Reader Support
- **ARIA labels**: Descriptive labels for all delete buttons
- **Modal announcements**: Screen readers announce modal content
- **Status updates**: Loading and error states are announced

### Visual Accessibility
- **High contrast**: Delete buttons have sufficient contrast
- **Focus indicators**: Clear focus states for keyboard navigation
- **Size requirements**: Buttons meet minimum touch target sizes

## Performance Considerations

### Database Operations
- **Batch operations**: Multiple related deletions in single transaction
- **Index usage**: Efficient queries using primary keys
- **Cascade constraints**: Database-level data integrity

### Frontend Performance
- **Optimistic updates**: Immediate UI feedback
- **Efficient re-renders**: Minimal component updates
- **Memory management**: Proper cleanup of event listeners

## Testing

### Unit Tests
- **Component rendering**: Delete buttons appear correctly
- **Modal functionality**: Confirmation modal works as expected
- **API integration**: Delete operations complete successfully

### Integration Tests
- **End-to-end deletion**: Complete delete workflow
- **Error scenarios**: Network failures and validation errors
- **Data consistency**: Verify all related data is deleted

### User Testing
- **Usability**: Delete process is intuitive
- **Safety**: Users understand consequences
- **Accessibility**: Works with assistive technologies

## Best Practices

### User Experience
- **Clear confirmation**: Users understand what will be deleted
- **Reversible operations**: Consider undo functionality for future
- **Bulk operations**: Consider batch delete for multiple items
- **Keyboard shortcuts**: Consider Ctrl+Delete for power users

### Data Management
- **Backup strategy**: Consider soft deletes for important data
- **Audit trail**: Log who deleted what and when
- **Recovery options**: Consider trash/recycle bin functionality
- **Bulk operations**: Efficient handling of large deletions

## Future Enhancements

### Planned Features
- **Bulk delete**: Select multiple rows/columns for deletion
- **Undo functionality**: Recover recently deleted items
- **Soft delete**: Mark as deleted instead of permanent removal
- **Delete history**: Track and display deletion history

### Advanced Features
- **Conditional deletion**: Delete based on criteria
- **Scheduled deletion**: Delete items after certain time
- **Archive functionality**: Move to archive instead of delete
- **Restore from backup**: Recover from automatic backups

## Troubleshooting

### Common Issues

**Delete button not appearing:**
- Check if hover is working correctly
- Verify CSS hover states are applied
- Ensure component is properly mounted

**Modal not opening:**
- Check modal state management
- Verify event handlers are attached
- Check for JavaScript errors in console

**Deletion fails:**
- Check network connectivity
- Verify API endpoints are accessible
- Check server logs for error details

**Data not updating:**
- Verify cache invalidation is working
- Check if page refresh is needed
- Ensure API calls are completing successfully

### Debug Steps
1. **Check browser console** for JavaScript errors
2. **Verify network requests** in browser dev tools
3. **Check server logs** for backend errors
4. **Test API endpoints** directly with tools like Postman
5. **Verify database state** after deletion attempts
