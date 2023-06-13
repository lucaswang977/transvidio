import * as React from "react"

import {
  BtnUndo,
  BtnRedo,
  Separator,
  BtnBold,
  BtnItalic,
  BtnUnderline,
  BtnStrikeThrough,
  BtnNumberedList,
  BtnBulletList,
  BtnLink,
  BtnClearFormatting,
  Editor,
  EditorProvider,
  type EditorProps,
  Toolbar
} from 'react-simple-wysiwyg';

import { cn } from "~/utils/helper"

export interface RichtextEditorProps extends EditorProps { }

const RichtextEditor = React.forwardRef<typeof Editor, RichtextEditorProps>(
  ({ className, ...props }) => {
    return (
      <EditorProvider>
        <Editor
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}>
          <Toolbar>
            <BtnUndo />
            <BtnRedo />
            <Separator />
            <BtnBold />
            <BtnItalic />
            <BtnUnderline />
            <BtnStrikeThrough />
            <Separator />
            <BtnNumberedList />
            <BtnBulletList />
            <Separator />
            <BtnLink />
            <BtnClearFormatting />
          </Toolbar>
        </Editor>
      </EditorProvider>
    )
  }
)
RichtextEditor.displayName = "RichtextEditor"

export { RichtextEditor }
