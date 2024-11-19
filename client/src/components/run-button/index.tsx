import { Button } from '@/components/ui/button';

export const RunButton = () => {
  return (
    <Button
      onClick={() => {
        console.log('Run code');
      }}
    >
      Run
    </Button>
  );
};
