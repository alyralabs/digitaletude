'use client';
import { cn } from '@/lib/utils';
import type { LabelProps } from '@primereact/types/primitive/label';
import { Label as PRLabel } from 'primereact/label';

function Label({ className, ...props }: LabelProps) {
    return (
        <PRLabel
            className={cn('flex items-center select-none gap-2 text-sm leading-none font-medium group-data-disabled:opacity-50 peer-disabled:opacity-50 group-data-disabled:pointer-events-none peer-disabled:cursor-not-allowed', className)}
            {...props}
        />
    );
}

export { Label };
