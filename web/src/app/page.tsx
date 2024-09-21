import { Ide } from "@/components/ide";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main>
      <Button>Hello World</Button>
      <ThemeSwitch />
      <Ide />
    </main>
  );
}
