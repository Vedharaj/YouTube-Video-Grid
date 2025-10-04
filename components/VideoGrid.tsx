'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import VideoPlayer from './VideoPlayer';
import { extractVideoId } from '@/lib/youtube';

interface VideoItem {
  id: string;
  url: string;
}

interface VideoGridProps {
  initialUrls: string[];
  onRemoveUrl: (url: string) => void;
}

interface DragItem {
  id: string;
  index: number;
}

export default function VideoGrid({ initialUrls, onRemoveUrl }: VideoGridProps) {
  const [videoItems, setVideoItems] = useState<VideoItem[]>(
    initialUrls
      .map((url) => ({ url, id: extractVideoId(url) }))
      .filter((item): item is VideoItem => !!item.id)
  );
  const [activeVideoId, setActiveVideoId] = useState<string | null>(videoItems[0]?.id || null);

  const gridRef = useRef<HTMLDivElement>(null); // Fullscreen ref

  // Sync internal state with parent props
  useEffect(() => {
    const newVideoItems = initialUrls
      .map((url) => ({ url, id: extractVideoId(url) }))
      .filter((item): item is VideoItem => !!item.id);

    setVideoItems(newVideoItems);

    if (activeVideoId && newVideoItems.some((item) => item.id === activeVideoId)) return;
    setActiveVideoId(newVideoItems[0]?.id || null);
  }, [initialUrls, activeVideoId]);

  // Move item for drag/drop
  const moveItem = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const draggedItem = videoItems[dragIndex];
      if (!draggedItem) return;
      const newItems = videoItems.filter((_, idx) => idx !== dragIndex);
      newItems.splice(hoverIndex, 0, draggedItem);
      setVideoItems(newItems);
    },
    [videoItems]
  );

  // Grid drop zone
  const [{ isOver }, drop] = useDrop({
    accept: 'video',
    collect: (monitor: { isOver: () => any }) => ({ isOver: monitor.isOver() }),
    drop: () => {},
  });

  // Remove video
  const removeVideo = (url: string) => {
    const newItems = videoItems.filter((item) => item.url !== url);
    setVideoItems(newItems);
    onRemoveUrl(url);
    if (activeVideoId === extractVideoId(url)) setActiveVideoId(newItems[0]?.id || null);
  };

  // Fullscreen for entire grid
  const handleGridFullscreen = () => {
    if (!gridRef.current) return;

    const elem = gridRef.current;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch((err) => console.error('Fullscreen request failed:', err));
    } else {
      document.exitFullscreen().catch((err) => console.error('Exiting fullscreen failed:', err));
    }
  };

  const gridCols = 'grid-cols-2'; // 2-column grid

  return (
    <div
      ref={gridRef}
      className="relative w-full h-full overflow-auto bg-gray-900 scrollbar-none"
    >
      <div
        ref={drop}
        className={`grid ${gridCols} gap-4 p-4 max-w-7xl mx-auto ${isOver ? 'opacity-75' : ''}`}
      >
        {videoItems.map((item, index) => (
          <DraggableVideoPlayer
            key={`${item.id}-${index}`}
            index={index}
            item={item}
            isActive={activeVideoId === item.id}
            onClick={() => setActiveVideoId(item.id)}
            onRemove={() => removeVideo(item.url)}
            moveItem={moveItem}
          />
        ))}
        {videoItems.length === 0 && (
          <p className="col-span-full text-center text-white/70 py-8">
            Add a YouTube URL to get started!
          </p>
        )}
      </div>

      {/* Fullscreen button for grid */}
      <button
        onClick={handleGridFullscreen}
        className="fixed bottom-4 right-4 z-50 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
        title="Fullscreen Grid"
      >
        ⛶
      </button>
    </div>
  );
}

// Draggable video component
function DraggableVideoPlayer({
  index,
  item,
  isActive,
  onClick,
  onRemove,
  moveItem,
}: {
  index: number;
  item: VideoItem;
  isActive: boolean;
  onClick: () => void;
  onRemove: () => void;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId, isOver }, drop] = useDrop({
    accept: 'video',
    collect: (monitor: { getHandlerId: () => any; isOver: () => any }) => ({
      handlerId: monitor.getHandlerId?.(),
      isOver: monitor.isOver(),
    }),
    hover(draggedItem: DragItem, monitor: { getClientOffset: () => any }) {
      if (!ref.current) return;
      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = (clientOffset as { y: number }).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveItem(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'video',
    item: () => ({ id: item.id, index }),
    collect: (monitor: { isDragging: () => any }) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className="relative cursor-grab transition-opacity touch-manipulation select-none"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={onClick}
    >
      <VideoPlayer videoId={item.id} url={item.url} isActive={isActive} onClick={onClick} onRemove={onRemove} />
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center text-white font-bold">
          Dragging...
        </div>
      )}
      {isOver && !isDragging && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}
