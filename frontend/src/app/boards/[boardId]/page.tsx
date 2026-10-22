"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getApiError, useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { trackCreateContent } from "@/lib/analytics";

const DEFAULT_MIND_DOC = {
  root: {
    id: "root",
    text: "Mind Map",
    children: [],
  },
  positions: {
    root: { x: 60, y: 200 },
  },
};

const DEFAULT_WHITEBOARD_DOC = {
  kind: "whiteboard" as const,
  items: [],
};

type MindNode = {
  id: string;
  text: string;
  children: MindNode[];
  color?: string;
  emoji?: string;
  icon?: string;
  comment?: string;
  tags?: string[];
  borderColor?: string;
  textColor?: string;
  fontSize?: number;
  tagStyle?: {
    bgColor?: string;
    textColor?: string;
    borderColor?: string;
  };
};

type MindDoc = {
  root: MindNode;
  positions?: Record<string, { x: number; y: number }>;
};

type WhiteboardItemType = "rect" | "ellipse" | "sticky" | "text" | "image";

type WhiteboardItem = {
  id: string;
  type: WhiteboardItemType;
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  src?: string;
  color?: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: number;
};

type WhiteboardDoc = {
  kind: "whiteboard";
  items: WhiteboardItem[];
};

type BoardDoc = MindDoc | WhiteboardDoc;

const isMindDoc = (doc: BoardDoc | null): doc is MindDoc =>
  !!doc && "root" in doc;

const isWhiteboardDoc = (doc: BoardDoc | null): doc is WhiteboardDoc =>
  !!doc && "kind" in doc && doc.kind === "whiteboard";

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `node_${Math.random().toString(36).slice(2, 10)}`;
};

const getWhiteboardDefaults = (type: WhiteboardItemType) => {
  switch (type) {
    case "ellipse":
      return {
        w: 220,
        h: 140,
        color: "#FFFFFF",
        borderColor: "#CBD5E1",
        textColor: "#0F172A",
        fontSize: 14,
        text: "Elipse",
      };
    case "sticky":
      return {
        w: 240,
        h: 160,
        color: "#FFF7ED",
        borderColor: "#FDBA74",
        textColor: "#0F172A",
        fontSize: 14,
        text: "Anotação",
      };
    case "text":
      return {
        w: 220,
        h: 80,
        color: "transparent",
        borderColor: "transparent",
        textColor: "#0F172A",
        fontSize: 16,
        text: "Texto",
      };
    default:
      return {
        w: 240,
        h: 140,
        color: "#FFFFFF",
        borderColor: "#CBD5E1",
        textColor: "#0F172A",
        fontSize: 14,
        text: "Bloco",
      };
  }
};

type Board = {
  id: string;
  name: string;
  type: "mindmap" | "whiteboard";
  workspace_id: string;
};

type BoardDocument = {
  id: number;
  board_id: string;
  version: number;
  content_json: BoardDoc;
};

