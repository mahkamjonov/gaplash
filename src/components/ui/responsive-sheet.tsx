"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { t } from "@/i18n";

type ResponsiveSheetProps = {
  title: string;
  description?: string;
  /** The element that opens the sheet. Must accept a ref, such as a Button. */
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

/** A bottom sheet below 768px and a centered dialog from 768px up. */
export function ResponsiveSheet({ title, description, trigger, open, onOpenChange, children }: ResponsiveSheetProps) {
  const isDialog = useMediaQuery("(min-width: 48rem)");

  const Root = isDialog ? Dialog : Drawer;
  const Trigger = isDialog ? DialogTrigger : DrawerTrigger;
  const Content = isDialog ? DialogContent : DrawerContent;
  const Title = isDialog ? DialogTitle : DrawerTitle;
  const Description = isDialog ? DialogDescription : DrawerDescription;
  const Close = isDialog ? DialogClose : DrawerClose;

  return (
    <Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Trigger asChild>{trigger}</Trigger> : null}
      <Content {...(description ? {} : { "aria-describedby": undefined })}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <Title>{title}</Title>
            {description ? <Description>{description}</Description> : null}
          </div>
          <Close asChild>
            <Button variant="ghost" size="icon-sm" aria-label={t.common.close} className="-mt-1 -mr-2">
              <X />
            </Button>
          </Close>
        </div>
        {children}
      </Content>
    </Root>
  );
}
