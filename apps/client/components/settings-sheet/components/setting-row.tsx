/**
 * One editor setting with its description, the control that fits its type
 * and a reset button once it's been changed. Typed values apply when the
 * field loses focus or Enter is pressed, so half-typed numbers don't.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { type KeyboardEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { SettingDefinition } from "../catalog";

const BACKTICK = "`";

// Text between backticks in Monaco's descriptions is code
const Description = ({ id, text }: { id: string; text: string }) => {
  let offset = 0;
  const parts = text.split(BACKTICK).map((part, index) => {
    const segment = { code: index % 2 === 1, offset, text: part };
    offset += part.length + 1;
    return segment;
  });

  return (
    <p className="text-muted-foreground text-xs leading-relaxed" id={id}>
      {parts.map((part) =>
        part.code ? (
          <code
            className="bg-foreground/5 px-1 font-mono text-[11px]"
            key={part.offset}
          >
            {part.text}
          </code>
        ) : (
          <span key={part.offset}>{part.text}</span>
        )
      )}
    </p>
  );
};

const clampNumber = (setting: SettingDefinition, value: number) => {
  const rounded = setting.integer ? Math.round(value) : value;
  return Math.min(
    Math.max(rounded, setting.minimum ?? Number.NEGATIVE_INFINITY),
    setting.maximum ?? Number.POSITIVE_INFINITY
  );
};

interface DraftInputProps {
  describedBy: string | undefined;
  id: string;
  onCommit: (value: string) => void;
  setting: SettingDefinition;
  value: unknown;
}

const DraftInput = ({
  describedBy,
  id,
  onCommit,
  setting,
  value,
}: DraftInputProps) => {
  const [draft, setDraft] = useState<string | null>(null);
  const isNumber = setting.type === "number";

  const commit = () => {
    if (draft !== null) {
      onCommit(draft);
    }
    setDraft(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      commit();
    } else if (event.key === "Escape") {
      event.stopPropagation();
      setDraft(null);
    }
  };

  return (
    <Input
      aria-describedby={describedBy}
      className={isNumber ? "w-28" : "w-full"}
      id={id}
      max={setting.maximum}
      min={setting.minimum}
      onBlur={commit}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={handleKeyDown}
      step={isNumber && !setting.integer ? "any" : undefined}
      type={isNumber ? "number" : "text"}
      value={draft ?? String(value ?? "")}
    />
  );
};

interface SettingRowProps {
  isModified: boolean;
  onChange: (value: unknown) => void;
  onReset: () => void;
  setting: SettingDefinition;
  value: unknown;
}

export const SettingRow = ({
  isModified,
  onChange,
  onReset,
  setting,
  value,
}: SettingRowProps) => {
  const id = useId();
  const descriptionId = setting.description ? `${id}-description` : undefined;
  const isInline = setting.type === "boolean";

  const control = (() => {
    switch (setting.type) {
      case "boolean":
        return (
          <Switch
            aria-describedby={descriptionId}
            checked={Boolean(value)}
            id={id}
            onCheckedChange={onChange}
          />
        );
      case "enum":
        return (
          <Select
            onValueChange={(selected) =>
              onChange(
                setting.options?.find((option) => String(option) === selected)
              )
            }
            value={value === undefined ? null : String(value)}
          >
            <SelectTrigger
              aria-describedby={descriptionId}
              className="w-full sm:w-56"
              id={id}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-w-80">
              {setting.options?.map((option, index) => (
                <SelectItem key={String(option)} value={String(option)}>
                  <span className="flex flex-col">
                    <span>{String(option)}</span>
                    {setting.enumDescriptions?.[index] && (
                      <span className="text-muted-foreground text-[11px] leading-snug whitespace-normal">
                        {setting.enumDescriptions[index]}
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "number":
        return (
          <DraftInput
            describedBy={descriptionId}
            id={id}
            onCommit={(text) => {
              const parsed = Number(text);
              if (text.trim() !== "" && Number.isFinite(parsed)) {
                onChange(clampNumber(setting, parsed));
              }
            }}
            setting={setting}
            value={value}
          />
        );
      default:
        return (
          <DraftInput
            describedBy={descriptionId}
            id={id}
            onCommit={onChange}
            setting={setting}
            value={value}
          />
        );
    }
  })();

  return (
    <div
      className={cn(
        "flex gap-3 border-l-2 py-3 pl-3",
        isModified ? "border-primary" : "border-transparent",
        isInline ? "items-start justify-between" : "flex-col"
      )}
    >
      <div className="grid min-w-0 gap-1">
        <div className="flex items-center gap-1">
          <Label className="text-sm font-medium" htmlFor={id}>
            {setting.title}
          </Label>
          {isModified && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label={`Reset ${setting.title} to default`}
                    className="size-6"
                    onClick={onReset}
                    size="icon-xs"
                    variant="ghost"
                  >
                    <ArrowCounterClockwiseIcon />
                  </Button>
                }
              />
              <TooltipContent>Reset to default</TooltipContent>
            </Tooltip>
          )}
        </div>
        {descriptionId && (
          <Description id={descriptionId} text={setting.description} />
        )}
      </div>
      <div className={cn(isInline && "shrink-0 pt-0.5")}>{control}</div>
    </div>
  );
};
