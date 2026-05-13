'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';

type SortableRenderProps = Pick<ReturnType<typeof useSortable>, 'attributes' | 'listeners'>;

interface Props {
  id: string;
  children: (props: SortableRenderProps) => ReactNode;
}

export function SortableItem({ id, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 50 : ('auto' as const),
    position: 'relative' as const,
  };

  return (
    <div id={id} ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
}
