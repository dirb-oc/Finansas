import * as Select from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";

import "./CustomSelect.css";

export default function CustomSelect({ value, onChange, options, placeholder = "Seleccionar" }) {
    return (
        <Select.Root value={value} onValueChange={onChange}>

            <Select.Trigger className="select-trigger">
                <Select.Value placeholder={placeholder} />

                <Select.Icon>
                    <ChevronDown size={18} />
                </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
                <Select.Content
                    className="select-content"
                    position="popper"
                    avoidCollisions={true}
                >
                    <Select.Viewport>

                        {options.map((option) => (
                            <Select.Item
                                key={option.id}
                                value={String(option.id)}
                                className="select-item"
                            >
                                <Select.ItemText>
                                    {option.nombre}
                                </Select.ItemText>

                                <Select.ItemIndicator>
                                    <Check size={16} />
                                </Select.ItemIndicator>
                            </Select.Item>
                        ))}

                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>

        </Select.Root>
    );
}