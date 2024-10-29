import { LoaderCircle } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export const LoadingCard = () => (
  <Card className="w-[480px] animate-fade-in">
    <CardHeader>
      <CardTitle className="flex items-center justify-center text-base font-normal">
        <LoaderCircle className="mr-2 size-5 animate-spin" />
        You will be redirected to the room shortly.
      </CardTitle>
    </CardHeader>
  </Card>
);
