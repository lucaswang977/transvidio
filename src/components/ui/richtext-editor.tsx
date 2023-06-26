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

export interface RichtextEditorProps extends EditorProps {
  height?: string,
  width?: string,
}

function RichtextEditor({ height, width, ...props }: RichtextEditorProps) {
  return (
    <EditorProvider>
      <Editor
        containerProps={{ style: { height: height, width: width, overflow: "scroll" } }}
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

export { RichtextEditor }
