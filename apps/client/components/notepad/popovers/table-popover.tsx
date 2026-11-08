/**
 * Inserts a table by picking its size from a grid. The first row is the
 * header, as markdown tables require one.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { type KeyboardEvent, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import {
  InsertPopover,
  type PopoverAnchor,
} from "../components/insert-popover";

export const MAX_TABLE_ROWS = 50;
export const MAX_TABLE_COLUMNS = 20;

const GRID_ROWS = 8;
const GRID_COLUMNS = 10;

interface TableSize {
  columns: number;
  rows: number;
}

const DEFAULT_SIZE: TableSize = { columns: 3, rows: 3 };

const CELLS: TableSize[] = Array.from(
  { length: GRID_ROWS * GRID_COLUMNS },
  (_, index) => ({
    columns: (index % GRID_COLUMNS) + 1,
    rows: Math.floor(index / GRID_COLUMNS) + 1,
  })
);

const KEY_MOVES: Record<string, TableSize> = {
  ArrowDown: { columns: 0, rows: 1 },
  ArrowLeft: { columns: -1, rows: 0 },
  ArrowRight: { columns: 1, rows: 0 },
  ArrowUp: { columns: 0, rows: -1 },
};

const clamp = (value: number, max: number) => Math.min(Math.max(value, 1), max);

const TableGrid = ({ onPick }: { onPick: (size: TableSize) => void }) => {
  const [size, setSize] = useState(DEFAULT_SIZE);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: KeyboardEvent) => {
    const move = KEY_MOVES[event.key];
    if (!move) {
      return;
    }
    event.preventDefault();
    const next = {
      columns: clamp(size.columns + move.columns, GRID_COLUMNS),
      rows: clamp(size.rows + move.rows, GRID_ROWS),
    };
    setSize(next);
    gridRef.current
      ?.querySelector<HTMLButtonElement>(
        `[data-cell="${next.rows}-${next.columns}"]`
      )
      ?.focus();
  };

  return (
    <div className="grid gap-2">
      <div
        className="grid w-fit gap-0.5"
        ref={gridRef}
        style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1.25rem)` }}
      >
        {CELLS.map((cell) => {
          const isPicked =
            cell.rows <= size.rows && cell.columns <= size.columns;
          const isCorner =
            cell.rows === size.rows && cell.columns === size.columns;
          return (
            <button
              aria-label={`${cell.rows} by ${cell.columns} table`}
              className={cn(
                "focus-visible:ring-ring size-5 border outline-none focus-visible:ring-1",
                isPicked
                  ? "border-primary bg-primary/25"
                  : "border-foreground/20 bg-foreground/5"
              )}
              data-cell={`${cell.rows}-${cell.columns}`}
              key={`${cell.rows}-${cell.columns}`}
              onClick={() => onPick(cell)}
              onFocus={() => setSize(cell)}
              onKeyDown={handleKeyDown}
              onPointerEnter={() => setSize(cell)}
              tabIndex={isCorner ? 0 : -1}
              type="button"
            />
          );
        })}
      </div>
      <p aria-live="polite" className="text-muted-foreground tabular-nums">
        {size.rows} rows × {size.columns} columns
      </p>
    </div>
  );
};

interface TablePopoverProps {
  anchor: PopoverAnchor | null;
  anchorElem: HTMLElement;
  onClose: () => void;
  open: boolean;
}

const TablePopover = ({
  anchor,
  anchorElem,
  onClose,
  open,
}: TablePopoverProps) => {
  const [editor] = useLexicalComposerContext();

  const insert = ({ columns, rows }: TableSize) => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns: String(columns),
      includeHeaders: { columns: false, rows: true },
      rows: String(rows),
    });
    onClose();
  };

  return (
    <InsertPopover
      anchor={anchor}
      anchorElem={anchorElem}
      className="w-min"
      description={
        <>
          The first row is the header. For a bigger table, type{" "}
          <code>/12x6</code> in the note.
        </>
      }
      onClose={onClose}
      open={open}
      title="Insert table"
    >
      <TableGrid key={String(open)} onPick={insert} />
    </InsertPopover>
  );
};

export { TablePopover };
