/**
 * Name field shared by the create, join and invited forms.
 * Features:
 * - Name length validation
 * - Dice button that rolls a random name
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Field } from "@base-ui/react/field";
import {
  DiceFiveIcon,
  DiceFourIcon,
  DiceOneIcon,
  DiceSixIcon,
  DiceThreeIcon,
  DiceTwoIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NAME_MAX_LENGTH } from "@/lib/constants";

import { generateRandomName } from "../random-name";

const DICE_FACES = [
  DiceOneIcon,
  DiceTwoIcon,
  DiceThreeIcon,
  DiceFourIcon,
  DiceFiveIcon,
  DiceSixIcon,
] as const;

const FULL_TURN_DEGREES = 360;

interface NameFieldProps {
  autoFocus?: boolean;
  disabled: boolean;
  labelClassName?: string;
}

export const NameField = ({
  autoFocus,
  disabled,
  labelClassName = "text-sm sm:text-base",
}: NameFieldProps) => {
  const [name, setName] = useState("");
  const [rolls, setRolls] = useState(0);
  const [face, setFace] = useState(DICE_FACES.length - 2);

  const rollName = () => {
    setName((current) => generateRandomName(current));
    setRolls((count) => count + 1);
    setFace(Math.floor(Math.random() * DICE_FACES.length));
  };

  const DiceIcon = DICE_FACES[face] ?? DiceFiveIcon;

  return (
    <Field.Root
      className="flex flex-col space-y-1.5"
      name="name"
      validate={(value) =>
        String(value).trim().length > NAME_MAX_LENGTH
          ? `Name must not exceed ${NAME_MAX_LENGTH} characters`
          : null
      }
    >
      {/* biome-ignore lint/a11y/noLabelWithoutControl: Base UI ties Field.Label to the field's control */}
      <Field.Label className={labelClassName}>Name</Field.Label>
      <InputGroup>
        <InputGroupInput
          autoComplete="name"
          autoFocus={autoFocus}
          className="text-sm sm:text-base"
          disabled={disabled}
          maxLength={NAME_MAX_LENGTH}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          required
          value={name}
        />
        <InputGroupAddon align="inline-end">
          <Tooltip>
            <TooltipTrigger
              render={
                <InputGroupButton
                  aria-label="Roll a random name"
                  disabled={disabled}
                  onClick={rollName}
                  size="icon-xs"
                >
                  <DiceIcon
                    aria-hidden="true"
                    className="size-4 motion-safe:transition-transform motion-safe:duration-300"
                    style={{ rotate: `${rolls * FULL_TURN_DEGREES}deg` }}
                  />
                </InputGroupButton>
              }
            />
            <TooltipContent role="tooltip">
              <p>Roll a random name</p>
            </TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
      <Field.Error className="text-sm text-red-500" match="valueMissing">
        Name is required
      </Field.Error>
      <Field.Error className="text-sm text-red-500" match="customError" />
    </Field.Root>
  );
};
