'use client';

import {
  DndContext,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Beaker, GripVertical, Layers } from 'lucide-react';
import type { SensorDescriptor } from '@dnd-kit/core';
import { SortableItem } from './SortableItem';
import { DragOverlayPortal } from './DragOverlayPortal';
import type { Category, Test } from './types';

interface Props {
  selectedCategory: Category | null;
  filteredTests: Test[];
  activeTestId: string | null;
  activeDragWidth: number | null;
  sensors: SensorDescriptor<object>[];
  searchQuery: string;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function TestListPanel({
  selectedCategory,
  filteredTests,
  activeTestId,
  activeDragWidth,
  sensors,
  searchQuery,
  onDragStart,
  onDragEnd,
}: Props) {
  return (
    <div className="lg:col-span-1 space-y-4">
      <div className="bento-panel p-4 rounded-b-none border-b-0 flex items-center gap-3">
        <Beaker size={18} className="text-emerald-600" />
        <h2 className="font-semibold text-[var(--color-text)]">
          Tests de :{' '}
          <span className="text-[var(--color-text-secondary)]">{selectedCategory?.name}</span>
        </h2>
      </div>
      <div className="bento-panel rounded-t-none p-2 min-h-[400px] hover:translate-y-0">
        {selectedCategory ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={filteredTests.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {filteredTests.map((test) => (
                  <SortableItem key={test.id} id={test.id}>
                    {({ attributes, listeners }) => (
                      <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] font-mono text-[10px] flex items-center justify-center font-semibold group-hover:bg-[var(--color-accent-soft)] group-hover:text-[var(--color-accent)] transition-colors">
                            {test.code}
                          </div>
                          <span className="font-medium text-[var(--color-text)]">{test.name}</span>
                        </div>
                        <div
                          {...attributes}
                          {...listeners}
                          className="p-2 -mr-2 text-slate-300 group-hover:text-indigo-400 cursor-grab active:cursor-grabbing touch-none"
                        >
                          <GripVertical size={16} />
                        </div>
                      </div>
                    )}
                  </SortableItem>
                ))}
                {filteredTests.length === 0 && (
                  <div className="p-8 text-center text-slate-400 italic">
                    {searchQuery ? 'Aucun test trouvé' : 'Aucun test dans cette catégorie'}
                  </div>
                )}
              </div>
            </SortableContext>
            <DragOverlayPortal>
              {activeTestId
                ? (() => {
                    const test = filteredTests.find((t) => t.id === activeTestId);
                    if (!test) return null;
                    return (
                      <div
                        className="p-3 bg-[var(--color-surface)] border border-indigo-200 rounded-xl flex items-center justify-between shadow-2xl opacity-90 scale-105"
                        style={{ width: activeDragWidth ? `${activeDragWidth}px` : 'auto' }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-[var(--color-accent)] font-mono text-[10px] flex items-center justify-center font-bold">
                            {test.code}
                          </div>
                          <span className="font-bold text-slate-700">{test.name}</span>
                        </div>
                        <GripVertical size={16} className="text-indigo-400" />
                      </div>
                    );
                  })()
                : null}
            </DragOverlayPortal>
          </DndContext>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Layers size={48} className="mb-4 opacity-20" />
            <p>Sélectionnez une catégorie pour ordonner ses tests</p>
          </div>
        )}
      </div>
    </div>
  );
}