export default function BoardEditorPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params?.boardId as string | undefined;
  const { token, workspaces, refresh } = useAuth();
  useI18n();

  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [doc, setDoc] = useState<BoardDoc | null>(null);
  const [baseVersion, setBaseVersion] = useState<number>(0);
  const [docMissing, setDocMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("root");
  const [menu, setMenu] = useState<{
    open: boolean;
    x: number;
    y: number;
    nodeId: string | null;
  }>({ open: false, x: 0, y: 0, nodeId: null });
  const [editing, setEditing] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [propertiesMinimized, setPropertiesMinimized] = useState(false);
  const [propertiesTab, setPropertiesTab] = useState<"tags" | "style">("tags");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragIdRef = useRef<string | null>(null);
  const dragDeltaRef = useRef({ dx: 0, dy: 0 });
  const dragRafRef = useRef<number | null>(null);
  const dragLayoutRef = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const commentRefs = useRef<Record<string, HTMLParagraphElement | null>>({});
  const [commentOverflow, setCommentOverflow] = useState<Record<string, boolean>>({});
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [pendingCenterId, setPendingCenterId] = useState<string | null>(null);

  const emojiOptions = ["😀", "✨", "🔥", "✅", "📌", "💡", "🚀", "📎", "🎯", "🧠", "📝", "🔔"];

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    refresh().catch(() => null);
  }, [token, refresh, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("flowio_workspace");
    if (stored) {
      setCurrentWorkspaceId(stored);
    }
  }, []);

  useEffect(() => {
    if (!currentWorkspaceId && workspaces.length > 0) {
      const next = workspaces[0].id;
      setCurrentWorkspaceId(next);
      localStorage.setItem("flowio_workspace", next);
    }
  }, [workspaces, currentWorkspaceId]);

  const loadBoard = useCallback(async () => {
    if (!token || !boardId) return;
    const data = await apiFetch<{ board: Board }>(`/boards/${boardId}`, {}, token);
    setBoard(data.board);
    setCurrentWorkspaceId(data.board.workspace_id);
    localStorage.setItem("flowio_workspace", data.board.workspace_id);
  }, [token, boardId]);

  const loadDocument = useCallback(async () => {
    if (!token || !boardId) return;
    try {
      const data = await apiFetch<{ document: BoardDocument }>(
        `/boards/${boardId}/document/latest`,
        {},
        token
      );
      const content = data.document.content_json as BoardDoc;
      setDoc(content);
      setBaseVersion(data.document.version);
      if (isMindDoc(content) && !content.positions) {
        setPendingCenterId("root");
      }
      setDebugInfo(
        JSON.stringify(
          {
            source: "latest",
            version: data.document.version,
            hasRoot: isMindDoc(content),
            keys: Object.keys(content || {}),
          },
          null,
          2
        )
      );
    } catch (err) {
      const apiError = getApiError(err);
      if (apiError?.code === "document_not_found") {
        setDoc(null);
        setDocMissing(true);
        setBaseVersion(0);
        setPendingCenterId("root");
        setDebugInfo(
          JSON.stringify(
            { source: "default", reason: "document_not_found", hasRoot: true },
            null,
            2
          )
        );
      } else {
        setError(apiError?.message || "Erro ao carregar documento.");
        setDebugInfo(
          JSON.stringify(
            { source: "error", code: apiError?.code, message: apiError?.message },
            null,
            2
          )
        );
      }
    }
  }, [token, boardId]);

  useEffect(() => {
    loadBoard().catch(() => null);
    loadDocument().catch(() => null);
  }, [loadBoard, loadDocument]);

  useEffect(() => {
    if (!docMissing || !board) return;
    const defaultDoc = board.type === "whiteboard" ? DEFAULT_WHITEBOARD_DOC : DEFAULT_MIND_DOC;
    setDoc(defaultDoc);
    setDocMissing(false);
  }, [docMissing, board]);

  useEffect(() => {
    if (doc && !isMindDoc(doc) && board?.type !== "whiteboard") {
      setDoc(DEFAULT_MIND_DOC);
      setPendingCenterId("root");
    }
  }, [doc, board]);

  const saveDocument = useCallback(async () => {
    if (!token || !boardId || !doc) return;
    setSaving(true);
    setError(null);
    try {
      const data = await apiFetch<{ document: BoardDocument }>(
        `/boards/${boardId}/document`,
        {
          method: "PUT",
          body: JSON.stringify({ base_version: baseVersion, content_json: doc }),
        },
        token
      );
      setBaseVersion(data.document.version);
    } catch (err) {
      const apiError = getApiError(err);
      setError(apiError?.message || "Erro ao salvar documento.");
    } finally {
      setSaving(false);
    }
  }, [token, boardId, doc, baseVersion]);

  // Autosave disabled: manual save only.

  const updateNodeText = (id: string, text: string) => {
    const base = doc && "root" in doc ? doc : DEFAULT_MIND_DOC;
    const next = structuredClone(base) as MindDoc;
    const stack = [next.root];
    while (stack.length) {
      const node = stack.pop()!;
      if (node.id === id) {
        node.text = text;
        break;
      }
      node.children.forEach((child) => stack.push(child));
    }
    setDoc(next);
  };

  const updateNodeProps = useCallback(
    (
      id: string,
      props: Partial<
        Pick<
          MindNode,
          | "color"
          | "emoji"
          | "icon"
          | "comment"
          | "tags"
          | "borderColor"
          | "textColor"
          | "fontSize"
          | "tagStyle"
        >
      >
    ) => {
      const base = doc && "root" in doc ? doc : DEFAULT_MIND_DOC;
      const next = structuredClone(base) as MindDoc;
      const stack = [next.root];
      while (stack.length) {
        const node = stack.pop()!;
        if (node.id === id) {
          if ("color" in props) node.color = props.color;
          if ("emoji" in props) node.emoji = props.emoji;
          if ("icon" in props) node.icon = props.icon;
          if ("comment" in props) node.comment = props.comment;
          if ("tags" in props) node.tags = props.tags;
          if ("borderColor" in props) node.borderColor = props.borderColor;
          if ("textColor" in props) node.textColor = props.textColor;
          if ("fontSize" in props) node.fontSize = props.fontSize;
          if ("tagStyle" in props) {
            node.tagStyle = {
              ...node.tagStyle,
              ...props.tagStyle,
            };
          }
          break;
        }
        node.children.forEach((child) => stack.push(child));
      }
      setDoc(next);
    },
    [doc]
  );

  const addChild = useCallback((parentId: string) => {
    const base = doc && "root" in doc ? doc : DEFAULT_MIND_DOC;
    const next = structuredClone(base) as MindDoc;
    const stack = [next.root];
    const newId = generateId();
    while (stack.length) {
      const node = stack.pop()!;
      if (node.id === parentId) {
        node.children.push({ id: newId, text: "Novo", children: [] });
        const parentPos = next.positions?.[parentId] ?? { x: 60, y: 200 };
        next.positions = next.positions || {};
        const count = node.children.length;
        node.children.forEach((child, index) => {
          const offsetIndex = index - (count - 1) / 2;
          next.positions![child.id] = {
            x: parentPos.x + 240,
            y: parentPos.y + offsetIndex * 140,
          };
        });
        break;
      }
      node.children.forEach((child) => stack.push(child));
    }
    setDoc(next);
    setSelectedId(newId);
    setPendingCenterId(newId);
    trackCreateContent("mindmap_node", newId);
  }, [doc]);

  const addSiblingAfter = useCallback((siblingId: string) => {
    if (!doc) return;
    if (siblingId === "root") {
      addChild("root");
      return;
    }
    const next = structuredClone(doc) as MindDoc;
    const stack: MindNode[] = [next.root];
    const newId = generateId();
    while (stack.length) {
      const node = stack.pop()!;
      const index = node.children.findIndex((child) => child.id === siblingId);
      if (index >= 0) {
        node.children.splice(index + 1, 0, { id: newId, text: "Novo", children: [] });
        next.positions = next.positions || {};
        const parentPos = next.positions?.[node.id] ?? { x: 60, y: 200 };
        const count = node.children.length;
        node.children.forEach((child, childIndex) => {
          const offsetIndex = childIndex - (count - 1) / 2;
          next.positions![child.id] = {
            x: parentPos.x + 240,
            y: parentPos.y + offsetIndex * 140,
          };
        });
        break;
      }
      node.children.forEach((child) => stack.push(child));
    }
    setDoc(next);
    setSelectedId(newId);
    setPendingCenterId(newId);
    trackCreateContent("mindmap_node", newId);
  }, [doc, addChild]);

  const removeNode = useCallback((nodeId: string) => {
    if (!doc || nodeId === "root") return;
    const next = structuredClone(doc) as MindDoc;
    const stack: MindNode[] = [next.root];
    let removed = false;
    while (stack.length) {
      const node = stack.pop()!;
      const index = node.children.findIndex((child) => child.id === nodeId);
      if (index >= 0) {
        node.children.splice(index, 1);
        removed = true;
        break;
      }
      node.children.forEach((child) => stack.push(child));
    }
    if (removed) {
      if (next.positions) {
        delete next.positions[nodeId];
      }
      setDoc(next);
      setSelectedId("root");
    }
  }, [doc]);


  const handleContextMenu = (event: React.MouseEvent, nodeId: string | null) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    const x = rect ? event.clientX - rect.left : event.clientX;
    const y = rect ? event.clientY - rect.top : event.clientY;
    setMenu({
      open: true,
      x,
      y,
      nodeId,
    });
    if (nodeId) {
      setSelectedId(nodeId);
    }
  };

  const closeMenu = () => {
    setMenu({ open: false, x: 0, y: 0, nodeId: null });
  };

  const handleZoomIn = () => setZoom((z) => Math.min(1.6, Number((z + 0.1).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(2))));
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const handleZoomWheel = (event: React.WheelEvent) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    setZoom((value) =>
      Math.min(1.8, Math.max(0.6, Number((value + delta).toFixed(2))))
    );
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 0) return;
    if (draggingId) return;
    setIsPanning(true);
    setPanStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: event.clientX - panStart.x, y: event.clientY - panStart.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleNodeMouseDown = (event: React.MouseEvent, nodeId: string) => {
    event.stopPropagation();
    if (event.button !== 0) return;
    setIsPanning(false);
    setDraggingId(nodeId);
    dragIdRef.current = nodeId;
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    if (layout) {
      dragLayoutRef.current = { offsetX: layout.offsetX, offsetY: layout.offsetY };
    }
  };

  const handleNodeMouseUp = () => {
    setDraggingId(null);
  };

  useEffect(() => {
    if (!draggingId) return;
    const handleMove = (event: MouseEvent) => {
      const activeId = dragIdRef.current;
      if (!activeId) return;
      const last = dragStartRef.current;
      const deltaX = (event.clientX - last.x) / zoom;
      const deltaY = (event.clientY - last.y) / zoom;
      dragStartRef.current = { x: event.clientX, y: event.clientY };
      dragDeltaRef.current.dx += deltaX;
      dragDeltaRef.current.dy += deltaY;
      if (dragRafRef.current !== null) return;
      dragRafRef.current = window.requestAnimationFrame(() => {
        const { dx, dy } = dragDeltaRef.current;
        dragDeltaRef.current = { dx: 0, dy: 0 };
        setDoc((prev) => {
          if (!prev || !isMindDoc(prev) || !prev.positions) return prev;
          const next = structuredClone(prev) as MindDoc;
          const current = next.positions?.[activeId];
          if (!current) return prev;
          next.positions![activeId] = { x: current.x + dx, y: current.y + dy };
          return next;
        });
        dragRafRef.current = null;
      });
    };

    const handleUp = () => {
      const activeId = dragIdRef.current;
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      setDoc((prev) => {
        if (!prev || !isMindDoc(prev) || !prev.positions || !activeId) return prev;
        const next = structuredClone(prev) as MindDoc;
        const current = next.positions?.[activeId];
        if (!current) return prev;
        const grid = 8;
        next.positions![activeId] = {
          x: Math.round(current.x / grid) * grid,
          y: Math.round(current.y / grid) * grid,
        };
        return next;
      });
      dragIdRef.current = null;
      dragLayoutRef.current = null;
      setDraggingId(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [draggingId, zoom]);

  useEffect(() => {
    if (board?.type !== "mindmap") {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditingField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if (isEditingField) {
        return;
      }
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        addSiblingAfter(selectedId);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        setEditing(true);
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        if (event.shiftKey) {
          addSiblingAfter(selectedId);
        } else {
          addChild(selectedId);
        }
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        removeNode(selectedId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [board?.type, selectedId, addSiblingAfter, addChild, removeNode]);

  const computeAutoPositions = useCallback((root: MindNode) => {
    const nodes: { id: string; x: number; y: number }[] = [];
    const levelGap = 260;
    const rowGap = 140;

    const subtreeHeight = (node: MindNode): number => {
      if (node.children.length === 0) return rowGap;
      return node.children.reduce((acc, child) => acc + subtreeHeight(child), 0);
    };

    const place = (node: MindNode, depth: number, top: number) => {
      const height = subtreeHeight(node);
      const centerY = top + height / 2;
      nodes.push({
        id: node.id,
        x: depth * levelGap + 60,
        y: centerY,
      });
      let currentTop = top;
      node.children.forEach((child) => {
        const childHeight = subtreeHeight(child);
        place(child, depth + 1, currentTop);
        currentTop += childHeight;
      });
    };

    place(root, 0, 40);
    return nodes.reduce<Record<string, { x: number; y: number }>>((acc, node) => {
      acc[node.id] = { x: node.x, y: node.y };
      return acc;
    }, {});
  }, []);

  const normalizePositions = useCallback(
    (positions: Record<string, { x: number; y: number }>, fallback: Record<string, { x: number; y: number }>) => {
      const next: Record<string, { x: number; y: number }> = { ...positions };
      Object.entries(fallback).forEach(([id, pos]) => {
        const current = positions[id];
        if (!current || !Number.isFinite(current.x) || !Number.isFinite(current.y)) {
          next[id] = pos;
        }
      });
      return next;
    },
    []
  );

  const layout = useMemo(() => {
    if (!doc || !isMindDoc(doc)) return null;

    const nodes: {
      id: string;
      text: string;
      x: number;
      y: number;
      parentId?: string;
      color?: string;
      emoji?: string;
      icon?: string;
      comment?: string;
      tags?: string[];
      borderColor?: string;
      textColor?: string;
      fontSize?: number;
      tagStyle?: {
        bgColor?: string;
        textColor?: string;
        borderColor?: string;
      };
    }[] = [];
    const autoPositions = computeAutoPositions(doc.root);
    const positions = normalizePositions(doc.positions || {}, autoPositions);

    const traverse = (node: MindNode, parentId?: string) => {
      const pos = positions[node.id] ?? { x: 60, y: 200 };
      nodes.push({
      id: node.id,
      text: node.text,
      x: pos.x,
      y: pos.y,
      parentId,
        color: node.color,
        emoji: node.emoji,
        icon: node.icon,
        comment: node.comment,
        tags: node.tags,
        borderColor: node.borderColor,
        textColor: node.textColor,
        fontSize: node.fontSize,
        tagStyle: node.tagStyle,
      });
      node.children.forEach((child) => traverse(child, node.id));
    };

    traverse(doc.root);
    if (nodes.length === 0) return null;

    const baseWidth = 6000;
    const baseHeight = 4000;
    const padding = 600;
    const minX = Math.min(...nodes.map((node) => node.x));
    const minY = Math.min(...nodes.map((node) => node.y));
    const maxX = Math.max(...nodes.map((node) => node.x));
    const maxY = Math.max(...nodes.map((node) => node.y));

    const contentWidth = maxX - minX + padding * 2 + 200;
    const contentHeight = maxY - minY + padding * 2 + 200;

    const width = Math.max(baseWidth, contentWidth);
    const height = Math.max(baseHeight, contentHeight);

    const baseOffsetX = -minX + padding;
    const baseOffsetY = -minY + padding;
    const offsetX =
      draggingId && dragLayoutRef.current ? dragLayoutRef.current.offsetX : baseOffsetX;
    const offsetY =
      draggingId && dragLayoutRef.current ? dragLayoutRef.current.offsetY : baseOffsetY;

    return {
      nodes,
      width,
      height,
      offsetX,
      offsetY,
      minX,
      minY,
      maxX,
      maxY,
    };
  }, [doc, computeAutoPositions, normalizePositions, draggingId]);

  useEffect(() => {
    if (!doc || !isMindDoc(doc)) return;
    const autoPositions = computeAutoPositions(doc.root);
    const normalized = normalizePositions(doc.positions || {}, autoPositions);
    if (!doc.positions || Object.keys(doc.positions).length === 0) {
      setDoc({ ...doc, positions: normalized });
      if (!pendingCenterId) {
        setPendingCenterId("root");
      }
      return;
    }
    if (JSON.stringify(normalized) !== JSON.stringify(doc.positions)) {
      setDoc({ ...doc, positions: normalized });
    }
  }, [doc, computeAutoPositions, normalizePositions, pendingCenterId]);

  useEffect(() => {
    if (!layout || !pendingCenterId || !canvasRef.current || draggingId) return;
    const node = layout.nodes.find((item) => item.id === pendingCenterId);
    if (!node) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const nodeCenterX = node.x + layout.offsetX + 100;
    const nodeCenterY = node.y + layout.offsetY;
    setPan({
      x: rect.width / 2 - nodeCenterX * zoom,
      y: rect.height / 2 - nodeCenterY * zoom,
    });
    setPendingCenterId(null);
  }, [layout, pendingCenterId, zoom, draggingId]);

  useEffect(() => {
    if (!doc) return;
    setDebugInfo(
      JSON.stringify(
        {
          hasRoot: isMindDoc(doc),
          nodes: layout?.nodes?.length ?? 0,
          positions: isMindDoc(doc) ? Object.keys(doc.positions || {}).length : 0,
          selectedId,
          canvas: layout ? { width: layout.width, height: layout.height } : null,
        },
        null,
        2
      )
    );
  }, [doc, layout, selectedId]);

  useEffect(() => {
    if (!layout) return;
    const next: Record<string, boolean> = {};
    layout.nodes.forEach((node) => {
      if (!node.comment) return;
      const el = commentRefs.current[node.id];
      if (!el) return;
      next[node.id] = el.scrollHeight > el.clientHeight + 2;
    });
    setCommentOverflow(next);
  }, [layout, doc]);

  const selectedNode = useMemo(() => {
    if (!doc || !isMindDoc(doc)) return null;
    const stack = [doc.root];
    while (stack.length) {
      const node = stack.pop()!;
      if (node.id === selectedId) return node;
      node.children.forEach((child) => stack.push(child));
    }
    return null;
  }, [doc, selectedId]);

  if (!mounted || !token) return null;

  if (board?.type === "whiteboard") {
    return (
      <AppShell
        currentWorkspaceId={currentWorkspaceId}
        onWorkspaceChange={(id) => {
          setCurrentWorkspaceId(id);
          localStorage.setItem("flowio_workspace", id);
        }}
        fullBleed
      >
        <WhiteboardEditor
          board={board}
          doc={doc}
          setDoc={setDoc}
          saving={saving}
          error={error}
          setError={setError}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      currentWorkspaceId={currentWorkspaceId}
      onWorkspaceChange={(id) => {
        setCurrentWorkspaceId(id);
        localStorage.setItem("flowio_workspace", id);
      }}
      fullBleed
      fullBleedSecondary={
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF967D] to-[#E85D43] text-sm font-semibold text-white shadow-md">
              F
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-[#0F172A]">
                  {board?.name || "Mind Map"}
                </h1>
                <button className="text-xs text-[#94A3B8]">✎</button>
              </div>
              <p className="text-xs text-[#64748B]">
                {saving ? "Salvando..." : "Salvo"} · Editor de Mind Map
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] hover:bg-[#F8FAFC]"
              onClick={() => setDebugOpen((prev) => !prev)}
            >
              {debugOpen ? "Ocultar debug" : "Debug"}
            </button>
            <button
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] hover:bg-[#F8FAFC]"
              onClick={() => saveDocument()}
              disabled={saving}
            >
              💾 {saving ? "Salvando..." : "Salvar"}
            </button>
            <button className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] hover:bg-[#F8FAFC]">
              Compartilhar
            </button>
            <button
              className="rounded-lg bg-[#F2674B] px-3 py-2 text-xs text-white shadow-sm hover:bg-[#DE553C]"
              onClick={() => addChild("root")}
            >
              Adicionar ramo
            </button>
          </div>
        </div>
      }
    >
      <div className="flex h-[calc(100vh-96px)] flex-col gap-4">

        {error && <p className="text-sm text-red-600">{error}</p>}

        {debugOpen && (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 text-xs text-[#0F172A]">
            <pre className="whitespace-pre-wrap">{debugInfo}</pre>
          </div>
        )}

        <div className="relative flex-1 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
          <div className="absolute left-4 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-lg">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              onClick={() => setPan({ x: 0, y: 0 })}
              title="Centralizar"
            >
              ↖
            </button>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F2674B]/10 text-[#DE553C]"
              onClick={() => addChild(selectedId)}
              title="Adicionar nó"
            >
              ⛶
            </button>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              onClick={() => setEditing(true)}
              title="Editar texto"
            >
              T
            </button>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              onClick={() => setPropertiesOpen(true)}
              title="Propriedades"
            >
              ✎
            </button>
            <div className="h-px w-8 bg-[#E2E8F0]" />
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              onClick={() => handleZoomReset()}
              title="Reset zoom"
            >
              ↩
            </button>
          </div>
          <div className="absolute right-4 bottom-4 z-40 flex items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2 shadow-lg">
            <button
              className="rounded-full px-2 py-1 text-xs text-[#0F172A] hover:bg-[#F1F5F9]"
              onClick={handleZoomOut}
            >
              -
            </button>
            <div className="min-w-[48px] text-center text-xs text-[#64748B]">
              {Math.round(zoom * 100)}%
            </div>
            <button
              className="rounded-full px-2 py-1 text-xs text-[#0F172A] hover:bg-[#F1F5F9]"
              onClick={handleZoomIn}
            >
              +
            </button>
            <button
              className="rounded-full px-2 py-1 text-xs text-[#0F172A] hover:bg-[#F1F5F9]"
              onClick={handleZoomReset}
            >
              Reset
            </button>
            <button
              className="rounded-full px-2 py-1 text-xs text-[#0F172A] hover:bg-[#F1F5F9]"
              onClick={() => setPan({ x: 0, y: 0 })}
            >
              Center
            </button>
          </div>
          <div
            className="absolute inset-0 overflow-hidden bg-[#F8FAFC]"
            onWheelCapture={handleZoomWheel}
            onContextMenu={(event) => handleContextMenu(event, null)}
            onClick={() => closeMenu()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            ref={canvasRef}
          >
            <div
              className="absolute left-0 top-0"
              style={{
                width: layout?.width ?? 2000,
                height: layout?.height ?? 1200,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
                backgroundImage:
                  "radial-gradient(circle, rgba(148,163,184,0.35) 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            >
              {layout && (
                <svg className="absolute inset-0" width={layout.width} height={layout.height}>
                  {layout.nodes.map((node) => {
                    if (!node.parentId) return null;
                    const parent = layout.nodes.find((item) => item.id === node.parentId);
                    if (!parent) return null;
                    const nodeWidth = 200;
                    const startX = parent.x + layout.offsetX + nodeWidth;
                    const startY = parent.y + layout.offsetY;
                    const endX = node.x + layout.offsetX;
                    const endY = node.y + layout.offsetY;
                    const midX = (startX + endX) / 2;
                    const midY = (startY + endY) / 2;
                    return (
                      <g key={`${parent.id}-${node.id}`}>
                        <path
                          d={`M ${startX} ${startY} C ${startX + 40} ${startY}, ${endX - 40} ${endY}, ${endX} ${endY}`}
                          stroke="#CBD5E1"
                          strokeWidth="2"
                          fill="none"
                        />
                        <circle cx={midX} cy={midY} r={3} fill="#F2674B" opacity="0.4" />
                      </g>
                    );
                  })}
                </svg>
              )}
              {layout?.nodes.map((node) => (
                <div
                  key={node.id}
                  className={`absolute w-[220px] rounded-xl border bg-white px-4 py-3 text-left text-[13px] shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] ${
                    selectedId === node.id
                      ? "border-[#F2674B] ring-2 ring-[#F2674B]/30"
                      : "border-[#E2E8F0]"
                  }`}
                  style={{
                    left: node.x + (layout?.offsetX ?? 0),
                    top: node.y + (layout?.offsetY ?? 0) - 22,
                    backgroundColor: node.color || undefined,
                    borderColor: node.borderColor || undefined,
                    color: node.textColor || undefined,
                    fontSize: node.fontSize ? `${node.fontSize}px` : undefined,
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedId(node.id);
                  }}
                  onDoubleClick={(event) => {
                    event.stopPropagation();
                    setSelectedId(node.id);
                    setEditing(true);
                  }}
                  onContextMenu={(event) => handleContextMenu(event, node.id)}
                  onMouseDown={(event) => handleNodeMouseDown(event, node.id)}
                  onMouseUp={handleNodeMouseUp}
                  role="button"
                  tabIndex={0}
                >
                  {node.tags && node.tags.length > 0 && (
                    <span
                      className="absolute -right-2 -top-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold shadow-sm"
                      style={{
                        backgroundColor: node.tagStyle?.bgColor || "#22C55E",
                        color: node.tagStyle?.textColor || "#ffffff",
                        borderColor: node.tagStyle?.borderColor || "transparent",
                      }}
                    >
                      {node.tags[0]}
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#3B82F6]" />
                    <div className="flex-1">
                      {selectedId === node.id && editing ? (
                        <input
                          autoFocus
                          className="w-full bg-transparent text-[13px] font-semibold tracking-tight outline-none"
                          defaultValue={node.text}
                          onBlur={(event) => {
                            updateNodeText(node.id, event.target.value);
                            setEditing(false);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              updateNodeText(node.id, (event.target as HTMLInputElement).value);
                              setEditing(false);
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-[13px] font-semibold">
                          {node.emoji && <span className="text-base">{node.emoji}</span>}
                          {node.icon && <span className="text-xs text-[#64748B]">{node.icon}</span>}
                          <span>{node.text}</span>
                        </div>
                      )}
                      <div className="mt-1 text-[11px] text-[#94A3B8]">
                        <p
                          ref={(el) => {
                            commentRefs.current[node.id] = el;
                          }}
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: expandedComments[node.id] ? "unset" : 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            wordBreak: "break-word",
                          }}
                        >
                          {node.comment ? node.comment : "Clique para editar"}
                        </p>
                        {node.comment && commentOverflow[node.id] && (
                          <button
                            className="mt-1 text-[10px] font-semibold text-[#3B82F6]"
                            onClick={(event) => {
                              event.stopPropagation();
                              setExpandedComments((prev) => ({
                                ...prev,
                                [node.id]: !prev[node.id],
                              }));
                            }}
                          >
                            {expandedComments[node.id] ? "Ver menos" : "Ver mais"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {menu.open && (
            <div
              className="absolute z-50 w-48 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-lg"
              style={{ left: menu.x + 8, top: menu.y + 8 }}
              onClick={(event) => event.stopPropagation()}
            >
              {selectedNode && (
                <>
                  <button
                    className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-[#F1F5F9]"
                    onClick={() => {
                      addChild(selectedNode.id);
                      closeMenu();
                    }}
                  >
                    Adicionar filho
                  </button>
                  <button
                    className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-[#F1F5F9]"
                    onClick={() => {
                      setEditing(true);
                      closeMenu();
                    }}
                  >
                    Renomear
                  </button>
                  <button
                    className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-[#F1F5F9]"
                    onClick={() => {
                      setPropertiesOpen(true);
                      setPropertiesMinimized(false);
                      setPropertiesTab("tags");
                      closeMenu();
                    }}
                  >
                    Propriedades
                  </button>
                  {selectedNode.id !== "root" && (
                    <button
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-[#FEF2F2]"
                      onClick={() => {
                        removeNode(selectedNode.id);
                        closeMenu();
                      }}
                    >
                      Excluir nó
                    </button>
                  )}
                </>
              )}
              {!selectedNode && (
                <button
                  className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-[#F1F5F9]"
                  onClick={() => {
                    addChild("root");
                    closeMenu();
                  }}
                >
                  Adicionar ramo
                </button>
              )}
            </div>
          )}

          {propertiesOpen && selectedNode && (
            <div className="absolute right-4 top-20 z-40 w-72 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#0F172A]">Propriedades</h3>
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <button
                    className="rounded-md border border-[#E2E8F0] px-2 py-0.5"
                    onClick={() => setPropertiesMinimized((prev) => !prev)}
                  >
                    {propertiesMinimized ? "Expandir" : "Minimizar"}
                  </button>
                  <button
                    className="rounded-md border border-[#E2E8F0] px-2 py-0.5"
                    onClick={() => setPropertiesOpen(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
              {!propertiesMinimized && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] p-1 text-xs">
                    <button
                      className={`rounded-full px-3 py-1 ${
                        propertiesTab === "tags"
                          ? "bg-white text-[#0F172A] shadow-sm"
                          : "text-[#64748B]"
                      }`}
                      onClick={() => setPropertiesTab("tags")}
                    >
                      Tags
                    </button>
                    <button
                      className={`rounded-full px-3 py-1 ${
                        propertiesTab === "style"
                          ? "bg-white text-[#0F172A] shadow-sm"
                          : "text-[#64748B]"
                      }`}
                      onClick={() => setPropertiesTab("style")}
                    >
                      Aparência
                    </button>
                  </div>
                  {propertiesTab === "tags" && (
                    <div className="mt-4 flex flex-col gap-4 text-sm">
                      <label className="flex flex-col gap-2">
                        <span className="text-[#64748B]">Tags</span>
                        <TagEditor
                          tags={selectedNode.tags || []}
                          onChange={(tags) => updateNodeProps(selectedNode.id, { tags })}
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-[#64748B]">Cor da tag</span>
                        <input
                          type="color"
                          className="h-10 w-20 rounded-md border border-[#E2E8F0] bg-white p-1"
                          value={selectedNode.tagStyle?.bgColor || "#22C55E"}
                          onChange={(event) =>
                            updateNodeProps(selectedNode.id, {
                              tagStyle: { bgColor: event.target.value },
                            })
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-[#64748B]">Borda da tag</span>
                        <input
                          type="color"
                          className="h-10 w-20 rounded-md border border-[#E2E8F0] bg-white p-1"
                          value={selectedNode.tagStyle?.borderColor || "#00000000"}
                          onChange={(event) =>
                            updateNodeProps(selectedNode.id, {
                              tagStyle: { borderColor: event.target.value },
                            })
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-[#64748B]">Cor do texto da tag</span>
                        <input
                          type="color"
                          className="h-10 w-20 rounded-md border border-[#E2E8F0] bg-white p-1"
                          value={selectedNode.tagStyle?.textColor || "#ffffff"}
                          onChange={(event) =>
                            updateNodeProps(selectedNode.id, {
                              tagStyle: { textColor: event.target.value },
                            })
                          }
                        />
                      </label>
                      <button
                        className="w-max rounded-md border border-[#E2E8F0] px-3 py-1 text-xs text-[#0F172A]"
                        onClick={() =>
                          updateNodeProps(selectedNode.id, {
                            tagStyle: { bgColor: undefined, borderColor: undefined, textColor: undefined },
                          })
                        }
                      >
                        Resetar estilo da tag
                      </button>
                    </div>
                  )}
                  {propertiesTab === "style" && (
                    <div className="mt-4 flex flex-col gap-4 text-sm">
                      <label className="flex flex-col gap-2">
                        <span className="text-[#64748B]">Comentário (opcional)</span>
                        <textarea
                          className="min-h-[80px] rounded-md border border-[#E2E8F0] px-3 py-2"
                          value={selectedNode.comment || ""}
                          onChange={(event) =>
                            updateNodeProps(selectedNode.id, { comment: event.target.value || undefined })
                          }
                          placeholder="Ex: Observação rápida sobre este nó"
                        />
                        <button
                          className="w-max rounded-md border border-[#E2E8F0] px-3 py-1 text-xs text-[#0F172A]"
                          onClick={() => updateNodeProps(selectedNode.id, { comment: undefined })}
                        >
                          Limpar comentário
                        </button>
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-[#64748B]">Emoji</span>
                        <div className="grid grid-cols-6 gap-2 rounded-md border border-[#E2E8F0] p-2">
                          {emojiOptions.map((emoji) => (
                            <button
                              key={emoji}
                              className={`h-8 w-8 rounded-md text-lg hover:bg-[#F1F5F9] ${
                                selectedNode.emoji === emoji ? "bg-[#FFF0EB]" : ""
                              }`}
                              onClick={() => updateNodeProps(selectedNode.id, { emoji })}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        <button
                          className="w-max rounded-md border border-[#E2E8F0] px-3 py-1 text-xs text-[#0F172A]"
                          onClick={() => updateNodeProps(selectedNode.id, { emoji: undefined })}
                        >
                          Resetar emoji
                        </button>
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-[#64748B]">Ícone (texto curto)</span>
                        <input
                          className="rounded-md border border-[#E2E8F0] px-3 py-2"
                          value={selectedNode.icon || ""}
                          onChange={(event) => updateNodeProps(selectedNode.id, { icon: event.target.value })}
                          placeholder="⭐"
                        />
                        <button
                          className="w-max rounded-md border border-[#E2E8F0] px-3 py-1 text-xs text-[#0F172A]"
                          onClick={() => updateNodeProps(selectedNode.id, { icon: undefined })}
                        >
                          Resetar ícone
                        </button>
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-[#64748B]">Cor</span>
                        <input
                          type="color"
                          className="h-10 w-20 rounded-md border border-[#E2E8F0] bg-white p-1"
                          value={selectedNode.color || "#EFF6FF"}
                          onChange={(event) => updateNodeProps(selectedNode.id, { color: event.target.value })}
                        />
                        <button
                          className="mt-2 w-max rounded-md border border-[#E2E8F0] px-3 py-1 text-xs text-[#0F172A]"
                          onClick={() => updateNodeProps(selectedNode.id, { color: undefined })}
                        >
                          Resetar cor
                        </button>
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-[#64748B]">Cor da borda</span>
                        <input
                          type="color"
                          className="h-10 w-20 rounded-md border border-[#E2E8F0] bg-white p-1"
                          value={selectedNode.borderColor || "#E2E8F0"}
                          onChange={(event) =>
                            updateNodeProps(selectedNode.id, { borderColor: event.target.value })
                          }
                        />
                        <button
                          className="mt-2 w-max rounded-md border border-[#E2E8F0] px-3 py-1 text-xs text-[#0F172A]"
                          onClick={() => updateNodeProps(selectedNode.id, { borderColor: undefined })}
                        >
                          Resetar borda
                        </button>
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-[#64748B]">Cor da fonte</span>
                        <input
                          type="color"
                          className="h-10 w-20 rounded-md border border-[#E2E8F0] bg-white p-1"
                          value={selectedNode.textColor || "#0F172A"}
                          onChange={(event) =>
                            updateNodeProps(selectedNode.id, { textColor: event.target.value })
                          }
                        />
                        <button
                          className="mt-2 w-max rounded-md border border-[#E2E8F0] px-3 py-1 text-xs text-[#0F172A]"
                          onClick={() => updateNodeProps(selectedNode.id, { textColor: undefined })}
                        >
                          Resetar fonte
                        </button>
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-[#64748B]">Tamanho da fonte</span>
                        <input
                          type="number"
                          min={10}
                          max={20}
                          className="w-24 rounded-md border border-[#E2E8F0] px-3 py-2"
                          value={selectedNode.fontSize || 13}
                          onChange={(event) =>
                            updateNodeProps(selectedNode.id, { fontSize: Number(event.target.value) })
                          }
                        />
                        <button
                          className="mt-2 w-max rounded-md border border-[#E2E8F0] px-3 py-1 text-xs text-[#0F172A]"
                          onClick={() => updateNodeProps(selectedNode.id, { fontSize: undefined })}
                        >
                          Resetar tamanho
                        </button>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function WhiteboardEditor({
  board,
  doc,
  setDoc,
  saving,
  error,
  setError,
}: {
  board: Board;
  doc: BoardDoc | null;
  setDoc: React.Dispatch<React.SetStateAction<BoardDoc | null>>;
  saving: boolean;
  error: string | null;
  setError: (value: string | null) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const liveDragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const pendingDragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const dragDeltaRef = useRef({ dx: 0, dy: 0 });
  const dragRafRef = useRef<number | null>(null);
  const dragState = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const resizeState = useRef<{
    id: string;
    startX: number;
    startY: number;
    originW: number;
    originH: number;
  } | null>(null);
  const resizeDeltaRef = useRef({ dx: 0, dy: 0 });
  const resizeRafRef = useRef<number | null>(null);
  const liveResizeRef = useRef<{ id: string; w: number; h: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const whiteDoc = isWhiteboardDoc(doc) ? doc : DEFAULT_WHITEBOARD_DOC;

  const addItem = useCallback(
    (type: WhiteboardItemType, overrides?: Partial<WhiteboardItem>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      const centerX = rect ? (rect.width / 2 - pan.x) / zoom : 200;
      const centerY = rect ? (rect.height / 2 - pan.y) / zoom : 200;
      const defaults = getWhiteboardDefaults(type);
      const newId = generateId();
      const item: WhiteboardItem = {
        id: newId,
        type,
        x: overrides?.x ?? centerX - defaults.w / 2,
        y: overrides?.y ?? centerY - defaults.h / 2,
        w: overrides?.w ?? defaults.w,
        h: overrides?.h ?? defaults.h,
        text: overrides?.text ?? defaults.text,
        src: overrides?.src,
        color: overrides?.color ?? defaults.color,
        borderColor: overrides?.borderColor ?? defaults.borderColor,
        textColor: overrides?.textColor ?? defaults.textColor,
        fontSize: overrides?.fontSize ?? defaults.fontSize,
      };
      setDoc((prev) => {
        const base = prev && isWhiteboardDoc(prev) ? prev : DEFAULT_WHITEBOARD_DOC;
        const next = structuredClone(base) as WhiteboardDoc;
        next.items.push(item);
        return next;
      });
      setSelectedId(newId);
      setEditingId(type === "text" ? newId : null);
      trackCreateContent("whiteboard_item", newId);
    },
    [pan, zoom, setDoc]
  );

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files || []);
    if (!files.length) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    const dropX = rect ? (event.clientX - rect.left - pan.x) / zoom : 200;
    const dropY = rect ? (event.clientY - rect.top - pan.y) / zoom : 200;
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = typeof reader.result === "string" ? reader.result : "";
        if (!src) return;
        const img = new window.Image();
        img.onload = () => {
          const maxW = 420;
          const maxH = 280;
          const ratio = Math.min(1, maxW / img.width, maxH / img.height);
          addItem("image", {
            src,
            w: Math.max(120, img.width * ratio),
            h: Math.max(80, img.height * ratio),
            x: dropX,
            y: dropY,
          });
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
  };

  const updateItem = useCallback(
    (id: string, updater: (item: WhiteboardItem) => void) => {
      const defer =
        typeof queueMicrotask === "function"
          ? queueMicrotask
          : (fn: () => void) => setTimeout(fn, 0);
      defer(() => {
        setDoc((prev) => {
          if (!prev || !isWhiteboardDoc(prev)) {
            return prev;
          }
          const next = structuredClone(prev) as WhiteboardDoc;
          const item = next.items.find((entry) => entry.id === id);
          if (!item) {
            return prev;
          }
          updater(item);
          return next;
        });
      });
    },
    [setDoc]
  );

  const removeItem = useCallback(
    (id: string) => {
      setDoc((prev) => {
        if (!prev || !isWhiteboardDoc(prev)) return prev;
        const next = structuredClone(prev) as WhiteboardDoc;
        next.items = next.items.filter((item) => item.id !== id);
        return next;
      });
      setSelectedId((current) => (current === id ? null : current));
    },
    [setDoc]
  );

  const handleCanvasMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
    setSelectedId(null);
  };

  const handleCanvasMouseMove = (event: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: event.clientX - panStart.x, y: event.clientY - panStart.y });
  };

  const stopPan = () => setIsPanning(false);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!draggingId && pendingDragRef.current) {
        const pending = pendingDragRef.current;
        const distance = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
        if (distance < 4) {
          return;
        }
        setDraggingId(pending.id);
        dragState.current = { ...pending };
        liveDragRef.current = { id: pending.id, dx: 0, dy: 0 };
        pendingDragRef.current = null;
      }
      if (!dragState.current) return;
      const { id, startX, startY, originX, originY } = dragState.current;
      const deltaX = (event.clientX - startX) / zoom;
      const deltaY = (event.clientY - startY) / zoom;
      if (deltaX === 0 && deltaY === 0) return;
      dragState.current = {
        id,
        startX: event.clientX,
        startY: event.clientY,
        originX: originX + deltaX,
        originY: originY + deltaY,
      };
      dragDeltaRef.current.dx += deltaX;
      dragDeltaRef.current.dy += deltaY;
      if (dragRafRef.current !== null) return;
      dragRafRef.current = window.requestAnimationFrame(() => {
        const { dx, dy } = dragDeltaRef.current;
        dragDeltaRef.current = { dx: 0, dy: 0 };
        const active = dragState.current?.id;
        if (!active) return;
        const live = liveDragRef.current;
        if (!live || live.id !== active) {
          liveDragRef.current = { id: active, dx, dy };
        } else {
          liveDragRef.current = { id: active, dx: live.dx + dx, dy: live.dy + dy };
        }
        const el = itemRefs.current[active];
        if (el) {
          const offset = liveDragRef.current;
          el.style.transform = `translate3d(${offset?.dx ?? 0}px, ${offset?.dy ?? 0}px, 0)`;
        }
        dragRafRef.current = null;
      });
    };
    const handleUp = () => {
      const active = dragState.current?.id;
      if (active) {
        const preview = liveDragRef.current && liveDragRef.current.id === active ? liveDragRef.current : null;
        setDoc((prev) => {
          if (!prev || !isWhiteboardDoc(prev)) return prev;
          const next = structuredClone(prev) as WhiteboardDoc;
          const item = next.items.find((entry) => entry.id === active);
          if (!item) return prev;
          if (preview) {
            item.x += preview.dx;
            item.y += preview.dy;
          }
          const grid = 8;
          item.x = Math.round(item.x / grid) * grid;
          item.y = Math.round(item.y / grid) * grid;
          return next;
        });
        const el = itemRefs.current[active];
        if (el) {
          el.style.transform = "translate3d(0px, 0px, 0px)";
        }
      }
      pendingDragRef.current = null;
      dragState.current = null;
      liveDragRef.current = null;
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      setDraggingId(null);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [draggingId, setDoc, zoom]);

  useEffect(() => {
    if (!resizingId) return;
    const handleMove = (event: MouseEvent) => {
      if (!resizeState.current) return;
      const { id, startX, startY, originW, originH } = resizeState.current;
      const deltaX = (event.clientX - startX) / zoom;
      const deltaY = (event.clientY - startY) / zoom;
      if (deltaX === 0 && deltaY === 0) return;
      resizeDeltaRef.current.dx += deltaX;
      resizeDeltaRef.current.dy += deltaY;
      resizeState.current = {
        id,
        startX: event.clientX,
        startY: event.clientY,
        originW: originW + deltaX,
        originH: originH + deltaY,
      };
      if (resizeRafRef.current !== null) return;
      resizeRafRef.current = window.requestAnimationFrame(() => {
        const { dx, dy } = resizeDeltaRef.current;
        resizeDeltaRef.current = { dx: 0, dy: 0 };
        const active = resizeState.current?.id;
        if (!active) return;
        const live = liveResizeRef.current;
        if (!live || live.id !== active) {
          liveResizeRef.current = { id: active, w: Math.max(80, dx), h: Math.max(50, dy) };
        } else {
          liveResizeRef.current = {
            id: active,
            w: Math.max(80, live.w + dx),
            h: Math.max(50, live.h + dy),
          };
        }
        const el = itemRefs.current[active];
        if (el && liveResizeRef.current) {
          el.style.width = `${liveResizeRef.current.w}px`;
          el.style.height = `${liveResizeRef.current.h}px`;
        }
        resizeRafRef.current = null;
      });
    };
    const handleUp = () => {
      const active = resizeState.current?.id;
      if (active) {
        const live = liveResizeRef.current && liveResizeRef.current.id === active ? liveResizeRef.current : null;
        setDoc((prev) => {
          if (!prev || !isWhiteboardDoc(prev)) return prev;
          const next = structuredClone(prev) as WhiteboardDoc;
          const item = next.items.find((entry) => entry.id === active);
          if (!item) return prev;
          if (live) {
            item.w = live.w;
            item.h = live.h;
          }
          const grid = 8;
          item.w = Math.max(80, Math.round(item.w / grid) * grid);
          item.h = Math.max(50, Math.round(item.h / grid) * grid);
          return next;
        });
        const el = itemRefs.current[active];
        if (el) {
          el.style.width = "";
          el.style.height = "";
        }
      }
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
      setResizingId(null);
      resizeState.current = null;
      liveResizeRef.current = null;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [resizingId, setDoc, zoom]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditingField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if (isEditingField) return;
      if (!selectedId) return;
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        removeItem(selectedId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, removeItem]);

  const selectedItem = whiteDoc.items.find((item) => item.id === selectedId) || null;

  return (
    <div className="flex h-[calc(100vh-96px)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{board?.name || "Whiteboard"}</h1>
          <p className="text-sm text-[#64748B]">Editor de Whiteboard · {saving ? "Salvando..." : "Salvo"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-[#E2E8F0] px-3 py-1 text-xs text-[#0F172A]"
            onClick={() => setError(null)}
          >
            Limpar erro
          </button>
          <button
            className="rounded-md bg-[#F97316] px-3 py-1 text-xs text-white"
            onClick={() => addItem("sticky")}
          >
            Novo post-it
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
        <div className="absolute left-4 top-4 z-40 flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-2 py-1 shadow-sm">
          <button
            className="rounded-full px-2 py-1 text-xs text-[#0F172A] hover:bg-[#F1F5F9]"
            onClick={() => addItem("rect")}
          >
            Retângulo
          </button>
          <button
            className="rounded-full px-2 py-1 text-xs text-[#0F172A] hover:bg-[#F1F5F9]"
            onClick={() => addItem("ellipse")}
          >
            Elipse
          </button>
          <button
            className="rounded-full px-2 py-1 text-xs text-[#0F172A] hover:bg-[#F1F5F9]"
            onClick={() => addItem("text")}
          >
            Texto
          </button>
          <button
            className="rounded-full px-2 py-1 text-xs text-[#0F172A] hover:bg-[#F1F5F9]"
            onClick={() => addItem("sticky")}
          >
            Post-it
          </button>
        </div>
        <div className="absolute right-4 top-4 z-40 flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-2 py-1 shadow-sm">
          <button
            className="rounded-full px-2 py-1 text-xs text-[#0F172A] hover:bg-[#F1F5F9]"
            onClick={() => setZoom((value) => Math.max(0.6, Number((value - 0.1).toFixed(2))))}
          >
            -
          </button>
          <div className="min-w-[48px] text-center text-xs text-[#64748B]">
            {Math.round(zoom * 100)}%
          </div>
          <button
            className="rounded-full px-2 py-1 text-xs text-[#0F172A] hover:bg-[#F1F5F9]"
            onClick={() => setZoom((value) => Math.min(1.8, Number((value + 0.1).toFixed(2))))}
          >
            +
          </button>
          <button
            className="rounded-full px-2 py-1 text-xs text-[#0F172A] hover:bg-[#F1F5F9]"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            Reset
          </button>
        </div>
        <div
          className="absolute inset-0 overflow-hidden bg-[#F8FAFC]"
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={stopPan}
          onMouseLeave={stopPan}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {dragOver && (
            <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center border-2 border-dashed border-[#3B82F6] bg-[#EFF6FF]/60 text-sm font-medium text-[#1E3A8A]">
              Solte a imagem para adicionar ao whiteboard
            </div>
          )}
          <div
            className="absolute left-0 top-0"
            style={{
              width: 12000,
              height: 8000,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              backgroundImage:
                "radial-gradient(circle, rgba(148,163,184,0.25) 1px, transparent 0)",
              backgroundSize: "36px 36px",
            }}
          >
            {whiteDoc.items.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[item.id] = el;
                  }}
                  className={`absolute flex flex-col gap-2 rounded-2xl border px-4 py-3 text-left text-[13px] font-medium tracking-tight shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isSelected ? "border-[#3B82F6] shadow-md" : "border-[#E2E8F0]"
                  } ${item.type === "ellipse" ? "rounded-full" : ""}`}
                  style={{
                    left: item.x,
                    top: item.y,
                    width: item.w,
                    height: item.h,
                    backgroundColor: item.color || "transparent",
                    borderColor: item.borderColor || undefined,
                    color: item.textColor || undefined,
                    fontSize: item.fontSize ? `${item.fontSize}px` : undefined,
                    padding: item.type === "image" ? 0 : undefined,
                  }}
                  onMouseDown={(event) => {
                    event.stopPropagation();
                    if (event.button !== 0) return;
                    setSelectedId(item.id);
                    setEditingId(null);
                    pendingDragRef.current = {
                      id: item.id,
                      startX: event.clientX,
                      startY: event.clientY,
                      originX: item.x,
                      originY: item.y,
                    };
                  }}
                  onDoubleClick={(event) => {
                    event.stopPropagation();
                    setSelectedId(item.id);
                    if (item.type !== "image") {
                      setEditingId(item.id);
                    }
                  }}
                >
                  {item.type === "image" && item.src ? (
                    <NextImage
                      src={item.src}
                      alt="Imagem"
                      width={Math.max(1, Math.round(item.w))}
                      height={Math.max(1, Math.round(item.h))}
                      className="h-full w-full rounded-2xl object-cover"
                      draggable={false}
                      unoptimized
                    />
                  ) : editingId === item.id ? (
                    <textarea
                      autoFocus
                      className="h-full w-full resize-none bg-transparent text-[13px] font-medium tracking-tight outline-none"
                      defaultValue={item.text}
                      onBlur={(event) => {
                        updateItem(item.id, (draft) => {
                          draft.text = event.target.value;
                        });
                        setEditingId(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          (event.target as HTMLTextAreaElement).blur();
                        }
                      }}
                    />
                  ) : (
                    <span className="whitespace-pre-wrap">{item.text}</span>
                  )}
                  <button
                    className="absolute bottom-1 right-1 h-3 w-3 cursor-se-resize rounded-sm border border-[#CBD5E1] bg-white shadow-sm"
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      if (event.button !== 0) return;
                      setSelectedId(item.id);
                      setEditingId(null);
                      setResizingId(item.id);
                      resizeState.current = {
                        id: item.id,
                        startX: event.clientX,
                        startY: event.clientY,
                        originW: item.w,
                        originH: item.h,
                      };
                      liveResizeRef.current = { id: item.id, w: item.w, h: item.h };
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {selectedItem && (
          <div className="absolute right-4 bottom-4 z-40 w-72 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0F172A]">Propriedades</h3>
              <button
                className="rounded-md border border-[#E2E8F0] px-2 py-0.5 text-xs text-[#64748B]"
                onClick={() => setSelectedId(null)}
              >
                Fechar
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <label className="flex flex-col gap-2">
                <span className="text-[#64748B]">Cor de fundo</span>
                <input
                  type="color"
                  className="h-10 w-20 rounded-md border border-[#E2E8F0] bg-white p-1"
                  value={
                    selectedItem.color && selectedItem.color !== "transparent"
                      ? selectedItem.color
                      : "#FFFFFF"
                  }
                  onChange={(event) =>
                    updateItem(selectedItem.id, (item) => {
                      item.color = event.target.value;
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[#64748B]">Cor da borda</span>
                <input
                  type="color"
                  className="h-10 w-20 rounded-md border border-[#E2E8F0] bg-white p-1"
                  value={
                    selectedItem.borderColor && selectedItem.borderColor !== "transparent"
                      ? selectedItem.borderColor
                      : "#CBD5E1"
                  }
                  onChange={(event) =>
                    updateItem(selectedItem.id, (item) => {
                      item.borderColor = event.target.value;
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[#64748B]">Cor do texto</span>
                <input
                  type="color"
                  className="h-10 w-20 rounded-md border border-[#E2E8F0] bg-white p-1"
                  value={selectedItem.textColor || "#0F172A"}
                  onChange={(event) =>
                    updateItem(selectedItem.id, (item) => {
                      item.textColor = event.target.value;
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[#64748B]">Tamanho da fonte</span>
                <input
                  type="number"
                  min={10}
                  max={28}
                  className="w-24 rounded-md border border-[#E2E8F0] px-3 py-2"
                  value={selectedItem.fontSize || 14}
                  onChange={(event) =>
                    updateItem(selectedItem.id, (item) => {
                      item.fontSize = Number(event.target.value);
                    })
                  }
                />
              </label>
              <button
                className="w-max rounded-md border border-[#E2E8F0] px-3 py-1 text-xs text-[#0F172A]"
                onClick={() => removeItem(selectedItem.id)}
              >
                Excluir bloco
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TagEditor({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [value, setValue] = useState("");

  const addTag = () => {
    const next = value.trim();
    if (!next) return;
    if (tags.includes(next)) {
      setValue("");
      return;
    }
    onChange([...tags, next]);
    setValue("");
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((item) => item !== tag));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            className="flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1 text-[11px] text-[#475569]"
            onClick={() => removeTag(tag)}
          >
            {tag}
            <span className="text-[10px] text-[#94A3B8]">×</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          className="flex-1 rounded-md border border-[#E2E8F0] px-3 py-2"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Adicionar tag"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag();
            }
          }}
        />
        <button
          className="rounded-md border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A]"
          onClick={addTag}
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
