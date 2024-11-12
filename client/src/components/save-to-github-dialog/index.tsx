import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useMediaQuery } from '@/hooks/use-media-query';
import { RepoBrowser } from '@/components/repo-browser';
import {
  itemType,
  type ExtendedTreeDataItem,
} from '@/components/repo-browser/types/tree';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';

import { useCommitForm } from './hooks/useCommitForm';
import { onSubmit } from './utils/on-submit';

export interface SaveToGithubDialogRef {
  openDialog: () => void;
  closeDialog: () => void;
}

export const SaveToGithubDialog = forwardRef<SaveToGithubDialogRef>(
  (props, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedItem, setSelectedItem] =
      useState<ExtendedTreeDataItem | null>(null);
    const [repo, setRepo] = useState('');
    const [branch, setBranch] = useState('');

    const isDesktop = useMediaQuery('(min-width: 768px)');
    const {
      register,
      handleSubmit,
      setValue,
      clearErrors,
      reset,
      formState: { errors, isSubmitting },
    } = useCommitForm();

    const openDialog = useCallback(() => setIsOpen(true), []);
    const closeDialog = useCallback(() => {
      if (!isSubmitting) {
        setIsOpen(false);
        setSelectedItem(null);
        reset();
      }
    }, [isSubmitting, reset]);

    useImperativeHandle(ref, () => ({
      openDialog,
      closeDialog,
    }));

    useEffect(() => {
      const fileName =
        selectedItem?.type === itemType.FILE ? selectedItem.name : '';
      if (fileName) {
        setValue('fileName', fileName);
        clearErrors('fileName');
      }
    }, [selectedItem, setValue, clearErrors]);

    const onError = () => {
      toast.error('Please check the information and try again.');
    };

    const formContent = (
      <>
        <div className="mx-4 min-h-10 flex-1 rounded-md border md:mx-0 md:mb-0">
          <RepoBrowser
            setSelectedItem={setSelectedItem}
            setRepo={setRepo}
            setBranch={setBranch}
          />
        </div>

        <div className="mx-4 flex-shrink-0 space-y-3 md:mx-0">
          <Input
            placeholder="Filename (e.g., hello.js)"
            disabled={isSubmitting}
            {...register('fileName')}
          />
          {errors.fileName && (
            <p className="text-sm text-red-500">{errors.fileName.message}</p>
          )}
          <Input
            placeholder="Commit summary"
            disabled={isSubmitting}
            {...register('commitSummary')}
          />
          {errors.commitSummary && (
            <p className="text-sm text-red-500">
              {errors.commitSummary.message}
            </p>
          )}
        </div>
      </>
    );

    if (isDesktop) {
      return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogContent className="flex h-[90vh] flex-col gap-4 sm:max-w-2xl">
            <AlertDialogHeader className="flex-shrink-0 text-left">
              <AlertDialogTitle>Save to GitHub</AlertDialogTitle>
              <AlertDialogDescription>
                Select a repository, branch, and folder to save your code.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {formContent}
            <form
              onSubmit={handleSubmit(
                (data) =>
                  onSubmit(data, selectedItem, repo, branch, closeDialog),
                onError,
              )}
            >
              <AlertDialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeDialog}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen} dismissible={false}>
        <DrawerContent className="first:[&>div]:mt-0 first:[&>div]:bg-transparent">
          <div className="flex h-[90vh] flex-col">
            <DrawerHeader className="flex-shrink-0 text-left">
              <DrawerTitle>Save to GitHub</DrawerTitle>
              <DrawerDescription>
                Select a repository, branch, and folder to save your code.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-4">
              {formContent}
            </div>
            <form
              onSubmit={handleSubmit(
                (data) =>
                  onSubmit(data, selectedItem, repo, branch, closeDialog),
                onError,
              )}
              className="flex-shrink-0"
            >
              <DrawerFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
                <DrawerClose asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={closeDialog}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </div>
        </DrawerContent>
      </Drawer>
    );
  },
);

SaveToGithubDialog.displayName = 'SaveToGithubDialog';

export default SaveToGithubDialog;
