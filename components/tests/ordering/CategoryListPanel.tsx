'use client';

import {
  DndContext,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronRight, Edit2, GripVertical, Layers, Trash2 } from 'lucide-react';
import type { SensorDescriptor } from '@dnd-kit/core';
import { SortableItem } from './SortableItem';
import { CategoryIcon } from './CategoryIcon';
import { DragOverlayPortal } from './DragOverlayPortal';

import type { Category } from './types';

interface Props {
  visibleCategories: Category[];
  categories: Category[];
  selectedCategory: Category | null;
  expandedCategories: Set<string>;
  activeCategoryId: string | null;
  activeDragWidth: number | null;
  sensors: SensorDescriptor<object>[];
  searchQuery: string;
  onSelectCategory: (cat: Category) => void;
  onToggleExpanded: (id: string) => void;
  onOpenEditModal: (cat: Category) => void;
  onDeleteRequest: (cat: Category) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function CategoryListPanel({
  visibleCategories,
  categories,
  selectedCategory,
  expandedCategories,
  activeCategoryId,
  activeDragWidth,
  sensors,
  searchQuery,
  onSelectCategory,
  onToggleExpanded,
  onOpenEditModal,
  onDeleteRequest,
  onDragStart,
  onDragEnd,
}: Props) {
  const renderCategoryItem = (cat: Category, depth: number = 0) => {
    const hasChildren = categories.some((c) => c.parentId === cat.id);
    const isExpanded = expandedCategories.has(cat.id);

    return (
      <SortableItem key={cat.id} id={cat.id}>
        {({ attributes, listeners }) => (
          <div
            className={`p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${
              selectedCategory?.id === cat.id
                ? 'bg-indigo-50 border-indigo-200 shadow-md'
                : 'bg-[var(--color-surface)] border-transparent hover:bg-[var(--color-surface-muted)] hover:border-[var(--color-border)]'
            }`}
            style={{ marginLeft: `${depth * 24}px` }}
          >
            <div className="flex items-center gap-3 flex-1">
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpanded(cat.id);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-transform"
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                >
                  <ChevronRight size={16} />
                </button>
              )}
              {!hasChildren && depth > 0 && <div className="w-4" />}
              <div onClick={() => onSelectCategory(cat)} className="flex items-center gap-3 flex-1 min-w-0">
                <CategoryIcon iconName={cat.icon} />
                <div className="flex flex-col min-w-0 truncate">
                  <span className="font-bold text-slate-700 truncate">{cat.name}</span>
                  {depth > 0 && (
                    <span className="text-[10px] text-slate-400 uppercase font-black truncate">Sous-catégorie</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEditModal(cat);
                }}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Modifier"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRequest(cat);
                }}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 size={14} />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <div
                {...attributes}
                {...listeners}
                className="p-2 -mr-2 text-slate-300 hover:text-indigo-400 cursor-grab active:cursor-grabbing touch-none"
              >
                <GripVertical size={16} />
              </div>
            </div>
          </div>
        )}
      </SortableItem>
    );
  };

  return (
    <div className="lg:col-span-1 space-y-4">
      <div className="bento-panel p-4 rounded-b-none border-b-0 flex items-center gap-3">
        <Layers size={18} className="text-[var(--color-accent)]" />
        <h2 className="font-semibold text-[var(--color-text)]">Catégories</h2>
      </div>
      <div className="bento-panel rounded-t-none p-2 min-h-[400px] hover:translate-y-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={visibleCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {visibleCategories.map((cat) => {
                let depth = 0;
                if (!searchQuery) {
                  let current = cat;
                  while (current.parentId) {
                    depth++;
                    const parent = categories.find((p) => p.id === current.parentId);
                    if (!parent) break;
                    current = parent;
                  }
                }
                return renderCategoryItem(cat, depth);
              })}
            </div>
          </SortableContext>
          <DragOverlayPortal>
            {activeCategoryId
              ? (() => {
                  const cat = categories.find((c) => c.id === activeCategoryId);
                  if (!cat) return null;
                  return (
                    <div
                      className="p-4 rounded-xl flex items-center justify-between bg-[var(--color-surface)] border border-blue-200 shadow-xl opacity-90 scale-105 cursor-grabbing"
                      style={{ width: activeDragWidth ? `${activeDragWidth}px` : 'auto' }}
                    >
                      <div className="flex items-center gap-3">
                        <CategoryIcon iconName={cat.icon} />
                        <span className="font-bold text-slate-700">{cat.name}</span>
                      </div>
                      <GripVertical size={16} className="text-indigo-400" />
                    </div>
                  );
                })()
              : null}
          </DragOverlayPortal>
        </DndContext>
      </div>
    </div>
  );
}
