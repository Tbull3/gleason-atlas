import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-background/70", className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 z-50 flex w-[min(92vw,32rem)] max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg sm:top-1/2 sm:-translate-y-1/2",
        className,
      )}
      {...props}
    >
      <DialogPrimitive.Close
        aria-label="Close"
        className="absolute top-2 right-2 z-10 inline-flex size-11 items-center justify-center rounded-full bg-surface text-foreground ring-1 ring-border transition-[background-color,color] duration-150 hover:bg-surface-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
      >
        <X className="size-5" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
      <div className="overflow-y-auto overscroll-contain p-6 pr-14">
        {children}
      </div>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mb-4 flex flex-col gap-1.5 pr-6", className)}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "font-display text-xl font-medium tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
};
