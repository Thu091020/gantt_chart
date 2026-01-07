import { Button, Popover, PopoverContent, PopoverTrigger, Checkbox, Label } from '../internal/ui';
import { Settings2 } from 'lucide-react';
import type { TaskBarLabels } from '../../types/gantt.types';

interface ToolbarViewSettingsProps {
  labels: TaskBarLabels;
  onChange: (labels: TaskBarLabels) => void;
}

export function ToolbarViewSettings({ labels, onChange }: ToolbarViewSettingsProps) {
  const handleChange = (key: keyof TaskBarLabels, checked: boolean) => {
    onChange({ ...labels, [key]: checked });
  };

  const items = [
    { key: 'showName', label: 'Tên task' },
    { key: 'showAssignees', label: 'Người thực hiện' },
    { key: 'showDuration', label: 'Duration' },
    { key: 'showDates', label: 'Ngày bắt đầu - kết thúc' },
  ] as const;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs">
          <Settings2 className="w-3.5 h-3.5" />
          Hiển thị
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">Hiển thị trên task bar</div>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.key} className="flex items-center space-x-2">
                <Checkbox
                  id={item.key}
                  checked={labels[item.key]}
                  onCheckedChange={(c) => handleChange(item.key, !!c)}
                />
                <Label htmlFor={item.key} className="text-xs cursor-pointer">
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}