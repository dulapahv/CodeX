import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

import { Tree, type TreeDataItem } from '@/components/tree';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const SaveToGithubDialog = forwardRef((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = useCallback(() => setIsOpen(true), []);
  const closeDialog = useCallback(() => setIsOpen(false), []);

  useImperativeHandle(ref, () => ({
    openDialog,
    closeDialog,
  }));

  // fetch /api/oauth/repos/github
  // const fetchGithubRepos = async () => {
  //   try {
  //     const response = await fetch('/api/oauth/repos/github');
  //     const data = await response.json();
  //     console.log(data);
  //   } catch (error) {
  //     console.error('Error fetching GitHub repositories:', error);
  //   }
  // };

  // fetchGithubRepos();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle>Save to GitHub</DialogTitle>
          <DialogDescription>
            Save your code to GitHub to keep it safe and secure.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button asChild>
            <DialogClose>Close</DialogClose>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

SaveToGithubDialog.displayName = 'SaveToGithubDialog';

export { SaveToGithubDialog };
