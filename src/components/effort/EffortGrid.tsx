import { useState, useCallback, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertTriangle, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

interface CellPosition {
  rowId: string;
  colKey: string;
}

interface EffortGridProps {
  rows: {
    id: string;
    employeeId: string;
    projectId?: string;
    label: string;
  }[];
  columns: {
    key: string;
    date: Date;
    label: string;
    subLabel?: string;
    isDisabled?: boolean;
    isHoliday?: boolean;
    isWeekend?: boolean;
    isToday?: boolean;
  }[];
  getValue: (rowId: string, colKey: string) => number;
  onValueChange: (employeeId: string, projectId: string | undefined, date: string, value: number) => Promise<void>;
  getWarning?: (rowId: string, colKey: string, value: number) => 'over' | 'under' | null;
  projectColor?: string;
  columnWidth?: string;
}

export function EffortGrid({
  rows,
  columns,
  getValue,
  onValueChange,
  getWarning,
  projectColor,
  columnWidth = 'min-w-[40px]'
}: EffortGridProps) {
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<CellPosition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const getCellKey = (rowId: string, colKey: string) => `${rowId}:${colKey}`;
  const parseCellKey = (key: string): CellPosition => {
    const [rowId, colKey] = key.split(':');
    return { rowId, colKey };
  };

  const getRowAndColIndex = (rowId: string, colKey: string) => {
    const rowIdx = rows.findIndex(r => r.id === rowId);
    const colIdx = columns.findIndex(c => c.key === colKey);
    return { rowIdx, colIdx };
  };

  const selectRange = useCallback((start: CellPosition, end: CellPosition) => {
    const { rowIdx: startRow, colIdx: startCol } = getRowAndColIndex(start.rowId, start.colKey);
    const { rowIdx: endRow, colIdx: endCol } = getRowAndColIndex(end.rowId, end.colKey);
    
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    
    const newSelection = new Set<string>();
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const row = rows[r];
        const col = columns[c];
        if (row && col && !col.isDisabled) {
          newSelection.add(getCellKey(row.id, col.key));
        }
      }
    }
    setSelectedCells(newSelection);
  }, [rows, columns]);

  const handleCellMouseDown = (rowId: string, colKey: string, e: React.MouseEvent) => {
    const col = columns.find(c => c.key === colKey);
    if (col?.isDisabled) return;
    
    if (e.shiftKey && selectedCells.size > 0) {
      const firstSelected = Array.from(selectedCells)[0];
      const start = parseCellKey(firstSelected);
      selectRange(start, { rowId, colKey });
    } else {
      setIsSelecting(true);
      setSelectionStart({ rowId, colKey });
      setSelectedCells(new Set([getCellKey(rowId, colKey)]));
    }
    setEditingCell(null);
  };

  const handleCellMouseEnter = (rowId: string, colKey: string) => {
    if (!isSelecting || !selectionStart) return;
    const col = columns.find(c => c.key === colKey);
    if (col?.isDisabled) return;
    selectRange(selectionStart, { rowId, colKey });
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleCellDoubleClick = (rowId: string, colKey: string) => {
    const col = columns.find(c => c.key === colKey);
    if (col?.isDisabled) return;
    
    const value = getValue(rowId, colKey);
    setEditingCell({ rowId, colKey });
    setInputValue(value > 0 ? value.toString() : '');
    setSelectedCells(new Set([getCellKey(rowId, colKey)]));
  };

  const saveValue = async () => {
    if (!editingCell) return;
    
    const value = parseFloat(inputValue) || 0;
    if (value < 0 || value > 1) {
      toast.error('Effort phải từ 0 đến 1');
      return;
    }

    const row = rows.find(r => r.id === editingCell.rowId);
    if (!row) return;

    // Save to all selected cells
    const cellsToUpdate = selectedCells.size > 1 ? Array.from(selectedCells) : [getCellKey(editingCell.rowId, editingCell.colKey)];
    
    for (const cellKey of cellsToUpdate) {
      const { rowId, colKey } = parseCellKey(cellKey);
      const cellRow = rows.find(r => r.id === rowId);
      if (!cellRow) continue;
      
      try {
        await onValueChange(cellRow.employeeId, cellRow.projectId, colKey, value);
      } catch (error) {
        console.error('Error saving effort:', error);
      }
    }
    
    setEditingCell(null);
    setSelectedCells(new Set());
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (!editingCell) return;
    
    const { rowIdx, colIdx } = getRowAndColIndex(editingCell.rowId, editingCell.colKey);

    if (e.key === 'Enter') {
      e.preventDefault();
      await saveValue();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setSelectedCells(new Set());
    } else if (e.key === 'Tab') {
      e.preventDefault();
      await saveValue();
      
      // Move to next cell
      let nextCol = colIdx + (e.shiftKey ? -1 : 1);
      let nextRow = rowIdx;
      
      while (nextCol >= 0 && nextCol < columns.length) {
        if (!columns[nextCol].isDisabled) {
          break;
        }
        nextCol += e.shiftKey ? -1 : 1;
      }
      
      if (nextCol >= columns.length) {
        nextRow++;
        nextCol = 0;
        while (nextCol < columns.length && columns[nextCol].isDisabled) nextCol++;
      } else if (nextCol < 0) {
        nextRow--;
        nextCol = columns.length - 1;
        while (nextCol >= 0 && columns[nextCol].isDisabled) nextCol--;
      }
      
      if (nextRow >= 0 && nextRow < rows.length && nextCol >= 0 && nextCol < columns.length) {
        const nextRowData = rows[nextRow];
        const nextColData = columns[nextCol];
        if (!nextColData.isDisabled) {
          const value = getValue(nextRowData.id, nextColData.key);
          setEditingCell({ rowId: nextRowData.id, colKey: nextColData.key });
          setInputValue(value > 0 ? value.toString() : '');
          setSelectedCells(new Set([getCellKey(nextRowData.id, nextColData.key)]));
        }
      }
    }
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  return (
    <div ref={gridRef} className="select-none">
      {rows.map((row, rowIdx) => (
        <div key={row.id} className="flex border-t border-border/30">
          {columns.map(col => {
            const value = getValue(row.id, col.key);
            const cellKey = getCellKey(row.id, col.key);
            const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === col.key;
            const isSelected = selectedCells.has(cellKey);
            const warning = getWarning?.(row.id, col.key, value);

            return (
              <div
                key={col.key}
                className={cn(
                  'p-0.5 text-center border-l border-border/30 transition-colors',
                  columnWidth,
                  col.isDisabled && 'bg-muted cursor-not-allowed',
                  col.isHoliday && 'bg-muted-foreground/30',
                  col.isWeekend && !col.isHoliday && 'bg-muted-foreground/30',
                  !col.isDisabled && warning === 'over' && 'bg-destructive/25',
                  !col.isDisabled && warning === 'under' && 'bg-warning/20',
                  !col.isDisabled && isSelected && 'ring-2 ring-primary ring-inset',
                  !col.isDisabled && !isEditing && 'cursor-cell hover:bg-accent/30'
                )}
                onMouseDown={(e) => handleCellMouseDown(row.id, col.key, e)}
                onMouseEnter={() => handleCellMouseEnter(row.id, col.key)}
                onDoubleClick={() => handleCellDoubleClick(row.id, col.key)}
              >
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={saveValue}
                    onKeyDown={handleKeyDown}
                    className="w-full h-6 text-center bg-background border-0 outline-none text-xs"
                  />
                ) : (
                  <div 
                    className="w-full h-6 flex items-center justify-center relative rounded-sm"
                    style={value > 0 && projectColor && !col.isDisabled ? { backgroundColor: `${projectColor}25` } : undefined}
                  >
                    {value > 0 ? (
                      <span className={cn(
                        'text-xs font-medium',
                        warning === 'over' && 'text-destructive font-bold',
                        warning === 'under' && 'text-warning font-bold'
                      )}>
                        {value}
                      </span>
                    ) : !col.isDisabled ? (
                      <Edit3 className="w-2 h-2 text-muted-foreground/30" />
                    ) : (
                      <span className="text-xs text-muted-foreground/40">-</span>
                    )}
                    {warning === 'over' && !col.isDisabled && (
                      <AlertTriangle className="absolute top-0 right-0 w-2.5 h-2.5 text-destructive" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
