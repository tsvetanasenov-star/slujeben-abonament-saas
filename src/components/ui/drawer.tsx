"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  ({ className, open, onOpenChange, children, ...props }, ref) => {
    if (!open) return null;
    return (
      <div
        ref={ref}
        className={cn("fixed inset-0 z-50 flex", className)}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation();
          onOpenChange(false);
        }}
        {...props}
      >
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 flex-col bg-background border-l border-input shadow-lg">
          {children}
        </div>
      </div>
    );
  }
);
Drawer.displayName = "Drawer";

const DrawerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1", className)} {...props} />
));
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
);
DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
);
DrawerDescription.displayName = "DrawerDescription";

export {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
};