/**
 * What the shared terminal shows before anything has run.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

const EmptyState = () => (
  <div className="text-muted-foreground space-y-1 text-xs">
    <p>Output from code runs appears here for everyone in the room.</p>
    <p>Pick a language in the status bar, then click Run Code.</p>
  </div>
);

export { EmptyState };
