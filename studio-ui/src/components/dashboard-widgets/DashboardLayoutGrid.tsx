import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, LayoutGrid, Plus, RotateCcw, X } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import {
  ALL_LAYOUT_TYPES,
  type ColSpan,
  type LayoutItem,
  newLayoutItem,
  OVERVIEW_SLOT_IDS,
  type OverviewSlotId,
  type RowSpan,
  useDashboardWidgets,
  WIDGET_LABELS,
  type WidgetType,
} from "@/contexts/DashboardWidgetsContext";
import { OverviewSlotCard } from "./OverviewSlotCard";
import { WidgetContent } from "./WidgetContent";

/*
 * The admin hub's dashboard: one responsive grid (1 column on phones, 2 on
 * tablets, 3 on desktop) that holds the overview cards and the extra widgets.
 * "Customize" opens the library; cards can then be dragged anywhere, resized
 * and removed, and new ones dragged in from the library to any position.
 */

const NEW_PREFIX = "new:"; // library item being dragged
const DRAG_PREFIX = "drag:"; // its placeholder inside the grid while dragging

const COL_CLASS: Record<ColSpan, string> = {
  1: "col-span-1",
  2: "col-span-1 md:col-span-2",
  3: "col-span-1 md:col-span-2 xl:col-span-3",
};
const ROW_CLASS: Record<RowSpan, string> = { 1: "row-span-1", 2: "row-span-2" };

const isOverview = (t: WidgetType): t is OverviewSlotId =>
  (OVERVIEW_SLOT_IDS as readonly string[]).includes(t);

