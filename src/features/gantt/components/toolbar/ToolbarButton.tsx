import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../internal/ui'; // các ui của radix ui
import { Button } from '../internal/ui'; // button của radix ui
import { cn } from '../internal/utils'; // hàm combine class name

interface ToolbarButtonProps {
    icon: React.ReactNode; // icon của button
    label: string; // label của button                
    onClick: () => void; // hàm click của buttons
    disabled?: boolean; // kiểm tra xem button có disabled không
    variant?: 'default' | 'destructive';  // kiểu button
    active?: boolean;  // kiểm tra xem button có active không
  }
  
const ToolbarButton = ({
    icon,
    label,
    onClick,
    disabled,
    variant,
    active,
  }: ToolbarButtonProps) => {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 w-7 p-0',
                variant === 'destructive' &&
                  'text-destructive hover:text-destructive hover:bg-destructive/10',
                active && 'bg-secondary'
              )}
              onClick={onClick}
              disabled={disabled}
            >
              {icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
export default ToolbarButton;