import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import type { CommitForm } from '../types/github';
import { commitSchema } from '../validator';

export const useCommitForm = () => {
  return useForm<CommitForm>({
    resolver: zodResolver(commitSchema),
    defaultValues: {
      fileName: '',
      commitSummary: '',
      extendedDescription: '',
    },
  });
};
