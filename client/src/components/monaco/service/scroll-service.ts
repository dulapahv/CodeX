import { MutableRefObject } from 'react';
import type * as monaco from 'monaco-editor';

import type { Scroll } from '@common/types/scroll';

import { storage } from '@/lib/services/storage';

export const updateScroll = (
  editorInstanceRef: MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>,
  userID: string,
  scroll: Scroll,
): void => {
  const editor = editorInstanceRef.current;
  if (!editor) return;

  if (storage.getFollowUserId() !== userID) return; // Prevent duplicate scroll events

  editor.setScrollPosition({ scrollLeft: scroll[0], scrollTop: scroll[1] });
};