export function DashboardLayoutGrid({ cards }: { cards: Record<OverviewSlotId, ReactNode> }) {
  const { layout, setLayout, updateLayoutItem, removeLayoutItem, resetLayout, panelExpanded, setPanelExpanded } =
    useDashboardWidgets();
  const editing = panelExpanded;
  const [active, setActive] = useState<{ id: string; type: WidgetType; width: number; height: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onPage = useMemo(() => new Set(layout.map((i) => i.type)), [layout]);
  const library = ALL_LAYOUT_TYPES.filter((t) => !onPage.has(t));

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    const rect = e.active.rect.current.initial;
    const type = (e.active.data.current?.type ?? layout.find((i) => i.id === id)?.type) as WidgetType;
    setActive({ id, type, width: rect?.width ?? 300, height: rect?.height ?? 200 });
  }

  // Items move as you drag, so the grid reflows live (and animates) instead of snapping at the end.
  function onDragOver(e: DragOverEvent) {
    const { active: a, over } = e;
    if (!over) return;
    const activeId = String(a.id);
    const overId = String(over.id);
    setLayout((prev) => {
      if (activeId.startsWith(NEW_PREFIX)) {
        const type = activeId.slice(NEW_PREFIX.length) as WidgetType;
        const placeholderId = DRAG_PREFIX + type;
        const from = prev.findIndex((i) => i.id === placeholderId);
        if (overId === placeholderId) return prev;
        let to = prev.findIndex((i) => i.id === overId);
        if (overId === "grid-end" || to === -1) to = prev.length;
        if (from === -1) {
          const next = [...prev];
          next.splice(to, 0, newLayoutItem(type, placeholderId));
          return next;
        }
        return arrayMove(prev, from, Math.min(to, prev.length - 1));
      }
      const from = prev.findIndex((i) => i.id === activeId);
      const to = overId === "grid-end" ? prev.length - 1 : prev.findIndex((i) => i.id === overId);
      if (from === -1 || to === -1 || from === to) return prev;
      return arrayMove(prev, from, to);
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const activeId = String(e.active.id);
    if (activeId.startsWith(NEW_PREFIX)) {
      const type = activeId.slice(NEW_PREFIX.length) as WidgetType;
      const placeholderId = DRAG_PREFIX + type;
      setLayout((prev) =>
        e.over
          ? prev.map((i) => (i.id === placeholderId ? { ...newLayoutItem(type), id: `${type}-${Date.now().toString(36)}` } : i))
          : prev.filter((i) => i.id !== placeholderId),
      );
    }
    setActive(null);
  }

  function onDragCancel() {
    setLayout((prev) => prev.filter((i) => !i.id.startsWith(DRAG_PREFIX)));
    setActive(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="px-3 md:px-6 flex flex-col gap-3">
        <div className="flex items-center justify-end gap-2">
          {editing && (
            <button
              type="button"
              onClick={resetLayout}
              className="dash-btn inline-flex items-center gap-1.5 h-8 px-3 border border-white/15 text-gray-400 hover:text-white hover:border-white/30 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset layout
            </button>
          )}
          <button
            type="button"
            onClick={() => setPanelExpanded(!editing)}
            className={`dash-btn inline-flex items-center gap-1.5 h-8 px-3 border text-xs ${
              editing ? "bg-white text-black border-white" : "border-white/15 text-gray-300 hover:text-white hover:border-white/30"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> {editing ? "Done" : "Customize"}
          </button>
        </div>

        <div className={`flex gap-6 items-start ${editing ? "flex-col lg:flex-row-reverse" : ""}`}>
          {editing && <Library types={library} onAdd={(t) => setLayout((prev) => [newLayoutItem(t), ...prev])} />}

          <SortableContext items={layout.map((i) => i.id)} strategy={() => null}>
            <div className="grid flex-1 w-full min-w-0 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-[220px] gap-6 grid-flow-row-dense">
              {layout.map((item) => (
                <GridCell
                  key={item.id}
                  item={item}
                  editing={editing}
                  hidden={active?.id === item.id}
                  onResize={(patch) => updateLayoutItem(item.id, patch)}
                  onRemove={() => removeLayoutItem(item.id)}
                >
                  {item.id.startsWith(DRAG_PREFIX) ? (
                    <Placeholder type={item.type} />
                  ) : isOverview(item.type) ? (
                    cards[item.type]
                  ) : (
                    <OverviewSlotCard>
                      <WidgetContent
                        item={{ id: item.id, widgetType: item.type, width: 1, config: item.config }}
                        onConfigChange={(config) =>
                          updateLayoutItem(item.id, { config: { ...item.config, ...config } })
                        }
                      />
                    </OverviewSlotCard>
                  )}
                </GridCell>
              ))}
              {editing && <GridEnd empty={layout.length === 0} />}
            </div>
          </SortableContext>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" }}>
        {active && !active.id.startsWith(NEW_PREFIX) ? (
          <div
            className="border border-white/40 bg-[#141414] shadow-2xl flex items-center gap-2 px-4 text-sm text-white cursor-grabbing"
            style={{ width: active.width, height: active.height }}
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
            {WIDGET_LABELS[active.type] ?? active.type}
          </div>
        ) : active ? (
          <LibraryCard type={active.type} overlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function GridCell({
  item,
  editing,
  hidden,
  onResize,
  onRemove,
  children,
}: {
  item: LayoutItem;
  editing: boolean;
  hidden: boolean;
  onResize: (patch: { cols?: ColSpan; rows?: RowSpan }) => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !editing,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition ?? "transform 220ms cubic-bezier(.2,.8,.2,1)",
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative min-w-0 min-h-0 ${COL_CLASS[item.cols]} ${ROW_CLASS[item.rows]} ${
        hidden || isDragging ? "opacity-30" : ""
      }`}
    >
      <div className={`h-full min-h-0 overflow-hidden flex flex-col [&>*]:flex-1 [&>*]:min-h-0 ${editing ? "pointer-events-none select-none" : ""}`}>
        {children}
      </div>
      {editing && !item.id.startsWith(DRAG_PREFIX) && (
        <div
          {...attributes}
          {...listeners}
          className="dash-edit absolute inset-0 z-20 cursor-grab active:cursor-grabbing border border-dashed border-white/25 hover:border-white/50 bg-black/55 hover:bg-black/45 transition-colors"
        >
          <div className="absolute top-2 left-2 right-2 flex items-center gap-2 text-xs whitespace-nowrap" onPointerDown={(e) => e.stopPropagation()}>
            <span className="dash-chip inline-flex items-center gap-1 h-7 px-2 min-w-0 truncate bg-[#141414] border border-white/15 text-gray-200 pointer-events-none">
              <GripVertical className="w-3.5 h-3.5 text-gray-500" />
              {WIDGET_LABELS[item.type] ?? item.type}
            </span>
            <span className="flex-1" />
            <SizeToggle label="Width" options={[1, 2, 3]} value={item.cols} onChange={(v) => onResize({ cols: v as ColSpan })} />
            <SizeToggle label="Height" options={[1, 2]} value={item.rows} names={["S", "L"]} onChange={(v) => onResize({ rows: v as RowSpan })} />
            <button
              type="button"
              onClick={onRemove}
              title="Remove from dashboard"
              aria-label="Remove from dashboard"
              className="dash-chip inline-flex items-center justify-center w-7 h-7 bg-[#141414] border border-white/15 text-gray-400 hover:text-red-400 hover:border-red-400/50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SizeToggle({
  label,
  options,
  value,
  names,
  onChange,
}: {
  label: string;
  options: number[];
  value: number;
  names?: string[];
  onChange: (v: number) => void;
}) {
  return (
    <span className="dash-chip inline-flex h-7 bg-[#141414] border border-white/15" role="group" aria-label={label} title={label}>
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={`w-7 h-full text-xs ${value === o ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}
        >
          {names?.[i] ?? o}
        </button>
      ))}
    </span>
  );
}

function Placeholder({ type }: { type: WidgetType }) {
  return (
    <div className="h-full border border-dashed border-white/40 bg-white/[4%] flex items-center justify-center text-sm text-gray-300">
      {WIDGET_LABELS[type] ?? type}
    </div>
  );
}

function GridEnd({ empty }: { empty: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "grid-end" });
  return (
    <div
      ref={setNodeRef}
      className={`col-span-1 row-span-1 border border-dashed flex items-center justify-center text-sm ${
        isOver ? "border-white/50 text-gray-200" : "border-white/15 text-gray-500"
      } ${empty ? "md:col-span-2 xl:col-span-3" : ""}`}
    >
      {empty ? "Drag cards here from the library" : "Drop here to add at the end"}
    </div>
  );
}

function Library({ types, onAdd }: { types: WidgetType[]; onAdd: (t: WidgetType) => void }) {
  return (
    <aside className="dash-library w-full lg:w-[280px] shrink-0 lg:sticky lg:top-0 border border-white/10 bg-[#141414]">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-sm text-white">Add to dashboard</h3>
        <p className="text-xs text-gray-500 mt-1">Drag a card into place, or press + to put it at the top.</p>
      </div>
      <div className="p-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {types.length === 0 && <p className="text-xs text-gray-500 p-2">Everything is on the dashboard.</p>}
        {types.map((t) => (
          <LibraryCard key={t} type={t} onAdd={() => onAdd(t)} />
        ))}
      </div>
    </aside>
  );
}

function LibraryCard({ type, onAdd, overlay }: { type: WidgetType; onAdd?: () => void; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: NEW_PREFIX + type,
    data: { type },
    disabled: overlay,
  });
  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      className={`dash-item flex items-center gap-2 h-11 pl-2 pr-1 border bg-[#1b1b1b] text-sm select-none ${
        overlay ? "border-white/40 shadow-2xl cursor-grabbing w-[240px]" : "border-white/10 hover:border-white/25 cursor-grab"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <GripVertical className="w-4 h-4 text-gray-500 shrink-0" />
      <span className="flex-1 truncate text-gray-200">{WIDGET_LABELS[type] ?? type}</span>
      {onAdd && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onAdd}
          title="Add at the top"
          aria-label={`Add ${WIDGET_LABELS[type] ?? type} at the top`}
          className="w-8 h-8 inline-flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
