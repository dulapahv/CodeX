/**
 * Binds the notepad to the room's shared Yjs document through Lexical's Yjs
 * binding. The room owns the connection, so this keeps the notepad caret in
 * its own presence field and never connects, disconnects or replaces the
 * rest of the user's presence.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  LEGACY_NOTES_DOC,
  type NotepadPresence,
  ROOM_DOC,
} from "@codex/types/realtime";

import { $convertFromMarkdownString } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  type Binding,
  createUndoManager,
  createYjsBinding,
  type Provider,
  type ProviderAwareness,
  setLocalStateFocus,
  syncCursorPositions,
  syncLexicalUpdateToYjs,
  syncYjsChangesToLexical,
  type UserState,
} from "@lexical/yjs";
import {
  $createParagraphNode,
  $getRoot,
  BLUR_COMMAND,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COLLABORATION_TAG,
  COMMAND_PRIORITY_EDITOR,
  FOCUS_COMMAND,
  HISTORY_MERGE_TAG,
  type LexicalEditor,
  mergeRegister,
  REDO_COMMAND,
  SKIP_COLLAB_TAG,
  SKIP_SCROLL_INTO_VIEW_TAG,
  UNDO_COMMAND,
} from "lexical";
import { type RefObject, useEffect } from "react";
import { AbstractType, UndoManager, XmlText } from "yjs";

import type { RoomConnection } from "@/lib/realtime/room-connection";
import { useRoom } from "@/lib/realtime/room-context";
import { getBackgroundColor, getTextColor } from "@/lib/utils";

import { NOTEPAD_TRANSFORMERS } from "../markdown";
import { CollapsibleContainerNode } from "../nodes/collapsible-nodes";

const LABEL_HEIGHT = 19;

// Folding a section is a personal view, not an edit to share
const PER_USER_PROPERTIES = new Map([
  [CollapsibleContainerNode, new Set(["__open"])],
]);

type NotepadRoom = Pick<
  RoomConnection,
  "awareness" | "clientId" | "doc" | "getPresence" | "setPresence"
>;

// A binding caches its collab nodes on the shared types and never clears them,
// so a later binding (the panel reopening) would reuse them with stale
// children. Clear them before binding again.
const clearCollabNodes = (type: object) => {
  Reflect.deleteProperty(type, "_collabNode");
  if (!(type instanceof XmlText)) {
    return;
  }
  for (const { insert } of type.toDelta() as { insert: unknown }[]) {
    if (insert instanceof AbstractType) {
      clearCollabNodes(insert);
    }
  }
};

const toUserState = (presence: NotepadPresence | undefined) =>
  (presence ?? null) as UserState | null;

const createAwareness = (room: NotepadRoom): ProviderAwareness => {
  const getLocalState = () =>
    toUserState(room.getPresence().get(room.clientId)?.notepad);

  return {
    getLocalState,
    getStates: () => {
      const states = new Map<number, UserState>();
      for (const [clientId, presence] of room.getPresence()) {
        const state = toUserState(presence?.notepad);
        if (state) {
          states.set(clientId, state);
        }
      }
      return states;
    },
    off: (_type, listener) => room.awareness.off("update", listener),
    on: (_type, listener) => room.awareness.on("update", listener),
    setLocalState: (state) =>
      room.setPresence({
        notepad: state ? ({ ...state } as NotepadPresence) : undefined,
      }),
    setLocalStateField: (field, value) => {
      const state = getLocalState();
      if (state) {
        room.setPresence({
          notepad: { ...state, [field]: value } as NotepadPresence,
        });
      }
    },
  };
};

// The room provider connects on its own, so connection calls do nothing
const createProvider = (room: NotepadRoom): Provider => ({
  awareness: createAwareness(room),
  connect: () => undefined,
  disconnect: () => undefined,
  off: () => undefined,
  on: () => undefined,
});

// Seed an empty notepad, from the old markdown notes when a room has them
const $bootstrap = (room: NotepadRoom) => {
  const root = $getRoot();
  if (!root.isEmpty()) {
    return;
  }
  const legacyNotes = room.doc.share.has(LEGACY_NOTES_DOC)
    ? room.doc.getText(LEGACY_NOTES_DOC).toString()
    : "";
  if (legacyNotes.trim()) {
    $convertFromMarkdownString(legacyNotes, NOTEPAD_TRANSFORMERS);
  } else {
    root.append($createParagraphNode());
  }
};

const loadDocument = (
  editor: LexicalEditor,
  binding: Binding,
  room: NotepadRoom
) => {
  const { root } = binding;
  if (root._xmlText.length > 0) {
    editor.update(
      () => {
        root.applyChildrenYjsDelta(binding, root._xmlText.toDelta());
        root.syncChildrenFromYjs(binding);
      },
      {
        discrete: true,
        skipTransforms: true,
        tag: [COLLABORATION_TAG, SKIP_SCROLL_INTO_VIEW_TAG],
      }
    );
    return;
  }

  binding.isBootstrapping = true;
  editor.update(() => $bootstrap(room), {
    discrete: true,
    onUpdate: () => {
      binding.isBootstrapping = false;
    },
    tag: HISTORY_MERGE_TAG,
  });
  queueMicrotask(() => {
    binding.isBootstrapping = false;
  });
};

const restartAnimations = (element: HTMLElement) => {
  for (const animation of element.getAnimations()) {
    animation.cancel();
    animation.play();
  }
};

// Labels read better in the user's contrast color, and show again whenever
// the caret moves
const styleCursorLabels = (binding: Binding) => {
  for (const cursor of binding.cursors.values()) {
    const { selection } = cursor;
    if (!selection) {
      continue;
    }
    const { caret, name } = selection;
    name.style.color = getTextColor(cursor.color);
    name.dataset.below = String(caret.offsetTop < LABEL_HEIGHT);
    const position = `${caret.style.top},${caret.style.left}`;
    if (caret.dataset.position !== position) {
      caret.dataset.position = position;
      restartAnimations(name);
    }
  }
};

// Each user undoes only their own edits
const registerUndoManager = (
  editor: LexicalEditor,
  undoManager: UndoManager
) => {
  const updateUndoRedoStates = () => {
    editor.dispatchCommand(CAN_UNDO_COMMAND, undoManager.undoStack.length > 0);
    editor.dispatchCommand(CAN_REDO_COMMAND, undoManager.redoStack.length > 0);
  };
  undoManager.on("stack-item-added", updateUndoRedoStates);
  undoManager.on("stack-item-popped", updateUndoRedoStates);
  undoManager.on("stack-cleared", updateUndoRedoStates);

  const unregister = mergeRegister(
    editor.registerCommand(
      UNDO_COMMAND,
      () => {
        undoManager.undo();
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      REDO_COMMAND,
      () => {
        undoManager.redo();
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    )
  );

  return () => {
    unregister();
    undoManager.off("stack-item-added", updateUndoRedoStates);
    undoManager.off("stack-item-popped", updateUndoRedoStates);
    undoManager.off("stack-cleared", updateUndoRedoStates);
  };
};

interface CollaborationPluginProps {
  cursorsContainerRef: RefObject<HTMLElement | null>;
}

/**
 * Binds `editor` to the room's notepad until the returned cleanup runs.
 */
