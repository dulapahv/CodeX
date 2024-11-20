import { SITE_NAME } from '@/lib/constants';

const WelcomeMsg = () => (
  <div className="mb-4 space-y-2">
    <div className="text-green-500">
      ✨ Welcome to {SITE_NAME}
      {'\n'}
      ------------------------------------
    </div>
    <div>
      This is a shared terminal. All participants can view the output here.
      {'\n'}
      {'\n'}
      Type your code in the editor and click run.
      {'\n'}
      Select language via the dropdown in the bottom right corner.
    </div>
  </div>
);

export { WelcomeMsg };
