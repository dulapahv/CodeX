import type { Dispatch, SetStateAction } from 'react';

import type { CopyStatus } from './types';

export const copy = (
  text: string,
  key: keyof CopyStatus,
  setCopyStatus: Dispatch<SetStateAction<CopyStatus>>,
) => {
  navigator.clipboard.writeText(text);
  setCopyStatus((prevState) => ({ ...prevState, [key]: true }));
  setTimeout(() => {
    setCopyStatus((prevState) => ({ ...prevState, [key]: false }));
  }, 500);
};