export const registerCollaboration = (
  editor: LexicalEditor,
  room: NotepadRoom,
  cursorsContainer: HTMLElement | null
) => {
  const provider = createProvider(room);
  clearCollabNodes(room.doc.get(ROOM_DOC.notes, XmlText));
  const binding = createYjsBinding({
    doc: room.doc,
    docMap: new Map([[ROOM_DOC.notes, room.doc]]),
    editor,
    excludedProperties: PER_USER_PROPERTIES,
    id: ROOM_DOC.notes,
    rootName: ROOM_DOC.notes,
  });
  binding.cursorsContainer = cursorsContainer;

  const sharedRoot = binding.root.getSharedType();
  const undoManager = createUndoManager(binding, sharedRoot);
  const name = room.getPresence().get(room.clientId)?.user.name ?? "";
  const color = getBackgroundColor(name);

  const syncCursors = () => {
    syncCursorPositions(binding, provider, { selectionHighlight: true });
    styleCursorLabels(binding);
  };

  const onYjsChanges = (
    events: Parameters<typeof syncYjsChangesToLexical>[2],
    transaction: { origin: unknown }
  ) => {
    if (transaction.origin !== binding) {
      syncYjsChangesToLexical(
        binding,
        provider,
        events,
        transaction.origin instanceof UndoManager,
        syncCursors
      );
    }
  };

  provider.awareness.setLocalState({
    anchorPos: null,
    awarenessData: {},
    color,
    focusing: false,
    focusPos: null,
    name,
  });

  const rootElement = editor.getRootElement();
  const resizeObserver = rootElement ? new ResizeObserver(syncCursors) : null;
  if (rootElement) {
    resizeObserver?.observe(rootElement);
  }
  provider.awareness.on("update", syncCursors);
  sharedRoot.observeDeep(onYjsChanges);

  const unregister = mergeRegister(
    registerUndoManager(editor, undoManager),
    editor.registerUpdateListener(
      ({
        dirtyElements,
        dirtyLeaves,
        editorState,
        normalizedNodes,
        prevEditorState,
        tags,
      }) => {
        if (!tags.has(SKIP_COLLAB_TAG)) {
          syncLexicalUpdateToYjs(
            binding,
            provider,
            prevEditorState,
            editorState,
            dirtyElements,
            dirtyLeaves,
            normalizedNodes,
            tags
          );
        }
      }
    ),
    editor.registerCommand(
      FOCUS_COMMAND,
      () => {
        setLocalStateFocus(provider, name, color, true, {});
        return false;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      BLUR_COMMAND,
      () => {
        setLocalStateFocus(provider, name, color, false, {});
        return false;
      },
      COMMAND_PRIORITY_EDITOR
    )
  );

  // After the update listener, so a bootstrap write reaches Yjs
  loadDocument(editor, binding, room);

  return () => {
    unregister();
    resizeObserver?.disconnect();
    provider.awareness.off("update", syncCursors);
    sharedRoot.unobserveDeep(onYjsChanges);
    undoManager.destroy();
    binding.root.destroy(binding);
    provider.awareness.setLocalState(null);
  };
};

const CollaborationPlugin = ({
  cursorsContainerRef,
}: CollaborationPluginProps) => {
  const [editor] = useLexicalComposerContext();
  const room = useRoom();

  useEffect(
    () => registerCollaboration(editor, room, cursorsContainerRef.current),
    [cursorsContainerRef, editor, room]
  );

  return null;
};

export { CollaborationPlugin };
